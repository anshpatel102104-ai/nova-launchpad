import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  organizationQuery,
  toolRunsQuery,
  leadsQuery,
  automationSettingsQuery,
} from "@/lib/queries";
import {
  ArrowRight,
  Zap,
  Users,
  Activity,
  TrendingUp,
  CheckCircle2,
  Circle,
  BookOpen,
  ChevronRight,
  Target,
  BarChart3,
  Lightbulb,
  AlertCircle,
  MessageSquare,
} from "lucide-react";

export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });

// ─── Types & constants ────────────────────────────────────────────────────────

const STAGES = ["Idea", "Validate", "Launch", "Operate", "Scale"] as const;
type Stage = (typeof STAGES)[number];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// Health score: composite of activity signals
function healthScore(runs: number, leads: number, autos: number, stageIdx: number): number {
  let s = 20;
  if (runs >= 1) s += 15;
  if (runs >= 5) s += 10;
  if (runs >= 15) s += 5;
  if (leads >= 1) s += 15;
  if (leads >= 5) s += 10;
  if (autos >= 1) s += 15;
  if (stageIdx >= 1) s += 10;
  return Math.min(100, s);
}

function scoreLabel(n: number): { text: string; color: string } {
  if (n >= 75) return { text: "Strong", color: "#22c55e" };
  if (n >= 50) return { text: "Building", color: "#f97316" };
  return { text: "Early", color: "#94a3b8" };
}

// ─── Playbook preview data ────────────────────────────────────────────────────

type PlaybookModule = {
  id: string;
  title: string;
  desc: string;
  path: string;
};

type PlaybookPhase = {
  phase: number;
  title: string;
  modules: PlaybookModule[];
};

