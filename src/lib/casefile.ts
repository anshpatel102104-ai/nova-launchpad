/**
 * Founder Casefile mapping helpers — pure so the tool → format and verdict →
 * tone mappings are unit-testable and stay consistent.
 */

export type VerdictCategory = "danger" | "success" | "warning" | "neutral";

/** Format label shown in the casefile command header, by tool family. */
export function formatLabel(toolKey: string): string {
  if (["validate-idea", "idea-validator", "kill-my-idea", "funding-readiness-score"].includes(toolKey))
    return "Investment Assessment";
  if (["generate-offer", "positioning", "persona-builder"].includes(toolKey)) return "Founder Review";
  if (["generate-gtm-strategy", "gtm-strategy-builder", "competitor-scanner", "research"].includes(toolKey))
    return "Viability Brief";
  if (["pricing-calculator", "decision"].includes(toolKey)) return "Decision Memo";
  return "Founder Casefile";
}

/** Classify a verdict string into a semantic tone. */
export function verdictCategory(v: string): VerdictCategory {
  const s = (v || "").toLowerCase();
  if (/(kill|lost|fail|no-go|reject)/.test(s)) return "danger";
  if (/(go|pass|won|strong|proceed|fundable|yes)/.test(s)) return "success";
  if (/(conditional|maybe|caution|revise|pivot)/.test(s)) return "warning";
  return "neutral";
}

/** Pick the headline score from a tool_run output, if any. */
export function pickScore(out: Record<string, unknown>): number | null {
  const n = out.total_score ?? out.viabilityScore ?? out.score ?? null;
  if (typeof n === "number") return n;
  if (n != null && !Number.isNaN(Number(n))) return Number(n);
  return null;
}
