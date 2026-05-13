-- ============================================================
-- Migration: Security hardening post-audit
-- 2026-05-13 — all statements are idempotent
-- ============================================================

-- 1. Revoke anon EXECUTE on increment_usage (SECURITY DEFINER callable by
--    unauthenticated users — anyone can inflate usage counters without signing in)
REVOKE EXECUTE ON FUNCTION public.increment_usage(uuid, text, text) FROM anon;

-- 2. stripe_webhook_events has RLS enabled but zero policies, which blocks
--    every non-service-role SELECT. Add an explicit "nobody via API" policy
--    so the intent is clear; service role bypasses RLS and still writes fine.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'stripe_webhook_events'
      AND policyname = 'no_direct_api_access'
  ) THEN
    CREATE POLICY "no_direct_api_access" ON public.stripe_webhook_events
      AS RESTRICTIVE
      USING (false);
  END IF;
END;
$$;

-- 3. Guard: feedback columns on tool_runs (safe to re-run)
ALTER TABLE public.tool_runs
  ADD COLUMN IF NOT EXISTS feedback    TEXT        CHECK (feedback IN ('up','down')),
  ADD COLUMN IF NOT EXISTS feedback_at TIMESTAMPTZ;

-- 4. Guard: cancel_at_period_end on subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT false;

-- 5. Guard: onboarding_responses extended columns
ALTER TABLE public.onboarding_responses
  ADD COLUMN IF NOT EXISTS organization_id UUID        REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS offer           TEXT,
  ADD COLUMN IF NOT EXISTS stage           TEXT,
  ADD COLUMN IF NOT EXISTS biggest_blocker TEXT,
  ADD COLUMN IF NOT EXISTS completed       BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS completed_at    TIMESTAMPTZ;

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

-- 6. Guard: plan_tier_limits with correct pricing (operate = $149, not $99)
CREATE TABLE IF NOT EXISTS public.plan_tier_limits (
  plan                     TEXT PRIMARY KEY,
  price_usd                INTEGER NOT NULL DEFAULT 0,
  monthly_generation_limit INTEGER,
  allowed_tools            TEXT[]  NOT NULL DEFAULT '{}',
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plan_tier_limits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'plan_tier_limits'
      AND policyname = 'plan_tier_limits_read'
  ) THEN
    CREATE POLICY "plan_tier_limits_read" ON public.plan_tier_limits
      FOR SELECT USING (true);
  END IF;
END;
$$;

GRANT SELECT ON public.plan_tier_limits TO authenticated, anon;

INSERT INTO public.plan_tier_limits (plan, price_usd, monthly_generation_limit, allowed_tools)
VALUES
  ('starter', 0,   5,
   ARRAY['validate-idea','generate-pitch']),
  ('launch',  49,  50,
   ARRAY['validate-idea','generate-pitch','generate-gtm-strategy','generate-offer',
         'kill-my-idea','idea-vs-idea','landing-page','first-10-customers']),
  ('operate', 149, 200,
   ARRAY['validate-idea','generate-pitch','generate-gtm-strategy','generate-offer',
         'kill-my-idea','idea-vs-idea','landing-page','first-10-customers',
         'generate-ops-plan','generate-followup-sequence','funding-score',
         'investor-emails','business-plan']),
  ('scale',   299, NULL,
   ARRAY['validate-idea','generate-pitch','generate-gtm-strategy','generate-offer',
         'kill-my-idea','idea-vs-idea','landing-page','first-10-customers',
         'generate-ops-plan','generate-followup-sequence','funding-score',
         'investor-emails','business-plan','analyze-website','competitor-analysis',
         'pricing-strategy','revenue-projector'])
ON CONFLICT (plan) DO UPDATE SET
  price_usd                = EXCLUDED.price_usd,
  monthly_generation_limit = EXCLUDED.monthly_generation_limit,
  allowed_tools            = EXCLUDED.allowed_tools,
  updated_at               = now();
