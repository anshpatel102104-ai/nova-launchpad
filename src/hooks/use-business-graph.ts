// Business Graph — the underlying intelligence layer of Nova OS.
// Aggregates business state from existing queries into a single graph that
// every page reads from: metrics that matter, blockers in the way, and
// AI-recommended next moves. Users never see the graph directly — they feel
// it through Mission Control, Outcome Engines, and Nova recommendations.
//
// NOVA_OS_REDESIGN.md · Part 5 — pure frontend aggregation, no backend changes.

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  toolRunsQuery,
  leadsQuery,
  organizationQuery,
  currentMissionQuery,
  mentorKPIsQuery,
  workspaceStatusQuery,
} from "@/lib/queries";

/* ─── Types ─────────────────────────────────────────────────── */

export type BusinessMode = "create" | "operate";
export type BusinessStage = "Idea" | "Validate" | "Launch" | "Operate" | "Scale";

export interface KeyMetric {
  id: string;
  label: string;
  value: string;
  target?: string;
  status: "on-track" | "behind" | "neutral";
  /** Where to act on this metric */
  actionTo: string;
  actionLabel: string;
}

export interface Blocker {
  id: string;
  severity: "critical" | "high" | "medium";
  title: string;
  why: string;
  /** Route that resolves this blocker */
  resolveTo: string;
  resolveLabel: string;
  estimatedMinutes: number;
}

export interface Recommendation {
  id: string;
  title: string;
  impact: string;
  estimatedMinutes: number;
  to: string;
}

export interface LeadRow {
  id: string;
  name: string | null;
  source: string | null;
  stage: string | null;
  value: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface BusinessGraph {
  isLoading: boolean;
  mode: BusinessMode;
  stage: BusinessStage;
  businessName: string;
  goal: string;
  metrics: KeyMetric[];
  blockers: Blocker[];
  recommendations: Recommendation[];
  /** Lead rows for tables and charts (newest first) */
  leads: LeadRow[];
  /** Raw signals other components can use */
  signals: {
    toolRunCount: number;
    leadCount: number;
    activeAutomationCount: number;
    hasOffer: boolean;
    hasGtm: boolean;
    hasValidatedIdea: boolean;
    hasFollowupSequence: boolean;
    missionActive: boolean;
    missionProgress: number; // 0–1
    /** tool_keys with at least one succeeded run */
    succeededToolKeys: string[];
  };
}

/* ─── Hook ──────────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useBusinessGraph(): BusinessGraph {
  const { user, currentOrgId } = useAuth();
  const userId = user?.id ?? "";
  const orgId = currentOrgId ?? "";

  const orgQ = useQuery({ ...organizationQuery(orgId), enabled: !!orgId });
  const runsQ = useQuery({ ...toolRunsQuery(orgId, 500), enabled: !!orgId });
  const leadsQ = useQuery({ ...leadsQuery(orgId), enabled: !!orgId });
  const kpisQ = useQuery({ ...mentorKPIsQuery(orgId), enabled: !!orgId });
  const missionQ = useQuery({ ...currentMissionQuery(userId), enabled: !!userId });
  const wsQ = useQuery({ ...workspaceStatusQuery(userId), enabled: !!userId });

  const automationsQ = useQuery({
    queryKey: ["business-graph-automations", userId],
    queryFn: async () => {
      const { data } = await db
        .from("automation_configs")
        .select("id, enabled")
        .eq("user_id", userId);
      return (data ?? []) as Array<{ id: string; enabled: boolean }>;
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  const isLoading = orgQ.isLoading || runsQ.isLoading || missionQ.isLoading;

  const org = orgQ.data as {
    name?: string;
    stage?: string;
    goal?: string;
  } | null;

  const ws = wsQ.data as { mode?: string; stage?: string } | null;
  const stage = (ws?.stage as BusinessStage) || (org?.stage as BusinessStage) || "Idea";
  const mode: BusinessMode = ws?.mode === "operate" ? "operate" : "create";

  /* ── Signals: what has the user actually done? ── */
  const runs = (runsQ.data ?? []) as Array<{ tool_key?: string; status: string }>;
  const succeededKeys = new Set(
    runs.filter((r) => r.status === "succeeded").map((r) => r.tool_key ?? ""),
  );

