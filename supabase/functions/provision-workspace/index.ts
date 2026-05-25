// TASK-045 · Workspace Provisioning
// TASK-046 · Mission Seeding for New Users
// TASK-052 · Workspace Bootstrap Logic After Signup
//
// Called by the onboarding flow after org creation.
// Creates the workspace record, seeds the first mission + steps,
// and logs the workspace_created + first_mission_assigned activation events.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type Lane = "Idea" | "Offer" | "Customer" | "Systems";
type Stage = "Idea" | "Validate" | "Launch" | "Operate" | "Scale";

interface MissionSeed {
  title: string;
  description: string;
  steps: Array<{ title: string; description: string; tool_key: string | null }>;
}

const MISSION_SEEDS: Record<Lane, MissionSeed> = {
  Idea: {
    title: "Validate Your Idea",
    description:
      "Stress-test your concept before investing time and money. Nova will help you find the flaws and the opportunities.",
    steps: [
      {
        title: "Run the Idea Validator",
        description:
          "Get a structured 0–100 viability score with strengths, weaknesses, and risks.",
        tool_key: "idea-validator",
      },
      {
        title: "Kill My Idea (Devil's Advocate)",
        description: "Let Nova argue against your idea. If it survives this, it's worth pursuing.",
        tool_key: "kill-my-idea",
      },
      {
        title: "Define your one-sentence pitch",
        description:
          "Write the sentence you'd use to explain your idea to a busy investor in an elevator.",
        tool_key: null,
      },
    ],
  },
  Offer: {
    title: "Build Your Core Offer",
    description: "Define what you sell, who you sell it to, and why they should buy it today.",
    steps: [
      {
        title: "Build your Offer",
        description:
          "Nova will help you define your promise, deliverables, price point, and guarantee.",
        tool_key: "offer",
      },
      {
        title: "Create your GTM Strategy",
        description: "Map your go-to-market: target segment, channels, messaging, and 90-day plan.",
        tool_key: "gtm-strategy",
      },
      {
        title: "Write your core positioning sentence",
        description: "Complete: 'We help [ICP] achieve [outcome] without [pain] in [timeframe].'",
        tool_key: null,
      },
    ],
  },
  Customer: {
    title: "Land Your First 10 Customers",
    description:
      "Stop waiting for inbound. Nova will map a precision outreach plan to your first paying customers.",
    steps: [
      {
        title: "Generate First 10 Customers Plan",
        description:
          "Get a specific, actionable list of strategies to land 10 customers in 30 days.",
        tool_key: "first-10-customers",
      },
      {
        title: "Build Your Follow-Up Sequence",
        description:
          "Create a 5-step follow-up email sequence that converts cold leads to paying clients.",
        tool_key: "followup",
      },
      {
        title: "Send your first outreach message",
        description:
          "Pick one prospect and send the first message today. Track in your leads board.",
        tool_key: null,
      },
    ],
  },
  Systems: {
    title: "Launch Your GTM System",
    description: "Build the engine that generates customers without you being the bottleneck.",
    steps: [
      {
        title: "Create your GTM Strategy",
        description: "Document the full go-to-market strategy your team can execute without you.",
        tool_key: "gtm-strategy",
      },
      {
        title: "Build your Operations Plan",
        description: "Design the processes, automations, and team structure that run the business.",
        tool_key: "generate-ops-plan",
      },
      {
        title: "Identify your first automation candidate",
        description: "Pick one manual task happening 3× per week and spec it for automation.",
        tool_key: null,
      },
    ],
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Auth — accept both user JWT and service role key
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  // Use service role for DB writes so RLS insert-block policies don't interfere
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(supabaseUrl, serviceKey);

  // Verify the calling user is authenticated
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return json({ error: "Invalid token" }, 401);
  const userId = userData.user.id;

  let body: {
    organization_id: string;
    name?: string;
    lane?: Lane;
    stage?: Stage;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { organization_id, name, lane = "Idea", stage = "Idea" } = body;
  if (!organization_id) return json({ error: "organization_id is required" }, 400);

  // ── 1. Create workspace ────────────────────────────────────────────
  const workspaceName = name || "My Workspace";
  const { data: workspace, error: wsErr } = await adminClient
    .from("workspaces")
    .upsert(
      {
        organization_id,
        owner_id: userId,
        name: workspaceName,
        lane,
        stage,
      },
      { onConflict: "organization_id" },
    )
    .select("id")
    .single();

  if (wsErr) return json({ error: wsErr.message }, 500);
  const workspaceId = workspace.id as string;

  // ── 2. Seed first mission ──────────────────────────────────────────
  const seed = MISSION_SEEDS[lane];
  const { data: mission, error: mErr } = await adminClient
    .from("missions")
    .insert({
      workspace_id: workspaceId,
      title: seed.title,
      description: seed.description,
      lane,
      status: "active",
      sort_order: 0,
    })
    .select("id")
    .single();

  if (mErr) return json({ error: mErr.message }, 500);
  const missionId = mission.id as string;

  // ── 3. Seed mission steps ──────────────────────────────────────────
  const stepRows = seed.steps.map((s, i) => ({
    mission_id: missionId,
    title: s.title,
    description: s.description,
    tool_key: s.tool_key,
    sort_order: i,
    status: "pending",
  }));
  const { error: stepsErr } = await adminClient.from("mission_steps").insert(stepRows);
  if (stepsErr) return json({ error: stepsErr.message }, 500);

  // ── 4. Set workspace.current_mission_id ───────────────────────────
  await adminClient
    .from("workspaces")
    .update({ current_mission_id: missionId })
    .eq("id", workspaceId);

  // ── 5. Log activation events ───────────────────────────────────────
  await adminClient.from("activation_events").insert([
    {
      user_id: userId,
      workspace_id: workspaceId,
      event_name: "workspace_created",
      properties: { organization_id, lane, stage },
    },
    {
      user_id: userId,
      workspace_id: workspaceId,
      event_name: "first_mission_assigned",
      properties: { mission_id: missionId, mission_title: seed.title, lane },
    },
  ]);

  return json({
    workspace_id: workspaceId,
    mission_id: missionId,
    lane,
    mission_title: seed.title,
  });
});
