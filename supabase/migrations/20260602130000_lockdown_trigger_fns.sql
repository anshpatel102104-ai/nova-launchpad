-- Lock down trigger-only SECURITY DEFINER functions that should never be
-- reachable via the PostgREST /rpc API. Both are trigger functions:
--   populate_onboarding_org_id() -> BEFORE INSERT trigger
--   update_users_view_fn()       -> INSTEAD OF trigger on the users view
-- Revoke EXECUTE from PUBLIC and authenticated so anon/authenticated roles
-- cannot invoke them through /rest/v1/rpc. Also pin a stable search_path on
-- update_users_view_fn to silence the mutable-search_path linter.

REVOKE EXECUTE ON FUNCTION public.populate_onboarding_org_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.populate_onboarding_org_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.populate_onboarding_org_id() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.update_users_view_fn() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_users_view_fn() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_users_view_fn() FROM authenticated;

ALTER FUNCTION public.update_users_view_fn() SET search_path = '';
