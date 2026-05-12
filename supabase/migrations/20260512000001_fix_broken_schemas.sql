-- =============================================================
-- Fix broken schemas introduced by the align_enums migration
-- =============================================================

-- 1. Fix user_credit_balance view
--    The 20260506000001 migration recreated this view using
--    plan_entitlements.feature_key / limit_value columns that
--    do not exist. The actual table has monthly_generation_limit
--    directly (one row per plan, PRIMARY KEY on plan).
--    Also removed the reference to credit_ledger which was never
--    created in this codebase.
CREATE OR REPLACE VIEW public.user_credit_balance AS
SELECT
  p.id                                               AS user_id,
  pe.monthly_generation_limit                        AS monthly_limit,
  COALESCE(
    (
      SELECT SUM(ut.count)
      FROM   public.usage_tracking ut
      JOIN   public.organization_members mem
             ON  mem.organization_id = ut.organization_id
             AND mem.user_id = p.id
      WHERE  ut.period = to_char(now(), 'YYYY-MM')
    ), 0
  )                                                  AS generations_used
FROM  public.profiles p
LEFT  JOIN public.organization_members om  ON om.user_id          = p.id
LEFT  JOIN public.subscriptions sub        ON sub.organization_id = om.organization_id
LEFT  JOIN public.plan_entitlements pe     ON pe.plan             = sub.plan;

GRANT SELECT ON public.user_credit_balance TO authenticated, service_role;
ALTER  VIEW  public.user_credit_balance SET (security_invoker = on);

-- 2. Fix onboarding_responses table
--    The initial migration defined: question_key TEXT NOT NULL,
--    answer TEXT, UNIQUE(user_id, question_key).
--    The onboarding UI inserts: organization_id, offer, stage,
--    biggest_blocker, completed, completed_at — so every onboarding
--    save silently fails due to missing required column.
--    Add the application-level columns and relax the schema.
ALTER TABLE public.onboarding_responses
  ADD COLUMN IF NOT EXISTS organization_id  UUID        REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS offer            TEXT,
  ADD COLUMN IF NOT EXISTS stage            TEXT,
  ADD COLUMN IF NOT EXISTS biggest_blocker  TEXT,
  ADD COLUMN IF NOT EXISTS completed        BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS completed_at     TIMESTAMPTZ;

-- Make question_key optional so new-style upserts (which don't supply it) succeed
ALTER TABLE public.onboarding_responses
  ALTER COLUMN question_key DROP NOT NULL;

-- Add org-level unique constraint so { onConflict: "organization_id" } works
ALTER TABLE public.onboarding_responses
  ADD CONSTRAINT IF NOT EXISTS onboarding_responses_org_unique
  UNIQUE (organization_id);

-- Index for org lookups
CREATE INDEX IF NOT EXISTS onboarding_responses_org_idx
  ON public.onboarding_responses (organization_id);
