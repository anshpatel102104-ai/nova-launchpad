// delete-account — permanently deletes the caller's account and all their data.
//
// The Danger Zone used to only rename the profile to "(deleted)" and sign out,
// leaving the auth user, the organization, and every row of business data on the
// server. This function does the real thing:
//
//   1. verify the caller via their JWT (anon client)
//   2. delete the auth user with the service role
//
// Every foreign key into auth.users is ON DELETE CASCADE / SET NULL (see
// migration 20260618000001), so deleting the auth user cascades through the
// profile, the organizations they own, and all org/user-scoped data in one shot.
// As a belt-and-braces measure we also explicitly delete the organizations the
// caller owns first, so org-scoped data is gone even if a future table is added
// without a cascade back to auth.users.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const admin = createClient(supabaseUrl, serviceKey);
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  // 1. Authenticate the caller — they can only ever delete themselves.
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return json({ error: "Invalid token" }, 401);
  const callerId = userData.user.id;

  try {
    // 2a. Best-effort: drop organizations the caller owns (cascades org data).
    const { error: orgErr } = await admin
      .from("organizations")
      .delete()
      .eq("owner_id", callerId);
    if (orgErr) {
      console.warn(`[delete-account] org cleanup warning for ${callerId}: ${orgErr.message}`);
    }

    // 2b. Delete the auth user — cascades profile + all remaining user-scoped data.
    const { error: delErr } = await admin.auth.admin.deleteUser(callerId);
    if (delErr) {
      console.error(`[delete-account] deleteUser failed for ${callerId}: ${delErr.message}`);
      return json({ error: "Could not delete account. Please contact support." }, 500);
    }

    return json({ ok: true, deleted: true });
  } catch (e) {
    console.error("[delete-account] unexpected error:", e);
    return json({ error: e instanceof Error ? e.message : "Account deletion failed" }, 500);
  }
});
