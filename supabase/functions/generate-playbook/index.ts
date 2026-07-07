// generate-playbook — turns an accepted Investment Assessment into a
// personalized curriculum.
//
// POST { run_id }
//   1. Verify the caller belongs to the org that owns the tool_run, and that
//      the run's output format is score-verdict (the only acceptable trigger).
//   2. Read the org's business context (model, goal, timeline, stage, idea).
//   3. Classify the business model, build the ordered lesson set for it, and
//      delegate every lesson to its mentor (stage + output format).
//   4. Replace any existing playbook for the org and persist the lessons.
//
// The founder never sees tool keys — lessons carry plain-language titles and
// a first-person summary in the assigned mentor's voice.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  buildLessons,
  classifyBusinessModel,
  isAcceptableCasefile,
  STAGE_ORDER,
  type Stage,
} from "../_shared/curriculum.ts";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json({ error: "Service not configured" }, 503);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

  let body: { run_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const runId = String(body.run_id ?? "").trim();
  if (!runId) return json({ error: "run_id is required" }, 400);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return json({ error: "Invalid token" }, 401);
  const userId = userData.user.id;

  const admin = createClient(supabaseUrl, serviceKey);

  // ── The accepted casefile ──────────────────────────────────────────────
  const { data: run, error: runErr } = await admin
    .from("tool_runs")
    .select("id, organization_id, tool_key, status")
    .eq("id", runId)
    .maybeSingle();
  if (runErr || !run) return json({ error: "Casefile not found" }, 404);

  const orgId = run.organization_id as string;

  const { data: member } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!member) return json({ error: "Not a member of this organization" }, 403);

  if (!isAcceptableCasefile(run.tool_key as string)) {
    return json(
      {
        error: "Only an accepted Investment Assessment can start a curriculum",
        code: "NOT_ACCEPTABLE",
      },
      400,
    );
  }

  // ── Business context → model + stage ──────────────────────────────────
  const [{ data: ctx }, { data: org }] = await Promise.all([
    admin
      .from("business_context")
      .select("identity, goals")
      .eq("organization_id", orgId)
      .maybeSingle(),
    admin
      .from("organizations")
      .select("stage, niche, goal, description")
      .eq("id", orgId)
      .maybeSingle(),
  ]);

  const identity = (ctx?.identity ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");

  const model = classifyBusinessModel({
    monetization: str(identity.monetization) || str(identity.service_model),
    industry: str(identity.industry),
    idea: str(identity.idea) || str(org?.description),
    niche: str(identity.niche) || str(org?.niche),
  });

  const rawStage = str(org?.stage);
  const stage: Stage = (STAGE_ORDER as string[]).includes(rawStage)
    ? (rawStage as Stage)
    : "Validate";

  // ── Replace any existing playbook (one curriculum per org) ────────────
  await admin.from("playbooks").delete().eq("organization_id", orgId);

  const { data: playbook, error: pbErr } = await admin
    .from("playbooks")
    .insert({
      organization_id: orgId,
      casefile_run_id: run.id,
      business_model: model,
      stage,
    })
    .select()
    .single();
  if (pbErr || !playbook) {
    return json({ error: "Failed to create playbook", details: pbErr?.message }, 500);
  }

  const lessons = buildLessons(model, stage).map((l) => ({
    playbook_id: playbook.id,
    organization_id: orgId,
    mentor_id: l.mentorId,
    stage: l.stage,
    title: l.title,
    tool_key: l.toolKey,
    output_format: l.outputFormat,
    status: l.status,
    position: l.position,
    summary: l.summary,
  }));

  const { error: lessonErr } = await admin.from("playbook_lessons").insert(lessons);
  if (lessonErr) {
    await admin.from("playbooks").delete().eq("id", playbook.id);
    return json({ error: "Failed to create lessons", details: lessonErr.message }, 500);
  }

  // Best-effort activation event; never blocks the response.
  await admin
    .from("activation_events")
    .insert({
      user_id: userId,
      organization_id: orgId,
      event_type: "playbook_generated",
      properties: { business_model: model, stage, lesson_count: lessons.length },
    })
    .then(
      () => {},
      () => {},
    );

  return json({
    playbook_id: playbook.id,
    business_model: model,
    stage,
    lesson_count: lessons.length,
  });
});
