// NovaResearchPanel — the "perplexity research" surface for a playbook step.
//
// Nova researches the founder's ACTUAL business for the current step's focus
// (market, competitors, channels…) and surfaces a tight brief: what it found,
// and the single decision it recommends. Web-grounded via Perplexity when
// available, otherwise an AI brief — either way it stays specific to them.

import { useState, useRef } from "react";
import { Sparkles, Loader2, ExternalLink, Lightbulb, ArrowRight, Globe } from "lucide-react";
import { runNovaResearch, type NovaResearchResult, type ResearchInput } from "@/lib/research";

interface Props {
  stepId: string;
  focus: string;
  idea: string;
  goal?: string;
  niche?: string;
  targetCustomer?: string;
  stage?: string;
  orgId?: string;
}

export function NovaResearchPanel({
  stepId,
  focus,
  idea,
  goal,
  niche,
  targetCustomer,
  stage,
  orgId,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NovaResearchResult | null>(null);
  // Cache results per step so switching steps doesn't re-run (or re-bill) research.
  const cache = useRef<Record<string, NovaResearchResult>>({});

  // Adjust shown result when the step changes (keeps the cache). This is the
  // documented "adjust state during render" pattern, not an effect.
  const prevStep = useRef(stepId);
  if (prevStep.current !== stepId) {
    prevStep.current = stepId;
    setResult(cache.current[stepId] ?? null);
    setLoading(false);
  }

  const run = async () => {
    if (cache.current[stepId]) {
      setResult(cache.current[stepId]);
      return;
    }
    setLoading(true);
    const input: ResearchInput = { idea, focus, goal, niche, targetCustomer, stage, orgId };
    const res = await runNovaResearch(input);
    cache.current[stepId] = res;
    setResult(res);
    setLoading(false);
  };

  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: "color-mix(in oklab, var(--primary) 22%, var(--border))",
        background: "color-mix(in oklab, var(--primary) 4%, var(--surface))",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles style={{ width: 15, height: 15, color: "var(--primary)" }} />
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: "var(--primary)" }}
        >
          Nova research
        </span>
        {result?.grounded && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider"
            style={{
              background: "color-mix(in oklab, var(--primary) 12%, transparent)",
              color: "var(--primary)",
            }}
          >
            <Globe style={{ width: 9, height: 9 }} /> Web-grounded
          </span>
        )}
      </div>

      {!result && !loading && (
        <>
          <p
            className="text-[12.5px] leading-relaxed mb-3"
            style={{ color: "var(--muted-foreground)" }}
          >
            I'll research <span style={{ color: "var(--foreground)" }}>{focus}</span> for your
            business specifically — so this step is based on real signal, not guesswork.
          </p>
          <button
            onClick={run}
            disabled={!idea?.trim()}
            className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--primary)", color: "#fff" }}
          >
            <Sparkles style={{ width: 13, height: 13 }} />
            {idea?.trim() ? "Research this for my business" : "Add your idea to enable research"}
          </button>
        </>
      )}

      {loading && (
        <div
          className="flex items-center gap-2 py-2 text-[12.5px]"
          style={{ color: "var(--muted-foreground)" }}
        >
          <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} />
          Researching {focus} for your business…
        </div>
      )}

      {result && !loading && (
        <div className="space-y-3">
          {result.summary && (
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--foreground)" }}>
              {result.summary}
            </p>
          )}

          {result.insights.length > 0 && (
            <div className="space-y-1.5">
              {result.insights.map((ins, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-[12.5px]"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <Lightbulb
                    style={{
                      width: 13,
                      height: 13,
                      marginTop: 2,
                      flexShrink: 0,
                      color: "var(--primary)",
                    }}
                  />
                  <span>{ins}</span>
                </div>
              ))}
            </div>
          )}

          {result.recommendation && (
            <div
              className="rounded-lg p-3 flex items-start gap-2"
              style={{
                background: "color-mix(in oklab, var(--primary) 8%, transparent)",
                border: "1px solid color-mix(in oklab, var(--primary) 20%, transparent)",
              }}
            >
              <ArrowRight
                style={{
                  width: 14,
                  height: 14,
                  marginTop: 1,
                  flexShrink: 0,
                  color: "var(--primary)",
                }}
              />
              <div>
                <div
                  className="text-[10px] font-semibold uppercase tracking-wider mb-0.5"
                  style={{ color: "var(--primary)" }}
                >
                  Nova recommends
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--foreground)" }}>
                  {result.recommendation}
                </p>
              </div>
            </div>
          )}

          {result.sources.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {result.sources.map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] transition-colors"
                  style={{
                    border: "1px solid var(--border)",
                    color: "var(--muted-foreground)",
                    background: "var(--surface)",
                  }}
                >
                  <ExternalLink style={{ width: 9, height: 9 }} />
                  {(() => {
                    try {
                      return new URL(s.url).hostname.replace("www.", "");
                    } catch {
                      return s.title.slice(0, 24);
                    }
                  })()}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
