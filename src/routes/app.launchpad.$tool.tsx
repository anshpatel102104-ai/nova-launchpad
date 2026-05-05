import { createFileRoute, Link, notFound, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { launchpadCatalog } from "@/lib/mock";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  FileText,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Lock,
  History as HistoryIcon,
  RotateCcw,
  KeyRound,
} from "lucide-react";
import { NovaThinking } from "@/components/app/NovaThinking";
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
import { runToolLocally, hasLocalAiKey } from "@/lib/runToolLocally";
import { useOwnerMode } from "@/lib/ownerMode";

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
        Unknown tool.{" "}
        <Link to="/app/launchpad" className="underline">
          Back to Launchpad
        </Link>
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
  const [streamText, setStreamText] = useState("");
  const [output, setOutput] = useState<Record<string, unknown> | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [draftRestored, setDraftRestored] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const isOwner = useOwnerMode();
  const subQ = useQuery({ ...subscriptionQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const planTier = subQ.data?.plan ?? "starter";

  // Owner mode: treat every tool as wired and bypass all plan gates
  const effectiveWired = isOwner ? true : tool.wired;
  const effectiveToolKey = tool.toolKey || (isOwner ? tool.key : "");

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

  const runsQ = useQuery({ ...toolRunsQuery(currentOrgId ?? "", 50), enabled: !!currentOrgId });
  const toolRuns = useMemo(
    () => (runsQ.data ?? []).filter((r) => r.tool_key === effectiveToolKey).slice(0, 6),
    [runsQ.data, effectiveToolKey],
  );

  const handoffs = HANDOFFS[tool.key] ?? [];

  const ideaValidatorRuns = useMemo(
    () =>
      (runsQ.data ?? []).filter((r) => r.tool_key === "validate-idea" && r.status === "succeeded")
        .length,
    [runsQ.data],
  );
  const isFreeStarter = isOwner ? false : planTier === "starter";
  const isIdeaValidator = effectiveToolKey === "validate-idea";
  const ideaValidatorBlocked =
    !isOwner && isFreeStarter && isIdeaValidator && ideaValidatorRuns >= 3;
  const isPastDue = !isOwner && subQ.data?.status === "past_due";

  const handleGenerate = async () => {
    if (blockIfGuest("Sign up to run AI tools and unlock real outputs.")) return;
    if (!effectiveWired) {
      toast.error("This tool is launching soon.");
      return;
    }
    if (isPastDue) {
      toast.error("Payment failed — update your card in Billing to keep using AI tools.");
      return;
    }
    if (!context.trim()) {
      toast.error("Add some context first.");
      return;
    }
    if (!hasLocalAiKey()) {
      toast.error(
        "Add your Anthropic API key to VITE_ANTHROPIC_API_KEY in .env, then restart the dev server.",
      );
      return;
    }
    if (ideaValidatorBlocked) {
      setPaywallOpen(true);
      return;
    }
    setGenerating(true);
    setStreamText("");
    setOutput(null);
    setRunId(null);
    setFeedback(null);
    try {
      const payload: Record<string, unknown> = {
        idea: context,
        business: title || context,
        target: title,
        context,
        goal: context,
        offer: context,
        url: context,
      };
      const result = await runToolLocally(
        effectiveToolKey,
        payload,
        { orgId: currentOrgId, userId: user?.id },
        (chunk) => setStreamText((t) => t + chunk),
      );
      setStreamText("");
      setOutput(result.output);
      if (result.run_id) setRunId(result.run_id);
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
    const { error } = await supabase.from("generated_assets").insert([
      {
        organization_id: currentOrgId,
        user_id: user.id,
        category: tool.toolKey,
        kind: tool.key,
        title: title || tool.name,
        content: output as never,
      },
    ]);
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
    } catch {
      /* non-blocking */
    }
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

  return (
    <div className="space-y-6">
      <PaywallModal open={paywallOpen} onOpenChange={setPaywallOpen} />

      {/* Missing API key banner */}
      {!hasLocalAiKey() && (
        <div
          className="flex items-start gap-3 rounded-2xl p-4"
          style={{
            background: "color-mix(in oklab, var(--warning) 8%, var(--surface))",
            border: "1px solid color-mix(in oklab, var(--warning) 30%, transparent)",
          }}
        >
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--warning)" }} />
          <div>
            <div className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>
              Anthropic API key required
            </div>
            <p
              className="mt-0.5 text-[12.5px] leading-relaxed"
              style={{ color: "var(--muted-foreground)" }}
            >
              Add{" "}
              <code
                className="rounded px-1 py-0.5 font-mono text-[11.5px]"
                style={{ background: "var(--surface-2)" }}
              >
                VITE_ANTHROPIC_API_KEY=sk-ant-...
              </code>{" "}
              to your{" "}
              <code
                className="rounded px-1 py-0.5 font-mono text-[11.5px]"
                style={{ background: "var(--surface-2)" }}
              >
                .env
              </code>{" "}
              file and restart the dev server. Get a key at{" "}
              <span className="font-medium" style={{ color: "var(--primary)" }}>
                console.anthropic.com
              </span>
              .
            </p>
          </div>
        </div>
      )}

      {/* Breadcrumb + header */}
      <div className="flex flex-col gap-3">
        <div
          className="flex items-center gap-2 text-[12px]"
          style={{ color: "var(--muted-foreground)" }}
        >
          <Link
            to="/app/launchpad"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Launchpad
          </Link>
          <span style={{ opacity: 0.4 }}>/</span>
          <span style={{ color: "var(--foreground)" }}>{tool.name}</span>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h1
              className="font-display text-[1.75rem] font-semibold tracking-tight"
              style={{ color: "var(--foreground)" }}
            >
              {tool.name}
            </h1>
            <p
              className="mt-1 max-w-2xl text-[13.5px] leading-relaxed"
              style={{ color: "var(--muted-foreground)" }}
            >
              {tool.desc}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!effectiveWired ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={{
                  background: "color-mix(in oklab, var(--warning) 12%, transparent)",
                  border: "1px solid color-mix(in oklab, var(--warning) 30%, transparent)",
                  color: "var(--warning)",
                }}
              >
                <Lock className="h-3 w-3" /> Launching soon
              </span>
            ) : output ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={{
                  background: "color-mix(in oklab, var(--success) 12%, transparent)",
                  border: "1px solid color-mix(in oklab, var(--success) 30%, transparent)",
                  color: "var(--success)",
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" /> Output ready
              </span>
            ) : savedLabel ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--muted-foreground)",
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "color-mix(in oklab, var(--primary) 60%, transparent)" }}
                />
                {savedLabel}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* 60/40 workspace */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* LEFT — inputs */}
        <div className="lg:col-span-3 space-y-4">
          <div
            className="overflow-hidden rounded-2xl"
            style={{
              background: "var(--surface)",
              border: "1px solid rgba(59,130,246,0.15)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(59,130,246,0.05)",
            }}
          >
            {/* Neon top edge */}
            <div
              className="h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(59,130,246,0.5), rgba(139,92,246,0.3), transparent)",
              }}
            />
            {/* Panel header */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{
                borderBottom: "1px solid rgba(59,130,246,0.1)",
                background: "rgba(59,130,246,0.03)",
              }}
            >
              <div
                className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: "var(--muted-foreground)" }}
              >
                Inputs
              </div>
              {savedLabel && (
                <span className="text-[10.5px]" style={{ color: "var(--muted-foreground)" }}>
                  {savedLabel}
                </span>
              )}
            </div>

            <div className="space-y-5 px-5 py-5">
              <Section
                label="Identity"
                hint="Give this run a memorable name. Used as the asset title."
              >
                <Input
                  placeholder="e.g. Northwind Labs — initial launch"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-xl"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                  }}
                />
              </Section>

              <Section
                label="Context"
                hint="Be specific about your idea, audience, and the outcome you want."
              >
                <Textarea
                  rows={9}
                  placeholder={placeholderFor(tool.key)}
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="rounded-xl resize-none"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                  }}
                />
                <div
                  className="mt-1.5 flex items-center justify-between text-[11px]"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <span>{context.length} characters</span>
                  {context && (
                    <button
                      type="button"
                      onClick={() => {
                        setContext("");
                        setTitle("");
                        clearDraft(currentOrgId, tool.key);
                      }}
                      className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                    >
                      <RotateCcw className="h-3 w-3" /> Clear
                    </button>
                  )}
                </div>
              </Section>

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={generating || !context || !effectiveWired}
                className={cn(
                  "relative w-full h-11 rounded-xl text-[13.5px] font-semibold transition-all duration-200",
                  "flex items-center justify-center gap-2 overflow-hidden",
                  (generating || !context || !effectiveWired) && "opacity-50 cursor-not-allowed",
                )}
                style={{
                  background: "linear-gradient(135deg, var(--primary), var(--accent))",
                  color: "white",
                  boxShadow:
                    "0 4px 20px color-mix(in oklab, var(--primary) 35%, transparent), inset 0 1px 0 rgba(255,255,255,0.15)",
                }}
                onMouseEnter={(e) => {
                  if (!generating && context && effectiveWired) {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "0 6px 24px color-mix(in oklab, var(--primary) 45%, transparent), inset 0 1px 0 rgba(255,255,255,0.15)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "none";
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 4px 20px color-mix(in oklab, var(--primary) 35%, transparent), inset 0 1px 0 rgba(255,255,255,0.15)";
                }}
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating with AI…
                  </>
                ) : ideaValidatorBlocked ? (
                  <>
                    <Lock className="h-4 w-4" /> Upgrade to continue
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Generate with AI
                  </>
                )}
              </button>

              {isFreeStarter && isIdeaValidator && (
                <p
                  className="text-center text-[11.5px]"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Free plan · {Math.min(ideaValidatorRuns, 3)} of 3 free validations used
                </p>
              )}
              {!effectiveWired && (
                <p
                  className="text-center text-[11.5px]"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  This tool is launching soon. Inputs save as drafts.
                </p>
              )}
            </div>
          </div>

          {/* Recent runs */}
          {effectiveWired && (
            <div
              className="overflow-hidden rounded-2xl"
              style={{
                background: "var(--surface)",
                border: "1px solid rgba(59,130,246,0.12)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
              }}
            >
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{
                  borderBottom: "1px solid color-mix(in oklab, var(--border) 60%, transparent)",
                  background: "color-mix(in oklab, var(--surface-2) 40%, transparent)",
                }}
              >
                <div
                  className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <HistoryIcon className="h-3 w-3" /> Recent runs
                </div>
                <Link
                  to="/app/launchpad/history"
                  className="text-[11px] transition-colors hover:text-foreground"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  See all →
                </Link>
              </div>
              {toolRuns.length === 0 ? (
                <div
                  className="px-5 py-6 text-center text-[12.5px]"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  No runs yet. Your first generation will appear here.
                </div>
              ) : (
                <div
                  className="divide-y"
                  style={{ borderColor: "color-mix(in oklab, var(--border) 60%, transparent)" }}
                >
                  {toolRuns.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        const out = (r.output ?? null) as Record<string, unknown> | null;
                        setOutput(out);
                        setRunId(r.id);
                        const meta = (r.metadata ?? {}) as Record<string, unknown>;
                        setFeedback(
                          meta.feedback === "up" ? "up" : meta.feedback === "down" ? "down" : null,
                        );
                      }}
                      className="flex w-full items-center justify-between px-5 py-2.5 text-left transition"
                      style={{ borderColor: "color-mix(in oklab, var(--border) 60%, transparent)" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                      }}
                    >
                      <div className="min-w-0">
                        <div
                          className="truncate text-[13px] font-medium"
                          style={{ color: "var(--foreground)" }}
                        >
                          {(r.input as { business?: string; title?: string })?.business ||
                            (r.input as { title?: string })?.title ||
                            "Untitled run"}
                        </div>
                        <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                          {new Date(r.created_at).toLocaleString()} · {r.status}
                        </div>
                      </div>
                      <ArrowRight
                        className="h-3.5 w-3.5 shrink-0"
                        style={{ color: "var(--muted-foreground)" }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — output */}
        <div className="lg:col-span-2">
          <div
            className="sticky overflow-hidden rounded-2xl"
            style={{
              top: "72px",
              background: "var(--surface)",
              border: "1px solid rgba(139,92,246,0.15)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(139,92,246,0.05)",
            }}
          >
            {/* Neon top edge — violet */}
            <div
              className="h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(139,92,246,0.5), rgba(59,130,246,0.3), transparent)",
              }}
            />
            <div
              className="px-5 py-4"
              style={{
                borderBottom: "1px solid rgba(139,92,246,0.1)",
                background: "rgba(139,92,246,0.03)",
              }}
            >
              <OutputHeader
                onCopy={output ? handleCopy : undefined}
                onDownload={output ? downloadJSON : undefined}
                onSave={output ? saveToAssets : undefined}
                onFeedback={output ? sendFeedback : undefined}
                feedback={feedback}
              />
            </div>

            <div className="px-5 pb-5 pt-4">
              {!output && !generating && (
                <EmptyState
                  variant="inline"
                  icon={FileText}
                  title="No output yet"
                  description={
                    effectiveWired
                      ? "Add context on the left, then generate to see your structured output here."
                      : "This tool is launching soon. Your inputs are auto-saved as a draft."
                  }
                  className="py-10"
                />
              )}

              {generating && <NovaThinking streamText={streamText} toolName={tool.name} />}

              {output && !generating && (
                <div className="max-h-[68vh] overflow-y-auto pr-1">
                  <OutputBody toolKey={effectiveToolKey || tool.key} output={output} />
                </div>
              )}
            </div>

            {/* Cross-tool handoffs */}
            {output && handoffs.length > 0 && (
              <div
                className="px-5 py-4"
                style={{
                  borderTop: "1px solid color-mix(in oklab, var(--border) 60%, transparent)",
                }}
              >
                <div
                  className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: "var(--muted-foreground)" }}
                >
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
                      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-medium transition"
                      style={{
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        color: "var(--foreground)",
                        opacity: 0.85,
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor =
                          "color-mix(in oklab, var(--primary) 40%, transparent)";
                        (e.currentTarget as HTMLElement).style.background =
                          "color-mix(in oklab, var(--primary) 8%, var(--surface-2))";
                        (e.currentTarget as HTMLElement).style.color = "var(--primary)";
                        (e.currentTarget as HTMLElement).style.opacity = "1";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                        (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                        (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
                        (e.currentTarget as HTMLElement).style.opacity = "0.85";
                      }}
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
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2">
        <div className="text-[12.5px] font-semibold" style={{ color: "var(--foreground)" }}>
          {label}
        </div>
        {hint && (
          <div className="mt-0.5 text-[11.5px]" style={{ color: "var(--muted-foreground)" }}>
            {hint}
          </div>
        )}
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
    case "kill-my-idea":
      return "Describe your startup idea in detail — what it does, who it's for, the business model, and why you think it'll work. The more confident you sound, the better the critique.";
    default:
      return "Describe your business, audience, and goal. The more specific, the better the output.";
  }
}
