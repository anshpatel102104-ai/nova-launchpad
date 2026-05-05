-- Revoke default PUBLIC execute grant on all SECURITY DEFINER functions
-- to prevent anon users from calling them directly via the REST API.
-- (Migration 000003 recreated the functions; this is the companion grant cleanup.)

revoke execute on function public.handle_new_organization() from public;
revoke execute on function public.handle_new_user()         from public;
revoke execute on function public.rls_auto_enable()         from public;

revoke execute on function public.has_role(public.app_role, uuid) from public;
revoke execute on function public.is_org_admin(uuid, uuid)         from public;
revoke execute on function public.is_org_member(uuid, uuid)        from public;

grant execute on function public.has_role(public.app_role, uuid) to authenticated, service_role;
grant execute on function public.is_org_admin(uuid, uuid)         to authenticated, service_role;
grant execute on function public.is_org_member(uuid, uuid)        to authenticated, service_role;
