// Data access for published automation templates (the "publish & target who
// it's for" layer on top of the Builder). Mirrors the conventions in
// src/lib/queries.ts: react-query option factories + thin async mutations,
// using an `any`-typed client because these tables post-date the generated
// Supabase types.

import { supabase } from "@/integrations/supabase/client";
import type { WorkflowBlock } from "./automation-blocks";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type AudienceScope = "self" | "client" | "all_clients" | "marketplace";

export const AUDIENCE_META: Record<
  AudienceScope,
  { label: string; short: string; description: string }
> = {
  self: {
    label: "Just me",
    short: "Private",
    description: "A private template only your workspace can install and run.",
  },
  client: {
    label: "A specific client",
    short: "Client",
    description: "Publish this for one client you manage. It's tagged to their record.",
  },
  all_clients: {
    label: "All my clients",
    short: "All clients",
    description: "Roll this out to every client your agency manages.",
  },
  marketplace: {
    label: "Marketplace (everyone)",
    short: "Marketplace",
    description: "Share publicly so any other operator can install it.",
  },
};

export interface AutomationTemplate {
  id: string;
  organization_id: string;
  created_by: string | null;
  name: string;
  description: string;
  category: string;
  icon: string;
  blocks: WorkflowBlock[];
  trigger_summary: string;
  audience_scope: AudienceScope;
  target_contact_id: string | null;
  target_label: string | null;
  tags: string[];
  status: "draft" | "published" | "archived";
  install_count: number;
  is_featured: boolean;
  source_workflow_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublishTemplateInput {
  organization_id: string;
  created_by: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  blocks: WorkflowBlock[];
  trigger_summary: string;
  audience_scope: AudienceScope;
  target_contact_id?: string | null;
  target_label?: string | null;
  tags?: string[];
  source_workflow_id?: string | null;
}

export async function publishTemplate(input: PublishTemplateInput): Promise<AutomationTemplate> {
  const row = {
    organization_id: input.organization_id,
    created_by: input.created_by,
    name: input.name,
    description: input.description,
    category: input.category,
    icon: input.icon ?? "workflow",
    blocks: JSON.parse(JSON.stringify(input.blocks)),
    trigger_summary: input.trigger_summary,
    audience_scope: input.audience_scope,
    target_contact_id: input.target_contact_id ?? null,
    target_label: input.target_label ?? null,
    tags: input.tags ?? [],
    status: "published" as const,
    source_workflow_id: input.source_workflow_id ?? null,
  };
  const { data, error } = await db.from("automation_templates").insert(row).select("*").single();
  if (error) throw error;
  return data as AutomationTemplate;
}

/** Templates owned by this org (any audience scope). */
export function myTemplatesQuery(orgId: string) {
  return {
    queryKey: ["automation_templates", "mine", orgId],
    queryFn: async (): Promise<AutomationTemplate[]> => {
      const { data, error } = await db
        .from("automation_templates")
        .select("*")
        .eq("organization_id", orgId)
        .neq("status", "archived")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AutomationTemplate[];
    },
  };
}

/** Publicly-published marketplace templates (visible to every org). */
export function marketplaceTemplatesQuery() {
  return {
    queryKey: ["automation_templates", "marketplace"],
    queryFn: async (): Promise<AutomationTemplate[]> => {
      const { data, error } = await db
        .from("automation_templates")
        .select("*")
        .eq("audience_scope", "marketplace")
        .eq("status", "published")
        .order("install_count", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as AutomationTemplate[];
    },
  };
}

/** Contacts the operator manages — powers the "publish for a specific client" picker. */
export function clientContactsQuery(userId: string) {
  return {
    queryKey: ["client_contacts", userId],
    queryFn: async (): Promise<
      Array<{
        id: string;
        first_name: string | null;
        last_name: string | null;
        company: string | null;
        email: string | null;
      }>
    > => {
      const { data } = await db
        .from("contacts")
        .select("id, first_name, last_name, company, email")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(500);
      return (data ?? []) as Array<{
        id: string;
        first_name: string | null;
        last_name: string | null;
        company: string | null;
        email: string | null;
      }>;
    },
  };
}

/** Record an install (and bump the template's install_count via SECURITY DEFINER RPC). */
export async function installTemplate(
  templateId: string,
  orgId: string,
  targetContactId?: string | null,
): Promise<void> {
  const { error } = await db.rpc("install_automation_template", {
    _template_id: templateId,
    _organization_id: orgId,
    _target_contact: targetContactId ?? null,
  });
  if (error) throw error;
}

export async function archiveTemplate(id: string): Promise<void> {
  const { error } = await db
    .from("automation_templates")
    .update({ status: "archived" })
    .eq("id", id);
  if (error) throw error;
}
