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
  FileText,
  ChevronRight,
  TrendingUp,
  Target,
  Lightbulb,
  Map,
  GitCompare,
  Megaphone,
  Rocket,
  BarChart3,
} from "lucide-react";

export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });

// ─── helpers ──────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const STAGES = ["Idea", "Validate", "Launch", "Operate", "Scale"] as const;
type Stage = (typeof STAGES)[number];

// Blueprint: stage → recommended steps with tool links
const BLUEPRINT: Record<
  Stage,
  {
    title: string;
    desc: string;
    path: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  }[]
> = {
  Idea: [
    {
      title: "Validate your idea",
      desc: "Score your concept across 8 dimensions — get a GO/ITERATE/KILL verdict.",
      path: "/app/launchpad/idea-validator",
      icon: Lightbulb,
    },
    {
      title: "Stress-test with Kill My Idea",
      desc: "Devil's advocate analysis. Find every fatal flaw before investors do.",
      path: "/app/launchpad/kill-my-idea",
      icon: Target,
    },
    {
      title: "Scan the competitive landscape",
      desc: "Map your competitive moat and identify positioning gaps.",
      path: "/app/launchpad/competitor-scanner",
      icon: GitCompare,
    },
  ],
  Validate: [
    {
      title: "Build your GTM strategy",
      desc: "Channels, pricing, ICP — your complete go-to-market playbook.",
      path: "/app/launchpad/gtm-strategy-builder",
      icon: Map,
    },
    {
      title: "Define your customer personas",
      desc: "Deep psychographic profiles of your first 100 customers.",
      path: "/app/launchpad/persona-builder",
      icon: Users,
    },
    {
      title: "Generate a business plan",
      desc: "Investor-grade business plan tailored to your concept.",
      path: "/app/launchpad/business-plan-generator",
      icon: FileText,
    },
  ],
  Launch: [
    {
      title: "Find your first 10 customers",
      desc: "Specific outreach tactics for your exact business model.",
      path: "/app/launchpad/first-10-customers-finder",
      icon: Users,
    },
    {
      title: "Build your pitch deck",
      desc: "Slide-by-slide narrative optimised for your raise stage.",
      path: "/app/launchpad/pitch-generator",
      icon: Megaphone,
    },
    {
      title: "Create landing page copy",
      desc: "Conversion-optimised copy for your hero, features, and CTA.",
      path: "/app/launchpad/landing-page-creator",
      icon: Rocket,
    },
  ],
  Operate: [
    {
      title: "Set up CRM automations",
      desc: "Automate lead follow-up so no prospect falls through the cracks.",
      path: "/app/automations",
      icon: Activity,
    },
    {
      title: "Review your pipeline",
      desc: "Track deals from prospect to close — keep momentum.",
      path: "/app/scale/pipeline",
      icon: TrendingUp,
    },
    {
      title: "Run a revenue projection",
      desc: "Model your next 12 months with multiple growth scenarios.",
      path: "/app/launchpad/kpi-dashboard",
      icon: BarChart3,
    },
  ],
  Scale: [
    {
      title: "Assess funding readiness",
      desc: "Score your startup against what top-tier investors look for.",
      path: "/app/launchpad/funding-readiness-score",
      icon: TrendingUp,
    },
    {
      title: "Write investor emails",
      desc: "Personalised cold emails to your target investor list.",
      path: "/app/launchpad/investor-email-writer",
      icon: FileText,
    },
    {
      title: "Activate scale automations",
      desc: "Campaign, SMS, and voice AI systems for growth.",
      path: "/app/scale",
      icon: Rocket,
    },
  ],
};

