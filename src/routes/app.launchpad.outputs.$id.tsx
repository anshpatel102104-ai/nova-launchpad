/**
 * FOUNDER CASEFILE — /app/launchpad/outputs/[id]
 *
 * Renders a saved tool_run as the master-build 3-layer casefile:
 *   Layer 1 — dark command header (case id, verdict, scores, stage chips)
 *   Layer 2 — key content (verdict, Nova's take, recommended move, mentor bridge)
 *   Layer 3 — expandable detail (strengths, what needs proof, risks, next missions)
 *   Right rail — score breakdown, saved-to-memory, case metadata
 * A light format mapper adapts the header label per tool family. Reads the
 * tool_run output defensively so any tool renders. Additive: the interactive
 * runner at /app/launchpad/$tool is untouched.
 */
import { useMemo, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, Sparkles, Target, ShieldAlert, CheckCircle2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatLabel, verdictCategory, pickScore, type VerdictCategory } from "@/lib/casefile";

export const Route = createFileRoute("/app/launchpad/outputs/$id")({ component: CasefilePage });

type ToolRun = {
  id: string;
  tool_key: string;
  title: string | null;
  status: string;
  output: Record<string, unknown> | null;
  model: string | null;
  created_at: string;
};

const STAGES = ["Clarify", "Validate", "Build", "Launch", "Operate", "Scale"];

const TONE_CLASSES: Record<VerdictCategory, { badge: string; card: string }> = {
  danger: { badge: "bg-[--danger-light] text-[--danger] border-red-100", card: "border-l-[--danger] bg-[--danger-light]" },
  success: { badge: "bg-[--success-light] text-[--success] border-green-100", card: "border-l-[--success] bg-[--success-light]" },
  warning: { badge: "bg-[--warning-light] text-[--warning] border-amber-100", card: "border-l-[--warning] bg-[--warning-light]" },
  neutral: { badge: "bg-[--accent-light] text-[--accent] border-violet-200", card: "border-l-[--accent] bg-[--accent-light]" },
};

function verdictTone(v: string): { badge: string; card: string } {
  return TONE_CLASSES[verdictCategory(v)];
}

function asArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => (typeof x === "string" ? x : ((x as { label?: string; text?: string })?.label ?? (x as { text?: string })?.text ?? JSON.stringify(x))));
  return [];
}

type NextAction = { type?: string; label?: string; reason?: string; target?: string };

