// Roadmap item: "Unified launch control center"
// Aggregates setup-checklist progress, KPIs, the analytics/tools install checklist,
// and the feedback/insights capture loop into one command-center-style page.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import {
  setupChecklistQuery,
  mentorKPIsQuery,
  launchControlExtrasQuery,
  currentMissionQuery,
  type MentorInsight,
} from "@/lib/queries";
import { SetupChecklistCard } from "@/components/app/dashboard/SetupChecklistCard";
import {
  Crosshair,
  ListChecks,
  Activity,
  TrendingUp,
  Zap,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  ThumbsUp,
  ThumbsDown,
  Signal,
  AlertTriangle,
  Plug,
} from "lucide-react";

export const Route = createFileRoute("/app/launch-control")({
  component: LaunchControlPage,
});

const INSIGHT_META: Record<MentorInsight["type"], { icon: typeof Signal; color: string }> = {
  signal: { icon: Signal, color: "#7DD3FC" },
  opportunity: { icon: ArrowUpRight, color: "#34D399" },
  warning: { icon: AlertTriangle, color: "#F5A623" },
  recommendation: { icon: Zap, color: "#A78BFA" },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[10px] font-bold uppercase tracking-widest mb-3"
      style={{ color: "var(--muted-foreground)" }}
    >
      {children}
    </div>
  );
}

