-- ════════════════════════════════════════════════════════════════════
-- Nova OPS · AI Operator schema
-- Tables consumed by the 10 n8n operator workflows and the 6 subagents.
-- Idempotent — safe to re-run.
-- ════════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ────────────────────────────────────────────────────────────────────
-- 1. ai_operator_configs  — per-user AI operator profile
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.ai_operator_configs (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  operator_name            text,
  operator_tone            text,
  primary_niche            text,
  recommended_tools        jsonb default '[]'::jsonb,
  gtm_strategy_summary     text,
  brand_voice_keywords     jsonb default '[]'::jsonb,
  top_3_pain_points        jsonb default '[]'::jsonb,
  source_intake_id         uuid,
  llm_model                text default 'claude-sonnet-4-6',
  llm_prompt_version       text,
  raw_llm_response         jsonb,
  status                   text not null default 'draft' check (status in ('draft','active','archived')),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (user_id)
);
create index if not exists ai_operator_configs_user_id_idx on public.ai_operator_configs(user_id);
create index if not exists ai_operator_configs_status_idx  on public.ai_operator_configs(status);

-- Singular alias view consumed by n8n workflows that query `ai_operator_config`
create or replace view public.ai_operator_config as
  select * from public.ai_operator_configs;
grant select, insert, update, delete on public.ai_operator_config
      to anon, authenticated, service_role;

-- RLS
alter table public.ai_operator_configs enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where policyname='ai_operator_configs_owner_select'
                 and tablename='ai_operator_configs') then
    create policy "ai_operator_configs_owner_select"
      on public.ai_operator_configs for select to authenticated
      using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname='ai_operator_configs_owner_modify'
                 and tablename='ai_operator_configs') then
    create policy "ai_operator_configs_owner_modify"
      on public.ai_operator_configs for all to authenticated
      using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname='service_role_all'
                 and tablename='ai_operator_configs') then
    create policy service_role_all on public.ai_operator_configs
      for all to service_role using (true) with check (true);
  end if;
end $$;

-- updated_at trigger
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

drop trigger if exists trg_ai_operator_configs_touch on public.ai_operator_configs;
create trigger trg_ai_operator_configs_touch
  before update on public.ai_operator_configs
  for each row execute function public.touch_updated_at();

-- ────────────────────────────────────────────────────────────────────
-- 2. operator_memory  — semantic recall for past sessions
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.operator_memory (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null,
  session_id    text,
  memory_type   text not null default 'fact',
  content       text not null,
  tags          text[] default '{}',
  pruned        boolean default false,
  created_at    timestamptz not null default now()
);
create index if not exists idx_operator_memory_user    on public.operator_memory(user_id, created_at desc);
create index if not exists idx_operator_memory_session on public.operator_memory(session_id);
create index if not exists idx_operator_memory_pruned  on public.operator_memory(pruned);

-- ────────────────────────────────────────────────────────────────────
-- 3. operator_sessions  — active session state + clarification rounds
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.operator_sessions (
  id                   uuid primary key default uuid_generate_v4(),
  session_id           text unique not null,
  user_id              uuid,
  message              text,
  type                 text,
  last_confidence      numeric,
  top_intents          jsonb,
  clarification_text   text,
  clarification_sent   boolean default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists idx_operator_sessions_user on public.operator_sessions(user_id);

-- ────────────────────────────────────────────────────────────────────
-- 4. tool_outputs  — formatted Claude output per tool run
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.tool_outputs (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid not null,
  session_id         text,
  tool_id            text not null,
  output_type        text not null default 'text',
  raw_output         text,
  formatted_output   text,
  read               boolean default false,
  created_at         timestamptz not null default now()
);
create index if not exists idx_tool_outputs_user    on public.tool_outputs(user_id, created_at desc);
create index if not exists idx_tool_outputs_session on public.tool_outputs(session_id);
create index if not exists idx_tool_outputs_tool    on public.tool_outputs(tool_id);

-- ────────────────────────────────────────────────────────────────────
-- 5. notifications  — in-app notifications
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null,
  session_id   text,
  type         text default 'tool_output',
  tool_id      text,
  message      text,
  read         boolean default false,
  created_at   timestamptz not null default now()
);
create index if not exists idx_notifications_user   on public.notifications(user_id, created_at desc);
create index if not exists idx_notifications_unread on public.notifications(user_id, read) where read = false;

-- ────────────────────────────────────────────────────────────────────
-- 6. support_tickets  — escalations to human admin
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.support_tickets (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null,
  session_id      text,
  issue_summary   text not null,
  status          text not null default 'open',
  created_at      timestamptz not null default now()
);
create index if not exists idx_support_tickets_user   on public.support_tickets(user_id, created_at desc);
create index if not exists idx_support_tickets_status on public.support_tickets(status);

