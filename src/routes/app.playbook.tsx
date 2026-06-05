import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { organizationQuery, toolRunsQuery } from "@/lib/queries";
import {
  CheckCircle2,
  Circle,
  Lock,
  ChevronRight,
  ArrowRight,
  Zap,
  Lightbulb,
  Target,
  Users,
  Map,
  FileText,
  Megaphone,
  Rocket,
  TrendingUp,
  Activity,
  BarChart3,
  Workflow,
  MessageSquare,
} from "lucide-react";

export const Route = createFileRoute("/app/playbook")({ component: PlaybookPage });

// ─── Types ────────────────────────────────────────────────────────────────────

type LucideIcon = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

type Step = string;

type Module = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  steps: Step[];
  effort: "30 min" | "1 hr" | "2 hr" | "ongoing";
};

type Phase = {
  phase: number;
  title: string;
  tagline: string;
  modules: Module[];
};

const STAGES = ["Idea", "Validate", "Launch", "Operate", "Scale"] as const;
type Stage = (typeof STAGES)[number];

// ─── Playbook config ──────────────────────────────────────────────────────────

const PLAYBOOK: Record<Stage, Phase[]> = {
  Idea: [
    {
      phase: 1,
      title: "Validate Your Concept",
      tagline: "Stress-test the idea before you invest time or money.",
      modules: [
        {
          id: "idea-validator",
          title: "Idea Validation",
          description: "Score your concept across 8 dimensions and get a GO / ITERATE / KILL verdict.",
          icon: Lightbulb,
          path: "/app/launchpad/idea-validator",
          effort: "30 min",
          steps: [
            "Describe your business idea clearly",
            "Evaluate market size and demand",
            "Check competitive differentiation",
            "Assess founder-market fit",
            "Get your overall viability score",
          ],
        },
        {
          id: "kill-my-idea",
          title: "Stress-Test the Idea",
          description: "Devil's advocate analysis — find every fatal flaw before investors do.",
          icon: Target,
          path: "/app/launchpad/kill-my-idea",
          effort: "30 min",
          steps: [
            "Run Kill My Idea analysis",
            "Identify the three critical vulnerabilities",
            "Document mitigation strategies",
            "Decide: pivot, iterate, or proceed",
          ],
        },
        {
          id: "competitor-scanner",
          title: "Competitive Landscape",
          description: "Map your competitive moat and identify positioning gaps.",
          icon: Map,
          path: "/app/launchpad/competitor-scanner",
          effort: "1 hr",
          steps: [
            "Identify direct and indirect competitors",
            "Map feature and pricing landscape",
            "Find your positioning gap",
            "Define your differentiated angle",
          ],
        },
      ],
    },
    {
      phase: 2,
      title: "Define Your Market",
      tagline: "Know exactly who you're building for and why they'll pay.",
      modules: [
        {
          id: "persona-builder",
          title: "Customer Persona Builder",
          description: "Deep psychographic profiles of your first 100 customers.",
          icon: Users,
          path: "/app/launchpad/persona-builder",
          effort: "1 hr",
          steps: [
            "Define your ideal customer profile (ICP)",
            "Map pain points and trigger events",
            "Identify watering holes and channels",
            "Create 2–3 detailed persona profiles",
          ],
        },
        {
          id: "gtm-strategy-builder",
          title: "Go-to-Market Strategy",
          description: "Channels, pricing, and ICP — your complete GTM playbook.",
          icon: Rocket,
          path: "/app/launchpad/gtm-strategy-builder",
          effort: "2 hr",
          steps: [
            "Choose your primary acquisition channel",
            "Set pricing and packaging",
            "Define your sales motion (self-serve, sales-led, etc.)",
            "Map the full customer journey",
            "Identify key milestones for traction",
          ],
        },
        {
          id: "business-plan-generator",
          title: "Business Plan",
          description: "Investor-grade business plan tailored to your concept.",
          icon: FileText,
          path: "/app/launchpad/business-plan-generator",
          effort: "2 hr",
          steps: [
            "Executive summary and mission",
            "Market opportunity and analysis",
            "Revenue model and unit economics",
            "12-month roadmap",
            "Team and competitive advantage",
          ],
        },
      ],
    },
    {
      phase: 3,
      title: "Acquire First Customers",
      tagline: "Your first 10 customers are the hardest — let's find them.",
      modules: [
        {
          id: "first-10-customers-finder",
          title: "First 10 Customers",
          description: "Specific outreach tactics for your exact business model.",
          icon: Target,
          path: "/app/launchpad/first-10-customers-finder",
          effort: "2 hr",
          steps: [
            "Identify 20 warm-lead prospects",
            "Craft personalised outreach messages",
            "Run outreach campaign",
            "Follow-up sequence (3-touch)",
            "Close your first paying customer",
          ],
        },
        {
          id: "landing-page-creator",
          title: "Landing Page Copy",
          description: "Conversion-optimised copy for hero, features, and CTA.",
          icon: Megaphone,
          path: "/app/launchpad/landing-page-creator",
          effort: "1 hr",
          steps: [
            "Generate headline and subheadline",
            "Write feature/benefit blocks",
            "Create social proof section",
            "Optimise CTA copy and placement",
          ],
        },
        {
          id: "pitch-generator",
          title: "Pitch Deck",
          description: "Slide-by-slide narrative optimised for your raise stage.",
          icon: BarChart3,
          path: "/app/launchpad/pitch-generator",
          effort: "2 hr",
          steps: [
            "Problem and market opportunity slides",
            "Solution and product demo flow",
            "Business model and traction",
            "Team and ask slides",
          ],
        },
      ],
    },
  ],

  Validate: [
    {
      phase: 1,
      title: "Sharpen Your Offer",
      tagline: "Turn your validated concept into a market-ready product.",
      modules: [
        {
          id: "persona-builder",
          title: "Customer Persona Builder",
          description: "Deep profiles of your first 100 customers.",
          icon: Users,
          path: "/app/launchpad/persona-builder",
          effort: "1 hr",
          steps: [
            "Define ideal customer profile",
            "Map pain points and triggers",
            "Identify best acquisition channels",
            "Create 2–3 persona profiles",
          ],
        },
        {
          id: "gtm-strategy-builder",
          title: "GTM Strategy",
          description: "Full go-to-market plan with channels and pricing.",
          icon: Rocket,
          path: "/app/launchpad/gtm-strategy-builder",
          effort: "2 hr",
          steps: [
            "Choose primary acquisition channel",
            "Set pricing model",
            "Define sales motion",
            "Map customer journey",
          ],
        },
        {
          id: "landing-page-creator",
          title: "Landing Page",
          description: "Convert visitors into sign-ups before you build.",
          icon: Megaphone,
          path: "/app/launchpad/landing-page-creator",
          effort: "1 hr",
          steps: [
            "Hero headline and CTA",
            "Feature/benefit blocks",
            "Social proof elements",
            "Publish and track conversions",
          ],
        },
      ],
    },
    {
      phase: 2,
      title: "Land First Revenue",
      tagline: "Close your first paying customers and validate willingness to pay.",
      modules: [
        {
          id: "first-10-customers-finder",
          title: "First 10 Customers",
          description: "Targeted outreach tactics for your model.",
          icon: Target,
          path: "/app/launchpad/first-10-customers-finder",
          effort: "2 hr",
          steps: [
            "Build list of 20 warm prospects",
            "Personalise outreach messages",
            "Run 3-touch follow-up sequence",
            "Close first paying customers",
          ],
        },
        {
          id: "email-sequence-builder",
          title: "Email Nurture Sequence",
          description: "Automated sequence that converts leads to customers.",
          icon: Megaphone,
          path: "/app/launchpad/email-sequence-builder",
          effort: "1 hr",
          steps: [
            "Write welcome email",
            "Craft 3-email nurture sequence",
            "Add conversion CTA email",
            "Set up automation trigger",
          ],
        },
        {
          id: "nova/crm",
          title: "Sales Pipeline",
          description: "Track every deal from prospect to close.",
          icon: Workflow,
          path: "/app/nova/crm",
          effort: "ongoing",
          steps: [
            "Add initial prospects",
            "Move deals through pipeline stages",
            "Log every touchpoint",
            "Track close rate weekly",
          ],
        },
      ],
    },
    {
      phase: 3,
      title: "Build Infrastructure",
      tagline: "Build the systems that make growth repeatable.",
      modules: [
        {
          id: "automations",
          title: "CRM Automations",
          description: "Automate lead follow-up so nothing falls through.",
          icon: Activity,
          path: "/app/automations",
          effort: "1 hr",
          steps: [
            "Set up lead capture automation",
            "Configure follow-up sequence",
            "Add pipeline stage triggers",
            "Test end-to-end flow",
          ],
        },
        {
          id: "kpi-dashboard",
          title: "KPI Dashboard",
          description: "Model your next 12 months of growth.",
          icon: BarChart3,
          path: "/app/launchpad/kpi-dashboard",
          effort: "1 hr",
          steps: [
            "Define your 5 key metrics",
            "Set monthly targets",
            "Build 12-month projection",
            "Identify growth levers",
          ],
        },
        {
          id: "business-plan-generator",
          title: "Business Plan",
          description: "Investor-grade plan for fundraising or clarity.",
          icon: FileText,
          path: "/app/launchpad/business-plan-generator",
          effort: "2 hr",
          steps: [
            "Market opportunity analysis",
            "Revenue model and unit economics",
            "12-month roadmap",
            "Funding requirements",
          ],
        },
      ],
    },
  ],

  Launch: [
    {
      phase: 1,
      title: "Activate Revenue",
      tagline: "Convert your pipeline into consistent revenue.",
      modules: [
        {
          id: "nova/crm",
          title: "Sales Pipeline",
          description: "Track and close deals systematically.",
          icon: Workflow,
          path: "/app/nova/crm",
          effort: "ongoing",
          steps: [
            "Review open deals daily",
            "Follow up within 24 hours",
            "Move deals through stages",
            "Track weekly close rate",
          ],
        },
        {
          id: "automations",
          title: "Lead Automations",
          description: "Automate follow-up and qualification.",
          icon: Activity,
          path: "/app/automations",
          effort: "1 hr",
          steps: [
            "Set up inbound lead capture",
            "Configure qualification sequence",
            "Add CRM stage automations",
            "Test and activate workflows",
          ],
        },
        {
          id: "kpi-dashboard",
          title: "Revenue Metrics",
          description: "Model growth and track the numbers that matter.",
          icon: BarChart3,
          path: "/app/launchpad/kpi-dashboard",
          effort: "1 hr",
          steps: [
            "Set monthly revenue target",
            "Track MRR, churn, and CAC",
            "Build 12-month projection",
            "Review weekly",
          ],
        },
      ],
    },
    {
      phase: 2,
      title: "Build Growth Engine",
      tagline: "Create repeatable channels that compound over time.",
      modules: [
        {
          id: "scale/campaigns",
          title: "Growth Campaigns",
          description: "Email, SMS and content campaigns that drive pipeline.",
          icon: Megaphone,
          path: "/app/scale/campaigns",
          effort: "2 hr",
          steps: [
            "Define campaign goal and audience",
            "Build email or SMS sequence",
            "Launch and track open/click rates",
            "Optimise based on results",
          ],
        },
        {
          id: "contacts",
          title: "Contact Expansion",
          description: "Grow and organise your database for outreach at scale.",
          icon: Users,
          path: "/app/contacts",
          effort: "ongoing",
          steps: [
            "Import existing contacts",
            "Segment by stage and intent",
            "Tag for campaign targeting",
            "Add 10 new contacts per week",
          ],
        },
        {
          id: "pitch-generator",
          title: "Pitch Deck",
          description: "Series-ready narrative for investors.",
          icon: BarChart3,
          path: "/app/launchpad/pitch-generator",
          effort: "2 hr",
          steps: [
            "Update traction and metrics",
            "Refine market size with real data",
            "Add team and roadmap slides",
            "Prepare Q&A talking points",
          ],
        },
      ],
    },
    {
      phase: 3,
      title: "Prepare to Scale",
      tagline: "Build the capital and systems foundation for the next level.",
      modules: [
        {
          id: "funding-readiness-score",
          title: "Funding Readiness",
          description: "Score your startup against investor criteria.",
          icon: TrendingUp,
          path: "/app/launchpad/funding-readiness-score",
          effort: "1 hr",
          steps: [
            "Complete funding readiness assessment",
            "Identify gaps vs investor benchmarks",
            "Create 90-day improvement plan",
            "Schedule first investor conversations",
          ],
        },
        {
          id: "investor-email-writer",
          title: "Investor Outreach",
          description: "Personalised cold emails to your target investor list.",
          icon: FileText,
          path: "/app/launchpad/investor-email-writer",
          effort: "1 hr",
          steps: [
            "Build target investor list (20+)",
            "Generate personalised email copy",
            "Send in batches of 5–10",
            "Track responses and follow up",
          ],
        },
        {
          id: "scale",
          title: "Scale Systems",
          description: "Campaign, voice AI, and automation infrastructure.",
          icon: Rocket,
          path: "/app/scale",
          effort: "2 hr",
          steps: [
            "Audit current automation stack",
            "Activate scale-level campaign tools",
            "Set up voice AI for outreach",
            "Review and optimise weekly",
          ],
        },
      ],
    },
  ],

  Operate: [
    {
      phase: 1,
      title: "Systemise Operations",
      tagline: "Remove yourself from the day-to-day with automation.",
      modules: [
        {
          id: "automations",
          title: "Advanced Automations",
          description: "Full-stack workflow automation for every stage of the funnel.",
          icon: Activity,
          path: "/app/automations",
          effort: "2 hr",
          steps: [
            "Map current manual workflows",
            "Prioritise highest-leverage automations",
            "Build and activate top 3",
            "Monitor and optimise weekly",
          ],
        },
        {
          id: "scale/pipeline",
          title: "Pipeline Management",
          description: "Keep deal momentum at scale.",
          icon: Workflow,
          path: "/app/scale/pipeline",
          effort: "ongoing",
          steps: [
            "Review pipeline velocity weekly",
            "Identify stalled deals",
            "Optimise stage conversion rates",
            "Forecast monthly close rate",
          ],
        },
        {
          id: "kpi-dashboard",
          title: "Business Intelligence",
          description: "Revenue projection and growth metrics.",
          icon: BarChart3,
          path: "/app/launchpad/kpi-dashboard",
          effort: "1 hr",
          steps: [
            "Define company-level KPIs",
            "Build 12-month revenue model",
            "Set growth benchmarks",
            "Review with team monthly",
          ],
        },
      ],
    },
    {
      phase: 2,
      title: "Accelerate Growth",
      tagline: "Scale the channels that are already working.",
      modules: [
        {
          id: "scale/campaigns",
          title: "Scale Campaigns",
          description: "Multi-channel campaigns at operating scale.",
          icon: Megaphone,
          path: "/app/scale/campaigns",
          effort: "2 hr",
          steps: [
            "Analyse top-performing campaigns",
            "Double down on winning channels",
            "Launch new segmented campaigns",
            "A/B test copy and sequences",
          ],
        },
        {
          id: "contacts",
          title: "Database Expansion",
          description: "Grow and segment your contact database.",
          icon: Users,
          path: "/app/contacts",
          effort: "ongoing",
          steps: [
            "Segment existing database",
            "Identify expansion segments",
            "Run targeted outreach",
            "Track segment conversion rates",
          ],
        },
        {
          id: "nova/reports",
          title: "Revenue Reports",
          description: "Deep analytics and business intelligence.",
          icon: BarChart3,
          path: "/app/nova/reports",
          effort: "ongoing",
          steps: [
            "Set up revenue reporting",
            "Track cohort retention",
            "Analyse CAC and LTV",
            "Share with team weekly",
          ],
        },
      ],
    },
    {
      phase: 3,
      title: "Raise or Reinvest",
      tagline: "Decide the capital strategy that accelerates the trajectory.",
      modules: [
        {
          id: "funding-readiness-score",
          title: "Funding Readiness",
          description: "Full investor-readiness assessment.",
          icon: TrendingUp,
          path: "/app/launchpad/funding-readiness-score",
          effort: "1 hr",
          steps: [
            "Complete readiness assessment",
            "Compare to Series A benchmarks",
            "Create fundraising plan",
            "Identify lead investors",
          ],
        },
        {
          id: "investor-email-writer",
          title: "Investor Outreach",
          description: "Warm and cold investor emails at scale.",
          icon: FileText,
          path: "/app/launchpad/investor-email-writer",
          effort: "1 hr",
          steps: [
            "Build tier-1 investor list",
            "Generate personalised outreach",
            "Track investor responses",
            "Move to partner meetings",
          ],
        },
        {
          id: "pitch-generator",
          title: "Series Pitch Deck",
          description: "Update your narrative with current traction.",
          icon: BarChart3,
          path: "/app/launchpad/pitch-generator",
          effort: "2 hr",
          steps: [
            "Update traction and metrics",
            "Refine use-of-funds slide",
            "Add unit economics data",
            "Prepare investor FAQ",
          ],
        },
      ],
    },
  ],

  Scale: [
    {
      phase: 1,
      title: "Secure Capital",
      tagline: "Raise the round that funds the next order of growth.",
      modules: [
        {
          id: "funding-readiness-score",
          title: "Funding Readiness Score",
          description: "Score your startup against what top-tier investors look for.",
          icon: TrendingUp,
          path: "/app/launchpad/funding-readiness-score",
          effort: "1 hr",
          steps: [
            "Full investor-readiness assessment",
            "Gap analysis vs benchmarks",
            "60-day improvement plan",
            "Start investor outreach",
          ],
        },
        {
          id: "investor-email-writer",
          title: "Investor Emails",
          description: "Personalised cold emails to your target list.",
          icon: FileText,
          path: "/app/launchpad/investor-email-writer",
          effort: "1 hr",
          steps: [
            "Build Tier-1 investor list (30+)",
            "Generate personalised email copy",
            "Send in weekly batches",
            "Track and follow up",
          ],
        },
        {
          id: "pitch-generator",
          title: "Series Pitch Deck",
          description: "Investor-grade narrative for your current raise.",
          icon: BarChart3,
          path: "/app/launchpad/pitch-generator",
          effort: "2 hr",
          steps: [
            "Update all traction metrics",
            "Sharpen market size story",
            "Add team and moat slides",
            "Rehearse with advisors",
          ],
        },
      ],
    },
    {
      phase: 2,
      title: "Scale Infrastructure",
      tagline: "Build the systems that support 10x growth.",
      modules: [
        {
          id: "scale",
          title: "Scale Automations",
          description: "Campaign, voice AI, and full automation suite.",
          icon: Rocket,
          path: "/app/scale",
          effort: "2 hr",
          steps: [
            "Audit existing automations",
            "Activate advanced scale tools",
            "Set up voice AI outreach",
            "Monitor weekly performance",
          ],
        },
        {
          id: "scale/campaigns",
          title: "Growth Campaigns",
          description: "Multi-channel campaigns at scale.",
          icon: Megaphone,
          path: "/app/scale/campaigns",
          effort: "2 hr",
          steps: [
            "Define scale campaign strategy",
            "Launch cross-channel sequences",
            "A/B test at scale",
            "Track ROAS and optimize",
          ],
        },
        {
          id: "kpi-dashboard",
          title: "Growth Metrics",
          description: "Track what compounds at scale.",
          icon: BarChart3,
          path: "/app/launchpad/kpi-dashboard",
          effort: "ongoing",
          steps: [
            "Set scale-stage OKRs",
            "Track growth efficiency (GE ratio)",
            "Monitor net revenue retention",
            "Weekly leadership review",
          ],
        },
      ],
    },
    {
      phase: 3,
      title: "Optimise & Compound",
      tagline: "Turn every system into a growth flywheel.",
      modules: [
        {
          id: "automations",
          title: "Full-Stack Automation",
          description: "Automate every workflow across your entire operation.",
          icon: Activity,
          path: "/app/automations",
          effort: "2 hr",
          steps: [
            "Map all remaining manual processes",
            "Automate top 5 by volume",
            "Connect systems via integrations",
            "Track time and cost savings",
          ],
        },
        {
          id: "contacts",
          title: "Enterprise Pipeline",
          description: "Segment and nurture large accounts at scale.",
          icon: Users,
          path: "/app/contacts",
          effort: "ongoing",
          steps: [
            "Build enterprise segment",
            "Create ABM campaigns",
            "Assign account owners",
            "Track enterprise MRR monthly",
          ],
        },
        {
          id: "nova/reports",
          title: "Business Intelligence",
          description: "Deep analytics across all business functions.",
          icon: BarChart3,
          path: "/app/nova/reports",
          effort: "ongoing",
          steps: [
            "Build exec dashboard",
            "Track LTV:CAC by channel",
            "Monitor NRR and expansion revenue",
            "Board reporting cadence",
          ],
        },
      ],
    },
  ],
};

