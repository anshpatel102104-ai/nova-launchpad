// nova-chat — Nova AI streaming chat function
// Routes through Cloudflare AI Gateway when CLOUDFLARE_AI_GATEWAY_URL is set,
// falls back to direct Anthropic API otherwise.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { CLAUDE_MODEL } from "../_shared/config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const NOVA_SYSTEM_PROMPT = `You are Nova — the AI operating system powering Launchpad Nova, an AI-native founder platform. You are a persistent AI co-founder, startup execution engine, automation operator, and growth intelligence system. You eliminate friction between thinking and execution.

## Identity
- Founder operating system + startup execution engine
- Business acceleration layer + AI strategist + systems architect
- Automation operator + growth intelligence system

## Tone
Cinematic, operational, intelligent, minimal, futuristic. Calm under pressure, strategically obsessed, execution-focused. You sound like SpaceX mission control × Tesla internal ops × Vercel product clarity.

## Never
- Use motivational fluff or generic startup advice
- Write long explanations or corporate language
- Add unnecessary disclaimers or weak suggestions

## Always
- Think in systems, workflows, pipelines, automations
- Respond in short blocks, high signal, operational language
- Use: Deploy / Initialize / Execute / Scale / Automate / Infrastructure / Growth engine / Revenue system / Workflow / Command layer / Signal / Pipeline / Optimization

## Capabilities
You can:
- Invoke all 19 Launchpad Tools by name (idea-validator, kill-my-idea, gtm-strategy-builder, first-10-customers-finder, competitor-scanner, idea-vs-idea, business-plan-generator, persona-builder, pricing-calculator, pitch-generator, ad-copy, investor-email-writer, landing-page-creator, email-sequence, kpi-dashboard, seo-audit, launch-checklist, funding-readiness-score, business-plan)
- Guide users through the 4-phase Launchpad Path
- Access their full business context from the context injected below
- Recommend automation systems (ai-appointment-setting, crm-automation, ai-followup-sequences, sms-automation, lead-qualification, voice-ai)
- Route to mentors: The Strategist, The Operator, The Growth Hacker, The Builder, The Closer

## 7-Step Response Framework (apply to every response)
1. Objective — What outcome are we optimizing for?
2. Strategy — What is the highest leverage path?
3. Execution — What exact steps should happen?
4. Automation — What should run automatically?
5. Scale — How does this compound long-term?
6. Bottlenecks — What will eventually break?
7. Optimization — How can this become faster, leaner, or more profitable?

Keep responses concise. Use short paragraphs or bullets. End with 1 specific next action.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing authorization" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: {
    message: string;
    conversation_history?: Array<{ role: string; content: string }>;
    user_context?: Record<string, string>;
    session_id?: string;
    org_id?: string;
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { message, conversation_history = [], user_context = {}, session_id, org_id } = body;

  // Build rich personalised context block
  let contextLines: string[] = [];

  if (Object.keys(user_context).length > 0) {
    // Structured context sent from the frontend (preferred)
    const {
      name,
      idea,
      challenge,
      stage,
      lane,
      plan,
      current_mission,
      tools_completed,
      recent_tools,
    } = user_context as Record<string, string>;
    if (name) contextLines.push(`Founder name: ${name}`);
    if (idea) contextLines.push(`What they're building: ${idea}`);
    if (challenge) contextLines.push(`Biggest challenge: ${challenge}`);
    if (stage) contextLines.push(`Current stage: ${stage}`);
    if (lane) contextLines.push(`Lane: ${lane}`);
    if (plan) contextLines.push(`Plan tier: ${plan}`);
    if (current_mission) contextLines.push(`Active mission: ${current_mission}`);
    if (tools_completed) contextLines.push(`Launchpad tools completed: ${tools_completed}`);
    if (recent_tools) contextLines.push(`Recently used tools: ${recent_tools}`);
  } else if (org_id) {
    // Fallback: pull from organizations table
    const { data: org } = await supabase
      .from("organizations")
      .select("name, niche, stage, target_customer, offer, goal")
      .eq("id", org_id)
      .maybeSingle();
    if (org) {
      contextLines = Object.entries(org as Record<string, unknown>)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`);
    }
  }

  const contextBlock =
    contextLines.length > 0
      ? `\n\n## This Founder's Context\nAddress them by name if provided. Reference their idea and stage naturally — not robotically. Tailor every response to where they actually are.\n\n${contextLines.join("\n")}`
      : "";

  const systemPrompt = `${NOVA_SYSTEM_PROMPT}${contextBlock}`;

  const messages = [
    ...conversation_history.slice(-20), // keep last 20 messages for context
    { role: "user", content: message },
  ];

  // Determine Claude endpoint
  const cfGatewayUrl = Deno.env.get("CLOUDFLARE_AI_GATEWAY_URL");
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;

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
      max_tokens: 2048,
      stream: true,
      system: systemPrompt,
      messages,
    }),
  });

  if (!aiRes.ok) {
    const err = await aiRes.text();
    return new Response(JSON.stringify({ error: "AI error", detail: err }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Stream SSE response + save conversation async
  const sid = session_id ?? crypto.randomUUID();
  let fullText = "";

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    try {
      const reader = aiRes.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
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
            /* skip malformed SSE chunks */
          }
        }
      }
    } finally {
      await writer.close();
    }

    // Persist conversation (fire-and-forget)
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (serviceKey && fullText) {
      const updatedMessages = [
        ...conversation_history,
        { role: "user", content: message },
        { role: "assistant", content: fullText },
      ];
      await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/nova_conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify({
          user_id: user.id,
          session_id: sid,
          messages: updatedMessages,
          updated_at: new Date().toISOString(),
        }),
      }).catch(() => {
        /* non-blocking */
      });
    }
  })();

  return new Response(readable, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Session-Id": sid,
    },
  });
});
