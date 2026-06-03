// TASK-062 · Stage Progress / Checklist UI
// Shows current mission steps with completion status and tool launch buttons.

import React from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, ChevronRight, Loader2, SkipForward } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const TOOL_ROUTES: Record<string, string> = {
  "idea-validator": "/app/launchpad/idea-validator",
  "kill-my-idea": "/app/launchpad/kill-my-idea",
  "pitch-generator": "/app/launchpad/pitch-generator",
  "gtm-strategy": "/app/launchpad/gtm-strategy",
  offer: "/app/launchpad/offer",
  "first-10-customers": "/app/launchpad/first-10-customers",
  followup: "/app/launchpad/followup",
  "generate-ops-plan": "/app/launchpad/ops-plan",
};

export function MissionChecklist({ missionId, workspaceId, steps, onStepComplete }: Props) {
  const [loadingStep, setLoadingStep] = React.useState<string | null>(null);

  const handleCompleteStep = async (stepId: string) => {
    setLoadingStep(stepId);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/advance-mission`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: "complete_step",
          step_id: stepId,
          mission_id: missionId,
          workspace_id: workspaceId,
        }),
      });
      if (!res.ok) throw new Error("Failed to complete step");
      toast.success("Step completed!");
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

  return (
    <div>
      {/* Progress bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--muted-foreground)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Progress
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6" }}>
            {completedCount}/{sorted.length} steps
          </span>
        </div>
        <div
          style={{
            height: 4,
            borderRadius: 99,
            background: "var(--border)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              borderRadius: 99,
              background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
              transition: "width 0.5s cubic-bezier(0.16,1,0.3,1)",
              boxShadow: "0 0 8px rgba(59,130,246,0.5)",
            }}
          />
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map((step, idx) => {
          const isDone = step.status === "completed" || step.status === "skipped";
          const isLoading = loadingStep === step.id;
          const toolRoute = step.tool_key ? TOOL_ROUTES[step.tool_key] : null;

          return (
            <div
              key={step.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 12,
                border: isDone ? "1px solid rgba(34,197,94,0.2)" : "1px solid var(--border-subtle)",
                background: isDone
                  ? "color-mix(in oklab, var(--success) 5%, transparent)"
                  : "var(--surface)",
                transition: "all 0.2s",
                opacity: isDone ? 0.7 : 1,
              }}
            >
              {/* Status icon */}
              <div style={{ flexShrink: 0, marginTop: 2 }}>
                {isDone ? (
                  <CheckCircle2 style={{ width: 18, height: 18, color: "#22c55e" }} />
                ) : (
                  <Circle style={{ width: 18, height: 18, color: "var(--muted-foreground)" }} />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: isDone ? "rgba(240,244,255,0.5)" : "#f0f4ff",
                    textDecoration: isDone ? "line-through" : "none",
                  }}
                >
                  {step.title}
                </div>
                {step.description && !isDone && (
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "var(--muted-foreground)",
                      marginTop: 3,
                      lineHeight: 1.5,
                    }}
                  >
                    {step.description}
                  </div>
                )}
              </div>

              {/* Actions */}
              {!isDone && (
                <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                  {toolRoute && (
                    <Link to={toolRoute}>
                      <button
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "5px 10px",
                          borderRadius: 7,
                          border: "none",
                          background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                          color: "#fff",
                          fontSize: 11.5,
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Run tool
                        <ChevronRight style={{ width: 12, height: 12 }} />
                      </button>
                    </Link>
                  )}
                  <button
                    onClick={() => handleCompleteStep(step.id)}
                    disabled={isLoading}
                    title="Mark as done"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "5px 8px",
                      borderRadius: 7,
                      border: "1px solid rgba(34,197,94,0.3)",
                      background: "rgba(34,197,94,0.08)",
                      color: "#22c55e",
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: isLoading ? "default" : "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {isLoading ? (
                      <Loader2
                        style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }}
                      />
                    ) : (
                      "Done"
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
