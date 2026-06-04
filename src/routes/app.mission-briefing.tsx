import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { organizationQuery } from "@/lib/queries";
import { useFounderProgress } from "@/hooks/use-founder-progress";
import { ACADEMY_MODULES, getModuleState } from "@/lib/academy-modules";
import { toolRunsQuery } from "@/lib/queries";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Crosshair,
  Target,
  Users,
  TrendingUp,
  Zap,
  Map,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/mission-briefing")({
  component: MissionBriefingPage,
});

const STAGES = ["Idea", "Validate", "Launch", "Operate", "Scale"] as const;
type Stage = (typeof STAGES)[number];

const STAGE_DESCRIPTIONS: Record<Stage, string> = {
  Idea: "You have an idea but haven't validated it yet",
  Validate: "You're testing with early customers or prospects",
  Launch: "You have paying customers and are growing",
  Operate: "You have repeatable revenue and are optimizing",
  Scale: "You're scaling aggressively with systems in place",
};

const STAGE_COLORS: Record<Stage, string> = {
  Idea: "#7DD3FC",
  Validate: "#A78BFA",
  Launch: "#FB923C",
  Operate: "#34D399",
  Scale: "#FF6B1A",
};

function MissionBriefingPage() {
  const { currentOrgId } = useAuth();
  const navigate = useNavigate();
  const progress = useFounderProgress();

  const orgQ = useQuery({ ...organizationQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const runsQ = useQuery({ ...toolRunsQuery(currentOrgId ?? "", 500), enabled: !!currentOrgId });

  const org = orgQ.data as {
    name?: string;
    stage?: string;
    goal?: string;
    niche?: string;
    target_customer?: string;
  } | null;

  const completedSlugs = new Set(
    (runsQ.data ?? [])
      .filter((r: { status: string }) => r.status === "succeeded")
      .map((r: { tool_key?: string }) => r.tool_key ?? ""),
  );
  const orgStage = org?.stage ?? "Idea";

  const moduleStates = ACADEMY_MODULES.map((m) => ({
    module: m,
    state: getModuleState(m, completedSlugs, orgStage),
  }));

  const nextModule = moduleStates.find((ms) => ms.state === "available" || ms.state === "active");

  const completedCount = moduleStates.filter(
    (ms) => ms.state === "complete" || ms.state === "mastered",
  ).length;

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-2">
      {/* Header */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,107,26,0.10) 0%, rgba(245,166,35,0.05) 100%)",
          border: "1px solid rgba(249,115,22,0.20)",
        }}
      >
        <div
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 70%)",
          }}
        />
        <div className="relative">
          <div
            className="text-[10px] font-mono font-bold uppercase tracking-widest mb-1"
            style={{ color: "rgba(249,115,22,0.65)" }}
          >
            ● Mission Briefing
          </div>
          <h1
            className="font-display text-[24px] font-bold mb-2"
            style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}
          >
            Your Founder Mission
          </h1>
          <p className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>
            Your AI-powered strategy overview. Update your mission parameters and launch your next
            campaign.
          </p>
        </div>
      </div>

      {/* Business overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Business summary */}
        <div className="md:col-span-2 rounded-xl p-5 nova-card space-y-4">
          <div
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "var(--muted-foreground)" }}
          >
            Business Overview
          </div>

          <div className="space-y-3">
            <div>
              <div
                className="text-[10.5px] font-semibold mb-1"
                style={{ color: "var(--muted-foreground)" }}
              >
                Company
              </div>
              <div className="text-[15px] font-bold" style={{ color: "var(--foreground)" }}>
                {org?.name || "—"}
              </div>
            </div>

            <div>
              <div
                className="text-[10.5px] font-semibold mb-1"
                style={{ color: "var(--muted-foreground)" }}
              >
                Mission
              </div>
              <div className="text-[13.5px]" style={{ color: "var(--foreground)" }}>
                {org?.goal || "No mission statement set yet"}
              </div>
            </div>

            {org?.niche && (
              <div>
                <div
                  className="text-[10.5px] font-semibold mb-1"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Market / Niche
                </div>
                <div className="text-[13.5px]" style={{ color: "var(--foreground)" }}>
                  {org.niche}
                </div>
              </div>
            )}

            {org?.target_customer && (
              <div>
                <div
                  className="text-[10.5px] font-semibold mb-1"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Target Customer
                </div>
                <div className="text-[13.5px]" style={{ color: "var(--foreground)" }}>
                  {org.target_customer}
                </div>
              </div>
            )}
          </div>

          <Link
            to="/app/settings"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium transition"
            style={{ color: "var(--primary)" }}
          >
            Edit in Settings <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Stage indicator */}
        <div className="rounded-xl p-5 nova-card flex flex-col">
          <div
            className="text-[10px] font-bold uppercase tracking-widest mb-4"
            style={{ color: "var(--muted-foreground)" }}
          >
            Current Stage
          </div>

          <div className="space-y-2 flex-1">
            {STAGES.map((s) => {
              const isActive = s === orgStage;
              const isPast = STAGES.indexOf(s) < STAGES.indexOf(orgStage as Stage);
              return (
                <div
                  key={s}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 transition-all"
                  style={{
                    background: isActive
                      ? `color-mix(in oklab, ${STAGE_COLORS[s]} 12%, transparent)`
                      : "transparent",
                    border: `1px solid ${isActive ? `color-mix(in oklab, ${STAGE_COLORS[s]} 30%, transparent)` : "transparent"}`,
                  }}
                >
                  {isPast || isActive ? (
                    <CheckCircle2
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: isPast ? "#34D399" : STAGE_COLORS[s] }}
                    />
                  ) : (
                    <div
                      className="h-3.5 w-3.5 rounded-full shrink-0"
                      style={{ border: "1.5px solid rgba(245,200,140,0.18)" }}
                    />
                  )}
                  <span
                    className="text-[12.5px] font-medium"
                    style={{
                      color: isActive
                        ? STAGE_COLORS[s]
                        : isPast
                          ? "var(--foreground)"
                          : "var(--muted-foreground)",
                      fontWeight: isActive ? 700 : 500,
                    }}
                  >
                    {s}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Founder stats */}
      {!progress.isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Founder Level",
              value: `L${progress.level}`,
              sub: progress.levelLabel,
              color: "#FF6B1A",
              icon: Zap,
            },
            {
              label: "Total XP",
              value: progress.totalXP.toLocaleString(),
              sub: "experience points",
              color: "#F5A623",
              icon: TrendingUp,
            },
            {
              label: "Modules Done",
              value: `${completedCount}/${ACADEMY_MODULES.length}`,
              sub: "academy modules",
              color: "#34D399",
              icon: CheckCircle2,
            },
            {
              label: "Founder Score",
              value: progress.founderScore,
              sub: "out of 100",
              color: "#7DD3FC",
              icon: Target,
            },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl p-4 nova-card">
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-[9px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {stat.label}
                </span>
                <stat.icon className="h-3.5 w-3.5" style={{ color: stat.color, opacity: 0.7 }} />
              </div>
              <div
                className="font-mono font-black text-[22px] leading-none"
                style={{ color: stat.color }}
              >
                {stat.value}
              </div>
              <div className="mt-1 text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                {stat.sub}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Campaign progress */}
      <div className="rounded-xl p-5 nova-card">
        <div className="flex items-center justify-between mb-4">
          <div
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "var(--muted-foreground)" }}
          >
            Academy Campaign
          </div>
          <span className="text-[11px] font-mono" style={{ color: "var(--muted-foreground)" }}>
            {completedCount}/{ACADEMY_MODULES.length} modules
          </span>
        </div>

        <div className="space-y-2.5">
          {moduleStates.map(({ module, state }) => {
            const stateColors = {
              locked: "#4B5563",
              available: "#9CA3AF",
              active: "#FF6B1A",
              complete: "#34D399",
              mastered: "#FBBF24",
            };
            const color = stateColors[state];

            return (
              <div key={module.id} className="flex items-center gap-3">
                <span className="text-[14px] shrink-0 w-6">{module.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-[12px] font-medium truncate"
                      style={{
                        color: state === "locked" ? "var(--muted-foreground)" : "var(--foreground)",
                      }}
                    >
                      {module.title}
                    </span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wide shrink-0"
                      style={{ color }}
                    >
                      {state === "complete"
                        ? "✓ Done"
                        : state === "active"
                          ? "In Progress"
                          : state === "locked"
                            ? "Locked"
                            : "Available"}
                    </span>
                  </div>
                  <div
                    className="mt-1 rounded-full overflow-hidden"
                    style={{ height: 2, background: "rgba(245,200,140,0.08)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width:
                          state === "complete"
                            ? "100%"
                            : state === "active"
                              ? `${(module.tools.filter((t) => completedSlugs.has(t)).length / module.tools.length) * 100}%`
                              : "0%",
                        background: color,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {nextModule ? (
          <Link
            to="/app/academy/$module"
            params={{ module: nextModule.module.id }}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[13.5px] font-semibold btn-execute"
          >
            <span>{nextModule.module.emoji}</span>
            {nextModule.state === "active" ? "Continue" : "Start"} {nextModule.module.title}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <button
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[13.5px] font-semibold btn-execute"
            onClick={() => navigate({ to: "/app/mission-control" })}
          >
            <Rocket className="h-4 w-4" />
            All modules complete — go to Mission Control
          </button>
        )}

        <Link
          to="/app/galaxy"
          className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13px] font-semibold nova-card nova-card-hover"
        >
          <Map className="h-4 w-4" style={{ color: "#A78BFA" }} />
          View Galaxy Map
        </Link>

        <Link
          to="/app/mission-control"
          className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13px] font-semibold nova-card nova-card-hover"
        >
          <Crosshair className="h-4 w-4" style={{ color: "#34D399" }} />
          Mission Control
        </Link>
      </div>
    </div>
  );
}
