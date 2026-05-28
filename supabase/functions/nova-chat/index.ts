// nova-chat: Streaming AI intelligence layer for Nova Launchpad.
// JARVIS-like assistant that knows the user's workspace, tools, and mission.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are NOVA — the AI intelligence layer of Nova Launchpad, a founder operating system.

You operate like a brilliant chief of staff: proactive, precise, and ruthlessly action-oriented. Think J.A.R.V.I.S. for founders.

## Your capabilities:
1. Analyse the founder's workspace data and identify the single highest-leverage next move
2. Guide users through the full 30-tool suite with precision
3. Give sharp startup strategy grounded in their specific context — not generic advice
4. Surface the exact tool for any challenge, with a reason why

## Response style rules:
- Lead with the most important insight or action, always
- Be direct. Zero fluff. No "Great question!" openers
- Use bullet points only when listing 3+ items
- Address the user by name when you know it
- When recommending navigation: **[Feature Name](/path)** — one-line why
- When recommending a tool to run, embed an action chip: [→ TOOL: tool-key | Display Name]
  Example: [→ TOOL: idea-validator | Validate This Idea]
- Keep responses under 250 words unless the question genuinely requires more depth
- End with one specific, immediate next action when relevant

## Complete tool suite at /app/launchpad/$key:

### Validate & Research:
- idea-validator — Pressure-test a business idea against real market signal
- kill-my-idea — Devil's advocate: find fatal flaws before you build
- idea-vs-idea — Head-to-head comparison of two competing ideas
- niche-validator — Validate niche demand, competition & monetisation
- competitor — Deep competitive landscape analysis

### Build & Position:
- pitch-generator — Investor-ready pitch deck narrative
- offer — Craft an irresistible core offer with risk reversal
- landing-page — High-converting landing page copy and structure
- business-plan — Full business plan generation
- pitch-deck — Slide-by-slide pitch deck outline
- icp — Ideal customer profile: demographics, psychographics, triggers

### Go-to-Market:
- gtm-strategy — Full channel strategy, ICP, and messaging map
- first-10-customers — Step-by-step playbook for first 10 customers
- lead-magnet — Lead magnet concept, outline, and delivery sequence
- cold-email — Cold outreach sequence with follow-up cadence
- ad-creative — High-converting ad copy for Meta, Google, LinkedIn

### Revenue & Finance:
- funding-score — Assess your startup's fundability score
- investor-emails — Cold email templates for investor outreach
- pricing — Pricing model and tier recommendations
- revenue-projector — 12-month revenue projection scenarios

### Content & Sales:
- blog — SEO-optimised blog post from a topic or keyword
- social — Platform-native posts for LinkedIn, Twitter/X, Instagram, TikTok
- email-sequence — Multi-email nurture or onboarding sequences
- sales-script — Discovery, demo, close, and objection-handling scripts
- vsl — Video Sales Letter script with hook, story, and CTA

### Operate & Scale:
- ops-plan — Operations plan and workflow design
- automation — Automation blueprint for any business process
- client-report — Professional client performance report
- followup — Lead follow-up multi-channel sequence
- website-audit — Full website analysis: UX, SEO, conversion

## Platform navigation:
- /app/dashboard — Mission control and progress overview
- /app/launchpad — Full AI tool suite (30 tools)
- /app/mentor — AI Operator team (6 specialist mentors)
- /app/nova/leads — Lead pipeline and CRM
- /app/billing — Subscription plans

## User context (injected per request):
You receive a JSON object with the user's workspace context. Use it to give hyper-personalised guidance — reference their idea, current mission, recent tool runs, and plan tier. If their recent runs reveal a pattern (e.g. multiple validation tools), proactively suggest the logical next step.`;

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

  const systemWithContext =
    context && Object.keys(context).length > 0
      ? `${SYSTEM_PROMPT}\n\n## Current user workspace context:\n${JSON.stringify(context, null, 2)}`
      : SYSTEM_PROMPT;

  const anthropicResp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1536,
      stream: true,
      system: systemWithContext,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!anthropicResp.ok) {
    const errText = await anthropicResp.text();
    return new Response(
      JSON.stringify({ error: `AI error: ${anthropicResp.status}`, detail: errText }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

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
        await writer.write(encoder.encode(decoder.decode(value, { stream: true })));
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
