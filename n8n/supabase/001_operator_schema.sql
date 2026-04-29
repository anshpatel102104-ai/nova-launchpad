-- ════════════════════════════════════════════════════════════════════
-- Nova OPS · AI Operator schema
-- Generated for the 10 STG n8n workflows in /n8n/workflows
-- Run order: extensions → tables → indexes → RLS → seeds
-- ════════════════════════════════════════════════════════════════════
-- Target project: hardcoded as ipidfqwlszuhjgjygbvx in workflows.
-- If you choose a different project, also update every n8n HTTP node URL.
-- ════════════════════════════════════════════════════════════════════

-- ── Extensions ──────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ════════════════════════════════════════════════════════════════════
-- 1. operator_prompts  (hot-swappable Claude system prompts)
--    Used by: 10-prompt-swap (write), all Claude workflows (read).
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.operator_prompts (
  id                  uuid primary key default uuid_generate_v4(),
  component           text not null unique,
  system_prompt       text not null,
  version             text not null default 'v1',
  is_known_component  boolean default true,
  updated_at          timestamptz not null default now(),
  created_at          timestamptz not null default now()
);
create index if not exists idx_operator_prompts_component on public.operator_prompts(component);

-- ════════════════════════════════════════════════════════════════════
-- 2. operator_memory  (semantic recall for past sessions)
--    Used by: 05-memory-write, 06-memory-read.
-- ════════════════════════════════════════════════════════════════════
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
create index if not exists idx_operator_memory_user      on public.operator_memory(user_id, created_at desc);
create index if not exists idx_operator_memory_session   on public.operator_memory(session_id);
create index if not exists idx_operator_memory_pruned    on public.operator_memory(pruned);

-- ════════════════════════════════════════════════════════════════════
-- 3. operator_sessions  (active session state + clarification rounds)
--    Used by: main router, confidence fallback handler.
-- ════════════════════════════════════════════════════════════════════
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

-- ════════════════════════════════════════════════════════════════════
-- 4. tool_outputs  (formatted Claude output per tool run)
--    Used by: 04-response-formatter.
-- ════════════════════════════════════════════════════════════════════
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

-- ════════════════════════════════════════════════════════════════════
-- 5. notifications  (in-app notifications for users)
--    Used by: 04-response-formatter (insert).
-- ════════════════════════════════════════════════════════════════════
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
create index if not exists idx_notifications_user on public.notifications(user_id, created_at desc);
create index if not exists idx_notifications_unread on public.notifications(user_id, read) where read = false;

-- ════════════════════════════════════════════════════════════════════
-- 6. support_tickets  (escalations to human admin)
--    Used by: 08-operator-escalation.
-- ════════════════════════════════════════════════════════════════════
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

-- ════════════════════════════════════════════════════════════════════
-- 7. health_checks  (operator endpoint uptime log)
--    Used by: 09-health-check (cron every 15 min).
-- ════════════════════════════════════════════════════════════════════
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

-- ════════════════════════════════════════════════════════════════════
-- 8. n8n_error_log  (catches Error Trigger payloads from every workflow)
--    Used by: every workflow's Error Trigger → HTTP - Notify Error Router.
--    Optional: hook this up if you don't have a separate error router.
-- ════════════════════════════════════════════════════════════════════
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

-- ════════════════════════════════════════════════════════════════════
-- READ-ONLY tables that the workflows EXPECT to already exist on your
-- platform. If you don't already have them, these are minimal scaffolds.
-- ════════════════════════════════════════════════════════════════════

-- 9. ai_operator_config  (per-user operator settings)
create table if not exists public.ai_operator_config (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid unique not null,
  business_context   text,
  default_tone       text default 'professional',
  enabled_tools      text[] default array['lead_gen','copywriting','offer_building']::text[],
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- 10. plan_entitlements  (Free/49/149/299 → tool limits)
create table if not exists public.plan_entitlements (
  id                  uuid primary key default uuid_generate_v4(),
  plan_name           text unique not null,
  monthly_credits     int not null default 0,
  max_seats           int not null default 1,
  enabled_tools       text[] default array[]::text[],
  features            jsonb default '{}'::jsonb,
  created_at          timestamptz not null default now()
);

-- 11. tool_runs  (per-tool usage / credit consumption ledger)
create table if not exists public.tool_runs (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null,
  tool_id      text not null,
  credits_used int not null default 1,
  status       text not null default 'success',
  created_at   timestamptz not null default now()
);
create index if not exists idx_tool_runs_user on public.tool_runs(user_id, created_at desc);

-- 12. profiles  (user profile join target — usually already exists)
create table if not exists public.profiles (
  id           uuid primary key,
  email        text,
  full_name    text,
  display_name text,
  created_at   timestamptz not null default now()
);

-- 13. onboarding_responses  (used by context loader)
create table if not exists public.onboarding_responses (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null unique,
  responses    jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════
-- RLS — service-role bypasses; deny everything else by default.
-- (n8n hits these with the service role; users go through your API.)
-- ════════════════════════════════════════════════════════════════════
do $$
declare t text;
begin
  for t in select unnest(array[
    'operator_prompts','operator_memory','operator_sessions','tool_outputs',
    'notifications','support_tickets','health_checks','n8n_error_log',
    'ai_operator_config','plan_entitlements','tool_runs','profiles',
    'onboarding_responses'
  ])
  loop
    execute format('alter table public.%I enable row level security;', t);
    -- service role always allowed
    execute format($f$
      drop policy if exists service_role_all on public.%I;
      create policy service_role_all on public.%I
        for all to service_role using (true) with check (true);
    $f$, t, t);
  end loop;
end $$;

-- User-readable policies for tables joined to user_id
create policy if not exists own_rows_read on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy if not exists own_rows_read on public.tool_outputs
  for select to authenticated using (user_id = auth.uid());
create policy if not exists own_rows_read on public.operator_memory
  for select to authenticated using (user_id = auth.uid());
create policy if not exists own_rows_read on public.support_tickets
  for select to authenticated using (user_id = auth.uid());
create policy if not exists own_rows_read on public.tool_runs
  for select to authenticated using (user_id = auth.uid());
create policy if not exists own_rows_read on public.ai_operator_config
  for select to authenticated using (user_id = auth.uid());
create policy if not exists own_rows_read on public.profiles
  for select to authenticated using (id = auth.uid());

-- ════════════════════════════════════════════════════════════════════
-- SEED: 22 default Claude system prompts (one per known component)
-- These let the workflows fire on day 1 without needing a manual swap.
-- Update them anytime via POST /webhook/operator-prompt-swap.
-- ════════════════════════════════════════════════════════════════════
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

-- SEED: pricing tiers
insert into public.plan_entitlements (plan_name, monthly_credits, max_seats, enabled_tools) values
  ('free',  50,    1, array['general_question']),
  ('49',    1000,  1, array['lead_gen','copywriting','offer_building','funnel_mapping','general_question']),
  ('149',   5000,  3, array['lead_gen','copywriting','offer_building','funnel_mapping','content_calendar','ad_strategy','email_sequence','seo_brief','competitor_research','general_question']),
  ('299',   20000, 10, array['lead_gen','copywriting','offer_building','funnel_mapping','content_calendar','ad_strategy','email_sequence','seo_brief','competitor_research','social_planning','sales_script','brand_voice','analytics','automation_build','client_reporting','general_question'])
on conflict (plan_name) do nothing;

-- ════════════════════════════════════════════════════════════════════
-- DONE. Verify with:
--   select table_name from information_schema.tables where table_schema='public';
--   select component, version from public.operator_prompts order by component;
-- ════════════════════════════════════════════════════════════════════