-- ────────────────────────────────────────────────────────────────────
-- 7. health_checks  — operator endpoint uptime log (15-min cron)
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.health_checks (
  id                 uuid primary key default uuid_generate_v4(),
  endpoint_name      text not null,
  status             text not null,
  status_code        int,
  response_time_ms   int,
  checked_at         timestamptz not null default now()
);
create index if not exists idx_health_checks_endpoint on public.health_checks(endpoint_name, checked_at desc);
create index if not exists idx_health_checks_status   on public.health_checks(status);

-- ────────────────────────────────────────────────────────────────────
-- 8. n8n_error_log  — central Error Trigger sink for all 10 workflows
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.n8n_error_log (
  id              uuid primary key default uuid_generate_v4(),
  workflow_name   text not null,
  error_message   text,
  error_node      text,
  execution_id    text,
  occurred_at     timestamptz not null default now()
);
create index if not exists idx_n8n_error_log_time on public.n8n_error_log(occurred_at desc);
create index if not exists idx_n8n_error_log_wf   on public.n8n_error_log(workflow_name);

-- ────────────────────────────────────────────────────────────────────
-- RLS — service_role full access; user-readable where user_id present
-- ────────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  for t in select unnest(array[
    'operator_memory','operator_sessions','tool_outputs',
    'notifications','support_tickets','health_checks','n8n_error_log'
  ])
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format($f$
      drop policy if exists service_role_all on public.%I;
      create policy service_role_all on public.%I
        for all to service_role using (true) with check (true);
    $f$, t, t);
  end loop;
end $$;

-- User-readable policies
do $$
begin
  if not exists (select 1 from pg_policies where policyname='own_rows_read'
                 and tablename='notifications') then
    create policy own_rows_read on public.notifications
      for select to authenticated using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where policyname='own_rows_read'
                 and tablename='tool_outputs') then
    create policy own_rows_read on public.tool_outputs
      for select to authenticated using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where policyname='own_rows_read'
                 and tablename='operator_memory') then
    create policy own_rows_read on public.operator_memory
      for select to authenticated using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where policyname='own_rows_read'
                 and tablename='support_tickets') then
    create policy own_rows_read on public.support_tickets
      for select to authenticated using (user_id = auth.uid());
  end if;
end $$;

-- Seed default operator prompts so workflows fire on day 1
insert into public.operator_prompts (component, system_prompt, version) values
  ('main_router',          'You are the Nova OPS AI operator router. Classify the user message intent and return JSON.', 'v1'),
  ('context_loader',       'Summarize the user business context concisely for the next agent.', 'v1'),
  ('tool_dispatcher',      'You dispatch the right Nova OPS tool based on intent. Return JSON.', 'v1'),
  ('memory_read',          'Surface only memories relevant to the current task.', 'v1'),
  ('response_formatter',   'Format the tool output cleanly for end-user display.', 'v1'),
  ('confidence_fallback',  'When confidence is low, ask one short clarifying question, under 20 words.', 'v1'),
  ('lead_gen',             'You are a senior B2B lead generation strategist for AI agency clients.', 'v1'),
  ('copywriting',          'You are a Hormozi-style direct-response copywriter.', 'v1'),
  ('offer_building',       'You construct irresistible offers using the Hormozi Value Equation.', 'v1'),
  ('funnel_mapping',       'You design conversion funnels for service businesses.', 'v1'),
  ('content_calendar',     'You build 30-day content calendars across social platforms.', 'v1'),
  ('ad_strategy',          'You craft Meta and Google ad strategies for local service businesses.', 'v1'),
  ('email_sequence',       'You write nurture and sales email sequences.', 'v1'),
  ('seo_brief',            'You produce SEO content briefs with target keywords and outlines.', 'v1'),
  ('competitor_research',  'You analyse competitors and surface positioning gaps.', 'v1'),
  ('social_planning',      'You create platform-native social content plans.', 'v1'),
  ('sales_script',         'You write NEPQ-style sales scripts for closing service offers.', 'v1'),
  ('brand_voice',          'You define and apply consistent brand voice guidelines.', 'v1'),
  ('analytics',            'You translate marketing analytics into actionable insights.', 'v1'),
  ('automation_build',     'You spec n8n / Make automation builds with Trigger→Action→Output mindset.', 'v1'),
  ('client_reporting',     'You produce concise client performance reports.', 'v1'),
  ('general_question',     'You are the Nova OPS general AI assistant. Answer concisely.', 'v1')
on conflict (component) do nothing;
