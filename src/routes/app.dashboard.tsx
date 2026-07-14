import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useWorkspace } from "@/hooks/use-workspace";
import { toolRunsQuery, leadsQuery, automationSettingsQuery } from "@/lib/queries";
import {
  ArrowRight,
  Zap,
  Users,
  Activity,
  CheckCircle2,
  Circle,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Settings,
  BookOpen,
} from "lucide-react";
import { NovaAvatar } from "@/components/nova/NovaAvatar";
import { useProgressSpine } from "@/hooks/use-progress-spine";
import type { LaunchpadStageId } from "@/lib/ecosystem";
import { AdaptiveGuidance } from "@/components/app/AdaptiveGuidance";
import { AiBriefingCard } from "@/components/app/dashboard/AiBriefingCard";
import { WorkspaceStatusBanner } from "@/components/app/dashboard/WorkspaceStatusBanner";
import { ModuleBoundary } from "@/components/app/ModuleBoundary";
import { CurrentMissionCard } from "@/components/app/dashboard/CurrentMissionCard";

export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });

// Playbook content is still authored against the legacy 5-value org.stage
// vocabulary. Stage position itself comes from useProgressSpine().stage — the
// canonical derivation — and CANONICAL_TO_PLAYBOOK below re-keys that position
// into this content vocabulary (same pattern as LAUNCHPAD_TO_ROADMAP in
// business-roadmap.ts). Nothing here may read org.stage.
const PLAYBOOK_KEYS = ["Idea", "Validate", "Launch", "Operate", "Scale"] as const;
type Stage = (typeof PLAYBOOK_KEYS)[number];

const CANONICAL_TO_PLAYBOOK: Record<LaunchpadStageId, Stage> = {
  idea: "Idea",
  // Stress-test modules (kill-my-idea, competitor-scanner) live in the Idea
  // playbook's phase 1 — exactly the proof the canonical validate stage needs.
  validate: "Idea",
  // Validate playbook phase 1 is "Sharpen Your Offer" (personas, GTM, plan).
  offer: "Validate",
  // Validate playbook phase 3 is "Build Infrastructure" (automations, KPI).
  build: "Validate",
  launch: "Launch",
  // Launch playbook phase 1 is "Activate Revenue" — first paying customers.
  revenue: "Launch",
};

/** Once every canonical stage through Revenue is proven, show the post-revenue
 *  operations content. (The "Scale" playbook is unreachable from the canonical
 *  spine — flagged for Phase 3 content cleanup.) */
function playbookKeyFor(stage: { current: { id: LaunchpadStageId; done: boolean } }): Stage {
  if (stage.current.id === "revenue" && stage.current.done) return "Operate";
  return CANONICAL_TO_PLAYBOOK[stage.current.id];
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

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
  if (n >= 75) return { text: "Strong", color: "var(--success)" };
  if (n >= 50) return { text: "Building", color: "var(--primary)" };
  return { text: "Early", color: "var(--muted-foreground)" };
}

