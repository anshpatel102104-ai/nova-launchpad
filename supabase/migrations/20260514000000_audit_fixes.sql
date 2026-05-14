-- ============================================================
-- Migration: Audit fixes — indexes + credit_ledger constraint
-- 2026-05-14 — all statements are idempotent
-- ============================================================

-- 1. Missing indexes on high-frequency FK / filter columns
--    These are used in RLS policies and frequent query filters.

CREATE INDEX IF NOT EXISTS idx_organization_members_user_id
  ON public.organization_members (user_id);

CREATE INDEX IF NOT EXISTS idx_organization_members_org_id
  ON public.organization_members (organization_id);

CREATE INDEX IF NOT EXISTS idx_tool_runs_user_id
  ON public.tool_runs (user_id);

CREATE INDEX IF NOT EXISTS idx_generated_assets_user_id
  ON public.generated_assets (user_id);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_id
  ON public.credit_ledger (user_id);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_org_id
  ON public.credit_ledger (organization_id);

-- 2. Unique constraint on credit_ledger.reservation_id to prevent
--    duplicate debits from retried requests.
--    Only enforce uniqueness on non-null reservation_ids.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename  = 'credit_ledger'
      AND indexname  = 'credit_ledger_reservation_id_unique'
  ) THEN
    CREATE UNIQUE INDEX credit_ledger_reservation_id_unique
      ON public.credit_ledger (reservation_id)
      WHERE reservation_id IS NOT NULL;
  END IF;
END;
$$;

-- 3. Cascade-delete credit_ledger entries when the parent organization is removed.
--    Safe: if FK already exists with correct behaviour, DO NOTHING.
DO $$
BEGIN
  -- Drop the existing FK if it lacks ON DELETE CASCADE, then recreate it.
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name   = 'credit_ledger'
      AND tc.constraint_name = 'credit_ledger_organization_id_fkey'
  ) THEN
    -- Check if it already has CASCADE; skip if so
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.referential_constraints
      WHERE constraint_name  = 'credit_ledger_organization_id_fkey'
        AND delete_rule       = 'CASCADE'
    ) THEN
      ALTER TABLE public.credit_ledger
        DROP CONSTRAINT credit_ledger_organization_id_fkey;
      ALTER TABLE public.credit_ledger
        ADD CONSTRAINT credit_ledger_organization_id_fkey
          FOREIGN KEY (organization_id)
          REFERENCES public.organizations(id)
          ON DELETE CASCADE;
    END IF;
  END IF;
END;
$$;

-- 4. Cascade-delete notifications when the parent organization is removed.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema  = 'public'
      AND table_name    = 'notifications'
      AND constraint_name = 'notifications_organization_id_fkey'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.referential_constraints
      WHERE constraint_name  = 'notifications_organization_id_fkey'
        AND delete_rule       = 'CASCADE'
    ) THEN
      ALTER TABLE public.notifications
        DROP CONSTRAINT notifications_organization_id_fkey;
      ALTER TABLE public.notifications
        ADD CONSTRAINT notifications_organization_id_fkey
          FOREIGN KEY (organization_id)
          REFERENCES public.organizations(id)
          ON DELETE CASCADE;
    END IF;
  END IF;
END;
$$;
