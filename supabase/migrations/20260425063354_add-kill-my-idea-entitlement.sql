-- Add kill-my-idea to plan entitlements for launch, operate, and scale tiers.
-- starter stays gated — this tool requires at least a launch plan.
UPDATE public.plan_entitlements
SET allowed_tools = array_append(allowed_tools, 'kill-my-idea')
WHERE plan IN ('launch', 'operate', 'scale')
  AND NOT ('kill-my-idea' = ANY(allowed_tools));
