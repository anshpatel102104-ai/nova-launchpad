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

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Accept both formats:
  // New (NovaChatModal): { messages: [{role, content},...], context: {...} }
  // Old (legacy):        { message: string, conversation_history: [...], user_context: {...} }
  const messages: Array<{ role: string; content: string }> = Array.isArray(body.messages)
    ? (body.messages as Array<{ role: string; content: string }>).slice(-20)
    : [
        ...((body.conversation_history as Array<{ role: string; content: string }>) ?? []).slice(-20),
        { role: "user", content: String(body.message ?? "") },
      ];

  const userContext =
    (body.context as Record<string, unknown>) ??
    (body.user_context as Record<string, unknown>) ??
    {};
  const sessionId = (body.session_id as string) ?? crypto.randomUUID();

  // Build system prompt with injected business context
  let contextStr = "";
  if (Object.keys(userContext).length > 0) {
    contextStr = Object.entries(userContext)
      .filter(([, v]) => v != null && v !== "")
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
  }

  const systemPrompt = contextStr
    ? `${NOVA_SYSTEM_PROMPT}\n\n## User Business Context\n${contextStr}`
    : NOVA_SYSTEM_PROMPT;

  // Determine Claude endpoint
  const cfGatewayUrl = Deno.env.get("CLOUDFLARE_AI_GATEWAY_URL");
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicKey) {
    return new Response(JSON.stringify({ error: "AI not configured" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

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

  // Pass through native Anthropic SSE stream while accumulating text for saving
  let fullText = "";

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();

  (async () => {
    try {
      const reader = aiRes.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Intercept content_block_delta events to accumulate full text for saving
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
              fullText += parsed.delta.text ?? "";
            }
          } catch {
            /* ignore non-JSON lines */
          }
        }

        // Forward raw bytes — frontend parses native Anthropic SSE format
        await writer.write(value);
      }
    } finally {
      await writer.close();
    }

    // Persist conversation (fire-and-forget)
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (serviceKey && fullText) {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
      const savedMessages = [
        ...messages,
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
          session_id: sessionId,
          messages: savedMessages,
          updated_at: new Date().toISOString(),
        }),
      }).catch(() => { /* non-blocking */ });
      void lastUserMsg; // suppress unused warning
    }
  })();

  return new Response(readable, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Session-Id": sessionId,
    },
  });
});
