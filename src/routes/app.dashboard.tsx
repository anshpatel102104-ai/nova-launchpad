import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CurrentMissionCard } from "@/components/app/dashboard/CurrentMissionCard";
import { AskOperatorCard } from "@/components/app/dashboard/AskOperatorCard";
import { ApprovedOfferCard } from "@/components/app/dashboard/ApprovedOfferCard";
import { LaunchAssetsCard } from "@/components/app/dashboard/LaunchAssetsCard";
import { AutomationStatusCard } from "@/components/app/dashboard/AutomationStatusCard";
import { YourPathCard } from "@/components/app/dashboard/YourPathCard";
import { WhatNextCard } from "@/components/app/dashboard/WhatNextCard";
import { classifyLane } from "@/lib/lane-classifier";
import { useAuth } from "@/lib/auth";
import {
  organizationQuery,
  subscriptionQuery,
  toolRunsQuery,
  usageQuery,
  planEntitlementsQuery,
  generatedAssetsQuery,
  leadsQuery,
  integrationsQuery,
  automationSettingsQuery,
} from "@/lib/queries";
import {
  Sparkles,
  Rocket,
  Inbox,
  ArrowRight,
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
  Target,
  Lightbulb,
  Megaphone,
  Globe,
  Mail,
  TrendingUp,
  Check,
  Clock,
  Plus,
  Skull,
  Trophy,
  UserPlus,
  FileText,
  GitCompare,
  Workflow,
  ListChecks,
  UserCheck,
  LineChart,
  ArrowUpRight,
  LayoutDashboard,
  Brain,
  Command,
  ChevronRight,
  Radio,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getLastAppPath, clearLastAppPath } from "@/lib/session-restore";

export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });

function greetingFor(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const STAGES = ["Idea", "Validate", "Launch", "Operate", "Scale"] as const;
type StageName = (typeof STAGES)[number];

const LAUNCHPAD_TILES = [
  {
    key: "validate-idea",
    name: "Idea Validator",
    icon: Lightbulb,
    to: "/app/launchpad/idea-validator",
  },
  {
    key: "generate-pitch",
    name: "Pitch Generator",
    icon: Megaphone,
    to: "/app/launchpad/pitch-generator",
  },
  {
    key: "generate-gtm-strategy",
    name: "GTM Strategy",
    icon: Target,
    to: "/app/launchpad/gtm-strategy",
  },
  { key: "generate-offer", name: "Offer Builder", icon: Sparkles, to: "/app/launchpad/offer" },
  { key: "kill-my-idea", name: "Kill My Idea", icon: Skull, to: "/app/launchpad/kill-my-idea" },
  { key: "funding-score", name: "Funding Score", icon: Trophy, to: "/app/launchpad/funding-score" },
  {
    key: "first-10-customers",
    name: "First 10 Customers",
    icon: UserPlus,
    to: "/app/launchpad/first-10-customers",
  },
  {
    key: "business-plan",
    name: "Business Plan",
    icon: FileText,
    to: "/app/launchpad/business-plan",
  },
  {
    key: "investor-emails",
    name: "Investor Emails",
    icon: Mail,
    to: "/app/launchpad/investor-emails",
  },
  {
    key: "idea-vs-idea",
    name: "Idea vs Idea",
    icon: GitCompare,
    to: "/app/launchpad/idea-vs-idea",
  },
] as const;

const NOVA_SYSTEMS = [
  { key: "crm", name: "CRM Pipeline", icon: Workflow, to: "/app/nova/crm" },
  { key: "leads", name: "Lead Capture", icon: Inbox, to: "/app/nova/leads" },
  { key: "workflows", name: "Automation", icon: Zap, to: "/app/nova/workflows" },
  { key: "followup", name: "Follow-Up & Booking", icon: Mail, to: "/app/nova/workflows" },
  { key: "clients", name: "Client Onboarding", icon: ListChecks, to: "/app/nova/clients" },
  { key: "reports", name: "Reporting", icon: LineChart, to: "/app/nova/reports" },
] as const;

const QUICK_ACTIONS = [
  { label: "Validate Idea", to: "/app/launchpad/idea-validator", icon: Lightbulb },
  { label: "Generate Pitch", to: "/app/launchpad/pitch-generator", icon: Megaphone },
  { label: "Build GTM", to: "/app/launchpad/gtm-strategy", icon: Target },
  { label: "Kill My Idea", to: "/app/launchpad/kill-my-idea", icon: Skull },
  { label: "First 10 Customers", to: "/app/launchpad/first-10-customers", icon: UserPlus },
  { label: "Funding Score", to: "/app/launchpad/funding-score", icon: Trophy },
  { label: "Capture Leads", to: "/app/nova/leads", icon: Inbox },
  { label: "Revenue Projector", to: "/app/launchpad/revenue-projector", icon: LineChart },
];


function Dashboard() {
  const { currentOrgId, profile, user } = useAuth();
  const [resumePath, setResumePath] = React.useState<string | null>(null);

  React.useEffect(() => {
    setResumePath(getLastAppPath());
  }, []);

  const orgQ = useQuery({ ...organizationQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const subQ = useQuery({ ...subscriptionQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const runsQ = useQuery({ ...toolRunsQuery(currentOrgId ?? "", 8), enabled: !!currentOrgId });
  const allRunsQ = useQuery({ ...toolRunsQuery(currentOrgId ?? "", 100), enabled: !!currentOrgId });
  const usageQ = useQuery({ ...usageQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const plansQ = useQuery(planEntitlementsQuery());
  const assetsQ = useQuery({
    ...generatedAssetsQuery(currentOrgId ?? ""),
    enabled: !!currentOrgId,
  });
  const leadsQ = useQuery({ ...leadsQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const intsQ = useQuery({ ...integrationsQuery(user?.id ?? ""), enabled: !!user?.id });
  const autoQ = useQuery({
    ...automationSettingsQuery(currentOrgId ?? ""),
    enabled: !!currentOrgId,
  });

  const org = orgQ.data;
  const sub = subQ.data;
  const recentRuns = runsQ.data ?? [];
  const allRuns = allRunsQ.data ?? [];
  const usage = usageQ.data ?? [];
  const assets = assetsQ.data ?? [];
  const leads = leadsQ.data ?? [];
  const integrations = intsQ.data ?? [];
  const automations = autoQ.data ?? [];

  const isLoading = orgQ.isLoading || subQ.isLoading || runsQ.isLoading;

  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div
          className="rounded-2xl"
          style={{
            minHeight: 220,
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl p-5"
              style={{
                height: 120,
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            />
          ))}
        </div>
        <div
          className="rounded-2xl"
          style={{ height: 260, background: "var(--surface)", border: "1px solid var(--border)" }}
        />
      </div>
    );
  }

  if (!currentOrgId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-xl text-white"
          style={{ background: "var(--primary)" }}
        >
          <Sparkles className="h-8 w-8" />
        </div>
        <h2 className="mt-5 font-display text-2xl font-bold tracking-tight">
          Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h2>
        <p className="mt-2 text-[13.5px]" style={{ color: "var(--muted-foreground)" }}>
          Finish onboarding to set up your workspace.
        </p>
        <Link to="/onboarding">
          <Button className="mt-5">Start onboarding</Button>
        </Link>
      </div>
    );
  }

  const totalUsed = usage.reduce((s, r) => s + (r.count as number), 0);
  const limit = plansQ.data?.find((p) => p.plan === sub?.plan)?.monthly_generation_limit ?? null;
  const firstName = (profile?.full_name || "").split(" ")[0] || "there";
  const planLabel =
    (sub?.plan ?? "starter").charAt(0).toUpperCase() + (sub?.plan ?? "starter").slice(1);
  const orgStage = (org?.stage ?? "Idea") as StageName;
  const stageIdx = STAGES.indexOf(orgStage);

  const succeeded = (k: string) =>
    allRuns.some((r) => r.tool_key === k && r.status === "succeeded");
  const inProgress = (k: string) => allRuns.some((r) => r.tool_key === k && r.status === "running");
  const launchpadStatus = (k: string): "complete" | "in-progress" | "not-started" =>
    succeeded(k) ? "complete" : inProgress(k) ? "in-progress" : "not-started";
  const launchpadComplete = LAUNCHPAD_TILES.filter(
    (t) => launchpadStatus(t.key) === "complete",
  ).length;

  const novaStatus = (k: string): "active" | "setup" | "inactive" => {
    if (k === "crm" || k === "leads") return leads.length > 0 ? "active" : "setup";
    if (k === "workflows" || k === "followup")
      return automations.length > 0
        ? "active"
        : integrations.some(
              (i) => i.integration_key?.startsWith("nova:webhook:") && i.status === "connected",
            )
          ? "active"
          : "setup";
    if (k === "clients")
      return assets.some((a) => a.kind === "client-onboarding") ? "active" : "setup";
    if (k === "reports") return allRuns.length > 5 ? "active" : "inactive";
    return "inactive";
  };
  const novaActive = NOVA_SYSTEMS.filter((s) => novaStatus(s.key) === "active").length;
  const wonLeads = leads.filter((l) => l.stage === "Won").length;
  const qualifiedPipe = leads.filter((l) =>
    ["Qualified", "Proposal"].includes(l.stage as string),
  ).length;

  const checklist = [
    {
      id: "profile",
      label: "Complete your profile",
      done: !!profile?.onboarding_complete,
      to: "/app/settings",
    },
    {
      id: "validate",
      label: "Validate your first idea",
      done: succeeded("validate-idea"),
      to: "/app/launchpad/idea-validator",
    },
    {
      id: "pitch",
      label: "Generate your pitch",
      done: succeeded("generate-pitch"),
      to: "/app/launchpad/pitch-generator",
    },
    {
      id: "gtm",
      label: "Map your go-to-market",
      done: succeeded("generate-gtm-strategy"),
      to: "/app/launchpad/gtm-strategy",
    },
    { id: "lead", label: "Capture your first lead", done: leads.length > 0, to: "/app/nova/leads" },
    {
      id: "automate",
      label: "Wire an automation",
      done: automations.length > 0,
      to: "/app/nova/workflows",
    },
  ];
  const checklistDone = checklist.filter((c) => c.done).length;
  const checklistComplete = checklistDone === checklist.length;

  const nextAction = (() => {
    if (!succeeded("validate-idea"))
      return {
        title: "Validate your idea first",
        desc: "Pressure-test market signal before you build anything.",
        cta: "Run validator",
        to: "/app/launchpad/idea-validator",
        icon: Lightbulb,
      };
    if (!succeeded("generate-pitch"))
      return {
        title: "Generate your pitch",
        desc: "Investor-ready pitch you can send today.",
        cta: "Generate pitch",
        to: "/app/launchpad/pitch-generator",
        icon: Megaphone,
      };
    if (!succeeded("generate-gtm-strategy"))
      return {
        title: "Map your go-to-market",
        desc: "Channels, ICP, and messaging in one plan.",
        cta: "Plan GTM",
        to: "/app/launchpad/gtm-strategy",
        icon: Target,
      };
    if (leads.length === 0)
      return {
        title: "Capture your first lead",
        desc: "Track every prospect from first touch to close.",
        cta: "Add a lead",
        to: "/app/nova/leads",
        icon: UserPlus,
      };
    if (automations.length === 0)
      return {
        title: "Automate your follow-ups",
        desc: "Wire a sequence so no lead goes cold.",
        cta: "Open workflows",
        to: "/app/nova/workflows",
        icon: Zap,
      };
    if (wonLeads === 0)
      return {
        title: "Move a lead to Won",
        desc: "Watch the funnel come alive in your CRM.",
        cta: "Open pipeline",
        to: "/app/nova/crm",
        icon: Trophy,
      };
    return {
      title: "Open your reports",
      desc: "See conversion, pipeline velocity, and revenue trends.",
      cta: "View reports",
      to: "/app/nova/reports",
      icon: LineChart,
    };
  })();

  const resumeLabel = resumePath
    ? (resumePath
        .split("/")
        .pop()
        ?.replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Last session")
    : null;

  return (
    <div className="space-y-5">
      {/* ── RESUME BANNER ── */}
      {resumePath && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 14px",
            borderRadius: 10,
            border: "1px solid rgba(249,115,22,0.2)",
            background: "rgba(249,115,22,0.06)",
            fontSize: 12.5,
          }}
        >
          <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--primary)" }} />
          <span style={{ color: "var(--muted-foreground)", flex: 1 }}>
            Resume where you left off:{" "}
            <span style={{ color: "var(--foreground)", fontWeight: 600 }}>{resumeLabel}</span>
          </span>
          <Link
            to={resumePath}
            style={{
              fontSize: 12,
              color: "var(--primary)",
              fontWeight: 600,
              textDecoration: "none",
              marginRight: 8,
            }}
          >
            Continue <ArrowRight style={{ display: "inline", width: 10, height: 10 }} />
          </Link>
          <button
            onClick={() => {
              clearLastAppPath();
              setResumePath(null);
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--muted-foreground)",
              cursor: "pointer",
              fontSize: 14,
              lineHeight: 1,
              padding: 0,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── HERO: COMMAND CENTER ── */}
      <div
        className="relative overflow-hidden rounded-xl"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* Content */}
        <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  background: "rgba(249,115,22,0.1)",
                  border: "1px solid rgba(249,115,22,0.2)",
                  color: "var(--primary)",
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {orgStage} Stage
              </span>
              <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                {planLabel} Plan
              </span>
            </div>

            <h1
              className="font-display font-bold tracking-tight leading-none"
              style={{
                fontSize: "clamp(1.6rem, 2.5vw + 0.8rem, 2.4rem)",
                color: "var(--foreground)",
                letterSpacing: "-0.03em",
              }}
            >
              {greetingFor()}, {firstName}
            </h1>
            <p
              className="mt-2 text-[13px] leading-relaxed"
              style={{ color: "var(--muted-foreground)" }}
            >
              {org?.name ? `${org.name} · ` : ""}Your AI operating system.
            </p>

            {/* Stage progress */}
            <div className="mt-4 flex items-center gap-1.5">
              {STAGES.map((s, i) => (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="h-1 w-8 rounded-full transition-all duration-500"
                      style={{
                        background:
                          i <= stageIdx
                            ? "var(--primary)"
                            : "var(--surface-2)",
                      }}
                    />
                    <span
                      className="text-[8px] font-mono uppercase tracking-wide"
                      style={{
                        color: i <= stageIdx ? "var(--primary)" : "var(--muted-foreground)",
                        opacity: i <= stageIdx ? 1 : 0.5,
                      }}
                    >
                      {s}
                    </span>
                  </div>
                  {i < STAGES.length - 1 && (
                    <div
                      className="h-px w-2 mb-3"
                      style={{
                        background: i < stageIdx ? "var(--primary)" : "var(--border)",
                        opacity: 0.5,
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 md:items-end shrink-0">
            {/* Metrics */}
            <div className="flex gap-2">
              {[
                { label: "Tools", value: `${launchpadComplete}/${LAUNCHPAD_TILES.length}` },
                { label: "Systems", value: `${novaActive}/${NOVA_SYSTEMS.length}` },
                { label: "Leads", value: `${leads.length}` },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-lg px-3 py-2 text-center min-w-[62px]"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                >
                  <div
                    className="text-[8px] font-mono uppercase tracking-widest"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {label}
                  </div>
                  <div
                    className="font-mono font-bold tabular-nums mt-0.5 text-lg"
                    style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <Link to={nextAction.to}>
              <button
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition-all duration-150"
                style={{
                  background: "var(--primary)",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                }}
                onMouseEnter={(e: React.MouseEvent) => {
                  (e.currentTarget as HTMLElement).style.opacity = "0.9";
                }}
                onMouseLeave={(e: React.MouseEvent) => {
                  (e.currentTarget as HTMLElement).style.opacity = "1";
                }}
              >
                <nextAction.icon className="h-4 w-4" />
                {nextAction.cta}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── NOVA AI RECOMMENDATION STRIP ── */}
      <div
        className="relative rounded-lg px-4 py-3 flex items-center gap-4"
        style={{
          background: "rgba(249,115,22,0.06)",
          border: "1px solid rgba(249,115,22,0.14)",
        }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }}
        >
          <Brain className="h-4 w-4" style={{ color: "var(--primary)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <span
            className="text-[11px] font-bold uppercase tracking-[0.12em]"
            style={{ color: "rgba(249,115,22,0.7)" }}
          >
            Nova AI ·{" "}
          </span>
          <span className="text-[12.5px]" style={{ color: "var(--foreground)" }}>
            {nextAction.desc}
          </span>
        </div>
        <Link to={nextAction.to}>
          <button
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all"
            style={{
              background: "rgba(249,115,22,0.1)",
              border: "1px solid rgba(249,115,22,0.22)",
              color: "var(--primary)",
            }}
            onMouseEnter={(e: React.MouseEvent) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(249,115,22,0.18)";
            }}
            onMouseLeave={(e: React.MouseEvent) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(249,115,22,0.1)";
            }}
          >
            {nextAction.cta} <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </Link>
      </div>

      {/* ── MISSION + OPERATOR ROW ── */}
      {profile?.onboarding_complete && user?.id && (
        <section className="rise-in grid gap-4 lg:grid-cols-12" style={{ ["--i" as string]: 1 }}>
          <div className="lg:col-span-7">
            <CurrentMissionCard userId={user.id} />
          </div>
          <div className="lg:col-span-5">
            <AskOperatorCard workspaceId={undefined} />
          </div>
        </section>
      )}

      {/* ── ONBOARDING CHECKLIST ── */}
      {!checklistComplete && (
        <section
          className="rise-in overflow-hidden rounded-2xl"
          style={{
            ["--i" as string]: 1,
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{
                  background: "rgba(249,115,22,0.1)",
                  border: "1px solid rgba(249,115,22,0.2)",
                }}
              >
                <ListChecks className="h-4 w-4" style={{ color: "var(--primary)" }} />
              </div>
              <div>
                <div
                  className="font-display text-[13px] font-bold tracking-tight"
                  style={{ color: "var(--foreground)" }}
                >
                  Get your workspace live
                </div>
                <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                  {checklistDone} of {checklist.length} steps complete
                </div>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div
                className="h-1.5 w-32 overflow-hidden rounded-full"
                style={{ background: "var(--surface-2)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(checklistDone / checklist.length) * 100}%`,
                    background: "var(--primary)",
                  }}
                />
              </div>
              <span
                className="text-[11px] font-mono font-semibold"
                style={{ color: "var(--primary)" }}
              >
                {Math.round((checklistDone / checklist.length) * 100)}%
              </span>
            </div>
          </div>
          <ul
            className="grid gap-px sm:grid-cols-2 lg:grid-cols-3"
            style={{ background: "rgba(249,115,22,0.04)" }}
          >
            {checklist.map((c) => (
              <li key={c.id} style={{ background: "var(--surface)" }}>
                <Link
                  to={c.to}
                  className="flex items-center gap-3 px-5 py-3 transition-all"
                  onMouseEnter={(e: React.MouseEvent) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(249,115,22,0.04)";
                  }}
                  onMouseLeave={(e: React.MouseEvent) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]"
                    style={
                      c.done
                        ? {
                            background: "rgba(16,185,129,0.12)",
                            border: "1px solid rgba(16,185,129,0.3)",
                            color: "var(--success)",
                          }
                        : {
                            background: "var(--surface-2)",
                            border: "1px solid rgba(249,115,22,0.15)",
                            color: "var(--muted-foreground)",
                          }
                    }
                  >
                    {c.done ? <Check className="h-3 w-3" /> : <Clock className="h-2.5 w-2.5" />}
                  </span>
                  <span
                    className="flex-1 text-[12.5px]"
                    style={
                      c.done
                        ? {
                            color: "var(--muted-foreground)",
                            textDecoration: "line-through",
                            textDecorationColor: "var(--muted-foreground)",
                          }
                        : { color: "var(--foreground)" }
                    }
                  >
                    {c.label}
                  </span>
                  {!c.done && (
                    <ArrowRight className="h-3 w-3" style={{ color: "var(--muted-foreground)" }} />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── YOUR PATH + WHAT NEXT ── */}
      {currentOrgId && (
        <section className="rise-in grid gap-4 lg:grid-cols-2" style={{ ["--i" as string]: 2 }}>
          <YourPathCard lane={classifyLane(orgStage, "")} stage={orgStage} />
          <WhatNextCard
            lane={classifyLane(orgStage, "")}
            hasValidatedIdea={succeeded("validate-idea")}
            hasPitch={succeeded("generate-pitch")}
            hasOffer={succeeded("generate-offer")}
            hasGtm={succeeded("generate-gtm-strategy")}
            hasLeads={leads.length > 0}
            hasAutomation={automations.length > 0}
            hasWonLead={wonLeads > 0}
          />
        </section>
      )}

      {/* ── STAT ROW ── */}
      <section
        className="rise-in grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        style={{ ["--i" as string]: 3 }}
      >
        <MissionStatCard
          label="Business Stage"
          value={orgStage}
          sub={`Step ${stageIdx + 1} of 5`}
          icon={Target}
          color="#F97316"
          rightSlot={
            <div className="mt-4 flex items-center gap-1">
              {STAGES.map((s, i) => (
                <span
                  key={s}
                  className="h-0.5 flex-1 rounded-full transition-all"
                  style={{
                    background: i <= stageIdx ? "var(--primary)" : "var(--surface-2)",
                  }}
                />
              ))}
            </div>
          }
        />
        <MissionStatCard
          label="Launchpad Tools"
          value={`${launchpadComplete}/${LAUNCHPAD_TILES.length}`}
          sub={launchpadComplete === 0 ? "Run your first tool" : "tools completed"}
          icon={Rocket}
          color="#EA580C"
          rightSlot={
            <OrangeProgressRing
              percent={Math.round((launchpadComplete / LAUNCHPAD_TILES.length) * 100)}
            />
          }
        />
        <MissionStatCard
          label="Nova Systems"
          value={`${novaActive}/${NOVA_SYSTEMS.length}`}
          sub={novaActive === 0 ? "Set up your first system" : "systems live"}
          icon={Zap}
          color="#FBBF24"
          rightSlot={
            <div className="mt-4 flex items-center gap-1.5">
              {NOVA_SYSTEMS.map((s) => {
                const st = novaStatus(s.key);
                return (
                  <span
                    key={s.key}
                    className="h-2 w-2 rounded-full transition-colors"
                    style={{
                      background:
                        st === "active"
                          ? "var(--success)"
                          : st === "setup"
                            ? "var(--warning)"
                            : "var(--border)",
                      boxShadow: "none",
                    }}
                  />
                );
              })}
            </div>
          }
        />
        <MissionStatCard
          label="Leads Captured"
          value={leads.length}
          sub={`${qualifiedPipe} qualified · ${wonLeads} won`}
          icon={Inbox}
          color="#10b981"
          trend={leads.length > 0}
        />
      </section>

      {/* ── OUTPUTS ROW ── */}
      {currentOrgId && (
        <section className="rise-in grid gap-4 lg:grid-cols-12" style={{ ["--i" as string]: 4 }}>
          <div className="lg:col-span-4">
            <ApprovedOfferCard orgId={currentOrgId} />
          </div>
          <div className="lg:col-span-5">
            <LaunchAssetsCard orgId={currentOrgId} />
          </div>
          <div className="lg:col-span-3">
            <AutomationStatusCard orgId={currentOrgId} userId={user?.id} />
          </div>
        </section>
      )}

      {/* ── ACTIVITY + NEXT ACTION ── */}
      <section className="rise-in grid gap-4 lg:grid-cols-12" style={{ ["--i" as string]: 5 }}>
        {/* Activity feed */}
        <div
          className="lg:col-span-8 overflow-hidden rounded-2xl"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div>
              <div
                className="text-[9.5px] font-bold uppercase tracking-[0.18em]"
                style={{ color: "rgba(249,115,22,0.6)" }}
              >
                Live Activity
              </div>
              <h3
                className="mt-0.5 font-display text-[14px] font-bold tracking-tight"
                style={{ color: "var(--foreground)" }}
              >
                Recent across your workspace
              </h3>
            </div>
            <Link
              to="/app/launchpad/history"
              className="inline-flex items-center gap-1 text-[12px] transition-colors"
              style={{ color: "var(--primary)" }}
              onMouseEnter={(e: React.MouseEvent) => {
                (e.currentTarget as HTMLElement).style.opacity = "0.75";
              }}
              onMouseLeave={(e: React.MouseEvent) => {
                (e.currentTarget as HTMLElement).style.opacity = "1";
              }}
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {recentRuns.length === 0 && leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{
                  background: "rgba(249,115,22,0.08)",
                  border: "1px solid rgba(249,115,22,0.15)",
                }}
              >
                <Activity className="h-5 w-5" style={{ color: "var(--primary)", opacity: 0.5 }} />
              </div>
              <p className="mt-4 text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>
                Nothing here yet
              </p>
              <p className="mt-1 text-[12px] max-w-xs" style={{ color: "var(--muted-foreground)" }}>
                Run a tool, capture a lead, or wire an automation. Activity appears instantly.
              </p>
              <Link to="/app/launchpad" className="mt-4">
                <button
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-semibold text-white"
                  style={{
                    background: "linear-gradient(135deg, #F97316, #EA580C)",
                    boxShadow: "0 4px 15px rgba(249,115,22,0.3)",
                  }}
                >
                  Run a tool
                </button>
              </Link>
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
              {recentRuns.slice(0, 6).map((r) => {
                const Icon =
                  r.status === "succeeded"
                    ? CheckCircle2
                    : r.status === "failed"
                      ? XCircle
                      : Loader2;
                const color =
                  r.status === "succeeded"
                    ? "var(--success)"
                    : r.status === "failed"
                      ? "var(--destructive)"
                      : "var(--primary)";
                return (
                  <li
                    key={r.id}
                    className="flex items-center gap-3.5 px-5 py-3 transition-all"
                    onMouseEnter={(e: React.MouseEvent) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(249,115,22,0.03)";
                    }}
                    onMouseLeave={(e: React.MouseEvent) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: `color-mix(in oklab, ${color} 10%, transparent)`,
                        border: `1px solid color-mix(in oklab, ${color} 20%, transparent)`,
                      }}
                    >
                      <Icon
                        className={cn("h-3.5 w-3.5", r.status === "running" && "animate-spin")}
                        style={{ color }}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[13px] font-medium"
                        style={{ color: "var(--foreground)" }}
                      >
                        {r.tool_key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </div>
                      <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                        {new Date(r.created_at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
                      style={{
                        background: `color-mix(in oklab, ${color} 10%, transparent)`,
                        color,
                        border: `1px solid color-mix(in oklab, ${color} 20%, transparent)`,
                      }}
                    >
                      {r.status}
                    </span>
                  </li>
                );
              })}
              {leads.slice(0, 2).map((l) => (
                <li
                  key={l.id}
                  className="flex items-center gap-3.5 px-5 py-3 transition-all"
                  onMouseEnter={(e: React.MouseEvent) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(249,115,22,0.03)";
                  }}
                  onMouseLeave={(e: React.MouseEvent) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: "rgba(249,115,22,0.1)",
                      border: "1px solid rgba(249,115,22,0.2)",
                    }}
                  >
                    <UserCheck className="h-3.5 w-3.5" style={{ color: "var(--primary)" }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[13px] font-medium"
                      style={{ color: "var(--foreground)" }}
                    >
                      Lead added · {l.name}
                    </div>
                    <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                      {l.source ?? "Manual"} · {new Date(l.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
                    style={{
                      background: "rgba(249,115,22,0.1)",
                      color: "var(--primary)",
                      border: "1px solid rgba(249,115,22,0.2)",
                    }}
                  >
                    {l.stage}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Next action card */}
        <div
          className="lg:col-span-4 overflow-hidden rounded-xl"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="p-5">
            <div
              className="text-[9px] font-bold uppercase tracking-[0.22em]"
              style={{ color: "rgba(249,115,22,0.7)" }}
            >
              Next Action
            </div>
            <div
              className="mt-4 flex h-10 w-10 items-center justify-center rounded-lg text-white"
              style={{ background: "var(--primary)" }}
            >
              <nextAction.icon className="h-5 w-5" />
            </div>
            <div
              className="mt-3 font-display text-[16px] font-bold tracking-tight leading-snug"
              style={{ color: "var(--foreground)" }}
            >
              {nextAction.title}
            </div>
            <p
              className="mt-1.5 text-[12.5px] leading-relaxed"
              style={{ color: "var(--muted-foreground)" }}
            >
              {nextAction.desc}
            </p>
            <Link to={nextAction.to} className="mt-4 inline-flex">
              <button
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-semibold text-white transition-opacity"
                style={{ background: "var(--primary)" }}
                onMouseEnter={(e: React.MouseEvent) => {
                  (e.currentTarget as HTMLElement).style.opacity = "0.9";
                }}
                onMouseLeave={(e: React.MouseEvent) => {
                  (e.currentTarget as HTMLElement).style.opacity = "1";
                }}
              >
                {nextAction.cta} <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
            {limit && (
              <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                <div
                  className="flex items-center justify-between text-[11px]"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <span>AI generations this month</span>
                  <span className="font-mono font-semibold" style={{ color: "var(--primary)" }}>
                    {totalUsed} / {limit}
                  </span>
                </div>
                <div
                  className="mt-1.5 h-1 w-full overflow-hidden rounded-full"
                  style={{ background: "var(--surface-2)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, (totalUsed / limit) * 100)}%`,
                      background: "var(--primary)",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── QUICK ACTIONS ── */}
      <section
        className="overflow-hidden rounded-xl"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div
            className="text-[9.5px] font-bold uppercase tracking-[0.18em]"
            style={{ color: "rgba(249,115,22,0.5)" }}
          >
            Quick Launch
          </div>
          <span
            className="hidden sm:inline text-[11px]"
            style={{ color: "var(--muted-foreground)" }}
          >
            Press{" "}
            <kbd
              className="font-mono text-[10px] rounded px-1.5 py-0.5"
              style={{
                background: "rgba(249,115,22,0.08)",
                border: "1px solid rgba(249,115,22,0.2)",
                color: "var(--primary)",
              }}
            >
              ⌘K
            </kbd>{" "}
            for command palette
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto p-3">
          {QUICK_ACTIONS.map((a) => (
            <Link key={a.to + a.label} to={a.to} className="shrink-0">
              <button
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
                onMouseEnter={(e: React.MouseEvent) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(249,115,22,0.3)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(249,115,22,0.06)";
                  (e.currentTarget as HTMLElement).style.color = "var(--primary)";
                }}
                onMouseLeave={(e: React.MouseEvent) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(249,115,22,0.12)";
                  (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                  (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
                }}
              >
                <a.icon className="h-3 w-3" style={{ color: "var(--primary)" }} />
                {a.label}
              </button>
            </Link>
          ))}
        </div>
      </section>

      {/* ── AI OPERATORS PREVIEW ── */}
      <section
        className="overflow-hidden rounded-xl"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{
                background: "rgba(249,115,22,0.1)",
                border: "1px solid rgba(249,115,22,0.2)",
              }}
            >
              <Brain className="h-4 w-4" style={{ color: "var(--primary)" }} />
            </div>
            <div>
              <div
                className="font-display text-[13px] font-bold"
                style={{ color: "var(--foreground)" }}
              >
                AI Operators
              </div>
              <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                Your virtual executive team
              </div>
            </div>
          </div>
          <Link
            to="/app/mentor"
            className="inline-flex items-center gap-1 text-[12px] transition-colors"
            style={{ color: "var(--primary)" }}
          >
            Open Control <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-1.5 p-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { role: "Growth Commander", codename: "GC-01", color: "#3b82f6", icon: TrendingUp },
            { role: "Offer Architect", codename: "OA-02", color: "#8b5cf6", icon: Sparkles },
            { role: "Sales Operator", codename: "SO-03", color: "#10b981", icon: Target },
            { role: "Content Strategist", codename: "CS-04", color: "#F97316", icon: FileText },
            { role: "Automation Engineer", codename: "AE-05", color: "#06b6d4", icon: Zap },
            { role: "Finance Navigator", codename: "FN-06", color: "#FBBF24", icon: LineChart },
          ].map((op) => (
            <Link key={op.codename} to="/app/mentor" className="group">
              <div
                className="flex flex-col items-center gap-2 rounded-xl p-3 transition-all text-center"
                style={{ border: `1px solid ${op.color}18`, background: "transparent" }}
                onMouseEnter={(e: React.MouseEvent) => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${op.color}40`;
                  (e.currentTarget as HTMLElement).style.background = `${op.color}06`;
                }}
                onMouseLeave={(e: React.MouseEvent) => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${op.color}18`;
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: `${op.color}14`, border: `1px solid ${op.color}28` }}
                >
                  <op.icon className="h-4 w-4" style={{ color: op.color }} />
                </div>
                <div>
                  <div
                    className="text-[10px] font-semibold leading-tight"
                    style={{ color: "var(--foreground)" }}
                  >
                    {op.role}
                  </div>
                  <div
                    className="text-[8.5px] font-mono mt-0.5"
                    style={{ color: op.color, opacity: 0.7 }}
                  >
                    {op.codename}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── LAUNCHPAD + NOVA GRID ── */}
      <section className="rise-in grid gap-4 lg:grid-cols-2" style={{ ["--i" as string]: 7 }}>
        {/* Launchpad modules */}
        <div
          className="overflow-hidden rounded-2xl"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{
                  background: "rgba(249,115,22,0.1)",
                  border: "1px solid rgba(249,115,22,0.2)",
                }}
              >
                <Rocket className="h-4 w-4" style={{ color: "var(--primary)" }} />
              </div>
              <div>
                <div
                  className="font-display text-[13px] font-bold"
                  style={{ color: "var(--foreground)" }}
                >
                  Launchpad modules
                </div>
                <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                  {launchpadComplete} of {LAUNCHPAD_TILES.length} complete
                </div>
              </div>
            </div>
            <Link
              to="/app/launchpad"
              className="inline-flex items-center gap-1 text-[12px] transition-colors"
              style={{ color: "var(--primary)" }}
            >
              Open <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-1.5 p-3">
            {LAUNCHPAD_TILES.map((t) => {
              const st = launchpadStatus(t.key);
              const toolSlug = t.key
                .replace("validate-idea", "idea-validator")
                .replace("generate-pitch", "pitch-generator")
                .replace("generate-gtm-strategy", "gtm-strategy")
                .replace("generate-offer", "offer");
              return (
                <Link
                  key={t.key}
                  to="/app/launchpad/$tool"
                  params={{ tool: toolSlug }}
                  className="group flex items-center gap-2.5 rounded-xl p-2.5 transition-all"
                  style={{ border: "1px solid rgba(249,115,22,0.08)", background: "transparent" }}
                  onMouseEnter={(e: React.MouseEvent) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(249,115,22,0.25)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(249,115,22,0.05)";
                  }}
                  onMouseLeave={(e: React.MouseEvent) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(249,115,22,0.08)";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105"
                    style={
                      st === "complete"
                        ? {
                            background: "rgba(16,185,129,0.12)",
                            color: "var(--success)",
                            border: "1px solid rgba(16,185,129,0.2)",
                          }
                        : st === "in-progress"
                          ? {
                              background: "rgba(249,115,22,0.12)",
                              color: "var(--primary)",
                              border: "1px solid rgba(249,115,22,0.2)",
                            }
                          : { background: "var(--surface-2)", color: "var(--muted-foreground)" }
                    }
                  >
                    {st === "complete" ? (
                      <Check className="h-3 w-3" />
                    ) : st === "in-progress" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <t.icon className="h-3 w-3" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div
                      className="truncate text-[11.5px] font-medium leading-tight"
                      style={{ color: "var(--foreground)" }}
                    >
                      {t.name}
                    </div>
                    <div
                      className="text-[10px] capitalize"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {st === "complete" ? "Done" : st === "in-progress" ? "Running" : "Ready"}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Nova systems */}
        <div
          className="overflow-hidden rounded-2xl"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid rgba(251,191,36,0.08)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{
                  background: "rgba(251,191,36,0.1)",
                  border: "1px solid rgba(251,191,36,0.2)",
                }}
              >
                <Zap className="h-4 w-4" style={{ color: "#FBBF24" }} />
              </div>
              <div>
                <div
                  className="font-display text-[13px] font-bold"
                  style={{ color: "var(--foreground)" }}
                >
                  Nova OS systems
                </div>
                <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                  {novaActive} of {NOVA_SYSTEMS.length} active
                </div>
              </div>
            </div>
            <Link
              to="/app/nova"
              className="inline-flex items-center gap-1 text-[12px] transition-colors"
              style={{ color: "#FBBF24" }}
            >
              Open <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
            {NOVA_SYSTEMS.map((s) => {
              const st = novaStatus(s.key);
              return (
                <li
                  key={s.key}
                  className="flex items-center gap-3.5 px-5 py-3 transition-all"
                  onMouseEnter={(e: React.MouseEvent) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(251,191,36,0.03)";
                  }}
                  onMouseLeave={(e: React.MouseEvent) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: st === "active" ? "rgba(16,185,129,0.1)" : "var(--surface-2)",
                      border: `1px solid ${st === "active" ? "rgba(16,185,129,0.2)" : "var(--border)"}`,
                    }}
                  >
                    <s.icon
                      className="h-3.5 w-3.5"
                      style={{
                        color: st === "active" ? "var(--success)" : "var(--muted-foreground)",
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>
                      {s.name}
                    </div>
                    <div
                      className="flex items-center gap-1.5 text-[11px]"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          background:
                            st === "active"
                              ? "var(--success)"
                              : st === "setup"
                                ? "var(--warning)"
                                : "var(--border)",
                          boxShadow: "none",
                        }}
                      />
                      {st === "active" ? "Active" : st === "setup" ? "Setup needed" : "Inactive"}
                    </div>
                  </div>
                  <Link
                    to={s.to}
                    className="text-[11.5px] transition-colors inline-flex items-center gap-1"
                    style={{ color: "var(--muted-foreground)" }}
                    onMouseEnter={(e: React.MouseEvent) => {
                      (e.currentTarget as HTMLElement).style.color = "#FBBF24";
                    }}
                    onMouseLeave={(e: React.MouseEvent) => {
                      (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
                    }}
                  >
                    {st === "active" ? "Open" : "Configure"} <ArrowRight className="h-3 w-3" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}

/* ── Stat card ── */
function MissionStatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  rightSlot,
  trend,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  rightSlot?: React.ReactNode;
  trend?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--muted-foreground)" }}
          >
            {label}
          </div>
          <div
            className="mt-2 font-display font-bold leading-none tabular-nums flex items-baseline gap-1.5"
            style={{ fontSize: "1.75rem", color: "var(--foreground)", letterSpacing: "-0.03em" }}
          >
            {value}
            {trend && <TrendingUp className="h-4 w-4 inline" style={{ color: "var(--success)" }} />}
          </div>
          <div className="mt-1.5 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
            {sub}
          </div>
        </div>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: color + "14",
            border: `1px solid ${color}22`,
          }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      </div>
      {rightSlot}
    </div>
  );
}

function OrangeProgressRing({ percent }: { percent: number }) {
  const r = 15,
    c = 2 * Math.PI * r;
  return (
    <div className="mt-3">
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="3" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * percent) / 100}
          transform="rotate(-90 20 20)"
          style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
        <text
          x="20"
          y="23"
          textAnchor="middle"
          fill="var(--primary)"
          style={{ fontSize: 8, fontWeight: 700, fontFamily: "JetBrains Mono, monospace" }}
        >
          {percent}%
        </text>
      </svg>
    </div>
  );
}