function LaunchControlPage() {
  const { currentOrgId, user, currentOrg } = useAuth();
  const orgId = currentOrgId ?? "";
  const userId = user?.id ?? "";

  const checklistQ = useQuery({ ...setupChecklistQuery(orgId), enabled: !!orgId });
  const kpisQ = useQuery({ ...mentorKPIsQuery(orgId), enabled: !!orgId });
  const extrasQ = useQuery({ ...launchControlExtrasQuery(orgId, userId), enabled: !!orgId });
  const missionQ = useQuery({ ...currentMissionQuery(userId), enabled: !!userId });

  const items = checklistQ.data ?? [];
  const checklistDone = items.filter((i) => i.status === "done").length;
  const kpis = kpisQ.data;
  const extras = extrasQ.data;

  const missionSteps = (missionQ.data?.steps ?? []) as Array<{
    id: string;
    title: string;
    status: string;
    tool_key: string | null;
  }>;
  const pendingSteps = missionSteps.filter(
    (s) => s.status === "pending" || s.status === "in_progress",
  );
  const pendingChecklist = items.filter((i) => i.status !== "done").slice(0, 4);

  const orgName = (currentOrg as { name?: string } | null)?.name || "your company";

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden nova-bracket"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,107,26,0.08) 0%, rgba(245,166,35,0.04) 100%)",
          border: "1px solid rgba(249,115,22,0.18)",
        }}
      >
        <div
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)",
          }}
        />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div
              className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-widest mb-1"
              style={{ color: "rgba(249,115,22,0.65)" }}
            >
              <Crosshair className="h-3 w-3" />
              Launch Control
            </div>
            <h1
              className="font-display text-[22px] font-bold leading-tight"
              style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}
            >
              Everything you need to launch {orgName}
            </h1>
            <p className="text-[13px] mt-1" style={{ color: "var(--muted-foreground)" }}>
              Setup checklist, next actions, install status, and feedback — in one place.
            </p>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Setup Progress",
            value: `${checklistDone}/${items.length || 0}`,
            icon: ListChecks,
            color: "#34D399",
            action: "Business setup checklist",
          },
          {
            label: "Next Actions",
            value: pendingSteps.length + pendingChecklist.length,
            icon: Activity,
            color: "#7DD3FC",
            action: "Steps + checklist items open",
          },
          {
            label: "Exec Score",
            value: kpis?.execIndex ?? 0,
            suffix: "/100",
            icon: TrendingUp,
            color: "#FF6B1A",
            action: "From mission control",
          },
          {
            label: "Tools Run",
            value: kpis?.completedRuns ?? 0,
            icon: Zap,
            color: "#F5A623",
            action: "Completed tool runs",
          },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl p-4 nova-card nova-card-hover">
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[9px] font-bold uppercase tracking-widest"
                style={{ color: "var(--muted-foreground)" }}
              >
                {kpi.label}
              </span>
              <kpi.icon className="h-3.5 w-3.5" style={{ color: kpi.color, opacity: 0.7 }} />
            </div>
            <div
              className="font-mono font-black text-[24px] leading-none"
              style={{ color: kpi.color }}
            >
              {kpi.value}
              {kpi.suffix && (
                <span
                  className="text-[13px] font-medium"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {kpi.suffix}
                </span>
              )}
            </div>
            <div className="mt-2 text-[10px]" style={{ color: "rgba(237,232,223,0.30)" }}>
              {kpi.action}
            </div>
          </div>
        ))}
      </div>

      {/* items-start: keep the shorter side panel from stretching to the checklist's height */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 rounded-xl p-5 nova-card">
          <div className="flex items-center justify-between mb-1">
            <SectionLabel>Business Setup Checklist</SectionLabel>
          </div>
          {checklistQ.isLoading ? (
            <div
              className="py-8 text-center text-[12px]"
              style={{ color: "var(--muted-foreground)" }}
            >
              Loading your checklist…
            </div>
          ) : (
            <SetupChecklistCard
              orgId={orgId}
              items={items}
              onChanged={() => void checklistQ.refetch()}
            />
          )}
        </div>

        <div className="rounded-xl p-5 nova-card flex flex-col gap-4">
          <SectionLabel>Next Actions</SectionLabel>
          {pendingSteps.length === 0 && pendingChecklist.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle2 className="h-8 w-8 mb-2" style={{ color: "#34D399" }} />
              <div className="text-[13px] font-semibold" style={{ color: "#34D399" }}>
                You're all caught up
              </div>
              <p className="text-[11px] mt-1" style={{ color: "var(--muted-foreground)" }}>
                No open mission steps or checklist items right now.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {pendingSteps.slice(0, 4).map((step) => (
                <Link
                  key={step.id}
                  to="/app/mission-control"
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-surface-2"
                >
                  <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span
                    className="flex-1 text-[12.5px] truncate"
                    style={{ color: "var(--foreground)" }}
                  >
                    {step.title}
                  </span>
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider shrink-0"
                    style={{ color: "#7DD3FC" }}
                  >
                    Mission
                  </span>
                </Link>
              ))}
              {pendingChecklist.map((item) => (
                <div key={item.id} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
                  <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span
                    className="flex-1 text-[12.5px] truncate"
                    style={{ color: "var(--foreground)" }}
                  >
                    {item.label}
                  </span>
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider shrink-0"
                    style={{ color: "#34D399" }}
                  >
                    Setup
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link
            to="/app/mission-control"
            className="flex items-center gap-1.5 text-[11.5px] font-medium"
            style={{ color: "var(--muted-foreground)" }}
          >
            View current mission
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Secondary row: install checklist + feedback loop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5 nova-card">
          <div className="flex items-center justify-between mb-1">
            <SectionLabel>Analytics &amp; Tools Install Checklist</SectionLabel>
            <Link
              to="/app/integrations"
              className="flex items-center gap-1 text-[11px] font-medium"
              style={{ color: "var(--primary)" }}
            >
              <Plug className="h-3 w-3" />
              Manage
            </Link>
          </div>
          <div className="space-y-1.5 mt-2">
            {(extras?.analyticsChecklist ?? []).map((a) => (
              <div key={a.key} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
                {a.connected ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "var(--success)" }} />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span
                  className={
                    a.connected
                      ? "text-[13px] text-muted-foreground line-through"
                      : "text-[13px] text-foreground"
                  }
                >
                  {a.label}
                </span>
                {!a.connected && (
                  <span
                    className="ml-auto text-[9px] font-bold uppercase tracking-wider shrink-0"
                    style={{ color: "var(--warning)" }}
                  >
                    Not connected
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-5 nova-card">
          <SectionLabel>Feedback &amp; Signals</SectionLabel>
          {(extras?.feedback.length ?? 0) === 0 && (extras?.insights.length ?? 0) === 0 ? (
            <div
              className="py-6 text-center text-[12px]"
              style={{ color: "var(--muted-foreground)" }}
            >
              Run tools and react with 👍/👎 — your feedback and agent signals will surface here.
            </div>
          ) : (
            <div className="space-y-1.5">
              {(extras?.feedback ?? []).slice(0, 3).map((f) => (
                <div key={f.runId} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
                  {f.feedback === "up" ? (
                    <ThumbsUp
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: "var(--success)" }}
                    />
                  ) : (
                    <ThumbsDown
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: "var(--destructive)" }}
                    />
                  )}
                  <span
                    className="flex-1 text-[12.5px] truncate"
                    style={{ color: "var(--foreground)" }}
                  >
                    {f.toolKey.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                  <span
                    className="text-[10px] shrink-0"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {f.feedbackAt ? new Date(f.feedbackAt).toLocaleDateString() : ""}
                  </span>
                </div>
              ))}
              {(extras?.insights ?? []).slice(0, 3).map((ins) => {
                const meta = INSIGHT_META[ins.type];
                const Icon = meta.icon;
                return (
                  <div key={ins.id} className="flex items-start gap-2.5 rounded-lg px-2.5 py-2">
                    <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: meta.color }} />
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-[12.5px] font-medium truncate"
                        style={{ color: "var(--foreground)" }}
                      >
                        {ins.title}
                      </div>
                      <div
                        className="text-[11px] truncate"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {ins.detail}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <Link
            to="/app/mentor"
            className="flex items-center gap-1.5 text-[11.5px] font-medium mt-4"
            style={{ color: "var(--muted-foreground)" }}
          >
            Open Mentor for full insight history
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
