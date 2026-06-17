-- ── contacts.next_action_due — a user-set follow-up reminder date ────────────
-- The "next move" itself is derived live (src/lib/next-best-action.ts), so it is
-- never stored. This column holds something that is NOT derivable: the date a
-- founder decides they want to follow up by. It lets "Act now first" surface
-- overdue follow-ups and is the seed for future reminders / notifications.
-- Additive + idempotent; RLS on contacts is row-level so no policy change.

alter table public.contacts
  add column if not exists next_action_due timestamptz;

-- Partial index: only rows with a due date, ordered for "what's overdue/soon".
create index if not exists idx_contacts_next_action_due
  on public.contacts (next_action_due)
  where next_action_due is not null;
