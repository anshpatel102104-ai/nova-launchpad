import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { WorkspaceHeader } from "@/components/app/WorkspaceHeader";
import { Button } from "@/components/ui/button";
import {
  Check, Sparkles, Zap, Crown, Rocket, CreditCard, AlertTriangle,
  ExternalLink, FileText, Loader2, RotateCcw, Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { planEntitlementsQuery, subscriptionQuery, usageQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { blockIfGuest } from "@/lib/guest";
import { CheckoutDialog } from "@/components/app/CheckoutDialog";
import { PaymentTestModeBanner } from "@/components/app/PaymentTestModeBanner";
import { isPaymentsEnabled, getStripeEnvironment } from "@/lib/stripe";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

const PLAN_ORDER = ["starter", "launch", "operate", "scale"];

type Invoice = {
  id: string;
  number: string | null;
  amount_paid: number;
  currency: string;
  status: string | null;
  created: number;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  period_start: number;
  period_end: number;
};

function Billing() {
  const { currentOrgId, user } = useAuth();
  const qc = useQueryClient();
  const subQ = useQuery({ ...subscriptionQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const plansQ = useQuery(planEntitlementsQuery());
  const usageQ = useQuery({ ...usageQuery(currentOrgId ?? ""), enabled: !!currentOrgId });

  const invoicesQ = useQuery({
    queryKey: ["invoices", currentOrgId],
    enabled: !!currentOrgId && !!subQ.data?.stripe_customer_id,
    queryFn: async (): Promise<Invoice[]> => {
      const { data, error } = await supabase.functions.invoke("list-invoices", {
        body: { organizationId: currentOrgId, environment: getStripeEnvironment() },
      });
      if (error) throw error;
      return data?.invoices ?? [];
    },
  });

  const [checkoutPriceId, setCheckoutPriceId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<
    | { kind: "cancel" }
    | { kind: "switch"; plan: string; lookup: string }
    | { kind: "downgrade-free" }
    | null
  >(null);
  const [busy, setBusy] = useState(false);

  const sub = subQ.data;
  const currentPlan = sub?.plan ?? "starter";
  const usage = usageQ.data ?? [];
  const totalUsed = usage.reduce((s, r) => s + (r.count as number), 0);
  const currentEnt = plansQ.data?.find((p) => p.plan === currentPlan);
  const limit = currentEnt?.monthly_generation_limit ?? null;
  const pct = limit ? Math.min(100, (totalUsed / limit) * 100) : 0;
  const allowedToolCount = currentEnt?.allowed_tools.length ?? 0;
  const paymentsOn = isPaymentsEnabled();

  const hasStripeSub = !!sub?.stripe_subscription_id;
  const isPastDue = sub?.status === "past_due";
  const isCanceling = !!sub?.cancel_at_period_end;
  const periodEnd = sub?.current_period_end ? new Date(sub.current_period_end) : null;

  const refetchAll = () => {
    if (!currentOrgId) return;
    qc.invalidateQueries({ queryKey: ["subscription", currentOrgId] });
    qc.invalidateQueries({ queryKey: ["invoices", currentOrgId] });
  };

  const callManage = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-subscription", {
        body: { ...body, organizationId: currentOrgId, environment: getStripeEnvironment() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      // Stripe webhook sync may take a moment
      [800, 2000, 4000].forEach((ms) => setTimeout(refetchAll, ms));
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const onPlanClick = (plan: string) => {
    if (blockIfGuest("Sign up to manage your subscription.")) return;
    if (!currentOrgId) return;
    if (plan === currentPlan) return;

    const lookup = PLAN_PRICE_LOOKUP[plan];
    const targetIdx = PLAN_ORDER.indexOf(plan);
    const currentIdx = PLAN_ORDER.indexOf(currentPlan);

    // Downgrade to free starter
    if (plan === "starter") {
      if (hasStripeSub) {
        setConfirm({ kind: "downgrade-free" });
      } else {
        // No Stripe sub yet — just flip the row
        directDbSwitch("starter");
      }
      return;
    }

    // Paid → paid switch (upgrade or downgrade)
    if (lookup && hasStripeSub) {
      setConfirm({ kind: "switch", plan, lookup });
      return;
    }

    // First paid purchase → checkout
    if (lookup && paymentsOn) {
      setCheckoutPriceId(lookup);
      return;
    }

    // Payments disabled → fallback DB switch
    directDbSwitch(plan);
    void targetIdx; void currentIdx;
  };

  const directDbSwitch = async (plan: string) => {
    if (!currentOrgId) return;
    const { error } = await supabase
      .from("subscriptions")
      .update({ plan: plan as "starter" | "launch" | "operate" | "scale" })
      .eq("organization_id", currentOrgId);
    if (error) { toast.error(error.message); return; }
    toast.success(`Switched to ${plan}`);
    qc.invalidateQueries({ queryKey: ["subscription", currentOrgId] });
  };

  const sortedPlans = [...(plansQ.data ?? [])].sort((a, b) => a.price_usd - b.price_usd);
  const currentIdx = PLAN_ORDER.indexOf(currentPlan);

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

      {/* Past due banner — locks tools */}
      {isPastDue && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-rose-100 dark:text-rose-200">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
          <div className="flex-1">
            <div className="font-display text-sm font-semibold tracking-tight">
              Payment failed — AI tools are locked
            </div>
            <p className="mt-0.5 text-[12.5px] text-rose-100/80">
              We couldn't charge your card. Update your payment method or re-subscribe to restore access.
            </p>
          </div>
          {hasStripeSub && (
            <Button
              size="sm"
              variant="outline"
              className="border-rose-300/40"
              onClick={() => {
                const lookup = PLAN_PRICE_LOOKUP[currentPlan];
                if (lookup) setCheckoutPriceId(lookup);
              }}
            >
              Update payment
            </Button>
          )}
        </div>
      )}

      {/* Cancellation pending banner */}
      {isCanceling && periodEnd && !isPastDue && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
          <RotateCcw className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div className="flex-1">
            <div className="font-display text-sm font-semibold tracking-tight">
              Subscription ends {periodEnd.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
            </div>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              You'll keep {currentPlan} access until then, then drop to Starter.
            </p>
          </div>
          <Button
            size="sm"
            disabled={busy}
            onClick={() => callManage({ action: "resume" }).then((ok) => ok && toast.success("Subscription resumed"))}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Resume"}
          </Button>
        </div>
      )}

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
                {sub?.status && sub.status !== "active" && (
                  <span className="ml-2 rounded-full border border-border-subtle px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {sub.status}
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-[12.5px] text-muted-foreground">
                ${currentEnt?.price_usd ?? 0}/mo · {allowedToolCount} tools included
                {periodEnd && hasStripeSub && (
                  <> · {isCanceling ? "ends" : "renews"} {periodEnd.toLocaleDateString()}</>
                )}
              </div>
            </div>
          </div>

          <div className="grid w-full max-w-md grid-cols-2 gap-3">
            <UsageCard label="Generations" used={totalUsed} limit={limit} pct={pct} />
            <UsageCard label="AI tools" used={allowedToolCount} limit={null} pct={0} suffix="enabled" />
          </div>
        </div>

        {hasStripeSub && !isCanceling && !isPastDue && (
          <div className="mt-5 flex items-center justify-end border-t border-border-subtle pt-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-rose-400"
              onClick={() => setConfirm({ kind: "cancel" })}
              disabled={busy}
            >
              <Ban className="mr-1.5 h-3.5 w-3.5" />
              Cancel subscription
            </Button>
          </div>
        )}
      </div>

      {/* Plan grid */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {sortedPlans.map((p) => {
          const isCurrent = p.plan === currentPlan;
          const idx = PLAN_ORDER.indexOf(p.plan);
          const isUpgrade = idx > currentIdx;
          const isDowngrade = idx < currentIdx;
          const Icon = PLAN_ICONS[p.plan] ?? Sparkles;
          const features = (p.features as { highlights?: string[] }) ?? {};

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
                isCurrent ? "border-primary shadow-glow" : "border-border hover:border-foreground/20",
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
                disabled={isCurrent || busy}
                onClick={() => onPlanClick(p.plan)}
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

      {/* Invoices */}
      {hasStripeSub && (
        <div className="rounded-xl border border-border bg-surface p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="font-display text-sm font-semibold tracking-tight">
                Invoice history
              </div>
              <div className="text-[12px] text-muted-foreground">
                Receipts and PDFs from Stripe.
              </div>
            </div>
          </div>
          {invoicesQ.isLoading ? (
            <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading invoices…
            </div>
          ) : (invoicesQ.data ?? []).length === 0 ? (
            <div className="text-[12.5px] text-muted-foreground">No invoices yet.</div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {invoicesQ.data!.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-display text-[13px] font-medium tracking-tight">
                        {inv.number ?? inv.id.slice(-10)}
                      </div>
                      <div className="text-[11.5px] text-muted-foreground">
                        {new Date(inv.created * 1000).toLocaleDateString()} ·{" "}
                        {(inv.amount_paid / 100).toLocaleString(undefined, {
                          style: "currency",
                          currency: inv.currency.toUpperCase(),
                        })}{" "}
                        · {inv.status}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {inv.hosted_invoice_url && (
                      <a href={inv.hosted_invoice_url} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="ghost">
                          View <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      </a>
                    )}
                    {inv.invoice_pdf && (
                      <a href={inv.invoice_pdf} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline">PDF</Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <CheckoutDialog
        open={!!checkoutPriceId}
        onOpenChange={(v) => {
          if (!v) {
            setCheckoutPriceId(null);
            // Refresh after close in case user completed checkout
            [800, 2500].forEach((ms) => setTimeout(refetchAll, ms));
          }
        }}
        priceId={checkoutPriceId}
        customerEmail={user?.email ?? undefined}
        userId={user?.id}
        organizationId={currentOrgId ?? undefined}
      />

      {/* Confirmations */}
      <AlertDialog open={!!confirm} onOpenChange={(v) => !v && setConfirm(null)}>
        <AlertDialogContent>
          {confirm?.kind === "cancel" && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
                <AlertDialogDescription>
                  You'll keep {currentPlan} access until{" "}
                  {periodEnd?.toLocaleDateString() ?? "the end of the period"}, then your account
                  will drop to Starter. You can resume anytime before then.
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <AlertDialogFooter>
                <AlertDialogCancel disabled={busy}>Keep plan</AlertDialogCancel>
                <AlertDialogAction
                  disabled={busy}
                  onClick={async () => {
                    const ok = await callManage({ action: "cancel_at_period_end" });
                    if (ok) toast.success("Cancellation scheduled");
                    setConfirm(null);
                  }}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel subscription"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
          {confirm?.kind === "switch" && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Switch to {confirm.plan}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your card will be charged a prorated amount today and your renewal date stays the
                  same. You'll get the new plan's tools and limits immediately.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={busy}>Stay on {currentPlan}</AlertDialogCancel>
                <AlertDialogAction
                  disabled={busy}
                  onClick={async () => {
                    const ok = await callManage({
                      action: "switch_plan",
                      newPriceLookupKey: confirm.lookup,
                    });
                    if (ok) toast.success(`Switched to ${confirm.plan}`);
                    setConfirm(null);
                  }}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : `Switch to ${confirm.plan}`}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
          {confirm?.kind === "downgrade-free" && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Downgrade to Starter?</AlertDialogTitle>
                <AlertDialogDescription>
                  This cancels your paid subscription. You'll keep {currentPlan} access until{" "}
                  {periodEnd?.toLocaleDateString() ?? "the period ends"}, then you'll be on the free
                  Starter plan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={busy}>Keep {currentPlan}</AlertDialogCancel>
                <AlertDialogAction
                  disabled={busy}
                  onClick={async () => {
                    const ok = await callManage({ action: "cancel_at_period_end" });
                    if (ok) toast.success("Downgrade scheduled");
                    setConfirm(null);
                  }}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Downgrade"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
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
