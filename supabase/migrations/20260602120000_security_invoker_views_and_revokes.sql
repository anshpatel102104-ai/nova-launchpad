-- Security hardening (P2)
-- 1. Recreate views with security_invoker=true so RLS of the querying user applies.
-- 2. Revoke anon EXECUTE on internal trigger functions.
-- Only views/functions whose definitions are present in repo migrations are touched here.
-- Views user_profiles, user_entitlements, user_credits, plan_entitlements and function
-- update_users_view_fn() are NOT defined in repo migrations and are intentionally omitted
-- (handled out-of-band to avoid guessing their bodies).

-- ── workspace_members (derived from organization_members) ───────────────────
create or replace view public.workspace_members
with (security_invoker = true) as
  select
    om.id,
    w.id  as workspace_id,
    om.organization_id,
    om.user_id,
    om.role,
    om.created_at
  from public.organization_members om
  join public.workspaces w on w.organization_id = om.organization_id;

-- ── users (compatibility view for subagents; plan_tier as price string) ─────
create or replace view public.users
with (security_invoker = true) as
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

-- ── Revoke anon EXECUTE on internal trigger function ────────────────────────
revoke execute on function public.populate_onboarding_org_id() from anon;
