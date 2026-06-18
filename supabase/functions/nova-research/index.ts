// nova-research — grounded, idea-specific research for Nova's playbook steps.
//
// Uses Perplexity Sonar (live web search with citations) when PERPLEXITY_API_KEY
// is configured; otherwise falls back to Claude. Returns a compact, normalized
// brief: { summary, insights[], recommendation, sources[], grounded }.
//
// This is the "perplexity research" path that lets Nova guide founders with
// real market signal about their specific business, not generic advice.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { assembleContext } from "../_shared/context.ts";
import { CLAUDE_MODEL } from "../_shared/config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PERPLEXITY_MODEL = "sonar-pro";

interface ResearchBody {
  idea?: string;
  focus?: string;
  niche?: string;
  target_customer?: string;
  stage?: string;
  goal?: string;
  org_id?: string;
}

interface ResearchResult {
  summary: string;
  insights: string[];
  recommendation: string;
  sources: Array<{ title: string; url: string }>;
  grounded: boolean;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractJson(raw: string): Record<string, unknown> | null {
  const cleaned = raw
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function clampList(v: unknown, max = 5): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, max);
}

function buildPrompt(body: ResearchBody, contextBlock: string): string {
  const lines = [
    `THE BUSINESS: ${body.idea || "(not specified)"}`,
    body.niche ? `NICHE: ${body.niche}` : "",
    body.target_customer ? `TARGET CUSTOMER: ${body.target_customer}` : "",
    body.stage ? `STAGE: ${body.stage}` : "",
    body.goal ? `FOUNDER'S PRIMARY GOAL: ${body.goal}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `You are Nova, an AI cofounder doing fast, practical research for a founder.

${lines}
${contextBlock ? `\n${contextBlock}\n` : ""}
RESEARCH FOCUS: ${body.focus || "the most important next decision for this business"}

Research the focus area for THIS specific business. Be concrete and specific to them — no generic startup advice. Tie everything back to their primary goal. Return ONLY a JSON object (no markdown, no code fences):
{
  "summary": "1-2 sentences on what you found for this exact business",
  "insights": ["specific finding 1", "specific finding 2", "specific finding 3"],
  "recommendation": "the single most important decision or next action, in one sentence"
}`;
}

const SYSTEM =
  "You are Nova, an AI cofounder and sharp market researcher. You return only valid JSON. Be specific to the founder's business and current goal. No hedging, no fluff.";

async function callPerplexity(prompt: string, apiKey: string): Promise<ResearchResult | null> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: PERPLEXITY_MODEL,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt },
      ],
      max_tokens: 1200,
      temperature: 0.2,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";
  // Perplexity returns citations as a top-level array of URLs.
  const citations: string[] = Array.isArray(data?.citations) ? data.citations : [];
  const parsed = extractJson(content);
  if (!parsed) return null;
  return {
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    insights: clampList(parsed.insights),
    recommendation: typeof parsed.recommendation === "string" ? parsed.recommendation : "",
    sources: citations.slice(0, 6).map((u) => ({ title: u, url: u })),
    grounded: true,
  };
}

async function callClaude(prompt: string, apiKey: string): Promise<ResearchResult | null> {
  const cfGatewayUrl = Deno.env.get("CLOUDFLARE_AI_GATEWAY_URL");
  const endpoint = cfGatewayUrl
    ? `${cfGatewayUrl}/anthropic/v1/messages`
    : "https://api.anthropic.com/v1/messages";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1200,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const content: string =
    Array.isArray(data?.content) && data.content[0]?.type === "text" ? data.content[0].text : "";
  const parsed = extractJson(content);
  if (!parsed) return null;
  return {
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    insights: clampList(parsed.insights),
    recommendation: typeof parsed.recommendation === "string" ? parsed.recommendation : "",
    sources: [],
    grounded: false,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing authorization" }, 401);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return json({ error: "Unauthorized" }, 401);

  let body: ResearchBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  // Pull the founder's verified context (goals included) to ground the research.
  let contextBlock = "";
  if (body.org_id) {
    const assembled = await assembleContext(supabase, body.org_id, { budgetChars: 2500 }).catch(
      () => ({ block: "", used: [] as string[] }),
    );
    contextBlock = assembled.block ?? "";
  }

  const prompt = buildPrompt(body, contextBlock);

  const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

  let result: ResearchResult | null = null;
  try {
    if (perplexityKey) {
      result = await callPerplexity(prompt, perplexityKey);
    }
    if (!result && anthropicKey) {
      result = await callClaude(prompt, anthropicKey);
    }
  } catch (e) {
    return json(
      { error: "Research failed", detail: e instanceof Error ? e.message : String(e) },
      502,
    );
  }

  if (!result) {
    return json({ error: "No research provider configured" }, 503);
  }

  // Best-effort usage log (never blocks the response).
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceKey) {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);
    admin
      .from("credit_ledger")
      .insert({
        user_id: user.id,
        tool: "nova_research",
        cost: 2,
        status: "confirmed",
        provider_name: result.grounded ? "perplexity" : "anthropic",
        model_id: result.grounded ? PERPLEXITY_MODEL : CLAUDE_MODEL,
        meta: { focus: body.focus ?? null, grounded: result.grounded },
      })
      .then(() => {})
      .catch(() => {});
  }

  return json(result);
});
