// Step Execution Guide Component
// Provides actionable, clear guidance for each mission step with:
// - Simple execution instructions at a 5th-grade reading level
// - Dropdown showing different ways to execute (tool link, external action, etc)
// - Links and what-to-do guidance inline
// - Clarified wording for complex steps

import React, { useState } from "react";
import {
  ChevronDown,
  ExternalLink,
  Zap,
  BookOpen,
  Link as LinkIcon,
  CheckCircle2,
} from "lucide-react";

export interface ExecutionOption {
  type: "tool" | "inline" | "external" | "manual" | "integration";
  label: string;
  description: string;
  action: {
    text: string;
    href?: string;
    onClick?: () => void;
  };
  icon?: React.ComponentType<{ className?: string }>;
}

export interface StepGuidance {
  stepId: string;
  title: string;
  simplifiedDescription?: string;
  whyDoThis?: string;
  executionOptions: ExecutionOption[];
  estimatedTime?: number; // in minutes
  commonMistakes?: string[];
  successCriteria?: string[];
}

interface Props {
  guidance: StepGuidance;
  onExecute?: (option: ExecutionOption) => void;
  isCompleted?: boolean;
}

export function StepExecutionGuide({ guidance, onExecute, isCompleted }: Props) {
  const [expandedOption, setExpandedOption] = useState<number | null>(null);
  const [showAllDetails, setShowAllDetails] = useState(false);

  const defaultOption = guidance.executionOptions[0];
  const primaryOption = guidance.executionOptions.find((o) => o.type === "tool") || defaultOption;

  if (isCompleted) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 13,
          color: "var(--muted-foreground)",
        }}
      >
        <CheckCircle2 style={{ width: 16, height: 16, color: "#22c55e" }} />
        <span>Step completed</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Why do this */}
      {guidance.whyDoThis && !showAllDetails && (
        <div
          style={{
            fontSize: 12,
            color: "var(--muted-foreground)",
            lineHeight: 1.5,
            padding: "8px 12px",
            borderRadius: 8,
            background: "rgba(100,150,200,0.05)",
            borderLeft: "2px solid var(--primary)",
          }}
        >
          <strong style={{ color: "var(--foreground)" }}>Why:</strong> {guidance.whyDoThis}
        </div>
      )}

      {/* Simplified description */}
      {guidance.simplifiedDescription && (
        <div
          style={{
            fontSize: 12,
            color: "var(--foreground)",
            lineHeight: 1.6,
            padding: "8px 0",
          }}
        >
          {guidance.simplifiedDescription}
        </div>
      )}

      {/* Primary execution button */}
      <button
        onClick={() => {
          if (primaryOption.action.href) {
            window.location.href = primaryOption.action.href;
          } else if (primaryOption.action.onClick) {
            primaryOption.action.onClick();
          }
          onExecute?.(primaryOption);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "8px 14px",
          borderRadius: 8,
          border: "none",
          background:
            primaryOption.type === "tool"
              ? "linear-gradient(135deg, #3b82f6, #6366f1)"
              : "var(--primary)",
          color: "#fff",
          fontSize: 12.5,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.opacity = "0.9";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.opacity = "1";
        }}
      >
        <Zap style={{ width: 14, height: 14 }} />
        {primaryOption.action.text}
      </button>

      {/* Alternative options dropdown (if more than 1) */}
      {guidance.executionOptions.length > 1 && (
        <div
          style={{
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: 8,
            marginTop: 4,
          }}
        >
          <button
            onClick={() => setShowAllDetails(!showAllDetails)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              padding: "6px 0",
              border: "none",
              background: "transparent",
              color: "var(--muted-foreground)",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            <span>Other ways to do this</span>
            <ChevronDown
              style={{
                width: 14,
                height: 14,
                transition: "transform 0.2s",
                transform: showAllDetails ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>

          {showAllDetails && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              {guidance.executionOptions.map((option, idx) => {
                const isExpanded = expandedOption === idx;
                const Icon = option.icon || LinkIcon;

                return (
                  <div
                    key={idx}
                    style={{
                      borderRadius: 8,
                      border: "1px solid var(--border-subtle)",
                      background: "var(--surface)",
                      overflow: "hidden",
                    }}
                  >
                    {/* Option header */}
                    <button
                      onClick={() => setExpandedOption(isExpanded ? null : idx)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        border: "none",
                        background: "transparent",
                        color: "var(--foreground)",
                        fontSize: 12.5,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        textAlign: "left",
                      }}
                    >
                      <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>{option.label}</span>
                      <ChevronDown
                        style={{
                          width: 14,
                          height: 14,
                          transition: "transform 0.2s",
                          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                          color: "var(--muted-foreground)",
                        }}
                      />
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div style={{ borderTop: "1px solid var(--border-subtle)" }}>
                        <div
                          style={{
                            padding: "12px",
                            fontSize: 12,
                            color: "var(--muted-foreground)",
                          }}
                        >
                          {option.description}
                        </div>
                        <div
                          style={{
                            padding: "10px 12px",
                            background: "var(--surface-2)",
                            borderTop: "1px solid var(--border-subtle)",
                          }}
                        >
                          <button
                            onClick={() => {
                              if (option.action.href) {
                                window.location.href = option.action.href;
                              } else if (option.action.onClick) {
                                option.action.onClick();
                              }
                              onExecute?.(option);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "6px 10px",
                              borderRadius: 6,
                              border: "none",
                              background: "var(--primary)",
                              color: "#fff",
                              fontSize: 11.5,
                              fontWeight: 600,
                              cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >
                            {option.action.text}
                            {option.action.href && (
                              <ExternalLink style={{ width: 12, height: 12 }} />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Common mistakes */}
      {guidance.commonMistakes && guidance.commonMistakes.length > 0 && showAllDetails && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            background: "rgba(239,68,68,0.05)",
            borderLeft: "2px solid rgba(239,68,68,0.3)",
            fontSize: 11.5,
            color: "var(--muted-foreground)",
          }}
        >
          <div style={{ fontWeight: 600, color: "var(--foreground)", marginBottom: 4 }}>
            Common mistakes to avoid:
          </div>
          <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.6 }}>
            {guidance.commonMistakes.map((mistake, idx) => (
              <li key={idx}>{mistake}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Success criteria */}
      {guidance.successCriteria && guidance.successCriteria.length > 0 && showAllDetails && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            background: "rgba(34,197,94,0.05)",
            borderLeft: "2px solid rgba(34,197,94,0.3)",
            fontSize: 11.5,
            color: "var(--muted-foreground)",
          }}
        >
          <div style={{ fontWeight: 600, color: "var(--foreground)", marginBottom: 4 }}>
            You'll be done when:
          </div>
          <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.6 }}>
            {guidance.successCriteria.map((criteria, idx) => (
              <li key={idx}>{criteria}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Estimated time */}
      {guidance.estimatedTime && (
        <div
          style={{
            fontSize: 11,
            color: "var(--muted-foreground)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <BookOpen style={{ width: 12, height: 12 }} />
          <span>~{guidance.estimatedTime} minutes</span>
        </div>
      )}
    </div>
  );
}
