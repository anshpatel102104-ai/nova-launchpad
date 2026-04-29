-- ════════════════════════════════════════════════════════════════════
-- Nova OPS · Launchpad Subagent Schema
-- Adds tables and a `users` compatibility view consumed by the 6 new
-- Launchpad subagents (brand_voice, content_blog, social, sales_script,
-- client_reporting, automation_builder).
--
-- Naming convention chosen so the imported subagent JSONs work AS-IS
-- (no template surgery needed). Existing repo conventions preserved:
--   - profiles  → already keyed to auth.users(id)
--   - subscriptions → existing source of truth for plan_tier enum
-- ════════════════════════════════════════════════════════════════════
-- Idempotent. Safe to re-run.
-- ════════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ════════════════════════════════════════════════════════════════════
-- 1. users  — compatibility view for the new subagent SQL.
--    Subagents query: SELECT user_id, plan_tier, email FROM users WHERE user_id = '...'
--    The view exposes plan_tier as the numeric price string ('0','49','149','299')
--    so the gate logic (allowedTiers = ['149','299']) works without code changes.
-- ════════════════════════════════════════════════════════════════════
create or replace view public.users as
select
  p.id                                  as user_id,
  p.email                               as email,
  case
    when pe.price_usd is null then '0'
    else pe.price_usd::text
  end                                   as plan_tier,
  coalesce(s.plan, 'starter')           as plan_tier_enum,
  s.organization_id                     as organization_id,
  p.created_at                          as created_at
from public.profiles p
left join public.subscriptions s
       on s.organization_id in (
         select organization_id
           from public.organization_members
          where user_id = p.id
       )
left join public.plan_entitlements pe
       on pe.plan = s.plan;

grant select on public.users to anon, authenticated, service_role;

comment on view public.users is
  'Subagent-facing user view. plan_tier is numeric price string for gate compatibility.';

-- ════════════════════════════════════════════════════════════════════
-- 2. user_ai_config — per-user brand voice, niche, ICP, value props
--    Used by: brand_voice, content_blog, social, sales_script, client_reporting
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.user_ai_config (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  brand_voice    jsonb       default '{}'::jsonb,
  niche          text,
  tone           text,
  writing_style  text,
  icp            jsonb       default '{}'::jsonb,
  value_props    jsonb       default '[]'::jsonb,
  company_name   text,
  logo_url       text,
  primary_color  text,
  updated_at     timestamptz not null default now(),
  created_at     timestamptz not null default now()
);
create index if not exists idx_user_ai_config_niche on public.user_ai_config(niche);

-- ════════════════════════════════════════════════════════════════════
-- 3. content_outputs — blog, social, sales scripts (multi-tool sink)
--    Used by: content_blog, social, sales_script
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.content_outputs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null,        -- 'blog' | 'social_<platform>' | 'sales_script_<type>'
  payload     jsonb not null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_content_outputs_user_type
  on public.content_outputs(user_id, type, created_at desc);

