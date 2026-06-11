// Mission step checklist — each open step shows plain hand-holding guidance
// (via StepExecutionGuide) and a clear way to mark it done.

import React from "react";
import { CheckSquare, Square, Loader2 } from "lucide-react";
import { invokeEdge } from "@/lib/invokeEdge";
import { toast } from "sonner";
import { StepExecutionGuide } from "@/components/app/StepExecutionGuide";
import { getStepGuidance, makeFallbackGuidance } from "@/lib/step-execution-guidance";

export interface MissionStep {
  id: string;
  title: string;
  description?: string;
  tool_key: string | null;
  status: "pending" | "in_progress" | "completed" | "skipped";
  sort_order: number;
}

interface Props {
  missionId: string;
  workspaceId: string;
  steps: MissionStep[];
  onStepComplete?: () => void;
}

export function MissionChecklist({ missionId, workspaceId, steps, onStepComplete }: Props) {
  const [loadingStep, setLoadingStep] = React.useState<string | null>(null);

  const handleCompleteStep = async (stepId: string) => {
    setLoadingStep(stepId);
    try {
      await invokeEdge(
        "advance-mission",
        {
          action: "complete_step",
          step_id: stepId,
          mission_id: missionId,
          workspace_id: workspaceId,
        },
        { timeoutMs: 20_000 },
      );
      toast.success("Step done. Nice work!");
      onStepComplete?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoadingStep(null);
    }
  };

  const sorted = [...steps].sort((a, b) => a.sort_order - b.sort_order);
  const completedCount = sorted.filter(
    (s) => s.status === "completed" || s.status === "skipped",
  ).length;
  const progress = sorted.length > 0 ? Math.round((completedCount / sorted.length) * 100) : 0;
  const firstOpenId = sorted.find((s) => s.status !== "completed" && s.status !== "skipped")?.id;

  return (
    <div>
      {/* Progress */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--muted-foreground)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Your progress
          </span>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--primary)" }}>
            {completedCount} of {sorted.length} steps done
          </span>
        </div>
        <div style={{ height: 5, background: "var(--border-subtle)", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "var(--primary)",
              transition: "width 0.5s cubic-bezier(0.16,1,0.3,1)",
            }}
          />
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sorted.map((step) => {
          const isDone = step.status === "completed" || step.status === "skipped";
          const isCurrent = step.id === firstOpenId;
          const isLoading = loadingStep === step.id;
          const guidance =
            getStepGuidance(step.tool_key) ??
            makeFallbackGuidance(step.title, step.description, step.tool_key);

          return (
            <div
              key={step.id}
              style={{
                padding: "13px 15px",
                borderRadius: 4,
                border: "1px solid var(--border-subtle)",
                borderLeft: isCurrent
                  ? "3px solid var(--primary)"
                  : isDone
                    ? "3px solid var(--success)"
                    : "3px solid var(--border)",
                background: "var(--surface)",
                opacity: isDone ? 0.65 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flexShrink: 0, marginTop: 2 }}>
                  {isDone ? (
                    <CheckSquare style={{ width: 17, height: 17, color: "var(--success)" }} />
                  ) : (
                    <Square
                      style={{
                        width: 17,
                        height: 17,
                        color: isCurrent ? "var(--primary)" : "var(--muted-foreground)",
                      }}
                    />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: "var(--foreground)",
                      textDecoration: isDone ? "line-through" : "none",
                    }}
                  >
                    {step.title}
                    {isCurrent && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color: "var(--primary)",
                          background: "var(--primary-soft)",
                          border: "1px solid var(--primary-border)",
                          borderRadius: 3,
                          padding: "2px 6px",
                        }}
                      >
                        Do this now
                      </span>
                    )}
                  </div>
                  {step.description && !isDone && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--muted-foreground)",
                        lineHeight: 1.55,
                        marginTop: 2,
                      }}
                    >
                      {step.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Guidance only for the current step — keeps the list calm */}
              {!isDone && isCurrent && (
                <div style={{ marginTop: 12, marginLeft: 27 }}>
                  <StepExecutionGuide
                    guidance={guidance}
                    compact
                    onMarkDone={() => handleCompleteStep(step.id)}
                  />
                  {guidance.toolRoute && (
                    <button
                      onClick={() => handleCompleteStep(step.id)}
                      disabled={isLoading}
                      style={{
                        marginTop: 10,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "7px 12px",
                        borderRadius: 4,
                        border: "1px solid color-mix(in oklab, var(--success) 35%, transparent)",
                        background: "color-mix(in oklab, var(--success) 8%, transparent)",
                        color: "var(--success)",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: isLoading ? "default" : "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {isLoading ? (
                        <Loader2
                          style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }}
                        />
                      ) : (
                        "I finished this step — mark it done"
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
