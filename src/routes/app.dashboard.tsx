import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import {
  organizationQuery, subscriptionQuery, toolRunsQuery, usageQuery,
  planEntitlementsQuery, generatedAssetsQuery, leadsQuery, integrationsQuery,
  automationSettingsQuery,
} from "@/lib/queries";
import {
  Sparkles, Rocket, Inbox, ArrowRight, Activity, CheckCircle2, XCircle,
  Loader2, Zap, Target, Lightbulb, Megaphone, Settings2, Globe, Mail, Cpu,
  TrendingUp, Check, Clock, Plus, Skull, Trophy, UserPlus, FileText,
  GitCompare, Workflow, ListChecks, UserCheck, LineChart, ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  { key: "validate-idea",          name: "Idea Validator",      icon: Lightbulb,  to: "/app/launchpad/idea-validator" },
  { key: "generate-pitch",         name: "Pitch Generator",     icon: Megaphone,  to: "/app/launchpad/pitch-generator" },
  { key: "generate-gtm-strategy",  name: "GTM Strategy",        icon: Target,     to: "/app/launchpad/gtm-strategy" },
  { key: "generate-offer",         name: "Offer Builder",       icon: Sparkles,   to: "/app/launchpad/offer" },
  { key: "kill-my-idea",           name: "Kill My Idea",        icon: Skull,      to: "/app/launchpad/kill-my-idea" },
  { key: "funding-score",          name: "Funding Score",       icon: Trophy,     to: "/app/launchpad/funding-score" },
  { key: "first-10-customers",     name: "First 10 Customers",  icon: UserPlus,   to: "/app/launchpad/first-10-customers" },
  { key: "business-plan",          name: "Business Plan",       icon: FileText,   to: "/app/launchpad/business-plan" },
  { key: "investor-emails",        name: "Investor Emails",     icon: Mail,       to: "/app/launchpad/investor-emails" },
  { key: "idea-vs-idea",           name: "Idea vs Idea",        icon: GitCompare, to: "/app/launchpad/idea-vs-idea" },
] as const;

const NOVA_SYSTEMS = [
  { key: "crm",        name: "CRM Pipeline",       icon: Workflow,    to: "/app/nova/crm" },
  { key: "leads",      name: "Lead Capture",       icon: Inbox,       to: "/app/nova/leads" },
  { key: "workflows",  name: "Automation",         icon: Zap,         to: "/app/nova/workflows" },
  { key: "followup",   name: "Follow-Up & Booking",icon: Mail,        to: "/app/nova/workflows" },
  { key: "clients",    name: "Client Onboarding",  icon: ListChecks,  to: "/app/nova/clients" },
  { key: "reports",    name: "Reporting",          icon: LineChart,   to: "/app/nova/reports" },
] as const;

const QUICK_ACTIONS = [
  { label: "Validate Idea",         to: "/app/launchpad/idea-validator" },
  { label: "Generate Pitch",        to: "/app/launchpad/pitch-generator" },
  { label: "Build GTM",             to: "/app/launchpad/gtm-strategy" },
  { label: "Kill My Idea",          to: "/app/launchpad/kill-my-idea" },
  { label: "First 10 Customers",    to: "/app/launchpad/first-10-customers" },
  { label: "Generate Landing Page", to: "/app/launchpad/landing-page" },
  { label: "Capture Leads",         to: "/app/nova/leads" },
  { label: "View Pipeline",         to: "/app/nova/crm" },
  { label: "Start Automation",      to: "/app/nova/workflows" },
];

