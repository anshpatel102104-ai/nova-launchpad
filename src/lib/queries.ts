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
  features: Record<string, unknown>;
  created_at: string;
};

// Fallback values used for guest mode and when DB has no row for a plan.
const PLAN_PRICES: Record<string, number> = {
  starter: 0,
  launch: 49,
  operate: 149,
  scale: 299,
};

const PLAN_GEN_LIMITS: Record<string, number | null> = {
  starter: 5,
  launch: 50,
  operate: 200,
  scale: null,
};

// Cumulative — each tier includes all tools from lower tiers.
// Keep in sync with plan_tier_limits table seed.
const PLAN_TOOLS: Record<string, string[]> = {
  starter: ["validate-idea", "generate-pitch", "persona-builder", "launch-checklist"],
  launch: [
    "validate-idea",
    "generate-pitch",
    "generate-gtm-strategy",
    "generate-offer",
    "kill-my-idea",
    "idea-vs-idea",
    "landing-page",
    "first-10-customers",
    "generate-followup-sequence",
    "blog",
    "social",
    "email_sequence",
    "sales_script",
    "cold_email",
    "pitch_deck",
    "lead_magnet",
    "niche_validator",
    "icp",
    "positioning-engine",
    "niche-scorer",
    "mvp-planner",
    "competitor-scanner",
    "gtm-strategy-builder",
    "business-plan-generator",
    "persona-builder",
    "pricing-calculator",
    "first-10-customers-finder",
    "landing-page-creator",
    "kpi-dashboard",
    "seo-audit",
    "launch-checklist",
    "ad-copy",
  ],
  operate: [
    "validate-idea",
    "generate-pitch",
    "generate-gtm-strategy",
    "generate-offer",
    "kill-my-idea",
    "idea-vs-idea",
    "landing-page",
    "first-10-customers",
    "generate-followup-sequence",
    "generate-ops-plan",
    "funding-score",
    "investor-emails",
    "business-plan",
    "analyze-website",
    "blog",
    "social",
    "email_sequence",
    "sales_script",
    "cold_email",
    "pitch_deck",
    "lead_magnet",
    "niche_validator",
    "icp",
    "positioning-engine",
    "niche-scorer",
    "mvp-planner",
    "ad_creative",
    "vsl",
    "automation",
    "client_report",
    "competitor-scanner",
    "gtm-strategy-builder",
    "business-plan-generator",
    "persona-builder",
    "pricing-calculator",
    "first-10-customers-finder",
    "landing-page-creator",
    "kpi-dashboard",
    "seo-audit",
    "launch-checklist",
    "ad-copy",
    "investor-email-writer",
    "funding-readiness-score",
  ],
  scale: [
    "validate-idea",
    "generate-pitch",
    "generate-gtm-strategy",
    "generate-offer",
    "kill-my-idea",
    "idea-vs-idea",
    "landing-page",
    "first-10-customers",
    "generate-followup-sequence",
    "generate-ops-plan",
    "funding-score",
    "investor-emails",
    "business-plan",
    "analyze-website",
    "competitor-analysis",
    "pricing-strategy",
    "revenue-projector",
    "blog",
    "social",
    "email_sequence",
    "sales_script",
    "cold_email",
    "pitch_deck",
    "lead_magnet",
    "niche_validator",
    "icp",
    "positioning-engine",
    "niche-scorer",
    "mvp-planner",
    "ad_creative",
    "vsl",
    "automation",
    "client_report",
    "competitor-scanner",
    "gtm-strategy-builder",
    "business-plan-generator",
    "persona-builder",
    "pricing-calculator",
    "first-10-customers-finder",
    "landing-page-creator",
    "kpi-dashboard",
    "seo-audit",
    "launch-checklist",
    "ad-copy",
    "investor-email-writer",
    "funding-readiness-score",
  ],
};

