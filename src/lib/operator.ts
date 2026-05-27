/**
 * Nova OPS · Master Operator Client
 * ─────────────────────────────────────────────────────────────────────
 * All tool invocations route through POST /webhook/operator.
 * The operator handles intent routing, credit guard, QA, and DB writes.
 *
 * Replaces: subagents.ts + launchpadTools.ts (those files are kept for
 * backward compatibility but should not be called from new code).
 */

const N8N_BASE_URL =
  (import.meta as { env?: { VITE_N8N_BASE_URL?: string } }).env?.VITE_N8N_BASE_URL ?? "/api/n8n";

// ─── Operator state machine ──────────────────────────────────────────────────

export type OperatorState =
  | "idle"
  | "loading_context"
  | "awaiting_clarification"
  | "running_intake"
  | "running_strategy"
  | "running_specialist"
  | "output_ready"
  | "credit_insufficient"
  | "escalated"
  | "error";

// ─── Response envelope ───────────────────────────────────────────────────────

export type OperatorError = {
  success: false;
  error: string;
  code?: string;
  status?: number;
  upgrade_url?: string | null;
  upsell_message?: string | null;
  credits_remaining?: number;
};

export type OperatorSuccess<T = unknown> = {
  success: true;
  status: "success";
  tool_slug: string;
  formatted_output: string;
  raw_output: T;
  credits_used: number;
  credits_remaining: number;
  session_id: string;
  qa_score: number;
  timestamp: string;
};

export type OperatorResult<T = unknown> = OperatorSuccess<T> | OperatorError;

// ─── Clarification response (not an error, not a final output) ───────────────

export type ClarificationResult = {
  success: true;
  status: "clarification_needed";
  question: string;
  session_id: string;
};

export type FullOperatorResult<T = unknown> = OperatorResult<T> | ClarificationResult;

// ─── Core fetch helper ───────────────────────────────────────────────────────

type CallOpts = {
  user_id: string;
  session_id?: string;
  tool_slug?: string;
  message?: string;
  params?: Record<string, unknown>;
  accessToken?: string;
};