const PLAYBOOK_DATA: Record<Stage, PlaybookPhase[]> = {
  Idea: [
    {
      phase: 1,
      title: "Validate Your Concept",
      modules: [
        {
          id: "idea-validator",
          title: "Idea Validation",
          desc: "Score your concept across 8 dimensions",
          path: "/app/launchpad/idea-validator",
        },
        {
          id: "kill-my-idea",
          title: "Stress-Test the Idea",
          desc: "Devil's advocate — find every fatal flaw",
          path: "/app/launchpad/kill-my-idea",
        },
        {
          id: "competitor-scanner",
          title: "Competitive Landscape",
          desc: "Map your moat and positioning gaps",
          path: "/app/launchpad/competitor-scanner",
        },
      ],
    },
    {
      phase: 2,
      title: "Define Your Market",
      modules: [
        {
          id: "persona-builder",
          title: "Customer Personas",
          desc: "Deep profiles of your first 100 customers",
          path: "/app/launchpad/persona-builder",
        },
        {
          id: "gtm-strategy-builder",
          title: "GTM Strategy",
          desc: "Channels, pricing, ICP — full go-to-market plan",
          path: "/app/launchpad/gtm-strategy-builder",
        },
        {
          id: "business-plan-generator",
          title: "Business Plan",
          desc: "Investor-grade plan tailored to your concept",
          path: "/app/launchpad/business-plan-generator",
        },
      ],
    },
    {
      phase: 3,
      title: "Acquire First Customers",
      modules: [
        {
          id: "first-10-customers-finder",
          title: "First 10 Customers",
          desc: "Specific tactics for your exact model",
          path: "/app/launchpad/first-10-customers-finder",
        },
        {
          id: "landing-page-creator",
          title: "Landing Page Copy",
          desc: "Conversion-optimised hero & CTA copy",
          path: "/app/launchpad/landing-page-creator",
        },
        {
          id: "pitch-generator",
          title: "Pitch Deck",
          desc: "Slide-by-slide narrative for your raise",
          path: "/app/launchpad/pitch-generator",
        },
      ],
    },
  ],
  Validate: [
    {
      phase: 1,
      title: "Sharpen Your Offer",
      modules: [
        {
          id: "persona-builder",
          title: "Customer Personas",
          desc: "Who exactly you're building for",
          path: "/app/launchpad/persona-builder",
        },
        {
          id: "gtm-strategy-builder",
          title: "GTM Strategy",
          desc: "Full go-to-market plan",
          path: "/app/launchpad/gtm-strategy-builder",
        },
        {
          id: "business-plan-generator",
          title: "Business Plan",
          desc: "Full investor-grade plan",
          path: "/app/launchpad/business-plan-generator",
        },
      ],
    },
    {
      phase: 2,
      title: "Land First Customers",
      modules: [
        {
          id: "first-10-customers-finder",
          title: "First 10 Customers",
          desc: "Outreach tactics for your model",
          path: "/app/launchpad/first-10-customers-finder",
        },
        {
          id: "landing-page-creator",
          title: "Landing Page",
          desc: "Convert visitors into leads",
          path: "/app/launchpad/landing-page-creator",
        },
        {
          id: "email-sequence-builder",
          title: "Email Sequence",
          desc: "Nurture sequence for your list",
          path: "/app/launchpad/email-sequence-builder",
        },
      ],
    },
    {
      phase: 3,
      title: "Build Infrastructure",
      modules: [
        {
          id: "automations",
          title: "CRM Automations",
          desc: "Never let a lead fall through",
          path: "/app/automations",
        },
        {
          id: "contacts",
          title: "Contact Database",
          desc: "Organise your pipeline",
          path: "/app/contacts",
        },
        {
          id: "kpi-dashboard",
          title: "KPI Dashboard",
          desc: "Track the metrics that matter",
          path: "/app/launchpad/kpi-dashboard",
        },
      ],
    },
  ],
  Launch: [
    {
      phase: 1,
      title: "Activate Revenue",
      modules: [
        {
          id: "first-10-customers-finder",
          title: "First 10 Customers",
          desc: "Close your first paying customers",
          path: "/app/launchpad/first-10-customers-finder",
        },
        {
          id: "pitch-generator",
          title: "Pitch Deck",
          desc: "Narrative optimised for your stage",
          path: "/app/launchpad/pitch-generator",
        },
        {
          id: "nova/crm",
          title: "Sales Pipeline",
          desc: "Track every deal from prospect to close",
          path: "/app/nova/crm",
        },
      ],
    },
    {
      phase: 2,
      title: "Build Momentum",
      modules: [
        {
          id: "automations",
          title: "Lead Automations",
          desc: "Automate follow-up and outreach",
          path: "/app/automations",
        },
        {
          id: "scale/campaigns",
          title: "Growth Campaigns",
          desc: "Email, SMS and content campaigns",
          path: "/app/scale/campaigns",
        },
        {
          id: "kpi-dashboard",
          title: "Revenue Metrics",
          desc: "Model your next 12 months",
          path: "/app/launchpad/kpi-dashboard",
        },
      ],
    },
    {
      phase: 3,
      title: "Prepare to Scale",
      modules: [
        {
          id: "funding-readiness-score",
          title: "Funding Readiness",
          desc: "Score against investor criteria",
          path: "/app/launchpad/funding-readiness-score",
        },
        {
          id: "investor-email-writer",
          title: "Investor Outreach",
          desc: "Personalised emails to target investors",
          path: "/app/launchpad/investor-email-writer",
        },
        {
          id: "scale",
          title: "Scale Systems",
          desc: "Campaign and automation infrastructure",
          path: "/app/scale",
        },
      ],
    },
  ],
  Operate: [
    {
      phase: 1,
      title: "Systemise Operations",
      modules: [
        {
          id: "automations",
          title: "CRM Automations",
          desc: "Automate every touchpoint",
          path: "/app/automations",
        },
        {
          id: "scale/pipeline",
          title: "Pipeline",
          desc: "Keep deal momentum",
          path: "/app/scale/pipeline",
        },
        {
          id: "kpi-dashboard",
          title: "KPI Dashboard",
          desc: "Revenue projections and metrics",
          path: "/app/launchpad/kpi-dashboard",
        },
      ],
    },
    {
      phase: 2,
      title: "Accelerate Growth",
      modules: [
        {
          id: "scale/campaigns",
          title: "Growth Campaigns",
          desc: "Multi-channel campaign execution",
          path: "/app/scale/campaigns",
        },
        {
          id: "contacts",
          title: "Contact Expansion",
          desc: "Grow and segment your database",
          path: "/app/contacts",
        },
        {
          id: "funding-readiness-score",
          title: "Funding Readiness",
          desc: "Assess readiness to raise",
          path: "/app/launchpad/funding-readiness-score",
        },
      ],
    },
    {
      phase: 3,
      title: "Scale the Model",
      modules: [
        {
          id: "investor-email-writer",
          title: "Investor Outreach",
          desc: "Target the right investors",
          path: "/app/launchpad/investor-email-writer",
        },
        {
          id: "scale",
          title: "Scale Infrastructure",
          desc: "Voice AI, SMS, full automation suite",
          path: "/app/scale",
        },
        {
          id: "pitch-generator",
          title: "Series Pitch",
          desc: "Narrative for your next round",
          path: "/app/launchpad/pitch-generator",
        },
      ],
    },
  ],
  Scale: [
    {
      phase: 1,
      title: "Secure Capital",
      modules: [
        {
          id: "funding-readiness-score",
          title: "Funding Readiness",
          desc: "Score against top investor criteria",
          path: "/app/launchpad/funding-readiness-score",
        },
        {
          id: "investor-email-writer",
          title: "Investor Emails",
          desc: "Personalised cold outreach",
          path: "/app/launchpad/investor-email-writer",
        },
        {
          id: "pitch-generator",
          title: "Pitch Deck",
          desc: "Series-ready narrative",
          path: "/app/launchpad/pitch-generator",
        },
      ],
    },
    {
      phase: 2,
      title: "Scale Systems",
      modules: [
        {
          id: "scale",
          title: "Scale Automations",
          desc: "Campaign, voice, and AI systems",
          path: "/app/scale",
        },
        {
          id: "scale/campaigns",
          title: "Growth Campaigns",
          desc: "Multi-channel at scale",
          path: "/app/scale/campaigns",
        },
        {
          id: "kpi-dashboard",
          title: "Growth Metrics",
          desc: "Track what compounds",
          path: "/app/launchpad/kpi-dashboard",
        },
      ],
    },
    {
      phase: 3,
      title: "Optimise & Compound",
      modules: [
        {
          id: "automations",
          title: "Advanced Automations",
          desc: "Full-stack workflow automation",
          path: "/app/automations",
        },
        {
          id: "contacts",
          title: "Enterprise Pipeline",
          desc: "Segment and nurture at scale",
          path: "/app/contacts",
        },
        {
          id: "nova/reports",
          title: "Business Intelligence",
          desc: "Deep analytics and insights",
          path: "/app/nova/reports",
        },
      ],
    },
  ],
};