// Nova's directive per stage
const NOVA_DIRECTIVE: Record<Stage, { headline: string; action: string; path: string }> = {
  Idea: {
    headline: "Start with validation — most ideas fail for predictable reasons.",
    action: "Run Idea Validator",
    path: "/app/launchpad/idea-validator",
  },
  Validate: {
    headline: "You have a validated concept. Now build your go-to-market strategy.",
    action: "Build GTM Strategy",
    path: "/app/launchpad/gtm-strategy-builder",
  },
  Launch: {
    headline: "Time to acquire customers. Your first 10 are the hardest — let's find them.",
    action: "Find First 10 Customers",
    path: "/app/launchpad/first-10-customers-finder",
  },
  Operate: {
    headline: "You're operating. The focus now is pipeline velocity and automation.",
    action: "Review Pipeline",
    path: "/app/scale/pipeline",
  },
  Scale: {
    headline: "Scaling requires capital or systems — often both. Let's assess your readiness.",
    action: "Funding Readiness Score",
    path: "/app/launchpad/funding-readiness-score",
  },
};

// ─── component ────────────────────────────────────────────────────────────────

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
  const steps = BLUEPRINT[stage];
  const directive = NOVA_DIRECTIVE[stage];

  const runCount = runsQ.data?.length ?? 0;
  const leadCount = leadsQ.data?.length ?? 0;
  const activeAuto =
    (autoQ.data as Array<{ status?: string }> | null)?.filter((a) => a.status === "active")
      .length ?? 0;

  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* ── Greeting ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-bold"
            style={{ color: "var(--foreground)", letterSpacing: "-0.01em" }}
          >
            {greeting()}, {name}.
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
            {date} · Stage{" "}
            <span className="font-semibold" style={{ color: "var(--primary)" }}>
              {stage}
            </span>
          </p>
        </div>

        <Link
          to="/app/launchpad/"
          className="hidden sm:inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors shrink-0"
          style={{ background: "var(--primary)", color: "#fff" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--primary-hover)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--primary)";
          }}
        >
          <Zap className="h-3.5 w-3.5" />
          Open Launchpad
        </Link>
      </div>

      {/* ── Nova Directive ── */}
      <div
        className="rounded-xl p-5"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderLeft: "3px solid var(--primary)",
        }}
      >
        <div
          className="mb-1 text-[10px] font-semibold uppercase tracking-widest font-mono"
          style={{ color: "var(--primary)" }}
        >
          Nova recommends
        </div>
        <p
          className="text-[15px] font-medium leading-snug mb-3"
          style={{ color: "var(--foreground)" }}
        >
          {directive.headline}
        </p>
        <Link
          to={directive.path as never}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors"
          style={{ background: "var(--primary)", color: "#fff" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--primary-hover)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--primary)";
          }}
        >
          {directive.action}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* ── Metrics ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tools Run", value: runCount, icon: Zap, path: "/app/launchpad/" },
          { label: "Contacts", value: leadCount, icon: Users, path: "/app/contacts" },
          {
            label: "Active Automations",
            value: activeAuto,
            icon: Activity,
            path: "/app/automations",
          },
          {
            label: "Current Stage",
            value: `${stageIdx + 1} / 5`,
            icon: TrendingUp,
            path: "/app/galaxy",
          },
        ].map(({ label, value, icon: Icon, path }) => (
          <Link
            key={label}
            to={path as never}
            className="rounded-xl p-4 transition-colors group"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "color-mix(in oklab, var(--primary) 30%, transparent)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg mb-3"
              style={{ background: "var(--surface-2)" }}
            >
              <Icon className="h-4 w-4" style={{ color: "var(--primary)" }} />
            </div>
            <div className="text-2xl font-bold font-mono" style={{ color: "var(--foreground)" }}>
              {value}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              {label}
            </div>
          </Link>
        ))}
      </div>

      {/* ── Stage Journey ── */}
      <div>
        <h2
          className="text-[11px] font-semibold uppercase tracking-widest font-mono mb-3"
          style={{ color: "var(--muted-foreground)" }}
        >
          Business Journey
        </h2>
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          {/* Stage bar */}
          <div className="flex items-center gap-0 mb-5">
            {STAGES.map((s, i) => {
              const isActive = i === stageIdx;
              const isDone = i < stageIdx;
              return (
                <div key={s} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className="h-1.5 w-full transition-colors"
                      style={{
                        background: isDone
                          ? "var(--primary)"
                          : isActive
                            ? "var(--primary)"
                            : "var(--border)",
                        opacity: isActive ? 1 : isDone ? 0.7 : 0.4,
                      }}
                    />
                    <span
                      className="mt-1.5 text-[10px] font-medium"
                      style={{
                        color: isActive
                          ? "var(--primary)"
                          : isDone
                            ? "var(--foreground)"
                            : "var(--muted-foreground)",
                        fontWeight: isActive ? 700 : 500,
                      }}
                    >
                      {s}
                    </span>
                  </div>
                  {i < STAGES.length - 1 && (
                    <ChevronRight
                      className="h-3 w-3 shrink-0 -mx-0.5"
                      style={{
                        color: i < stageIdx ? "var(--primary)" : "var(--border)",
                        opacity: i < stageIdx ? 0.6 : 0.4,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Blueprint steps for current stage */}
          <div
            className="mb-2 text-[10px] font-semibold uppercase tracking-widest font-mono"
            style={{ color: "var(--muted-foreground)" }}
          >
            Next steps in {stage}
          </div>
          <div className="space-y-2">
            {steps.map(({ title, desc, path, icon: Icon }, i) => (
              <Link
                key={i}
                to={path as never}
                className="flex items-start gap-3 rounded-lg p-3 transition-colors group"
                style={{
                  background: i === 0 ? "var(--surface-2)" : "transparent",
                  border: `1px solid ${i === 0 ? "color-mix(in oklab, var(--primary) 20%, transparent)" : "var(--border)"}`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    i === 0 ? "var(--surface-2)" : "transparent";
                }}
              >
                <div
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background:
                      i === 0
                        ? "color-mix(in oklab, var(--primary) 10%, transparent)"
                        : "var(--surface-offset)",
                  }}
                >
                  <Icon
                    className="h-3.5 w-3.5"
                    style={{ color: i === 0 ? "var(--primary)" : "var(--muted-foreground)" }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-[13px] font-semibold leading-tight"
                    style={{ color: "var(--foreground)" }}
                  >
                    {title}
                  </div>
                  <div
                    className="text-[11.5px] mt-0.5 leading-snug"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {desc}
                  </div>
                </div>
                {i === 0 && (
                  <ArrowRight
                    className="h-4 w-4 shrink-0 mt-1.5"
                    style={{ color: "var(--primary)" }}
                  />
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom row: recent runs + open Nova ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent tool runs */}
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
              {runsQ.data.slice(0, 5).map((run: Record<string, unknown>, i) => (
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

        {/* Nova prompt */}
        <div
          className="rounded-xl p-4 flex flex-col"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="h-7 w-7 rounded-full flex items-center justify-center"
              style={{ background: "var(--primary)" }}
            >
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <div className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>
                Ask Nova
              </div>
              <div className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                Your AI business advisor
              </div>
            </div>
          </div>
          <p
            className="text-[12.5px] leading-relaxed flex-1"
            style={{ color: "var(--muted-foreground)" }}
          >
            Nova has full context of your workspace — your stage, tools run, contacts, and
            automations. Ask anything about your business.
          </p>
          <div className="mt-3 space-y-1.5">
            {["What should I focus on this week?", "How do I get to the next stage?"].map((p) => (
              <div
                key={p}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] cursor-default"
                style={{
                  background: "var(--surface-2)",
                  color: "var(--muted-foreground)",
                  border: "1px solid var(--border)",
                }}
              >
                <span className="flex-1">{p}</span>
                <span
                  className="text-[10px] shrink-0 font-mono"
                  style={{ color: "var(--primary)" }}
                >
                  ⌘+K Nova
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
