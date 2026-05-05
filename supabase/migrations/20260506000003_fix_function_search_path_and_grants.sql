-- Fix mutable search_path warnings and restrict direct REST execution
-- of SECURITY DEFINER functions to prevent privilege escalation.

-- 1. touch_updated_at: pin search_path
create or replace function public.touch_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin new.updated_at := now(); return new; end;
$$;

-- 2. has_role: pin search_path
create or replace function public.has_role(_role public.app_role, _user_id uuid)
returns boolean language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

-- 3. handle_new_organization: pin search_path + fix enum value (plan_tier uses lowercase)
create or replace function public.handle_new_organization()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.subscriptions (organization_id, plan, status)
  values (new.id, 'starter', 'trialing')
  on conflict (organization_id) do nothing;
  return new;
end;
$$;

-- 4. Revoke the default PUBLIC execute grant then re-grant only to roles that need it.
--    Trigger / event-trigger functions are invoked by the system, not end users.
revoke execute on function public.handle_new_organization() from public;
revoke execute on function public.handle_new_user()         from public;
revoke execute on function public.rls_auto_enable()         from public;

-- RLS helper functions: authenticated users may call them directly; anon must not.
revoke execute on function public.has_role(public.app_role, uuid) from public;
revoke execute on function public.is_org_admin(uuid, uuid)         from public;
revoke execute on function public.is_org_member(uuid, uuid)        from public;

grant execute on function public.has_role(public.app_role, uuid) to authenticated, service_role;
grant execute on function public.is_org_admin(uuid, uuid)         to authenticated, service_role;
grant execute on function public.is_org_member(uuid, uuid)        to authenticated, service_role;
