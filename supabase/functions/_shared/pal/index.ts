// Provider Abstraction Layer — Phase 1
// Routes all AI calls through a single interface. Currently Anthropic-only; the
// provider/model selection is plan-based and extends the existing model-router logic.
// Phase 2 will add OpenAI, Grok, and DeepSeek adapters behind the same interface.

import { CLAUDE_HAIKU_MODEL, CLAUDE_MODEL } from "../config.ts";
import type { PALCallOptions, PALResult, ProviderName } from "./types.ts";

// ─── Cost rates (mirrors ai_model_catalog seed data) ──────────────────────
// Cost in USD per 1 000 tokens.
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5-20251001": { input: 0.0008,  output: 0.0040 },
  "claude-sonnet-4-6":         { input: 0.0030,  output: 0.0150 },
  "claude-opus-4-7":           { input: 0.0150,  output: 0.0750 },
  "gpt-4o":                    { input: 0.0050,  output: 0.0150 },
  "gpt-4o-mini":               { input: 0.00015, output: 0.0006 },
  "grok-2":                    { input: 0.0020,  output: 0.0100 },
  "deepseek-chat":             { input: 0.00014, output: 0.00028 },
  "gemini-2.0-flash":          { input: 0.000075,output: 0.0003 },
};

// Tool keys that require a more capable model.
const COMPLEX_TOOL_KEYS = new Set([
  "generate-gtm-strategy",
  "business-plan",
  "business-plan-generator",
  "investor-emails",
  "investor-email-writer",
  "idea-vs-idea",
  "funding-score",
  "funding-readiness-score",
  "kill-my-idea",
]);

const CRITICAL_TOOL_KEYS = new Set(["operator-deep-analysis"]);

// Map canonical plan names (starter/launch/operate/scale) to base Claude model.
function planBaseModel(plan: string): string {
  switch (plan) {
    case "starter":  return CLAUDE_HAIKU_MODEL;
    case "launch":   return CLAUDE_MODEL;
    case "operate":  return CLAUDE_MODEL;
    case "scale":    return CLAUDE_MODEL;
    default:         return CLAUDE_MODEL;
  }
}

const MODEL_TIER = [CLAUDE_HAIKU_MODEL, CLAUDE_MODEL, "claude-opus-4-7"] as const;

function selectModel(plan: string, toolKey?: string): string {
  const base = planBaseModel(plan);
  const baseIdx = MODEL_TIER.indexOf(base as (typeof MODEL_TIER)[number]);

  let escalation = 0;
  if (toolKey && CRITICAL_TOOL_KEYS.has(toolKey)) escalation = 2;
  else if (toolKey && COMPLEX_TOOL_KEYS.has(toolKey)) escalation = 1;

  return MODEL_TIER[Math.min(baseIdx + escalation, MODEL_TIER.length - 1)];
}

function calcCostUsd(model: string, tokensIn: number, tokensOut: number): number {
  const rates = MODEL_COSTS[model] ?? MODEL_COSTS["claude-sonnet-4-6"];
  return (tokensIn / 1000) * rates.input + (tokensOut / 1000) * rates.output;
}

// Virtual credits: output weighted 2x (costs more to generate), minimum 1.
function calcCredits(tokensIn: number, tokensOut: number): number {
  return Math.max(1, Math.ceil((tokensIn + tokensOut * 2) / 1000));
}

// ─── Anthropic adapter ────────────────────────────────────────────────────

