import React, { useState, useEffect } from "react";
import { SectionTabs } from "@/components/app/SectionTabs";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useEntitlement } from "@/hooks/use-entitlements";
import {
  Map,
  CheckCircle2,
  Circle,
  Lock,
  ChevronRight,
  Rocket,
  Star,
  Zap,
  TrendingUp,
  Loader2,
  X,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/app/launchpad-path")({
  component: LaunchpadPathPage,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/* ─── Phase & Step Definitions ─── */
interface Step {
  number: number;
  name: string;
  emoji: string;
  minutes: number;
  slug: string;
}

interface Phase {
  number: number;
  name: string;
  tagline: string;
  color: string;
  gradient: string;
  glow: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPlan: "starter" | "launch" | "operate" | "scale";
  planPrice: string | null;
  steps: Step[];
}

const PHASES: Phase[] = [
  {
    number: 1,
    name: "IGNITION",
    tagline: "Validate your idea before you build",
    color: "#4B8BF4",
    gradient: "linear-gradient(135deg, #4B8BF4, #8B5CF6)",
    glow: "rgba(75,139,244,0.3)",
    icon: Rocket,
    requiredPlan: "starter",
    planPrice: null,
    steps: [
      { number: 1, name: "Idea Validator", emoji: "💡", minutes: 8, slug: "idea-validator" },
      { number: 2, name: "Kill My Idea", emoji: "💀", minutes: 6, slug: "kill-my-idea" },
      {
        number: 3,
        name: "Competitor Scanner",
        emoji: "🔍",
        minutes: 7,
        slug: "competitor-scanner",
      },
      {
        number: 4,
        name: "GTM Strategy Builder",
        emoji: "🎯",
        minutes: 10,
        slug: "gtm-strategy-builder",
      },
    ],
  },
  {
    number: 2,
    name: "LAUNCH",
    tagline: "Build your business and get first customers",
    color: "#F97316",
    gradient: "linear-gradient(135deg, #F97316, #FBBF24)",
    glow: "rgba(249,115,22,0.3)",
    icon: Star,
    requiredPlan: "launch",
    planPrice: "$49/mo",
    steps: [
      {
        number: 5,
        name: "Business Plan Generator",
        emoji: "📋",
        minutes: 12,
        slug: "business-plan-generator",
      },
      { number: 6, name: "Persona Builder", emoji: "👤", minutes: 8, slug: "persona-builder" },
      {
        number: 7,
        name: "Pricing Calculator",
        emoji: "💰",
        minutes: 6,
        slug: "pricing-calculator",
      },
      {
        number: 8,
        name: "First 10 Customers Finder",
        emoji: "🚀",
        minutes: 10,
        slug: "first-10-customers-finder",
      },
      { number: 9, name: "Pitch Generator", emoji: "🎤", minutes: 8, slug: "pitch-generator" },
      {
        number: 10,
        name: "Landing Page Creator",
        emoji: "🌐",
        minutes: 12,
        slug: "landing-page-creator",
      },
    ],
  },
  {
    number: 3,
    name: "OPERATE",
    tagline: "Automate and grow your revenue operations",
    color: "#22C55E",
    gradient: "linear-gradient(135deg, #22C55E, #10b981)",
    glow: "rgba(34,197,94,0.3)",
    icon: Zap,
    requiredPlan: "operate",
    planPrice: "$149/mo",
    steps: [
      {
        number: 11,
        name: "Email Sequence Writer",
        emoji: "✉️",
        minutes: 8,
        slug: "email-sequence",
      },
      {
        number: 12,
        name: "KPI Dashboard Builder",
        emoji: "📊",
        minutes: 10,
        slug: "kpi-dashboard",
      },
      { number: 13, name: "SEO Audit Tool", emoji: "🔎", minutes: 8, slug: "seo-audit" },
      { number: 14, name: "Launch Checklist", emoji: "✅", minutes: 6, slug: "launch-checklist" },
    ],
  },
  {
    number: 4,
    name: "SCALE",
    tagline: "Raise capital and scale across channels",
    color: "#8B5CF6",
    gradient: "linear-gradient(135deg, #8B5CF6, #4B8BF4)",
    glow: "rgba(139,92,246,0.3)",
    icon: TrendingUp,
    requiredPlan: "scale",
    planPrice: "$299/mo",
    steps: [
      { number: 15, name: "Ad Copy Generator", emoji: "📣", minutes: 8, slug: "ad-copy" },
      {
        number: 16,
        name: "Investor Email Writer",
        emoji: "💼",
        minutes: 6,
        slug: "investor-email-writer",
      },
      {
        number: 17,
        name: "Funding Readiness Score",
        emoji: "💎",
        minutes: 10,
        slug: "funding-readiness-score",
      },
      { number: 18, name: "Killer Business Plan", emoji: "🏆", minutes: 15, slug: "business-plan" },
    ],
  },
];

const TOTAL_STEPS = 18;

const PLAN_RANK: Record<string, number> = { starter: 0, launch: 1, operate: 2, scale: 3 };

/* ─── Supabase ─── */
interface UserProgress {
  id?: string;
  user_id: string;
  completed_steps: number[];
}

async function fetchUserProgress(userId: string): Promise<UserProgress | null> {
  const { data } = await db.from("user_progress").select("*").eq("user_id", userId).maybeSingle();
  return data as UserProgress | null;
}

/* ─── Main Page ─── */
function LaunchpadPathPage() {
  const { user, currentOrgId } = useAuth();
  const navigate = useNavigate();
  const [celebrationPhase, setCelebrationPhase] = useState<Phase | null>(null);
  const [celebrationSeen, setCelebrationSeen] = useState<Set<number>>(new Set());

  // Get plan from subscription
  const subQ = useQuery({
    queryKey: ["subscription", currentOrgId ?? ""],
    queryFn: async () => {
      if (!currentOrgId) return null;
      const { data } = await db
        .from("subscriptions")
        .select("plan")
        .eq("organization_id", currentOrgId)
        .maybeSingle();
      return data;
    },
    enabled: !!currentOrgId,
  });

  const progressQ = useQuery({
    queryKey: ["user-progress", user?.id],
    queryFn: () => fetchUserProgress(user!.id),
    enabled: !!user?.id,
  });

  const userPlan = (subQ.data?.plan as string) ?? "starter";
  const completedSteps: number[] = progressQ.data?.completed_steps ?? [];
  const overallProgress = Math.round((completedSteps.length / TOTAL_STEPS) * 100);

  // Check for newly completed phases
  useEffect(() => {
    PHASES.forEach((phase) => {
      if (celebrationSeen.has(phase.number)) return;
      const allDone = phase.steps.every((s) => completedSteps.includes(s.number));
      if (allDone && completedSteps.length > 0) {
        setCelebrationPhase(phase);
        setCelebrationSeen((prev) => new Set([...prev, phase.number]));
      }
    });
  }, [completedSteps, celebrationSeen]);

  const isPhaseUnlocked = (phase: Phase) => {
    const userRank = PLAN_RANK[userPlan] ?? 0;
    const requiredRank = PLAN_RANK[phase.requiredPlan] ?? 0;
    return userRank >= requiredRank;
  };

  const isStepComplete = (stepNum: number) => completedSteps.includes(stepNum);

  const handleStepClick = (phase: Phase, step: Step) => {
    if (!isPhaseUnlocked(phase)) return;
    navigate({ to: "/app/launchpad/$tool", params: { tool: step.slug } });
  };

  if (progressQ.isLoading || subQ.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--muted-foreground)" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionTabs section="path" />
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{
              background: "linear-gradient(135deg, #4B8BF4, #8B5CF6)",
              boxShadow: "0 0 20px rgba(75,139,244,0.3)",
            }}
          >
            <Map className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1
              className="font-display text-2xl font-bold tracking-tight"
              style={{ color: "var(--foreground)" }}
            >
              Launchpad Path
            </h1>
            <p className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>
              Your guided journey from idea to scale
            </p>
          </div>
        </div>
        <div className="text-right hidden sm:block" style={{ color: "var(--muted-foreground)" }}>
          <div className="font-mono font-bold text-[20px]" style={{ color: "#4B8BF4" }}>
            {completedSteps.length}/{TOTAL_STEPS}
          </div>
          <div className="text-[11px]">steps complete</div>
        </div>
      </div>

      {/* Overall progress bar */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--surface)", border: "1px solid rgba(75,139,244,0.2)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>
            Overall Journey Progress
          </span>
          <span className="font-mono font-bold text-[16px]" style={{ color: "#4B8BF4" }}>
            {overallProgress}%
          </span>
        </div>
        <div
          className="h-3 w-full overflow-hidden rounded-full"
          style={{ background: "var(--surface-2)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${overallProgress}%`,
              background: "linear-gradient(90deg, #4B8BF4, #8B5CF6)",
              boxShadow: "0 0 12px rgba(75,139,244,0.5)",
            }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {PHASES.map((phase) => {
            const phaseStepsDone = phase.steps.filter((s) => isStepComplete(s.number)).length;
            const phaseComplete = phaseStepsDone === phase.steps.length;
            return (
              <div key={phase.number} className="text-center">
                <div
                  className="text-[10px] font-bold"
                  style={{ color: phaseComplete ? phase.color : "var(--muted-foreground)" }}
                >
                  {phase.name}
                </div>
                <div
                  className="text-[10px] font-mono"
                  style={{ color: phaseComplete ? phase.color : "var(--muted-foreground)" }}
                >
                  {phaseStepsDone}/{phase.steps.length}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Phase cards */}
      <div className="space-y-5">
        {PHASES.map((phase) => {
          const unlocked = isPhaseUnlocked(phase);
          const phaseStepsDone = phase.steps.filter((s) => isStepComplete(s.number)).length;
          const phaseComplete = phaseStepsDone === phase.steps.length;
          const PhaseIcon = phase.icon;

          return (
            <div
              key={phase.number}
              className="overflow-hidden rounded-2xl"
              style={{
                background: "var(--surface)",
                border: `1px solid ${unlocked ? phase.color + "25" : "var(--border)"}`,
                opacity: unlocked ? 1 : 0.8,
              }}
            >
              {/* Phase header */}
              <div
                className="relative overflow-hidden px-6 py-4 flex items-center gap-4"
                style={{
                  borderBottom: `1px solid ${unlocked ? phase.color + "15" : "var(--surface-2)"}`,
                }}
              >
                {unlocked && (
                  <div
                    className="absolute top-0 left-0 right-0 h-px"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${phase.color}60, transparent)`,
                    }}
                  />
                )}
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                  style={
                    unlocked
                      ? { background: phase.gradient, boxShadow: `0 4px 15px ${phase.glow}` }
                      : {
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                        }
                  }
                >
                  {unlocked ? (
                    <PhaseIcon className="h-5 w-5 text-white" />
                  ) : (
                    <Lock className="h-5 w-5" style={{ color: "var(--muted-foreground)" }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-[9.5px] font-bold uppercase tracking-[0.15em]"
                      style={{ color: unlocked ? phase.color : "var(--muted-foreground)" }}
                    >
                      Phase {phase.number}
                    </span>
                    {phase.planPrice && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                        style={
                          unlocked
                            ? {
                                background: `${phase.color}15`,
                                color: phase.color,
                                border: `1px solid ${phase.color}25`,
                              }
                            : {
                                background: "var(--surface-2)",
                                color: "var(--muted-foreground)",
                                border: "1px solid var(--border)",
                              }
                        }
                      >
                        {phase.planPrice}
                      </span>
                    )}
                    {!phase.planPrice && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                        style={{
                          background: "rgba(34,197,94,0.12)",
                          color: "#22C55E",
                          border: "1px solid rgba(34,197,94,0.2)",
                        }}
                      >
                        FREE
                      </span>
                    )}
                  </div>
                  <div
                    className="font-display font-bold text-[17px] tracking-tight"
                    style={{ color: "var(--foreground)" }}
                  >
                    {phase.name}
                  </div>
                  <div className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                    {phase.tagline}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {phaseComplete ? (
                    <div className="flex items-center gap-1.5" style={{ color: "#22C55E" }}>
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-[12px] font-semibold">Complete</span>
                    </div>
                  ) : (
                    <div>
                      <div
                        className="font-mono font-bold text-[16px]"
                        style={{ color: unlocked ? phase.color : "var(--muted-foreground)" }}
                      >
                        {phaseStepsDone}/{phase.steps.length}
                      </div>
                      <div className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                        complete
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Steps grid */}
              {unlocked ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4">
                  {phase.steps.map((step) => {
                    const done = isStepComplete(step.number);
                    return (
                      <button
                        key={step.number}
                        onClick={() => handleStepClick(phase, step)}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all group"
                        style={{
                          background: done ? `${phase.color}08` : "var(--surface)",
                          border: `1px solid ${done ? phase.color + "25" : "var(--surface-2)"}`,
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = `${phase.color}40`;
                          (e.currentTarget as HTMLElement).style.background = `${phase.color}10`;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = done
                            ? `${phase.color}25`
                            : "var(--surface-2)";
                          (e.currentTarget as HTMLElement).style.background = done
                            ? `${phase.color}08`
                            : "var(--surface)";
                        }}
                      >
                        {/* Step number */}
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
                          style={
                            done
                              ? { background: `${phase.color}20`, color: phase.color }
                              : {
                                  background: "var(--surface-2)",
                                  color: "var(--muted-foreground)",
                                }
                          }
                        >
                          {done ? <CheckCircle2 className="h-4 w-4" /> : step.number}
                        </div>

                        {/* Emoji + name */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span>{step.emoji}</span>
                            <span
                              className="text-[13px] font-medium truncate"
                              style={{
                                color: done ? "var(--muted-foreground)" : "var(--foreground)",
                              }}
                            >
                              {step.name}
                            </span>
                          </div>
                          <div
                            className="text-[11px] mt-0.5"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            ~{step.minutes} min
                          </div>
                        </div>

                        {/* Status pill */}
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={
                            done
                              ? {
                                  background: `${phase.color}12`,
                                  color: phase.color,
                                  border: `1px solid ${phase.color}20`,
                                }
                              : {
                                  background: "var(--surface-2)",
                                  color: "var(--muted-foreground)",
                                  border: "1px solid var(--border-subtle)",
                                }
                          }
                        >
                          {done ? "Complete" : "Not Started"}
                        </span>

                        <ChevronRight
                          className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
                          style={{ color: "var(--muted-foreground)" }}
                        />
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Locked phase upgrade CTA */
                <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                  <Lock
                    className="h-8 w-8 mb-3"
                    style={{ color: "var(--muted-foreground)", opacity: 0.5 }}
                  />
                  <div
                    className="text-[14px] font-semibold mb-1"
                    style={{ color: "var(--foreground)" }}
                  >
                    Phase {phase.number} — {phase.name}
                  </div>
                  <p className="text-[12.5px] mb-4" style={{ color: "var(--muted-foreground)" }}>
                    Upgrade to the{" "}
                    {phase.requiredPlan.charAt(0).toUpperCase() + phase.requiredPlan.slice(1)} plan
                    ({phase.planPrice}) to unlock these {phase.steps.length} tools.
                  </p>
                  <button
                    onClick={() => navigate({ to: "/app/billing" })}
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white"
                    style={{ background: phase.gradient, boxShadow: `0 4px 15px ${phase.glow}` }}
                  >
                    Upgrade to{" "}
                    {phase.requiredPlan.charAt(0).toUpperCase() + phase.requiredPlan.slice(1)}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Phase completion celebration modal */}
      {celebrationPhase && (
        <PhaseCompletionModal phase={celebrationPhase} onClose={() => setCelebrationPhase(null)} />
      )}
    </div>
  );
}

/* ─── Phase Completion Modal ─── */
function PhaseCompletionModal({ phase, onClose }: { phase: Phase; onClose: () => void }) {
  const navigate = useNavigate();
  const PhaseIcon = phase.icon;

  const nextPhase = PHASES.find((p) => p.number === phase.number + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-modal-overlay backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl text-center"
        style={{ background: "var(--surface)", border: `1px solid ${phase.color}40` }}
      >
        {/* Celebration animation */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${phase.color}20, transparent 70%)`,
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${phase.color}80, transparent)`,
          }}
        />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ color: "var(--muted-foreground)" }}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative px-8 py-10">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: phase.gradient, boxShadow: `0 8px 30px ${phase.glow}` }}
          >
            <PhaseIcon className="h-8 w-8 text-white" />
          </div>

          <div
            className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{ color: phase.color }}
          >
            Phase Complete!
          </div>
          <h2
            className="font-display text-[24px] font-bold tracking-tight mb-2"
            style={{ color: "var(--foreground)" }}
          >
            🎉 {phase.name} Unlocked
          </h2>
          <p
            className="text-[13px] leading-relaxed mb-6"
            style={{ color: "var(--muted-foreground)" }}
          >
            You've completed all {phase.steps.length} steps in the {phase.name} phase. Amazing work!
          </p>

          {/* Unlocked items */}
          <div
            className="mb-6 rounded-xl px-4 py-4 text-left space-y-2"
            style={{ background: `${phase.color}08`, border: `1px solid ${phase.color}20` }}
          >
            <div
              className="text-[11px] font-bold uppercase tracking-wider mb-3"
              style={{ color: phase.color }}
            >
              What you've unlocked
            </div>
            {phase.steps.map((step) => (
              <div key={step.number} className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: "#22C55E" }} />
                <span className="text-[12.5px]" style={{ color: "var(--foreground)" }}>
                  {step.emoji} {step.name}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {nextPhase && (
              <button
                onClick={() => {
                  onClose();
                  navigate({ to: "/app/billing" });
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white"
                style={{
                  background: nextPhase.gradient,
                  boxShadow: `0 4px 20px ${nextPhase.glow}`,
                }}
              >
                <Sparkles className="h-4 w-4" />
                Continue to {nextPhase.name}
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full rounded-xl py-3 text-[13px] font-medium"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
