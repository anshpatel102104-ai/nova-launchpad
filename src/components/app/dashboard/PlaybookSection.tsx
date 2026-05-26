import React from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckSquare,
  Square,
  BookOpen,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PlaybookTask = {
  id: string;
  name: string;
  description: string;
  tools: string[];
  tips: string[];
};

type PlaybookPhase = {
  id: string;
  name: string;
  description: string;
  duration: string;
  tasks: PlaybookTask[];
};

type PlaybookContent = {
  title: string;
  summary: string;
  phases: PlaybookPhase[];
};

type Props = {
  orgId: string;
  userId: string;
};

export function PlaybookSection({ orgId, userId }: Props) {
  const [status, setStatus] = React.useState<"idle" | "loading" | "done" | "error">("idle");
  const [playbook, setPlaybook] = React.useState<PlaybookContent | null>(null);
  const [playbookId, setPlaybookId] = React.useState<string | null>(null);
  const [expandedPhases, setExpandedPhases] = React.useState<Set<string>>(new Set());
  const [progress, setProgress] = React.useState<Record<string, boolean>>({});
  const [savingTask, setSavingTask] = React.useState<string | null>(null);

  // Load or generate playbook on mount
  React.useEffect(() => {
    if (!orgId || !userId) return;
    loadOrGenerate();
  }, [orgId, userId]);

  async function loadOrGenerate() {
    setStatus("loading");
    try {
      // Check for existing playbook
      const { data: existing } = await supabase
        .from("playbooks")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        const content = existing.content as unknown as PlaybookContent;
        setPlaybook(content);
        setPlaybookId(existing.id);
        // Expand first phase by default
        if (content.phases?.[0]) setExpandedPhases(new Set([content.phases[0].id]));
        await loadProgress(existing.id);
        setStatus("done");
        return;
      }

      // Generate via edge function
      const { data, error } = await supabase.functions.invoke("generate-playbook", {
        body: {},
      });

      if (error) throw error;

      if (data?.content) {
        const content = data.content as PlaybookContent;
        setPlaybook(content);
        setPlaybookId(data.playbook_id ?? null);
        if (content.phases?.[0]) setExpandedPhases(new Set([content.phases[0].id]));
        if (data.playbook_id) await loadProgress(data.playbook_id);
      }
      setStatus("done");
    } catch (e) {
      console.error("[PlaybookSection] error:", e);
      setStatus("error");
    }
  }

  async function loadProgress(pid: string) {
    const { data } = await supabase
      .from("playbook_progress")
      .select("task_id, completed")
      .eq("playbook_id", pid);
    const map: Record<string, boolean> = {};
    for (const row of data ?? []) map[row.task_id] = row.completed;
    setProgress(map);
  }

  async function toggleTask(taskId: string) {
    if (!playbookId) return;
    const next = !progress[taskId];
    setProgress((p) => ({ ...p, [taskId]: next }));
    setSavingTask(taskId);

    const { error } = await supabase.from("playbook_progress").upsert(
      { user_id: userId, playbook_id: playbookId, task_id: taskId, completed: next, updated_at: new Date().toISOString() },
      { onConflict: "user_id,task_id" },
    );

    if (error) {
      console.error("[PlaybookSection] progress save error:", error.message);
      // Revert on failure
      setProgress((p) => ({ ...p, [taskId]: !next }));
    }
    setSavingTask(null);
  }

  function togglePhase(phaseId: string) {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) next.delete(phaseId);
      else next.add(phaseId);
      return next;
    });
  }

  async function regenerate() {
    if (!userId) return;
    // Delete existing playbook so the edge function regenerates
    await supabase.from("playbooks").delete().eq("user_id", userId);
    setPlaybook(null);
    setPlaybookId(null);
    setProgress({});
    setExpandedPhases(new Set());
    loadOrGenerate();
  }

  const totalTasks = playbook?.phases.flatMap((p) => p.tasks).length ?? 0;
  const doneTasks = Object.values(progress).filter(Boolean).length;

  return (
    <section
      className="rise-in overflow-hidden rounded-2xl"
      style={{
        background: "var(--surface)",
        border: "1px solid rgba(75,139,244,0.18)",
        boxShadow: "0 0 0 1px rgba(75,139,244,0.06), 0 1px 3px rgba(0,0,0,0.5), 0 8px 40px rgba(0,0,0,0.3)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid rgba(75,139,244,0.1)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
            style={{
              background: "linear-gradient(135deg, #4B8BF4, #8B5CF6)",
              boxShadow: "0 4px 16px rgba(75,139,244,0.35)",
            }}
          >
            <BookOpen className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <div
              className="text-[9.5px] font-bold uppercase tracking-[0.18em]"
              style={{ color: "rgba(75,139,244,0.7)" }}
            >
              AI Business Playbook
            </div>
            <h2
              className="font-display text-[15px] font-bold tracking-tight"
              style={{ color: "var(--foreground)" }}
            >
              {status === "done" && playbook ? playbook.title : "Your personalised roadmap"}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {status === "done" && totalTasks > 0 && (
            <span
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.2)",
                color: "var(--success)",
              }}
            >
              {doneTasks}/{totalTasks} done
            </span>
          )}
          {status === "done" && (
            <button
              onClick={regenerate}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all"
              style={{
                background: "var(--surface-2)",
                border: "1px solid rgba(75,139,244,0.15)",
                color: "var(--muted-foreground)",
              }}
              title="Regenerate playbook"
            >
              <RefreshCw className="h-3 w-3" />
              Regenerate
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(75,139,244,0.15), rgba(139,92,246,0.15))",
              border: "1px solid rgba(75,139,244,0.2)",
            }}
          >
            <Sparkles className="h-6 w-6 animate-pulse" style={{ color: "#4B8BF4" }} />
          </div>
          <div>
            <p className="font-display text-[15px] font-bold" style={{ color: "var(--foreground)" }}>
              Building your playbook…
            </p>
            <p className="mt-1 text-[12.5px]" style={{ color: "var(--muted-foreground)" }}>
              Nova is reading your business idea and crafting a step-by-step plan.
            </p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-8 rounded-full"
                style={{
                  background: "linear-gradient(90deg, #4B8BF4, #8B5CF6)",
                  opacity: 0.4 + i * 0.3,
                  animation: `pulse ${1 + i * 0.3}s ease-in-out infinite`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center">
          <p className="text-[13px] font-medium" style={{ color: "var(--muted-foreground)" }}>
            Failed to generate playbook.
          </p>
          <button
            onClick={loadOrGenerate}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #4B8BF4, #8B5CF6)" }}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Try again
          </button>
        </div>
      )}

      {status === "done" && playbook && (
        <div className="p-5">
          {/* Summary */}
          <p className="mb-5 text-[13px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            {playbook.summary}
          </p>

          {/* Progress bar */}
          {totalTasks > 0 && (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium" style={{ color: "var(--muted-foreground)" }}>
                  Overall progress
                </span>
                <span className="text-[11px] font-mono font-bold" style={{ color: "#4B8BF4" }}>
                  {Math.round((doneTasks / totalTasks) * 100)}%
                </span>
              </div>
              <div
                className="h-1.5 w-full overflow-hidden rounded-full"
                style={{ background: "var(--surface-2)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.round((doneTasks / totalTasks) * 100)}%`,
                    background: "linear-gradient(90deg, #4B8BF4, #8B5CF6)",
                    boxShadow: "0 0 8px rgba(75,139,244,0.5)",
                  }}
                />
              </div>
            </div>
          )}

          {/* Phases */}
          <div className="space-y-3">
            {playbook.phases.map((phase, phaseIdx) => {
              const isOpen = expandedPhases.has(phase.id);
              const phaseTasks = phase.tasks;
              const phaseDone = phaseTasks.filter((t) => progress[t.id]).length;
              const phaseComplete = phaseDone === phaseTasks.length && phaseTasks.length > 0;

              return (
                <div
                  key={phase.id}
                  className="overflow-hidden rounded-xl transition-all"
                  style={{
                    border: `1px solid ${phaseComplete ? "rgba(16,185,129,0.25)" : "rgba(75,139,244,0.12)"}`,
                    background: isOpen ? "rgba(75,139,244,0.03)" : "transparent",
                  }}
                >
                  {/* Phase header */}
                  <button
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-all"
                    onClick={() => togglePhase(phase.id)}
                    style={{ background: "transparent" }}
                  >
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-black"
                      style={
                        phaseComplete
                          ? {
                              background: "rgba(16,185,129,0.12)",
                              border: "1px solid rgba(16,185,129,0.3)",
                              color: "var(--success)",
                            }
                          : {
                              background: "linear-gradient(135deg, rgba(75,139,244,0.15), rgba(139,92,246,0.15))",
                              border: "1px solid rgba(75,139,244,0.2)",
                              color: "#4B8BF4",
                            }
                      }
                    >
                      {phaseIdx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="font-display text-[13.5px] font-bold tracking-tight"
                          style={{ color: "var(--foreground)" }}
                        >
                          {phase.name}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            background: "rgba(75,139,244,0.08)",
                            border: "1px solid rgba(75,139,244,0.15)",
                            color: "rgba(75,139,244,0.8)",
                          }}
                        >
                          {phase.duration}
                        </span>
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                        {phaseDone}/{phaseTasks.length} tasks · {phase.description}
                      </div>
                    </div>

                    <div style={{ color: "var(--muted-foreground)", flexShrink: 0 }}>
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </button>

                  {/* Tasks */}
                  {isOpen && (
                    <div
                      className="px-4 pb-4 space-y-2.5"
                      style={{ borderTop: "1px solid rgba(75,139,244,0.08)" }}
                    >
                      <div className="pt-3 space-y-2.5">
                        {phaseTasks.map((task) => {
                          const done = !!progress[task.id];
                          const saving = savingTask === task.id;

                          return (
                            <div
                              key={task.id}
                              className="rounded-xl p-3.5 transition-all"
                              style={{
                                background: done
                                  ? "rgba(16,185,129,0.04)"
                                  : "rgba(75,139,244,0.03)",
                                border: `1px solid ${done ? "rgba(16,185,129,0.15)" : "rgba(75,139,244,0.08)"}`,
                              }}
                            >
                              <div className="flex items-start gap-2.5">
                                <button
                                  onClick={() => toggleTask(task.id)}
                                  disabled={saving}
                                  className="shrink-0 mt-0.5 transition-transform active:scale-90"
                                  aria-label={done ? "Mark incomplete" : "Mark complete"}
                                >
                                  {saving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--muted-foreground)" }} />
                                  ) : done ? (
                                    <CheckSquare className="h-4 w-4" style={{ color: "var(--success)" }} />
                                  ) : (
                                    <Square className="h-4 w-4" style={{ color: "rgba(75,139,244,0.5)" }} />
                                  )}
                                </button>

                                <div className="min-w-0 flex-1">
                                  <div
                                    className="text-[13px] font-semibold leading-snug"
                                    style={{
                                      color: done ? "var(--muted-foreground)" : "var(--foreground)",
                                      textDecoration: done ? "line-through" : "none",
                                      textDecorationColor: "rgba(255,255,255,0.2)",
                                    }}
                                  >
                                    {task.name}
                                  </div>
                                  <p
                                    className="mt-1 text-[12px] leading-relaxed"
                                    style={{ color: "var(--muted-foreground)" }}
                                  >
                                    {task.description}
                                  </p>

                                  {/* Tools */}
                                  {task.tools.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                      {task.tools.map((tool) => (
                                        <span
                                          key={tool}
                                          className="rounded-md px-2 py-0.5 text-[10.5px] font-medium"
                                          style={{
                                            background: "rgba(139,92,246,0.08)",
                                            border: "1px solid rgba(139,92,246,0.15)",
                                            color: "rgba(139,92,246,0.9)",
                                          }}
                                        >
                                          {tool}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {/* Tips */}
                                  {task.tips.length > 0 && (
                                    <ul className="mt-2.5 space-y-1">
                                      {task.tips.map((tip, i) => (
                                        <li
                                          key={i}
                                          className="flex items-start gap-1.5 text-[11.5px] leading-snug"
                                          style={{ color: "var(--muted-foreground)" }}
                                        >
                                          <span
                                            className="mt-1 h-1 w-1 shrink-0 rounded-full"
                                            style={{ background: "rgba(75,139,244,0.5)" }}
                                          />
                                          {tip}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
