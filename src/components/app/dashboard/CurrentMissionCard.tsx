// TASK-063 · Current Mission Dashboard Module
// Shows the active mission, lane badge, and step checklist.
// All progress data comes from useProgressSpine — no local derivation.

import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useProgressSpine } from "@/hooks/use-progress-spine";
import { MissionChecklist } from "./MissionChecklist";
import { Loader2, Target, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { LANE_META } from "@/lib/lane-classifier";
import type { Lane } from "@/lib/lane-classifier";

interface Props {
  userId: string;
}

export function CurrentMissionCard({ userId }: Props) {
  const qc = useQueryClient();
  const { isLoading, workspace, mission, steps, percent } = useProgressSpine();

  const refresh = () => qc.invalidateQueries({ queryKey: ["current-mission", userId] });

  if (isLoading) {
    return (
      <div
        style={{
          borderRadius: 18,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          padding: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 160,
        }}
      >
        <Loader2
          style={{
            width: 20,
            height: 20,
            color: "var(--muted-foreground)",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    );
  }

  if (!workspace || !mission) {
    // Retries are exhausted by now — resolve to a real empty state, never an
    // eternal spinner. Broken provisioning is handled by the Home repair
    // banner; this covers "no mission assigned" (e.g. all missions done).
    return (
      <div
        style={{
          borderRadius: 18,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <Target
          style={{
            width: 24,
            height: 24,
            color: "var(--muted-foreground)",
            margin: "0 auto 12px",
          }}
        />
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)", marginBottom: 6 }}>
          No active mission
        </div>
        <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 16 }}>
          If you just finished onboarding, your mission may still be provisioning — check again in a
          moment. Otherwise, pick your next move from the Path.
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button
            onClick={refresh}
            style={{
              padding: "8px 18px",
              borderRadius: 9,
              border: "1px solid var(--border-strong)",
              background: "var(--surface-2)",
              color: "var(--muted-foreground)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Check again
          </button>
          <Link
            to="/app/launchpad-path"
            style={{
              padding: "8px 18px",
              borderRadius: 9,
              background: "var(--primary)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            Open Path <ArrowRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>
      </div>
    );
  }

  const lane = (workspace.lane ?? "Idea") as Lane;
  const laneMeta = LANE_META[lane];
  const allDone = percent === 100 && steps.length > 0;

  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid var(--border)",
        background: "var(--surface)",
        padding: "24px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: `radial-gradient(ellipse, ${laneMeta.color}18 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 16,
          position: "relative",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: laneMeta.color,
                background: `${laneMeta.color}18`,
                padding: "3px 8px",
                borderRadius: 5,
              }}
            >
              {laneMeta.label}
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--muted-foreground)",
              }}
            >
              Current Mission
            </div>
          </div>
          <h3
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: "var(--foreground)",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            {mission.title}
          </h3>
          {mission.description && (
            <p
              style={{
                fontSize: 12.5,
                color: "var(--muted-foreground)",
                margin: "4px 0 0",
                lineHeight: 1.5,
              }}
            >
              {mission.description}
            </p>
          )}
        </div>

        {allDone && (
          <Link to="/app/dashboard">
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "7px 14px",
                borderRadius: 9,
                border: "none",
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                flexShrink: 0,
              }}
            >
              Next mission <ArrowRight style={{ width: 13, height: 13 }} />
            </button>
          </Link>
        )}
      </div>

      {/* Checklist */}
      <MissionChecklist
        missionId={mission.id}
        missionTitle={mission.title}
        workspaceId={workspace.id}
        steps={steps as Parameters<typeof MissionChecklist>[0]["steps"]}
        onStepComplete={refresh}
      />
    </div>
  );
}
