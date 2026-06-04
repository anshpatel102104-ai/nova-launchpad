import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import {
  organizationQuery,
  toolRunsQuery,
  leadsQuery,
  mentorKPIsQuery,
} from "@/lib/queries";
import { useFounderProgress } from "@/hooks/use-founder-progress";
import { FounderLevelBadge } from "@/components/app/gamification/FounderLevelBadge";
import { CurrentMissionCard } from "@/components/app/dashboard/CurrentMissionCard";
import { WhatNextCard } from "@/components/app/dashboard/WhatNextCard";
import { AutomationStatusCard } from "@/components/app/dashboard/AutomationStatusCard";
import { ApprovedOfferCard } from "@/components/app/dashboard/ApprovedOfferCard";
import {
  Target,
  Zap,
  TrendingUp,
  Users,
  ArrowRight,
  Map,
  BookOpen,
  Rocket,
  Crosshair,
  Activity,
} from "lucide-react";

export const Route = createFileRoute("/app/mission-control")({
  component: MissionControlPage,
});

function MissionControlPage() {
  const { currentOrgId, user, profile } = useAuth();
  const progress = useFounderProgress();

  const orgQ = useQuery({ ...organizationQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const kpisQ = useQuery({ ...mentorKPIsQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const leadsQ = useQuery({ ...leadsQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const runsQ = useQuery({ ...toolRunsQuery(currentOrgId ?? "", 10), enabled: !!currentOrgId });

  const org = orgQ.data as { name?: string; stage?: string; goal?: string } | null;
  const kpis = kpisQ.data;
  const leads = leadsQ.data ?? [];
  const recentRuns = runsQ.data ?? [];

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  const name = profile?.full_name?.split(" ")[0] || "Founder";

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
        {/* Ambient glow */}
        <div
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)",
          }}
        />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div
              className="text-[11px] font-mono font-bold uppercase tracking-widest mb-1"
              style={{ color: "rgba(249,115,22,0.65)" }}
            >
              ● Mission Control
            </div>
            <h1
              className="font-display text-[22px] font-bold leading-tight"
              style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}
            >
              {greeting}, {name}
            </h1>
            <p className="text-[13px] mt-1" style={{ color: "var(--muted-foreground)" }}>
              {org?.goal || `Stage: ${org?.stage || "Idea"} · ${org?.name || "Your Company"}`}
            </p>
          </div>

          {/* Founder Score ring */}
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center">
              <svg width="80" height="80" className="shrink-0 -rotate-90">
                <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(245,200,140,0.08)" strokeWidth="6" />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  fill="none"
                  stroke="url(#scoreGrad)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${(progress.founderScore / 100) * 201} 201`}
                  style={{ transition: "stroke-dasharray 1s ease" }}
                />
                <defs>
                  <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FF6B1A" />
                    <stop offset="100%" stopColor="#F5A623" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="font-mono font-black text-[18px] leading-none"
                  style={{ color: "var(--primary)" }}
                >
                  {progress.founderScore}
                </span>
                <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                  Score
                </span>
              </div>
            </div>

            {!progress.isLoading && (
              <div className="flex flex-col gap-1.5">
                <FounderLevelBadge
                  level={progress.level}
                  levelLabel={progress.levelLabel}
                  size="md"
                  showProgress
                  xpProgressInLevel={progress.xpProgressInLevel}
                />
                <div className="text-[10px] font-mono" style={{ color: "var(--muted-foreground)" }}>
                  {progress.totalXP.toLocaleString()} XP total
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Exec Score",
            value: kpis?.execIndex ?? 0,
            suffix: "/100",
            icon: Activity,
            color: "#FF6B1A",
            action: "Run more tools",
          },
          {
            label: "Pipeline",
            value: kpis ? `$${(kpis.pipelineValue / 1000).toFixed(1)}k` : "—",
            suffix: "",
            icon: TrendingUp,
            color: "#34D399",
            action: "View pipeline",
          },
          {
            label: "Total Leads",
            value: leads.length,
            suffix: "",
            icon: Users,
            color: "#7DD3FC",
            action: "Capture leads",
          },
          {
            label: "Tools Used",
            value: kpis?.completedRuns ?? 0,
            suffix: "",
            icon: Zap,
            color: "#F5A623",
            action: "Run a tool",
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl p-4 nova-card nova-card-hover"
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[9px] font-bold uppercase tracking-widest"
                style={{ color: "var(--muted-foreground)" }}
              >
                {kpi.label}
              </span>
              <kpi.icon
                className="h-3.5 w-3.5"
                style={{ color: kpi.color, opacity: 0.7 }}
              />
            </div>
            <div
              className="font-mono font-black text-[24px] leading-none"
              style={{ color: kpi.color }}
            >
              {kpi.value}
              {kpi.suffix && (
                <span className="text-[13px] font-medium" style={{ color: "var(--muted-foreground)" }}>
                  {kpi.suffix}
                </span>
              )}
            </div>
            <div
              className="mt-2 text-[10px]"
              style={{ color: "rgba(237,232,223,0.30)" }}
            >
              {kpi.action} →
            </div>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Current Mission — spans 2 cols */}
        <div className="lg:col-span-2">
          {user?.id && <CurrentMissionCard userId={user.id} />}
        </div>

        {/* What Next panel */}
        <div>
          {currentOrgId && user?.id && (
            <WhatNextCard orgId={currentOrgId} userId={user.id} />
          )}
        </div>
      </div>

      {/* Secondary row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {currentOrgId && (
          <>
            <AutomationStatusCard orgId={currentOrgId} />
            <ApprovedOfferCard orgId={currentOrgId} />
          </>
        )}
      </div>

      {/* Quick navigation strip */}
      <div>
        <div
          className="mb-3 text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "var(--muted-foreground)" }}
        >
          Quick Navigation
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: "/app/mission-briefing", label: "Mission Briefing", icon: Crosshair, color: "#FF6B1A", desc: "Plan strategy" },
            { to: "/app/academy", label: "Academy", icon: BookOpen, color: "#7DD3FC", desc: "Learn & execute" },
            { to: "/app/galaxy", label: "Galaxy Map", icon: Map, color: "#A78BFA", desc: "View progress" },
            { to: "/app/scale", label: "Scale Mode", icon: Rocket, color: "#F5A623", desc: "CRM & automation" },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 rounded-xl p-3 transition-all nova-card nova-card-hover group"
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: `color-mix(in oklab, ${item.color} 12%, transparent)`,
                  border: `1px solid color-mix(in oklab, ${item.color} 25%, transparent)`,
                }}
              >
                <item.icon className="h-4 w-4" style={{ color: item.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold truncate" style={{ color: "var(--foreground)" }}>
                  {item.label}
                </div>
                <div className="text-[10px] truncate" style={{ color: "var(--muted-foreground)" }}>
                  {item.desc}
                </div>
              </div>
              <ArrowRight className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: item.color }} />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      {recentRuns.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "var(--muted-foreground)" }}
            >
              Recent Tool Runs
            </div>
            <Link
              to="/app/launchpad/history"
              className="text-[11px] font-medium transition"
              style={{ color: "var(--primary)" }}
            >
              View all →
            </Link>
          </div>
          <div className="space-y-1.5">
            {recentRuns.slice(0, 5).map((run: {
              id: string;
              tool_key?: string;
              status: string;
              created_at: string;
            }) => (
              <div
                key={run.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2 nova-card"
              >
                <div
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    background:
                      run.status === "succeeded"
                        ? "var(--success)"
                        : run.status === "failed"
                          ? "var(--destructive)"
                          : "var(--warning)",
                  }}
                />
                <span
                  className="flex-1 text-[12px] font-medium truncate"
                  style={{ color: "var(--foreground)" }}
                >
                  {(run.tool_key ?? "tool").replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                </span>
                <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                  {new Date(run.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
