/**
 * Nova Launchpad · Tool Workflow Client
 * ────────────────────────────────────────────────────────────────────
 * Thin typed wrappers around the 10 n8n LaunchPad tool webhooks.
 *
 * Each call:
 *   1. POSTs JSON to {N8N_BASE_URL}/webhook/v1/<path>
 *   2. Forwards the user's Supabase access token
 *   3. Returns a SubagentResult-shaped envelope so callers can share
 *      the same upgrade / toast handling as `subagents.ts`.
 *
 * Workflow JSONs live in /n8n/launchpad/*.json — keep paths in sync.
 */

import type { SubagentResult, SubagentError } from "@/lib/subagents";

const N8N_BASE_URL =
  (import.meta as { env?: { VITE_N8N_BASE_URL?: string } }).env?.VITE_N8N_BASE_URL ?? "/api/n8n";

type CallOpts = {
  path: string; // e.g. "v1/niche/validate"
  body: Record<string, unknown>;
  accessToken?: string;
};

async function callTool<T>(opts: CallOpts): Promise<SubagentResult<T>> {
  const url = `${N8N_BASE_URL}/webhook/${opts.path}`;
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
      body: JSON.stringify(opts.body),
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
      error: `Invalid JSON from launchpad tool (HTTP ${res.status})`,
      code: "INVALID_RESPONSE",
    };
  }

  if (
    !res.ok ||
    (typeof json === "object" && json && (json as { success?: boolean }).success === false)
  ) {
    const body = (json ?? {}) as Partial<SubagentError> & {
      upgrade_url?: string | null;
    };
    return {
      success: false,
      status: res.status,
      error: body.error ?? `HTTP ${res.status}`,
      code: body.code,
      upgrade_url: body.upgrade_url ?? null,
      upsell_message: body.upsell_message ?? null,
    };
  }

  return { success: true, status: res.status, data: json as T };
}

// ─── 01 · Ad Creative Generator ─────────────────────────────────────────────

export type AdCreativeInput = {
  user_id: string;
  offer: string;
  audience_pain: string;
  platform: "meta" | "google" | "tiktok" | "linkedin" | string;
  count?: number;
};
export type AdCreativeOutput = { success: true; ad_creatives: unknown };

export const callAdCreative = (input: AdCreativeInput, accessToken?: string) =>
  callTool<AdCreativeOutput>({
    path: "v1/ad-creative/generate",
    body: input,
    accessToken,
  });

// ─── 02 · Cold Email Sequencer ──────────────────────────────────────────────

export type ColdEmailInput = {
  user_id: string;
  icp: string;
  offer: string;
  sender_name: string;
  sender_company: string;
};
export type ColdEmailOutput = { success: true; sequence: unknown };

export const callColdEmail = (input: ColdEmailInput, accessToken?: string) =>
  callTool<ColdEmailOutput>({
    path: "v1/cold-email/sequence",
    body: input,
    accessToken,
  });

// ─── 03 · ICP Builder ───────────────────────────────────────────────────────

export type IcpInput = {
  user_id: string;
  niche: string;
  offer: string;
  current_customer_examples?: string;
};
export type IcpOutput = { success: true; icp: unknown };

export const callIcpBuilder = (input: IcpInput, accessToken?: string) =>
  callTool<IcpOutput>({
    path: "v1/icp/build",
    body: input,
    accessToken,
  });

// ─── 04 · Landing Page Copy ─────────────────────────────────────────────────

export type LandingCopyInput = {
  user_id: string;
  offer: string;
  audience_awareness:
    | "unaware"
    | "problem_aware"
    | "solution_aware"
    | "product_aware"
    | "most_aware"
    | string;
  primary_cta: string;
};
export type LandingCopyOutput = { success: true; landing_copy: unknown };

export const callLandingCopy = (input: LandingCopyInput, accessToken?: string) =>
  callTool<LandingCopyOutput>({
    path: "v1/landing-copy/generate",
    body: input,
    accessToken,
  });

// ─── 05 · Lead Magnet Builder ───────────────────────────────────────────────