function Dashboard() {
  const { currentOrgId, profile, user } = useAuth();

  const orgQ      = useQuery({ ...organizationQuery(currentOrgId ?? ""),    enabled: !!currentOrgId });
  const subQ      = useQuery({ ...subscriptionQuery(currentOrgId ?? ""),    enabled: !!currentOrgId });
  const runsQ     = useQuery({ ...toolRunsQuery(currentOrgId ?? "", 8),     enabled: !!currentOrgId });
  const allRunsQ  = useQuery({ ...toolRunsQuery(currentOrgId ?? "", 100),   enabled: !!currentOrgId });
  const usageQ    = useQuery({ ...usageQuery(currentOrgId ?? ""),           enabled: !!currentOrgId });
  const plansQ    = useQuery(planEntitlementsQuery());
  const assetsQ   = useQuery({ ...generatedAssetsQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const leadsQ    = useQuery({ ...leadsQuery(currentOrgId ?? ""),           enabled: !!currentOrgId });
  const intsQ     = useQuery({ ...integrationsQuery(user?.id ?? ""),        enabled: !!user?.id });
  const autoQ     = useQuery({ ...automationSettingsQuery(currentOrgId ?? ""), enabled: !!currentOrgId });

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
      <div className="rounded-lg border border-border bg-surface p-12 text-center shadow-card">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-gradient-primary text-white">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="mt-5 font-display text-xl font-semibold">
          Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h2>
        <p className="mt-2 text-[13.5px] text-muted-foreground">Finish onboarding to set up your workspace.</p>
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

  // Compute Launchpad tool status from real data
  const succeeded = (k: string) => allRuns.some((r) => r.tool_key === k && r.status === "succeeded");
  const inProgress = (k: string) => allRuns.some((r) => r.tool_key === k && r.status === "running");
  const launchpadStatus = (k: string): "complete" | "in-progress" | "not-started" =>
    succeeded(k) ? "complete" : inProgress(k) ? "in-progress" : "not-started";
  const launchpadComplete = LAUNCHPAD_TILES.filter((t) => launchpadStatus(t.key) === "complete").length;

  // Nova system status
  const novaStatus = (k: string): "active" | "setup" | "inactive" => {
    if (k === "crm" || k === "leads") return leads.length > 0 ? "active" : "setup";
    if (k === "workflows" || k === "followup") return automations.length > 0 ? "active"
      : integrations.some((i) => i.integration_key?.startsWith("nova:webhook:") && i.status === "connected") ? "active" : "setup";
    if (k === "clients") return assets.some((a) => a.category === "client-onboarding") ? "active" : "setup";
    if (k === "reports") return allRuns.length > 5 ? "active" : "inactive";
    return "inactive";
  };
  const novaActive = NOVA_SYSTEMS.filter((s) => novaStatus(s.key) === "active").length;

  const wonLeads      = leads.filter((l) => l.stage === "Won").length;
  const qualifiedPipe = leads.filter((l) => ["Qualified", "Proposal"].includes(l.stage as string)).length;

  // Recommended next action — context-aware
  const nextAction = (() => {
    if (!succeeded("validate-idea")) return { title: "Validate your idea first",  desc: "Pressure-test market signal in 60 seconds before you build anything.", cta: "Run validator", to: "/app/launchpad/idea-validator", icon: Lightbulb };
    if (!succeeded("generate-pitch")) return { title: "Generate your pitch",      desc: "Investor-ready pitch you can send today.", cta: "Generate pitch", to: "/app/launchpad/pitch-generator", icon: Megaphone };
    if (!succeeded("generate-gtm-strategy")) return { title: "Map your go-to-market", desc: "Channels, ICP, and messaging in one plan.", cta: "Plan GTM", to: "/app/launchpad/gtm-strategy", icon: Target };
    if (leads.length === 0) return { title: "Capture your first lead", desc: "Track every prospect from first touch to close.", cta: "Add a lead", to: "/app/nova/leads", icon: UserPlus };
    if (automations.length === 0) return { title: "Automate your follow-ups", desc: "Wire a sequence so no lead goes cold.", cta: "Open workflows", to: "/app/nova/workflows", icon: Zap };
    if (wonLeads === 0) return { title: "Move a lead to Won", desc: "Watch the funnel come alive in your CRM.", cta: "Open pipeline", to: "/app/nova/crm", icon: Trophy };
    return { title: "Open your reports",     desc: "See conversion, pipeline velocity, and revenue trends.", cta: "View reports", to: "/app/nova/reports", icon: LineChart };
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-0.5 text-[10.5px] font-medium text-foreground/80">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="capitalize">{planLabel} plan</span>
            </span>
            <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-[10.5px] font-medium text-muted-foreground">
              Stage · {orgStage}
            </span>
          </div>
          <h1 className="mt-3 font-display text-[1.75rem] font-semibold tracking-tight md:text-[2rem]">
            {greetingFor()}, {firstName}
          </h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            {org?.name ? `${org.name} · ` : ""}Your command center across the entire business journey.
          </p>
        </div>
      </section>

      {/* Stat row — 4 cards (12-col grid: 3 each) */}
      <section className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Business Stage"
          value={orgStage}
          sub={`Step ${stageIdx + 1} of 5`}
          icon={Target}
          accent="primary"
          rightSlot={
            <div className="mt-3 flex items-center gap-1">
              {STAGES.map((s, i) => (
                <span key={s} className={cn(
                  "h-1 flex-1 rounded-full",
                  i <= stageIdx ? "bg-primary" : "bg-surface-offset",
                )} />
              ))}
            </div>
          }
        />
        <StatCard
          label="Launchpad Progress"
          value={`${launchpadComplete} / ${LAUNCHPAD_TILES.length}`}
          sub={launchpadComplete === 0 ? "Run your first tool" : `tools used`}
          icon={Rocket}
          accent="primary"
          rightSlot={<ProgressRing percent={Math.round((launchpadComplete / LAUNCHPAD_TILES.length) * 100)} />}
        />
        <StatCard
          label="Nova Systems Active"
          value={`${novaActive} / ${NOVA_SYSTEMS.length}`}
          sub={novaActive === 0 ? "Set up your first system" : "systems live"}
          icon={Zap}
          accent="secondary"
          rightSlot={
            <div className="mt-3 flex items-center gap-1.5">
              {NOVA_SYSTEMS.map((s) => {
                const st = novaStatus(s.key);
                return (
                  <span key={s.key} className={cn(
                    "h-2 w-2 rounded-full",
                    st === "active" && "bg-success",
                    st === "setup" && "bg-warning",
                    st === "inactive" && "bg-surface-offset",
                  )} />
                );
              })}
            </div>
          }
        />
        <StatCard
          label="Leads Captured"
          value={leads.length}
          sub={`${qualifiedPipe} qualified · ${wonLeads} won`}
          icon={Inbox}
          accent="secondary"
          trend={leads.length > 0 ? "up" : undefined}
        />
      </section>

      {/* 8 + 4 split: activity feed + next action */}
      <section className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8 rounded-lg border border-border bg-surface shadow-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <div className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">Activity</div>
              <h3 className="mt-0.5 font-display text-[15px] font-semibold">Recent across your workspace</h3>
            </div>
            <Link to="/app/launchpad/history" className="text-[12px] text-primary hover:underline inline-flex items-center gap-1">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {recentRuns.length === 0 && leads.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="Nothing here yet"
              description="Run a tool, capture a lead, or wire an automation. Activity shows up the moment something happens."
              action={{ label: "Run a tool", to: "/app/launchpad" }}
            />
          ) : (
            <ul className="divide-y divide-border">
              {recentRuns.slice(0, 6).map((r) => {
                const Icon = r.status === "succeeded" ? CheckCircle2 : r.status === "failed" ? XCircle : Loader2;
                return (
                  <li key={r.id} className="flex items-center gap-3 px-4 py-2.5 lift-on-hover">
                    <Icon className={cn(
                      "h-4 w-4 shrink-0",
                      r.status === "succeeded" && "text-success",
                      r.status === "failed" && "text-destructive",
                      r.status === "running" && "text-primary animate-spin",
                    )} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium">{r.tool_key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</div>
                      <div className="truncate text-[11.5px] text-muted-foreground">
                        {new Date(r.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </div>
                    </div>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                      r.status === "succeeded" && "bg-success/15 text-success",
                      r.status === "failed" && "bg-destructive/15 text-destructive",
                      r.status === "running" && "bg-primary/15 text-primary",
                    )}>
                      {r.status}
                    </span>
                  </li>
                );
              })}
              {leads.slice(0, 3).map((l) => (
                <li key={l.id} className="flex items-center gap-3 px-4 py-2.5 lift-on-hover">
                  <UserCheck className="h-4 w-4 shrink-0 text-accent" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">Lead added · {l.name}</div>
                    <div className="truncate text-[11.5px] text-muted-foreground">
                      {l.source ?? "Manual"} · {new Date(l.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium capitalize text-accent">
                    {l.stage}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Next action */}
        <div className="lg:col-span-4 rounded-lg border border-primary/30 bg-surface p-5 shadow-card relative overflow-hidden">
          <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-wider text-primary">
              <Target className="h-3 w-3" /> Recommended Next Action
            </div>
            <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary/12 text-primary">
              <nextAction.icon className="h-5 w-5" />
            </div>
            <div className="mt-3 font-display text-[16px] font-semibold tracking-tight">{nextAction.title}</div>
            <p className="mt-1.5 text-[12.5px] text-muted-foreground leading-relaxed">{nextAction.desc}</p>
            <Link to={nextAction.to} className="mt-5 inline-flex">
              <Button size="sm" className="h-9 gap-1.5">
                {nextAction.cta} <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
            {limit && (
              <div className="mt-5 pt-4 border-t border-border">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>AI generations</span>
                  <span className="tabular-nums">{totalUsed} / {limit}</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (totalUsed / limit) * 100)}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quick actions bar */}
      <section className="rounded-lg border border-border bg-surface shadow-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">Quick Actions</div>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">Or press <kbd className="font-mono text-[10px] rounded border border-border bg-background px-1 py-0.5">⌘K</kbd></span>
        </div>
        <div className="flex gap-2 overflow-x-auto p-3">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.to + a.label}
              to={a.to}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-[12px] font-medium text-foreground/85 hover:border-primary/40 hover:text-foreground transition"
            >
              <Plus className="h-3 w-3 text-primary" />
              {a.label}
            </Link>
          ))}
        </div>
      </section>

      {/* 6 + 6 split: Launchpad tile grid + Nova system status */}
      <section className="grid gap-4 lg:grid-cols-2">
        {/* Launchpad */}
        <div className="rounded-lg border border-border bg-surface shadow-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
                <Rocket className="h-3.5 w-3.5" />
              </div>
              <div>
                <div className="font-display text-[14px] font-semibold">Launchpad modules</div>
                <div className="text-[11px] text-muted-foreground">{launchpadComplete} of {LAUNCHPAD_TILES.length} complete</div>
              </div>
            </div>
            <Link to="/app/launchpad" className="text-[12px] text-primary hover:underline inline-flex items-center gap-1">
              Open <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 p-3">
            {LAUNCHPAD_TILES.map((t) => {
              const st = launchpadStatus(t.key);
              return (
                <Link
                  key={t.key}
                  to="/app/launchpad/$tool"
                  params={{ tool: t.key }}
                  className="group flex items-center gap-2 rounded-md border border-border bg-surface-2 p-2.5 transition hover:border-primary/40"
                >
                  <span className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                    st === "complete" && "bg-success/15 text-success",
                    st === "in-progress" && "bg-primary/15 text-primary",
                    st === "not-started" && "bg-surface-offset text-muted-foreground group-hover:text-foreground",
                  )}>
                    {st === "complete" ? <Check className="h-3.5 w-3.5" /> : st === "in-progress" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <t.icon className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-medium">{t.name}</div>
                    <div className="truncate text-[10.5px] text-muted-foreground capitalize">
                      {st === "complete" ? "Complete" : st === "in-progress" ? "In progress" : "Not started"}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Nova systems */}
        <div className="rounded-lg border border-border bg-surface shadow-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/15 text-accent">
                <Zap className="h-3.5 w-3.5" />
              </div>
              <div>
                <div className="font-display text-[14px] font-semibold">Nova OS systems</div>
                <div className="text-[11px] text-muted-foreground">{novaActive} of {NOVA_SYSTEMS.length} active</div>
              </div>
            </div>
            <Link to="/app/nova" className="text-[12px] text-accent hover:underline inline-flex items-center gap-1">
              Open <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {NOVA_SYSTEMS.map((s) => {
              const st = novaStatus(s.key);
              const labels = { active: "Active", setup: "Setup needed", inactive: "Inactive" } as const;
              return (
                <li key={s.key} className="flex items-center gap-3 px-4 py-3 lift-on-hover">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-2 text-muted-foreground">
                    <s.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">{s.name}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <span className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        st === "active" && "bg-success",
                        st === "setup" && "bg-warning",
                        st === "inactive" && "bg-muted-foreground/40",
                      )} />
                      {labels[st]}
                    </div>
                  </div>
                  <Link to={s.to} className="text-[11.5px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
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

/* ───────────── Subcomponents ───────────── */

function StatCard({
  label, value, sub, icon: Icon, accent, rightSlot, trend,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "primary" | "secondary";
  rightSlot?: React.ReactNode;
  trend?: "up" | "down";
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-card transition hover:border-foreground/15">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 font-display text-[1.65rem] font-semibold leading-none tracking-tight tabular-nums">
            {value}
            {trend === "up" && <TrendingUp className="inline ml-1.5 h-4 w-4 text-success" />}
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">{sub}</div>
        </div>
        <div className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md",
          accent === "primary" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent",
        )}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {rightSlot}
    </div>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  const r = 16, c = 2 * Math.PI * r;
  return (
    <div className="mt-3">
      <svg width="36" height="36" viewBox="0 0 40 40" className="overflow-visible">
        <circle cx="20" cy="20" r={r} fill="none" stroke="var(--surface-offset)" strokeWidth="3" />
        <circle
          cx="20" cy="20" r={r} fill="none" stroke="var(--primary)" strokeWidth="3"
          strokeLinecap="round" strokeDasharray={c}
          strokeDashoffset={c - (c * percent) / 100}
          transform="rotate(-90 20 20)"
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
        <text x="20" y="22" textAnchor="middle" className="fill-foreground" style={{ fontSize: 10, fontWeight: 600 }}>
          {percent}%
        </text>
      </svg>
    </div>
  );
}

function EmptyState({
  icon: Icon, title, description, action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: { label: string; to: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary/60">
        <Icon className="h-6 w-6" />
      </div>
      <h4 className="mt-4 font-display text-[14px] font-semibold">{title}</h4>
      <p className="mt-1.5 max-w-xs text-[12px] text-muted-foreground leading-relaxed">{description}</p>
      {action && (
        <Link to={action.to} className="mt-4">
          <Button size="sm" className="h-8">{action.label}</Button>
        </Link>
      )}
    </div>
  );
}