type PlaybookModule = { id: string; title: string; desc: string; path: string; time: string };
type PlaybookPhase = { phase: number; title: string; modules: PlaybookModule[] };

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
          time: "~15 min",
        },
        {
          id: "kill-my-idea",
          title: "Stress-Test the Idea",
          desc: "Devil's advocate — find every fatal flaw",
          path: "/app/launchpad/kill-my-idea",
          time: "~10 min",
        },
        {
          id: "competitor-scanner",
          title: "Competitive Landscape",
          desc: "Map your moat and positioning gaps",
          path: "/app/launchpad/competitor-scanner",
          time: "~12 min",
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
          time: "~20 min",
        },
        {
          id: "gtm-strategy-builder",
          title: "GTM Strategy",
          desc: "Channels, pricing, ICP — full go-to-market",
          path: "/app/launchpad/gtm-strategy-builder",
          time: "~25 min",
        },
        {
          id: "business-plan-generator",
          title: "Business Plan",
          desc: "Investor-grade plan for your concept",
          path: "/app/launchpad/business-plan-generator",
          time: "~30 min",
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
          time: "~18 min",
        },
        {
          id: "landing-page-creator",
          title: "Landing Page Copy",
          desc: "Conversion-optimised hero & CTA copy",
          path: "/app/launchpad/landing-page-creator",
          time: "~15 min",
        },
        {
          id: "pitch-generator",
          title: "Pitch Deck",
          desc: "Slide-by-slide narrative for your raise",
          path: "/app/launchpad/pitch-generator",
          time: "~22 min",
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
          time: "~20 min",
        },
        {
          id: "gtm-strategy-builder",
          title: "GTM Strategy",
          desc: "Full go-to-market plan",
          path: "/app/launchpad/gtm-strategy-builder",
          time: "~25 min",
        },
        {
          id: "business-plan-generator",
          title: "Business Plan",
          desc: "Full investor-grade plan",
          path: "/app/launchpad/business-plan-generator",
          time: "~30 min",
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
          time: "~18 min",
        },
        {
          id: "landing-page-creator",
          title: "Landing Page",
          desc: "Convert visitors into leads",
          path: "/app/launchpad/landing-page-creator",
          time: "~15 min",
        },
        {
          id: "email-sequence-builder",
          title: "Email Sequence",
          desc: "Nurture sequence for your list",
          path: "/app/launchpad/email-sequence-builder",
          time: "~20 min",
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
          time: "~10 min",
        },
        {
          id: "contacts",
          title: "Contact Database",
          desc: "Organise your pipeline",
          path: "/app/contacts",
          time: "~5 min",
        },
        {
          id: "kpi-dashboard",
          title: "KPI Dashboard",
          desc: "Track the metrics that matter",
          path: "/app/launchpad/kpi-dashboard",
          time: "~15 min",
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
          time: "~18 min",
        },
        {
          id: "pitch-generator",
          title: "Pitch Deck",
          desc: "Narrative optimised for your stage",
          path: "/app/launchpad/pitch-generator",
          time: "~22 min",
        },
        {
          id: "nova/crm",
          title: "Sales Pipeline",
          desc: "Track every deal from prospect to close",
          path: "/app/nova/crm",
          time: "~5 min",
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
          time: "~10 min",
        },
        {
          id: "scale/campaigns",
          title: "Growth Campaigns",
          desc: "Email, SMS and content campaigns",
          path: "/app/scale/campaigns",
          time: "~15 min",
        },
        {
          id: "kpi-dashboard",
          title: "Revenue Metrics",
          desc: "Model your next 12 months",
          path: "/app/launchpad/kpi-dashboard",
          time: "~15 min",
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
          time: "~20 min",
        },
        {
          id: "investor-email-writer",
          title: "Investor Outreach",
          desc: "Personalised emails to target investors",
          path: "/app/launchpad/investor-email-writer",
          time: "~15 min",
        },
        {
          id: "scale",
          title: "Scale Systems",
          desc: "Campaign and automation infrastructure",
          path: "/app/scale",
          time: "~10 min",
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
          time: "~10 min",
        },
        {
          id: "scale/pipeline",
          title: "Pipeline",
          desc: "Keep deal momentum",
          path: "/app/scale/pipeline",
          time: "~5 min",
        },
        {
          id: "kpi-dashboard",
          title: "KPI Dashboard",
          desc: "Revenue projections and metrics",
          path: "/app/launchpad/kpi-dashboard",
          time: "~15 min",
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
          time: "~15 min",
        },
        {
          id: "contacts",
          title: "Contact Expansion",
          desc: "Grow and segment your database",
          path: "/app/contacts",
          time: "~5 min",
        },
        {
          id: "funding-readiness-score",
          title: "Funding Readiness",
          desc: "Assess readiness to raise",
          path: "/app/launchpad/funding-readiness-score",
          time: "~20 min",
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
          time: "~15 min",
        },
        {
          id: "scale",
          title: "Scale Infrastructure",
          desc: "Voice AI, SMS, full automation suite",
          path: "/app/scale",
          time: "~10 min",
        },
        {
          id: "pitch-generator",
          title: "Series Pitch",
          desc: "Narrative for your next round",
          path: "/app/launchpad/pitch-generator",
          time: "~22 min",
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
          time: "~20 min",
        },
        {
          id: "investor-email-writer",
          title: "Investor Emails",
          desc: "Personalised cold outreach",
          path: "/app/launchpad/investor-email-writer",
          time: "~15 min",
        },
        {
          id: "pitch-generator",
          title: "Pitch Deck",
          desc: "Series-ready narrative",
          path: "/app/launchpad/pitch-generator",
          time: "~22 min",
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
          time: "~10 min",
        },
        {
          id: "scale/campaigns",
          title: "Growth Campaigns",
          desc: "Multi-channel at scale",
          path: "/app/scale/campaigns",
          time: "~15 min",
        },
        {
          id: "kpi-dashboard",
          title: "Growth Metrics",
          desc: "Track what compounds",
          path: "/app/launchpad/kpi-dashboard",
          time: "~15 min",
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
          time: "~10 min",
        },
        {
          id: "contacts",
          title: "Enterprise Pipeline",
          desc: "Segment and nurture at scale",
          path: "/app/contacts",
          time: "~5 min",
        },
        {
          id: "nova/reports",
          title: "Business Intelligence",
          desc: "Deep analytics and insights",
          path: "/app/nova/reports",
          time: "~10 min",
        },
      ],
    },
  ],
};

