// TASK-057 · Mission Progression Engine
// TASK-056 · First-mission assignment engine (referenced here; seeding in provision-workspace)
//
// Handles:
//   - Mark a mission step complete
//   - Complete the whole mission and assign next one
//   - Log 'mission_step_completed' and 'first_mission_completed' events

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

type Action = "complete_step" | "complete_mission" | "skip_step";

// Next missions to assign after the first one completes, by lane
const NEXT_MISSIONS: Record<string, Array<{ title: string; description: string; steps: Array<{ title: string; description: string; tool_key: string | null }> }>> = {
  Idea: [
    {
      title: "Build Your GTM Strategy",
      description: "You've validated the idea — now map the path to your first customer.",
      steps: [
        { title: "Create your GTM Strategy", description: "Define your go-to-market across segment, channel, and messaging.", tool_key: "gtm-strategy" },
        { title: "Generate your Pitch", description: "Build the pitch that gets investors and early customers excited.", tool_key: "pitch-generator" },
        { title: "Identify your ICP in one sentence", description: "Complete: '[Name] is a [role] who struggles with [pain] and wants [outcome].'", tool_key: null },
      ],
    },
  ],
  Offer: [
    {
      title: "Land Your First 10 Customers",
      description: "Offer is ready — now get people to pay for it.",
      steps: [
        { title: "Generate First 10 Customers Plan", description: "Precision outreach plan to land 10 customers in 30 days.", tool_key: "first-10-customers" },
        { title: "Build Follow-Up Sequence", description: "5-step sequence that turns cold leads into paying clients.", tool_key: "followup" },
        { title: "Send your first paid invoice", description: "Close deal #1 and issue the invoice. No tool needed — just do it.", tool_key: null },
      ],
    },
  ],
  Customer: [
    {
      title: "Build Your Revenue System",
      description: "You have customers — now make acquisition repeatable.",
      steps: [
        { title: "Create your GTM Strategy", description: "Document the full GTM your team can execute without you.", tool_key: "gtm-strategy" },
        { title: "Build your Operations Plan", description: "Design the processes and automations that run the business.", tool_key: "generate-ops-plan" },
        { title: "Define your referral loop", description: "Write the one mechanism that turns every customer into a referrer.", tool_key: null },
      ],
    },
  ],
  Systems: [
    {
      title: "Scale Your Content Engine",
      description: "Systems are running — now build the content flywheel.",
      steps: [
        { title: "Generate your GTM content strategy", description: "Map content types, cadence, and distribution channels.", tool_key: "gtm-strategy" },
        { title: "Build your pitch for partnerships", description: "Create a partnership pitch to accelerate distribution.", tool_key: "pitch-generator" },
        { title: "Document your first SOPs", description: "Write 3 core SOPs for tasks you repeat more than 3× per week.", tool_key: null },
      ],
    },
  ],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return json({ error: "Invalid token" }, 401);
  const userId = userData.user.id;

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  let body: { action: Action; step_id?: string; mission_id?: string; workspace_id?: string };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const { action, step_id, mission_id, workspace_id } = body;
  if (!action) return json({ error: "action is required" }, 400);

  // ── complete_step ──────────────────────────────────────────────────
  if (action === "complete_step") {
    if (!step_id) return json({ error: "step_id required for complete_step" }, 400);

    const { error } = await admin
      .from("mission_steps")
      .update({ status: "completed", completed_at: new Date().toISOString(), updated_by: userId })
      .eq("id", step_id);
    if (error) return json({ error: error.message }, 500);

    // Log activation event
    if (workspace_id) {
      await admin.from("activation_events").insert({
        user_id: userId,
        workspace_id,
        event_name: "mission_step_completed",
        properties: { step_id, mission_id },
      });
    }

    // Check if all steps are done → auto-complete the mission
    if (mission_id) {
      const { data: steps } = await admin
        .from("mission_steps")
        .select("status")
        .eq("mission_id", mission_id);

      const allDone = steps?.every((s) => s.status === "completed" || s.status === "skipped");
      if (allDone) {
        await admin
          .from("missions")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", mission_id);

        if (workspace_id) {
          await admin.from("activation_events").insert({
            user_id: userId,
            workspace_id,
            event_name: "first_mission_completed",
            properties: { mission_id },
          });
        }

        return json({ ok: true, step_completed: true, mission_auto_completed: true });
      }
    }

    return json({ ok: true, step_completed: true, mission_auto_completed: false });
  }

  // ── skip_step ─────────────────────────────────────────────────────
  if (action === "skip_step") {
    if (!step_id) return json({ error: "step_id required for skip_step" }, 400);
    const { error } = await admin
      .from("mission_steps")
      .update({ status: "skipped" })
      .eq("id", step_id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  // ── complete_mission ───────────────────────────────────────────────
  if (action === "complete_mission") {
    if (!mission_id || !workspace_id) {
      return json({ error: "mission_id and workspace_id required for complete_mission" }, 400);
    }

    // Mark mission done
    await admin
      .from("missions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", mission_id);

    // Determine workspace lane for next mission
    const { data: ws } = await admin
      .from("workspaces")
      .select("lane, id")
      .eq("id", workspace_id)
      .maybeSingle();

    const lane = (ws?.lane as string) ?? "Idea";
    const nextMissions = NEXT_MISSIONS[lane] ?? NEXT_MISSIONS["Idea"];

    // Find highest sort_order so far
    const { data: existingMissions } = await admin
      .from("missions")
      .select("sort_order")
      .eq("workspace_id", workspace_id)
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextOrder = ((existingMissions?.[0]?.sort_order as number) ?? 0) + 1;

    // Only assign if there are more missions defined
    let newMissionId: string | null = null;
    if (nextMissions[nextOrder - 1]) {
      const seed = nextMissions[nextOrder - 1];
      const { data: newMission } = await admin
        .from("missions")
        .insert({
          workspace_id,
          title: seed.title,
          description: seed.description,
          lane,
          status: "active",
          sort_order: nextOrder,
        })
        .select("id")
        .single();

      if (newMission) {
        newMissionId = newMission.id as string;
        const stepRows = seed.steps.map((s, i) => ({
          mission_id: newMissionId,
          title: s.title,
          description: s.description,
          tool_key: s.tool_key,
          sort_order: i,
          status: "pending",
        }));
        await admin.from("mission_steps").insert(stepRows);

        // Update workspace current_mission_id
        await admin
          .from("workspaces")
          .update({ current_mission_id: newMissionId })
          .eq("id", workspace_id);

        await admin.from("activation_events").insert([
          {
            user_id: userId,
            workspace_id,
            event_name: "first_mission_completed",
            properties: { mission_id, completed_at: new Date().toISOString() },
          },
          {
            user_id: userId,
            workspace_id,
            event_name: "first_mission_assigned",
            properties: { mission_id: newMissionId, mission_title: seed.title, lane },
          },
        ]);
      }
    }

    return json({ ok: true, mission_completed: true, next_mission_id: newMissionId });
  }

  return json({ error: `Unknown action: ${action}` }, 400);
});