async function callOperator<T = unknown>(opts: CallOpts): Promise<FullOperatorResult<T>> {
  const url = `${N8N_BASE_URL}/webhook/ai-operator-router`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (opts.accessToken) {
    headers.Authorization = `Bearer ${opts.accessToken}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        user_id: opts.user_id,
        session_id: opts.session_id,
        tool_slug: opts.tool_slug,
        message: opts.message,
        params: opts.params ?? {},
      }),
    });
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Network error",
      code: "NETWORK_ERROR",
    };
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return {
      success: false,
      status: res.status,
      error: `Invalid JSON from operator (HTTP ${res.status})`,
      code: "INVALID_RESPONSE",
    } as OperatorError;
  }

  const body = (json ?? {}) as Record<string, unknown>;

  if (!res.ok || body["success"] === false) {
    return {
      success: false,
      status: res.status,
      error: (body["error"] as string) ?? `HTTP ${res.status}`,
      code: body["code"] as string | undefined,
      upgrade_url: (body["upgrade_url"] as string | null) ?? null,
      upsell_message: (body["upsell_message"] as string | null) ?? null,
      credits_remaining: body["credits_remaining"] as number | undefined,
    };
  }

  if (body["status"] === "clarification_needed") {
    return {
      success: true,
      status: "clarification_needed",
      question: body["question"] as string,
      session_id: body["session_id"] as string,
    };
  }

  return {
    success: true,
    status: "success",
    tool_slug: body["tool_slug"] as string,
    formatted_output: body["formatted_output"] as string,
    raw_output: body["raw_output"] as T,
    credits_used: (body["credits_used"] as number) ?? 0,
    credits_remaining: (body["credits_remaining"] as number) ?? 0,
    session_id: body["session_id"] as string,
    qa_score: (body["qa_score"] as number) ?? 0,
    timestamp: body["timestamp"] as string,
  };
}

// ─── Type guards ─────────────────────────────────────────────────────────────

export function isSuccess<T>(r: FullOperatorResult<T>): r is OperatorSuccess<T> {
  return r.success === true && (r as OperatorSuccess<T>).status === "success";
}

export function isClarification(r: FullOperatorResult): r is ClarificationResult {
  return r.success === true && (r as ClarificationResult).status === "clarification_needed";
}

export function isError(r: FullOperatorResult): r is OperatorError {
  return r.success === false;
}

export function isCreditBlock(r: FullOperatorResult): boolean {
  return (
    isError(r) &&
    ((r as OperatorError).code === "CREDIT_INSUFFICIENT" || (r as OperatorError).status === 402)
  );
}

export function isPlanGateBlock(r: FullOperatorResult): boolean {
  return (
    isError(r) &&
    ((r as OperatorError).code === "PLAN_UPGRADE_REQUIRED" || (r as OperatorError).status === 403)
  );
}

export function getUpgradeUrl(r: OperatorError): string {
  return r.upgrade_url ?? "/upgrade";
}

// ─── Intake ──────────────────────────────────────────────────────────────────

export type IntakeParams = {
  raw_input: string;
};

export const runIntake = (
  user_id: string,
  params: IntakeParams,
  accessToken?: string,
  session_id?: string,
) =>
  callOperator({
    user_id,
    session_id,
    tool_slug: "intake",
    params,
    accessToken,
  });

// ─── Strategy ────────────────────────────────────────────────────────────────

export type StrategyParams = {
  focus_areas?: Array<"icp" | "offer" | "pricing" | "gtm" | "niche">;
};

export const runStrategy = (
  user_id: string,
  params: StrategyParams = {},
  accessToken?: string,
  session_id?: string,
) =>
  callOperator({
    user_id,
    session_id,
    tool_slug: "strategy",
    params,
    accessToken,
  });

// ─── Content tools ───────────────────────────────────────────────────────────

export type Platform = "linkedin" | "twitter" | "instagram" | "facebook" | "tiktok";

export type BlogParams = { topic: string; primary_keyword?: string };
export type SocialParams = { topic: string; platform: Platform; cta?: string };
export type EmailSequenceParams = {
  sequence_type: "nurture" | "sales" | "onboarding" | "re-engagement";
  topic: string;
  email_count?: number;
};
export type SalesScriptParams = {
  script_type:
    | "cold_call"
    | "discovery"
    | "closing"
    | "objection_handling"
    | "voicemail"
    | "follow_up";
  scenario_notes?: string;
};
export type AdCreativeParams = {
  offer: string;
  audience_pain: string;
  platform: "meta" | "google" | "linkedin";
};
export type VslParams = { product_summary: string; length_minutes?: number };
export type LandingPageParams = {
  offer: string;
  audience_awareness:
    | "unaware"
    | "problem_aware"
    | "solution_aware"
    | "product_aware"
    | "most_aware";
  primary_cta: string;
};
export type ColdEmailParams = {
  icp: string;
  offer: string;
  sender_name: string;
  sender_company: string;
};

export const runBlog = (
  user_id: string,
  params: BlogParams,
  accessToken?: string,
  session_id?: string,
) => callOperator({ user_id, session_id, tool_slug: "blog", params, accessToken });

export const runSocial = (
  user_id: string,
  params: SocialParams,
  accessToken?: string,
  session_id?: string,
) => callOperator({ user_id, session_id, tool_slug: "social", params, accessToken });

export const runEmailSequence = (
  user_id: string,
  params: EmailSequenceParams,
  accessToken?: string,
  session_id?: string,
) => callOperator({ user_id, session_id, tool_slug: "email_sequence", params, accessToken });

export const runSalesScript = (
  user_id: string,
  params: SalesScriptParams,
  accessToken?: string,
  session_id?: string,
) => callOperator({ user_id, session_id, tool_slug: "sales_script", params, accessToken });

export const runAdCreative = (
  user_id: string,
  params: AdCreativeParams,
  accessToken?: string,
  session_id?: string,
) => callOperator({ user_id, session_id, tool_slug: "ad_creative", params, accessToken });

export const runVsl = (
  user_id: string,
  params: VslParams,
  accessToken?: string,
  session_id?: string,
) => callOperator({ user_id, session_id, tool_slug: "vsl", params, accessToken });

export const runLandingPage = (
  user_id: string,
  params: LandingPageParams,
  accessToken?: string,
  session_id?: string,
) => callOperator({ user_id, session_id, tool_slug: "landing_page", params, accessToken });

export const runColdEmail = (
  user_id: string,
  params: ColdEmailParams,
  accessToken?: string,
  session_id?: string,
) => callOperator({ user_id, session_id, tool_slug: "cold_email", params, accessToken });

// ─── Strategy sub-tools ──────────────────────────────────────────────────────

export type NicheValidatorParams = { niche_idea: string; geography?: string };
export type IcpParams = { niche: string; offer: string; current_customer_examples?: string };
export type OfferBuilderParams = {
  core_product: string;
  target_market: string;
  price_target?: number | string;
};
export type PricingParams = {
  business_model: string;
  offer_value_estimate: number | string;
  market_avg_price?: number | string;
};
export type PitchDeckParams = {
  company_name: string;
  problem: string;
  solution: string;
  traction?: string;
  ask_amount?: number | string;
  deck_type?: "seed" | "series_a" | "pre_seed";
};
export type LeadMagnetParams = {
  niche: string;
  icp_pain_point: string;
  format: "pdf_guide" | "checklist" | "template" | "video" | "email_course";
};

export const runNicheValidator = (
  user_id: string,
  params: NicheValidatorParams,
  accessToken?: string,
  session_id?: string,
) => callOperator({ user_id, session_id, tool_slug: "niche_validator", params, accessToken });

export const runIcpBuilder = (
  user_id: string,
  params: IcpParams,
  accessToken?: string,
  session_id?: string,
) => callOperator({ user_id, session_id, tool_slug: "icp", params, accessToken });

export const runOfferBuilder = (
  user_id: string,
  params: OfferBuilderParams,
  accessToken?: string,
  session_id?: string,
) => callOperator({ user_id, session_id, tool_slug: "offer", params, accessToken });

export const runPricingStrategist = (
  user_id: string,
  params: PricingParams,
  accessToken?: string,
  session_id?: string,
) => callOperator({ user_id, session_id, tool_slug: "pricing", params, accessToken });

export const runPitchDeck = (
  user_id: string,
  params: PitchDeckParams,
  accessToken?: string,
  session_id?: string,
) => callOperator({ user_id, session_id, tool_slug: "pitch_deck", params, accessToken });

export const runLeadMagnet = (
  user_id: string,
  params: LeadMagnetParams,
  accessToken?: string,
  session_id?: string,
) => callOperator({ user_id, session_id, tool_slug: "lead_magnet", params, accessToken });

// ─── Automation ──────────────────────────────────────────────────────────────

export type AutomationParams = {
  process_description: string;
  integrations?: string[];
};

export const runAutomation = (
  user_id: string,
  params: AutomationParams,
  accessToken?: string,
  session_id?: string,
) => callOperator({ user_id, session_id, tool_slug: "automation", params, accessToken });

// ─── Client Reporting ────────────────────────────────────────────────────────

export type ClientReportParams = {
  client_id: string;
  period_start: string;
  period_end: string;
  period_label?: string;
};

export const runClientReport = (
  user_id: string,
  params: ClientReportParams,
  accessToken?: string,
  session_id?: string,
) => callOperator({ user_id, session_id, tool_slug: "client_report", params, accessToken });

// ─── Free-text operator message (for chat UI) ────────────────────────────────

export const sendMessage = (
  user_id: string,
  message: string,
  accessToken?: string,
  session_id?: string,
) => callOperator({ user_id, session_id, message, accessToken });

// ─── Credit cost reference (mirrors operator system prompt) ──────────────────

export const CREDIT_COSTS: Record<string, number> = {
  intake: 0,
  strategy: 20,
  blog: 10,
  social: 5,
  email_sequence: 12,
  sales_script: 8,
  ad_creative: 8,
  vsl: 15,
  landing_page: 10,
  cold_email: 12,
  automation: 25,
  client_report: 20,
  niche_validator: 20,
  icp: 20,
  offer: 20,
  pricing: 20,
  pitch_deck: 20,
  lead_magnet: 10,
};

// ─── Mentor Agent ─────────────────────────────────────────────────────────────
// Routes to the mentor-agent-dispatch n8n workflow via the standard operator proxy.

export type MentorAgentId =
  | "growth"
  | "offer"
  | "sales"
  | "content"
  | "automation"
  | "finance";

export type MentorAgentParams = {
  agent_id: MentorAgentId;
  message: string;
  org_id: string;
  /** Accumulated context injected into the system prompt so the agent knows the business state. */
  business_context?: string;
};

export type MentorAgentResult = {
  success: boolean;
  response?: string;
  agent_id?: string;
  session_id?: string;
  error?: string;
};

const MENTOR_N8N_PATH = "/webhook/mentor-agent";

export async function runMentorAgent(
  user_id: string,
  params: MentorAgentParams,
  accessToken?: string,
  session_id?: string,
): Promise<MentorAgentResult> {
  const N8N_BASE =
    (import.meta as { env?: { VITE_N8N_BASE_URL?: string } }).env?.VITE_N8N_BASE_URL ?? "/api/n8n";
  const url = `${N8N_BASE}${MENTOR_N8N_PATH}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ user_id, session_id, ...params }),
    });
    const json = (await res.json()) as MentorAgentResult;
    return json;
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Network error contacting mentor agent",
    };
  }
}

// Credit cost for mentor conversations (billed per exchange)
export const MENTOR_CREDIT_COST = 3;
