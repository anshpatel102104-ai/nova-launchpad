// mentor-chat — AI mentor conversations with business-context injection.
// Streaming SSE, persona-driven by agent_id, persisted to mentor_agent_sessions.
// Self-contained (no ../_shared imports) so it deploys as a single file.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CLAUDE_MODEL = "claude-sonnet-4-6";

// Mentor personas. agent_id is the slug stored on mentor_agent_sessions.agent_id.
const MENTORS: Record<string, { name: string; title: string; persona: string }> = {
  strategist: {
    name: "The Strategist",
    title: "Business Strategy Advisor",
    persona:
      "You are a sharp, McKinsey-grade business strategist. You pressure-test positioning, market choice, and sequencing. You think in leverage, moats, and second-order effects. You are direct, never flattering, and you always reduce ambiguity to a clear strategic bet.",
  },
  operator: {
    name: "The Operator",
    title: "Operations & Execution Advisor",
    persona:
      "You are a battle-tested startup operator. You turn strategy into systems, SOPs, and weekly execution. You obsess over throughput, bottlenecks, and what ships this week. You are calm, concrete, and allergic to vague plans.",
  },
  "growth-hacker": {
    name: "The Growth Hacker",
    title: "Growth & Acquisition Advisor",
    persona:
      "You are a growth engineer who lives in funnels, channels, and CAC/LTV. You design testable acquisition experiments and find the one channel that compounds. You are scrappy, data-driven, and ruthlessly prioritize the highest-leverage experiment.",
  },
  builder: {
    name: "The Builder",
    title: "Product & Technical Advisor",
    persona:
      "You are a pragmatic technical co-founder. You scope MVPs, cut features, and choose boring technology that ships. You translate product vision into the smallest buildable slice that proves the next assumption.",
  },
  closer: {
    name: "The Closer",
    title: "Sales & Revenue Advisor",
    persona:
      "You are an elite closer and sales leader. You design pipelines, objection-handling, and follow-up cadences that convert. You think in deals, discovery, and momentum. You are persuasive, structured, and always push for the next commitment.",
  },
};

function mentorFor(agentId: string) {
  return MENTORS[agentId] ?? MENTORS.strategist;
}

