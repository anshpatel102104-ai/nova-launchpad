import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  guestStore,
  GUEST_USER,
  GUEST_ORG,
  GUEST_SUBSCRIPTION,
  GUEST_LEADS,
  GUEST_ASSETS,
  GUEST_TOOL_RUNS,
  GUEST_USAGE,
  GUEST_INTEGRATIONS,
} from "@/lib/guest";

const isGuest = () => guestStore.get().isGuest;

export const profileQuery = (userId: string) =>
  queryOptions({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (isGuest())
        return {
          id: GUEST_USER.id,
          email: GUEST_USER.email,
          full_name: GUEST_USER.full_name,
          onboarding_complete: true,
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const organizationQuery = (orgId: string) =>
  queryOptions({
    queryKey: ["organization", orgId],
    queryFn: async () => {
      if (isGuest()) return GUEST_ORG;
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const subscriptionQuery = (orgId: string) =>
  queryOptions({
    queryKey: ["subscription", orgId],
    queryFn: async () => {
      if (isGuest()) return GUEST_SUBSCRIPTION;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("organization_id", orgId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export type PlanEntitlement = {
  plan: "starter" | "launch" | "operate" | "scale";
  price_usd: number;
  monthly_generation_limit: number | null;
  allowed_tools: string[];
  features: Record<string, number | null>;
  created_at: string;
};

const PLAN_PRICES: Record<string, number> = {
  starter: 0,
  launch: 49,
  operate: 149,
  scale: 299,
};

const PLAN_TOOLS: Record<string, string[]> = {
  starter: ["validate-idea"],
  launch: ["validate-idea", "generate-pitch", "generate-offer", "generate-followup-sequence"],
  operate: [
    "validate-idea",
    "generate-pitch",
    "generate-offer",
    "generate-followup-sequence",
    "generate-gtm-strategy",
    "generate-ops-plan",
    "analyze-website",
  ],
  scale: [
    "validate-idea",
    "generate-pitch",
    "generate-offer",
    "generate-followup-sequence",
    "generate-gtm-strategy",
    "generate-ops-plan",
    "analyze-website",
  ],
};

export const planEntitlementsQuery = () =>
  queryOptions({
    queryKey: ["plan_entitlements"],
    queryFn: async (): Promise<PlanEntitlement[]> => {
      const plans = ["starter", "launch", "operate", "scale"] as const;
      if (isGuest()) {
        return plans.map((plan) => ({
          plan,
          price_usd: PLAN_PRICES[plan] ?? 0,
          monthly_generation_limit: plan === "scale" ? null : (PLAN_PRICES[plan] === 0 ? 10 : plan === "launch" ? 100 : 500),
          allowed_tools: PLAN_TOOLS[plan] ?? [],
          features: {},
          created_at: new Date().toISOString(),
        }));
      }
      const { data, error } = await supabase.from("plan_entitlements").select("*");
      if (error) throw error;
      return plans.map((plan) => {
        const rows = (data ?? []).filter((r) => r.plan === plan);
        const get = (key: string) => rows.find((r) => r.feature_key === key)?.limit_value ?? null;
        return {
          plan,
          price_usd: PLAN_PRICES[plan] ?? 0,
          monthly_generation_limit: get("ai.generations.monthly"),
          allowed_tools: PLAN_TOOLS[plan] ?? [],
          features: Object.fromEntries(rows.map((r) => [r.feature_key, r.limit_value])),
          created_at: rows[0]?.created_at ?? new Date().toISOString(),
        };
      });
    },
  });

export const toolRunsQuery = (orgId: string, limit = 20) =>
  queryOptions({
    queryKey: ["tool_runs", orgId, limit],
    queryFn: async () => {
      if (isGuest()) return GUEST_TOOL_RUNS.slice(0, limit);
      const { data, error } = await supabase
        .from("tool_runs")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });

export const generatedAssetsQuery = (orgId: string, kind?: string) =>
  queryOptions({
    queryKey: ["generated_assets", orgId, kind ?? "all"],
    queryFn: async () => {
      if (isGuest())
        return kind ? GUEST_ASSETS.filter((a) => a.kind === kind) : GUEST_ASSETS;
      let q = supabase.from("generated_assets").select("*").eq("organization_id", orgId);
      if (kind) q = q.eq("kind", kind);
      const { data, error } = await q.order("created_at", { ascending: false }).limit(60);
      if (error) throw error;
      return data ?? [];
    },
  });

export const usageQuery = (orgId: string) =>
  queryOptions({
    queryKey: ["usage", orgId],
    queryFn: async () => {
      if (isGuest()) return GUEST_USAGE;
      const period = new Date().toISOString().slice(0, 7);
      const { data, error } = await supabase
        .from("usage_tracking")
        .select("*")
        .eq("organization_id", orgId)
        .eq("period", period);
      if (error) throw error;
      return data ?? [];
    },
  });

export const automationSettingsQuery = (orgId: string) =>
  queryOptions({
    queryKey: ["automation_settings", orgId],
    queryFn: async () => {
      if (isGuest()) return [];
      const { data, error } = await supabase
        .from("automation_settings")
        .select("*")
        .eq("organization_id", orgId)
        .order("key");
      if (error) throw error;
      return data ?? [];
    },
  });

export const websiteAnalysesQuery = (orgId: string) =>
  queryOptions({
    queryKey: ["website_analyses", orgId],
    queryFn: async () => {
      if (isGuest()) return [];
      const { data, error } = await supabase
        .from("website_analyses")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const leadsQuery = (orgId: string) =>
  queryOptions({
    queryKey: ["leads", orgId],
    queryFn: async () => {
      if (isGuest()) return GUEST_LEADS;
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export type MaskedIntegration = {
  id: string;
  user_id: string;
  integration_key: string;
  status: string;
  value_last4: string | null;
  is_connected: boolean;
  created_at: string;
  updated_at: string;
};

export const integrationsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["user_integrations", userId],
    queryFn: async (): Promise<MaskedIntegration[]> => {
      if (isGuest()) return GUEST_INTEGRATIONS as MaskedIntegration[];
      const { data, error } = await supabase
        .from("user_integrations_masked")
        .select("*")
        .eq("user_id", userId);
      if (error) throw error;
      return (data ?? []) as MaskedIntegration[];
    },
  });

export async function saveIntegration(integrationKey: string, value: string) {
  const { data, error } = await supabase.functions.invoke("save-integration", {
    body: { integration_key: integrationKey, value },
  });
  if (error) throw error;
  return data;
}

export async function disconnectIntegration(userId: string, integrationKey: string) {
  // RLS allows users to delete their own row directly
  const { error } = await supabase
    .from("user_integrations")
    .delete()
    .eq("user_id", userId)
    .eq("integration_key", integrationKey);
  if (error) throw error;
}
