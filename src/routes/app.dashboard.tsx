import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import {
  organizationQuery, subscriptionQuery, toolRunsQuery, usageQuery,
  planEntitlementsQuery, generatedAssetsQuery, leadsQuery, integrationsQuery,
  automationSettingsQuery,
} from "@/lib/queries";
import {
  Sparkles, Rocket, Inbox, ArrowRight, Activity, CheckCircle2, XCircle,
  Loader2, Zap, Target, Lightbulb, Megaphone, Settings2, Globe, Mail,
  TrendingUp, Check, Clock, Plus, Skull, Trophy, UserPlus, FileText,
  GitCompare, Workflow, ListChecks, UserCheck, LineChart, ArrowUpRight, LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NeuralCanvas } from "@/components/app/NeuralCanvas";
import { cn } from "@/lib/utils";

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
  { key: "validate-idea",         name: "Idea Validator",     icon: Lightbulb, to: "/app/launchpad/idea-validator" },
  { key: "generate-pitch",        name: "Pitch Generator",    icon: Megaphone, to: "/app/launchpad/pitch-generator" },
  { key: "generate-gtm-strategy", name: "GTM Strategy",       icon: Target,    to: "/app/launchpad/gtm-strategy" },
  { key: "generate-offer",        name: "Offer Builder",      icon: Sparkles,  to: "/app/launchpad/offer" },
  { key: "kill-my-idea",          name: "Kill My Idea",       icon: Skull,     to: "/app/launchpad/kill-my-idea" },
  { key: "funding-score",         name: "Funding Score",      icon: Trophy,    to: "/app/launchpad/funding-score" },
  { key: "first-10-customers",    name: "First 10 Customers", icon: UserPlus,  to: "/app/launchpad/first-10-customers" },
  { key: "business-plan",         name: "Business Plan",      icon: FileText,  to: "/app/launchpad/business-plan" },
  { key: "investor-emails",       name: "Investor Emails",    icon: Mail,      to: "/app/launchpad/investor-emails" },
  { key: "idea-vs-idea",          name: "Idea vs Idea",       icon: GitCompare,to: "/app/launchpad/idea-vs-idea" },
] as const;

const NOVA_SYSTEMS = [
  { key: "crm",       name: "CRM Pipeline",        icon: Workflow,    to: "/app/nova/crm" },
  { key: "leads",     name: "Lead Capture",         icon: Inbox,       to: "/app/nova/leads" },
  { key: "workflows", name: "Automation",           icon: Zap,         to: "/app/nova/workflows" },
  { key: "followup",  name: "Follow-Up & Booking",  icon: Mail,        to: "/app/nova/workflows" },
  { key: "clients",   name: "Client Onboarding",   icon: ListChecks,  to: "/app/nova/clients" },
  { key: "reports",   name: "Reporting",            icon: LineChart,   to: "/app/nova/reports" },
] as const;

const QUICK_ACTIONS = [
  { label: "Validate Idea",      to: "/app/launchpad/idea-validator" },
  { label: "Generate Pitch",     to: "/app/launchpad/pitch-generator" },
  { label: "Build GTM",          to: "/app/launchpad/gtm-strategy" },
  { label: "Kill My Idea",       to: "/app/launchpad/kill-my-idea" },
  { label: "First 10 Customers", to: "/app/launchpad/first-10-customers" },
  { label: "Funding Score",      to: "/app/launchpad/funding-score" },
  { label: "Capture Leads",      to: "/app/nova/leads" },
  { label: "Revenue Projector",  to: "/app/launchpad/revenue-projector" },
];

