import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  guestStore, GUEST_USER, GUEST_ORG, GUEST_SUBSCRIPTION, GUEST_LEADS,
  GUEST_ASSETS, GUEST_TOOL_RUNS, GUEST_USAGE, GUEST_INTEGRATIONS,
} from "@/lib/guest";

const isGuest = () => guestStore.get().isGuest;

export const profileQuery = (userId: string) =>
  queryOptions({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (isGuest()) return { id: GUEST_USER.id, email: GUEST_USER.email, full_name: GUEST_USER.full_name, onboarding_complete: true, avatar_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const organizationQuery = (orgId: string) =>
  queryOptions({
    queryKey: ["organization", orgId],
    queryFn: async () => {
      if (isGuest()) return GUEST_ORG;
      const { data, error } = await supabase.from("organizations").select("*").eq("id", orgId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const subscriptionQuery = (orgId: string) =>
  queryOptions({
    queryKey: ["subscription", orgId],
    queryFn: async () => {
      if (isGuest()) return GUEST_SUBSCRIPTION;
      const { data, error } = await supabase.from("subscriptions").select("*").eq("organization_id", orgId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const planEntitlementsQuery = () =>
  queryOptions({
    queryKey: ["plan_entitlements"],
    queryFn: async () => {
      if (isGuest()) {
        return [
          { plan: "starter" as const, price_usd: 0,   monthly_generation_limit: 10,  allowed_tools: ["validate-idea"], features: {}, created_at: new Date().toISOString() },
          { plan: "launch"  as const, price_usd: 49,  monthly_generation_limit: 100, allowed_tools: ["validate-idea","generate-pitch","generate-offer","generate-followup-sequence"], features: {}, created_at: new Date().toISOString() },
          { plan: "operate" as const, price_usd: 149, monthly_generation_limit: 500, allowed_tools: ["validate-idea","generate-pitch","generate-offer","generate-followup-sequence","generate-gtm-strategy","generate-ops-plan","analyze-website"], features: {}, created_at: new Date().toISOString() },
          { plan: "scale"   as const, price_usd: 299, monthly_generation_limit: null,allowed_tools: ["validate-idea","generate-pitch","generate-offer","generate-followup-sequence","generate-gtm-strategy","generate-ops-plan","analyze-website"], features: {}, created_at: new Date().toISOString() },
        ];
      }
      const { data, error } = await supabase.from("plan_entitlements").select("*").order("price_usd", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

export const toolRunsQuery = (orgId: string, limit = 20) =>
  queryOptions({
    queryKey: ["tool_runs", orgId, limit],
    queryFn: async () => {
      if (isGuest()) return GUEST_TOOL_RUNS.slice(0, limit);
      const { data, error } = await supabase
        .from("tool_runs").select("*").eq("organization_id", orgId)
        .order("created_at", { ascending: false }).limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });

export const generatedAssetsQuery = (orgId: string, category?: string) =>
  queryOptions({
    queryKey: ["generated_assets", orgId, category ?? "all"],
    queryFn: async () => {
      if (isGuest()) return category ? GUEST_ASSETS.filter((a) => a.category === category) : GUEST_ASSETS;
      let q = supabase.from("generated_assets").select("*").eq("organization_id", orgId);
      if (category) q = q.eq("category", category);
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
        .from("usage_tracking").select("*").eq("organization_id", orgId).eq("period", period);
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
        .from("automation_settings").select("*").eq("organization_id", orgId).order("key");
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
        .from("website_analyses").select("*").eq("organization_id", orgId).order("created_at", { ascending: false });
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
        .from("leads").select("*").eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const integrationsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["user_integrations", userId],
    queryFn: async () => {
      if (isGuest()) return GUEST_INTEGRATIONS;
      const { data, error } = await supabase
        .from("user_integrations").select("*").eq("user_id", userId);
      if (error) throw error;
      return data ?? [];
    },
  });
