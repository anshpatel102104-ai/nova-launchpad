import { createClient } from "npm:@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL = "claude-sonnet-4-6";
const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json({ error: "Unauthorized" }, 401);
  }

  // Verify caller via JWT
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) return json({ error: "Unauthorized" }, 401);

  // Service client for DB writes (bypasses RLS)
  const svc = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: { toolKey: string; input: Record<string, unknown>; organizationId: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }

  const { toolKey, input, organizationId } = body;
  if (!toolKey || !organizationId) return json({ error: "toolKey and organizationId required" }, 400);

  // Verify caller is a member of the org
  const { data: membership } = await svc
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return json({ error: "Access denied" }, 403);

  // Check subscription
  const { data: sub } = await svc
    .from("subscriptions")
    .select("plan, status")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (sub?.status === "past_due") {
    return json({ error: "Payment failed. Update your card in Billing to restore AI tool access." }, 402);
  }

  const plan = sub?.plan ?? "starter";

  // Check plan entitlement
  const { data: entitlement } = await svc
    .from("plan_entitlements")
    .select("allowed_tools, monthly_generation_limit")
    .eq("plan", plan)
    .maybeSingle();

  const allowedTools: string[] = entitlement?.allowed_tools ?? ["validate-idea"];
  if (!allowedTools.includes(toolKey)) {
    return json(
      { error: `This tool requires a higher plan. Upgrade in Billing to unlock it.` },
      403,
    );
  }

  // Check monthly generation limit
  const limit: number | null = entitlement?.monthly_generation_limit ?? null;
  if (limit !== null) {
    const period = new Date().toISOString().slice(0, 7);
    const { data: usageRows } = await svc
      .from("usage_tracking")
      .select("count")
      .eq("organization_id", organizationId)
      .eq("period", period);
    const totalUsed = (usageRows ?? []).reduce((s: number, r: { count: number }) => s + r.count, 0);
    if (totalUsed >= limit) {
      return json(
        { error: `Monthly generation limit reached (${limit}). Upgrade your plan to continue.` },
        429,
      );
    }
  }

  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicKey) {
    console.error("ANTHROPIC_API_KEY is not set in edge function environment");
    return json({ error: "AI service is not configured. Contact support." }, 500);
  }

  // Try to load prompt from subagent_prompts table first
  const { data: promptRow } = await svc
    .from("subagent_prompts")
    .select("system_prompt")
    .eq("agent_slug", toolKey)
    .maybeSingle();

  const systemPrompt = promptRow?.system_prompt ?? getFallbackSystemPrompt(toolKey);
  const userPrompt = buildUserPrompt(toolKey, input);

  // Record the run
  const { data: run } = await svc
    .from("tool_runs")
    .insert({
      organization_id: organizationId,
      user_id: user.id,
      tool_key: toolKey,
      status: "running",
      input: input ?? {},
    })
    .select("id")
    .single();

  try {
    const resp = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Anthropic API error ${resp.status}: ${errText}`);
    }

    const anthropicData = await resp.json();
    const rawText: string = anthropicData.content?.[0]?.text ?? "";

    // Parse structured JSON if the model returned it
    let output: Record<string, unknown>;
    try {
      const jsonMatch =
        rawText.match(/```json\s*([\s\S]*?)\s*```/) ||
        rawText.match(/^\s*(\{[\s\S]*\})\s*$/);
      output = jsonMatch ? JSON.parse(jsonMatch[1]) : { summary: rawText };
    } catch {
      output = { summary: rawText };
    }

    // Update run to succeeded
    if (run?.id) {
      await svc
        .from("tool_runs")
        .update({ status: "succeeded", output, updated_at: new Date().toISOString() })
        .eq("id", run.id);
    }

    // Upsert usage tracking
    const period = new Date().toISOString().slice(0, 7);
    await svc.rpc("increment_usage", {
      p_org_id: organizationId,
      p_period: period,
      p_tool_key: toolKey,
    }).catch(async () => {
      // Fallback if RPC doesn't exist yet
      await svc.from("usage_tracking").upsert(
        {
          organization_id: organizationId,
          period,
          tool_key: toolKey,
          count: 1,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: "organization_id,period,tool_key" },
      );
    });

    // Save generated asset
    const context = input as { business?: string; title?: string; idea?: string };
    const assetTitle = context.title || context.business || context.idea || toolKey;
    await svc.from("generated_assets").insert({
      organization_id: organizationId,
      user_id: user.id,
      tool_run_id: run?.id ?? null,
      category: "launchpad",
      kind: toolKey,
      title: String(assetTitle).slice(0, 120),
      content: output,
    }).catch((e) => console.warn("asset insert failed", e));

    return json({ output, run_id: run?.id }, 200);
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : "Generation failed";
    console.error("run-tool error:", errMsg);
    if (run?.id) {
      await svc
        .from("tool_runs")
        .update({ status: "failed", error: errMsg })
        .eq("id", run.id);
    }
    return json({ error: errMsg }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function buildUserPrompt(toolKey: string, input: Record<string, unknown>): string {
  const ctx = (input.context || input.idea || input.offer || input.url || "") as string;
  const title = (input.title || input.business || input.target || "") as string;

  const label = title ? `Business/Project: ${title}\n\n` : "";

  switch (toolKey) {
    case "validate-idea":
      return `${label}Idea to validate:\n${ctx}`;
    case "generate-pitch":
      return `${label}Build an investor-ready pitch for:\n${ctx}`;
    case "generate-gtm-strategy":
      return `${label}Build a complete go-to-market strategy for:\n${ctx}`;
    case "generate-offer":
      return `${label}Build an irresistible offer for:\n${ctx}`;
    case "generate-ops-plan":
      return `${label}Build an operations plan for:\n${ctx}`;
    case "generate-followup-sequence":
      return `${label}Write a 5-touch follow-up sequence for this lead/context:\n${ctx}`;
    case "analyze-website":
      return `Perform a full conversion, UX, and SEO audit of this website/context:\n${ctx}`;
    case "kill-my-idea":
      return `Stress-test and find every fatal flaw in this idea:\n${label}${ctx}`;
    case "funding-score":
      return `${label}Score this startup's VC fundability and explain each dimension:\n${ctx}`;
    case "first-10-customers":
      return `${label}Build a week-by-week tactical plan to land the first 10 paying customers for:\n${ctx}`;
    case "business-plan":
      return `${label}Write a complete investor-ready business plan for:\n${ctx}`;
    case "investor-emails":
      return `${label}Write a 3-email cold outreach sequence targeting investors for:\n${ctx}`;
    case "idea-vs-idea":
      return `Compare these two startup ideas and score which one wins:\n${ctx}`;
    case "landing-page":
      return `${label}Write complete high-converting landing page copy for:\n${ctx}`;
    case "competitor-analysis":
      return `${label}Map the competitive landscape and identify strategic gaps for:\n${ctx}`;
    case "pricing-strategy":
      return `${label}Design a tiered pricing architecture with positioning for:\n${ctx}`;
    case "revenue-projector":
      return `${label}Build a 12-month MRR projection with CAC, LTV, and 3 scenarios for:\n${ctx}`;
    default:
      return `${label}${ctx}`;
  }
}

