-- ================================================================
-- Additive: ai_dashboards table for AI-generated personalized dashboards
-- No changes to existing tables or RLS policies.
-- ================================================================

create table if not exists public.ai_dashboards (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,

  -- input snapshot (what the user told us / was read from onboarding)
  business        text not null default '',
  niche           text,
  stage           text,
  goal            text,
  current_revenue text,
  target_customer text,
  biggest_blocker text,

  -- structured AI output
  payload         jsonb not null,

  -- traceability
  model           text,
  prompt_version  text default 'v1',

  generated_at    timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create index if not exists ai_dashboards_org_created
  on public.ai_dashboards(organization_id, created_at desc);

alter table public.ai_dashboards enable row level security;

-- Members of the org can read their own dashboards
create policy "ai_dashboards_select"
  on public.ai_dashboards for select to authenticated
  using (public.is_org_member(organization_id, auth.uid()));

-- Members of the org can insert for their org
create policy "ai_dashboards_insert"
  on public.ai_dashboards for insert to authenticated
  with check (public.is_org_member(organization_id, auth.uid()) and auth.uid() = user_id);

-- Only owner can delete
create policy "ai_dashboards_delete"
  on public.ai_dashboards for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, delete on public.ai_dashboards to authenticated;
grant all on public.ai_dashboards to service_role;
