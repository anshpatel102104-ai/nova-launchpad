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

async function syncSubscription(obj: any) {
  // Could be a checkout.session OR subscription object
  let subscriptionId: string | undefined = obj.subscription || obj.id;
  let customerId: string | undefined = obj.customer;
  let status: string = obj.status || "active";
  let currentPeriodEnd: number | null = obj.current_period_end ?? null;
  let metadata = obj.metadata || {};
  let lookupKey: string | undefined = metadata.priceLookupKey;
  let organizationId: string | undefined = metadata.organizationId;

  // If this is a subscription object, dig into items
  const item = obj.items?.data?.[0];
  if (item?.price) {
    lookupKey = lookupKey || item.price.lookup_key || item.price.metadata?.lovable_external_id;
  }

  if (!organizationId) {
    console.warn("No organizationId in metadata; skipping sync", { subscriptionId });
    return;
  }

  const plan = lookupKeyToPlan(lookupKey) ?? "launch";

  const { error } = await supabase
    .from("subscriptions")
    .update({
      plan,
      status,
      stripe_subscription_id: subscriptionId ?? null,
      stripe_customer_id: customerId ?? null,
      current_period_end: currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", organizationId);

  if (error) console.error("subscriptions update failed", error);
  else console.log("Synced plan", plan, "for org", organizationId);
}

async function cancelSubscription(obj: any) {
  const organizationId = obj.metadata?.organizationId;
  if (!organizationId) return;
  await supabase
    .from("subscriptions")
    .update({ plan: "starter", status: "canceled", updated_at: new Date().toISOString() })
    .eq("organization_id", organizationId);
}