-- ════════════════════════════════════════════════════════════════════
-- 4. automation_drafts — n8n workflow JSON drafts produced by automation_builder
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.automation_drafts (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  description     text not null,
  workflow_json   jsonb not null,
  status          text not null default 'draft'
                  check (status in ('draft','published','archived','rejected')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_automation_drafts_user
  on public.automation_drafts(user_id, created_at desc);
create index if not exists idx_automation_drafts_status
  on public.automation_drafts(status);

-- ════════════════════════════════════════════════════════════════════
-- 5. client_reports — KPI snapshots + markdown payloads for client reporting
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.client_reports (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  client_id          text,
  period_start       date,
  period_end         date,
  period_label       text,
  markdown_payload   text,
  pdf_url            text,
  kpi_snapshot       jsonb default '{}'::jsonb,
  status             text not null default 'draft'
                     check (status in ('draft','sent','archived')),
  created_at         timestamptz not null default now()
);
create index if not exists idx_client_reports_user
  on public.client_reports(user_id, created_at desc);
create index if not exists idx_client_reports_period
  on public.client_reports(period_start, period_end);

-- ════════════════════════════════════════════════════════════════════
-- 6. client_kpi_metrics — raw metric rows fed by integrations / manual entry.
--    The client_reporting subagent SUMs over this for `leads`, `calls_booked`, etc.
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.client_kpi_metrics (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  client_id       text,
  metric_key      text not null,      -- 'leads' | 'calls_booked' | 'revenue' | ...
  metric_value    numeric not null default 0,
  metric_date     date    not null default current_date,
  source          text,
  created_at      timestamptz not null default now()
);
create index if not exists idx_client_kpi_user_client
  on public.client_kpi_metrics(user_id, client_id, metric_date desc);
create index if not exists idx_client_kpi_metric
  on public.client_kpi_metrics(metric_key, metric_date desc);

-- ════════════════════════════════════════════════════════════════════
-- 7. credit_ledger — append-only credit deduction log
--    Subagents POST to CREDIT_DEDUCTION_WEBHOOK_URL after success;
--    that webhook (in n8n) inserts here. Negative `cost` = top-up.
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.credit_ledger (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  tool         text not null,
  cost         integer not null,
  meta         jsonb default '{}'::jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists idx_credit_ledger_user
  on public.credit_ledger(user_id, created_at desc);
create index if not exists idx_credit_ledger_tool
  on public.credit_ledger(tool);

-- Convenience view: current credit balance per user.
-- Default starting balance per plan = generation_limit * 5 (rough mapping).
create or replace view public.user_credit_balance as
select
  p.id                                                  as user_id,
  coalesce(pe.monthly_generation_limit, 999999) * 5     as starting_credits,
  coalesce(sum(cl.cost), 0)                             as credits_used,
  coalesce(pe.monthly_generation_limit, 999999) * 5
    - coalesce(sum(cl.cost), 0)                         as credits_remaining
from public.profiles p
left join public.subscriptions s
       on s.organization_id in (
         select organization_id from public.organization_members where user_id = p.id
       )
left join public.plan_entitlements pe on pe.plan = s.plan
left join public.credit_ledger cl
       on cl.user_id = p.id
      and cl.created_at >= date_trunc('month', now())
group by p.id, pe.monthly_generation_limit;

grant select on public.user_credit_balance to authenticated, service_role;

-- ════════════════════════════════════════════════════════════════════
-- 8. RLS — service-role full access; authenticated users see own rows.
-- ════════════════════════════════════════════════════════════════════
do $$
declare t text;
begin
  for t in select unnest(array[
    'user_ai_config','content_outputs','automation_drafts',
    'client_reports','client_kpi_metrics','credit_ledger'
  ])
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format($f$
      drop policy if exists service_role_all on public.%I;
      create policy service_role_all on public.%I
        for all to service_role using (true) with check (true);
    $f$, t, t);
    execute format($f$
      drop policy if exists own_rows_read on public.%I;
      create policy own_rows_read on public.%I
        for select to authenticated using (user_id = auth.uid());
    $f$, t, t);
    execute format($f$
      drop policy if exists own_rows_insert on public.%I;
      create policy own_rows_insert on public.%I
        for insert to authenticated with check (user_id = auth.uid());
    $f$, t, t);
    execute format($f$
      drop policy if exists own_rows_update on public.%I;
      create policy own_rows_update on public.%I
        for update to authenticated using (user_id = auth.uid());
    $f$, t, t);
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════════════
-- 9. updated_at trigger reuse (function set_updated_at exists from initial migration)
-- ════════════════════════════════════════════════════════════════════
do $$
begin
  if exists (select 1 from pg_proc where proname = 'set_updated_at') then
    execute 'drop trigger if exists trg_user_ai_config_updated on public.user_ai_config';
    execute 'create trigger trg_user_ai_config_updated before update on public.user_ai_config
             for each row execute function public.set_updated_at()';
    execute 'drop trigger if exists trg_automation_drafts_updated on public.automation_drafts';
    execute 'create trigger trg_automation_drafts_updated before update on public.automation_drafts
             for each row execute function public.set_updated_at()';
  end if;
end $$;
