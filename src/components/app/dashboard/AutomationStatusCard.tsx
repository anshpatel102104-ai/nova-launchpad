// TASK-068 · Automation Status Dashboard Module
// Shows active automations and recent workflow run status at a glance.

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import { Zap, CheckCircle2, XCircle, Clock, ArrowRight, Loader2, Settings2 } from "lucide-react";

interface Props {
  orgId: string;
  userId?: string;
}

type Integration = {
  id: string;
  integration_key: string | null;
  status: string | null;
  value_hint: string | null;
};
type AutomationSetting = {
  id: string;
  key: string;
  label?: string | null;
  enabled?: boolean | null;
};

async function fetchAutomationData(orgId: string, userId: string | undefined) {
  const [intsRes, autoRes] = await Promise.all([
    supabase
      .from("user_integrations")
      .select("id, integration_key, status, value_hint")
      .eq("user_id", userId ?? "")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("automation_settings")
      .select("id, key, label, enabled")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  return {
    integrations: (intsRes.data ?? []) as Integration[],
    automations: (autoRes.data ?? []) as AutomationSetting[],
  };
}

export function AutomationStatusCard({ orgId, userId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["automation-status", orgId, userId],
    queryFn: () => fetchAutomationData(orgId, userId),
    staleTime: 60_000,
    enabled: !!orgId,
  });

  const integrations = data?.integrations ?? [];
  const automations = data?.automations ?? [];

  const activeIntegrations = integrations.filter((i) => i.status === "connected");
  const enabledAutomations = automations.filter((a) => a.enabled);
  const webhookIntegrations = activeIntegrations.filter((i) =>
    i.integration_key?.startsWith("nova:webhook:"),
  );
  const totalActive = enabledAutomations.length + webhookIntegrations.length;

  if (isLoading) {
    return (
      <div
        style={{
          borderRadius: 18,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          padding: 24,
          minHeight: 140,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader2
          style={{
            width: 18,
            height: 18,
            color: "var(--muted-foreground)",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    );
  }

  if (totalActive === 0 && automations.length === 0 && integrations.length === 0) {
    return (
      <div
        style={{
          borderRadius: 18,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          padding: 24,
          textAlign: "center",
        }}
      >
        <Zap
          style={{ width: 24, height: 24, color: "var(--muted-foreground)", margin: "0 auto 10px" }}
        />
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", marginBottom: 4 }}>
          No automations yet
        </div>
        <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 14 }}>
          Wire your first automation to start working on autopilot.
        </div>
        <Link to="/app/nova/workflows">
          <button
            style={{
              padding: "7px 16px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            Set up automations <ArrowRight style={{ width: 12, height: 12 }} />
          </button>
        </Link>
      </div>
    );
  }

  const statusColor = totalActive > 0 ? "#10b981" : "#f59e0b";
  const statusLabel = totalActive > 0 ? "Live" : "Setup needed";

  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid rgba(139,92,246,0.2)",
        background: "var(--surface)",
        padding: 20,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 150,
          height: 150,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(139,92,246,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#8b5cf6",
            background: "rgba(139,92,246,0.12)",
            padding: "3px 8px",
            borderRadius: 5,
          }}
        >
          Automations
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 10,
            fontWeight: 600,
            color: statusColor,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: statusColor,
              display: "inline-block",
              boxShadow: totalActive > 0 ? `0 0 6px ${statusColor}` : "none",
            }}
          />
          {statusLabel}
        </span>
        <Link
          to="/app/nova/workflows"
          style={{
            marginLeft: "auto",
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            fontSize: 11,
            color: "#8b5cf6",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          <Settings2 style={{ width: 11, height: 11 }} /> Manage
        </Link>
      </div>

      {/* Summary row */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}
      >
        {[
          { label: "Active", value: totalActive, color: "#10b981" },
          { label: "Automations", value: automations.length, color: "#8b5cf6" },
          { label: "Integrations", value: activeIntegrations.length, color: "#6366f1" },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "var(--surface-2)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: stat.value > 0 ? stat.color : "var(--muted-foreground)",
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: 10, color: "var(--muted-foreground)", marginTop: 3 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Automation list */}
      {automations.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {automations.slice(0, 4).map((a) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {a.enabled ? (
                <CheckCircle2 style={{ width: 13, height: 13, color: "#10b981", flexShrink: 0 }} />
              ) : (
                <Clock
                  style={{ width: 13, height: 13, color: "var(--muted-foreground)", flexShrink: 0 }}
                />
              )}
              <div
                style={{
                  fontSize: 12,
                  color: "var(--foreground)",
                  fontWeight: 500,
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {a.label ?? a.key ?? "Automation"}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: a.enabled ? "#10b981" : "var(--muted-foreground)",
                  flexShrink: 0,
                }}
              >
                {a.enabled ? "On" : "Off"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Integration badges */}
      {activeIntegrations.length > 0 && automations.length === 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {activeIntegrations.slice(0, 5).map((i) => (
            <span
              key={i.id}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 8px",
                borderRadius: 5,
                fontSize: 11,
                fontWeight: 600,
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.2)",
                color: "#10b981",
              }}
            >
              <CheckCircle2 style={{ width: 10, height: 10 }} />
              {i.value_hint ?? i.integration_key?.split(":").pop() ?? "Connected"}
            </span>
          ))}
        </div>
      )}

      <Link
        to="/app/nova/workflows"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 11.5,
          color: "#8b5cf6",
          fontWeight: 600,
          textDecoration: "none",
          marginTop: 12,
        }}
      >
        {totalActive === 0 ? "Set up automation" : "Open workflows"}{" "}
        <ArrowRight style={{ width: 11, height: 11 }} />
      </Link>
    </div>
  );
}
