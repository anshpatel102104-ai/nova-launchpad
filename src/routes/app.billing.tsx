import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { planEntitlementsQuery, subscriptionQuery, usageQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/billing")({ component: Billing });

function Billing() {
  const { currentOrgId } = useAuth();
  const qc = useQueryClient();
  const subQ = useQuery({ ...subscriptionQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const plansQ = useQuery(planEntitlementsQuery());
  const usageQ = useQuery({ ...usageQuery(currentOrgId ?? ""), enabled: !!currentOrgId });

  const currentPlan = subQ.data?.plan ?? "starter";
  const usage = usageQ.data ?? [];
  const totalUsed = usage.reduce((s, r) => s + (r.count as number), 0);
  const limit = plansQ.data?.find((p) => p.plan === currentPlan)?.monthly_generation_limit;

  const changePlan = async (plan: string) => {
    if (!currentOrgId) return;
    const { error } = await supabase.from("subscriptions").update({ plan: plan as "starter" | "launch" | "operate" | "scale" }).eq("organization_id", currentOrgId);
    if (error) { toast.error(error.message); return; }
    toast.success(`Switched to ${plan}`);
    qc.invalidateQueries({ queryKey: ["subscription", currentOrgId] });
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Account" title="Billing & usage" description="Plans translate to platform access." />

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Current plan</div>
            <div className="mt-0.5 text-xl font-semibold capitalize">{currentPlan}</div>
          </div>
        </div>
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">AI generations</span>
            <span>{totalUsed} / {limit ?? "∞"}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-muted">
            <div className="h-full rounded-full bg-foreground" style={{ width: `${limit ? Math.min(100, (totalUsed / limit) * 100) : 5}%` }} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(plansQ.data ?? []).map((p) => {
          const isCurrent = p.plan === currentPlan;
          const features = (p.features as { label?: string; tagline?: string; highlights?: string[] }) ?? {};
          return (
            <div key={p.plan} className={cn("rounded-xl border bg-card p-5 flex flex-col", isCurrent ? "border-launchpad shadow-elevated" : "border-border")}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{features.label ?? p.plan}</div>
                {isCurrent && <span className="text-[10px] uppercase tracking-wider text-success">Current</span>}
              </div>
              <div className="mt-2 text-2xl font-semibold">${p.price_usd}<span className="text-xs font-normal text-muted-foreground">/mo</span></div>
              <div className="text-xs text-muted-foreground">{features.tagline}</div>
              <ul className="mt-4 space-y-1.5 text-xs flex-1">
                {(features.highlights ?? []).map((f: string) => (
                  <li key={f} className="flex gap-2"><Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" /><span>{f}</span></li>
                ))}
              </ul>
              <Button variant={isCurrent ? "outline" : "default"} className="mt-4 w-full" disabled={isCurrent} onClick={() => changePlan(p.plan)}>
                {isCurrent ? "Current plan" : `Switch to ${features.label ?? p.plan}`}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
