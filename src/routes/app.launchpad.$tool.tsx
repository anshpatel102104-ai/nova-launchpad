import { createFileRoute, Link, notFound, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { launchpadCatalog } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Loader2, FileText, Sparkles, ArrowLeft, ArrowRight, Lock, History as HistoryIcon,
  RotateCcw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { blockIfGuest } from "@/lib/guest";
import { toolRunsQuery, subscriptionQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { OutputBody, OutputHeader, copyText } from "@/components/app/OutputRenderer";
import { EmptyState } from "@/components/app/EmptyState";
import { HANDOFFS } from "@/lib/handoffs";
import { loadDraft, clearDraft, useDraftAutosave, formatSavedAgo } from "@/lib/draftStore";
import { PaywallModal } from "@/components/app/PaywallModal";

type Search = { context?: string; title?: string };

export const Route = createFileRoute("/app/launchpad/$tool")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    context: typeof s.context === "string" ? s.context : undefined,
    title: typeof s.title === "string" ? s.title : undefined,
  }),
  loader: ({ params }) => {
    const tool = launchpadCatalog.find((t) => t.key === params.tool);
    if (!tool) throw notFound();
    return { tool };
  },
  component: ToolPage,
  notFoundComponent: () => (
    <div className="p-6">
      <div className="text-sm">
        Unknown tool. <Link to="/app/launchpad" className="underline">Back to Launchpad</Link>
      </div>
    </div>
  ),
});

