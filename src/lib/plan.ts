// Plan / entitlement helpers. Server-side enforcement is via run-tool edge function
// reading plan_entitlements directly. This file is used for client-side UI gating only.

export type PlanId = "starter" | "launch" | "operate" | "scale";

export const PLANS: Record<PlanId, {
  id: PlanId;
  name: string;
  price: number;
  tagline: string;
  features: string[];
  toolLimit: number;
  systemLimit: number;
}> = {
  starter: {
    id: "starter",
    name: "Starter",
    price: 0,
    tagline: "Validate your first idea",
    toolLimit: 2,
    systemLimit: 0,
    features: ["2 AI tools", "5 generations/mo", "Community support"],
  },
  launch: {
    id: "launch",
    name: "Launch",
    price: 49,
    tagline: "Build, pitch, and go to market",
    toolLimit: 5,
    systemLimit: 1,
    features: ["5 AI tools", "50 generations/mo", "Email support"],
  },
  operate: {
    id: "operate",
    name: "Operate",
    price: 149,
    tagline: "Automate revenue operations",
    toolLimit: 7,
    systemLimit: 4,
    features: ["7 AI tools", "200 generations/mo", "Integrations", "Priority support"],
  },
  scale: {
    id: "scale",
    name: "Scale",
    price: 299,
    tagline: "Scale across teams and pipelines",
    toolLimit: 8,
    systemLimit: 6,
    features: ["All 8 AI tools", "Unlimited generations", "Dedicated operator"],
  },
};

export const PLAN_ORDER: PlanId[] = ["starter", "launch", "operate", "scale"];

export function planRank(p: PlanId) {
  return PLAN_ORDER.indexOf(p);
}

export function canAccessTool(plan: PlanId, toolIndex: number) {
  return toolIndex < PLANS[plan].toolLimit;
}
export function canAccessSystem(plan: PlanId, systemIndex: number) {
  return systemIndex < PLANS[plan].systemLimit;
}
