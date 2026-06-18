// Nova Research — grounded, idea-specific research that powers playbook steps.
//
// Primary path: the `nova-research` edge function (Perplexity Sonar web search
// when PERPLEXITY_API_KEY is set, Claude otherwise). It returns a compact,
// structured brief tied to the founder's actual business.
//
// The frontend always degrades gracefully: if the edge function isn't
// available yet, we fall back to the `operator` function (deployed, returns
// clean JSON), and finally to a deterministic, context-aware brief — so the
// guidance panel never errors out.

import { supabase } from "@/integrations/supabase/client";

export interface ResearchSource {
  title: string;
  url: string;
}

export interface NovaResearchResult {
  /** 1–2 sentence read on the situation for THIS step. */
  summary: string;
  /** Grounded findings — what the research surfaced. */
  insights: string[];
  /** The single decision/next action Nova recommends. */
  recommendation: string;
  /** Web sources, when the research was web-grounded. */
  sources: ResearchSource[];
  /** True when backed by live web search (Perplexity). */
  grounded: boolean;
}

export interface ResearchInput {
  /** The founder's business idea / description. */
  idea: string;
  /** What this step is researching, e.g. "competitors and their weak spots". */
  focus: string;
  niche?: string;
  targetCustomer?: string;
  stage?: string;
  /** The founder's primary goal — keeps research pointed at what matters. */
  goal?: string;
  orgId?: string;
}

function clampList(v: unknown, max = 5): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, max);
}

function parseSources(v: unknown): ResearchSource[] {
  if (!Array.isArray(v)) return [];
  const out: ResearchSource[] = [];
  for (const s of v) {
    if (typeof s === "string") {
      out.push({ title: s, url: s });
    } else if (s && typeof s === "object") {
      const o = s as Record<string, unknown>;
      const url = typeof o.url === "string" ? o.url : "";
      if (url) out.push({ title: typeof o.title === "string" ? o.title : url, url });
    }
  }
  return out.slice(0, 6);
}

/** Extract a JSON object from a possibly-fenced model string. */
function extractJson(raw: string): Record<string, unknown> | null {
  const cleaned = raw
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function normalize(obj: Record<string, unknown>, grounded: boolean): NovaResearchResult | null {
  const recommendation = typeof obj.recommendation === "string" ? obj.recommendation.trim() : "";
  const summary = typeof obj.summary === "string" ? obj.summary.trim() : "";
  const insights = clampList(obj.insights);
  if (!recommendation && !summary && insights.length === 0) return null;
  return {
    summary: summary || recommendation,
    insights,
    recommendation: recommendation || summary,
    sources: parseSources(obj.sources),
    grounded,
  };
}

function localFallback(input: ResearchInput): NovaResearchResult {
  const idea = input.idea?.trim() || "your business";
  return {
    summary: `Here's how I'd approach ${input.focus} for ${idea}.`,
    insights: [
      `Start narrow: look at ${input.focus} specifically for ${input.targetCustomer || "your exact buyer"}, not the whole market.`,
      input.goal
        ? `Keep it tied to your goal — ${input.goal}.`
        : "Keep it tied to landing real customers, not theory.",
      "Capture what you learn so the next step builds on it instead of starting over.",
    ],
    recommendation: `Run this step now and feed in ${idea}. I'll use the result to set up the next move.`,
    sources: [],
    grounded: false,
  };
}

const RESEARCH_PROMPT = (
  input: ResearchInput,
) => `You are Nova, an AI cofounder doing fast, practical research for a founder.

THE BUSINESS: ${input.idea}
${input.niche ? `NICHE: ${input.niche}\n` : ""}${input.targetCustomer ? `TARGET CUSTOMER: ${input.targetCustomer}\n` : ""}${input.stage ? `STAGE: ${input.stage}\n` : ""}${input.goal ? `FOUNDER'S PRIMARY GOAL: ${input.goal}\n` : ""}
RESEARCH FOCUS: ${input.focus}

Research the focus area for THIS specific business. Be concrete and specific to them — no generic startup advice. Return ONLY a JSON object (no markdown, no code fences):
{
  "summary": "1-2 sentences on what you found for this exact business",
  "insights": ["specific finding 1", "specific finding 2", "specific finding 3"],
  "recommendation": "the single most important decision or next action, in one sentence",
  "sources": [{"title": "source name", "url": "https://..."}]
}
If you don't have web sources, return an empty sources array.`;

/**
 * Run grounded research for a playbook step. Never throws — always resolves to
 * a usable brief (web-grounded when possible, deterministic as a last resort).
 */
export async function runNovaResearch(input: ResearchInput): Promise<NovaResearchResult> {
  // 1) Primary: the dedicated research function (Perplexity / Claude).
  try {
    const { data, error } = await supabase.functions.invoke("nova-research", {
      body: {
        idea: input.idea,
        focus: input.focus,
        niche: input.niche,
        target_customer: input.targetCustomer,
        stage: input.stage,
        goal: input.goal,
        org_id: input.orgId,
      },
    });
    if (!error && data && typeof data === "object") {
      const d = data as Record<string, unknown>;
      // The function already returns a normalized shape.
      const normalized = normalize(d, d.grounded === true);
      if (normalized) return normalized;
      // Or a raw model string under `content`.
      if (typeof d.content === "string") {
        const parsed = extractJson(d.content);
        if (parsed) {
          const n = normalize(parsed, d.grounded === true);
          if (n) return n;
        }
      }
    }
  } catch {
    /* fall through */
  }

  // 2) Fallback: the operator function (deployed, returns { reply }).
  try {
    const { data, error } = await supabase.functions.invoke("operator", {
      body: { message: RESEARCH_PROMPT(input), org_id: input.orgId },
    });
    if (!error && data && typeof data === "object") {
      const reply = (data as Record<string, unknown>).reply;
      if (typeof reply === "string") {
        const parsed = extractJson(reply);
        if (parsed) {
          const n = normalize(parsed, false);
          if (n) return n;
        }
        // Unstructured but real AI text — use it as the recommendation.
        if (reply.trim().length > 0) {
          return {
            summary: reply.trim().slice(0, 280),
            insights: [],
            recommendation: reply.trim(),
            sources: [],
            grounded: false,
          };
        }
      }
    }
  } catch {
    /* fall through */
  }

  // 3) Last resort: deterministic, context-aware brief.
  return localFallback(input);
}