const PRIORITY_ICONS: Record<
  string,
  React.ComponentType<{ size?: number; style?: React.CSSProperties }>
> = {
  launchpad: Zap,
  contacts: Users,
  automations: Activity,
  playbook: BookOpen,
  growth: TrendingUp,
  kpi: BarChart3,
};

function getIconForPath(path: string) {
  if (path.includes("launchpad")) return Zap;
  if (path.includes("contacts")) return Users;
  if (path.includes("automation")) return Activity;
  if (path.includes("playbook")) return BookOpen;
  if (path.includes("mentor")) return TrendingUp;
  return Settings;
}

function HealthRing({ score, color }: { score: number; color: string }) {
  const R = 44;
  const CIRC = 2 * Math.PI * R;
  const offset = CIRC * (1 - score / 100);
  return (
    <div className="relative flex items-center justify-center" style={{ width: 108, height: 108 }}>
      <svg
        width="108"
        height="108"
        viewBox="0 0 108 108"
        style={{ position: "absolute", inset: 0 }}
      >
        <circle cx="54" cy="54" r={R} fill="none" stroke="var(--border)" strokeWidth="5" />
        <circle
          cx="54"
          cy="54"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "54px 54px",
            transition: "stroke-dashoffset 0.8s cubic-bezier(0.2,0.8,0.2,1)",
          }}
        />
      </svg>
      <div className="relative flex flex-col items-center">
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "28px",
            fontWeight: 800,
            lineHeight: 1,
            color,
          }}
        >
          {score}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "9px",
            fontWeight: 600,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: "var(--muted-foreground)",
            marginTop: "3px",
          }}
        >
          /100
        </span>
      </div>
    </div>
  );
}

