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
  starter: ["validate-idea", "generate-pitch"],
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

// ─────────────────────────────────────────────────────────────────────────────
// Workspace & Mission Queries
// ─────────────────────────────────────────────────────────────────────────────

export type Workspace = {
  id: string;
  organization_id: string;
  owner_id: string;
  name: string;
  lane: string;
  stage: string;
  current_mission_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Mission = {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  lane: string;
  status: "active" | "completed" | "skipped";
  sort_order: number;
  assigned_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MissionStep = {
  id: string;
  mission_id: string;
  title: string;
  description: string | null;
  tool_key: string | null;
  status: "pending" | "completed" | "skipped";
  sort_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkspaceIntake = {
  id: string;
  workspace_id: string;
  user_id: string;
  full_name: string | null;
  idea: string | null;
  stage: string | null;
  challenge: string | null;
  lane: string | null;
  raw_answers: Record<string, unknown>;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export const workspaceQuery = (userId: string) =>
  queryOptions({
    queryKey: ["workspace", userId],
    queryFn: async (): Promise<Workspace | null> => {
      if (isGuest()) return null;
      const { data, error } = await supabase
        .from("workspaces")
        .select("*")
        .eq("owner_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data as Workspace | null;
    },
    staleTime: 60_000,
  });

export const missionsQuery = (workspaceId: string) =>
  queryOptions({
    queryKey: ["missions", workspaceId],
    queryFn: async (): Promise<Mission[]> => {
      if (isGuest()) return [];
      const { data, error } = await supabase
        .from("missions")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Mission[];
    },
  });

export const missionStepsQuery = (missionId: string) =>
  queryOptions({
    queryKey: ["mission_steps", missionId],
    queryFn: async (): Promise<MissionStep[]> => {
      if (isGuest()) return [];
      const { data, error } = await supabase
        .from("mission_steps")
        .select("*")
        .eq("mission_id", missionId)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as MissionStep[];
    },
  });

export type CurrentMissionData = {
  workspace: Workspace;
  mission: Mission;
  steps: MissionStep[];
} | null;

/** Composite query used by CurrentMissionCard — workspace + active mission + steps in one call. */
export const currentMissionQuery = (userId: string) =>
  queryOptions({
    queryKey: ["current-mission", userId],
    queryFn: async (): Promise<CurrentMissionData> => {
      if (isGuest()) return null;
      const { data: ws } = await supabase
        .from("workspaces")
        .select("id, name, lane, stage, current_mission_id, organization_id, owner_id, created_at, updated_at")
        .eq("owner_id", userId)
        .maybeSingle();
      if (!ws) return null;

      const { data: mission } = await supabase
        .from("missions")
        .select("*")
        .eq("workspace_id", ws.id)
        .eq("status", "active")
        .order("sort_order")
        .limit(1)
        .maybeSingle();
      if (!mission) return null;

      const { data: steps } = await supabase
        .from("mission_steps")
        .select("*")
        .eq("mission_id", mission.id)
        .order("sort_order");

      return {
        workspace: ws as Workspace,
        mission: mission as Mission,
        steps: (steps ?? []) as MissionStep[],
      };
    },
    staleTime: 30_000,
    retry: 4,
    retryDelay: 5_000,
  });

export const workspaceIntakeQuery = (workspaceId: string) =>
  queryOptions({
    queryKey: ["workspace_intake", workspaceId],
    queryFn: async (): Promise<WorkspaceIntake | null> => {
      if (isGuest()) return null;
      const { data, error } = await supabase
        .from("workspace_intake")
        .select("*")
        .eq("workspace_id", workspaceId)
        .maybeSingle();
      if (error) throw error;
      return data as WorkspaceIntake | null;
    },
  });

// ─────────────────────────────────────────────────────────────────────────────
// Agent Runs
// ─────────────────────────────────────────────────────────────────────────────

export type AgentRun = {
  id: string;
  workspace_id: string | null;
  user_id: string;
  mission_id: string | null;
  agent_type: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  status: "running" | "succeeded" | "failed";
  model: string | null;
  tokens_used: number | null;
  error: string | null;
  duration_ms: number | null;
  created_at: string;
  updated_at: string;
};

export const agentRunsQuery = (workspaceId: string, limit = 20) =>
  queryOptions({
    queryKey: ["agent_runs", workspaceId, limit],
    queryFn: async (): Promise<AgentRun[]> => {
      if (isGuest()) return [];
      const { data, error } = await supabase
        .from("agent_runs")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as AgentRun[];
    },
  });

// ─────────────────────────────────────────────────────────────────────────────
// Workflow Runs
// ─────────────────────────────────────────────────────────────────────────────

export type WorkflowRun = {
  id: string;
  workspace_id: string | null;
  user_id: string;
  workflow_name: string;
  trigger_event: string | null;
  status: "running" | "succeeded" | "failed" | "partial";
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error: string | null;
  duration_ms: number | null;
  n8n_execution_id: string | null;
  created_at: string;
  updated_at: string;
};

export const workflowRunsQuery = (userId: string, limit = 20) =>
  queryOptions({
    queryKey: ["workflow_runs", userId, limit],
    queryFn: async (): Promise<WorkflowRun[]> => {
      if (isGuest()) return [];
      const { data, error } = await supabase
        .from("workflow_runs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as WorkflowRun[];
    },
  });

// ─────────────────────────────────────────────────────────────────────────────
// Activation Events (funnel analytics)
// ─────────────────────────────────────────────────────────────────────────────

export type ActivationEvent = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  event_name: string;
  properties: Record<string, unknown>;
  created_at: string;
};

export const activationEventsQuery = (userId: string, limit = 50, eventNames?: string[]) =>
  queryOptions({
    queryKey: ["activation_events", userId, limit, eventNames ?? "all"],
    queryFn: async (): Promise<ActivationEvent[]> => {
      if (isGuest()) return [];
      let q = supabase
        .from("activation_events")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (eventNames && eventNames.length > 0) {
        q = q.in("event_name", eventNames);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ActivationEvent[];
    },
  });

// ─────────────────────────────────────────────────────────────────────────────
// Automation Connections
// ─────────────────────────────────────────────────────────────────────────────

export type AutomationConnection = {
  id: string;
  workspace_id: string;
  user_id: string;
  integration_key: string;
  status: "connected" | "disconnected" | "error";
  config: Record<string, unknown>;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
};

export const automationConnectionsQuery = (workspaceId: string) =>
  queryOptions({
    queryKey: ["automation_connections", workspaceId],
    queryFn: async (): Promise<AutomationConnection[]> => {
      if (isGuest()) return [];
      const { data, error } = await supabase
        .from("automation_connections")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as AutomationConnection[];
    },
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