  const hasRunAny = (...keys: string[]) => keys.some((k) => succeededKeys.has(k));

  const leads = (leadsQ.data ?? []) as unknown[];
  const automations = automationsQ.data ?? [];
  const activeAutomationCount = automations.filter((a) => a.enabled).length;

  const mission = missionQ.data as {
    mission?: { title: string };
    steps?: Array<{ status: string }>;
  } | null;
  const missionSteps = mission?.steps ?? [];
  const missionDone = missionSteps.filter(
    (s) => s.status === "completed" || s.status === "skipped",
  ).length;

  const signals = {
    toolRunCount: runs.filter((r) => r.status === "succeeded").length,
    leadCount: leads.length,
    activeAutomationCount,
    hasOffer: hasRunAny("offer", "generate-offer"),
    hasGtm: hasRunAny("gtm-strategy", "gtm-strategy-builder", "generate-gtm-strategy"),
    hasValidatedIdea: hasRunAny("idea-validator", "validate-idea"),
    hasFollowupSequence: hasRunAny("followup", "generate-followup-sequence"),
    missionActive: !!mission?.mission,
    missionProgress: missionSteps.length > 0 ? missionDone / missionSteps.length : 0,
    succeededToolKeys: [...succeededKeys].filter(Boolean),
  };

  /* ── Key metrics: only the 3 numbers that matter for this mode ── */
  const kpis = kpisQ.data as { pipelineValue?: number; execIndex?: number } | undefined;
  const pipelineValue = kpis?.pipelineValue ?? 0;

  const metrics: KeyMetric[] =
    mode === "create"
      ? [
          {
            id: "pipeline",
            label: "Pipeline",
            value: pipelineValue > 0 ? `$${(pipelineValue / 1000).toFixed(1)}k` : "$0",
            target: "First revenue",
            status: pipelineValue > 0 ? "on-track" : "neutral",
            actionTo: "/app/nova/crm",
            actionLabel: "View pipeline",
          },
          {
            id: "leads",
            label: "Leads",
            value: String(signals.leadCount),
            target: "10",
            status:
              signals.leadCount >= 10 ? "on-track" : signals.leadCount > 0 ? "neutral" : "behind",
            actionTo: "/app/contacts",
            actionLabel: "Add leads",
          },
          {
            id: "execution",
            label: "Execution",
            value: `${signals.toolRunCount} runs`,
            status: signals.toolRunCount >= 3 ? "on-track" : "neutral",
            actionTo: "/app/mission-control",
            actionLabel: "Continue mission",
          },
        ]
      : [
          {
            id: "pipeline",
            label: "Pipeline",
            value: pipelineValue > 0 ? `$${(pipelineValue / 1000).toFixed(1)}k` : "$0",
            status: pipelineValue > 0 ? "on-track" : "neutral",
            actionTo: "/app/nova/crm",
            actionLabel: "View pipeline",
          },
          {
            id: "automations",
            label: "Automations",
            value: String(activeAutomationCount),
            target: "3+",
            status: activeAutomationCount >= 1 ? "on-track" : "behind",
            actionTo: "/app/automations",
            actionLabel: "Automate work",
          },
          {
            id: "leads",
            label: "Contacts",
            value: String(signals.leadCount),
            status: "neutral",
            actionTo: "/app/contacts",
            actionLabel: "View contacts",
          },
        ];

  /* ── Blockers: what's structurally in the way of progress? ── */
  const blockers: Blocker[] = [];

