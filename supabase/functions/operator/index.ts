// Single entry point for all AI operator and mentor-agent requests from the client.
// No AI provider calls happen client-side — everything flows through here.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.27.0";
import { CLAUDE_MODEL, CLAUDE_HAIKU_MODEL } from "../_shared/config.ts";

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
  Offer:
    "You are advising a founder who needs to define and package their offer. Focus on positioning, pricing, and communicating value clearly.",
  Customer:
    "You are advising a founder who needs to acquire customers. Focus on outreach, conversion, and building a repeatable sales motion.",
  Systems:
    "You are advising a founder who is scaling and building systems. Focus on automation, delegation, SOPs, and growth levers.",
};

const BASE_SYSTEM = `You are Nova, an AI founder operating system. You are direct, practical, and action-oriented.
Your job is to give founders the exact next step — not general advice.
You never ask more than one clarifying question at a time.
When you recommend a tool, name it explicitly (e.g., "Run the Idea Validator now").
Response format: 2–4 short paragraphs max, or a numbered list. No long preambles.`;

type MentorAgentId = "growth" | "offer" | "sales" | "content" | "automation" | "finance";

const MENTOR_PERSONAS: Record<MentorAgentId, string> = {
  growth: `You are a Growth Mentor — a seasoned growth hacker and marketing strategist. You specialise in user acquisition, retention, viral loops, and channel optimisation. Be data-driven, channel-specific, and always push the founder to their next 10x growth lever.`,
  offer: `You are an Offer Mentor — an expert offer architect trained in Alex Hormozi's $100M Offers framework. You help founders build irresistible offers with value stacking, guarantees, and pricing psychology. Push for specificity and concrete positioning.`,
  sales: `You are a Sales Mentor — a battle-tested B2B sales coach. You specialise in discovery calls, closing techniques, pipeline management, and objection handling. Focus on concrete scripts, talk tracks, and daily revenue-generating activities.`,
  content: `You are a Content Mentor — a social media and content strategist with expertise in LinkedIn, Twitter/X, short-form video, and email newsletters. Help founders build a content engine that generates leads on autopilot.`,
  automation: `You are an Automation Mentor — a workflow automation expert with deep knowledge of Claude AI agents, Make, Zapier, and custom-coded automation. Help founders eliminate manual work, save hours per week, and build scalable AI-native systems.`,
  finance: `You are a Finance Mentor — a startup finance expert covering cash flow, pricing, unit economics, and fundraising. Be precise with numbers, help founders understand their financial levers, and always tie advice back to profitability.`,
};

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
    // Mentor agent fields
    agent_id?: MentorAgentId;
    org_id?: string;
    business_context?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { message, workspace_id, session_id, agent_id, business_context } = body;
  if (!message?.trim()) return json({ error: "message is required" }, 400);

  // ── Mentor agent fast-path ─────────────────────────────────────────
  if (agent_id) {
    const persona = MENTOR_PERSONAS[agent_id] ?? MENTOR_PERSONAS.growth;
    const mentorSystem = `${persona}

Business context: ${business_context || "Not provided"}

IMPORTANT rules:
- Be concise, specific, and action-oriented
- Address the founder by their stage and context
- When recommending a tool, name it explicitly
- End every response with one clear, immediate next action
- Use bullet points for 3+ items, otherwise prose`;

    const mentorSessionId = session_id ?? crypto.randomUUID();

    // Load prior conversation turns for multi-turn context
    const mentorHistory: { role: "user" | "assistant"; content: string }[] = [];
    if (session_id) {
      const { data: priorRuns } = await admin
        .from("agent_runs")
        .select("input, output, created_at")
        .eq("session_id", session_id)
        .eq("agent_type", `mentor_${agent_id}`)
        .order("created_at", { ascending: true })
        .limit(12);

      for (const run of priorRuns ?? []) {
        const inp = run.input as { message?: string } | null;
        const out = run.output as { reply?: string } | null;
        if (inp?.message) mentorHistory.push({ role: "user", content: inp.message });
        if (out?.reply) mentorHistory.push({ role: "assistant", content: out.reply });
      }
    }
    mentorHistory.push({ role: "user", content: message });

    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });
    const t0Mentor = Date.now();
    try {
      const resp = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 800,
        system: mentorSystem,
        messages: mentorHistory,
      });
      const reply = resp.content[0].type === "text" ? resp.content[0].text : "";

      // Persist for future multi-turn context
      await admin.from("agent_runs").insert({
        user_id: userId,
        agent_type: `mentor_${agent_id}`,
        session_id: mentorSessionId,
        input: { message },
        output: { reply },
        status: "succeeded",
        model: CLAUDE_MODEL,
        tokens_used: resp.usage.input_tokens + resp.usage.output_tokens,
        duration_ms: Date.now() - t0Mentor,
      });

      return json({
        success: true,
        response: reply,
        agent_id,
        session_id: mentorSessionId,
      });
    } catch (e) {
      return json({ success: false, error: e instanceof Error ? e.message : "AI error" }, 500);
    }
  }

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
          upsell_message:
            "You've used your 5 free Operator messages this month. Upgrade to continue.",
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
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt = `${BASE_SYSTEM}\n\n${lanePersona}\n\nContext:\n${contextLines}`;

  // ── 4. Load session transcript for multi-turn context ─────────────
  type MsgRole = "user" | "assistant";
  const conversationHistory: { role: MsgRole; content: string }[] = [];

  if (sessionId) {
    const { data: priorRuns } = await admin
      .from("agent_runs")
      .select("input, output, created_at")
      .eq("session_id", sessionId)
      .eq("agent_type", "operator")
      .order("created_at", { ascending: true })
      .limit(10);

    for (const run of priorRuns ?? []) {
      const input = run.input as { message?: string } | null;
      const output = run.output as { reply?: string } | null;
      if (input?.message) conversationHistory.push({ role: "user", content: input.message });
      if (output?.reply) conversationHistory.push({ role: "assistant", content: output.reply });
    }
  }
  conversationHistory.push({ role: "user", content: message });

  // ── 5. Call Claude API ────────────────────────────────────────────
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicKey) return json({ error: "AI provider not configured" }, 503);

  const anthropic = new Anthropic({ apiKey: anthropicKey });

  let reply = "";
  let tokensIn = 0;
  let tokensOut = 0;
  let usedModel = CLAUDE_MODEL;

  // TASK-088/089: Retry with exponential backoff + model fallback
  const MODELS = [CLAUDE_MODEL, CLAUDE_HAIKU_MODEL] as const;
  let lastError: Error | null = null;

  for (let modelIdx = 0; modelIdx < MODELS.length; modelIdx++) {
    const model = MODELS[modelIdx];
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 800 * attempt));
        const response = await anthropic.messages.create({
          model,
          max_tokens: modelIdx === 0 ? 600 : 400,
          system: systemPrompt,
          messages: conversationHistory,
        });
        reply = response.content[0].type === "text" ? response.content[0].text : "";
        tokensIn = response.usage.input_tokens;
        tokensOut = response.usage.output_tokens;
        usedModel = model;
        lastError = null;
        break;
      } catch (e) {
        lastError = e as Error;
      }
    }
    if (!lastError) break;
  }

  if (lastError) {
    return json({ status: "error", error: lastError.message }, 500);
  }

  const durationMs = Date.now() - t0;

  // ── 6. Persist agent run ────────────────────────────────────────────
  const { data: agentRun } = await admin
    .from("agent_runs")
    .insert({
      workspace_id: workspace_id ?? null,
      user_id: userId,
      agent_type: "operator",
      session_id: sessionId,
      input: { message },
      output: { reply },
      status: "succeeded",
      model: usedModel,
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
      model: CLAUDE_MODEL,
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
