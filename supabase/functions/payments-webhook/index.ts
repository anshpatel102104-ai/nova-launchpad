import { createClient } from "npm:@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

type PlanTier = "starter" | "launch" | "operate" | "scale";

function lookupKeyToPlan(key?: string | null): PlanTier | null {
  if (!key) return null;
  const k = key.toLowerCase();
  if (k.startsWith("launch")) return "launch";
  if (k.startsWith("operate")) return "operate";
  if (k.startsWith("scale")) return "scale";
  if (k.startsWith("starter")) return "starter";
  return null;
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const url = new URL(req.url);
  const env = (url.searchParams.get("env") || "sandbox") as StripeEnv;

  try {
    const event = await verifyWebhook(req, env);
    console.log("Stripe event:", event.type, "env:", env);

    switch (event.type) {
      case "checkout.session.completed":
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await syncSubscription(event.data.object);
        break;
      case "customer.subscription.deleted":
        await cancelSubscription(event.data.object);
        break;
      case "invoice.payment_failed":
        await markPastDue(event.data.object);
        break;
      case "invoice.payment_succeeded":
        await clearPastDue(event.data.object);
        break;
      default:
        console.log("Unhandled:", event.type);
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncSubscription(obj: any) {
  const subscriptionId: string | undefined = obj.subscription || obj.id;
  const customerId: string | undefined = obj.customer;
  const status: string = obj.status || "active";
  const currentPeriodEnd: number | null = obj.current_period_end ?? null;
  const cancelAtPeriodEnd: boolean = obj.cancel_at_period_end ?? false;
  const metadata = obj.metadata || {};
  let lookupKey: string | undefined = metadata.priceLookupKey;
  const organizationId: string | undefined = metadata.organizationId;

  const item = obj.items?.data?.[0];
  if (item?.price) {
    lookupKey =
      lookupKey ||
      item.price.lookup_key ||
      item.price.metadata?.lovable_external_id ||
      item.price.metadata?.priceLookupKey;
  }

  if (!organizationId) {
    console.warn("No organizationId in metadata; skipping sync", { subscriptionId });
    return;
  }

  const plan = lookupKeyToPlan(lookupKey);
  if (!plan) {
    console.warn("Could not infer plan from lookupKey, leaving plan unchanged", {
      lookupKey,
      organizationId,
    });
  }

  const update: Record<string, unknown> = {
    status,
    stripe_subscription_id: subscriptionId ?? null,
    stripe_customer_id: customerId ?? null,
    current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null,
    cancel_at_period_end: cancelAtPeriodEnd,
    updated_at: new Date().toISOString(),
  };
  if (plan) update.plan = plan;

  const { error } = await supabase
    .from("subscriptions")
    .update(update)
    .eq("organization_id", organizationId);

  if (error) console.error("subscriptions update failed", error);
  else console.log("Synced", { plan, organizationId, status });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function cancelSubscription(obj: any) {
  const organizationId = obj.metadata?.organizationId;
  if (!organizationId) return;
  await supabase
    .from("subscriptions")
    .update({
      plan: "starter",
      status: "canceled",
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", organizationId);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function markPastDue(invoice: any) {
  const customerId = invoice.customer;
  if (!customerId) return;
  await supabase
    .from("subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("stripe_customer_id", customerId);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function clearPastDue(invoice: any) {
  const customerId = invoice.customer;
  if (!customerId) return;
  // Only flip back to active if currently past_due
  await supabase
    .from("subscriptions")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("stripe_customer_id", customerId)
    .eq("status", "past_due");
}