function CasefilePage() {
  const { id } = useParams({ from: "/app/launchpad/outputs/$id" });
  const runQ = useQuery({
    queryKey: ["tool_run", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tool_runs")
        .select("id, tool_key, title, status, output, model, created_at")
        .eq("id", id)
        .maybeSingle();
      return (data as ToolRun) ?? null;
    },
  });

  const run = runQ.data;
  const out = (run?.output ?? {}) as Record<string, unknown>;

  const score = useMemo(() => pickScore(out), [out]);
  const verdict = String(out.verdict ?? "").trim();
  const tone = verdictTone(verdict || "review");
  const scores = (out.scores && typeof out.scores === "object" ? out.scores : {}) as Record<string, number>;
  const strengths = asArray(out.strengths ?? out.confirmed_strengths);
  const proof = asArray(out.weaknesses ?? out.reasons_to_fail ?? out.what_needs_proof ?? out.risks);
  const nextActions = (Array.isArray(out.recommended_next_actions) ? out.recommended_next_actions : []) as NextAction[];
  const novaTake = String(out.rationale ?? out.recommendation ?? out.fatal_flaw ?? out.summary ?? out.full_report ?? "").slice(0, 900);
  const recommendation = String(out.recommendation ?? out.next_step ?? "").slice(0, 400);

  if (runQ.isLoading) {
    return (
      <div className="min-h-full bg-[--bg-page] p-6">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="h-40 animate-pulse rounded-2xl bg-[--bg-surface-2]" />
          <div className="h-64 animate-pulse rounded-2xl bg-[--bg-surface-2]" />
        </div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[--bg-page] p-6">
        <div className="rounded-2xl border border-[--border] bg-[--bg-surface] p-8 text-center">
          <p className="text-sm font-semibold text-[--text-primary]">Casefile not found</p>
          <Link to="/app/launchpad/history" className="mt-2 inline-block text-xs font-semibold text-[--accent] hover:underline">
            ← Back to Outputs
          </Link>
        </div>
      </div>
    );
  }

  const topDims = Object.entries(scores).slice(0, 4);

  return (
    <div className="min-h-full bg-[--bg-page] pb-12">
      {/* ── LAYER 1: Command header (dark) ── */}
      <div className="bg-[--bg-command] px-4 py-6 text-[--text-inverse] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link to="/app/launchpad/history" className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Outputs
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-[#b9a4ff]">
                {formatLabel(run.tool_key)} · CASE {run.id.slice(0, 8)}
              </p>
              <h1 className="mt-1 text-[22px] font-bold tracking-[-0.025em]">
                {run.title || run.tool_key.replace(/-/g, " ")}
              </h1>
              <p className="mt-0.5 text-xs text-white/50">
                {new Date(run.created_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                {run.model ? ` · ${run.model}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {verdict && (
                <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${tone.badge}`}>{verdict}</span>
              )}
              {score != null && (
                <div className="rounded-xl bg-white/10 px-4 py-2 text-center">
                  <p className="text-2xl font-bold leading-none">{score}</p>
                  <p className="text-[10px] uppercase tracking-wider text-white/50">score</p>
                </div>
              )}
            </div>
          </div>

          {/* Stage chips */}
          <div className="mt-5 flex flex-wrap gap-1.5">
            {STAGES.map((s, i) => (
              <span
                key={s}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                  i === 1 ? "bg-[#6B46E8] text-white" : "bg-white/5 text-white/40"
                }`}
              >
                {s}
              </span>
            ))}
          </div>

          {/* Score cards */}
          {topDims.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {topDims.map(([k, v]) => (
                <div key={k} className="rounded-xl bg-[--bg-command-2] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-white/40">{k.replace(/_/g, " ")}</p>
                  <p className="mt-1 text-lg font-bold">{v}<span className="text-xs text-white/40">/10</span></p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── LAYER 2 + rail ── */}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.7fr_1fr]">
          <div className="space-y-4">
            {/* Verdict card */}
            {(verdict || recommendation) && (
              <div className={`rounded-2xl border border-[--border] border-l-4 bg-[--bg-surface] p-5 shadow-sm ${tone.card}`}>
                <p className="text-xs font-semibold uppercase tracking-wider text-[--text-muted]">Verdict</p>
                <p className="mt-1 text-[17px] font-semibold text-[--text-primary]">{verdict || "Assessment complete"}</p>
                {recommendation && <p className="mt-1.5 text-sm leading-relaxed text-[--text-secondary]">{recommendation}</p>}
              </div>
            )}

            {/* Nova's Take */}
            {novaTake && (
              <div className="rounded-2xl border border-[--border] border-l-4 border-l-[--accent] bg-[--bg-surface] p-5 shadow-sm">
                <div className="mb-1 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[--accent]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[--accent]">Nova's Take</span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[--text-primary]">{novaTake}</p>
              </div>
            )}

            {/* Recommended move */}
            {nextActions.length > 0 && (
              <div className="rounded-2xl border border-[--border] bg-[--bg-surface] p-5 shadow-sm">
                <div className="mb-2 flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-[--accent]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[--text-muted]">Recommended Move</span>
                </div>
                <div className="space-y-2">
                  {nextActions.slice(0, 3).map((a, i) => (
                    <div key={i} className="rounded-xl border border-[--border] bg-[--bg-surface-2] p-3">
                      <p className="text-sm font-semibold text-[--text-primary]">{a.label}</p>
                      {a.reason && <p className="mt-0.5 text-xs leading-relaxed text-[--text-muted]">{a.reason}</p>}
                      {a.type === "tool" && a.target && (
                        <Link
                          to="/app/launchpad/$tool"
                          params={{ tool: a.target }}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[--accent] hover:underline"
                        >
                          Run this tool <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mentor bridge */}
            <div className="flex items-center justify-between rounded-2xl border border-[--border] bg-[--accent-light] p-4">
              <p className="text-sm text-[--text-primary]">Want a second opinion on this?</p>
              <Link to="/app/launchpad/mentors" className="text-sm font-semibold text-[--accent] hover:underline">
                Ask a mentor →
              </Link>
            </div>

            {/* ── LAYER 3: expandable detail ── */}
            {strengths.length > 0 && (
              <Drawer title="Confirmed Strengths" icon={<CheckCircle2 className="h-4 w-4 text-[--success]" />} count={strengths.length}>
                <ul className="space-y-2">
                  {strengths.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-[--text-secondary]">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[--success]" />
                      {s}
                    </li>
                  ))}
                </ul>
              </Drawer>
            )}
            {proof.length > 0 && (
              <Drawer title="What Needs Proof" icon={<ShieldAlert className="h-4 w-4 text-[--warning]" />} count={proof.length}>
                <ul className="space-y-2">
                  {proof.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-[--text-secondary]">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[--warning]" />
                      {s}
                    </li>
                  ))}
                </ul>
              </Drawer>
            )}
          </div>

          {/* Right rail */}
          <div className="space-y-4">
            {Object.keys(scores).length > 0 && (
              <div className="rounded-2xl border border-[--border] bg-[--bg-surface] p-5 shadow-sm">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[--text-muted]">Score Breakdown</p>
                <div className="space-y-2.5">
                  {Object.entries(scores).map(([k, v]) => (
                    <div key={k}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-[--text-secondary]">{k.replace(/_/g, " ")}</span>
                        <span className="font-semibold text-[--text-primary]">{v}/10</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[--bg-surface-2]">
                        <div
                          className="h-full rounded-full bg-[--accent] transition-all duration-700"
                          style={{ width: `${Math.max(0, Math.min(100, (Number(v) / 10) * 100))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-[--border] bg-[--bg-surface] p-5 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[--text-muted]">Case Metadata</p>
              <dl className="space-y-2 text-xs">
                {[
                  ["Case ID", run.id.slice(0, 8)],
                  ["Tool", run.tool_key],
                  ["Model", run.model ?? "—"],
                  ["Status", run.status],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <dt className="text-[--text-muted]">{k}</dt>
                    <dd className="truncate font-mono text-[--text-secondary]">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-2xl border border-[--border] bg-[--bg-surface] p-5 shadow-sm">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[--text-muted]">Saved to Memory</p>
              <div className="flex items-center gap-2 text-sm text-[--text-secondary]">
                <span className="h-2 w-2 rounded-full bg-[--success]" />
                This output is indexed in your Nova memory.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Drawer({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="overflow-hidden rounded-2xl border border-[--border] bg-[--bg-surface] shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-5 py-3.5 text-left hover:bg-[--bg-surface-2]"
      >
        {icon}
        <span className="text-sm font-semibold text-[--text-primary]">{title}</span>
        <span className="rounded-full bg-[--bg-surface-2] px-2 py-0.5 text-xs font-semibold text-[--text-muted]">{count}</span>
        <ChevronDown className={`ml-auto h-4 w-4 text-[--text-muted] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-[--border] px-5 py-4">{children}</div>}
    </div>
  );
}