// ─── Component ────────────────────────────────────────────────────────────────

function Dashboard() {
  const { user, profile, currentOrgId } = useAuth();
  const { workspace } = useWorkspace();

  const orgQ = useQuery({ ...organizationQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const runsQ = useQuery({ ...toolRunsQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const leadsQ = useQuery({ ...leadsQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const autoQ = useQuery({
    ...automationSettingsQuery(currentOrgId ?? ""),
    enabled: !!currentOrgId,
  });

  const name = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const org = orgQ.data;
  const stage: Stage = (org?.stage as Stage) ?? "Idea";
  const stageIdx = STAGES.indexOf(stage);

  const runCount = runsQ.data?.length ?? 0;
  const leadCount = leadsQ.data?.length ?? 0;
  const activeAuto =
    (autoQ.data as Array<{ status?: string }> | null)?.filter((a) => a.status === "active")
      .length ?? 0;

  const score = healthScore(runCount, leadCount, activeAuto, stageIdx);
  const { text: scoreText, color: scoreColor } = scoreLabel(score);

  const runKeys = new Set(
    (runsQ.data ?? []).map((r: Record<string, unknown>) => r.tool_key as string),
  );

  // Active phase = first phase with any incomplete module
  const phases = PLAYBOOK_DATA[stage];
  const activePhaseIdx = Math.min(
    phases.findIndex((ph) => ph.modules.some((m) => !runKeys.has(m.id))),
    phases.length - 1,
  );
  const activePhase = phases[Math.max(0, activePhaseIdx)];

  // What to improve
  type Improvement = {
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    text: string;
    path: string;
  };
  const improvements: Improvement[] = [];
  if (runCount === 0)
    improvements.push({ icon: Zap, text: "Run your first Launchpad tool", path: "/app/launchpad" });
  if (leadCount === 0)
    improvements.push({ icon: Users, text: "Add your first contact", path: "/app/contacts" });
  if (activeAuto === 0)
    improvements.push({ icon: Activity, text: "Set up an automation", path: "/app/automations" });
  improvements.push({ icon: BookOpen, text: "Open your Playbook", path: "/app/playbook" });

  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
            {greeting()}, {name}.
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
            {date} ·{" "}
            <span
              className="inline-flex items-center gap-1 font-medium"
              style={{ color: "var(--primary)" }}
            >
              Stage {stageIdx + 1} of 5 — {stage}
            </span>
          </p>
        </div>
        <Link
          to="/app/launchpad/"
          className="hidden sm:inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shrink-0"
          style={{ background: "var(--primary)", color: "#fff" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.background = "var(--primary-hover)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.background = "var(--primary)")
          }
        >
          <Zap className="h-3.5 w-3.5" />
          Open Launchpad
        </Link>
      </div>

      {/* ── Stat row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Health Score */}
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div
            className="text-[10px] font-semibold uppercase tracking-widest font-mono mb-2"
            style={{ color: "var(--muted-foreground)" }}
          >
            Business Health
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold font-mono" style={{ color: scoreColor }}>
              {score}
            </span>
            <span className="text-sm font-medium mb-0.5" style={{ color: scoreColor }}>
              {scoreText}
            </span>
          </div>
          <div
            className="mt-2 h-1.5 rounded-full overflow-hidden"
            style={{ background: "var(--border)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${score}%`, background: scoreColor }}
            />
          </div>
        </div>

        {/* Contacts */}
        <Link
          to="/app/contacts"
          className="rounded-xl p-4 group"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.borderColor =
              "color-mix(in oklab, var(--primary) 30%, transparent)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.borderColor = "var(--border)")
          }
        >
          <div
            className="text-[10px] font-semibold uppercase tracking-widest font-mono mb-2"
            style={{ color: "var(--muted-foreground)" }}
          >
            Contacts
          </div>
          <div className="text-3xl font-bold font-mono" style={{ color: "var(--foreground)" }}>
            {leadCount}
          </div>
          <div className="text-[11px] mt-1" style={{ color: "var(--muted-foreground)" }}>
            {leadCount === 0 ? "Add your first contact →" : "in your database"}
          </div>
        </Link>

        {/* Tools run */}
        <Link
          to="/app/launchpad/"
          className="rounded-xl p-4 group"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.borderColor =
              "color-mix(in oklab, var(--primary) 30%, transparent)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.borderColor = "var(--border)")
          }
        >
          <div
            className="text-[10px] font-semibold uppercase tracking-widest font-mono mb-2"
            style={{ color: "var(--muted-foreground)" }}
          >
            Tools Run
          </div>
          <div className="text-3xl font-bold font-mono" style={{ color: "var(--foreground)" }}>
            {runCount}
          </div>
          <div className="text-[11px] mt-1" style={{ color: "var(--muted-foreground)" }}>
            {runCount === 0 ? "Start with Launchpad →" : "executions total"}
          </div>
        </Link>

        {/* Automations */}
        <Link
          to="/app/automations"
          className="rounded-xl p-4 group"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.borderColor =
              "color-mix(in oklab, var(--primary) 30%, transparent)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.borderColor = "var(--border)")
          }
        >
          <div
            className="text-[10px] font-semibold uppercase tracking-widest font-mono mb-2"
            style={{ color: "var(--muted-foreground)" }}
          >
            Automations
          </div>
          <div className="text-3xl font-bold font-mono" style={{ color: "var(--foreground)" }}>
            {activeAuto}
          </div>
          <div className="text-[11px] mt-1" style={{ color: "var(--muted-foreground)" }}>
            {activeAuto === 0 ? "Set up your first →" : "active workflows"}
          </div>
        </Link>
      </div>

      {/* ── Main 2-col grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT: Playbook preview */}
        <div
          className="lg:col-span-2 rounded-xl p-5"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div
                className="text-[10px] font-semibold uppercase tracking-widest font-mono"
                style={{ color: "var(--primary)" }}
              >
                Your Playbook
              </div>
              <h2 className="text-base font-bold mt-0.5" style={{ color: "var(--foreground)" }}>
                Phase {activePhase.phase}: {activePhase.title}
              </h2>
            </div>
            <Link
              to="/app/playbook"
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold rounded-lg px-3 py-1.5"
              style={{ color: "var(--primary)", border: "1px solid var(--border)" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "var(--surface-2)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "transparent")
              }
            >
              View full playbook
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Phase nav pills */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {phases.map((ph, i) => {
              const isActive = i === Math.max(0, activePhaseIdx);
              const isDone = i < Math.max(0, activePhaseIdx);
              return (
                <div
                  key={ph.phase}
                  className="flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold"
                  style={{
                    background: isActive
                      ? "color-mix(in oklab, var(--primary) 12%, transparent)"
                      : "var(--surface-2)",
                    border: `1px solid ${isActive ? "color-mix(in oklab, var(--primary) 35%, transparent)" : "var(--border)"}`,
                    color: isActive
                      ? "var(--primary)"
                      : isDone
                        ? "var(--foreground)"
                        : "var(--muted-foreground)",
                  }}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-3 w-3" style={{ color: "#22c55e" }} />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                  Phase {ph.phase}
                </div>
              );
            })}
          </div>

          {/* Module cards */}
          <div className="space-y-2">
            {activePhase.modules.map((mod, i) => {
              const done = runKeys.has(mod.id);
              return (
                <Link
                  key={mod.id}
                  to={mod.path as never}
                  className="flex items-center gap-3 rounded-lg p-3 group transition-colors"
                  style={{
                    background: i === 0 && !done ? "var(--surface-2)" : "transparent",
                    border: `1px solid ${i === 0 && !done ? "color-mix(in oklab, var(--primary) 20%, transparent)" : "var(--border)"}`,
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "var(--surface-2)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      i === 0 && !done ? "var(--surface-2)" : "transparent")
                  }
                >
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: done
                        ? "rgba(34,197,94,0.1)"
                        : i === 0
                          ? "color-mix(in oklab, var(--primary) 12%, transparent)"
                          : "var(--surface-offset)",
                    }}
                  >
                    {done ? (
                      <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#22c55e" }} />
                    ) : (
                      <Circle
                        className="h-3.5 w-3.5"
                        style={{
                          color: i === 0 ? "var(--primary)" : "var(--muted-foreground)",
                        }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[13px] font-semibold leading-tight"
                      style={{
                        color: done ? "var(--muted-foreground)" : "var(--foreground)",
                        textDecoration: done ? "line-through" : "none",
                      }}
                    >
                      {mod.title}
                    </div>
                    <div
                      className="text-[11px] mt-0.5 truncate"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {mod.desc}
                    </div>
                  </div>
                  {!done && (
                    <ChevronRight
                      className="h-4 w-4 shrink-0 opacity-40 group-hover:opacity-80 transition-opacity"
                      style={{ color: i === 0 ? "var(--primary)" : "var(--muted-foreground)" }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Intelligence */}
        <div className="flex flex-col gap-4">
          {/* Growth trajectory */}
          <div
            className="rounded-xl p-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div
              className="text-[10px] font-semibold uppercase tracking-widest font-mono mb-3"
              style={{ color: "var(--muted-foreground)" }}
            >
              Growth Trajectory
            </div>
            <div className="space-y-2">
              {STAGES.map((s, i) => {
                const isCurrent = i === stageIdx;
                const isDone = i < stageIdx;
                const pct = isDone ? 100 : isCurrent ? Math.min(90, score) : 0;
                return (
                  <div key={s}>
                    <div className="flex justify-between mb-1">
                      <span
                        className="text-[11px] font-medium"
                        style={{
                          color: isCurrent
                            ? "var(--primary)"
                            : isDone
                              ? "var(--foreground)"
                              : "var(--muted-foreground)",
                        }}
                      >
                        {s}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-mono" style={{ color: "var(--primary)" }}>
                          active
                        </span>
                      )}
                    </div>
                    <div
                      className="h-1 rounded-full overflow-hidden"
                      style={{ background: "var(--border)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: isDone
                            ? "rgba(34,197,94,0.6)"
                            : isCurrent
                              ? "var(--primary)"
                              : "transparent",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* What to improve */}
          <div
            className="rounded-xl p-4 flex-1"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div
              className="text-[10px] font-semibold uppercase tracking-widest font-mono mb-3"
              style={{ color: "var(--muted-foreground)" }}
            >
              Improve Next
            </div>
            <div className="space-y-2">
              {improvements.slice(0, 3).map(({ icon: Icon, text, path }) => (
                <Link
                  key={text}
                  to={path as never}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 group transition-colors"
                  style={{ background: "var(--surface-2)" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.borderColor = "var(--primary)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.borderColor = "transparent")
                  }
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--primary)" }} />
                  <span
                    className="flex-1 text-[12px] font-medium leading-tight"
                    style={{ color: "var(--foreground)" }}
                  >
                    {text}
                  </span>
                  <ArrowRight
                    className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"
                    style={{ color: "var(--primary)" }}
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom row: Recent + Nova ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent runs */}
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3
              className="text-[11px] font-semibold uppercase tracking-widest font-mono"
              style={{ color: "var(--muted-foreground)" }}
            >
              Recent Activity
            </h3>
            <Link
              to="/app/launchpad/history"
              className="text-[11px] transition-colors"
              style={{ color: "var(--primary)" }}
            >
              View all
            </Link>
          </div>
          {!runsQ.data || runsQ.data.length === 0 ? (
            <div
              className="py-6 text-center text-[12px]"
              style={{ color: "var(--muted-foreground)" }}
            >
              No tool runs yet.{" "}
              <Link to="/app/launchpad/" style={{ color: "var(--primary)" }}>
                Open Launchpad →
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {runsQ.data.slice(0, 5).map((run: Record<string, unknown>, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg px-3 py-2"
                  style={{ background: "var(--surface-2)" }}
                >
                  <Zap className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--primary)" }} />
                  <span
                    className="flex-1 text-[12px] truncate font-medium"
                    style={{ color: "var(--foreground)" }}
                  >
                    {String(run.tool_key ?? run.tool ?? "Tool run").replace(/-/g, " ")}
                  </span>
                  <span
                    className="text-[11px] shrink-0"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {run.created_at ? new Date(run.created_at as string).toLocaleDateString() : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nova AI CTA */}
        <div
          className="rounded-xl p-5 flex flex-col"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderLeft: "3px solid var(--primary)",
          }}
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: "var(--primary)", color: "#fff" }}
            >
              N
            </div>
            <div>
              <div className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
                Ask Nova
              </div>
              <div className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                Your AI business advisor · full context
              </div>
            </div>
          </div>
          <p
            className="text-[12.5px] leading-relaxed flex-1"
            style={{ color: "var(--muted-foreground)" }}
          >
            Nova knows your stage, your goals, your tools run, and your pipeline. Ask it anything —
            strategy, execution, analysis, or what to do next.
          </p>
          <div className="mt-4 space-y-1.5">
            {[
              "What should I focus on this week?",
              "How do I get to the next stage?",
              "Analyse my business so far",
            ].map((prompt) => (
              <div
                key={prompt}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] cursor-default"
                style={{
                  background: "var(--surface-2)",
                  color: "var(--muted-foreground)",
                  border: "1px solid var(--border)",
                }}
              >
                <MessageSquare className="h-3 w-3 shrink-0" style={{ color: "var(--primary)" }} />
                <span className="flex-1">{prompt}</span>
                <span
                  className="text-[10px] shrink-0 font-mono"
                  style={{ color: "var(--primary)" }}
                >
                  ⌘K
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
