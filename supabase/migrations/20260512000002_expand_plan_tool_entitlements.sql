-- Create plan_tier_limits: single-row-per-plan table for run-tool entitlement checks.
-- The old plan_entitlements uses a multi-row feature_key design incompatible with
-- run-tool's .maybeSingle() query pattern.
CREATE TABLE IF NOT EXISTS public.plan_tier_limits (
  plan                     TEXT PRIMARY KEY,
  price_usd                INTEGER NOT NULL DEFAULT 0,
  monthly_generation_limit INTEGER NULL,
  allowed_tools            TEXT[] NOT NULL DEFAULT '{}',
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plan_tier_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_tier_limits_read" ON public.plan_tier_limits FOR SELECT USING (true);
GRANT SELECT ON public.plan_tier_limits TO authenticated, anon;

INSERT INTO public.plan_tier_limits (plan, price_usd, monthly_generation_limit, allowed_tools)
VALUES
  ('starter', 0,   5,   ARRAY['validate-idea', 'generate-pitch']),
  ('launch',  49,  50,  ARRAY['validate-idea','generate-pitch','generate-gtm-strategy','generate-offer','kill-my-idea','idea-vs-idea','landing-page','first-10-customers']),
  ('operate', 99,  200, ARRAY['validate-idea','generate-pitch','generate-gtm-strategy','generate-offer','kill-my-idea','idea-vs-idea','landing-page','first-10-customers','generate-ops-plan','generate-followup-sequence','funding-score','investor-emails','business-plan']),
  ('scale',   299, NULL, ARRAY['validate-idea','generate-pitch','generate-gtm-strategy','generate-offer','kill-my-idea','idea-vs-idea','landing-page','first-10-customers','generate-ops-plan','generate-followup-sequence','funding-score','investor-emails','business-plan','analyze-website','competitor-analysis','pricing-strategy','revenue-projector'])
ON CONFLICT (plan) DO UPDATE SET
  price_usd = EXCLUDED.price_usd,
  monthly_generation_limit = EXCLUDED.monthly_generation_limit,
  allowed_tools = EXCLUDED.allowed_tools,
  updated_at = now();
