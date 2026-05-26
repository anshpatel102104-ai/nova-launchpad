import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, jsonResponse } from "../_shared/helpers.ts";

const PLAYBOOK_SCHEMA = {
  name: "generate_business_playbook",
  description: "Generate a step-by-step business playbook tailored to the founder's idea and stage.",
  parameters: {
    type: "object",
    additionalProperties: false,
    required: ["title", "summary", "phases"],
    properties: {
      title: { type: "string", description: "Short, punchy playbook title specific to their business." },
      summary: { type: "string", description: "2-3 sentences on what this playbook covers and why it's built for them." },
      phases: {
        type: "array",
        minItems: 3,
        maxItems: 5,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "name", "description", "duration", "tasks"],
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            duration: { type: "string", description: "e.g. 'Week 1–2' or 'Month 2'" },
            tasks: {
              type: "array",
              minItems: 2,
              maxItems: 5,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["id", "name", "description", "tools", "tips"],
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  description: { type: "string", description: "Specific to their niche/offer/customer." },
                  tools: {
                    type: "array",
                    description: "Platform tools or external tools that help with this task.",
                    items: { type: "string" },
                    maxItems: 3,
                  },
                  tips: {
                    type: "array",
                    description: "2-3 tactical tips specific to their situation.",
                    items: { type: "string" },
                    minItems: 1,
                    maxItems: 3,
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

const SYSTEM_PROMPT = `You are Nova, an AI business strategist inside a startup launchpad platform.

Generate a concrete, actionable, stage-appropriate business playbook for a founder based on their idea and context. Every phase, task, tool, and tip must be 100% specific to their actual business — no generic startup advice.

Rules:
- Reference their niche, offer, target customer, and stage directly throughout.
- Tasks must be executable this month, not aspirational.
- Tools should name real resources (e.g. "Idea Validator on Nova", "Google Forms", "Stripe", "Notion").
- Tips should be the kind of insight a smart advisor would share in a 1-on-1, not obvious platitudes.
- Tone: direct, strategic, operator-level. No fluff.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = req.headers.get("Authorization");
  if (!auth) return jsonResponse({ error: "Missing Authorization header" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: auth } } },
  );

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

  if (!member) return jsonResponse({ error: "No organization found" }, 403);
  const organizationId = member.organization_id as string;

  // Return existing playbook if one exists for this user
  const { data: existing } = await supabase
    .from("playbooks")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    return jsonResponse({ playbook_id: existing.id, content: existing.content, cached: true });
  }

  // Load onboarding context
  const { data: onboarding } = await supabase
    .from("onboarding_responses")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  const { data: org } = await supabase
    .from("organizations")
    .select("name, stage, niche, goal, target_customer, offer")
    .eq("id", organizationId)
    .maybeSingle();

  const context = {
    business: (onboarding?.offer as string) || (org?.offer as string) || (org?.name as string) || "a startup",
    niche: (onboarding?.niche as string) || (org?.niche as string) || "",
    stage: (onboarding?.stage as string) || (org?.stage as string) || "Idea",
    goal: (onboarding?.goal as string) || (org?.goal as string) || "",
    target_customer: (onboarding?.target_customer as string) || (org?.target_customer as string) || "",
    biggest_blocker: (onboarding?.biggest_blocker as string) || "",
    business_type: (onboarding?.business_type as string) || "",
  };

  const userPrompt = `Generate a business playbook for this founder:

BUSINESS / OFFER: ${context.business}
NICHE / INDUSTRY: ${context.niche || "Not specified"}
CURRENT STAGE: ${context.stage}
PRIMARY GOAL: ${context.goal || "Grow and launch"}
TARGET CUSTOMER: ${context.target_customer || "Not specified"}
BIGGEST BLOCKER: ${context.biggest_blocker || "Not specified"}
BUSINESS TYPE: ${context.business_type || "Not specified"}

Build a phased playbook they can follow to go from where they are now to a thriving, revenue-generating business. Each task must be concrete and specific to their business.`;

  // Call Anthropic API
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return jsonResponse({ error: "ANTHROPIC_API_KEY not configured" }, 500);

  let playbookContent: Record<string, unknown>;
  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 6000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
        tools: [{ name: PLAYBOOK_SCHEMA.name, description: PLAYBOOK_SCHEMA.description, input_schema: PLAYBOOK_SCHEMA.parameters }],
        tool_choice: { type: "tool", name: PLAYBOOK_SCHEMA.name },
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("[generate-playbook] Anthropic error:", resp.status, t);
      if (resp.status === 429) return jsonResponse({ error: "Rate limit — try again shortly." }, 429);
      return jsonResponse({ error: "AI generation failed. Please try again." }, 500);
    }

    const data = await resp.json();
    const toolUse = (data.content as Array<{ type: string; input?: Record<string, unknown> }>)?.find(
      (b) => b.type === "tool_use",
    );
    if (!toolUse?.input) return jsonResponse({ error: "No playbook content returned." }, 500);
    playbookContent = toolUse.input;
  } catch (e) {
    console.error("[generate-playbook] Fetch error:", e);
    return jsonResponse({ error: "Network error calling AI." }, 500);
  }

  // Save playbook
  const { data: saved, error: saveErr } = await supabase
    .from("playbooks")
    .insert({ user_id: userId, organization_id: organizationId, content: playbookContent })
    .select("id")
    .single();

  if (saveErr) {
    console.error("[generate-playbook] Save error:", saveErr.message);
    return jsonResponse({ playbook_id: null, content: playbookContent, cached: false });
  }

  return jsonResponse({ playbook_id: saved.id, content: playbookContent, cached: false });
});
