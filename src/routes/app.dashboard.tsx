import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageHeader";
import { StageTracker } from "@/components/app/StageTracker";
import { useAuth } from "@/lib/auth";
import { organizationQuery, subscriptionQuery, toolRunsQuery, usageQuery, planEntitlementsQuery } from "@/lib/queries";
import { ArrowRight, Rocket, Cpu, Sparkles, Inbox, Workflow, Users, BarChart3, Globe, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Stage } from "@/lib/mock";

export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });

function Dashboard() {
  const { currentOrgId, profile } = useAuth();
  const orgQ = useQuery({ ...organizationQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const subQ = useQuery({ ...subscriptionQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const runsQ = useQuery({ ...toolRunsQuery(currentOrgId ?? "", 10), enabled: !!currentOrgId });
  const usageQ = useQuery({ ...usageQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const plansQ = useQuery(planEntitlementsQuery());

  if (!currentOrgId) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <h2 className="text-lg font-semibold">Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}</h2>
        <p className="mt-2 text-sm text-muted-foreground">Finish onboarding to set up your workspace.</p>
        <Link to="/onboarding"><Button className="mt-4">Start onboarding</Button></Link>
      </div>
    );
  }

  const org = orgQ.data;
  const sub = subQ.data;
  const runs = runsQ.data ?? [];
  const usage = usageQ.data ?? [];
  const totalUsed = usage.reduce((s, r) => s + (r.count as number), 0);
  const limit = plansQ.data?.find((p) => p.plan === sub?.plan)?.monthly_generation_limit ?? null;

  const quickActions = [
    { label: "Validate Idea", icon: Sparkles, to: "/app/launchpad/idea-validator" },
    { label: "Generate Pitch", icon: Rocket, to: "/app/launchpad/pitch-generator" },
    { label: "Build GTM", icon: Zap, to: "/app/launchpad/gtm-strategy" },
    { label: "Build Offer", icon: Users, to: "/app/launchpad/offer" },
    { label: "Website Audit", icon: Globe, to: "/app/launchpad/website-audit" },
    { label: "Pipeline", icon: BarChart3, to: "/app/nova/crm" },
    { label: "Workflows", icon: Workflow, to: "/app/nova/workflows" },
    { label: "Leads", icon: Inbox, to: "/app/nova/leads" },
    { label: "Clients", icon: Cpu, to: "/app/nova/clients" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Command center" title={`Welcome back, ${org?.name ?? "your workspace"}`} description="Your operating system at a glance. Launchpad builds it, Nova runs it." />
      <StageTracker current={(org?.stage as Stage) ?? "Idea"} />

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
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2"><Rocket className="h-4 w-4 text-launchpad" /><div className="text-sm font-semibold">Generations used</div></div>
          <div className="mt-3 flex items-end gap-2">
            <div className="text-3xl font-semibold">{totalUsed}</div>
            <div className="pb-1 text-xs text-muted-foreground">/ {limit ?? "∞"} this month</div>
          </div>
          <Link to="/app/launchpad" className="mt-3 inline-flex text-xs text-muted-foreground hover:text-foreground">Open Launchpad →</Link>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2"><Cpu className="h-4 w-4 text-nova" /><div className="text-sm font-semibold">Plan</div></div>
          <div className="mt-3 text-3xl font-semibold capitalize">{sub?.plan ?? "starter"}</div>
          <Link to="/app/billing" className="mt-3 inline-flex text-xs text-muted-foreground hover:text-foreground">Manage billing →</Link>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-nova" /><div className="text-sm font-semibold">Recent runs</div></div>
          <div className="mt-3 text-3xl font-semibold">{runs.length}</div>
          <Link to="/app/launchpad/history" className="mt-3 inline-flex text-xs text-muted-foreground hover:text-foreground">View history →</Link>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <SectionTitle>Recent activity</SectionTitle>
        {runs.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">No runs yet. <Link to="/app/launchpad" className="underline">Generate your first output</Link>.</div>
        ) : (
          <div className="divide-y divide-border">
            {runs.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2.5 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{r.tool_key}</div>
                  <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()} · {r.status}</div>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px]", r.status === "succeeded" ? "bg-success/15 text-success" : r.status === "failed" ? "bg-destructive/10 text-destructive" : "bg-muted")}>{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</div>;
}
