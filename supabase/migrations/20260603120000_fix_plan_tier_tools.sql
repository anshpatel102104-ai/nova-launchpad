-- ════════════════════════════════════════════════════════════════════
-- Fix plan_tier_limits: correct misfiled tools + add 13 new tools
-- All statements are idempotent (check before append).
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Move generate-followup-sequence from operate → launch ─────────
--    mock.ts marks it requiredPlan: "Launch" but squash seeded it in operate.
UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'generate-followup-sequence')
WHERE plan = 'launch'
  AND NOT ('generate-followup-sequence' = ANY(allowed_tools));

-- ── 2. Add free-tier tools (no requiredPlan) to starter ──────────────
--    kill-my-idea and idea-vs-idea have no requiredPlan in mock.ts
--    but were gated to paid tiers in the squash seed.
UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'kill-my-idea')
WHERE plan = 'starter'
  AND NOT ('kill-my-idea' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'idea-vs-idea')
WHERE plan = 'starter'
  AND NOT ('idea-vs-idea' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'niche_validator')
WHERE plan = 'starter'
  AND NOT ('niche_validator' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'icp')
WHERE plan = 'starter'
  AND NOT ('icp' = ANY(allowed_tools));

-- ── 3. Add Launch-tier new tools ─────────────────────────────────────
--    requiredPlan: "Launch" in mock.ts:
--    blog, social, email_sequence, sales_script, cold_email, pitch_deck, lead_magnet
UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'blog')
WHERE plan = 'launch'
  AND NOT ('blog' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'social')
WHERE plan = 'launch'
  AND NOT ('social' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'email_sequence')
WHERE plan = 'launch'
  AND NOT ('email_sequence' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'sales_script')
WHERE plan = 'launch'
  AND NOT ('sales_script' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'cold_email')
WHERE plan = 'launch'
  AND NOT ('cold_email' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'pitch_deck')
WHERE plan = 'launch'
  AND NOT ('pitch_deck' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'lead_magnet')
WHERE plan = 'launch'
  AND NOT ('lead_magnet' = ANY(allowed_tools));

-- ── 4. Add Operate-tier new tools ────────────────────────────────────
--    requiredPlan: "Operate" in mock.ts:
--    ad_creative, vsl, automation, client_report
UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'ad_creative')
WHERE plan = 'operate'
  AND NOT ('ad_creative' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'vsl')
WHERE plan = 'operate'
  AND NOT ('vsl' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'automation')
WHERE plan = 'operate'
  AND NOT ('automation' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'client_report')
WHERE plan = 'operate'
  AND NOT ('client_report' = ANY(allowed_tools));

-- ── 5. Cascade: ensure higher tiers inherit everything below ──────────

-- launch inherits everything starter has
-- (kill-my-idea, idea-vs-idea, niche_validator, icp)
UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'kill-my-idea')
WHERE plan = 'launch'
  AND NOT ('kill-my-idea' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'idea-vs-idea')
WHERE plan = 'launch'
  AND NOT ('idea-vs-idea' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'niche_validator')
WHERE plan = 'launch'
  AND NOT ('niche_validator' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'icp')
WHERE plan = 'launch'
  AND NOT ('icp' = ANY(allowed_tools));

-- operate inherits everything launch has
-- (generate-followup-sequence, blog, social, email_sequence, sales_script,
--  cold_email, pitch_deck, lead_magnet, kill-my-idea, idea-vs-idea, niche_validator, icp)
UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'generate-followup-sequence')
WHERE plan = 'operate'
  AND NOT ('generate-followup-sequence' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'blog')
WHERE plan = 'operate'
  AND NOT ('blog' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'social')
WHERE plan = 'operate'
  AND NOT ('social' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'email_sequence')
WHERE plan = 'operate'
  AND NOT ('email_sequence' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'sales_script')
WHERE plan = 'operate'
  AND NOT ('sales_script' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'cold_email')
WHERE plan = 'operate'
  AND NOT ('cold_email' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'pitch_deck')
WHERE plan = 'operate'
  AND NOT ('pitch_deck' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'lead_magnet')
WHERE plan = 'operate'
  AND NOT ('lead_magnet' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'kill-my-idea')
WHERE plan = 'operate'
  AND NOT ('kill-my-idea' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'idea-vs-idea')
WHERE plan = 'operate'
  AND NOT ('idea-vs-idea' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'niche_validator')
WHERE plan = 'operate'
  AND NOT ('niche_validator' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'icp')
WHERE plan = 'operate'
  AND NOT ('icp' = ANY(allowed_tools));

-- scale inherits everything operate has
-- (ad_creative, vsl, automation, client_report + all operate/launch/starter additions)
UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'ad_creative')
WHERE plan = 'scale'
  AND NOT ('ad_creative' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'vsl')
WHERE plan = 'scale'
  AND NOT ('vsl' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'automation')
WHERE plan = 'scale'
  AND NOT ('automation' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'client_report')
WHERE plan = 'scale'
  AND NOT ('client_report' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'generate-followup-sequence')
WHERE plan = 'scale'
  AND NOT ('generate-followup-sequence' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'blog')
WHERE plan = 'scale'
  AND NOT ('blog' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'social')
WHERE plan = 'scale'
  AND NOT ('social' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'email_sequence')
WHERE plan = 'scale'
  AND NOT ('email_sequence' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'sales_script')
WHERE plan = 'scale'
  AND NOT ('sales_script' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'cold_email')
WHERE plan = 'scale'
  AND NOT ('cold_email' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'pitch_deck')
WHERE plan = 'scale'
  AND NOT ('pitch_deck' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'lead_magnet')
WHERE plan = 'scale'
  AND NOT ('lead_magnet' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'kill-my-idea')
WHERE plan = 'scale'
  AND NOT ('kill-my-idea' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'idea-vs-idea')
WHERE plan = 'scale'
  AND NOT ('idea-vs-idea' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'niche_validator')
WHERE plan = 'scale'
  AND NOT ('niche_validator' = ANY(allowed_tools));

UPDATE public.plan_tier_limits
SET allowed_tools = array_append(allowed_tools, 'icp')
WHERE plan = 'scale'
  AND NOT ('icp' = ANY(allowed_tools));

-- Bump updated_at on all modified rows
UPDATE public.plan_tier_limits
SET updated_at = now()
WHERE plan IN ('starter', 'launch', 'operate', 'scale');
