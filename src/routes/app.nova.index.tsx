import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { novaSystems, leads } from "@/lib/mock";
import { Cpu, Zap, Inbox, ArrowRight, Power } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/nova/")({
  component: NovaOverview,
});

function NovaOverview() {
  const activeWorkflows = 3;
  const leadsToday = leads.filter((l) => l.lastTouch === "2h" || l.lastTouch === "5h").length;
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Nova OS"
        description="The operations layer. Capture, qualify, follow up, onboard — without manual work."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KPI icon={Zap} label="Active workflows" value={activeWorkflows.toString()} />
        <KPI icon={Inbox} label="Leads today" value={leadsToday.toString()} />
        <KPI icon={Cpu} label="Avg response" value="63s" hint="Target: <90s" />
      </div>

      <div>
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">6 systems</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {novaSystems.map((s) => (
            <Link key={s.key} to={s.href} className="group rounded-xl border border-border bg-card p-4 hover:border-foreground/20 hover:shadow-soft transition">
              <div className="flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-nova/10 text-nova">
                  <Cpu className="h-4 w-4" />
                </div>
                <span className={cn("flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider", s.enabled ? "text-success" : "text-muted-foreground")}>
                  <Power className="h-3 w-3" /> {s.enabled ? "On" : "Off"}
                </span>
              </div>
              <div className="mt-3 text-sm font-semibold">{s.name}</div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Setup</span>
                <span>{s.setup}%</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-muted">
                <div className="h-full rounded-full bg-nova" style={{ width: `${s.setup}%` }} />
              </div>
              <div className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground">
                Open <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function KPI({ icon: Icon, label, value, hint }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-4 w-4" />{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
