-- ════════════════════════════════════════════════════════════════════
-- Credit reservation pattern + failure recovery
-- Supports atomic debit-on-success via reserve → confirm/refund cycle.
-- ════════════════════════════════════════════════════════════════════

-- ── credit_ledger: add reservation support ───────────────────────────
alter table public.credit_ledger
  add column if not exists reservation_id uuid default uuid_generate_v4(),
  add column if not exists status text not null default 'confirmed'
    check (status in ('reserved', 'confirmed', 'refunded'));

create index if not exists idx_credit_ledger_reservation
  on public.credit_ledger(reservation_id);

create index if not exists idx_credit_ledger_status
  on public.credit_ledger(user_id, status);

-- ── user_credit_balance view: only count confirmed debits ────────────
create or replace view public.user_credit_balance as
select
  u.id as user_id,
  coalesce(alloc.credits, 0) - coalesce(used.credits, 0) as balance
from auth.users u
left join (
  select user_id, sum(amount) as credits
  from public.credit_allocations
  group by user_id
) alloc on alloc.user_id = u.id
left join (
  select user_id, sum(cost) as credits
  from public.credit_ledger
  where status = 'confirmed'
  group by user_id
) used on used.user_id = u.id;

-- ── ai_operator_configs: add strategy_complete flag ──────────────────
alter table public.ai_operator_configs
  add column if not exists strategy_complete boolean not null default false,
  add column if not exists profile_complete  boolean not null default false;

-- ── failed_jobs: dead-letter queue for failure recovery ──────────────
create table if not exists public.failed_jobs (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete cascade,
  session_id      uuid,
  tool_slug       text not null,
  payload         jsonb not null default '{}',
  reservation_id  uuid,
  error_message   text,
  retry_count     int not null default 0,
  next_retry_at   timestamptz not null default now() + interval '2 minutes',
  status          text not null default 'pending'
    check (status in ('pending', 'retrying', 'resolved', 'dead')),
  resolved_at     timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists idx_failed_jobs_retry
  on public.failed_jobs(status, next_retry_at)
  where status in ('pending', 'retrying');

create index if not exists idx_failed_jobs_user
  on public.failed_jobs(user_id, created_at desc);

-- RLS: users can read their own failed jobs; service role manages all
alter table public.failed_jobs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'service_role_all' and tablename = 'failed_jobs'
  ) then
    create policy service_role_all on public.failed_jobs
      for all to service_role using (true) with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'own_rows_read' and tablename = 'failed_jobs'
  ) then
    create policy own_rows_read on public.failed_jobs
      for select to authenticated using (user_id = auth.uid());
  end if;
end $$;

-- ════════════════════════════════════════════════════════════════════
-- Verify:
--   select column_name from information_schema.columns
--     where table_name = 'credit_ledger' and column_name in ('reservation_id','status');
--   select tablename from pg_tables where schemaname='public' and tablename='failed_jobs';
-- ════════════════════════════════════════════════════════════════════
