// TASK-017 · Reusable error state component
// Covers: tool run failures, network errors, permission errors, empty states.

import React from "react";
import { Link } from "@tanstack/react-router";
import { AlertCircle, RefreshCw, Lock, WifiOff, Frown, ArrowRight } from "lucide-react";

export type ErrorVariant =
  | "generic"
  | "network"
  | "permission"
  | "empty"
  | "rate_limit"
  | "not_found";

interface Props {
  variant?: ErrorVariant;
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  cta?: { label: string; to: string };
  compact?: boolean;
}

const VARIANT_CONFIG: Record<
  ErrorVariant,
  {
    icon: React.ComponentType<{ style?: React.CSSProperties }>;
    defaultTitle: string;
    defaultDesc: string;
    color: string;
  }
> = {
  generic: {
    icon: AlertCircle,
    defaultTitle: "Something went wrong",
    defaultDesc: "An unexpected error occurred. Try again or contact support.",
    color: "#ef4444",
  },
  network: {
    icon: WifiOff,
    defaultTitle: "Connection issue",
    defaultDesc: "Check your internet connection and try again.",
    color: "#f59e0b",
  },
  permission: {
    icon: Lock,
    defaultTitle: "Access restricted",
    defaultDesc: "You don't have permission to view this. Upgrade your plan to unlock it.",
    color: "#8b5cf6",
  },
  empty: {
    icon: Frown,
    defaultTitle: "Nothing here yet",
    defaultDesc: "Get started by running a tool or adding data.",
    color: "#6366f1",
  },
  rate_limit: {
    icon: AlertCircle,
    defaultTitle: "Limit reached",
    defaultDesc: "You've hit your monthly limit. Upgrade to continue.",
    color: "#f97316",
  },
  not_found: {
    icon: AlertCircle,
    defaultTitle: "Not found",
    defaultDesc: "This resource doesn't exist or was removed.",
    color: "#64748b",
  },
};

export function ErrorState({
  variant = "generic",
  title,
  description,
  onRetry,
  retryLabel = "Try again",
  cta,
  compact = false,
}: Props) {
  const cfg = VARIANT_CONFIG[variant];
  const Icon = cfg.icon;
  const displayTitle = title ?? cfg.defaultTitle;
  const displayDesc = description ?? cfg.defaultDesc;

  if (compact) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          borderRadius: 10,
          border: `1px solid ${cfg.color}25`,
          background: `${cfg.color}08`,
        }}
      >
        <Icon
          style={{ width: 14, height: 14, color: cfg.color, flexShrink: 0 } as React.CSSProperties}
        />
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--foreground)" }}>
            {displayTitle}
          </span>
          {description && (
            <span style={{ fontSize: 12, color: "var(--muted-foreground)", marginLeft: 6 }}>
              {displayDesc}
            </span>
          )}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              borderRadius: 6,
              border: `1px solid ${cfg.color}30`,
              background: `${cfg.color}10`,
              color: cfg.color,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <RefreshCw style={{ width: 10, height: 10 } as React.CSSProperties} />
            {retryLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        textAlign: "center",
        minHeight: 200,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: `${cfg.color}12`,
          border: `1px solid ${cfg.color}25`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <Icon style={{ width: 24, height: 24, color: cfg.color } as React.CSSProperties} />
      </div>

      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "var(--foreground)",
          marginBottom: 8,
          letterSpacing: "-0.02em",
        }}
      >
        {displayTitle}
      </div>
      <p
        style={{
          fontSize: 13,
          color: "var(--muted-foreground)",
          lineHeight: 1.55,
          maxWidth: 320,
          marginBottom: 20,
        }}
      >
        {displayDesc}
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 9,
              border: `1px solid ${cfg.color}30`,
              background: `${cfg.color}10`,
              color: cfg.color,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = `${cfg.color}18`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = `${cfg.color}10`;
            }}
          >
            <RefreshCw style={{ width: 13, height: 13 } as React.CSSProperties} />
            {retryLabel}
          </button>
        )}
        {cta && (
          <Link to={cta.to} style={{ textDecoration: "none" }}>
            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 9,
                border: "none",
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                color: "#fff",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
              }}
            >
              {cta.label} <ArrowRight style={{ width: 12, height: 12 }} />
            </button>
          </Link>
        )}
        {variant === "permission" && !cta && (
          <Link to="/app/billing" style={{ textDecoration: "none" }}>
            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 9,
                border: "none",
                background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                color: "#fff",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: "0 4px 14px rgba(139,92,246,0.3)",
              }}
            >
              Upgrade plan <ArrowRight style={{ width: 12, height: 12 }} />
            </button>
          </Link>
        )}
        {variant === "rate_limit" && !cta && (
          <Link to="/app/billing" style={{ textDecoration: "none" }}>
            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 9,
                border: "none",
                background: "linear-gradient(135deg, #f97316, #ef4444)",
                color: "#fff",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: "0 4px 14px rgba(249,115,22,0.3)",
              }}
            >
              Upgrade plan <ArrowRight style={{ width: 12, height: 12 }} />
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