// ─── Component ────────────────────────────────────────────────────────────────

function PlaybookPage() {
  const { currentOrgId } = useAuth();
  const orgQ = useQuery({ ...organizationQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const runsQ = useQuery({ ...toolRunsQuery(currentOrgId ?? ""), enabled: !!currentOrgId });

  const stage: Stage = (orgQ.data?.stage as Stage) ?? "Idea";
  const stageIdx = STAGES.indexOf(stage);
  const phases = PLAYBOOK[stage];

  const runKeys = new Set(
    (runsQ.data ?? []).map((r: Record<string, unknown>) => r.tool_key as string),
  );

  const completedCount = phases
    .flatMap((p) => p.modules)
    .filter((m) => runKeys.has(m.id)).length;
  const totalCount = phases.flatMap((p) => p.modules).length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Default to first phase with incomplete modules
  const defaultPhase = Math.max(
    0,
    phases.findIndex((ph) => ph.modules.some((m) => !runKeys.has(m.id))),
  );
  const [activePhase, setActivePhase] = useState(defaultPhase);

  const currentPhase = phases[activePhase];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div
            className="text-[10px] font-semibold uppercase tracking-widest font-mono mb-1"
            style={{ color: "var(--primary)" }}
          >
            Stage {stageIdx + 1} of 5 — {stage}
          </div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            Your Playbook
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
            Your personalised execution plan — phase by phase, module by module.
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

      {/* ── Overall progress ── */}
      <div
        className="rounded-xl p-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-semibold" style={{ color: "var(--foreground)" }}>
            Overall Progress
          </span>
          <span className="text-[12px] font-mono" style={{ color: "var(--primary)" }}>
            {completedCount} / {totalCount} modules
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progressPct}%`,
              background: "linear-gradient(90deg, var(--primary), #fbbf24)",
            }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {phases.map((ph, i) => {
            const done = ph.modules.every((m) => runKeys.has(m.id));
            const active = i === activePhase;
            return (
              <button
                key={ph.phase}
                onClick={() => setActivePhase(i)}
                className="text-[10px] font-medium"
                style={{
                  color: active
                    ? "var(--primary)"
                    : done
                      ? "var(--foreground)"
                      : "var(--muted-foreground)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                P{ph.phase}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Phase tabs ── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {phases.map((ph, i) => {
          const done = ph.modules.every((m) => runKeys.has(m.id));
          const active = i === activePhase;
          const locked = i > stageIdx + 1;
          return (
            <button
              key={ph.phase}
              onClick={() => !locked && setActivePhase(i)}
              className="flex items-center gap-2 shrink-0 rounded-xl px-4 py-2.5 text-left transition-colors"
              style={{
                background: active
                  ? "color-mix(in oklab, var(--primary) 12%, transparent)"
                  : "var(--surface)",
                border: `1px solid ${active ? "color-mix(in oklab, var(--primary) 40%, transparent)" : "var(--border)"}`,
                cursor: locked ? "not-allowed" : "pointer",
                opacity: locked ? 0.45 : 1,
                fontFamily: "inherit",
              }}
            >
              {locked ? (
                <Lock className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--muted-foreground)" }} />
              ) : done ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: "#22c55e" }} />
              ) : (
                <Circle
                  className="h-3.5 w-3.5 shrink-0"
                  style={{ color: active ? "var(--primary)" : "var(--muted-foreground)" }}
                />
              )}
              <div>
                <div
                  className="text-[10px] font-mono font-semibold"
                  style={{
                    color: active ? "var(--primary)" : "var(--muted-foreground)",
                  }}
                >
                  PHASE {ph.phase}
                </div>
                <div
                  className="text-[12px] font-semibold leading-tight"
                  style={{ color: active ? "var(--foreground)" : "var(--muted-foreground)" }}
                >
                  {ph.title}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Phase content ── */}
      <div>
        <p className="text-[13px] mb-5" style={{ color: "var(--muted-foreground)" }}>
          {currentPhase.tagline}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {currentPhase.modules.map((mod) => {
            const done = runKeys.has(mod.id);
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                className="rounded-xl p-5 flex flex-col"
                style={{
                  background: "var(--surface)",
                  border: `1px solid ${done ? "rgba(34,197,94,0.25)" : "var(--border)"}`,
                }}
              >
                {/* Module header */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: done
                        ? "rgba(34,197,94,0.1)"
                        : "color-mix(in oklab, var(--primary) 10%, transparent)",
                    }}
                  >
                    <Icon
                      className="h-4.5 w-4.5"
                      style={{ color: done ? "#22c55e" : "var(--primary)" }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3
                        className="text-[13px] font-bold leading-tight"
                        style={{ color: "var(--foreground)" }}
                      >
                        {mod.title}
                      </h3>
                      {done && (
                        <CheckCircle2
                          className="h-3.5 w-3.5 shrink-0"
                          style={{ color: "#22c55e" }}
                        />
                      )}
                    </div>
                    <div
                      className="text-[10px] font-mono mt-0.5"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {mod.effort}
                    </div>
                  </div>
                </div>

                <p
                  className="text-[12px] leading-relaxed mb-4"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {mod.description}
                </p>

                {/* Steps */}
                <div className="space-y-1.5 flex-1 mb-4">
                  {mod.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
                        style={{
                          background: done
                            ? "rgba(34,197,94,0.15)"
                            : "var(--surface-2)",
                          color: done ? "#22c55e" : "var(--muted-foreground)",
                          border: `1px solid ${done ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
                        }}
                      >
                        {done ? "✓" : i + 1}
                      </div>
                      <span
                        className="text-[11.5px] leading-snug"
                        style={{
                          color: done ? "var(--muted-foreground)" : "var(--foreground)",
                          textDecoration: done ? "line-through" : "none",
                          opacity: done ? 0.6 : 1,
                        }}
                      >
                        {step}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex gap-2 mt-auto">
                  <Link
                    to={mod.path as never}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-semibold transition-colors"
                    style={{
                      background: done ? "var(--surface-2)" : "var(--primary)",
                      color: done ? "var(--muted-foreground)" : "#fff",
                      border: done ? "1px solid var(--border)" : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!done)
                        (e.currentTarget as HTMLElement).style.background = "var(--primary-hover)";
                    }}
                    onMouseLeave={(e) => {
                      if (!done)
                        (e.currentTarget as HTMLElement).style.background = "var(--primary)";
                    }}
                  >
                    {done ? "Run again" : "Execute"}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                  <Link
                    to="/app/launchpad/"
                    className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors"
                    style={{
                      background: "var(--surface-2)",
                      color: "var(--muted-foreground)",
                      border: "1px solid var(--border)",
                    }}
                    title="Ask Nova about this module"
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.color = "var(--primary)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)")
                    }
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