function jsonError(error: string, status: number) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Compact a business_context row into a short text block for the system prompt.
function contextBlock(bc: Record<string, unknown> | null): string {
  if (!bc) return "";
  const pick = (v: unknown): string => {
    if (!v) return "";
    if (typeof v === "string") return v;
    try {
      return Object.values(v as Record<string, unknown>)
        .filter((x) => typeof x === "string" && x)
        .join(" · ");
    } catch {
      return "";
    }
  };
  const lines: string[] = [];
  const identity = pick(bc.identity);
  const customer = pick(bc.customer);
  const stage = pick(bc.stage);
  const goals = pick(bc.goals);
  if (identity) lines.push(`Business: ${identity}`);
  if (customer) lines.push(`Customer: ${customer}`);
  if (stage) lines.push(`Stage: ${stage}`);
  if (goals) lines.push(`Goals: ${goals}`);
  if (lines.length === 0) return "";
  return `\n\n## This Founder's Business Context\nReference these specifics naturally; never restate them robotically.\n${lines.join("\n").slice(0, 2000)}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonError("Method not allowed", 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonError("Missing authorization", 401);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return jsonError("Unauthorized", 401);

  let body: {
    agent_id?: string;
    message?: string;
    org_id?: string;
    session_key?: string;
  };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const agentId = (body.agent_id || "strategist").toLowerCase();
  const message = (body.message || "").trim();
  if (!message) return jsonError("Missing message", 400);
  const mentor = mentorFor(agentId);

  // Resolve org — explicit org_id wins, else the caller's first membership.
  let orgId = body.org_id ?? null;
  if (orgId) {
    const { data: m } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("organization_id", orgId)
      .maybeSingle();
    if (!m) return jsonError("Forbidden", 403);
  } else {
    const { data: m } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!m) return jsonError("No organization", 403);
    orgId = m.organization_id as string;
  }

  // Load business context for injection.
  const { data: bc } = await supabase
    .from("business_context")
    .select("identity, customer, stage, goals")
    .eq("organization_id", orgId)
    .maybeSingle();

  // Load (or start) the mentor session — history keyed by org + agent + session_key.
  const sessionKey = body.session_key ?? "default";
  const { data: session } = await supabase
    .from("mentor_agent_sessions")
    .select("id, messages")
    .eq("org_id", orgId)
    .eq("agent_id", agentId)
    .eq("session_key", sessionKey)
    .maybeSingle();

  const history: Array<{ role: string; content: string }> = Array.isArray(session?.messages)
    ? (session!.messages as Array<{ role: string; content: string }>)
    : [];

  const systemPrompt =
    `${mentor.persona}\n\nYou are ${mentor.name}, ${mentor.title}, advising this founder inside Nova. ` +
    `Keep replies tight and operational — short paragraphs or bullets, high signal, no motivational fluff. ` +
    `End with one specific next action.${contextBlock(bc as Record<string, unknown> | null)}`;

  const messages = [...history.slice(-20), { role: "user", content: message }];

  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicKey) return jsonError("AI not configured", 503);
  const cfGatewayUrl = Deno.env.get("CLOUDFLARE_AI_GATEWAY_URL");
  const endpoint = cfGatewayUrl
    ? `${cfGatewayUrl}/anthropic/v1/messages`
    : "https://api.anthropic.com/v1/messages";

  const aiRes = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1536,
      stream: true,
      system: systemPrompt,
      messages,
    }),
  });

  if (!aiRes.ok) {
    const detail = await aiRes.text();
    return new Response(JSON.stringify({ error: "AI error", detail }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const admin = serviceKey ? createClient(Deno.env.get("SUPABASE_URL")!, serviceKey) : null;

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  let fullText = "";

  (async () => {
    try {
      const reader = aiRes.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n").filter((l) => l.startsWith("data: "))) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const text = parsed.delta?.text ?? "";
            if (text) {
              fullText += text;
              await writer.write(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          } catch {
            /* skip malformed SSE chunk */
          }
        }
      }
    } finally {
      await writer.close();
    }

    // Persist the updated session transcript (service role — bypass caller RLS).
    if (admin && fullText) {
      const nextMessages = [
        ...history,
        { role: "user", content: message },
        { role: "assistant", content: fullText },
      ].slice(-100);
      if (session?.id) {
        await admin
          .from("mentor_agent_sessions")
          .update({ messages: nextMessages, updated_at: new Date().toISOString() })
          .eq("id", session.id);
      } else {
        await admin.from("mentor_agent_sessions").insert({
          org_id: orgId,
          user_id: user.id,
          agent_id: agentId,
          session_key: sessionKey,
          messages: nextMessages,
        });
      }

      // Cross-system Connection 3: Mentor → memory. Fold this mentor's advice into
      // the Business Context Graph so it surfaces in Recent Memory and is queryable
      // by Nova and the tools. One rolling artifact per session (keyed by
      // session_key) keeps memory high-signal instead of one row per turn. Only
      // log substantive advice; skip trivial one-liners.
      if (fullText.trim().length > 80) {
        const nowIso = new Date().toISOString();
        const preview = fullText.slice(0, 500);
        const { data: existingArtifact } = await admin
          .from("memory_artifacts")
          .select("id, title")
          .eq("org_id", orgId)
          .eq("source_type", "mentor")
          .eq("source_label", agentId)
          .eq("metadata->>session_key", sessionKey)
          .maybeSingle();

        const artifactMeta = {
          source: "mentor",
          agent_id: agentId,
          mentor_name: mentor.name,
          session_key: sessionKey,
          last_question: message.slice(0, 240),
        };

        if (existingArtifact?.id) {
          await admin
            .from("memory_artifacts")
            .update({
              content: fullText,
              content_preview: preview,
              status: "indexed",
              metadata: artifactMeta,
              updated_at: nowIso,
            })
            .eq("id", existingArtifact.id);
        } else {
          await admin.from("memory_artifacts").insert({
            org_id: orgId,
            user_id: user.id,
            source_type: "mentor",
            source_label: agentId,
            title: `${mentor.name}: ${message.slice(0, 70)}`,
            content: fullText,
            content_preview: preview,
            status: "indexed",
            metadata: artifactMeta,
          });
        }
      }
    }
  })();

  return new Response(readable, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
});
