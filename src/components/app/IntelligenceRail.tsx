import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  X,
  Zap,
  ArrowRight,
  Target,
  BookOpen,
  TrendingUp,
  Rocket,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFounderProgress } from "@/hooks/use-founder-progress";
import { NovaChatModal } from "@/components/app/NovaChatModal";

type Tab = "next-steps" | "nova";

interface IntelligenceRailProps {
  open: boolean;
  onClose: () => void;
}

const NEXT_ACTION_MAP: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    to: string;
    color: string;
  }[]
> = {
  Idea: [
    {
      label: "Validate your idea",
      icon: Target,
      to: "/app/academy/idea-validation",
      color: "#7DD3FC",
    },
    {
      label: "Run Idea Validator",
      icon: Zap,
      to: "/app/launchpad/idea-validator",
      color: "#FF6B1A",
    },
    {
      label: "Kill My Idea test",
      icon: Sparkles,
      to: "/app/launchpad/kill-my-idea",
      color: "#A78BFA",
    },
  ],
  Validate: [
    {
      label: "Build your offer",
      icon: BookOpen,
      to: "/app/academy/offer-creation",
      color: "#34D399",
    },
    {
      label: "Create GTM Strategy",
      icon: Target,
      to: "/app/launchpad/gtm-strategy",
      color: "#F5A623",
    },
    {
      label: "Generate pitch deck",
      icon: Zap,
      to: "/app/launchpad/pitch-generator",
      color: "#FF6B1A",
    },
  ],
  Launch: [
    {
      label: "Find first customers",
      icon: TrendingUp,
      to: "/app/launchpad/first-10-customers",
      color: "#34D399",
    },
    { label: "Set up lead capture", icon: Target, to: "/app/nova/leads", color: "#7DD3FC" },
    {
      label: "Create landing page",
      icon: Rocket,
      to: "/app/launchpad/landing-page",
      color: "#F5A623",
    },
  ],
  Operate: [
    { label: "Automate follow-ups", icon: Zap, to: "/app/nova/workflows", color: "#5EEAD4" },
    { label: "Review CRM pipeline", icon: TrendingUp, to: "/app/scale/pipeline", color: "#F5A623" },
    {
      label: "Generate business plan",
      icon: BookOpen,
      to: "/app/launchpad/business-plan",
      color: "#A78BFA",
    },
  ],
  Scale: [
    {
      label: "Revenue projections",
      icon: TrendingUp,
      to: "/app/launchpad/revenue-projector",
      color: "#34D399",
    },
    { label: "Activate Scale Mode", icon: Rocket, to: "/app/scale", color: "#F5A623" },
    {
      label: "Funding readiness",
      icon: Target,
      to: "/app/launchpad/funding-score",
      color: "#7DD3FC",
    },
  ],
};