function getFallbackSystemPrompt(toolKey: string): string {
  const base = `You are a senior AI business advisor. Always respond with structured JSON only — no markdown prose outside the JSON block. Output must be valid JSON wrapped in \`\`\`json ... \`\`\` fences.`;

  switch (toolKey) {
    case "validate-idea":
      return `${base} You are a ruthlessly honest startup analyst. Evaluate business ideas with brutal clarity. Score 1-100. Return JSON: { score, verdict, strengths[], weaknesses[], risks[], market_size, competition_level, next_steps[] }`;
    case "generate-pitch":
      return `${base} You are an expert pitch writer for top-tier accelerators. Return JSON: { headline, problem, solution, market_size, business_model, traction, team_strengths, ask, one_liner, tagline }`;
    case "generate-gtm-strategy":
      return `${base} You are a B2B GTM strategist. Return JSON: { icp, channels[], messaging_framework, 30_day_plan[], 90_day_milestones[], pricing_signal, sales_motion }`;
    case "generate-offer":
      return `${base} You are an expert offer architect. Return JSON: { offer_name, core_promise, deliverables[], bonuses[], guarantee, price_anchor, objection_busters[], one_liner }`;
    case "generate-ops-plan":
      return `${base} You are a COO-level operations consultant. Return JSON: { workflows[], kpis[], tools_stack[], team_structure, bottlenecks[], 30_day_priorities[], automation_opportunities[] }`;
    case "generate-followup-sequence":
      return `${base} You are an expert sales copywriter. Return JSON: { sequence: [{ day, channel, subject, body, cta }] }`;
    case "analyze-website":
      return `${base} You are a CRO and UX expert. Return JSON: { overall_score, conversion_issues[], ux_issues[], seo_issues[], quick_wins[], major_improvements[], headline_rewrite, cta_rewrite }`;
    case "kill-my-idea":
      return `${base} You are the world's most skeptical VC. Find every reason this will fail. Be brutally honest. Return JSON: { fatal_flaws[], assumption_failures[], better_alternatives[], survivability_score, the_one_way_it_could_work }`;
    case "funding-score":
      return `${base} You are a venture analyst. Score 1-100 on each dimension. Return JSON: { overall_score, team_score, market_score, product_score, traction_score, fundraisability_score, breakdown{}, investor_objections[], what_would_change_the_score[] }`;
    case "first-10-customers":
      return `${base} You are a B2B sales expert. Return JSON: { week_1[], week_2[], week_3[], week_4[], channels[], scripts[], qualifying_questions[], success_metrics[] }`;
    case "business-plan":
      return `${base} You are a McKinsey consultant. Return JSON: { executive_summary, problem, solution, market_analysis, business_model, revenue_streams[], cost_structure, go_to_market, milestones[], financial_projections, risks[], appendix_notes }`;
    case "investor-emails":
      return `${base} You are an expert fundraising coach. Return JSON: { emails: [{ subject, body, send_day, notes }], subject_line_alternatives[], follow_up_strategy }`;
    case "idea-vs-idea":
      return `${base} You are a startup strategist. Compare two ideas side-by-side. Return JSON: { winner, winner_reason, idea_a{ name, score, pros[], cons[] }, idea_b{ name, score, pros[], cons[] }, recommendation }`;
    case "landing-page":
      return `${base} You are a direct response copywriter. Return JSON: { headline, subheadline, hero_copy, problem_section, solution_section, benefits[], social_proof_template, cta_primary, cta_secondary, faq[], footer_copy }`;
    case "competitor-analysis":
      return `${base} You are a competitive intelligence analyst. Return JSON: { competitors[{ name, strengths[], weaknesses[], pricing, target_customer }], market_gaps[], your_angle, positioning_statement, moat_opportunities[] }`;
    case "pricing-strategy":
      return `${base} You are a pricing strategist. Return JSON: { recommended_tiers[{ name, price, features[], target_customer, positioning }], anchor_logic, price_psychology_notes, what_to_test[], risk_of_underpricing, risk_of_overpricing }`;
    case "revenue-projector":
      return `${base} You are a financial modeler. Return JSON: { assumptions{}, conservative{ monthly_arr[], year1_arr, cac, ltv, payback_months }, base{ monthly_arr[], year1_arr, cac, ltv, payback_months }, aggressive{ monthly_arr[], year1_arr, cac, ltv, payback_months }, key_drivers[], risks[] }`;
    default:
      return `${base} Provide a structured, actionable analysis. Return JSON with clear sections.`;
  }
}
