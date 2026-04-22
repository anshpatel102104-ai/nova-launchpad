import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { StageTracker } from "@/components/app/StageTracker";
import {
  currentCompany, recommendedNext, launchpadTools, novaSystems,
  recentOutputs, leads, usage,
} from "@/lib/mock";
import {
  ArrowRight, Rocket, Cpu, Sparkles, Inbox, Workflow,
  Users, BarChart3, Globe, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const usedTools = launchpadTools.filter((t) => t.outputs > 0).length;
  const novaReady = Math.round(novaSystems.reduce((a, s) => a + s.setup, 0) / novaSystems.length);
  const newLeadsCount = leads.filter((l) => l.stage === "New" || l.stage === "Contacted").length;

  const quickActions = [
    { label: "Validate Idea", icon: Sparkles, to: "/app/launchpad/idea-validator" },
    { label: "Generate Pitch", icon: Rocket, to: "/app/launchpad/pitch-generator" },
    { label: "Build GTM", icon: Zap, to: "/app/launchpad/gtm-strategy" },
    { label: "First 10 Customers", icon: Users, to: "/app/launchpad/first-10-customers" },
    { label: "Generate Landing Page", icon: Globe, to: "/app/launchpad/landing-page" },
    { label: "Capture Leads", icon: Inbox, to: "/app/nova/leads" },
    { label: "View Pipeline", icon: BarChart3, to: "/app/nova/crm" },
    { label: "Start Automation", icon: Workflow, to: "/app/nova/workflows" },
    { label: "Launch Onboarding", icon: Cpu, to: "/app/nova/clients" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Command center"
        title={`Welcome back, ${currentCompany.name}`}
        description="Your operating system at a glance. Launchpad builds it, Nova runs it."
      />

      <StageTracker current={currentCompany.stage} />

      {/* Next best action */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-launchpad/10 text-launchpad">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Next best action</div>
              <div className="mt-0.5 text-base font-semibold">{recommendedNext.title}</div>
              <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{recommendedNext.description}</p>
            </div>
          </div>
          <Link to={recommendedNext.href}>
            <Button>{recommendedNext.cta} <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <SectionTitle>Quick actions</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {quickActions.map((q) => (
            <Link key={q.label} to={q.to} className="group flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2.5 text-sm hover:border-foreground/20 hover:bg-accent transition">
              <q.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
              <span className="truncate">{q.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Launchpad progress */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-launchpad" />
            <div className="text-sm font-semibold">Launchpad progress</div>
          </div>
          <div className="mt-3 flex items-end gap-2">
            <div className="text-3xl font-semibold">{usedTools}</div>
            <div className="pb-1 text-xs text-muted-foreground">/ 10 tools used</div>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-muted">
            <div className="h-full rounded-full bg-launchpad" style={{ width: `${(usedTools / 10) * 100}%` }} />
          </div>
          <Link to="/app/launchpad" className="mt-3 inline-flex text-xs text-muted-foreground hover:text-foreground">Open Launchpad →</Link>
        </div>

        {/* Nova readiness */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-nova" />
            <div className="text-sm font-semibold">Nova OS readiness</div>
          </div>
          <div className="mt-3 flex items-end gap-2">
            <div className="text-3xl font-semibold">{novaReady}%</div>
            <div className="pb-1 text-xs text-muted-foreground">setup complete</div>
          </div>
          <div className="mt-3 space-y-1.5">
            {novaSystems.slice(0, 3).map((s) => (
              <div key={s.key} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{s.name}</span>
                <span className={s.enabled ? "text-success" : "text-muted-foreground"}>{s.setup}%</span>
              </div>
            ))}
          </div>
          <Link to="/app/nova" className="mt-3 inline-flex text-xs text-muted-foreground hover:text-foreground">Open Nova OS →</Link>
        </div>

        {/* Pipeline snapshot */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-nova" />
            <div className="text-sm font-semibold">Pipeline snapshot</div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Stat n={newLeadsCount.toString()} l="active" />
            <Stat n="$87K" l="in flight" />
            <Stat n="63s" l="avg reply" />
          </div>
          <Link to="/app/nova/crm" className="mt-3 inline-flex text-xs text-muted-foreground hover:text-foreground">View pipeline →</Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent outputs */}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <SectionTitle>Recent Launchpad outputs</SectionTitle>
          <div className="divide-y divide-border">
            {recentOutputs.map((o) => (
              <div key={o.title} className="flex items-center justify-between py-2.5 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{o.title}</div>
                  <div className="text-xs text-muted-foreground">{o.tool} · {o.when}</div>
                </div>
                <Link to="/app/launchpad/history" className="text-xs text-muted-foreground hover:text-foreground">Open</Link>
              </div>
            ))}
          </div>
        </div>

        {/* Plan usage */}
        <div className="rounded-xl border border-border bg-card p-5">
          <SectionTitle>Plan usage · {currentCompany.plan}</SectionTitle>
          <Meter label="AI generations" used={usage.aiGenerations.used} limit={usage.aiGenerations.limit} />
          <Meter label="Leads" used={usage.leads.used} limit={usage.leads.limit} />
          <Meter label="Workflows" used={usage.workflows.used} limit={usage.workflows.limit} />
          <Link to="/app/billing" className="mt-3 inline-flex text-xs text-muted-foreground hover:text-foreground">Manage plan →</Link>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</div>;
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="rounded-md bg-muted p-2">
      <div className="text-base font-semibold">{n}</div>
      <div className="text-[10px] text-muted-foreground">{l}</div>
    </div>
  );
}

function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = Math.min(100, (used / limit) * 100);
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground">{used} / {limit}</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-muted">
        <div className={cn("h-full rounded-full", pct > 80 ? "bg-warning" : "bg-foreground")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";
