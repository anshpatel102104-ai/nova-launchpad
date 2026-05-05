-- ================================================================
-- Align enum types to match app codebase + create missing tables
-- ================================================================

-- 0. Drop views that depend on columns being altered
drop view if exists public.users cascade;
drop view if exists public.user_credit_balance cascade;

-- 1. Create missing enum types
create type public.plan_tier      as enum ('starter','launch','operate','scale');
create type public.business_stage as enum ('Idea','Validate','Launch','Operate','Scale');
create type public.app_role       as enum ('user','admin');

-- 2. subscriptions.plan: app_plan → plan_tier
alter table public.subscriptions alter column plan drop default;
alter table public.subscriptions
  alter column plan type public.plan_tier
  using lower(plan::text)::public.plan_tier;
alter table public.subscriptions alter column plan set default 'starter'::public.plan_tier;

-- 3. plan_entitlements.plan: app_plan → plan_tier (lowercase data)
alter table public.plan_entitlements
  alter column plan type public.plan_tier
  using lower(plan::text)::public.plan_tier;

-- 4. organizations.stage: app_stage → business_stage
alter table public.organizations alter column stage drop default;
alter table public.organizations
  alter column stage type public.business_stage
  using stage::text::public.business_stage;
alter table public.organizations alter column stage set default 'Idea'::public.business_stage;

-- 5. Recreate users view (lowercase plan values)
create or replace view public.users as
select
  p.id                              as user_id,
  p.email,
  case s.plan::text
    when 'starter' then '0'
    when 'launch'  then '49'
    when 'operate' then '149'
    when 'scale'   then '299'
    else '0'
  end                               as plan_tier,
  coalesce(s.plan::text, 'starter') as plan_tier_enum,
  s.organization_id,
  p.created_at
from public.profiles p
left join public.subscriptions s
       on s.organization_id in (
         select organization_id from public.organization_members where user_id = p.id
       );
grant select on public.users to anon, authenticated, service_role;

-- 6. Recreate user_credit_balance view
create or replace view public.user_credit_balance as
select
  p.id as user_id,
  coalesce(
    (select pe.limit_value
       from public.plan_entitlements pe
       join public.subscriptions sub on sub.plan = pe.plan
       join public.organization_members om
         on om.organization_id = sub.organization_id and om.user_id = p.id
      where pe.feature_key = 'ai.generations.monthly'
      limit 1),
    999999) * 5                                    as starting_credits,
  coalesce(sum(cl.cost), 0)                        as credits_used,
  coalesce(
    (select pe.limit_value
       from public.plan_entitlements pe
       join public.subscriptions sub on sub.plan = pe.plan
       join public.organization_members om
         on om.organization_id = sub.organization_id and om.user_id = p.id
      where pe.feature_key = 'ai.generations.monthly'
      limit 1),
    999999) * 5 - coalesce(sum(cl.cost), 0)        as credits_remaining
from public.profiles p
left join public.credit_ledger cl
       on cl.user_id = p.id
      and cl.created_at >= date_trunc('month', now())
group by p.id;
grant select on public.user_credit_balance to authenticated, service_role;

-- 7. leads
create table if not exists public.leads (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  email           text,
  phone           text,
  company         text,
  stage           public.lead_stage not null default 'New',
  source          text,
  notes           text,
  value           numeric,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists leads_org_idx on public.leads(organization_id);
alter table public.leads enable row level security;
create policy "leads_org_member" on public.leads for all to authenticated
  using (public.is_org_member(organization_id, auth.uid()))
  with check (public.is_org_member(organization_id, auth.uid()));
grant all on public.leads to service_role;

-- 8. automation_settings
create table if not exists public.automation_settings (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  key             text not null,
  label           text,
  enabled         boolean not null default false,
  config          jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, key)
);
create index if not exists automation_settings_org_idx on public.automation_settings(organization_id);
alter table public.automation_settings enable row level security;
create policy "auto_org_read" on public.automation_settings for select to authenticated
  using (public.is_org_member(organization_id, auth.uid()));
create policy "auto_org_write" on public.automation_settings for all to authenticated
  using (public.is_org_member(organization_id, auth.uid()))
  with check (public.is_org_member(organization_id, auth.uid()));
grant all on public.automation_settings to service_role;

-- 9. website_analyses
create table if not exists public.website_analyses (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  url             text not null,
  status          text not null default 'pending',
  result          jsonb,
  error           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists website_analyses_org_idx on public.website_analyses(organization_id);
alter table public.website_analyses enable row level security;
create policy "website_analyses_org" on public.website_analyses for all to authenticated
  using (public.is_org_member(organization_id, auth.uid()))
  with check (public.is_org_member(organization_id, auth.uid()));
grant all on public.website_analyses to service_role;

-- 10. usage_tracking
create table if not exists public.usage_tracking (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  tool_key        text not null,
  period          text not null,
  count           integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, tool_key, period)
);
create index if not exists usage_tracking_org_idx on public.usage_tracking(organization_id, period);
alter table public.usage_tracking enable row level security;
create policy "usage_own_org" on public.usage_tracking for all to authenticated
  using (public.is_org_member(organization_id, auth.uid()));
grant all on public.usage_tracking to service_role;

-- 11. user_integrations
create table if not exists public.user_integrations (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  integration_key  text not null,
  encrypted_value  text,
  status           text not null default 'connected',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, integration_key)
);
create index if not exists user_integrations_user_idx on public.user_integrations(user_id);
alter table public.user_integrations enable row level security;
create policy "integrations_own" on public.user_integrations for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
grant all on public.user_integrations to service_role;

-- user_integrations_masked view
create or replace view public.user_integrations_masked as
select
  id,
  user_id,
  integration_key,
  status,
  right(coalesce(encrypted_value, ''), 4) as value_last4,
  (encrypted_value is not null and encrypted_value <> '') as is_connected,
  created_at,
  updated_at
from public.user_integrations;
grant select on public.user_integrations_masked to authenticated, service_role;

-- 12. user_roles
create table if not exists public.user_roles (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role    public.app_role not null default 'user',
  unique (user_id, role)
);
alter table public.user_roles enable row level security;
create policy "user_roles_own" on public.user_roles for select to authenticated
  using (auth.uid() = user_id);
grant all on public.user_roles to service_role;

-- 13. has_role helper
create or replace function public.has_role(_role public.app_role, _user_id uuid)
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;