function StageMapNode({
  name,
  isCurrent,
  isDone,
}: {
  name: string;
  isCurrent: boolean;
  isDone: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5" style={{ minWidth: 60 }}>
      <div className="relative flex items-center justify-center">
        {isCurrent && (
          <span
            className="absolute rounded-full"
            style={{
              width: 36,
              height: 36,
              background: "var(--primary)",
              opacity: 0.18,
              animation: "nova-mid-pulse 2s ease-in-out infinite",
            }}
          />
        )}
        <div
          className="relative flex items-center justify-center rounded-full"
          style={{
            width: isCurrent ? 28 : 20,
            height: isCurrent ? 28 : 20,
            background: isDone
              ? "var(--primary)"
              : isCurrent
                ? "var(--primary)"
                : "var(--surface-2)",
            border: isDone || isCurrent ? "2px solid var(--primary)" : "2px solid var(--border)",
            transition: "all 0.2s ease",
            flexShrink: 0,
          }}
        >
          {isDone && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M2 5l2.5 2.5L8 3"
                stroke="#fff"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>
      <span
        style={{
          fontFamily: isCurrent ? "var(--font-display)" : "var(--font-body)",
          fontSize: "11px",
          fontWeight: isCurrent ? 600 : 400,
          color: isCurrent
            ? "var(--primary)"
            : isDone
              ? "var(--foreground)"
              : "var(--muted-foreground)",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </span>
    </div>
  );
}

function Dashboard() {
  const { user, profile, currentOrgId } = useAuth();
  useWorkspace();
  const spine = useProgressSpine();

  const runsQ = useQuery({ ...toolRunsQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const leadsQ = useQuery({ ...leadsQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const autoQ = useQuery({
    ...automationSettingsQuery(currentOrgId ?? ""),
    enabled: !!currentOrgId,
  });

  const name = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  // Canonical stage — spine only. org.stage (the self-reported 5-value enum)
  // must not drive anything on this page.
  const spineStages = spine.stage.stages;
  const stageIdx = spine.stage.currentIndex;
  const runCount = runsQ.data?.length ?? 0;
  const leadCount = leadsQ.data?.length ?? 0;
  const activeAuto =
    (autoQ.data as Array<{ status?: string }> | null)?.filter((a) => a.status === "active")
      .length ?? 0;

  const score = healthScore(runCount, leadCount, activeAuto, stageIdx);
  const { text: scoreText, color: scoreColor } = scoreLabel(score);
  const novaLearnedCount = runCount * 3;

  const runKeys = new Set(
    (runsQ.data ?? []).map((r: Record<string, unknown>) => r.tool_key as string),
  );

  const phases = PLAYBOOK_DATA[playbookKeyFor(spine.stage)];
  const activePhaseIdx = Math.max(
    0,
    Math.min(
      phases.findIndex((ph) => ph.modules.some((m) => !runKeys.has(m.id))),
      phases.length - 1,
    ),
  );
  const activePhase = phases[activePhaseIdx];
  const nextStageName = spineStages[Math.min(stageIdx + 1, spineStages.length - 1)].label;
  const tasksLeft = activePhase.modules.filter((m) => !runKeys.has(m.id)).length;

  // Quick action chips (contextual)
  type Chip = { label: string; path: string };
  const chips: Chip[] = [
    { label: runCount === 0 ? "Run first tool" : "Open Launchpad", path: "/app/launchpad/" },
    { label: leadCount === 0 ? "Add a contact" : "View pipeline", path: "/app/contacts" },
    { label: "Talk to Nova", path: "/app/mentor" },
  ];

  // Improvements — Nova's voice
  type Improvement = {
    Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
    text: string;
    path: string;
    time: string;
  };
  const improvements: Improvement[] = [];
  if (runCount === 0)
    improvements.push({
      Icon: Zap,
      text: "I need you to run your first Launchpad tool to start building your foundation.",
      path: "/app/launchpad/",
      time: "~15 min",
    });
  if (leadCount === 0)
    improvements.push({
      Icon: Users,
      text: "I need you to add your first contact. Revenue starts with a name in your pipeline.",
      path: "/app/contacts",
      time: "~5 min",
    });
  if (activeAuto === 0)
    improvements.push({
      Icon: Activity,
      text: "I need you to activate an automation so no lead falls through the cracks.",
      path: "/app/automations",
      time: "~10 min",
    });
  if (improvements.length < 3)
    improvements.push({
      Icon: TrendingUp,
      text: "I need you to brief your Growth Commander on your acquisition strategy.",
      path: "/app/mentor",
      time: "~20 min",
    });
  if (improvements.length < 3)
    improvements.push({
      Icon: BarChart3,
      text: "I need you to run the KPI Dashboard so we have a single source of truth.",
      path: "/app/launchpad/kpi-dashboard",
      time: "~15 min",
    });

  const mood: "active" | "thinking" | "alert" =
    score >= 70 ? "active" : score >= 40 ? "thinking" : "alert";

  const briefText = `Your business is ${scoreText.toLowerCase()} at ${spine.stage.current.label} stage. ${runCount} tool${runCount !== 1 ? "s" : ""} complete. Top priority: ${improvements[0]?.text.replace("I need you to ", "").split(".")[0]}.`;

  return (
    <div className="space-y-5">
      {/* ── Section 0: provisioning repair / operator cockpit strip ── */}
      <ModuleBoundary name="workspace status">
        <WorkspaceStatusBanner />
      </ModuleBoundary>

      {/* ── Section 1: Nova Brief ── */}
      <div
        className="rounded-xl p-5 flex gap-5 items-start"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="shrink-0 pt-0.5">
          <NovaAvatar size="lg" mood={mood} />
        </div>
        <div className="flex-1 min-w-0">
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--foreground)",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
            }}
          >
            {greeting()}, {name}.
          </h1>
          <p
            className="mt-1"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "15px",
              color: "var(--muted-foreground)",
              lineHeight: 1.5,
            }}
          >
            {briefText}
          </p>
          {novaLearnedCount > 0 && (
            <p
              className="mt-1"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--primary)",
                letterSpacing: "0.04em",
              }}
            >
              Nova has learned {novaLearnedCount} things about your business.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <Link
                key={chip.label}
                to={chip.path as never}
                className="inline-flex items-center rounded-full transition-colors"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  fontWeight: 500,
                  padding: "5px 14px",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--primary-soft)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--primary-border)";
                  (e.currentTarget as HTMLElement).style.color = "var(--primary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
                }}
              >
                {chip.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 1.5: AI Briefing (merged from /app/ai-dashboard) ── */}
      <ModuleBoundary name="AI briefing">
        <AiBriefingCard />
      </ModuleBoundary>

      {/* ── Section 1.6: Focus — the current mission (design system §5.4) ── */}
      {user?.id && (
        <ModuleBoundary name="current mission">
          <CurrentMissionCard userId={user.id} />
        </ModuleBoundary>
      )}

      {/* ── Section 2: Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Health Score — col-span-2 */}
        <div
          className="md:col-span-2 rounded-xl p-5 flex items-center gap-5"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <HealthRing score={score} color={scoreColor} />
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--muted-foreground)",
                marginBottom: "6px",
              }}
            >
              Business Health
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "22px",
                fontWeight: 700,
                color: scoreColor,
                lineHeight: 1.1,
              }}
            >
              {scoreText}
            </div>
            <p
              className="mt-1"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                color: "var(--muted-foreground)",
                lineHeight: 1.4,
              }}
            >
              {/* Canonical stage from the progress spine — must always match
                  mission-control's stage bar (same computation, same value). */}
              Stage {spine.stage.currentIndex + 1} of {spine.stage.stages.length} ·{" "}
              {spine.stage.current.label}
            </p>
          </div>
        </div>

        {/* Contacts */}
        <Link
          to="/app/contacts"
          className="rounded-xl p-4 group transition-all"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--primary-border)";
            (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLElement).style.background = "var(--surface)";
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--muted-foreground)",
              marginBottom: "8px",
            }}
          >
            Contacts
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "28px",
              fontWeight: 700,
              color: "var(--foreground)",
              lineHeight: 1,
            }}
          >
            {leadCount}
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              color: "var(--muted-foreground)",
              marginTop: "4px",
            }}
          >
            {leadCount === 0 ? "None yet" : "in pipeline"}
          </div>
        </Link>

        {/* Tools Run */}
        <Link
          to="/app/launchpad"
          className="rounded-xl p-4 group transition-all"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--primary-border)";
            (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLElement).style.background = "var(--surface)";
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--muted-foreground)",
              marginBottom: "8px",
            }}
          >
            Tools Run
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "28px",
              fontWeight: 700,
              color: "var(--foreground)",
              lineHeight: 1,
            }}
          >
            {runCount}
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              color: "var(--muted-foreground)",
              marginTop: "4px",
            }}
          >
            {runCount === 0 ? "None yet" : "executions"}
          </div>
        </Link>
      </div>

      {/* ── Adaptive Guidance ── */}
      {currentOrgId && user && (
        <AdaptiveGuidance orgId={currentOrgId} userId={user.id} stageIdx={stageIdx} />
      )}

      {/* ── Section 3: Stage Map ── */}
      <div
        className="rounded-xl p-5"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--muted-foreground)",
            marginBottom: "20px",
          }}
        >
          Execution Stage
        </div>

        <div className="relative flex items-start justify-between px-2">
          {/* Track line */}
          <div
            className="absolute"
            style={{
              top: "12px",
              left: "calc(12px + 2%)",
              right: "calc(12px + 2%)",
              height: "2px",
              background: "var(--border)",
              zIndex: 0,
            }}
          />
          {/* Completed fill */}
          {stageIdx > 0 && (
            <div
              className="absolute"
              style={{
                top: "12px",
                left: "calc(12px + 2%)",
                width: `${(stageIdx / (spineStages.length - 1)) * 96}%`,
                height: "2px",
                background: "var(--primary)",
                zIndex: 1,
                transition: "width 0.6s cubic-bezier(0.2,0.8,0.2,1)",
              }}
            />
          )}
          {spineStages.map((s) => (
            <div key={s.id} style={{ zIndex: 2, position: "relative" }}>
              <StageMapNode name={s.label} isCurrent={s.current} isDone={s.done && !s.current} />
            </div>
          ))}
        </div>

        {stageIdx < spineStages.length - 1 && (
          <p
            className="mt-4"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: "var(--muted-foreground)",
              textAlign: "center",
            }}
          >
            Nova:{" "}
            <span style={{ color: "var(--foreground)", fontWeight: 500 }}>
              {tasksLeft} task{tasksLeft !== 1 ? "s" : ""} until {nextStageName} unlocks.
            </span>
          </p>
        )}
      </div>

      {/* ── Main grid: Playbook + Improvements ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Section 4: Active Playbook Phase ── */}
        <div
          className="lg:col-span-2 rounded-xl p-5"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--primary)",
                  marginBottom: "4px",
                }}
              >
                Active Playbook
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "var(--foreground)",
                  letterSpacing: "-0.01em",
                }}
              >
                Phase {activePhase.phase}: {activePhase.title}
              </h2>
            </div>
            <Link
              to="/app/launchpad"
              className="inline-flex items-center gap-1.5 rounded-lg transition-colors"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                fontWeight: 500,
                padding: "6px 12px",
                color: "var(--primary)",
                border: "1px solid var(--border)",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "var(--surface-offset)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "transparent")
              }
            >
              Full Launchpad
              <ArrowRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>

          <div className="space-y-2">
            {activePhase.modules.map((mod, i) => {
              const done = runKeys.has(mod.id);
              const isRecommended = i === 0 && !done;
              return (
                <Link
                  key={mod.id}
                  to={mod.path as never}
                  className="flex items-center gap-3 rounded-xl p-3.5 transition-all group"
                  style={{
                    background: isRecommended
                      ? "var(--primary-soft)"
                      : done
                        ? "transparent"
                        : "var(--surface-offset)",
                    border: isRecommended
                      ? "1px solid var(--primary-border)"
                      : done
                        ? "1px solid var(--border)"
                        : "1px solid var(--border)",
                    opacity: done ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!done) {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--primary-border)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = isRecommended
                      ? "var(--primary-border)"
                      : "var(--border)";
                  }}
                >
                  <div
                    className="shrink-0 flex items-center justify-center rounded-lg"
                    style={{
                      width: 32,
                      height: 32,
                      background: done
                        ? "color-mix(in oklab, var(--success) 10%, transparent)"
                        : isRecommended
                          ? "color-mix(in oklab, var(--primary) 12%, transparent)"
                          : "var(--surface-2)",
                    }}
                  >
                    {done ? (
                      <CheckCircle2 style={{ width: 14, height: 14, color: "var(--success)" }} />
                    ) : (
                      <Circle
                        style={{
                          width: 14,
                          height: 14,
                          color: isRecommended ? "var(--primary)" : "var(--muted-foreground)",
                        }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: done ? "var(--muted-foreground)" : "var(--foreground)",
                          textDecoration: done ? "line-through" : "none",
                        }}
                      >
                        {mod.title}
                      </span>
                      {isRecommended && (
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "9px",
                            fontWeight: 700,
                            letterSpacing: "0.10em",
                            textTransform: "uppercase",
                            color: "var(--primary)",
                            border: "1px solid var(--primary-border)",
                            borderRadius: "999px",
                            padding: "2px 8px",
                          }}
                        >
                          Nova Recommends
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "12px",
                        color: "var(--muted-foreground)",
                        marginTop: "1px",
                      }}
                    >
                      {mod.desc}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        color: "var(--text-faint)",
                      }}
                    >
                      {mod.time}
                    </span>
                    {!done && (
                      <ChevronRight
                        style={{
                          width: 14,
                          height: 14,
                          color: isRecommended ? "var(--primary)" : "var(--muted-foreground)",
                          opacity: 0.6,
                        }}
                        className="group-hover:opacity-100 transition-opacity"
                      />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Section 5: What to Improve ── */}
        <div
          className="rounded-xl p-5 flex flex-col gap-3"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--muted-foreground)",
              marginBottom: "4px",
            }}
          >
            Nova's Priorities
          </div>

          {improvements.slice(0, 3).map(({ Icon, text, path, time }) => (
            <Link
              key={path + text}
              to={path as never}
              className="flex items-start gap-3 rounded-xl p-3.5 group transition-all"
              style={{
                border: "1px solid var(--border)",
                background: "var(--surface-offset)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--primary-border)";
                (e.currentTarget as HTMLElement).style.background = "var(--primary-soft)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLElement).style.background = "var(--surface-offset)";
              }}
            >
              <Icon
                size={15}
                style={{ color: "var(--primary)", marginTop: "1px", flexShrink: 0 }}
              />
              <div className="flex-1 min-w-0">
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "var(--foreground)",
                    lineHeight: 1.4,
                  }}
                >
                  {text}
                </p>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    color: "var(--muted-foreground)",
                    marginTop: "3px",
                    display: "block",
                  }}
                >
                  {time}
                </span>
              </div>
              <ArrowRight
                size={12}
                style={{ color: "var(--primary)", flexShrink: 0, marginTop: "3px", opacity: 0.5 }}
                className="group-hover:opacity-100 transition-opacity"
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
