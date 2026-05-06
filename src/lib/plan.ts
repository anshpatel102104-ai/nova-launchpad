// Plan / entitlement helpers. Backend enforcement happens via Supabase + n8n.
// TODO: replace mock plan with Supabase subscription lookup.

export type PlanId = "free" | "launch" | "operate" | "scale";

export const PLANS: Record<PlanId, {
  id: PlanId;
  name: string;
  price: number;
  tagline: string;
  features: string[];
  toolLimit: number;
  systemLimit: number;
}> = {
  free: {
    id: "free",
    name: "Starter",
    price: 0,
    tagline: "Try the founder toolkit",
    toolLimit: 2,
    systemLimit: 0,
    features: ["2 LaunchPad tools", "Limited runs", "Community support"],
  },
  launch: {
    id: "launch",
    name: "Launch",
    price: 49,
    tagline: "Ship your offer faster",
    toolLimit: 10,
    systemLimit: 1,
    features: ["All 10 LaunchPad tools", "1 Nova OS system", "Email support"],
  },
  operate: {
    id: "operate",
    name: "Operate",
    price: 149,
    tagline: "Automate your operations",
    toolLimit: 10,
    systemLimit: 4,
    features: ["Everything in Launch", "4 Nova OS systems", "Integrations", "Priority support"],
  },
  scale: {
    id: "scale",
    name: "Scale",
    price: 299,
    tagline: "Run the whole business on Nova",
    toolLimit: 10,
    systemLimit: 6,
    features: ["All 6 Nova OS systems", "Unlimited runs", "Dedicated operator"],
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "launch", "operate", "scale"];

export function planRank(p: PlanId) {
  return PLAN_ORDER.indexOf(p);
}

export function canAccessTool(plan: PlanId, toolIndex: number) {
  return toolIndex < PLANS[plan].toolLimit;
}
export function canAccessSystem(plan: PlanId, systemIndex: number) {
  return systemIndex < PLANS[plan].systemLimit;
}