function Dashboard() {
  const { currentOrgId, profile, user, refreshProfile } = useAuth();
  const refreshed = useRef(false);

  // If auth context is stale (just came from onboarding), re-fetch once
  useEffect(() => {
    if (!currentOrgId && profile?.onboarding_complete && !refreshed.current) {
      refreshed.current = true;
      void refreshProfile();
    }
  }, [currentOrgId, profile?.onboarding_complete, refreshProfile]);

  const orgQ     = useQuery({ ...organizationQuery(currentOrgId ?? ""),       enabled: !!currentOrgId });
  const subQ     = useQuery({ ...subscriptionQuery(currentOrgId ?? ""),       enabled: !!currentOrgId });
  const runsQ    = useQuery({ ...toolRunsQuery(currentOrgId ?? "", 8),        enabled: !!currentOrgId });
  const allRunsQ = useQuery({ ...toolRunsQuery(currentOrgId ?? "", 100),      enabled: !!currentOrgId });
  const usageQ   = useQuery({ ...usageQuery(currentOrgId ?? ""),              enabled: !!currentOrgId });
  const plansQ   = useQuery(planEntitlementsQuery());
  const assetsQ  = useQuery({ ...generatedAssetsQuery(currentOrgId ?? ""),   enabled: !!currentOrgId });
  const leadsQ   = useQuery({ ...leadsQuery(currentOrgId ?? ""),              enabled: !!currentOrgId });
  const intsQ    = useQuery({ ...integrationsQuery(user?.id ?? ""),           enabled: !!user?.id });
  const autoQ    = useQuery({ ...automationSettingsQuery(currentOrgId ?? ""), enabled: !!currentOrgId });

  const org          = orgQ.data;
  const sub          = subQ.data;
  const recentRuns   = runsQ.data ?? [];
  const allRuns      = allRunsQ.data ?? [];
  const usage        = usageQ.data ?? [];
  const assets       = assetsQ.data ?? [];
  const leads        = leadsQ.data ?? [];
  const integrations = intsQ.data ?? [];
  const automations  = autoQ.data ?? [];

  if (!currentOrgId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl text-white"
          style={{
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            boxShadow: "0 0 40px rgba(59,130,246,0.4)",
          }}
        >
          <Sparkles className="h-8 w-8" />
        </div>
        <h2 className="mt-5 font-display text-2xl font-bold tracking-tight">
          Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h2>
        <p className="mt-2 text-[13.5px]" style={{ color: "var(--muted-foreground)" }}>
          Finish onboarding to set up your workspace.
        </p>
        <Link to="/onboarding"><Button className="mt-5">Start onboarding</Button></Link>
      </div>
    );
  }

  const totalUsed = usage.reduce((s, r) => s + (r.count as number), 0);
  const limit     = plansQ.data?.find((p) => p.plan === sub?.plan)?.monthly_generation_limit ?? null;
  const firstName = (profile?.full_name || "").split(" ")[0] || "there";
  const planLabel = sub?.plan ?? "starter";
  const orgStage  = (org?.stage ?? "Idea") as StageName;
  const stageIdx  = STAGES.indexOf(orgStage);

  const succeeded  = (k: string) => allRuns.some((r) => r.tool_key === k && r.status === "succeeded");
  const inProgress = (k: string) => allRuns.some((r) => r.tool_key === k && r.status === "running");
  const launchpadStatus = (k: string): "complete" | "in-progress" | "not-started" =>
    succeeded(k) ? "complete" : inProgress(k) ? "in-progress" : "not-started";
  const launchpadComplete = LAUNCHPAD_TILES.filter((t) => launchpadStatus(t.key) === "complete").length;

  const novaStatus = (k: string): "active" | "setup" | "inactive" => {
    if (k === "crm" || k === "leads") return leads.length > 0 ? "active" : "setup";
    if (k === "workflows" || k === "followup")
      return automations.length > 0 ? "active"
        : integrations.some((i) => i.integration_key?.startsWith("nova:webhook:") && i.status === "connected") ? "active"
        : "setup";
    if (k === "clients")  return assets.some((a) => a.category === "client-onboarding") ? "active" : "setup";
    if (k === "reports")  return allRuns.length > 5 ? "active" : "inactive";
    return "inactive";
  };
  const novaActive = NOVA_SYSTEMS.filter((s) => novaStatus(s.key) === "active").length;

  const wonLeads      = leads.filter((l) => l.stage === "Won").length;
  const qualifiedPipe = leads.filter((l) => ["Qualified", "Proposal"].includes(l.stage as string)).length;

  const checklist = [
    { id: "profile",  label: "Complete your profile",    done: !!profile?.onboarding_complete,       to: "/app/settings" },
    { id: "validate", label: "Validate your first idea", done: succeeded("validate-idea"),            to: "/app/launchpad/idea-validator" },
    { id: "pitch",    label: "Generate your pitch",      done: succeeded("generate-pitch"),           to: "/app/launchpad/pitch-generator" },
    { id: "gtm",      label: "Map your go-to-market",    done: succeeded("generate-gtm-strategy"),    to: "/app/launchpad/gtm-strategy" },
    { id: "lead",     label: "Capture your first lead",  done: leads.length > 0,                     to: "/app/nova/leads" },
    { id: "automate", label: "Wire an automation",       done: automations.length > 0,               to: "/app/nova/workflows" },
  ];
  const checklistDone = checklist.filter((c) => c.done).length;
  const checklistComplete = checklistDone === checklist.length;

  const nextAction = (() => {
    if (!succeeded("validate-idea"))         return { title: "Validate your idea first",  desc: "Pressure-test market signal before you build anything.", cta: "Run validator", to: "/app/launchpad/idea-validator",  icon: Lightbulb };
    if (!succeeded("generate-pitch"))        return { title: "Generate your pitch",       desc: "Investor-ready pitch you can send today.",                cta: "Generate pitch", to: "/app/launchpad/pitch-generator", icon: Megaphone };
    if (!succeeded("generate-gtm-strategy")) return { title: "Map your go-to-market",    desc: "Channels, ICP, and messaging in one plan.",               cta: "Plan GTM",      to: "/app/launchpad/gtm-strategy",    icon: Target };
    if (leads.length === 0)                  return { title: "Capture your first lead",   desc: "Track every prospect from first touch to close.",          cta: "Add a lead",    to: "/app/nova/leads",               icon: UserPlus };
    if (automations.length === 0)            return { title: "Automate your follow-ups",  desc: "Wire a sequence so no lead goes cold.",                    cta: "Open workflows",to: "/app/nova/workflows",           icon: Zap };
    if (wonLeads === 0)                      return { title: "Move a lead to Won",        desc: "Watch the funnel come alive in your CRM.",                 cta: "Open pipeline", to: "/app/nova/crm",                icon: Trophy };
    return                                          { title: "Open your reports",         desc: "See conversion, pipeline velocity, and revenue trends.",   cta: "View reports",  to: "/app/nova/reports",             icon: LineChart };
  })();

  return (
    <div className="space-y-5">
      {/* ── HERO SECTION with NeuralCanvas ── */}
      <div
        className="rise-in relative overflow-hidden rounded-2xl"
        style={{
          ["--i" as string]: 0,
          minHeight: "200px",
          background: "var(--surface)",
          border: "1px solid rgba(59,130,246,0.15)",
          boxShadow: "0 0 0 1px rgba(59,130,246,0.08), 0 1px 3px rgba(0,0,0,0.6), 0 8px 40px rgba(0,0,0,0.4)",
        }}
      >
        {/* Neural canvas background */}
        <div className="absolute inset-0 z-0">
          <NeuralCanvas className="w-full h-full" />
        </div>

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background: "linear-gradient(135deg, rgba(8,8,16,0.85) 0%, rgba(13,13,30,0.7) 50%, rgba(8,8,16,0.8) 100%)",
          }}
        />

        {/* Top neon bar */}
        <div
          className="absolute top-0 left-0 right-0 h-px z-[2]"
          style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.6), rgba(139,92,246,0.4), transparent)" }}
        />

        {/* Content */}
        <div className="relative z-[3] flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <div
              className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3"
              style={{ color: "rgba(59,130,246,0.7)" }}
            >
              {planLabel} plan · {orgStage} stage
            </div>
            <h1
              className="font-display font-black tracking-tight leading-none"
              style={{
                fontSize: "clamp(1.8rem, 3vw + 1rem, 3rem)",
                background: "linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.85) 50%, #60a5fa 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                letterSpacing: "-0.04em",
              }}
            >
              {greetingFor()}, {firstName}
            </h1>
            <p
              className="mt-2 text-[13.5px] leading-relaxed"
              style={{ color: "rgba(240,244,255,0.55)" }}
            >
              {org?.name ? `${org.name} · ` : ""}Your command center across the entire business journey.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 md:items-end">
            <div className="flex items-center gap-3">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold"
                style={{
                  background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.25)",
                  color: "var(--success)",
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                {planLabel} · Active
              </span>
            </div>
            <Link to={nextAction.to}>
              <button
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  boxShadow: "0 4px 20px rgba(59,130,246,0.4), 0 0 40px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 30px rgba(59,130,246,0.55), 0 0 60px rgba(59,130,246,0.2), inset 0 1px 0 rgba(255,255,255,0.2)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "none";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(59,130,246,0.4), 0 0 40px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.2)";
                }}
              >
                {nextAction.cta} <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Onboarding checklist */}
      {!checklistComplete && (
        <section
          className="rise-in overflow-hidden rounded-2xl"
          style={{
            ["--i" as string]: 1,
            background: "var(--surface)",
            border: "1px solid rgba(59,130,246,0.12)",
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid rgba(59,130,246,0.08)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}
              >
                <ListChecks className="h-4 w-4" style={{ color: "var(--primary)" }} />
              </div>
              <div>
                <div className="font-display text-[13px] font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
                  Get your workspace live
                </div>
                <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                  {checklistDone} of {checklist.length} steps complete
                </div>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="h-1.5 w-32 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(checklistDone / checklist.length) * 100}%`,
                    background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                    boxShadow: "0 0 8px rgba(59,130,246,0.5)",
                  }}
                />
              </div>
              <span className="text-[11px] font-mono font-semibold" style={{ color: "var(--primary)" }}>
                {Math.round((checklistDone / checklist.length) * 100)}%
              </span>
            </div>
          </div>
          <ul className="grid gap-px sm:grid-cols-2 lg:grid-cols-3" style={{ background: "rgba(59,130,246,0.05)" }}>
            {checklist.map((c) => (
              <li key={c.id} style={{ background: "var(--surface)" }}>
                <Link
                  to={c.to}
                  className="flex items-center gap-3 px-5 py-3 transition-all"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.04)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]"
                    style={c.done ? {
                      background: "rgba(16,185,129,0.12)",
                      border: "1px solid rgba(16,185,129,0.3)",
                      color: "var(--success)",
                    } : {
                      background: "var(--surface-2)",
                      border: "1px solid rgba(59,130,246,0.15)",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    {c.done ? <Check className="h-3 w-3" /> : <Clock className="h-2.5 w-2.5" />}
                  </span>
                  <span
                    className="flex-1 text-[12.5px]"
                    style={c.done ? {
                      color: "var(--muted-foreground)",
                      textDecoration: "line-through",
                      textDecorationColor: "rgba(255,255,255,0.2)",
                    } : { color: "var(--foreground)" }}
                  >
                    {c.label}
                  </span>
                  {!c.done && <ArrowRight className="h-3 w-3" style={{ color: "var(--muted-foreground)" }} />}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Stat row */}
      <section className="rise-in grid gap-3 sm:grid-cols-2 lg:grid-cols-4" style={{ ["--i" as string]: 2 }}>
        <GlowStatCard
          label="Business Stage"
          value={orgStage}
          sub={`Step ${stageIdx + 1} of 5`}
          icon={Target}
          color="#3b82f6"
          rightSlot={
            <div className="mt-4 flex items-center gap-1">
              {STAGES.map((s, i) => (
                <span
                  key={s}
                  className="h-0.5 flex-1 rounded-full transition-all"
                  style={{
                    background: i <= stageIdx
                      ? "linear-gradient(90deg, #3b82f6, #8b5cf6)"
                      : "rgba(255,255,255,0.08)",
                    boxShadow: i <= stageIdx ? "0 0 4px rgba(59,130,246,0.4)" : "none",
                  }}
                />
              ))}
            </div>
          }
        />
        <GlowStatCard
          label="Launchpad"
          value={`${launchpadComplete}/${LAUNCHPAD_TILES.length}`}
          sub={launchpadComplete === 0 ? "Run your first tool" : "tools completed"}
          icon={Rocket}
          color="#6366f1"
          rightSlot={<NeonProgressRing percent={Math.round((launchpadComplete / LAUNCHPAD_TILES.length) * 100)} />}
        />
        <GlowStatCard
          label="Nova Systems"
          value={`${novaActive}/${NOVA_SYSTEMS.length}`}
          sub={novaActive === 0 ? "Set up your first system" : "systems live"}
          icon={Zap}
          color="#8b5cf6"
          rightSlot={
            <div className="mt-4 flex items-center gap-1.5">
              {NOVA_SYSTEMS.map((s) => {
                const st = novaStatus(s.key);
                return (
                  <span
                    key={s.key}
                    className="h-2 w-2 rounded-full transition-colors"
                    style={{
                      background: st === "active" ? "var(--success)"
                        : st === "setup" ? "var(--warning)"
                        : "rgba(255,255,255,0.08)",
                      boxShadow: st === "active" ? "0 0 6px rgba(16,185,129,0.6)" : "none",
                    }}
                  />
                );
              })}
            </div>
          }
        />
        <GlowStatCard
          label="Leads Captured"
          value={leads.length}
          sub={`${qualifiedPipe} qualified · ${wonLeads} won`}
          icon={Inbox}
          color="#06b6d4"
          trend={leads.length > 0}
        />
      </section>

      {/* Activity + Next Action */}
      <section className="rise-in grid gap-4 lg:grid-cols-12" style={{ ["--i" as string]: 3 }}>
        {/* Activity feed */}
        <div
          className="lg:col-span-8 overflow-hidden rounded-2xl"
          style={{
            background: "var(--surface)",
            border: "1px solid rgba(59,130,246,0.1)",
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid rgba(59,130,246,0.08)" }}
          >
            <div>
              <div className="text-[9.5px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(59,130,246,0.6)" }}>
                Live Activity
              </div>
              <h3 className="mt-0.5 font-display text-[14px] font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
                Recent across your workspace
              </h3>
            </div>
            <Link
              to="/app/launchpad/history"
              className="inline-flex items-center gap-1 text-[12px] transition-colors"
              style={{ color: "var(--primary)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textShadow = "0 0 8px rgba(59,130,246,0.6)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textShadow = "none"; }}
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {recentRuns.length === 0 && leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{
                  background: "rgba(59,130,246,0.08)",
                  border: "1px solid rgba(59,130,246,0.15)",
                }}
              >
                <Activity className="h-5 w-5" style={{ color: "var(--primary)", opacity: 0.5 }} />
              </div>
              <p className="mt-4 text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>Nothing here yet</p>
              <p className="mt-1 text-[12px] max-w-xs" style={{ color: "var(--muted-foreground)" }}>
                Run a tool, capture a lead, or wire an automation. Activity appears instantly.
              </p>
              <Link to="/app/launchpad" className="mt-4">
                <button
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-semibold text-white"
                  style={{
                    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                    boxShadow: "0 4px 15px rgba(59,130,246,0.3)",
                  }}
                >
                  Run a tool
                </button>
              </Link>
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: "rgba(59,130,246,0.06)" }}>
              {recentRuns.slice(0, 6).map((r) => {
                const Icon = r.status === "succeeded" ? CheckCircle2 : r.status === "failed" ? XCircle : Loader2;
                const color = r.status === "succeeded" ? "var(--success)" : r.status === "failed" ? "var(--destructive)" : "var(--primary)";
                return (
                  <li
                    key={r.id}
                    className="flex items-center gap-3.5 px-5 py-3 transition-all"
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.04)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
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
                      <div className="truncate text-[13px] font-medium" style={{ color: "var(--foreground)" }}>
                        {r.tool_key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </div>
                      <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                        {new Date(r.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
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
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.04)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: "rgba(139,92,246,0.1)",
                      border: "1px solid rgba(139,92,246,0.2)",
                    }}
                  >
                    <UserCheck className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium" style={{ color: "var(--foreground)" }}>
                      Lead added · {l.name}
                    </div>
                    <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                      {l.source ?? "Manual"} · {new Date(l.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
                    style={{
                      background: "rgba(139,92,246,0.1)",
                      color: "var(--accent)",
                      border: "1px solid rgba(139,92,246,0.2)",
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
          className="lg:col-span-4 relative overflow-hidden rounded-2xl"
          style={{
            background: "var(--surface)",
            border: "1px solid rgba(139,92,246,0.2)",
            boxShadow: "0 0 40px rgba(139,92,246,0.06)",
          }}
        >
          {/* Background orbs */}
          <div
            className="orb-float pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)", filter: "blur(20px)" }}
          />
          <div
            className="orb-float-2 pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(249,115,22,0.1), transparent 70%)", filter: "blur(15px)" }}
          />

          {/* Top bar */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.6), transparent)" }}
          />

          <div className="relative p-5">
            <div className="text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(139,92,246,0.7)" }}>
              Next Action
            </div>
            <div
              className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl text-white"
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #f97316)",
                boxShadow: "0 4px 20px rgba(139,92,246,0.4)",
              }}
            >
              <nextAction.icon className="h-6 w-6" />
            </div>
            <div
              className="mt-3 font-display text-[17px] font-bold tracking-tight leading-snug"
              style={{ color: "var(--foreground)" }}
            >
              {nextAction.title}
            </div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              {nextAction.desc}
            </p>
            <Link to={nextAction.to} className="mt-5 inline-flex">
              <button
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-bold text-white transition-all"
                style={{
                  background: "linear-gradient(135deg, #8b5cf6, #f97316)",
                  boxShadow: "0 4px 15px rgba(139,92,246,0.3)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 25px rgba(139,92,246,0.5)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "none";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 15px rgba(139,92,246,0.3)";
                }}
              >
                {nextAction.cta} <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
            {limit && (
              <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                  <span>AI generations this month</span>
                  <span className="font-mono font-semibold" style={{ color: "var(--primary)" }}>
                    {totalUsed} / {limit}
                  </span>
                </div>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, (totalUsed / limit) * 100)}%`,
                      background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                      boxShadow: "0 0 8px rgba(59,130,246,0.5)",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section
        className="rise-in overflow-hidden rounded-2xl"
        style={{
          ["--i" as string]: 4,
          background: "var(--surface)",
          border: "1px solid rgba(59,130,246,0.1)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid rgba(59,130,246,0.08)" }}
        >
          <div className="text-[9.5px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(59,130,246,0.5)" }}>
            Quick Actions
          </div>
          <span className="hidden sm:inline text-[11px]" style={{ color: "var(--muted-foreground)" }}>
            Press{" "}
            <kbd
              className="font-mono text-[10px] rounded px-1.5 py-0.5"
              style={{
                background: "rgba(59,130,246,0.08)",
                border: "1px solid rgba(59,130,246,0.2)",
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
                  border: "1px solid rgba(59,130,246,0.12)",
                  color: "var(--foreground)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.35)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.08)";
                  (e.currentTarget as HTMLElement).style.color = "var(--primary)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 12px rgba(59,130,246,0.15)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.12)";
                  (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                  (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <Plus className="h-3 w-3" style={{ color: "var(--primary)" }} />
                {a.label}
              </button>
            </Link>
          ))}
        </div>
      </section>

      {/* Launchpad + Nova grid */}
      <section className="rise-in grid gap-4 lg:grid-cols-2" style={{ ["--i" as string]: 5 }}>
        {/* Launchpad modules */}
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background: "var(--surface)",
            border: "1px solid rgba(59,130,246,0.1)",
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid rgba(59,130,246,0.08)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{
                  background: "rgba(59,130,246,0.1)",
                  border: "1px solid rgba(59,130,246,0.2)",
                }}
              >
                <Rocket className="h-4 w-4" style={{ color: "var(--primary)" }} />
              </div>
              <div>
                <div className="font-display text-[13px] font-bold" style={{ color: "var(--foreground)" }}>Launchpad modules</div>
                <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>{launchpadComplete} of {LAUNCHPAD_TILES.length} complete</div>
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
              const toolSlug = t.key.replace("validate-idea", "idea-validator").replace("generate-pitch", "pitch-generator").replace("generate-gtm-strategy", "gtm-strategy").replace("generate-offer", "offer");
              return (
                <Link
                  key={t.key}
                  to="/app/launchpad/$tool"
                  params={{ tool: toolSlug }}
                  className="group flex items-center gap-2.5 rounded-xl p-2.5 transition-all"
                  style={{
                    border: "1px solid rgba(59,130,246,0.08)",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.25)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.08)";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105"
                    style={st === "complete" ? {
                      background: "rgba(16,185,129,0.12)",
                      color: "var(--success)",
                      border: "1px solid rgba(16,185,129,0.2)",
                    } : st === "in-progress" ? {
                      background: "rgba(59,130,246,0.12)",
                      color: "var(--primary)",
                      border: "1px solid rgba(59,130,246,0.2)",
                    } : {
                      background: "var(--surface-2)",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    {st === "complete" ? <Check className="h-3 w-3" />
                      : st === "in-progress" ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <t.icon className="h-3 w-3" />
                    }
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[11.5px] font-medium leading-tight" style={{ color: "var(--foreground)" }}>
                      {t.name}
                    </div>
                    <div className="text-[10px] capitalize" style={{ color: "var(--muted-foreground)" }}>
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
          style={{
            background: "var(--surface)",
            border: "1px solid rgba(139,92,246,0.1)",
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid rgba(139,92,246,0.08)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{
                  background: "rgba(139,92,246,0.1)",
                  border: "1px solid rgba(139,92,246,0.2)",
                }}
              >
                <Zap className="h-4 w-4" style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <div className="font-display text-[13px] font-bold" style={{ color: "var(--foreground)" }}>Nova OS systems</div>
                <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>{novaActive} of {NOVA_SYSTEMS.length} active</div>
              </div>
            </div>
            <Link
              to="/app/nova"
              className="inline-flex items-center gap-1 text-[12px] transition-colors"
              style={{ color: "var(--accent)" }}
            >
              Open <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="divide-y" style={{ borderColor: "rgba(139,92,246,0.06)" }}>
            {NOVA_SYSTEMS.map((s) => {
              const st = novaStatus(s.key);
              return (
                <li
                  key={s.key}
                  className="flex items-center gap-3.5 px-5 py-3 transition-all"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.03)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: st === "active" ? "rgba(16,185,129,0.1)" : "var(--surface-2)",
                      border: `1px solid ${st === "active" ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.05)"}`,
                    }}
                  >
                    <s.icon className="h-3.5 w-3.5" style={{ color: st === "active" ? "var(--success)" : "var(--muted-foreground)" }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>{s.name}</div>
                    <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          background: st === "active" ? "var(--success)" : st === "setup" ? "var(--warning)" : "rgba(255,255,255,0.15)",
                          boxShadow: st === "active" ? "0 0 5px rgba(16,185,129,0.5)" : "none",
                        }}
                      />
                      {st === "active" ? "Active" : st === "setup" ? "Setup needed" : "Inactive"}
                    </div>
                  </div>
                  <Link
                    to={s.to}
                    className="text-[11.5px] transition-colors inline-flex items-center gap-1"
                    style={{ color: "var(--muted-foreground)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--accent)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)"; }}
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