export const planEntitlementsQuery = () =>
  queryOptions({
    queryKey: ["plan_tier_limits"],
    queryFn: async (): Promise<PlanEntitlement[]> => {
      const plans = ["starter", "launch", "operate", "scale"] as const;
      if (isGuest()) {
        return plans.map((plan) => ({
          plan,
          price_usd: PLAN_PRICES[plan] ?? 0,
          monthly_generation_limit: PLAN_GEN_LIMITS[plan] ?? null,
          allowed_tools: PLAN_TOOLS[plan] ?? [],
          features: {},
          created_at: new Date().toISOString(),
        }));
      }
      const { data, error } = await supabase.from("plan_tier_limits").select("*");
      if (error) throw error;
      return plans.map((plan) => {
        const row = (data ?? []).find((r) => r.plan === plan);
        return {
          plan,
          price_usd: row?.price_usd ?? PLAN_PRICES[plan] ?? 0,
          monthly_generation_limit: row?.monthly_generation_limit ?? PLAN_GEN_LIMITS[plan] ?? null,
          allowed_tools: (row?.allowed_tools as string[] | null) ?? PLAN_TOOLS[plan] ?? [],
          features: {},
          created_at: row?.created_at ?? new Date().toISOString(),
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
      if (isGuest()) return kind ? GUEST_ASSETS.filter((a) => a.kind === kind) : GUEST_ASSETS;
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
  const { error } = await supabase
    .from("user_integrations")
    .delete()
    .eq("user_id", userId)
    .eq("integration_key", integrationKey);
  if (error) throw error;
}

// ── Company Memory ────────────────────────────────────────────────────────────

export type MemorySource = {
  id: string;
  org_id: string;
  user_id: string;
  source_type: string;
  source_label: string | null;
  source_url: string | null;
  status: "pending" | "indexing" | "indexed" | "error";
  error_message: string | null;
  artifact_count: number;
  last_synced_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type MemoryArtifact = {
  id: string;
  org_id: string;
  user_id: string;
  source_id: string | null;
  source_type: string;
  source_label: string | null;
  title: string;
  content_preview: string | null;
  content_hash: string | null;
  token_count: number | null;
  status: "indexed" | "stale" | "error";
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export const memorySourcesQuery = (orgId: string) =>
  queryOptions({
    queryKey: ["memory_sources", orgId],
    queryFn: async (): Promise<MemorySource[]> => {
      if (isGuest()) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const { data, error } = await db
        .from("memory_sources")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as MemorySource[];
    },
  });

export const memoryArtifactsQuery = (orgId: string) =>
  queryOptions({
    queryKey: ["memory_artifacts", orgId],
    queryFn: async (): Promise<MemoryArtifact[]> => {
      if (isGuest()) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const { data, error } = await db
        .from("memory_artifacts")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as MemoryArtifact[];
    },
  });

export async function addMemorySource(
  orgId: string,
  userId: string,
  payload: Pick<MemorySource, "source_type" | "source_label" | "source_url">,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data, error } = await db
    .from("memory_sources")
    .insert({ org_id: orgId, user_id: userId, ...payload })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as MemorySource;
}

export async function deleteMemorySource(sourceId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { error } = await db.from("memory_sources").delete().eq("id", sourceId);
  if (error) throw error;
}

// ── AI Dashboard ─────────────────────────────────────────────────────────────

export type GenerateDashboardInput = {
  business: string;
  niche?: string;
  stage?: string;
  goal?: string;
  current_revenue?: string;
  target_customer?: string;
  biggest_blocker?: string;
};

export const onboardingResponseQuery = (orgId: string) =>
  queryOptions({
    queryKey: ["onboarding_response", orgId],
    queryFn: async () => {
      if (isGuest()) return null;
      const { data, error } = await supabase
        .from("onboarding_responses")
        .select("*")
        .eq("organization_id", orgId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const aiDashboardQuery = (orgId: string) =>
  queryOptions({
    queryKey: ["ai_dashboard", orgId],
    queryFn: async () => {
      if (isGuest()) return null;
      const { data, error } = await supabase
        .from("ai_dashboards")
        .select("*")
        .eq("organization_id", orgId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export async function generateAiDashboard(input: GenerateDashboardInput) {
  const { data, error } = await supabase.functions.invoke("generate-ai-dashboard", {
    body: input,
  });
  if (error) throw error;
  return data;
}

export async function deleteAiDashboard(orgId: string) {
  const { error } = await supabase.from("ai_dashboards").delete().eq("organization_id", orgId);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mentor Agent Queries
// ─────────────────────────────────────────────────────────────────────────────

export type MentorMessage = {
  role: "user" | "agent";
  text: string;
  ts: string;
};

export type MentorSession = {
  id: string;
  org_id: string;
  user_id: string;
  agent_id: string;
  messages: MentorMessage[];
  created_at: string;
  updated_at: string;
};

export type MentorInsight = {
  id: string;
  org_id: string;
  agent_id: string;
  type: "signal" | "opportunity" | "warning" | "recommendation";
  title: string;
  detail: string;
  priority: "high" | "medium" | "low";
  read: boolean;
  n8n_run_id: string | null;
  created_at: string;
  // UI-derived fields (enriched client-side)
  color?: string;
  agent?: string;
  ago?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const mentorSessionQuery = (orgId: string, agentId: string) =>
  queryOptions({
    queryKey: ["mentor_session", orgId, agentId],
    queryFn: async (): Promise<MentorSession | null> => {
      if (isGuest()) return null;
      const { data, error } = await db
        .from("mentor_agent_sessions")
        .select("*")
        .eq("org_id", orgId)
        .eq("agent_id", agentId)
        .maybeSingle();
      if (error) throw error;
      return data as MentorSession | null;
    },
    staleTime: 0,
  });

export const mentorInsightsQuery = (orgId: string) =>
  queryOptions({
    queryKey: ["mentor_insights", orgId],
    queryFn: async (): Promise<MentorInsight[]> => {
      if (isGuest()) return [];
      const { data, error } = await db
        .from("mentor_insights")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as MentorInsight[];
    },
  });

/** Upsert (create or append message) for a mentor chat session. */
export async function saveMentorMessage(
  orgId: string,
  userId: string,
  agentId: string,
  newMessages: MentorMessage[],
): Promise<void> {
  const { data: existing } = await db
    .from("mentor_agent_sessions")
    .select("messages")
    .eq("org_id", orgId)
    .eq("agent_id", agentId)
    .maybeSingle();

  const prior: MentorMessage[] = (existing?.messages as MentorMessage[]) ?? [];
  const merged = [...prior, ...newMessages];

  const { error } = await db.from("mentor_agent_sessions").upsert(
    {
      org_id: orgId,
      user_id: userId,
      agent_id: agentId,
      messages: merged,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "org_id,agent_id" },
  );
  if (error) throw error;
}

/** Mark all insights for an org as read. */
export async function markInsightsRead(orgId: string): Promise<void> {
  const { error } = await db
    .from("mentor_insights")
    .update({ read: true })
    .eq("org_id", orgId)
    .eq("read", false);
  if (error) throw error;
}

/** Current active mission for the user's workspace — shared query key with CurrentMissionCard. */
export const currentMissionQuery = (userId: string) =>
  queryOptions({
    queryKey: ["current-mission", userId],
    queryFn: async () => {
      if (!userId || isGuest()) return null;
      const { data: ws } = await supabase
        .from("workspaces")
        .select("id, name, lane, stage, current_mission_id")
        .eq("owner_id", userId)
        .maybeSingle();
      if (!ws) return null;

      const { data: mission } = await supabase
        .from("missions")
        .select("id, title, description, lane, status")
        .eq("workspace_id", ws.id)
        .eq("status", "active")
        .order("sort_order")
        .limit(1)
        .maybeSingle();

      if (!mission) return { workspace: ws, mission: null, steps: [] };

      const { data: steps } = await supabase
        .from("mission_steps")
        .select("id, title, description, tool_key, status, sort_order")
        .eq("mission_id", mission.id)
        .order("sort_order");

      return { workspace: ws, mission, steps: steps ?? [] };
    },
    staleTime: 30_000,
    retry: 4,
    retryDelay: 5_000,
  });

/** Derive live KPI metrics from existing tables (no new DB tables needed). */
export const mentorKPIsQuery = (orgId: string) =>
  queryOptions({
    queryKey: ["mentor_kpis", orgId],
    queryFn: async () => {
      if (isGuest()) {
        return {
          mrr: 0,
          pipelineValue: 0,
          execIndex: 0,
          cacRatio: 0,
          wonLeads: 0,
          totalLeads: 0,
          completedRuns: 0,
          activeAutomations: 0,
        };
      }

      // Parallel fetch from existing tables
      const [leadsRes, runsRes, autoRes] = await Promise.all([
        supabase.from("leads").select("id,stage,value").eq("organization_id", orgId),
        supabase
          .from("tool_runs")
          .select("id,status,tool_key,created_at")
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase.from("automation_settings").select("id,enabled").eq("organization_id", orgId),
      ]);

      const leads = leadsRes.data ?? [];
      const runs = runsRes.data ?? [];
      const autos = autoRes.data ?? [];

      const wonLeads = leads.filter((l) => l.stage === "Won").length;
      const totalLeads = leads.length;
      const pipelineValue = leads.reduce(
        (s, l) => s + ((l as { value?: number }).value ?? 3200),
        0,
      );
      const completedRuns = runs.filter((r) => r.status === "succeeded").length;
      const activeAutomations = autos.filter(
        (a) => (a as { enabled?: boolean }).enabled === true,
      ).length;

      // Execution index: weighted score from activity signals
      const execIndex = Math.min(
        100,
        Math.round(
          Math.min(completedRuns * 4, 40) +
            Math.min(activeAutomations * 12, 24) +
            Math.min(wonLeads * 8, 24) +
            (totalLeads > 0 ? 12 : 0),
        ),
      );

      // CAC ratio heuristic (improves as closed deals grow vs total runs cost)
      const cacRatio =
        completedRuns > 0
          ? Math.min(
              4.0,
              Math.max(
                0.5,
                wonLeads > 0 ? (wonLeads * 3.5) / Math.max(1, completedRuns * 0.3) : 0.8,
              ),
            )
          : 0;

      return {
        mrr: wonLeads * 420, // rough MRR signal per won deal
        pipelineValue,
        execIndex,
        cacRatio: Math.round(cacRatio * 10) / 10,
        wonLeads,
        totalLeads,
        completedRuns,
        activeAutomations,
      };
    },
  });

// ── Setup Checklist (domain / email / legal / banking / tools) ────────────────

export type ChecklistCategory = "domain" | "email" | "legal" | "banking" | "tools";
export type ChecklistItemStatus = "pending" | "done" | "skipped";

export type SetupChecklistItem = {
  id: string;
  organization_id: string;
  category: ChecklistCategory;
  label: string;
  status: ChecklistItemStatus;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export const CHECKLIST_CATEGORY_META: Record<ChecklistCategory, { label: string }> = {
  domain: { label: "Domain" },
  email: { label: "Email" },
  legal: { label: "Legal" },
  banking: { label: "Banking" },
  tools: { label: "Tools" },
};

/** Static seed template — curated business-setup tasks, one-time-inserted per org. */
const SETUP_CHECKLIST_TEMPLATE: { category: ChecklistCategory; label: string }[] = [
  { category: "domain", label: "Register your business domain name" },
  { category: "domain", label: "Point DNS at your hosting or landing page" },
  { category: "domain", label: "Turn on WHOIS privacy protection" },
  { category: "email", label: "Set up a professional address (you@yourdomain.com)" },
  { category: "email", label: "Connect a transactional email provider (e.g. Postmark, Resend)" },
  { category: "email", label: "Set up an email marketing tool (e.g. Mailchimp, ConvertKit)" },
  { category: "legal", label: "Register your business entity (LLC / Corp)" },
  { category: "legal", label: "Get an EIN / tax ID number" },
  { category: "legal", label: "Draft Terms of Service and a Privacy Policy" },
  { category: "banking", label: "Open a business bank account" },
  { category: "banking", label: "Get a business debit or credit card" },
  { category: "banking", label: "Connect a payment processor (e.g. Stripe)" },
  { category: "tools", label: "Set up web analytics (e.g. Google Analytics, Plausible)" },
  { category: "tools", label: "Connect a CRM or pipeline tracker" },
  { category: "tools", label: "Set up a help-desk or support inbox" },
];

const GUEST_SETUP_CHECKLIST: SetupChecklistItem[] = SETUP_CHECKLIST_TEMPLATE.map((t, i) => ({
  id: `guest-checklist-${i}`,
  organization_id: "guest",
  category: t.category,
  label: t.label,
  status: i < 3 ? "done" : "pending",
  sort_order: i,
  completed_at: i < 3 ? new Date().toISOString() : null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

/**
 * Org-scoped setup checklist. Self-seeds from the static template on first read
 * (idempotent — only inserts when the org has zero rows) so no separate
 * provisioning step or edge function is needed.
 */
export const setupChecklistQuery = (orgId: string) =>
  queryOptions({
    queryKey: ["setup_checklist_items", orgId],
    queryFn: async (): Promise<SetupChecklistItem[]> => {
      if (isGuest() || !orgId) return GUEST_SETUP_CHECKLIST;

      const { data, error } = await db
        .from("setup_checklist_items")
        .select("*")
        .eq("organization_id", orgId)
        .order("sort_order");
      if (error) throw error;
      if (data && data.length > 0) return data as SetupChecklistItem[];

      const seedRows = SETUP_CHECKLIST_TEMPLATE.map((t, i) => ({
        organization_id: orgId,
        category: t.category,
        label: t.label,
        sort_order: i,
      }));
      const { data: seeded, error: seedError } = await db
        .from("setup_checklist_items")
        .insert(seedRows)
        .select("*");
      if (seedError) throw seedError;
      return (seeded ?? []) as SetupChecklistItem[];
    },
    staleTime: 30_000,
  });

export async function setChecklistItemStatus(
  id: string,
  status: ChecklistItemStatus,
): Promise<void> {
  const { error } = await db
    .from("setup_checklist_items")
    .update({ status, completed_at: status === "done" ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}

// ── Launch Control Center ──────────────────────────────────────────────────────
// The control center composes setupChecklistQuery + mentorKPIsQuery directly (both
// already exist) alongside this query, which owns just the two genuinely-new
// aggregations: the analytics-install checklist and the feedback capture feed.

const ANALYTICS_CHECKLIST_KEYS: { key: string; label: string }[] = [
  { key: "googleanalytics", label: "Web analytics (Google Analytics)" },
  { key: "facebook_api", label: "Meta / Facebook Ads pixel" },
  { key: "stripe", label: "Payments (Stripe)" },
  { key: "mailchimp", label: "Email marketing tool" },
];
const EMAIL_TOOL_KEYS = ["mailchimp", "klaviyo", "convertkit"];

export type ToolFeedbackEntry = {
  runId: string;
  toolKey: string;
  feedback: string;
  feedbackAt: string | null;
};

export type LaunchControlExtras = {
  analyticsChecklist: { key: string; label: string; connected: boolean }[];
  feedback: ToolFeedbackEntry[];
  insights: MentorInsight[];
};

export const launchControlExtrasQuery = (orgId: string, userId: string) =>
  queryOptions({
    queryKey: ["launch_control_extras", orgId, userId],
    queryFn: async (): Promise<LaunchControlExtras> => {
      if (isGuest() || !orgId) {
        return {
          analyticsChecklist: ANALYTICS_CHECKLIST_KEYS.map((a) => ({ ...a, connected: false })),
          feedback: [],
          insights: [],
        };
      }

      const [integrationsRes, runsRes, insightsRes] = await Promise.all([
        userId
          ? db
              .from("user_integrations_masked")
              .select("integration_key,is_connected")
              .eq("user_id", userId)
          : Promise.resolve({ data: [] as { integration_key: string; is_connected: boolean }[] }),
        db
          .from("tool_runs")
          .select("id,tool_key,feedback,feedback_at")
          .eq("organization_id", orgId)
          .not("feedback", "is", null)
          .order("feedback_at", { ascending: false })
          .limit(8),
        db
          .from("mentor_insights")
          .select("*")
          .eq("org_id", orgId)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const connectedKeys = new Set(
        ((integrationsRes.data ?? []) as { integration_key: string; is_connected: boolean }[])
          .filter((i) => i.is_connected)
          .map((i) => i.integration_key),
      );
      const analyticsChecklist = ANALYTICS_CHECKLIST_KEYS.map((a) => ({
        ...a,
        connected:
          connectedKeys.has(a.key) ||
          (a.key === "mailchimp" && EMAIL_TOOL_KEYS.some((k) => connectedKeys.has(k))),
      }));

      const feedback: ToolFeedbackEntry[] = ((runsRes.data ?? []) as Record<string, unknown>[]).map(
        (r) => ({
          runId: String(r.id),
          toolKey: String(r.tool_key ?? ""),
          feedback: String(r.feedback ?? ""),
          feedbackAt: (r.feedback_at as string | null) ?? null,
        }),
      );

      return {
        analyticsChecklist,
        feedback,
        insights: (insightsRes.data ?? []) as MentorInsight[],
      };
    },
    staleTime: 30_000,
  });

// ─────────────────────────────────────────────────────────────────────────────
// Template applications
// ─────────────────────────────────────────────────────────────────────────────

export interface TemplateApplication {
  id: string;
  organization_id: string;
  template_slug: string;
  applied_at: string;
  customizations: Record<string, unknown>;
}

export function templateApplicationsQuery(orgId: string) {
  return queryOptions({
    queryKey: ["template_applications", orgId],
    queryFn: async () => {
      if (!orgId) return [] as TemplateApplication[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;
      const { data, error } = await sb
        .from("template_applications")
        .select("*")
        .eq("organization_id", orgId)
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TemplateApplication[];
    },
    staleTime: 60_000,
  });
}

export async function applyTemplate(orgId: string, templateSlug: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { error } = await sb.from("template_applications").insert({
    organization_id: orgId,
    template_slug: templateSlug,
  });
  if (error) throw error;
}
