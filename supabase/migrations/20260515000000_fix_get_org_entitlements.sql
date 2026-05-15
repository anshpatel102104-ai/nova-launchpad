-- ════════════════════════════════════════════════════════════════════
-- Drop and recreate get_org_entitlements
-- The old function referenced plan_entitlements (dropped by
-- 20260513000001 CASCADE) with columns feature_key / limit_value /
-- enabled that never existed in the local schema.  Replace with a
-- single-row result drawn from plan_tier_limits.
-- ════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.get_org_entitlements(uuid);

CREATE OR REPLACE FUNCTION public.get_org_entitlements(_org_id uuid)
RETURNS TABLE (
  plan                     text,
  price_usd                integer,
  monthly_generation_limit integer,
  allowed_tools            text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ptl.plan,
    ptl.price_usd,
    ptl.monthly_generation_limit,
    ptl.allowed_tools
  FROM public.plan_tier_limits ptl
  JOIN public.subscriptions s
    ON s.plan::text = ptl.plan
   AND s.organization_id = _org_id
   AND s.status IN ('active', 'trialing')
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_org_entitlements(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.get_org_entitlements(uuid) FROM anon;
