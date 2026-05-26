// TASK-011 · Feature gating
// Checks whether the current user's plan allows access to a given feature.
// Gates are evaluated client-side against the subscription plan; critical
// enforcement lives server-side in edge functions.

export type Plan = "starter" | "growth" | "pro" | "accelerator";

export type FeatureKey =
  | "operator_chat"
  | "operator_unlimited"
  | "mission_engine"
  | "advanced_tools"
  | "gtm_strategy"
  | "business_plan"
  | "funding_score"
  | "first_10_customers"
  | "investor_emails"
  | "kill_my_idea"
  | "idea_vs_idea"
  | "nova_systems"
  | "crm_pipeline"
  | "lead_capture"
  | "automation_workflows"
  | "follow_up_sequences"
  | "client_onboarding"
  | "reports_analytics"
  | "api_access"
  | "white_label"
  | "custom_integrations"
  | "priority_support";

interface FeatureConfig {
  plans: Plan[];
  limit?: number;
  label: string;
  upsell: string;
}

const FEATURE_GATES: Record<FeatureKey, FeatureConfig> = {
  operator_chat: {
    plans: ["starter", "growth", "pro", "accelerator"],
    label: "Operator Chat",
    upsell: "Upgrade to chat with your AI co-founder.",
  },
  operator_unlimited: {
    plans: ["growth", "pro", "accelerator"],
    label: "Unlimited Operator",
    upsell: "Upgrade to Growth for unlimited Operator messages.",
  },
  mission_engine: {
    plans: ["starter", "growth", "pro", "accelerator"],
    label: "Mission Engine",
    upsell: "Complete onboarding to access missions.",
  },
  advanced_tools: {
    plans: ["growth", "pro", "accelerator"],
    label: "Advanced Tools",
    upsell: "Upgrade to Growth to unlock advanced AI tools.",
  },
  gtm_strategy: {
    plans: ["starter", "growth", "pro", "accelerator"],
    label: "GTM Strategy",
    upsell: "Upgrade to access GTM Strategy.",
  },
  business_plan: {
    plans: ["growth", "pro", "accelerator"],
    label: "Business Plan",
    upsell: "Upgrade to Growth to generate business plans.",
  },
  funding_score: {
    plans: ["growth", "pro", "accelerator"],
    label: "Funding Score",
    upsell: "Upgrade to Growth to get your funding score.",
  },
  first_10_customers: {
    plans: ["starter", "growth", "pro", "accelerator"],
    label: "First 10 Customers",
    upsell: "Upgrade to access customer acquisition tools.",
  },
  investor_emails: {
    plans: ["growth", "pro", "accelerator"],
    label: "Investor Emails",
    upsell: "Upgrade to Growth to generate investor outreach.",
  },
  kill_my_idea: {
    plans: ["starter", "growth", "pro", "accelerator"],
    label: "Kill My Idea",
    upsell: "Upgrade to access idea stress-testing.",
  },
  idea_vs_idea: {
    plans: ["growth", "pro", "accelerator"],
    label: "Idea vs Idea",
    upsell: "Upgrade to Growth to compare ideas side by side.",
  },
  nova_systems: {
    plans: ["starter", "growth", "pro", "accelerator"],
    label: "Nova OS",
    upsell: "Upgrade to access Nova OS systems.",
  },
  crm_pipeline: {
    plans: ["starter", "growth", "pro", "accelerator"],
    label: "CRM Pipeline",
    upsell: "Upgrade to access the CRM pipeline.",
  },
  lead_capture: {
    plans: ["starter", "growth", "pro", "accelerator"],
    label: "Lead Capture",
    upsell: "Upgrade to start capturing leads.",
  },
  automation_workflows: {
    plans: ["growth", "pro", "accelerator"],
    label: "Automation Workflows",
    upsell: "Upgrade to Growth to wire automations.",
  },
  follow_up_sequences: {
    plans: ["growth", "pro", "accelerator"],
    label: "Follow-Up Sequences",
    upsell: "Upgrade to Growth for automated follow-ups.",
  },
  client_onboarding: {
    plans: ["pro", "accelerator"],
    label: "Client Onboarding",
    upsell: "Upgrade to Pro for client onboarding flows.",
  },
  reports_analytics: {
    plans: ["growth", "pro", "accelerator"],
    label: "Reports & Analytics",
    upsell: "Upgrade to Growth for detailed reporting.",
  },
  api_access: {
    plans: ["pro", "accelerator"],
    label: "API Access",
    upsell: "Upgrade to Pro for API access.",
  },
  white_label: {
    plans: ["accelerator"],
    label: "White Label",
    upsell: "Upgrade to Accelerator for white-label options.",
  },
  custom_integrations: {
    plans: ["pro", "accelerator"],
    label: "Custom Integrations",
    upsell: "Upgrade to Pro for custom integrations.",
  },
  priority_support: {
    plans: ["pro", "accelerator"],
    label: "Priority Support",
    upsell: "Upgrade to Pro for priority support.",
  },
};

export interface GateResult {
  allowed: boolean;
  label: string;
  upsell: string;
  limit: number | null;
}

export function checkFeatureGate(feature: FeatureKey, plan: Plan = "starter"): GateResult {
  const config = FEATURE_GATES[feature];
  if (!config) return { allowed: false, label: feature, upsell: "Feature not found.", limit: null };
  return {
    allowed: config.plans.includes(plan),
    label: config.label,
    upsell: config.upsell,
    limit: config.limit ?? null,
  };
}

export function getAllowedFeatures(plan: Plan): FeatureKey[] {
  return (Object.entries(FEATURE_GATES) as [FeatureKey, FeatureConfig][])
    .filter(([, cfg]) => cfg.plans.includes(plan))
    .map(([key]) => key);
}

export function getBlockedFeatures(plan: Plan): FeatureKey[] {
  return (Object.entries(FEATURE_GATES) as [FeatureKey, FeatureConfig][])
    .filter(([, cfg]) => !cfg.plans.includes(plan))
    .map(([key]) => key);
}