function ToolPage() {
  const { tool } = Route.useLoaderData();
  const search = useSearch({ from: "/app/launchpad/$tool" }) as Search;
  const { currentOrgId, user } = useAuth();
  const qc = useQueryClient();

  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<Record<string, unknown> | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [draftRestored, setDraftRestored] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const subQ = useQuery({ ...subscriptionQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const planTier = subQ.data?.plan ?? "starter";

  // Restore draft / handoff prefill — runs once per tool change
  useEffect(() => {
    setOutput(null);
    setRunId(null);
    setFeedback(null);
    setDraftRestored(false);
    if (search?.context || search?.title) {
      setTitle(search.title ?? "");
      setContext(search.context ?? "");
      return;
    }
    const draft = loadDraft(currentOrgId, tool.key);
    if (draft) {
      setTitle(draft.title ?? "");
      setContext(draft.context ?? "");
      if ((draft.title?.length ?? 0) + (draft.context?.length ?? 0) > 0) {
        setDraftRestored(true);
      }
    } else {
      setTitle("");
      setContext("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool.key, currentOrgId]);

  const savedAt = useDraftAutosave(currentOrgId, tool.key, { title, context });
  const savedLabel = draftRestored ? "Draft restored" : formatSavedAgo(savedAt);

  // Recent runs for this tool
  const runsQ = useQuery({
    ...toolRunsQuery(currentOrgId ?? "", 50),
    enabled: !!currentOrgId,
  });
  const toolRuns = useMemo(
    () => (runsQ.data ?? []).filter((r) => r.tool_key === tool.toolKey).slice(0, 6),
    [runsQ.data, tool.toolKey],
  );

  const handoffs = HANDOFFS[tool.key] ?? [];

  const handleGenerate = async () => {
    if (blockIfGuest("Sign up to run AI tools and unlock real outputs.")) return;
    if (!tool.wired) { toast.error("This tool is launching soon."); return; }
    if (!context.trim()) { toast.error("Add some context first."); return; }
    setGenerating(true);
    setOutput(null);
    setRunId(null);
    setFeedback(null);
    try {
      const payload: Record<string, unknown> = {
        idea: context, business: title || context, target: title,
        context, goal: context, offer: context, url: context,
      };
      const { data, error } = await supabase.functions.invoke(tool.toolKey, { body: payload });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setOutput(data.output);
      if (data?.run_id) setRunId(String(data.run_id));
      toast.success("Output ready");
      if (currentOrgId) {
        qc.invalidateQueries({ queryKey: ["tool_runs", currentOrgId] });
        qc.invalidateQueries({ queryKey: ["generated_assets", currentOrgId] });
        qc.invalidateQueries({ queryKey: ["usage", currentOrgId] });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const saveToAssets = async () => {
    if (blockIfGuest("Sign up to save assets to your library.")) return;
    if (!currentOrgId || !user || !output) return;
    const { error } = await supabase.from("generated_assets").insert([{
      organization_id: currentOrgId,
      user_id: user.id,
      category: tool.toolKey,
      kind: tool.key,
      title: title || tool.name,
      content: output as never,
    }]);
    if (error) toast.error(error.message);
    else {
      toast.success("Saved to library");
      qc.invalidateQueries({ queryKey: ["generated_assets", currentOrgId] });
    }
  };

  const sendFeedback = async (v: "up" | "down") => {
    setFeedback(v);
    if (!runId) return;
    try {
      await supabase
        .from("tool_runs")
        .update({ metadata: { feedback: v, feedback_at: new Date().toISOString() } })
        .eq("id", runId);
    } catch { /* non-blocking */ }
  };

  const handleCopy = () => {
    if (!output) return;
    copyText(JSON.stringify(output, null, 2));
  };

  const downloadJSON = () => {
    if (!output) return;
    const blob = new Blob([JSON.stringify(output, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(title || tool.name).replace(/\s+/g, "_")}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handoffHref = (h: { to: string }) => h.to;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <Link to="/app/launchpad" className="inline-flex items-center gap-1.5 hover:text-foreground transition">
            <ArrowLeft className="h-3 w-3" /> Launchpad
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-foreground">{tool.name}</span>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-[1.75rem] font-semibold tracking-tight">{tool.name}</h1>
            <p className="mt-1 max-w-2xl text-[13.5px] text-muted-foreground">{tool.desc}</p>
          </div>
          <div className="flex items-center gap-2">
            {!tool.wired ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-[11px] font-medium text-warning">
                <Lock className="h-3 w-3" /> Launching soon
              </span>
            ) : output ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> Output ready
              </span>
            ) : (savedLabel) ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60" /> {savedLabel}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* 60/40 workspace */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* LEFT — inputs (60%) */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-border bg-surface shadow-card">
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Inputs
              </div>
              {savedLabel && (
                <span className="text-[10.5px] text-muted-foreground">{savedLabel}</span>
              )}
            </div>

            <div className="space-y-5 px-5 py-5">
              <Section label="Identity" hint="Give this run a memorable name. Used as the asset title.">
                <Input
                  placeholder="e.g. Northwind Labs — initial launch"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-surface-2"
                />
              </Section>

              <Section label="Context" hint="Be specific about your idea, audience, and the outcome you want.">
                <Textarea
                  rows={9}
                  placeholder={placeholderFor(tool.key)}
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="bg-surface-2"
                />
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{context.length} characters</span>
                  {context && (
                    <button
                      type="button"
                      onClick={() => { setContext(""); setTitle(""); clearDraft(currentOrgId, tool.key); }}
                      className="inline-flex items-center gap-1 hover:text-foreground transition"
                    >
                      <RotateCcw className="h-3 w-3" /> Clear
                    </button>
                  )}
                </div>
              </Section>

              <Button
                onClick={handleGenerate}
                disabled={generating || !context || !tool.wired}
                className="w-full gap-2 h-11"
              >
                {generating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating with AI…</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Generate with AI</>
                )}
              </Button>
              {!tool.wired && (
                <p className="text-center text-[11.5px] text-muted-foreground">
                  This tool is launching soon. Inputs save as drafts.
                </p>
              )}
            </div>
          </div>

          {/* Recent runs */}
          {tool.wired && (
            <div className="mt-5 rounded-xl border border-border bg-surface shadow-card">
              <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  <HistoryIcon className="h-3 w-3" /> Recent runs
                </div>
                <Link to="/app/launchpad/history" className="text-[11px] text-muted-foreground hover:text-foreground transition">
                  See all →
                </Link>
              </div>
              {toolRuns.length === 0 ? (
                <div className="px-5 py-6 text-center text-[12.5px] text-muted-foreground">
                  No runs yet. Your first generation will appear here.
                </div>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {toolRuns.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        const out = (r.output ?? null) as Record<string, unknown> | null;
                        setOutput(out);
                        setRunId(r.id);
                        const meta = (r.metadata ?? {}) as Record<string, unknown>;
                        setFeedback(meta.feedback === "up" ? "up" : meta.feedback === "down" ? "down" : null);
                      }}
                      className="flex w-full items-center justify-between px-5 py-2.5 text-left transition hover:bg-surface-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-medium">
                          {(r.input as { business?: string; title?: string })?.business ||
                           (r.input as { title?: string })?.title ||
                           "Untitled run"}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {new Date(r.created_at).toLocaleString()} · {r.status}
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — output (40%) */}
        <div className="lg:col-span-2">
          <div className="sticky top-[72px] rounded-xl border border-border bg-surface shadow-card">
            <div className="px-5 py-4">
              <OutputHeader
                onCopy={output ? handleCopy : undefined}
                onDownload={output ? downloadJSON : undefined}
                onSave={output ? saveToAssets : undefined}
                onFeedback={output ? sendFeedback : undefined}
                feedback={feedback}
              />
            </div>

            <div className="px-5 pb-5">
              {!output && !generating && (
                <EmptyState
                  variant="inline"
                  icon={FileText}
                  title="No output yet"
                  description={
                    tool.wired
                      ? "Add context on the left, then generate to see your structured output here."
                      : "This tool is launching soon. Your inputs are auto-saved as a draft."
                  }
                  className="py-10"
                />
              )}

              {generating && (
                <div className="space-y-3 py-2 animate-pulse">
                  <div className="h-3 w-2/3 rounded bg-surface-2" />
                  <div className="h-3 w-full rounded bg-surface-2" />
                  <div className="h-3 w-5/6 rounded bg-surface-2" />
                  <div className="mt-4 h-20 w-full rounded-md bg-surface-2" />
                  <div className="h-3 w-3/4 rounded bg-surface-2" />
                  <div className="h-3 w-full rounded bg-surface-2" />
                </div>
              )}

              {output && !generating && (
                <div className="max-h-[68vh] overflow-y-auto pr-1">
                  <OutputBody toolKey={tool.toolKey || tool.key} output={output} />
                </div>
              )}
            </div>

            {/* Cross-tool handoffs */}
            {output && handoffs.length > 0 && (
              <div className="border-t border-border-subtle px-5 py-4">
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Continue with
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {handoffs.map((h) => (
                    <Link
                      key={h.to}
                      to={h.to}
                      search={
                        h.to.startsWith("/app/launchpad/")
                          ? ({ context, title } as never)
                          : undefined
                      }
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-[12px] font-medium text-foreground/85 transition",
                        "hover:border-primary/40 hover:bg-primary/10 hover:text-primary",
                      )}
                    >
                      {h.label} <ArrowRight className="h-3 w-3" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2">
        <div className="text-[12.5px] font-semibold text-foreground">{label}</div>
        {hint && <div className="text-[11.5px] text-muted-foreground">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function placeholderFor(key: string): string {
  switch (key) {
    case "idea-validator":
      return "Describe your idea, who it's for, and why now. Be specific — better context = sharper output.";
    case "pitch-generator":
      return "What does your business do? Who is it for? What's the wedge that makes it special?";
    case "gtm-strategy":
      return "Describe your offer, ICP, and what 'launched' looks like in 90 days.";
    case "offer":
      return "Describe the transformation you sell, the customer, and any current pricing.";
    case "ops-plan":
      return "What's your business model? Where are the operational bottlenecks today?";
    case "followup":
      return "Who is the lead? What did they show interest in? What outcome do you want?";
    case "website-audit":
      return "Paste your live URL and any context about who visits and what you want them to do.";
    default:
      return "Describe your business, audience, and goal. The more specific, the better the output.";
  }
}
