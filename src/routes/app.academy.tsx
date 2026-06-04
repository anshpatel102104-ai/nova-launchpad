import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { toolRunsQuery, organizationQuery } from "@/lib/queries";
import { ACADEMY_MODULES, getModuleState, type ModuleState } from "@/lib/academy-modules";
import { useFounderProgress } from "@/hooks/use-founder-progress";
import { CheckCircle2, Lock, ArrowRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/academy")({
  component: AcademyLayout,
});

const STATE_COLORS: Record<ModuleState, string> = {
  locked: "#4B5563",
  available: "#9CA3AF",
  active: "#FF6B1A",
  complete: "#34D399",
  mastered: "#FBBF24",
};

const STATE_BG: Record<ModuleState, string> = {
  locked: "var(--module-locked)",
  available: "var(--module-available)",
  active: "var(--module-active)",
  complete: "var(--module-complete)",
  mastered: "var(--module-mastered)",
};

function AcademyLayout() {
  const routerState = useRouterState({ select: (s) => s.location.pathname });
  const isIndex = routerState === "/app/academy" || routerState === "/app/academy/";

  const { currentOrgId } = useAuth();
  const progress = useFounderProgress();

  const runsQ = useQuery({ ...toolRunsQuery(currentOrgId ?? "", 500), enabled: !!currentOrgId });
  const orgQ = useQuery({ ...organizationQuery(currentOrgId ?? ""), enabled: !!currentOrgId });

  const completedSlugs = new Set(
    (runsQ.data ?? [])
      .filter((r: { status: string }) => r.status === "succeeded")
      .map((r: { tool_key?: string }) => r.tool_key ?? ""),
  );
  const orgStage = (orgQ.data as { stage?: string } | null)?.stage ?? "Idea";

  const moduleStates = ACADEMY_MODULES.map((m) => ({
    module: m,
    state: getModuleState(m, completedSlugs, orgStage),
  }));

  const completedCount = moduleStates.filter((ms) => ms.state === "complete" || ms.state === "mastered").length;

  return (
    <div className="flex gap-6 min-h-[calc(100vh-7rem)]">
      {/* LEFT: Campaign map */}
      <aside
        className="hidden md:flex flex-col shrink-0 gap-1.5"
        style={{ width: 220 }}
      >
        <div className="mb-3">
          <div
            className="text-[9px] font-bold uppercase tracking-widest mb-1"
            style={{ color: "var(--muted-foreground)" }}
          >
            Campaign Progress
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex-1 overflow-hidden rounded-full"
              style={{ height: 3, background: "rgba(245,200,140,0.08)" }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{
                  width: `${(completedCount / ACADEMY_MODULES.length) * 100}%`,
                  background: "linear-gradient(90deg, var(--primary), var(--accent))",
                  boxShadow: "0 0 8px rgba(249,115,22,0.55)",
                }}
              />
            </div>
            <span className="text-[10px] font-mono shrink-0" style={{ color: "var(--muted-foreground)" }}>
              {completedCount}/{ACADEMY_MODULES.length}
            </span>
          </div>
        </div>

        {moduleStates.map(({ module, state }, i) => {
          const isActive = routerState.includes(module.id);
          return (
            <Link
              key={module.id}
              to="/app/academy/$module"
              params={{ module: module.id }}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all module-reveal",
                state === "locked" && "pointer-events-none opacity-50",
              )}
              style={{
                background: isActive
                  ? `color-mix(in oklab, ${STATE_COLORS[state]} 12%, var(--surface))`
                  : STATE_BG[state],
                border: `1px solid ${isActive ? `color-mix(in oklab, ${STATE_COLORS[state]} 35%, transparent)` : "var(--border)"}`,
                ["--i" as string]: i,
              } as React.CSSProperties}
            >
              <span className="text-[16px] shrink-0">{module.emoji}</span>
              <div className="min-w-0 flex-1">
                <div
                  className="text-[11.5px] font-semibold truncate leading-tight"
                  style={{ color: state === "locked" ? "var(--muted-foreground)" : "var(--foreground)" }}
                >
                  {module.title}
                </div>
                <div
                  className="text-[9px] font-bold uppercase tracking-wide mt-0.5"
                  style={{ color: STATE_COLORS[state] }}
                >
                  {state === "locked" ? "Locked" : state === "complete" ? "✓ Complete" : state === "active" ? "In Progress" : "Available"}
                </div>
              </div>
              {state === "locked" ? (
                <Lock className="h-3 w-3 shrink-0" style={{ color: "#4B5563" }} />
              ) : state === "complete" || state === "mastered" ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: "#34D399" }} />
              ) : null}
            </Link>
          );
        })}
      </aside>

      {/* RIGHT: Module content or index */}
      <div className="flex-1 min-w-0">
        {isIndex ? (
          <AcademyIndex moduleStates={moduleStates} progress={progress} />
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  );
}

