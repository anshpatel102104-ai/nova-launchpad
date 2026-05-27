// nova-chat: Streaming AI assistant for the Nova Launchpad platform.
// Answers user questions, explains features, and surfaces relevant tools/pages.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are Nova, an AI assistant built into the Nova Launchpad platform — a startup OS that helps entrepreneurs go from idea to launch.

Your job is to:
1. Answer questions about how to use the platform
2. Help users think through their startup idea, challenges, and next steps
3. Direct users to the right features when relevant
4. Give actionable startup advice grounded in their specific context

## Platform features you can direct users to:
- /app/dashboard — Main dashboard with mission progress and quick stats
- /app/ai-dashboard — AI-generated personalized startup dashboard
- /app/launchpad — Suite of 14 AI tools (see below)
- /app/nova/workflows — Automation & workflow builder
- /app/nova/content — Social content engine
- /app/nova/leads — Lead outreach system
- /app/nova/operations — SOPs and ops planning
- /app/settings — Account settings
- /app/billing — Subscription & billing

## Launchpad AI tools (at /app/launchpad/$tool):
- idea-validator — Pressure-test a business idea with market analysis
- kill-my-idea — Devil's advocate: find the fatal flaws
- idea-vs-idea — Compare two competing ideas
- generate-pitch — Create a startup pitch deck narrative
- generate-gtm-strategy — Go-to-market strategy
- generate-offer — Craft your core offer/positioning
- first-10-customers — Playbook for landing your first customers
- landing-page — Landing page copy and structure
- funding-score — Assess fundability
- investor-emails — Cold email templates for investors
- business-plan — Full business plan
- competitor-analysis — Deep competitive landscape
- pricing-strategy — Pricing model recommendations
- revenue-projector — 12-month revenue projections

## Response style:
- Be direct and concise. Bullet points for lists, prose for explanations.
- When directing to a feature, format it as: **[Feature Name](/path)** — one-liner description.
- Don't be overly enthusiastic. Be like a sharp advisor, not a chatbot.
- Keep responses under 300 words unless the question genuinely needs more.
- If you don't know something specific about the user's business, ask one clarifying question.

## User context (injected per request):
You will receive a JSON object with the user's workspace context. Use it to personalize your answers — reference their idea, stage, current mission, and plan where relevant.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "AI not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Auth
  const auth = req.headers.get("Authorization");
  if (!auth) {
    return new Response(JSON.stringify({ error: "Missing auth" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.json();
  const messages: Array<{ role: "user" | "assistant"; content: string }> = body.messages ?? [];
  const context: Record<string, unknown> = body.context ?? {};

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return new Response(JSON.stringify({ error: "Invalid messages" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Build system prompt with user context injected
  const systemWithContext =
    context && Object.keys(context).length > 0
      ? `${SYSTEM_PROMPT}\n\n## Current user context:\n${JSON.stringify(context, null, 2)}`
      : SYSTEM_PROMPT;

  // Call Anthropic with streaming
  const anthropicResp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      stream: true,
      system: systemWithContext,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!anthropicResp.ok) {
    const errText = await anthropicResp.text();
    return new Response(
      JSON.stringify({ error: `AI error: ${anthropicResp.status}`, detail: errText }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Stream SSE through to the client
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    const reader = anthropicResp.body!.getReader();
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // Forward the raw Anthropic SSE stream
        await writer.write(encoder.encode(chunk));
      }
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
});
