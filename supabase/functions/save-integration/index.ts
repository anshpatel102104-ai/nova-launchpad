// Securely upsert a user_integrations row. The encryption key never leaves the server.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_FLAT = new Set([
  "stripe", "gohighlevel", "airtable", "n8n", "zapier", "slack",
  "google_calendar", "gmail", "anthropic",
]);
// Nova module webhooks use the "nova:webhook:<module>" prefix.
const NOVA_WEBHOOK_RE = /^nova:webhook:[a-z0-9_-]{1,64}$/;
function isAllowedKey(k: string) {
  return ALLOWED_FLAT.has(k) || NOVA_WEBHOOK_RE.test(k);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const encKey = Deno.env.get("INTEGRATIONS_ENCRYPTION_KEY");
    if (!encKey || encKey.length < 16) {
      console.error("[save-integration] INTEGRATIONS_ENCRYPTION_KEY missing or too short");
      return json({ error: "Server misconfigured" }, 500);
    }

    const auth = req.headers.get("Authorization");
    const token = auth?.replace("Bearer ", "");
    if (!token) return json({ error: "Unauthorized" }, 401);

    // User-context client to authenticate the caller
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth! } } },
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ error: "Invalid body" }, 400);

    const integrationKey = String(body.integration_key || "").trim();
    const value = body.value == null ? "" : String(body.value);

    if (!isAllowedKey(integrationKey)) {
      return json({ error: "Unknown integration_key" }, 400);
    }
    if (value.length > 4096) return json({ error: "Value too long" }, 400);

    // Service-role client to call the SECURITY DEFINER function
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await admin.rpc("set_user_integration", {
      _user_id: userId,
      _integration_key: integrationKey,
      _value: value,
      _encryption_key: encKey,
    });

    if (error) {
      console.error("[save-integration] rpc error", error.message);
      return json({ error: "Failed to save integration" }, 500);
    }

    const row = Array.isArray(data) ? data[0] : data;
    return json({
      ok: true,
      integration: {
        integration_key: row?.integration_key ?? integrationKey,
        status: row?.status ?? (value ? "connected" : "disabled"),
        value_last4: row?.value_last4 ?? null,
        is_connected: row?.is_connected ?? !!value,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[save-integration] error", msg);
    return json({ error: "Internal error" }, 500);
  }
});
