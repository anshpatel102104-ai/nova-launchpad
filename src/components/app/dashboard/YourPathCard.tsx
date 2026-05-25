// TASK-064 · Your Path Dashboard Card
// Shows the user's current lane, stage progression, and lane-specific next steps.

import React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Lightbulb, Sparkles, Users, Settings2 } from "lucide-react";
import { LANE_META } from "@/lib/lane-classifier";
import type { Lane } from "@/lib/lane-classifier";

interface Props {
  lane: Lane;
  stage: string;
  missionTitle?: string | null;
}

const LANE_NEXT_STEPS: Record<Lane, { label: string; to: string }[]> = {
  Idea: [
    { label: "Validate your idea", to: "/app/launchpad/idea-validator" },
    { label: "Kill test it", to: "/app/launchpad/kill-my-idea" },
    { label: "Generate pitch", to: "/app/launchpad/pitch-generator" },
  ],
  Offer: [
    { label: "Build your offer", to: "/app/launchpad/offer" },
    { label: "Map GTM strategy", to: "/app/launchpad/gtm-strategy" },
    { label: "Get funding score", to: "/app/launchpad/funding-score" },
  ],
  Customer: [
    { label: "Find first customers", to: "/app/launchpad/first-10-customers" },
    { label: "Capture leads", to: "/app/nova/leads" },
    { label: "Set up follow-ups", to: "/app/nova/workflows" },
  ],
  Systems: [
    { label: "Wire automations", to: "/app/nova/workflows" },
    { label: "Open CRM pipeline", to: "/app/nova/crm" },
    { label: "View reports", to: "/app/nova/reports" },
  ],
};

const LANE_ICONS: Record<
  Lane,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  Idea: Lightbulb,
  Offer: Sparkles,
  Customer: Users,
  Systems: Settings2,
};

const LANE_STAGES: Record<Lane, string[]> = {
  Idea: ["Idea", "Validate", "Pitch"],
  Offer: ["Offer", "GTM", "Launch"],
  Customer: ["Outreach", "First Sale", "Retained"],
  Systems: ["Automate", "Scale", "Operate"],
};

export function YourPathCard({ lane, stage, missionTitle }: Props) {
  const meta = LANE_META[lane];
  const Icon = LANE_ICONS[lane];
  const nextSteps = LANE_NEXT_STEPS[lane];
  const stages = LANE_STAGES[lane];
  const stageIdx = Math.max(
    0,
    stages.findIndex((s) => s.toLowerCase() === stage.toLowerCase()),
  );

  return (
    <div
      style={{
        borderRadius: 18,
        border: `1px solid ${meta.color}30`,
        background: "var(--surface)",
        padding: 20,
        position: "relative",
        overflow: "hidden",
        height: "100%",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -50,
          right: -50,
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: `radial-gradient(ellipse, ${meta.color}14 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${meta.color}60, transparent)`,
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `${meta.color}18`,
            border: `1px solid ${meta.color}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon style={{ width: 18, height: 18, color: meta.color }} />
        </div>
        <div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: meta.color,
              marginBottom: 1,
            }}
          >
            Your Path
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: "var(--foreground)",
              letterSpacing: "-0.02em",
            }}
          >
            {meta.label} Lane
          </div>
        </div>
      </div>

      {missionTitle && (
        <div
          style={{
            fontSize: 12,
            color: "var(--muted-foreground)",
            marginBottom: 14,
            padding: "8px 10px",
            borderRadius: 8,
            background: `${meta.color}0a`,
            border: `1px solid ${meta.color}18`,
          }}
        >
          <span style={{ fontWeight: 600, color: "var(--foreground)" }}>Active mission: </span>
          {missionTitle}
        </div>
      )}

      {/* Stage rail */}
      <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 16 }}>
        {stages.map((s, i) => (
          <React.Fragment key={s}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                flex: 1,
              }}
            >
              <div
                style={{
                  height: 4,
                  width: "100%",
                  borderRadius: 2,
                  background: i <= stageIdx ? meta.color : "rgba(255,255,255,0.08)",
                  boxShadow: i <= stageIdx ? `0 0 6px ${meta.color}60` : "none",
                  transition: "all 0.3s",
                }}
              />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: i === stageIdx ? 700 : 500,
                  color: i <= stageIdx ? meta.color : "var(--muted-foreground)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {s}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Next steps */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--muted-foreground)",
          marginBottom: 8,
        }}
      >
        Next steps
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {nextSteps.map((step, i) => (
          <Link key={step.to} to={step.to} style={{ textDecoration: "none" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 10px",
                borderRadius: 8,
                border: i === 0 ? `1px solid ${meta.color}25` : "1px solid rgba(255,255,255,0.05)",
                background: i === 0 ? `${meta.color}08` : "transparent",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = `${meta.color}40`;
                (e.currentTarget as HTMLElement).style.background = `${meta.color}10`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  i === 0 ? `${meta.color}25` : "rgba(255,255,255,0.05)";
                (e.currentTarget as HTMLElement).style.background =
                  i === 0 ? `${meta.color}08` : "transparent";
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: i === 0 ? meta.color : "rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 8,
                  fontWeight: 800,
                  color: i === 0 ? "#fff" : "var(--muted-foreground)",
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: 12,
                  fontWeight: i === 0 ? 600 : 500,
                  color: i === 0 ? "var(--foreground)" : "var(--muted-foreground)",
                }}
              >
                {step.label}
              </span>
              {i === 0 && <ArrowRight style={{ width: 11, height: 11, color: meta.color }} />}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
