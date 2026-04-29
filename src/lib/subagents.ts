/**
 * Nova OPS · Launchpad Subagent Client
 * ────────────────────────────────────────────────────────────────────
 * Thin typed wrappers around the 6 n8n subagent webhooks. Each call:
 *   1. POSTs JSON to {N8N_BASE_URL}/webhook/<path>
 *   2. Forwards the user's Supabase access token (so n8n can verify identity)
 *   3. Surfaces 403 → upgrade flow, 4xx → toast, 5xx → retry-once + toast
 *
 * Webhooks live in /n8n/subagents/*.json — keep paths in sync.
 */

const N8N_BASE_URL =
  (import.meta as { env?: { VITE_N8N_BASE_URL?: string } }).env
    ?.VITE_N8N_BASE_URL ?? '/api/n8n';

// ─── Shared types ───────────────────────────────────────────────────────────

export type SubagentError = {
  success: false;
  error: string;
  code?: string;
  status?: number;
  upgrade_url?: string | null;
  upsell_message?: string | null;
};

export type SubagentSuccess<T> = {
  success: true;
  data: T;
  status: number;
};

export type SubagentResult<T> = SubagentSuccess<T> | SubagentError;

// ─── Core fetch helper ──────────────────────────────────────────────────────

type CallOpts = {
  path: string;
  body: Record<string, unknown>;
  accessToken?: string;
};

async function callSubagent<T>(opts: CallOpts): Promise<SubagentResult<T>> {
  const url = `${N8N_BASE_URL}/webhook/${opts.path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (opts.accessToken) {
    headers.Authorization = `Bearer ${opts.accessToken}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(opts.body),
    });
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Network error',
      code: 'NETWORK_ERROR',
    };
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return {
      success: false,
      status: res.status,
      error: `Invalid JSON from subagent (HTTP ${res.status})`,
      code: 'INVALID_RESPONSE',
    };
  }

  // n8n subagents return { success: false, error, code, upgrade_url? } on block
  if (!res.ok || (typeof json === 'object' && json && (json as { success?: boolean }).success === false)) {
    const body = (json ?? {}) as Partial<SubagentError>;
    return {
      success: false,
      status: res.status,
      error: body.error ?? `HTTP ${res.status}`,
      code: body.code,
      upgrade_url: body.upgrade_url ?? null,
      upsell_message: body.upsell_message ?? null,
    };
  }

  return {
    success: true,
    status: res.status,
    data: json as T,
  };
}

// ─── 1. Brand Voice ─────────────────────────────────────────────────────────

export type BrandVoiceInput = {
  user_id: string;
  raw_intake: string;
  niche?: string;
  company_name?: string;
  writing_samples?: string[];
};

export type BrandVoiceOutput = {
  brand_voice: {
    tone: string;
    writing_style: string;
    vocabulary_dos: string[];
    vocabulary_donts: string[];
    signature_phrases: string[];
    audience: string;
    value_props: string[];
    niche: string;
    company_name: string;
    summary: string;
  };
};

export const callBrandVoice = (input: BrandVoiceInput, accessToken?: string) =>
  callSubagent<BrandVoiceOutput>({
    path: 'brand-voice-subagent',
    body: input,
    accessToken,
  });

// ─── 2. Blog Content ────────────────────────────────────────────────────────

export type BlogContentInput = {
  user_id: string;
  topic: string;
  primary_keyword?: string;
  target_audience?: string;
  word_count?: number;
};

export type BlogContentOutput = {
  content_id: string;
  title: string;
  slug: string;
  meta_description: string;
  body_markdown: string;
  primary_keyword: string;
  secondary_keywords: string[];
  cta: string;
  reading_time_minutes: number;
};

export const callBlogContent = (input: BlogContentInput, accessToken?: string) =>
  callSubagent<BlogContentOutput>({
    path: 'content-subagent-blog',
    body: input,
    accessToken,
  });

// ─── 3. Social ──────────────────────────────────────────────────────────────

export type Platform = 'linkedin' | 'twitter' | 'instagram' | 'facebook' | 'tiktok';

export type SocialInput = {
  user_id: string;
  topic: string;
  platforms: Platform[];
  cta?: string;
};

export type SocialPost = {
  platform: Platform;
  post_text: string;
  hashtags: string[];
  suggested_image_prompt: string | null;
  char_count: number;
  hook: string;
  cta: string;
  content_id?: string;
};

export type SocialOutput = { posts: SocialPost[] };

export const callSocial = (input: SocialInput, accessToken?: string) =>
  callSubagent<SocialOutput>({
    path: 'social-subagent',
    body: input,
    accessToken,
  });

// ─── 4. Sales Script ────────────────────────────────────────────────────────

export type SalesScriptType =
  | 'cold_call'
  | 'discovery_call'
  | 'closing_call'
  | 'objection_handling'
  | 'voicemail'
  | 'follow_up';

export type SalesScriptInput = {
  user_id: string;
  script_type: SalesScriptType;
  scenario_notes?: string;
};

export type SalesScriptOutput = {
  script_id: string;
  script_title: string;
  script_type: SalesScriptType;
  objective: string;
  opener: string;
  discovery_questions: string[];
  consequence_questions: string[];
  qualifying_questions: string[];
  transition_to_solution: string;
  value_pitch: string;
  objection_responses: { objection: string; response: string }[];
  close: string;
  next_step: string;
  estimated_call_minutes: number;
};

export const callSalesScript = (input: SalesScriptInput, accessToken?: string) =>
  callSubagent<SalesScriptOutput>({
    path: 'sales-script-subagent',
    body: input,
    accessToken,
  });

// ─── 5. Client Reporting ────────────────────────────────────────────────────

export type ClientReportInput = {
  user_id: string;
  client_id: string;
  period_start: string; // ISO date
  period_end: string; // ISO date
  period_label?: string;
};

export type ClientReportOutput = {
  report_id: string;
  subject_line: string;
  executive_summary: string;
  markdown_payload: string;
  pdf_url: string | null;
  wins: string[];
  challenges: string[];
  next_period_focus: string[];
  kpi_callouts: {
    metric: string;
    value: number;
    delta_vs_prev: string;
    commentary: string;
  }[];
};

export const callClientReport = (
  input: ClientReportInput,
  accessToken?: string,
) =>
  callSubagent<ClientReportOutput>({
    path: 'client-reporting-subagent',
    body: input,
    accessToken,
  });

// ─── 6. Automation Builder (Growth $149+ / Scale $299) ─────────────────────

export type AutomationBuilderInput = {
  user_id: string;
  process_description: string;
  integrations?: string[];
};

export type AutomationBuilderOutput = {
  draft_id: string;
  node_count: number;
  was_retry: boolean;
  workflow_json: Record<string, unknown>;
};

export const callAutomationBuilder = (
  input: AutomationBuilderInput,
  accessToken?: string,
) =>
  callSubagent<AutomationBuilderOutput>({
    path: 'automation-builder-subagent',
    body: input,
    accessToken,
  });

// ─── Helper: route blocked plan-tier responses to upgrade ──────────────────

export function isPlanGateBlock(err: SubagentError): boolean {
  return err.code === 'PLAN_UPGRADE_REQUIRED' || err.status === 403;
}

export function getUpgradeUrl(err: SubagentError): string {
  return err.upgrade_url ?? '/upgrade';
}