export type LeadMagnetInput = {
  user_id: string;
  niche: string;
  icp_pain_point: string;
  format: "pdf_guide" | "checklist" | "template" | "video" | "email_course" | string;
};
export type LeadMagnetOutput = { success: true; lead_magnet: unknown };

export const callLeadMagnet = (input: LeadMagnetInput, accessToken?: string) =>
  callTool<LeadMagnetOutput>({
    path: "v1/lead-magnet/generate",
    body: input,
    accessToken,
  });

// ─── 06 · Niche Validator ───────────────────────────────────────────────────

export type NicheValidatorInput = {
  user_id: string;
  niche_idea: string;
  geography?: string;
};
export type NicheValidatorOutput = {
  success: true;
  validation: {
    niche_name: string;
    geography: string;
    market_size_estimate: unknown;
    competitors: unknown;
    pain_points: unknown;
    monetization_angles: unknown;
    viability_score: number;
    viability_category: string;
    score_reasoning: string;
    recommended_icp: unknown;
    recommended_offer_angle: string;
    key_opportunities: unknown;
    key_risks: unknown;
  };
};

export const callNicheValidator = (input: NicheValidatorInput, accessToken?: string) =>
  callTool<NicheValidatorOutput>({
    path: "v1/niche/validate",
    body: input,
    accessToken,
  });

// ─── 07 · Offer Builder ─────────────────────────────────────────────────────

export type OfferBuilderInput = {
  user_id: string;
  core_product: string;
  target_market: string;
  price_target?: number | string;
};
export type OfferBuilderOutput = { success: true; offer: unknown };

export const callOfferBuilder = (input: OfferBuilderInput, accessToken?: string) =>
  callTool<OfferBuilderOutput>({
    path: "v1/offer/build",
    body: input,
    accessToken,
  });

// ─── 08 · Pitch Deck Outliner ───────────────────────────────────────────────

export type PitchDeckInput = {
  user_id: string;
  company_name: string;
  problem: string;
  solution: string;
  traction?: string;
  ask_amount?: number | string;
  deck_type?: "seed" | "series_a" | "pre_seed" | string;
};
export type PitchDeckOutput = { success: true; pitch_deck: unknown };

export const callPitchDeck = (input: PitchDeckInput, accessToken?: string) =>
  callTool<PitchDeckOutput>({
    path: "v1/pitch-deck/outline",
    body: input,
    accessToken,
  });

// ─── 09 · Pricing Strategist ────────────────────────────────────────────────

export type PricingStrategistInput = {
  user_id: string;
  business_model: string;
  offer_value_estimate: number | string;
  market_avg_price?: number | string;
};
export type PricingStrategistOutput = { success: true; pricing: unknown };

export const callPricingStrategist = (input: PricingStrategistInput, accessToken?: string) =>
  callTool<PricingStrategistOutput>({
    path: "v1/pricing/strategy",
    body: input,
    accessToken,
  });

// ─── 10 · VSL Generator ─────────────────────────────────────────────────────

export type VslGeneratorInput = {
  user_id: string;
  product_summary: string;
  target_audience: string;
  length_minutes?: number;
  offer_id?: string;
};
export type VslGeneratorOutput = { success: true; vsl: unknown };

export const callVslGenerator = (input: VslGeneratorInput, accessToken?: string) =>
  callTool<VslGeneratorOutput>({
    path: "v1/vsl/generate",
    body: input,
    accessToken,
  });

// ─── Catalog ────────────────────────────────────────────────────────────────

export const LAUNCHPAD_TOOL_WEBHOOKS = {
  ad_creative: "v1/ad-creative/generate",
  cold_email: "v1/cold-email/sequence",
  icp: "v1/icp/build",
  landing_copy: "v1/landing-copy/generate",
  lead_magnet: "v1/lead-magnet/generate",
  niche_validator: "v1/niche/validate",
  offer: "v1/offer/build",
  pitch_deck: "v1/pitch-deck/outline",
  pricing: "v1/pricing/strategy",
  vsl: "v1/vsl/generate",
} as const;

export type LaunchpadToolKey = keyof typeof LAUNCHPAD_TOOL_WEBHOOKS;
