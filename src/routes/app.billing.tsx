import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { WorkspaceHeader } from "@/components/app/WorkspaceHeader";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Zap, Crown, Rocket, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { planEntitlementsQuery, subscriptionQuery, usageQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { blockIfGuest } from "@/lib/guest";
import { CheckoutDialog } from "@/components/app/CheckoutDialog";
import { PaymentTestModeBanner } from "@/components/app/PaymentTestModeBanner";
import { isPaymentsEnabled } from "@/lib/stripe";

export const Route = createFileRoute("/app/billing")({ component: Billing });

const PLAN_PRICE_LOOKUP: Record<string, string | null> = {
  starter: null,
  launch: "launch_monthly",
  operate: "operate_monthly",
  scale: "scale_monthly",
};

const PLAN_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  starter: Sparkles,
  launch: Rocket,
  operate: Zap,
  scale: Crown,
};

const PLAN_TAGLINE: Record<string, string> = {
  starter: "Validate your first idea.",
  launch: "Build, pitch, and go to market.",
  operate: "Automate revenue operations.",
  scale: "Scale across teams and pipelines.",
};

function Billing() {
  const { currentOrgId, user } = useAuth();
  const qc = useQueryClient();
  const subQ = useQuery({ ...subscriptionQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const plansQ = useQuery(planEntitlementsQuery());
  const usageQ = useQuery({ ...usageQuery(currentOrgId ?? ""), enabled: !!currentOrgId });

  const [checkoutPriceId, setCheckoutPriceId] = useState<string | null>(null);

  const currentPlan = subQ.data?.plan ?? "starter";
  const usage = usageQ.data ?? [];
  const totalUsed = usage.reduce((s, r) => s + (r.count as number), 0);
  const currentEnt = plansQ.data?.find((p) => p.plan === currentPlan);
  const limit = currentEnt?.monthly_generation_limit ?? null;
  const pct = limit ? Math.min(100, (totalUsed / limit) * 100) : 0;
  const allowedToolCount = currentEnt?.allowed_tools.length ?? 0;
  const paymentsOn = isPaymentsEnabled();

  const changePlan = async (plan: string) => {
    if (blockIfGuest("Sign up to manage your subscription.")) return;
    if (!currentOrgId) return;

    const lookup = PLAN_PRICE_LOOKUP[plan];
    // Paid plan + payments configured → open Stripe checkout
    if (lookup && paymentsOn) {
      setCheckoutPriceId(lookup);
      return;
    }

    // Downgrade to starter or payments not wired → direct DB switch
    const { error } = await supabase
      .from("subscriptions")
      .update({ plan: plan as "starter" | "launch" | "operate" | "scale" })
      .eq("organization_id", currentOrgId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Switched to ${plan}`);
    qc.invalidateQueries({ queryKey: ["subscription", currentOrgId] });
  };

  const sortedPlans = [...(plansQ.data ?? [])].sort((a, b) => a.price_usd - b.price_usd);
  const planOrder = ["starter", "launch", "operate", "scale"];
  const currentIdx = planOrder.indexOf(currentPlan);

  return (
    <div className="space-y-6">
      <PaymentTestModeBanner />
      <WorkspaceHeader
        variant="billing"
        icon={CreditCard}
        eyebrow="Account · billing"
        title="Billing & usage"
        description="Plans translate to platform access. Upgrade unlocks more tools and higher generation limits."
      />

      {/* Current plan summary */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-soft">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {(() => {
                const Icon = PLAN_ICONS[currentPlan] ?? Sparkles;
                return <Icon className="h-5 w-5" />;
              })()}
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Current plan
              </div>
              <div className="mt-0.5 font-display text-xl font-semibold capitalize tracking-tight">
                {currentPlan}
              </div>
              <div className="mt-0.5 text-[12.5px] text-muted-foreground">
                ${currentEnt?.price_usd ?? 0}/mo · {allowedToolCount} tools included
              </div>
            </div>
          </div>

          <div className="grid w-full max-w-md grid-cols-2 gap-3">
            <UsageCard
              label="Generations"
              used={totalUsed}
              limit={limit}
              pct={pct}
            />
            <UsageCard
              label="AI tools"
              used={allowedToolCount}
              limit={null}
              pct={0}
              suffix="enabled"
            />
          </div>
        </div>
      </div>

      {/* Plan grid */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {sortedPlans.map((p) => {
          const isCurrent = p.plan === currentPlan;
          const idx = planOrder.indexOf(p.plan);
          const isUpgrade = idx > currentIdx;
          const isDowngrade = idx < currentIdx;
          const Icon = PLAN_ICONS[p.plan] ?? Sparkles;
          const features =
            (p.features as { highlights?: string[] }) ?? {};

          const baseHighlights = [
            `${p.monthly_generation_limit ?? "Unlimited"} generations / month`,
            `${p.allowed_tools.length} AI tools included`,
          ];
          const highlights = [...baseHighlights, ...(features.highlights ?? [])];

          return (
            <div
              key={p.plan}
              className={cn(
                "relative flex flex-col rounded-xl border bg-surface p-5 transition",
                isCurrent
                  ? "border-primary shadow-glow"
                  : "border-border hover:border-foreground/20",
              )}
            >
              {isCurrent && (
                <span className="absolute -top-2 left-5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                  Current
                </span>
              )}
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="font-display text-[15px] font-semibold capitalize tracking-tight">
                  {p.plan}
                </div>
                <div className="mt-0.5 text-[12px] text-muted-foreground">
                  {PLAN_TAGLINE[p.plan]}
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-[1.7rem] font-semibold leading-none tracking-tight">
                  ${p.price_usd}
                </span>
                <span className="text-xs text-muted-foreground">/mo</span>
              </div>
              <ul className="mt-4 flex-1 space-y-1.5 text-[12.5px]">
                {highlights.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <span className="text-foreground/85">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={isCurrent ? "outline" : isUpgrade ? "default" : "ghost"}
                className="mt-4 w-full"
                disabled={isCurrent}
                onClick={() => changePlan(p.plan)}
              >
                {isCurrent
                  ? "Current plan"
                  : isUpgrade
                    ? `Upgrade to ${p.plan}`
                    : isDowngrade
                      ? `Downgrade to ${p.plan}`
                      : `Switch to ${p.plan}`}
              </Button>
            </div>
          );
        })}
      </div>

      <CheckoutDialog
        open={!!checkoutPriceId}
        onOpenChange={(v) => !v && setCheckoutPriceId(null)}
        priceId={checkoutPriceId}
        customerEmail={user?.email ?? undefined}
        userId={user?.id}
        organizationId={currentOrgId ?? undefined}
      />
    </div>
  );
}

function UsageCard({
  label, used, limit, pct, suffix,
}: {
  label: string;
  used: number;
  limit: number | null;
  pct: number;
  suffix?: string;
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-2 p-3">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-display text-lg font-semibold tracking-tight">{used.toLocaleString()}</span>
        <span className="text-[11.5px] text-muted-foreground">
          {suffix ? `/ ${suffix}` : `/ ${limit ?? "∞"}`}
        </span>
      </div>
      {limit !== null && (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-offset">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              pct > 85 ? "bg-rose-400" : pct > 60 ? "bg-amber-400" : "bg-primary",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
