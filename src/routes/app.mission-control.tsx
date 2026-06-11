// Mission Control — the command center of Nova OS.
// Redesigned per NOVA_OS_REDESIGN.md as the Founder's Logbook: a mission log
// (notebook paper, margin rules, handwritten notes) fused with solar-system
// telemetry (orbital score ring, stage planets, mono stamps).
//
// Answers, top to bottom:
//   1. Where am I?            → log header: business, stage, founder orbit
//   2. What matters most?     → telemetry strip (3 metrics from Business Graph)
//   3. What do I do now?      → today's entry: active mission + step guidance
//   4. What's in the way?     → flagged blockers (sticky notes)
//   5. What's next?           → Nova's recommended next moves

import { SectionTabs } from "@/components/app/SectionTabs";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useBusinessGraph } from "@/hooks/use-business-graph";
import { useFounderProgress } from "@/hooks/use-founder-progress";
import { FounderLevelBadge } from "@/components/app/gamification/FounderLevelBadge";
import { CurrentMissionCard } from "@/components/app/dashboard/CurrentMissionCard";
import {
  ArrowRight,
  AlertTriangle,
  Sparkles,
  Clock,
  Crosshair,
  Map,
  BookOpen,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/app/mission-control")({
  component: MissionControlPage,
});

const STAGES = ["Idea", "Validate", "Launch", "Operate", "Scale"] as const;