/* ── Glowing stat card ── */
function GlowStatCard({
  label, value, sub, icon: Icon, color, rightSlot, trend,
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
      className="card-lift rounded-2xl p-5"
      style={{
        background: "var(--surface)",
        border: `1px solid ${color}20`,
        boxShadow: `0 0 0 1px ${color}0a, 0 1px 3px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.3)`,
      }}
    >
      {/* Top neon line */}
      <div
        className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }}
      />
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div
            className="text-[9.5px] font-bold uppercase tracking-[0.16em]"
            style={{ color: "var(--muted-foreground)" }}
          >
            {label}
          </div>
          <div
            className="mt-2 font-display font-black leading-none tabular-nums flex items-baseline gap-1.5"
            style={{
              fontSize: "2rem",
              color: "var(--foreground)",
              letterSpacing: "-0.04em",
            }}
          >
            {value}
            {trend && (
              <TrendingUp className="h-4 w-4 inline" style={{ color: "var(--success)" }} />
            )}
          </div>
          <div className="mt-2 text-[11px]" style={{ color: "var(--muted-foreground)" }}>{sub}</div>
        </div>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
          style={{
            background: `linear-gradient(135deg, ${color}, ${color}aa)`,
            boxShadow: `0 4px 16px ${color}40, inset 0 1px 0 rgba(255,255,255,0.15)`,
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {rightSlot}
    </div>
  );
}

function NeonProgressRing({ percent }: { percent: number }) {
  const r = 15, c = 2 * Math.PI * r;
  return (
    <div className="mt-3">
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(59,130,246,0.1)" strokeWidth="3" />
        <circle
          cx="20" cy="20" r={r} fill="none"
          stroke="url(#neonProg)" strokeWidth="3"
          strokeLinecap="round" strokeDasharray={c}
          strokeDashoffset={c - (c * percent) / 100}
          transform="rotate(-90 20 20)"
          style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.16, 1, 0.3, 1)", filter: "drop-shadow(0 0 4px #3b82f6)" }}
        />
        <defs>
          <linearGradient id="neonProg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <text x="20" y="23" textAnchor="middle" fill="#60a5fa" style={{ fontSize: 8, fontWeight: 800, fontFamily: "JetBrains Mono, monospace" }}>
          {percent}%
        </text>
      </svg>
    </div>
  );
}
