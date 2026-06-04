import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { toolRunsQuery } from "@/lib/queries";
import { ACADEMY_MODULES, getModuleState } from "@/lib/academy-modules";
import { organizationQuery } from "@/lib/queries";
import { CheckCircle2, Lock, ArrowRight, Zap, BookOpen, Play, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/academy/$module")({
  component: ModuleWorkspace,
});

const TOOL_LABELS: Record<string, string> = {
  "idea-validator": "Idea Validator",
  "kill-my-idea": "Kill My Idea",
  "idea-vs-idea": "Idea vs Idea",
  competitor: "Competitor Analysis",
  "pitch-generator": "Pitch Generator",
  pricing: "Pricing Strategy",
  "gtm-strategy": "GTM Strategy",
  "landing-page": "Landing Page Builder",
  blog: "Blog Content",
  "first-10-customers": "First 10 Customers",
  "investor-emails": "Investor Emails",
  "business-plan": "Business Plan",
  "revenue-projector": "Revenue Projector",
  "funding-score": "Funding Score",
};

function ModuleWorkspace() {
  const { module: moduleId } = Route.useParams();
  const { currentOrgId } = useAuth();
  const navigate = useNavigate();

  const runsQ = useQuery({ ...toolRunsQuery(currentOrgId ?? "", 500), enabled: !!currentOrgId });
  const orgQ = useQuery({ ...organizationQuery(currentOrgId ?? ""), enabled: !!currentOrgId });

  const module = ACADEMY_MODULES.find((m) => m.id === moduleId);

  const completedSlugs = new Set(
    (runsQ.data ?? [])
      .filter((r: { status: string }) => r.status === "succeeded")
      .map((r: { tool_key?: string }) => r.tool_key ?? ""),
  );
  const orgStage = (orgQ.data as { stage?: string } | null)?.stage ?? "Idea";

  if (!module) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-[40px] mb-4">🔭</div>
        <h2
          className="font-display text-[18px] font-bold mb-2"
          style={{ color: "var(--foreground)" }}
        >
          Module not found
        </h2>
        <p className="text-[13px] mb-6" style={{ color: "var(--muted-foreground)" }}>
          This module doesn't exist. Check the Academy for available modules.
        </p>
        <Link
          to="/app/academy"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold btn-execute"
        >
          Back to Academy
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const state = getModuleState(module, completedSlugs, orgStage);
  const completedTools = module.tools.filter((t) => completedSlugs.has(t));
  const moduleIndex = ACADEMY_MODULES.findIndex((m) => m.id === moduleId);
  const nextModule = ACADEMY_MODULES[moduleIndex + 1];

  if (state === "locked") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-[48px] mb-4">🔒</div>
        <h2
          className="font-display text-[20px] font-bold mb-2"
          style={{ color: "var(--foreground)" }}
        >
          {module.title} — Locked
        </h2>
        <p className="text-[13px] mb-6" style={{ color: "var(--muted-foreground)" }}>
          Reach the <strong>{module.requiredStage}</strong> stage to unlock this module.
        </p>
        <Link
          to="/app/academy"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold btn-execute"
        >
          Back to Academy
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const STATE_COLOR_MAP = {
    locked: "#4B5563",
    available: "#9CA3AF",
    active: "#FF6B1A",
    complete: "#34D399",
    mastered: "#FBBF24",
  };
  const stateColor = STATE_COLOR_MAP[state];

  return (
    <div className="space-y-6">
      {/* Module header */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: `color-mix(in oklab, ${stateColor} 6%, var(--surface))`,
          border: `1px solid color-mix(in oklab, ${stateColor} 22%, var(--border))`,
        }}
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="text-[48px] shrink-0">{module.emoji}</span>
            <div>
              <div
                className="text-[10px] font-mono font-bold uppercase tracking-widest mb-1"
                style={{ color: stateColor }}
              >
                ●{" "}
                {state === "complete"
                  ? "Complete"
                  : state === "active"
                    ? "In Progress"
                    : "Available"}
              </div>
              <h1
                className="font-display text-[22px] font-bold leading-tight"
                style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}
              >
                {module.title}
              </h1>
              <p className="text-[13px] mt-1" style={{ color: "var(--muted-foreground)" }}>
                {module.outcome}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div
              className="flex items-center gap-1.5 rounded-xl px-3 py-2"
              style={{
                background: `color-mix(in oklab, ${stateColor} 10%, transparent)`,
                border: `1px solid color-mix(in oklab, ${stateColor} 25%, transparent)`,
              }}
            >
              <Zap className="h-3.5 w-3.5" style={{ color: stateColor }} />
              <span className="font-mono font-bold text-[13px]" style={{ color: stateColor }}>
                {module.xpReward} XP
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {module.tools.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[10px] font-bold uppercase tracking-wide"
                style={{ color: "var(--muted-foreground)" }}
              >
                Task Progress
              </span>
              <span className="text-[10px] font-mono" style={{ color: stateColor }}>
                {completedTools.length}/{module.tools.length} complete
              </span>
            </div>
            <div
              className="rounded-full overflow-hidden"
              style={{ height: 4, background: "rgba(245,200,140,0.08)" }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{
                  width: `${(completedTools.length / module.tools.length) * 100}%`,
                  background: `linear-gradient(90deg, ${stateColor}, color-mix(in oklab, ${stateColor} 60%, var(--accent)))`,
                  boxShadow: `0 0 8px ${stateColor}55`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Learn content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Lesson */}
          <div className="rounded-xl p-5 nova-card">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-4 w-4" style={{ color: "var(--primary)" }} />
              <span
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: "var(--muted-foreground)" }}
              >
                Lesson
              </span>
            </div>
            <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--foreground)" }}>
              {module.learnContent}
            </p>
          </div>

          {/* Execute tasks */}
          <div>
            <div
              className="text-[10px] font-bold uppercase tracking-widest mb-3"
              style={{ color: "var(--muted-foreground)" }}
            >
              Execute Tasks
            </div>
            <div className="space-y-3">
              {module.tools.map((toolKey, i) => {
                const isDone = completedSlugs.has(toolKey);
                const label =
                  TOOL_LABELS[toolKey] ??
                  toolKey.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

                return (
                  <div
                    key={toolKey}
                    className="flex items-center gap-3 rounded-xl p-4 nova-card transition-all"
                    style={{
                      borderColor: isDone
                        ? "color-mix(in oklab, #34D399 28%, var(--border))"
                        : undefined,
                      background: isDone
                        ? "color-mix(in oklab, #34D399 5%, var(--surface))"
                        : undefined,
                    }}
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono font-bold text-[12px]"
                      style={{
                        background: isDone
                          ? "color-mix(in oklab, #34D399 15%, transparent)"
                          : "rgba(245,200,140,0.06)",
                        color: isDone ? "#34D399" : "var(--muted-foreground)",
                      }}
                    >
                      {isDone ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div
                        className="text-[13px] font-semibold"
                        style={{ color: isDone ? "#34D399" : "var(--foreground)" }}
                      >
                        {label}
                      </div>
                      <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                        {isDone
                          ? "Completed — you can run it again anytime"
                          : "Run this tool to complete the task"}
                      </div>
                    </div>

                    <Link
                      to="/app/launchpad/$tool"
                      params={{ tool: toolKey }}
                      className={cn(
                        "flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition-all shrink-0",
                        isDone ? "nova-card nova-card-hover" : "btn-execute",
                      )}
                    >
                      {isDone ? (
                        <>
                          <ExternalLink className="h-3.5 w-3.5" />
                          View
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" />
                          Execute
                        </>
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Progress panel */}
        <div className="space-y-4">
          {/* Completion summary */}
          <div className="rounded-xl p-4 nova-card">
            <div
              className="text-[10px] font-bold uppercase tracking-widest mb-3"
              style={{ color: "var(--muted-foreground)" }}
            >
              Module Status
            </div>

            <div className="space-y-2.5">
              {module.tools.map((toolKey) => {
                const isDone = completedSlugs.has(toolKey);
                const label =
                  TOOL_LABELS[toolKey] ??
                  toolKey.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                return (
                  <div key={toolKey} className="flex items-center gap-2.5">
                    <div
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ background: isDone ? "#34D399" : "rgba(245,200,140,0.18)" }}
                    />
                    <span
                      className="text-[12px] truncate"
                      style={{ color: isDone ? "var(--foreground)" : "var(--muted-foreground)" }}
                    >
                      {label}
                    </span>
                    {isDone && (
                      <CheckCircle2
                        className="h-3 w-3 shrink-0 ml-auto"
                        style={{ color: "#34D399" }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {state === "complete" && (
              <div
                className="mt-4 rounded-xl p-3 text-center"
                style={{
                  background: "color-mix(in oklab, #34D399 8%, transparent)",
                  border: "1px solid color-mix(in oklab, #34D399 25%, transparent)",
                }}
              >
                <CheckCircle2 className="h-5 w-5 mx-auto mb-1.5" style={{ color: "#34D399" }} />
                <div className="text-[12px] font-semibold" style={{ color: "#34D399" }}>
                  Module Complete!
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                  +{module.xpReward} XP earned
                </div>
              </div>
            )}
          </div>

          {/* Next module */}
          {nextModule && (
            <div
              className="rounded-xl p-4"
              style={{
                background: "rgba(245,200,140,0.04)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="text-[10px] font-bold uppercase tracking-widest mb-3"
                style={{ color: "var(--muted-foreground)" }}
              >
                Up Next
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[24px]">{nextModule.emoji}</span>
                <div>
                  <div className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>
                    {nextModule.title}
                  </div>
                  <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                    {nextModule.xpReward} XP
                  </div>
                </div>
              </div>
              {state === "complete" ? (
                <Link
                  to="/app/academy/$module"
                  params={{ module: nextModule.id }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-[12px] font-semibold btn-execute"
                >
                  Start Next Module <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <div
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <Lock className="h-3 w-3" />
                  <span className="text-[11px]">Complete this module to unlock</span>
                </div>
              )}
            </div>
          )}

          {/* Academy nav */}
          <Link
            to="/app/academy"
            className="flex items-center gap-2 rounded-xl p-3 nova-card nova-card-hover text-[12px] font-medium"
            style={{ color: "var(--muted-foreground)" }}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Back to Academy Map
          </Link>
        </div>
      </div>
    </div>
  );
}
