-- ============================================================
-- Migration: Fix all critical DB bugs found in E2E audit
-- 2026-05-13
-- ============================================================

-- 1. Fix Operate plan price: was $99, correct value is $149
UPDATE public.plan_tier_limits
  SET price_usd = 149
  WHERE plan = 'operate';

-- 2. Add feedback columns to tool_runs (fixes sendFeedback JSONB overwrite bug)
ALTER TABLE public.tool_runs
  ADD COLUMN IF NOT EXISTS feedback        TEXT        CHECK (feedback IN ('up','down')),
  ADD COLUMN IF NOT EXISTS feedback_at     TIMESTAMPTZ;

-- 3. Expand onboarding_responses schema to match frontend upsert
ALTER TABLE public.onboarding_responses
  ADD COLUMN IF NOT EXISTS organization_id UUID        REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS offer           TEXT,
  ADD COLUMN IF NOT EXISTS stage           TEXT,
  ADD COLUMN IF NOT EXISTS biggest_blocker TEXT,
  ADD COLUMN IF NOT EXISTS completed       BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS completed_at    TIMESTAMPTZ;

-- Unique constraint needed for ON CONFLICT clause in onboarding.tsx
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'onboarding_responses_organization_id_key'
  ) THEN
    ALTER TABLE public.onboarding_responses
      ADD CONSTRAINT onboarding_responses_organization_id_key UNIQUE (organization_id);
  END IF;
END;
$$;

-- 4. Drop stale plan_entitlements table (superseded by plan_tier_limits)
--    Guards against the table already being gone.
DROP TABLE IF EXISTS public.plan_entitlements CASCADE;
