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

  let event: Awaited<ReturnType<typeof verifyWebhook>>;
  try {
    event = await verifyWebhook(req, env);
  } catch (e) {
    console.error("Webhook signature verification failed:", e);
    return new Response("Webhook signature invalid", { status: 400 });
  }

  // Idempotency: skip already-processed events
  const { data: existing } = await supabase
    .from("stripe_webhook_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();

  if (existing) {
    console.log("Duplicate event, skipping:", event.id);
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    console.log("Stripe event:", event.type, "env:", env, "id:", event.id);

    switch (event.type) {
      case "checkout.session.completed":
      case "customer.subscription.created":
        await syncSubscription(event.data.object, "provision");
        break;
      case "customer.subscription.updated":
        await syncSubscription(event.data.object, "change");
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

    // Mark event as processed
    await supabase
      .from("stripe_webhook_events")
      .insert({ id: event.id, type: event.type });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook processing error:", e);
    return new Response("Webhook processing error", { status: 400 });
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncSubscription(obj: any, n8nAction: "provision" | "change") {
  const subscriptionId: string | undefined = obj.subscription || obj.id;
  const customerId: string | undefined = obj.customer;
  const status: string = obj.status || "active";
  const currentPeriodEnd: number | null = obj.current_period_end ?? null;
  const cancelAtPeriodEnd: boolean = obj.cancel_at_period_end ?? false;
  const metadata = obj.metadata || {};
  let lookupKey: string | undefined = metadata.priceLookupKey;
  let organizationId: string | undefined = metadata.organizationId;

  const item = obj.items?.data?.[0];
  if (item?.price) {
    lookupKey =
      lookupKey ||
      item.price.lookup_key ||
      item.price.metadata?.lovable_external_id ||
      item.price.metadata?.priceLookupKey;
  }

  // Fallback: look up org by stripe_customer_id if metadata is missing
  if (!organizationId && customerId) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("organization_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    organizationId = sub?.organization_id;
  }

  if (!organizationId) {
    console.warn("No organizationId found for event; skipping sync", { subscriptionId, customerId });
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

  if (error) {
    console.error("subscriptions update failed", error);
    return;
  }
  console.log("Synced", { plan, organizationId, status });

  // Trigger n8n provisioning workflow (best-effort, non-blocking)
  if (plan) {
    fireN8nProvisioning(organizationId, plan, n8nAction);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function cancelSubscription(obj: any) {
  let organizationId = obj.metadata?.organizationId;
  if (!organizationId && obj.customer) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("organization_id")
      .eq("stripe_customer_id", obj.customer)
      .maybeSingle();
    organizationId = sub?.organization_id;
  }
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

  // Notify n8n so automations can be paused/archived
  fireN8nProvisioning(organizationId, "starter", "deprovision");
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
  await supabase
    .from("subscriptions")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("stripe_customer_id", customerId)
    .eq("status", "past_due");
}

async function fireN8nProvisioning(
  organizationId: string,
  plan: PlanTier,
  action: "provision" | "change" | "deprovision",
) {
  const n8nBase = Deno.env.get("N8N_BASE_URL");
  if (!n8nBase) {
    console.log("N8N_BASE_URL not set — skipping provisioning trigger");
    return;
  }

  // Fetch org + owner details for the n8n payload
  const { data: org } = await supabase
    .from("organizations")
    .select("name, owner_id")
    .eq("id", organizationId)
    .maybeSingle();

  if (!org) {
    console.warn("fireN8nProvisioning: org not found", organizationId);
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", org.owner_id)
    .maybeSingle();

  const webhookPath = action === "deprovision"
    ? "nova-ops-deprovision"
    : "nova-ops-provision";

  // Fire and forget — webhook delivery is best-effort
  fetch(`${n8nBase}/webhook/${webhookPath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organization_id: organizationId,
      organization_name: org.name,
      owner_email: profile?.email ?? null,
      owner_name: profile?.full_name ?? null,
      plan,
      action,
    }),
  }).catch((err) => console.warn("n8n trigger failed (non-fatal):", err));
}
