import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { plans, currentCompany, usage } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/billing")({
  component: Billing,
});

function Billing() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Billing & usage"
        description="Plans translate to platform access. Upgrade unlocks Launchpad tools and Nova systems."
      />

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Current plan</div>
            <div className="mt-0.5 text-xl font-semibold">{currentCompany.plan}</div>
            <div className="text-xs text-muted-foreground">Renews May 18, 2025</div>
          </div>
          <Button variant="outline">Manage subscription</Button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Meter label="AI generations" used={usage.aiGenerations.used} limit={usage.aiGenerations.limit} />
          <Meter label="Leads" used={usage.leads.used} limit={usage.leads.limit} />
          <Meter label="Workflows" used={usage.workflows.used} limit={usage.workflows.limit} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((p) => (
          <div key={p.key} className={cn(
            "rounded-xl border bg-card p-5 flex flex-col",
            p.highlight ? "border-launchpad shadow-elevated" : "border-border",
          )}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">{p.key}</div>
              {p.key === currentCompany.plan && <span className="text-[10px] uppercase tracking-wider text-success">Current</span>}
            </div>
            <div className="mt-2 text-2xl font-semibold">{p.price}<span className="text-xs font-normal text-muted-foreground">/mo</span></div>
            <div className="text-xs text-muted-foreground">{p.tagline}</div>
            <ul className="mt-4 space-y-1.5 text-xs flex-1">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              variant={p.highlight ? "default" : "outline"}
              className="mt-4 w-full"
              disabled={p.key === currentCompany.plan}
            >
              {p.key === currentCompany.plan ? "Current plan" : `Upgrade to ${p.key}`}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = Math.min(100, (used / limit) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span>{used} / {limit}</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-muted">
        <div className={cn("h-full rounded-full", pct > 80 ? "bg-warning" : "bg-foreground")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