export function IntelligenceRail({ open, onClose }: IntelligenceRailProps) {
  const [tab, setTab] = useState<Tab>("next-steps");
  const [chatOpen, setChatOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const progress = useFounderProgress();

  const stage = progress.orgStage || "Idea";
  const nextActions = NEXT_ACTION_MAP[stage] ?? NEXT_ACTION_MAP["Idea"];

  if (!open) return null;

  return (
    <>
      <aside
        className={cn(
          "hidden xl:flex shrink-0 flex-col intel-rail rail-slide-in",
          "transition-[width] duration-200 ease-in-out",
          "w-[300px]",
        )}
        style={{
          background: "var(--intel-rail-bg)",
          borderLeft: "1px solid var(--intel-rail-border)",
        }}
      >
        {/* Header */}
        <div
          className="flex h-14 items-center justify-between px-4 shrink-0"
          style={{ borderBottom: "1px solid var(--intel-rail-border)" }}
        >
          <div className="flex items-center gap-2">
            <Zap
              className="h-4 w-4"
              style={{
                color: "var(--mentor-accent)",
                filter: "drop-shadow(0 0 6px rgba(125,211,252,0.5))",
              }}
            />
            <span
              className="text-[12.5px] font-bold tracking-tight"
              style={{ color: "var(--foreground)" }}
            >
              Nova Intelligence
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition"
            style={{ color: "var(--muted-foreground)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
              (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex items-center gap-1 px-3 py-2 shrink-0"
          style={{ borderBottom: "1px solid var(--intel-rail-border)" }}
        >
          {(["next-steps", "nova"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="rounded-lg px-3 py-1 text-[11px] font-semibold transition capitalize"
              style={
                tab === t
                  ? {
                      background: "rgba(125,211,252,0.10)",
                      color: "var(--mentor-accent)",
                      border: "1px solid rgba(125,211,252,0.20)",
                    }
                  : {
                      color: "var(--muted-foreground)",
                      border: "1px solid transparent",
                    }
              }
            >
              {t === "next-steps" ? "Next Steps" : "Nova AI"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {tab === "next-steps" && (
            <NextStepsPanel progress={progress} nextActions={nextActions} stage={stage} />
          )}
          {tab === "nova" && <NovaPanel onOpenChat={() => setChatOpen(true)} />}
        </div>

        {/* Footer */}
        <div
          className="px-3 py-3 shrink-0"
          style={{ borderTop: "1px solid var(--intel-rail-border)" }}
        >
          <Link
            to="/app/mentor"
            className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[12px] font-semibold transition"
            style={{
              background: "rgba(125,211,252,0.06)",
              border: "1px solid rgba(125,211,252,0.16)",
              color: "var(--mentor-accent)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(125,211,252,0.12)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(125,211,252,0.06)";
            }}
          >
            <span className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              Open AI Operators
            </span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </aside>

      <NovaChatModal open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}

function NextStepsPanel({
  progress,
  nextActions,
  stage,
}: {
  progress: ReturnType<typeof useFounderProgress>;
  nextActions: {
    label: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    to: string;
    color: string;
  }[];
  stage: string;
}) {
  return (
    <div className="p-3 space-y-4">
      {/* Founder score */}
      <div
        className="rounded-xl p-3"
        style={{
          background: "rgba(249,115,22,0.06)",
          border: "1px solid rgba(249,115,22,0.14)",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-[9px] font-bold uppercase tracking-widest"
            style={{ color: "var(--muted-foreground)" }}
          >
            Founder Score
          </span>
          <span className="text-[18px] font-black font-mono" style={{ color: "var(--primary)" }}>
            {progress.founderScore}
          </span>
        </div>
        <div
          className="relative overflow-hidden rounded-full"
          style={{ height: 3, background: "rgba(245,200,140,0.08)" }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${progress.founderScore}%`,
              background: "linear-gradient(90deg, var(--primary), var(--accent))",
              boxShadow: "0 0 8px rgba(249,115,22,0.55)",
              transition: "width 0.8s ease",
            }}
          />
        </div>
        <div className="mt-1.5 text-[10px]" style={{ color: "var(--muted-foreground)" }}>
          Stage: <span style={{ color: "var(--foreground)" }}>{stage}</span>
          {" · "}
          {progress.currentMissionStepsCompleted}/{progress.currentMissionStepsTotal} steps
        </div>
      </div>

      {/* Recommended actions */}
      <div>
        <div
          className="mb-2 text-[9px] font-bold uppercase tracking-widest"
          style={{ color: "var(--muted-foreground)" }}
        >
          Recommended Actions
        </div>
        <div className="space-y-1.5">
          {nextActions.map((action, i) => (
            <Link
              key={i}
              to={action.to}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-all module-reveal"
              style={
                {
                  background: "rgba(245,200,140,0.04)",
                  border: "1px solid var(--border)",
                  ["--i" as string]: i,
                } as React.CSSProperties
              }
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  `color-mix(in oklab, ${action.color} 8%, transparent)`;
                (e.currentTarget as HTMLElement).style.borderColor =
                  `color-mix(in oklab, ${action.color} 30%, transparent)`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(245,200,140,0.04)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
              }}
            >
              <action.icon className="h-3.5 w-3.5 shrink-0" style={{ color: action.color }} />
              <span
                className="flex-1 text-[11.5px] font-medium truncate"
                style={{ color: "var(--foreground)" }}
              >
                {action.label}
              </span>
              <ChevronRight
                className="h-3 w-3 shrink-0"
                style={{ color: "var(--muted-foreground)" }}
              />
            </Link>
          ))}
        </div>
      </div>

      {/* Galaxy Map shortcut */}
      <div>
        <div
          className="mb-2 text-[9px] font-bold uppercase tracking-widest"
          style={{ color: "var(--muted-foreground)" }}
        >
          Mission Progress
        </div>
        <Link
          to="/app/galaxy"
          className="flex items-center gap-3 rounded-xl p-3 transition-all"
          style={{
            background: "rgba(167,139,250,0.06)",
            border: "1px solid rgba(167,139,250,0.14)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(167,139,250,0.12)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(167,139,250,0.06)";
          }}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{
              background: "rgba(167,139,250,0.15)",
              border: "1px solid rgba(167,139,250,0.30)",
            }}
          >
            <span className="text-[16px]">🌌</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11.5px] font-semibold" style={{ color: "var(--foreground)" }}>
              Galaxy Map
            </div>
            <div className="text-[10px] truncate" style={{ color: "var(--muted-foreground)" }}>
              {progress.nextMilestone}
            </div>
          </div>
          <ArrowRight
            className="h-3.5 w-3.5 shrink-0"
            style={{ color: "rgba(167,139,250,0.60)" }}
          />
        </Link>
      </div>
    </div>
  );
}

function NovaPanel({ onOpenChat }: { onOpenChat: () => void }) {
  const prompts = [
    "What should I work on next?",
    "Analyze my startup progress",
    "What's my highest-leverage move?",
    "How do I get my first 10 customers?",
  ];

  return (
    <div className="p-3 space-y-3">
      <div
        className="rounded-xl p-4 text-center"
        style={{
          background: "rgba(125,211,252,0.05)",
          border: "1px solid rgba(125,211,252,0.12)",
        }}
      >
        <Sparkles className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--mentor-accent)" }} />
        <div className="text-[13px] font-semibold mb-1" style={{ color: "var(--foreground)" }}>
          Nova AI Operator
        </div>
        <div className="text-[11px] mb-3" style={{ color: "var(--muted-foreground)" }}>
          Your AI strategist, mentor, and guide
        </div>
        <button
          onClick={onOpenChat}
          className="btn-execute w-full rounded-lg py-2 text-[12px] font-semibold flex items-center justify-center gap-2"
        >
          <Zap className="h-3.5 w-3.5" />
          Open Nova Chat
        </button>
      </div>

      <div>
        <div
          className="mb-2 text-[9px] font-bold uppercase tracking-widest"
          style={{ color: "var(--muted-foreground)" }}
        >
          Quick Prompts
        </div>
        <div className="space-y-1.5">
          {prompts.map((prompt, i) => (
            <button
              key={i}
              onClick={onOpenChat}
              className="w-full text-left rounded-lg px-3 py-2.5 text-[11.5px] transition-all"
              style={{
                background: "rgba(245,200,140,0.04)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(125,211,252,0.06)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(125,211,252,0.22)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(245,200,140,0.04)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