  if (mode === "create") {
    if (!signals.hasValidatedIdea && stage === "Idea") {
      blockers.push({
        id: "no-validation",
        severity: "critical",
        title: "Your idea is not checked yet",
        why: "Check it first, so you don't build something nobody wants.",
        resolveTo: "/app/outcomes/build",
        resolveLabel: "Check my idea",
        estimatedMinutes: 8,
      });
    }
    if (!signals.hasOffer && signals.hasValidatedIdea) {
      blockers.push({
        id: "no-offer",
        severity: "critical",
        title: "You don't have an offer yet",
        why: "You can't sell anything until you can say what it is and what it costs.",
        resolveTo: "/app/outcomes/build",
        resolveLabel: "Build my offer",
        estimatedMinutes: 30,
      });
    }
    if (signals.leadCount === 0 && signals.hasOffer) {
      blockers.push({
        id: "no-leads",
        severity: "high",
        title: "No leads saved yet",
        why: "You need people to talk to. Nova will help you find your first 10.",
        resolveTo: "/app/outcomes/launch",
        resolveLabel: "Find my first customers",
        estimatedMinutes: 15,
      });
    }
    if (signals.activeAutomationCount === 0 && signals.leadCount >= 3) {
      blockers.push({
        id: "no-automation",
        severity: "medium",
        title: "Follow-up is still by hand",
        why: "Leads go cold fast. Turn on follow-up so no one is forgotten.",
        resolveTo: "/app/automations",
        resolveLabel: "Turn on follow-up",
        estimatedMinutes: 15,
      });
    }
  } else {
    if (signals.activeAutomationCount === 0) {
      blockers.push({
        id: "no-automation",
        severity: "critical",
        title: "Nothing runs by itself yet",
        why: "Every task you do by hand eats your time. Automate one this week.",
        resolveTo: "/app/outcomes/automate",
        resolveLabel: "Automate one task",
        estimatedMinutes: 20,
      });
    }
    if (!signals.hasGtm) {
      blockers.push({
        id: "no-gtm",
        severity: "high",
        title: "Your growth plan is not written down",
        why: "If it only lives in your head, nobody can help you with it.",
        resolveTo: "/app/outcomes/optimize",
        resolveLabel: "Write the plan",
        estimatedMinutes: 30,
      });
    }
  }

  /* ── Recommendations: the next best moves, ranked ── */
  const recommendations: Recommendation[] = [];

  if (signals.missionActive && signals.missionProgress < 1) {
    recommendations.push({
      id: "continue-mission",
      title: `Keep going: ${mission?.mission?.title ?? "your current goal"}`,
      impact: "Finishing this is your fastest win",
      estimatedMinutes: 15,
      to: "/app/mission-control",
    });
  }
  if (signals.hasOffer && !signals.hasGtm) {
    recommendations.push({
      id: "gtm",
      title: "Make your customer plan",
      impact: "Know where to find customers and what to say",
      estimatedMinutes: 10,
      to: "/app/outcomes/launch",
    });
  }
  if (signals.hasGtm && !signals.hasFollowupSequence) {
    recommendations.push({
      id: "followup",
      title: "Set up your follow-up emails",
      impact: "Most people buy after 5 to 8 reminders — never lose a warm lead",
      estimatedMinutes: 15,
      to: "/app/outcomes/launch",
    });
  }
  if (signals.toolRunCount >= 3 && signals.activeAutomationCount === 0) {
    recommendations.push({
      id: "automate",
      title: "Turn on your first automation",
      impact: "Stop doing by hand what Nova can run for you",
      estimatedMinutes: 15,
      to: "/app/automations",
    });
  }
  if (recommendations.length === 0) {
    recommendations.push({
      id: "ask-nova",
      title: "Ask Nova what to do next",
      impact: "Nova looks at your business and picks your next move",
      estimatedMinutes: 2,
      to: "/app/mentor",
    });
  }

  return {
    isLoading,
    mode,
    stage,
    businessName: org?.name || "Your Business",
    goal: org?.goal || "",
    metrics,
    blockers: blockers.slice(0, 3),
    recommendations: recommendations.slice(0, 3),
    leads: leads as LeadRow[],
    signals,
  };
}
