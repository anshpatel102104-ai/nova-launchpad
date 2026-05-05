-- Fix user_credit_balance view: use monthly_generation_limit (the actual
-- plan_entitlements column) instead of the nonexistent limit_value / feature_key.
create or replace view public.user_credit_balance as
select
  p.id                                                            as user_id,
  coalesce(
    (select pe.monthly_generation_limit
       from public.plan_entitlements pe
       join public.subscriptions sub
         on sub.plan = pe.plan
       join public.organization_members om
         on om.organization_id = sub.organization_id
        and om.user_id = p.id
      limit 1),
    999999) * 5                                                   as starting_credits,
  coalesce(sum(cl.cost), 0)                                       as credits_used,
  coalesce(
    (select pe.monthly_generation_limit
       from public.plan_entitlements pe
       join public.subscriptions sub
         on sub.plan = pe.plan
       join public.organization_members om
         on om.organization_id = sub.organization_id
        and om.user_id = p.id
      limit 1),
    999999) * 5 - coalesce(sum(cl.cost), 0)                      as credits_remaining
from public.profiles p
left join public.credit_ledger cl
       on cl.user_id = p.id
      and cl.created_at >= date_trunc('month', now())
group by p.id;

grant select on public.user_credit_balance to authenticated, service_role;