async function callAnthropic(
  model: string,
  opts: PALCallOptions,
  apiKey: string,
): Promise<PALResult> {
  const t0 = Date.now();

  const messages = opts.messages ? [...opts.messages] : [];
  if (opts.userPrompt) messages.push({ role: "user", content: opts.userPrompt });

  const body: Record<string, unknown> = {
    model,
    max_tokens: opts.maxTokens ?? 8192,
    system: opts.systemPrompt,
    messages,
  };

  if (opts.tool) {
    body.tools = [{
      name: opts.tool.name,
      description: opts.tool.description,
      input_schema: opts.tool.parameters,
    }];
    body.tool_choice = { type: "tool", name: opts.tool.name };
  }

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    if (resp.status === 429) throw new Error("RATE_LIMIT");
    if (resp.status === 402) throw new Error("PAYMENT_REQUIRED");
    const text = await resp.text();
    throw new Error(`Anthropic API ${resp.status}: ${text}`);
  }

  const data = (await resp.json()) as {
    content: Array<{ type: string; text?: string; input?: Record<string, unknown> }>;
    usage: { input_tokens: number; output_tokens: number };
  };

  const latencyMs = Date.now() - t0;
  const tokensIn = data.usage.input_tokens;
  const tokensOut = data.usage.output_tokens;

  if (opts.tool) {
    const toolBlock = data.content.find((b) => b.type === "tool_use");
    if (!toolBlock?.input) throw new Error("No tool_use block in Anthropic response");
    return {
      content: "",
      toolResult: toolBlock.input,
      tokensIn, tokensOut, model, provider: "anthropic",
      latencyMs, actualCostUsd: calcCostUsd(model, tokensIn, tokensOut),
      credits: calcCredits(tokensIn, tokensOut),
    };
  }

  const textBlock = data.content.find((b) => b.type === "text");
  return {
    content: textBlock?.text ?? "",
    tokensIn, tokensOut, model, provider: "anthropic",
    latencyMs, actualCostUsd: calcCostUsd(model, tokensIn, tokensOut),
    credits: calcCredits(tokensIn, tokensOut),
  };
}

// ─── Main PAL entry point ─────────────────────────────────────────────────

export async function callPAL(
  opts: PALCallOptions,
  env: { ANTHROPIC_API_KEY?: string },
  plan = "starter",
  toolKey?: string,
): Promise<PALResult> {
  const model = opts.model ?? selectModel(plan, toolKey);
  const provider: ProviderName = "anthropic"; // Phase 1: always Anthropic

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  // Retry with Haiku fallback on rate-limit or transient errors.
  const models = model === CLAUDE_HAIKU_MODEL
    ? [CLAUDE_HAIKU_MODEL]
    : [model, CLAUDE_HAIKU_MODEL];

  let lastError: Error | null = null;
  for (const m of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 800 * attempt));
        return await callAnthropic(m, opts, apiKey);
      } catch (e) {
        lastError = e as Error;
        if ((e as Error).message === "PAYMENT_REQUIRED") throw e; // never retry
      }
    }
  }
  throw lastError ?? new Error("AI call failed");
}

// ─── Credit helper ────────────────────────────────────────────────────────

/** Build credit_ledger + usage_events rows from a PALResult. Call fire-and-forget. */
export function buildUsageRows(result: PALResult, opts: {
  userId: string;
  orgId: string | null;
  workspaceId: string | null;
  eventType: string;
  resourceKey: string;
}): {
  creditRow: Record<string, unknown>;
  usageRow: Record<string, unknown> | null;
} {
  const creditRow = {
    user_id: opts.userId,
    tool: opts.resourceKey,
    cost: result.credits,
    status: "confirmed",
    actual_cost_usd: result.actualCostUsd,
    provider_name: result.provider,
    model_id: result.model,
    meta: {
      tokens_in: result.tokensIn,
      tokens_out: result.tokensOut,
      latency_ms: result.latencyMs,
    },
  };

  const usageRow = opts.orgId
    ? {
        user_id: opts.userId,
        workspace_id: opts.workspaceId,
        organization_id: opts.orgId,
        event_type: opts.eventType,
        resource_key: opts.resourceKey,
        credits_used: result.credits,
        tokens_in: result.tokensIn,
        tokens_out: result.tokensOut,
        model: result.model,
        duration_ms: result.latencyMs,
        status: "succeeded",
        provider_name: result.provider,
        actual_cost_usd: result.actualCostUsd,
        routing_reason: "plan_default",
      }
    : null;

  return { creditRow, usageRow };
}