function MissionControlPage() {
  const { user, profile } = useAuth();
  const graph = useBusinessGraph();
  const progress = useFounderProgress();

  const name = profile?.full_name?.split(" ")[0] || "Founder";
  const today = new Date();
  const logDate = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;
  const stageIdx = Math.max(0, STAGES.indexOf(graph.stage));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <SectionTabs section="path" />

      {/* ════ 1 · LOG HEADER — where am I? ════ */}
      <div>
        <div className="logbook-tab" style={{ color: "var(--primary)" }}>
          <Crosshair className="h-3 w-3" />
          Mission Control
        </div>
        <div
          className="logbook-starfield rounded-tr-2xl rounded-b-2xl p-6 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in oklab, var(--primary) 7%, var(--surface)) 0%, var(--surface) 100%)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative">
            <div className="min-w-0">
              <div className="logbook-stamp mb-1.5">
                Log entry · {logDate} · {graph.businessName}
              </div>
              <h1
                className="font-display text-[22px] font-bold leading-tight"
                style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}
              >
                {greeting()}, {name}
              </h1>

              {/* Stage orbit map — planets along the journey */}
              <div className="mt-3 flex items-center gap-0">
                {STAGES.map((s, i) => (
                  <div key={s} className="flex items-center">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="rounded-full transition-all"
                        style={{
                          width: i === stageIdx ? 12 : 7,
                          height: i === stageIdx ? 12 : 7,
                          background:
                            i < stageIdx
                              ? "var(--success)"
                              : i === stageIdx
                                ? "var(--primary)"
                                : "color-mix(in oklab, var(--foreground) 18%, transparent)",
                          boxShadow:
                            i === stageIdx
                              ? "0 0 10px color-mix(in oklab, var(--primary) 60%, transparent)"
                              : "none",
                        }}
                      />
                    </div>
                    {i < STAGES.length - 1 && (
                      <div
                        className="h-px w-7 md:w-10"
                        style={{
                          background:
                            i < stageIdx
                              ? "var(--success)"
                              : "color-mix(in oklab, var(--foreground) 14%, transparent)",
                        }}
                      />
                    )}
                  </div>
                ))}
                <span className="logbook-stamp ml-3" style={{ color: "var(--primary)" }}>
                  {graph.stage}
                </span>
              </div>

              {/* Handwritten goal in the margin */}
              {graph.goal && (
                <div
                  className="logbook-hand mt-2.5"
                  style={{ color: "color-mix(in oklab, var(--warning) 80%, var(--foreground))" }}
                >
                  goal: {graph.goal}
                </div>
              )}
            </div>

            {/* Founder score — orbital ring */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="logbook-orbit relative flex items-center justify-center">
                <svg width="76" height="76" className="shrink-0 -rotate-90">
                  <circle
                    cx="38"
                    cy="38"
                    r="30"
                    fill="none"
                    stroke="color-mix(in oklab, var(--foreground) 8%, transparent)"
                    strokeWidth="5"
                  />
                  <circle
                    cx="38"
                    cy="38"
                    r="30"
                    fill="none"
                    stroke="url(#mcScoreGrad)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${(progress.founderScore / 100) * 188} 188`}
                    style={{ transition: "stroke-dasharray 1s ease" }}
                  />
                  <defs>
                    <linearGradient id="mcScoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--primary)" />
                      <stop offset="100%" stopColor="var(--orbit-accent)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className="font-mono font-black text-[17px] leading-none"
                    style={{ color: "var(--primary)" }}
                  >
                    {progress.founderScore}
                  </span>
                  <span className="logbook-stamp" style={{ fontSize: 7.5 }}>
                    Score
                  </span>
                </div>
              </div>
              {!progress.isLoading && (
                <FounderLevelBadge
                  level={progress.level}
                  levelLabel={progress.levelLabel}
                  size="md"
                  showProgress
                  xpProgressInLevel={progress.xpProgressInLevel}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ════ 2 · TELEMETRY STRIP — what matters most? ════ */}
      <div className="grid grid-cols-3 gap-3">
        {graph.metrics.map((m) => (
          <Link
            key={m.id}
            to={m.actionTo}
            className="nova-card nova-card-hover rounded-xl p-4 group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="logbook-stamp">{m.label}</span>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background:
                    m.status === "on-track"
                      ? "var(--success)"
                      : m.status === "behind"
                        ? "var(--warning)"
                        : "color-mix(in oklab, var(--foreground) 25%, transparent)",
                }}
              />
            </div>
            <div
              className="font-mono font-black text-[22px] leading-none"
              style={{ color: "var(--foreground)" }}
            >
              {m.value}
              {m.target && (
                <span
                  className="text-[11px] font-medium ml-1.5"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  / {m.target}
                </span>
              )}
            </div>
            <div
              className="mt-2 text-[10.5px] opacity-60 group-hover:opacity-100 transition-opacity"
              style={{ color: "var(--primary)" }}
            >
              {m.actionLabel} →
            </div>
          </Link>
        ))}
      </div>

      {/* ════ 3 · TODAY'S ENTRY — what do I do now? ════ */}
      <div>
        <div className="flex items-baseline justify-between mb-2 px-1">
          <span className="logbook-stamp">Today's entry — active mission</span>
          <Link
            to="/app/launchpad-path"
            className="text-[11.5px] font-medium"
            style={{ color: "var(--muted-foreground)" }}
          >
            View full journey →
          </Link>
        </div>
        {user?.id && <CurrentMissionCard userId={user.id} />}
      </div>

      {/* ════ 4 · FLAGGED — what's in the way? ════ */}
      {graph.blockers.length > 0 && (
        <div>
          <div className="logbook-stamp mb-2 px-1">Flagged in the margin — blockers</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {graph.blockers.map((b) => (
              <div key={b.id} className="logbook-sticky p-4">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle
                    className="h-4 w-4 shrink-0 mt-0.5"
                    style={{
                      color: b.severity === "critical" ? "var(--destructive)" : "var(--warning)",
                    }}
                  />
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
                      {b.title}
                    </div>
                    <div
                      className="text-[12px] leading-[1.55] mt-1"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {b.why}
                    </div>
                    <Link
                      to={b.resolveTo}
                      className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] font-bold"
                      style={{ color: "var(--primary)" }}
                    >
                      {b.resolveLabel} · ~{b.estimatedMinutes} min
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════ 5 · NEXT MOVES — Nova's recommendations ════ */}
      <div className="logbook-page logbook-torn">
        <div className="pl-[60px] pr-5 py-5 relative">
          <div
            className="absolute left-0 top-5 w-[44px] flex justify-center"
            style={{ color: "var(--primary)" }}
          >
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="logbook-stamp mb-3">Nova recommends — next moves</div>
          <div className="space-y-3">
            {graph.recommendations.map((r) => (
              <Link key={r.id} to={r.to} className="logbook-check group">
                <div className="logbook-check-box" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span
                      className="text-[13.5px] font-semibold group-hover:underline"
                      style={{ color: "var(--foreground)" }}
                    >
                      {r.title}
                    </span>
                    <span className="logbook-stamp shrink-0 inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {r.estimatedMinutes}m
                    </span>
                  </div>
                  <div className="text-[12px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                    {r.impact}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ════ Footer — condensed quick nav ════ */}
      <div className="flex flex-wrap items-center gap-2 pb-4">
        {[
          { to: "/app/galaxy", label: "Galaxy Map", icon: Map },
          { to: "/app/academy", label: "Academy", icon: BookOpen },
          { to: "/app/automations", label: "Automations", icon: Zap },
          { to: "/app/mentor", label: "Ask Nova", icon: Sparkles },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-medium nova-card nova-card-hover"
            style={{ color: "var(--muted-foreground)" }}
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
