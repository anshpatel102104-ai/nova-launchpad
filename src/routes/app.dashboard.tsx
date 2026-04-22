import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import {
  organizationQuery, subscriptionQuery, toolRunsQuery, usageQuery,
  planEntitlementsQuery, generatedAssetsQuery, leadsQuery, integrationsQuery,
} from "@/lib/queries";
import {
  Sparkles, Rocket, Inbox, FolderOpen, Plus, ArrowRight, Activity,
  CheckCircle2, XCircle, Loader2, Zap, Target, Lightbulb, Megaphone,
  Settings2, Globe, Mail, Cpu, TrendingUp, Lock, Check, Circle, Clock,
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

// ─────────────────────────────────────────────────────────────────────────────
// Business journey definition — milestones across the 5 stages.
// Status is computed from real data (assets, leads, integrations, org fields).
// ─────────────────────────────────────────────────────────────────────────────
const STAGES = ["Idea", "Validate", "Launch", "Operate", "Scale"] as const;
type StageName = (typeof STAGES)[number];

type Milestone = {
  id: string;
  stage: StageName;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  cta: { label: string; to: string };
};

const MILESTONES: Milestone[] = [
  { id: "validate-idea",   stage: "Idea",     title: "Validate your idea",        desc: "Pressure-test demand and positioning before you build.",   icon: Lightbulb, cta: { label: "Open validator", to: "/app/launchpad" } },
  { id: "define-offer",    stage: "Validate", title: "Define your offer",         desc: "Craft a clear, irresistible offer with risk reversal.",    icon: Target,    cta: { label: "Build offer",     to: "/app/launchpad" } },
  { id: "build-pitch",     stage: "Validate", title: "Build your pitch",          desc: "Generate a polished pitch you can send today.",            icon: Megaphone, cta: { label: "Generate pitch",  to: "/app/launchpad" } },
  { id: "gtm-strategy",    stage: "Launch",   title: "Map your go-to-market",     desc: "Channels, ICP, and messaging in one plan.",                icon: Rocket,    cta: { label: "Plan GTM",        to: "/app/launchpad" } },
  { id: "first-leads",     stage: "Launch",   title: "Capture your first leads",  desc: "Track every prospect from first touch to close.",          icon: Inbox,     cta: { label: "Add a lead",      to: "/app/leads"     } },
  { id: "ops-plan",        stage: "Operate",  title: "Document your ops",         desc: "Workflows, SOPs and KPIs your team can run from.",         icon: Settings2, cta: { label: "Build ops plan",  to: "/app/launchpad" } },
  { id: "automate-followup", stage: "Operate", title: "Automate follow-ups",      desc: "Wire a follow-up automation so no lead goes cold.",        icon: Mail,      cta: { label: "Configure",       to: "/app/nova"      } },
  { id: "audit-website",   stage: "Operate",  title: "Audit your website",        desc: "Find conversion blockers on your live site.",              icon: Globe,     cta: { label: "Run audit",       to: "/app/launchpad" } },
  { id: "connect-stack",   stage: "Scale",    title: "Connect your stack",        desc: "Wire Stripe, Slack, and your CRM into Nova.",              icon: Cpu,       cta: { label: "Open connectors", to: "/app/settings"  } },
  { id: "track-revenue",   stage: "Scale",    title: "Track revenue & retention", desc: "Move qualified leads to Won and watch MRR climb.",         icon: TrendingUp,cta: { label: "Open pipeline",   to: "/app/leads"     } },
];

function Dashboard() {
  const { currentOrgId, profile, user } = useAuth();

  const orgQ    = useQuery({ ...organizationQuery(currentOrgId ?? ""),       enabled: !!currentOrgId });
  const subQ    = useQuery({ ...subscriptionQuery(currentOrgId ?? ""),       enabled: !!currentOrgId });
  const runsQ   = useQuery({ ...toolRunsQuery(currentOrgId ?? "", 5),        enabled: !!currentOrgId });
  const allRunsQ= useQuery({ ...toolRunsQuery(currentOrgId ?? "", 100),      enabled: !!currentOrgId });
  const usageQ  = useQuery({ ...usageQuery(currentOrgId ?? ""),              enabled: !!currentOrgId });
  const plansQ  = useQuery(planEntitlementsQuery());
  const assetsQ = useQuery({ ...generatedAssetsQuery(currentOrgId ?? ""),    enabled: !!currentOrgId });
  const leadsQ  = useQuery({ ...leadsQuery(currentOrgId ?? ""),              enabled: !!currentOrgId });
  const intsQ   = useQuery({ ...integrationsQuery(user?.id ?? ""),           enabled: !!user?.id });

  if (!currentOrgId) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center shadow-soft">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-xl font-semibold">
          Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Finish onboarding to set up your workspace.
        </p>
        <Link to="/onboarding"><Button className="mt-5">Start onboarding</Button></Link>
      </div>
    );
  }

  const org       = orgQ.data;
  const sub       = subQ.data;
  const recentRuns= runsQ.data ?? [];
  const allRuns   = allRunsQ.data ?? [];
  const usage     = usageQ.data ?? [];
  const assets    = assetsQ.data ?? [];
  const leads     = leadsQ.data ?? [];
  const integrations = intsQ.data ?? [];

  const totalUsed = usage.reduce((s, r) => s + (r.count as number), 0);
  const limit     = plansQ.data?.find((p) => p.plan === sub?.plan)?.monthly_generation_limit ?? null;
  const usagePct  = limit ? Math.min(100, Math.round((totalUsed / limit) * 100)) : 0;

  const firstName = (profile?.full_name || "").split(" ")[0] || "there";
  const planLabel = sub?.plan ?? "starter";
  const orgStage  = (org?.stage ?? "Idea") as StageName;
  const stageIdx  = STAGES.indexOf(orgStage);

  // Compute milestone status from real signals.
  const has = (cat: string) => assets.some((a) => a.category === cat);
  const succeeded = (k: string) => allRuns.some((r) => r.tool_key === k && r.status === "succeeded");

  const milestoneStatus: Record<string, "done" | "active" | "todo"> = useMemo(() => {
    const s: Record<string, "done" | "active" | "todo"> = {};
    s["validate-idea"]    = succeeded("validate-idea") ? "done" : "active";
    s["define-offer"]     = succeeded("generate-offer") || has("generate-offer") ? "done" : "todo";
    s["build-pitch"]      = succeeded("generate-pitch") || has("generate-pitch") ? "done" : "todo";
    s["gtm-strategy"]     = succeeded("generate-gtm-strategy") || has("generate-gtm-strategy") ? "done" : "todo";
    s["first-leads"]      = leads.length > 0 ? "done" : "todo";
    s["ops-plan"]         = succeeded("generate-ops-plan") || has("generate-ops-plan") ? "done" : "todo";
    s["automate-followup"]= integrations.some((i) => i.integration_key?.startsWith("nova:webhook:") && i.status === "connected") ? "done" : "todo";
    s["audit-website"]    = succeeded("analyze-website") ? "done" : "todo";
    s["connect-stack"]    = integrations.filter((i) => !i.integration_key?.startsWith("nova:webhook:") && i.value).length >= 2 ? "done"
                          : integrations.some((i) => !i.integration_key?.startsWith("nova:webhook:") && i.value) ? "active" : "todo";
    s["track-revenue"]    = leads.filter((l) => l.stage === "Won").length > 0 ? "done" : "todo";

    // Promote the first todo to "active" so users always see a clear "next step".
    const firstTodo = MILESTONES.find((m) => s[m.id] === "todo" && STAGES.indexOf(m.stage) <= stageIdx + 1);
    if (firstTodo && !Object.values(s).includes("active")) s[firstTodo.id] = "active";
    return s;
  }, [allRuns, assets, leads, integrations, stageIdx]);

  const completed   = MILESTONES.filter((m) => milestoneStatus[m.id] === "done").length;
  const journeyPct  = Math.round((completed / MILESTONES.length) * 100);
  const nextStep    = MILESTONES.find((m) => milestoneStatus[m.id] === "active")
                    ?? MILESTONES.find((m) => milestoneStatus[m.id] === "todo");

  const wonLeads     = leads.filter((l) => l.stage === "Won").length;
  const qualifiedPipe= leads.filter((l) => ["Qualified", "Proposal"].includes(l.stage as string)).length;
  const successRate  = allRuns.length > 0
    ? Math.round((allRuns.filter((r) => r.status === "succeeded").length / allRuns.length) * 100)
    : 0;

  const kpis = [
    { label: "AI generations",  value: totalUsed,        sub: limit ? `of ${limit} this month` : "this month", icon: Zap,        tint: "text-primary" },
    { label: "Tools run",       value: allRuns.length,   sub: `${successRate}% success rate`,                 icon: Rocket,     tint: "text-foreground" },
    { label: "Leads tracked",   value: leads.length,     sub: `${qualifiedPipe} in active pipeline`,          icon: Inbox,      tint: "text-foreground" },
    { label: "Assets created",  value: assets.length,    sub: "saved to library",                             icon: FolderOpen, tint: "text-foreground" },
  ];

  // Plan ladder for upgrade nudge
  const planOrder = ["starter", "launch", "operate", "scale"] as const;
  const currentIdx = planOrder.indexOf(planLabel as typeof planOrder[number]);
  const nextPlan = currentIdx >= 0 && currentIdx < planOrder.length - 1
    ? plansQ.data?.find((p) => p.plan === planOrder[currentIdx + 1])
    : null;
  const showUpgradeNudge = !!nextPlan && (usagePct >= 70 || completed >= MILESTONES.length - 3);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground/80">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="capitalize">{planLabel} plan</span>
            </span>
            <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              Stage · {orgStage}
            </span>
          </div>
          <h1 className="mt-3 font-display text-[1.7rem] font-semibold tracking-tight md:text-[2rem]">
            {greetingFor()}, {firstName}
          </h1>
          <p className="mt-1 text-[14px] text-muted-foreground">
            {org?.name ? `${org.name} · ` : ""}Your mission control across the entire business journey.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/app/launchpad"><Button className="gap-2"><Sparkles className="h-4 w-4" /> Run a tool</Button></Link>
          <Link to="/app/leads"><Button variant="outline" className="gap-2"><Plus className="h-4 w-4" /> Add lead</Button></Link>
          <Link to="/app/assets"><Button variant="ghost" className="gap-2"><FolderOpen className="h-4 w-4" /> Assets</Button></Link>
        </div>
      </section>

      {/* ── Mission control: journey + next step ── */}
      <section className="grid gap-4 lg:grid-cols-3">
        {/* Journey progress */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11.5px] font-medium text-muted-foreground">Business journey</div>
              <div className="mt-1 font-display text-[18px] font-semibold tracking-tight">
                {completed} of {MILESTONES.length} milestones complete
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-[1.6rem] font-semibold leading-none">{journeyPct}%</div>
              <div className="mt-1 text-[11px] text-muted-foreground">to scale-ready</div>
            </div>
          </div>

          {/* Stage track */}
          <div className="mt-5">
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${journeyPct}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-5 gap-1 text-center text-[11px]">
              {STAGES.map((s, i) => {
                const stageMilestones = MILESTONES.filter((m) => m.stage === s);
                const stageDone = stageMilestones.every((m) => milestoneStatus[m.id] === "done") && stageMilestones.length > 0;
                const stageActive = i === stageIdx;
                return (
                  <div key={s} className="flex flex-col items-center gap-1.5">
                    <span className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-medium",
                      stageDone   && "border-success bg-success text-success-foreground",
                      stageActive && !stageDone && "border-primary bg-primary text-primary-foreground",
                      !stageDone && !stageActive && "border-border bg-background text-muted-foreground",
                    )}>
                      {stageDone ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    <span className={cn(
                      "font-medium",
                      stageActive ? "text-foreground" : "text-muted-foreground",
                    )}>
                      {s}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Next mission */}
        <div className="rounded-xl border border-primary/30 bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2 text-[11.5px] font-medium text-primary">
            <Target className="h-3.5 w-3.5" /> Next step for you
          </div>
          {nextStep ? (
            <>
              <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <nextStep.icon className="h-5 w-5" />
              </div>
              <div className="mt-3 font-display text-[16px] font-semibold tracking-tight">{nextStep.title}</div>
              <p className="mt-1 text-[13px] text-muted-foreground">{nextStep.desc}</p>
              <Link to={nextStep.cta.to} className="mt-4 inline-flex">
                <Button size="sm" className="gap-1.5">
                  {nextStep.cta.label} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </>
          ) : (
            <>
              <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                <Check className="h-5 w-5" />
              </div>
              <div className="mt-3 font-display text-[16px] font-semibold tracking-tight">
                Every milestone complete
              </div>
              <p className="mt-1 text-[13px] text-muted-foreground">
                You're scale-ready. Keep filling the pipeline and tracking revenue.
              </p>
            </>
          )}
        </div>
      </section>

      {/* ── KPIs ── */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-5 shadow-soft transition hover:border-foreground/15">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11.5px] font-medium text-muted-foreground">{k.label}</div>
                <div className="mt-2 font-display text-[1.8rem] font-semibold leading-none tracking-tight">{k.value}</div>
                <div className="mt-2 text-[11.5px] text-muted-foreground">{k.sub}</div>
              </div>
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-muted", k.tint)}>
                <k.icon className="h-4 w-4" />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── Milestone checklist + sidebar (usage / what's working / activity) ── */}
      <section className="grid gap-4 lg:grid-cols-3">
        {/* Milestone list */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11.5px] font-medium text-muted-foreground">Milestones</div>
              <div className="mt-0.5 font-display text-[15px] font-semibold tracking-tight">
                What's done · what's next
              </div>
            </div>
            <span className="text-[11.5px] text-muted-foreground">
              {completed}/{MILESTONES.length} done
            </span>
          </div>

          <ul className="mt-4 divide-y divide-border">
            {MILESTONES.map((m) => {
              const st = milestoneStatus[m.id];
              return (
                <li key={m.id} className="flex items-center gap-3 py-3">
                  <span className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                    st === "done"   && "border-success/40 bg-success/10 text-success",
                    st === "active" && "border-primary/40 bg-primary/10 text-primary",
                    st === "todo"   && "border-border bg-muted text-muted-foreground",
                  )}>
                    {st === "done"   && <Check className="h-4 w-4" />}
                    {st === "active" && <Clock className="h-4 w-4" />}
                    {st === "todo"   && <Circle className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "truncate text-[13.5px] font-medium",
                        st === "done" && "text-muted-foreground line-through",
                      )}>
                        {m.title}
                      </span>
                      <span className="hidden rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
                        {m.stage}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-[12px] text-muted-foreground">{m.desc}</div>
                  </div>
                  {st !== "done" && (
                    <Link to={m.cta.to}>
                      <Button size="sm" variant={st === "active" ? "default" : "ghost"} className="shrink-0 gap-1">
                        {m.cta.label}
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          {/* Usage + upgrade */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="text-[11.5px] font-medium text-muted-foreground">Plan headroom</div>
              <Link to="/app/billing" className="text-[11.5px] text-muted-foreground hover:text-foreground">Manage</Link>
            </div>
            <div className="mt-4 flex items-end gap-2">
              <span className="font-display text-[1.8rem] font-semibold leading-none">{totalUsed}</span>
              <span className="pb-1 text-sm text-muted-foreground">/ {limit ?? "∞"} generations</span>
            </div>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  usagePct >= 90 ? "bg-warning" : "bg-primary",
                )}
                style={{ width: `${limit ? usagePct : 8}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11.5px] text-muted-foreground">
              <span>{limit ? `${usagePct}% used` : "Unlimited"}</span>
              <span className="capitalize">{planLabel}</span>
            </div>

            {showUpgradeNudge && nextPlan && (
              <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-primary">
                  <Lock className="h-3 w-3" /> Ready for more?
                </div>
                <div className="mt-1.5 text-[12.5px] font-medium text-foreground">
                  Upgrade to <span className="capitalize">{nextPlan.plan}</span>
                </div>
                <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                  {nextPlan.monthly_generation_limit ?? "Unlimited"} generations · ${nextPlan.price_usd}/mo
                </div>
                <Link to="/app/billing">
                  <Button size="sm" className="mt-3 w-full gap-1.5">
                    See plans <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* What's working */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <div className="text-[11.5px] font-medium text-muted-foreground">What's working</div>
            <ul className="mt-3 space-y-2.5 text-[12.5px]">
              <Signal label="Tool success rate" value={`${successRate}%`} positive={successRate >= 75} />
              <Signal label="Active pipeline"   value={`${qualifiedPipe} leads`} positive={qualifiedPipe > 0} />
              <Signal label="Closed-won"        value={`${wonLeads}`} positive={wonLeads > 0} />
              <Signal label="Connected tools"   value={`${integrations.filter((i) => i.value).length}`} positive={integrations.filter((i) => i.value).length > 0} />
            </ul>
          </div>
        </div>
      </section>

      {/* ── Recent activity ── */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <div className="text-[11.5px] font-medium text-muted-foreground">Recent activity</div>
          </div>
          <Link to="/app/launchpad/history" className="text-[11.5px] text-muted-foreground hover:text-foreground">View all</Link>
        </div>

        {recentRuns.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="mt-3 text-sm font-medium">No activity yet</div>
            <div className="mt-1 text-xs text-muted-foreground">Run your first AI tool to see activity here.</div>
            <Link to="/app/launchpad">
              <Button size="sm" className="mt-4 gap-2">
                <Rocket className="h-3.5 w-3.5" /> Open Launchpad
              </Button>
            </Link>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {recentRuns.map((r) => {
              const Icon = r.status === "succeeded" ? CheckCircle2 : r.status === "failed" ? XCircle : Loader2;
              const tone = r.status === "succeeded" ? "text-success" : r.status === "failed" ? "text-destructive" : "text-muted-foreground";
              return (
                <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted", tone)}>
                      <Icon className={cn("h-4 w-4", r.status === "running" && "animate-spin")} />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium capitalize">{r.tool_key.replace(/-/g, " ")}</div>
                      <div className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                    r.status === "succeeded" && "bg-success/15 text-success",
                    r.status === "failed"    && "bg-destructive/15 text-destructive",
                    r.status === "running"   && "bg-muted text-muted-foreground",
                  )}>{r.status}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Signal({ label, value, positive }: { label: string; value: string; positive: boolean }) {
  return (
    <li className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground">
        <span className={cn(
          "h-1.5 w-1.5 rounded-full",
          positive ? "bg-success" : "bg-muted-foreground/50",
        )} />
        {label}
      </span>
      <span className={cn("font-medium tabular-nums", positive ? "text-foreground" : "text-muted-foreground")}>
        {value}
      </span>
    </li>
  );
}
