-- 20260618000001 · Signup provisioning + safe account deletion
--
-- Two backend-hardening changes the platform was missing:
--
--   1. handle_new_user() now provisions a full workspace at signup — organization
--      + owner membership + starter subscription — so EVERY new user lands with a
--      complete, queryable account regardless of which signup route they used or
--      whether email confirmation is enabled. Previously only /signup created the
--      org (client-side, and only when a session existed immediately), so users
--      from /auth/sign-up (or any confirmation-gated signup) were stranded with a
--      profile but no org until they finished onboarding. Org provisioning is
--      wrapped so a failure here can never block auth signup itself.
--
--   2. Foreign keys to auth.users that previously blocked a real account deletion
--      are switched to ON DELETE CASCADE / SET NULL so auth.admin.deleteUser()
--      (called by the new delete-account edge function) cleans up cleanly instead
--      of erroring on a constraint violation. The org_id columns on the v1
--      single-owner context/memory/monitoring tables hold the user's id (the app
--      filters them by auth.uid()), so CASCADE is the correct, lossless rule;
--      audit columns (updated_by / created_by) become SET NULL.

-- ──────────────────────────────────────────────────────────────────────
-- 1. Signup provisioning
-- ──────────────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text := coalesce(new.raw_user_meta_data->>'full_name', '');
  v_plan      text := lower(coalesce(new.raw_user_meta_data->>'plan', 'starter'));
  v_org_name  text;
  v_org_id    uuid;
begin
  -- Profile + base role (original behaviour, now idempotent)
  insert into public.profiles (id, email, full_name)
    values (new.id, new.email, v_full_name)
    on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
    values (new.id, 'user')
    on conflict do nothing;

  -- Org + owner membership + subscription. Best-effort: any failure here is
  -- logged and swallowed so account creation always succeeds.
  begin
    if v_plan not in ('starter', 'launch', 'operate', 'scale') then
      v_plan := 'starter';
    end if;

    v_org_name := case
      when length(trim(v_full_name)) > 0 then trim(v_full_name) || '''s Business'
      else 'My Business'
    end;

    insert into public.organizations (name, owner_id, created_by)
      values (v_org_name, new.id, new.id)
      returning id into v_org_id;

    insert into public.organization_members (organization_id, user_id, role)
      values (v_org_id, new.id, 'owner')
      on conflict (organization_id, user_id) do nothing;

    insert into public.subscriptions (organization_id, plan, status)
      values (v_org_id, v_plan::plan_tier, 'trialing'::subscription_status)
      on conflict (organization_id) do nothing;
  exception
    when others then
      raise warning 'handle_new_user: org provisioning skipped for % (%): %',
        new.id, new.email, sqlerrm;
  end;

  return new;
end;
$$;

comment on function public.handle_new_user is
  'On auth signup: creates profile + user_role, then provisions organization + owner membership + starter (or plan from user metadata) subscription. Org provisioning is best-effort and never blocks signup.';

-- ──────────────────────────────────────────────────────────────────────
-- 2. Account-deletion-safe foreign keys
-- ──────────────────────────────────────────────────────────────────────

-- CASCADE: v1 single-owner tables whose org_id column stores the user's id.
do $$
declare
  r text[];
  cascade_fks text[] := array[
    'context_chunks',    'context_chunks_org_id_fkey',    'org_id',
    'context_sources',   'context_sources_org_id_fkey',   'org_id',
    'decisions',         'decisions_org_id_fkey',         'org_id',
    'strategies',        'strategies_org_id_fkey',        'org_id',
    'outcomes',          'outcomes_org_id_fkey',          'org_id',
    'open_loops',        'open_loops_org_id_fkey',        'org_id',
    'expected_outcomes', 'expected_outcomes_org_id_fkey', 'org_id',
    'observed_metrics',  'observed_metrics_org_id_fkey',  'org_id',
    'deviation_alerts',  'deviation_alerts_org_id_fkey',  'org_id'
  ];
  i int;
begin
  for i in 1 .. array_length(cascade_fks, 1) by 3 loop
    if to_regclass('public.' || cascade_fks[i]) is not null then
      execute format('alter table public.%I drop constraint if exists %I', cascade_fks[i], cascade_fks[i + 1]);
      execute format(
        'alter table public.%I add constraint %I foreign key (%I) references auth.users(id) on delete cascade',
        cascade_fks[i], cascade_fks[i + 1], cascade_fks[i + 2]
      );
    end if;
  end loop;
end $$;

-- SET NULL: audit / actor columns that should survive the user's deletion.
do $$
declare
  setnull_fks text[] := array[
    'profiles',         'profiles_updated_by_fkey',         'updated_by',
    'subscriptions',    'subscriptions_updated_by_fkey',    'updated_by',
    'workspaces',       'workspaces_updated_by_fkey',       'updated_by',
    'missions',         'missions_updated_by_fkey',         'updated_by',
    'generated_assets', 'generated_assets_updated_by_fkey', 'updated_by',
    'organizations',    'organizations_created_by_fkey',    'created_by',
    'crm_activities',   'crm_activities_user_id_fkey',      'user_id',
    'platform_events',  'platform_events_user_id_fkey',     'user_id'
  ];
  i int;
begin
  for i in 1 .. array_length(setnull_fks, 1) by 3 loop
    if to_regclass('public.' || setnull_fks[i]) is not null then
      execute format('alter table public.%I drop constraint if exists %I', setnull_fks[i], setnull_fks[i + 1]);
      execute format(
        'alter table public.%I add constraint %I foreign key (%I) references auth.users(id) on delete set null',
        setnull_fks[i], setnull_fks[i + 1], setnull_fks[i + 2]
      );
    end if;
  end loop;
end $$;
