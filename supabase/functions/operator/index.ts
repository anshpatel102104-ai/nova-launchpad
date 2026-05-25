// TASK-080 · Secure Backend Operator Endpoint
// TASK-082 · Route All Provider Calls Through Backend Only
//
// Single entry point for all AI operator requests from the client.
// No AI provider calls happen client-side — everything flows through here.
// Routes to Claude API via n8n or direct (depending on complexity).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.27.0";

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

type Lane = "Idea" | "Offer" | "Customer" | "Systems";

const LANE_PERSONA: Record<Lane, string> = {
  Idea: "You are advising a founder who is at the idea/validation stage. Focus on market validation, assumption testing, and de-risking before building.",
  Offer: "You are advising a founder who needs to define and package their offer. Focus on positioning, pricing, and communicating value clearly.",
  Customer: "You are advising a founder who needs to acquire customers. Focus on outreach, conversion, and building a repeatable sales motion.",
  Systems: "You are advising a founder who is scaling and building systems. Focus on automation, delegation, SOPs, and growth levers.",
};

const BASE_SYSTEM = `You are Nova, an AI founder operating system. You are direct, practical, and action-oriented.
Your job is to give founders the exact next step — not general advice.
You never ask more than one clarifying question at a time.
When you recommend a tool, name it explicitly (e.g., "Run the Idea Validator now").
Response format: 2–4 short paragraphs max, or a numbered list. No long preambles.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return json({ error: "Invalid token" }, 401);
  const userId = userData.user.id;

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  let body: {
    message: string;
    workspace_id?: string;
    mission_id?: string;
    session_id?: string;
    context?: Record<string, unknown>;
  };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const { message, workspace_id, session_id } = body;
  if (!message?.trim()) return json({ error: "message is required" }, 400);

  const sessionId = session_id ?? crypto.randomUUID();
  const t0 = Date.now();

  // ── 1. Load workspace context ──────────────────────────────────────
  let lane: Lane = "Idea";
  let currentMissionTitle = "";
  let userName = "";
  let orgId: string | null = null;

  const { data: ws } = await admin
    .from("workspaces")
    .select("lane, organization_id")
    .eq(workspace_id ? "id" : "owner_id", workspace_id ?? userId)
    .maybeSingle();

  if (ws) {
    lane = (ws.lane as Lane) ?? "Idea";
    orgId = ws.organization_id as string;
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.full_name) userName = profile.full_name as string;

  if (workspace_id) {
    const { data: mission } = await admin
      .from("missions")
      .select("title")
      .eq("workspace_id", workspace_id)
      .eq("status", "active")
      .order("sort_order")
      .limit(1)
      .maybeSingle();
    if (mission?.title) currentMissionTitle = mission.title as string;
  }

  // ── 2. Check credit / plan ─────────────────────────────────────────
  if (orgId) {
    const { data: sub } = await admin
      .from("subscriptions")
      .select("plan")
      .eq("organization_id", orgId)
      .maybeSingle();
    const plan = (sub?.plan as string) ?? "starter";

    if (plan === "starter") {
      // Count operator messages this month
      const period = new Date().toISOString().slice(0, 7);
      const { count } = await admin
        .from("agent_runs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("agent_type", "operator")
        .gte("created_at", `${period}-01`);

      if ((count ?? 0) >= 5) {
        return json({
          status: "credit_insufficient",
          credits_remaining: 0,
          credits_needed: 1,
          upgrade_url: "/app/billing",
          upsell_message: "You've used your 5 free Operator messages this month. Upgrade to continue.",
        });
      }
    }
  }

  // ── 3. Build system prompt with lane persona ────────────────────────
  const lanePersona = LANE_PERSONA[lane];
  const contextLines = [
    `User: ${userName || "Founder"}`,
    lane ? `Lane: ${lane}` : null,
    currentMissionTitle ? `Current mission: "${currentMissionTitle}"` : null,
  ].filter(Boolean).join("\n");

  const systemPrompt = `${BASE_SYSTEM}\n\n${lanePersona}\n\nContext:\n${contextLines}`;

  // ── 4. Call Claude API ────────────────────────────────────────────
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicKey) return json({ error: "AI provider not configured" }, 503);

  const anthropic = new Anthropic({ apiKey: anthropicKey });

  let reply = "";
  let tokensIn = 0;
  let tokensOut = 0;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: "user", content: message }],
    });
    reply = response.content[0].type === "text" ? response.content[0].text : "";
    tokensIn = response.usage.input_tokens;
    tokensOut = response.usage.output_tokens;
  } catch (e) {
    return json({ status: "error", error: (e as Error).message }, 500);
  }

  const durationMs = Date.now() - t0;

  // ── 5. Persist agent run ────────────────────────────────────────────
  const { data: agentRun } = await admin
    .from("agent_runs")
    .insert({
      workspace_id: workspace_id ?? null,
      user_id: userId,
      agent_type: "operator",
      input: { message, session_id: sessionId },
      output: { reply },
      status: "succeeded",
      model: "claude-sonnet-4-6",
      tokens_used: tokensIn + tokensOut,
      duration_ms: durationMs,
    })
    .select("id")
    .single();

  // Log usage event
  if (orgId) {
    await admin.from("usage_events").insert({
      user_id: userId,
      workspace_id: workspace_id ?? null,
      organization_id: orgId,
      event_type: "operator_message",
      resource_key: "operator",
      credits_used: 1,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      model: "claude-sonnet-4-6",
      duration_ms: durationMs,
      status: "succeeded",
    });
  }

  return json({
    status: "success",
    session_id: sessionId,
    agent_run_id: agentRun?.id ?? null,
    reply,
    credits_used: 1,
    credits_remaining: 999, // simplified — full credit system in credit_ledger
  });
});
