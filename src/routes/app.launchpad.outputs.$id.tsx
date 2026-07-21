/**
 * FOUNDER CASEFILE — /app/launchpad/outputs/[id]
 *
 * Routes a saved tool_run to a layout by its output_shape (score_verdict,
 * comparison, report, memo, plan_with_steps, pipeline_snapshot,
 * session_summary). output_shape is authoritative from the DB; if a row
 * predates the column we derive it from tool_key, and if it's still unknown
 * we fall back to MemoLayout AND log a console warning so unwired tools get
 * surfaced instead of silently blobbed.
 *
 * Layout components live in components/launchpad/casefile-layouts.tsx. The
 * interactive runner at /app/launchpad/$tool is untouched.
 */
import { useMemo, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdge } from "@/lib/invokeEdge";
import { useAuth } from "@/lib/auth";
import {
  deriveOutputShape,
  formatLabel,
  readCore,
  type OutputShape,
  type CasefileRun,
} from "@/lib/casefile";
import {
  ScoreVerdictLayout,
  ReportLayout,
  MemoLayout,
  ComparisonLayout,
  PlanWithStepsLayout,
  PipelineSnapshotLayout,
  SessionSummaryLayout,
} from "@/components/launchpad/casefile-layouts";

// Offer/GTM analyses are the ones worth turning into a pipeline deal (Connection 2).
const DEAL_TOOLS = new Set([
  "generate-offer",
  "positioning",
  "generate-gtm-strategy",
  "gtm-strategy-builder",
  "generate-pitch",
]);

const SHAPES: OutputShape[] = [
  "score_verdict",
  "comparison",
  "report",
  "memo",
  "plan_with_steps",
  "pipeline_snapshot",
  "session_summary",
];

export const Route = createFileRoute("/app/launchpad/outputs/$id")({ component: CasefilePage });

function CasefilePage() {
  const { id } = useParams({ from: "/app/launchpad/outputs/$id" });
  const { currentOrgId } = useAuth();
  const runQ = useQuery({
    queryKey: ["tool_run", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tool_runs")
        .select("id, tool_key, title, status, output, output_shape, model, created_at")
        .eq("id", id)
        .maybeSingle();
      return (data as CasefileRun) ?? null;
    },
  });

  const run = runQ.data;

  // Resolve the render shape: DB column → tool_key derivation → fallback.
  const shape = useMemo<OutputShape>(() => {
    if (!run) return "memo";
    const dbShape = run.output_shape as OutputShape | null | undefined;
    if (dbShape && SHAPES.includes(dbShape)) return dbShape;
    const derived = deriveOutputShape(run.tool_key);
    if (derived) return derived;
    // Unwired tool — surface it rather than silently defaulting to memo.
    console.warn(
      `[Casefile] No output_shape for tool "${run.tool_key}" (run ${run.id}); falling back to MemoLayout.`,
    );
    return "memo";
  }, [run]);

  const core = useMemo(() => (run ? readCore(run) : null), [run]);

  if (runQ.isLoading) {
    return (
      <div className="min-h-full bg-[--background] p-6">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="h-40 animate-pulse rounded-2xl bg-[--surface-2]" />
          <div className="h-64 animate-pulse rounded-2xl bg-[--surface-2]" />
        </div>
      </div>
    );
  }

  if (!run || !core) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[--background] p-6">
        <div className="rounded-2xl border border-[--border] bg-[--surface] p-8 text-center">
          <p className="text-sm font-semibold text-[--foreground]">Casefile not found</p>
          <Link
            to="/app/launchpad/history"
            className="mt-2 inline-block text-xs font-semibold text-[--accent] hover:underline"
          >
            ← Back to Outputs
          </Link>
        </div>
      </div>
    );
  }

  // Founder-analysis shapes can spin up a pipeline deal from the analysis.
  const dealExtra =
    DEAL_TOOLS.has(run.tool_key) && currentOrgId ? (
      <CreateDealCard run={run} recommendation={core.recommendation} orgId={currentOrgId} />
    ) : undefined;

  switch (shape) {
    case "score_verdict":
      return <ScoreVerdictLayout run={run} core={core} extra={dealExtra} />;
    case "comparison":
      return <ComparisonLayout run={run} core={core} extra={dealExtra} />;
    case "report":
      return <ReportLayout run={run} core={core} extra={dealExtra} />;
    case "plan_with_steps":
      return <PlanWithStepsLayout run={run} core={core} extra={dealExtra} />;
    case "pipeline_snapshot":
      return <PipelineSnapshotLayout run={run} core={core} />;
    case "session_summary":
      return <SessionSummaryLayout run={run} core={core} />;
    case "memo":
    default:
      return <MemoLayout run={run} core={core} extra={dealExtra} />;
  }
}

function CreateDealCard({
  run,
  recommendation,
  orgId,
}: {
  run: CasefileRun;
  recommendation: string;
  orgId: string;
}) {
  const [dealState, setDealState] = useState<"idle" | "creating" | "done">("idle");
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[--border] bg-[--surface] p-4 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-[--foreground]">Turn this into a deal</p>
        <p className="text-xs text-[--text-faint]">
          Start a pipeline opportunity from this analysis.
        </p>
      </div>
      {dealState === "done" ? (
        <Link to="/app/nova/crm" className="text-sm font-semibold text-[--success] hover:underline">
          Deal created — view pipeline →
        </Link>
      ) : (
        <button
          onClick={async () => {
            setDealState("creating");
            // create_lead (not a raw insert) so the deal is wired to a deduped
            // contact + company and logged on the CRM timeline.
            try {
              await invokeEdge("crm-action", {
                action: "create_lead",
                org_id: orgId,
                payload: {
                  name: run.title || `${formatLabel(run.tool_key)} lead`,
                  stage: "New",
                  source: "casefile",
                  notes:
                    `Created from ${formatLabel(run.tool_key)} (case ${run.id.slice(0, 8)}). ${recommendation}`.slice(
                      0,
                      500,
                    ),
                },
              });
              setDealState("done");
            } catch {
              setDealState("idle");
            }
          }}
          disabled={dealState === "creating"}
          className="rounded-xl bg-[--accent] px-4 py-2 text-sm font-semibold text-white hover:bg-[--primary-hover] disabled:opacity-50"
        >
          {dealState === "creating" ? "Creating…" : "Create Deal"}
        </button>
      )}
    </div>
  );
}