function AcademyIndex({
  moduleStates,
  progress,
}: {
  moduleStates: { module: (typeof ACADEMY_MODULES)[number]; state: ModuleState }[];
  progress: ReturnType<typeof useFounderProgress>;
}) {
  const nextModule = moduleStates.find((ms) => ms.state === "available" || ms.state === "active");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(125,211,252,0.08) 0%, rgba(167,139,250,0.04) 100%)",
          border: "1px solid rgba(125,211,252,0.14)",
        }}
      >
        <div
          className="text-[10px] font-mono font-bold uppercase tracking-widest mb-1"
          style={{ color: "rgba(125,211,252,0.65)" }}
        >
          ● Founder Academy
        </div>
        <h1
          className="font-display text-[22px] font-bold mb-2"
          style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}
        >
          Business-Building Campaign
        </h1>
        <p className="text-[13px] mb-4" style={{ color: "var(--muted-foreground)" }}>
          Complete each module to unlock the next. Every lesson has a task, every task earns XP, every module unlocks new capabilities.
        </p>

        {nextModule && (
          <Link
            to="/app/academy/$module"
            params={{ module: nextModule.module.id }}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold btn-execute"
          >
            <span>{nextModule.module.emoji}</span>
            {nextModule.state === "active" ? "Continue" : "Start"} {nextModule.module.title}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {moduleStates.map(({ module, state }, i) => (
          <Link
            key={module.id}
            to="/app/academy/$module"
            params={{ module: module.id }}
            className={cn(
              "rounded-xl p-4 nova-card transition-all module-reveal",
              state === "locked" ? "pointer-events-none opacity-50" : "nova-card-hover",
            )}
            style={{
              background: STATE_BG[state],
              borderColor: state !== "locked"
                ? `color-mix(in oklab, ${STATE_COLORS[state]} 25%, transparent)`
                : undefined,
              ["--i" as string]: i,
            } as React.CSSProperties}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-[28px]">{module.emoji}</span>
              <div
                className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                style={{
                  background: `color-mix(in oklab, ${STATE_COLORS[state]} 12%, transparent)`,
                  color: STATE_COLORS[state],
                  border: `1px solid color-mix(in oklab, ${STATE_COLORS[state]} 28%, transparent)`,
                }}
              >
                {state === "locked" ? "Locked" : state === "complete" ? "Complete" : state === "active" ? "In Progress" : "Available"}
              </div>
            </div>

            <h3
              className="font-display text-[14px] font-bold mb-1"
              style={{ color: "var(--foreground)" }}
            >
              {module.title}
            </h3>
            <p
              className="text-[11.5px] mb-3 line-clamp-2"
              style={{ color: "var(--muted-foreground)" }}
            >
              {module.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3 w-3" style={{ color: STATE_COLORS[state] }} />
                <span className="text-[11px] font-mono font-bold" style={{ color: STATE_COLORS[state] }}>
                  {module.xpReward} XP
                </span>
              </div>
              <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                {module.tools.length} tools
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
