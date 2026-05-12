-- Distribute 9 newly-wired Launchpad tools across plan tiers.
-- The run-tool edge function gates access on plan_entitlements.allowed_tools.
-- The original seed only covered 8 tools; this migration makes all wired tools
-- reachable by the correct plan tier.
--
-- Distribution (cumulative — each tier includes all tools from tiers below):
--   starter  (2):  validate-idea, generate-pitch
--   launch   (8):  + generate-gtm-strategy, generate-offer, kill-my-idea,
--                    idea-vs-idea, landing-page, first-10-customers
--   operate  (13): + generate-ops-plan, generate-followup-sequence,
--                    funding-score, investor-emails, business-plan
--   scale    (17): + analyze-website, competitor-analysis,
--                    pricing-strategy, revenue-projector

UPDATE plan_entitlements
SET allowed_tools = ARRAY[
  'validate-idea', 'generate-pitch',
  'generate-gtm-strategy', 'generate-offer', 'kill-my-idea',
  'idea-vs-idea', 'landing-page', 'first-10-customers'
]
WHERE plan = 'launch';

UPDATE plan_entitlements
SET allowed_tools = ARRAY[
  'validate-idea', 'generate-pitch',
  'generate-gtm-strategy', 'generate-offer', 'kill-my-idea',
  'idea-vs-idea', 'landing-page', 'first-10-customers',
  'generate-ops-plan', 'generate-followup-sequence',
  'funding-score', 'investor-emails', 'business-plan'
]
WHERE plan = 'operate';

UPDATE plan_entitlements
SET allowed_tools = ARRAY[
  'validate-idea', 'generate-pitch',
  'generate-gtm-strategy', 'generate-offer', 'kill-my-idea',
  'idea-vs-idea', 'landing-page', 'first-10-customers',
  'generate-ops-plan', 'generate-followup-sequence',
  'funding-score', 'investor-emails', 'business-plan',
  'analyze-website', 'competitor-analysis', 'pricing-strategy', 'revenue-projector'
]
WHERE plan = 'scale';
