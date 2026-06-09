// Shared helpers for AI edge functions
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { CLAUDE_MODEL } from "./config.ts";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export type AuthCtx = {
  supabase: SupabaseClient;
  userId: string;
  organizationId: string;
  plan: string;
  allowedTools: string[];
  monthlyLimit: number | null;
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function authenticateAndAuthorize(
  req: Request,
  toolKey: string,
): Promise<AuthCtx | Response> {
  const auth = req.headers.get("Authorization");
  if (!auth) return jsonResponse({ error: "Missing auth" }, 401);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return jsonResponse({ error: "Invalid token" }, 401);
  const userId = userData.user.id;

  // Resolve org
  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!member) return jsonResponse({ error: "No organization" }, 403);
  const organizationId = member.organization_id as string;

  // Subscription + entitlements
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("organization_id", organizationId)
    .maybeSingle();
  const plan = (sub?.plan as string) || "starter";

  // Query plan_tier_limits (the canonical entitlements table)
  const { data: ent } = await supabase
    .from("plan_tier_limits")
    .select("allowed_tools, monthly_generation_limit")
    .eq("plan", plan)
    .maybeSingle();

  const allowedTools = (ent?.allowed_tools as string[]) || [];
  const monthlyLimit = (ent?.monthly_generation_limit as number | null) ?? null;

  if (!allowedTools.includes(toolKey)) {
    return jsonResponse(
      { error: `Tool '${toolKey}' not available on '${plan}' plan`, code: "PLAN_GATE" },
      403,
    );
  }

  // Quota check
  if (monthlyLimit !== null) {
    const period = new Date().toISOString().slice(0, 7);
    const { data: usageRows } = await supabase
      .from("usage_tracking")
      .select("count")
      .eq("organization_id", organizationId)
      .eq("period", period);
    const total = (usageRows || []).reduce((s, r) => s + (r.count as number), 0);
    if (total >= monthlyLimit) {
      return jsonResponse({ error: `Monthly limit reached (${monthlyLimit})`, code: "QUOTA" }, 429);
    }
  }

  return { supabase, userId, organizationId, plan, allowedTools, monthlyLimit };
}

export async function incrementUsage(ctx: AuthCtx, toolKey: string) {
  const period = new Date().toISOString().slice(0, 7);
  const { data: existing } = await ctx.supabase
    .from("usage_tracking")
    .select("id, count")
    .eq("organization_id", ctx.organizationId)
    .eq("period", period)
    .eq("tool_key", toolKey)
    .maybeSingle();

  if (existing) {
    await ctx.supabase
      .from("usage_tracking")
      .update({ count: (existing.count as number) + 1, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await ctx.supabase.from("usage_tracking").insert({
      organization_id: ctx.organizationId,
      period,
      tool_key: toolKey,
      count: 1,
    });
  }
}

export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  schema: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  },
): Promise<Record<string, unknown>> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      tools: [
        {
          name: schema.name,
          description: schema.description,
          input_schema: schema.parameters,
        },
      ],
      tool_choice: { type: "tool", name: schema.name },
    }),
  });

  if (!resp.ok) {
    if (resp.status === 429) throw new Error("RATE_LIMIT");
    if (resp.status === 402) throw new Error("PAYMENT_REQUIRED");
    const t = await resp.text();
    throw new Error(`Anthropic API error: ${resp.status} ${t}`);
  }

  const data = await resp.json();
  const toolUse = (data.content as Array<{ type: string; input?: Record<string, unknown> }>)?.find(
    (b) => b.type === "tool_use",
  );
  if (!toolUse?.input) throw new Error("No tool_use block in Anthropic response");
  return toolUse.input;
}

export async function runTool(opts: {
  req: Request;
  toolKey: string;
  systemPrompt: string;
  buildUserPrompt: (input: Record<string, unknown>) => string;
  schema: { name: string; description: string; parameters: Record<string, unknown> };
  assetCategory: string;
  assetTitle: (input: Record<string, unknown>, output: Record<string, unknown>) => string;
  // Pre-parsed body — pass when the caller already consumed req.json() to avoid
  // double-reading the stream (e.g. the central run-tool router).
  preloadedInput?: Record<string, unknown>;
}) {
  if (opts.req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authResult = await authenticateAndAuthorize(opts.req, opts.toolKey);
  if (authResult instanceof Response) return authResult;
  const ctx = authResult;

  let input: Record<string, unknown>;
  if (opts.preloadedInput !== undefined) {
    input = opts.preloadedInput;
  } else {
    try {
      input = await opts.req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, 400);
    }
  }

  // Insert running tool_run
  const { data: run, error: runErr } = await ctx.supabase
    .from("tool_runs")
    .insert({
      organization_id: ctx.organizationId,
      user_id: ctx.userId,
      surface: (opts as { surface?: string }).surface ?? "launchpad",
      tool_key: opts.toolKey,
      title: opts.assetTitle ? opts.assetTitle(input, {}) : null,
      status: "running",
      input,
    })
    .select()
    .single();

  if (runErr || !run)
    return jsonResponse({ error: "Failed to create run", details: runErr?.message }, 500);

  try {
    const output = await callClaude(opts.systemPrompt, opts.buildUserPrompt(input), opts.schema);

    await ctx.supabase
      .from("tool_runs")
      .update({ status: "succeeded", output, completed_at: new Date().toISOString() })
      .eq("id", run.id);

    await ctx.supabase.from("generated_assets").insert({
      organization_id: ctx.organizationId,
      user_id: ctx.userId,
      tool_run_id: run.id,
      kind: opts.toolKey,
      title: opts.assetTitle(input, output),
      metadata: output,
    });

    await incrementUsage(ctx, opts.toolKey);

    return jsonResponse({ run_id: run.id, output });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[tool-run-error:${opts.toolKey}]`, msg);
    await ctx.supabase
      .from("tool_runs")
      .update({ status: "failed", error: msg, completed_at: new Date().toISOString() })
      .eq("id", run.id);
    if (msg === "RATE_LIMIT")
      return jsonResponse({ error: "Rate limit exceeded, try again shortly." }, 429);
    if (msg === "PAYMENT_REQUIRED")
      return jsonResponse({ error: "AI credits exhausted. Add funds in Settings." }, 402);
    return jsonResponse({ error: "An internal error occurred. Please try again." }, 500);
  }
}
