// crm-action — executes Nova AI CRM commands directly (stage updates, note
// logging, task creation, contact creation). The caller's org membership is
// verified, then writes happen with the service-role client so they succeed
// across CRM tables. Self-contained single file.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.45.0";

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

const VALID_STAGES = new Set(["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"]);
const VALID_PRIORITY = new Set(["low", "medium", "high"]);
const VALID_TASK_TYPE = new Set(["task", "call", "email", "follow_up", "meeting"]);

type Result = { ok: boolean; result?: Record<string, unknown>; error?: string };

async function updateStage(
  admin: SupabaseClient,
  orgId: string,
  userId: string,
  p: Record<string, unknown>,
): Promise<Result> {
  const leadId = String(p.lead_id ?? "");
  const stage = String(p.stage ?? "");
  if (!leadId || !VALID_STAGES.has(stage)) return { ok: false, error: "Invalid lead_id or stage" };
  const { data: lead, error } = await admin
    .from("leads")
    .update({
      stage,
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", leadId)
    .eq("organization_id", orgId)
    .select("id, name, stage")
    .maybeSingle();
  if (error || !lead) return { ok: false, error: error?.message ?? "Lead not found" };
  await admin.from("crm_activities").insert({
    organization_id: orgId,
    deal_id: leadId,
    user_id: userId,
    type: "stage_change",
    content: `Nova moved this lead to ${stage}`,
    metadata: { source: "crm_action" },
  });
  return { ok: true, result: lead };
}

async function logNote(
  admin: SupabaseClient,
  orgId: string,
  userId: string,
  p: Record<string, unknown>,
): Promise<Result> {
  const leadId = String(p.lead_id ?? "");
  const note = String(p.note ?? "").trim();
  if (!leadId || !note) return { ok: false, error: "Invalid lead_id or note" };
  const { data: lead } = await admin
    .from("leads")
    .select("id")
    .eq("id", leadId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!lead) return { ok: false, error: "Lead not found" };
  const { data, error } = await admin
    .from("crm_activities")
    .insert({
      organization_id: orgId,
      deal_id: leadId,
      user_id: userId,
      type: "note",
      content: note,
      metadata: { source: "crm_action" },
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  await admin
    .from("leads")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", leadId)
    .eq("organization_id", orgId);
  return { ok: true, result: { activity_id: data.id } };
}

async function createTask(
  admin: SupabaseClient,
  orgId: string,
  userId: string,
  p: Record<string, unknown>,
): Promise<Result> {
  const title = String(p.title ?? "").trim();
  if (!title) return { ok: false, error: "Missing task title" };
  const priority = VALID_PRIORITY.has(String(p.priority)) ? String(p.priority) : "medium";
  const taskType = VALID_TASK_TYPE.has(String(p.task_type)) ? String(p.task_type) : "task";
  const { data, error } = await admin
    .from("tasks")
    .insert({
      organization_id: orgId,
      created_by: userId,
      title,
      description: p.description ? String(p.description) : null,
      contact_id: p.contact_id ? String(p.contact_id) : null,
      lead_id: p.lead_id ? String(p.lead_id) : null,
      assigned_to: p.assigned_to ? String(p.assigned_to) : null,
      due_date: p.due_date ? String(p.due_date) : null,
      priority,
      task_type: taskType,
    })
    .select("id, title, status, due_date")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, result: data };
}

async function createContact(
  admin: SupabaseClient,
  orgId: string,
  userId: string,
  p: Record<string, unknown>,
): Promise<Result> {
  const firstName = String(p.first_name ?? "").trim();
  const lastName = String(p.last_name ?? "").trim();
  const email = p.email ? String(p.email).trim() : null;
  if (!firstName && !lastName && !email) {
    return { ok: false, error: "Provide at least a name or email" };
  }
  // contacts uses org_id (not organization_id) and carries user_id.
  const { data, error } = await admin
    .from("contacts")
    .insert({
      org_id: orgId,
      user_id: userId,
      first_name: firstName || null,
      last_name: lastName || null,
      email,
      phone: p.phone ? String(p.phone) : null,
      company: p.company ? String(p.company) : null,
      source: p.source ? String(p.source) : "nova",
      tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
    })
    .select("id, first_name, last_name, email")
    .single();
  if (error) return { ok: false, error: error.message };
  // nova_events "contact.created" is emitted by the AFTER INSERT trigger on
  // public.contacts (migration 20260719000001), which covers every insert path.
  return { ok: true, result: data };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing auth" }, 401);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return json({ error: "Unauthorized" }, 401);

  let body: { action?: string; org_id?: string; payload?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const action = body.action ?? "";
  const payload = body.payload ?? {};

  // Resolve + verify org membership.
  let orgId = body.org_id ?? null;
  if (orgId) {
    const { data: m } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("organization_id", orgId)
      .maybeSingle();
    if (!m) return json({ error: "Forbidden" }, 403);
  } else {
    const { data: m } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!m) return json({ error: "No organization" }, 403);
    orgId = m.organization_id as string;
  }

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey) return json({ error: "Server not configured" }, 503);
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);

  let res: Result;
  switch (action) {
    case "update_stage":
      res = await updateStage(admin, orgId, user.id, payload);
      break;
    case "log_note":
      res = await logNote(admin, orgId, user.id, payload);
      break;
    case "create_task":
      res = await createTask(admin, orgId, user.id, payload);
      break;
    case "create_contact":
      res = await createContact(admin, orgId, user.id, payload);
      break;
    default:
      return json({ error: `Unknown action: ${action}` }, 400);
  }

  if (!res.ok) return json({ error: res.error }, 400);

  // Best-effort audit row for the supported enum actions.
  if (action === "update_stage" || action === "log_note") {
    await admin
      .from("nova_actions")
      .insert({
        organization_id: orgId,
        user_id: user.id,
        action_type: action === "update_stage" ? "update_lead_stage" : "log_crm_note",
        payload,
        plain_english: action === "update_stage" ? "Updated lead stage" : "Logged a CRM note",
        confirmation_required: false,
        status: "executed",
        result: res.result ?? {},
        executed_at: new Date().toISOString(),
      })
      .then(
        () => {},
        () => {},
      );
  }

  return json({ ok: true, action, result: res.result });
});
