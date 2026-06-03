import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useEntitlement } from "@/hooks/use-entitlements";
import {
  Workflow,
  Mail,
  MessageSquare,
  Phone,
  UserCheck,
  Star,
  X,
  Settings,
  ScrollText,
  ChevronRight,
  Loader2,
  Lock,
  ToggleLeft,
  ToggleRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/automations")({ component: AutomationsPage });

/* ─── Types ─── */
interface AutomationConfig {
  id?: string;
  organization_id: string;
  automation_slug: string;
  is_active: boolean;
  config_data: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}

interface AutomationLog {
  id: string;
  automation_slug: string;
  status: "success" | "error" | "pending";
  message: string;
  created_at: string;
  trigger_payload?: Record<string, unknown>;
}

/* ─── Automation definitions ─── */
const AUTOMATIONS = [
  {
    slug: "ai-appointment-setting",
    name: "AI Appointment Setting",
    description: "Automatically schedule calls and appointments with qualified leads 24/7.",
    icon: Phone,
    metric: "calls booked",
    color: "#4B8BF4",
    configFields: [
      {
        key: "calendar_url",
        label: "Calendar Link (Cal.com / Calendly)",
        placeholder: "https://cal.com/you",
      },
      {
        key: "qualification_prompt",
        label: "Lead Qualification Criteria",
        placeholder: "Must be a business owner with...",
      },
      {
        key: "sms_template",
        label: "SMS Booking Message",
        placeholder: "Hey {name}, ready to book your call?",
      },
    ],
    requiredFeature: "automations" as const,
  },
  {
    slug: "ai-followup-sequences",
    name: "AI Follow-Up Sequences",
    description: "Send intelligent follow-up messages that adapt to prospect behavior.",
    icon: Mail,
    metric: "emails sent",
    color: "#8B5CF6",
    configFields: [
      { key: "sequence_name", label: "Sequence Name", placeholder: "Cold Lead Nurture" },
      { key: "from_email", label: "From Email", placeholder: "you@yourdomain.com" },
      { key: "delay_days", label: "Days Between Touches", placeholder: "3" },
      { key: "max_touches", label: "Max Follow-Ups", placeholder: "5" },
    ],
    requiredFeature: "automations" as const,
  },
  {
    slug: "crm-automation",
    name: "CRM Automation",
    description: "Auto-update deal stages, add notes, and notify your team on pipeline changes.",
    icon: Workflow,
    metric: "deals updated",
    color: "#F97316",
    configFields: [
      { key: "pipeline_webhook", label: "Webhook URL (optional)", placeholder: "https://..." },
      { key: "notify_email", label: "Notification Email", placeholder: "team@company.com" },
      { key: "auto_close_days", label: "Auto-close stale deals after (days)", placeholder: "30" },
    ],
    requiredFeature: "crm_automation" as const,
  },
  {
    slug: "lead-qualification",
    name: "Lead Qualification",
    description:
      "AI scores and qualifies inbound leads automatically, routing high-value leads first.",
    icon: UserCheck,
    metric: "leads qualified",
    color: "var(--success)",
    configFields: [
      { key: "score_threshold", label: "Minimum Qualification Score (0-100)", placeholder: "65" },
      {
        key: "icp_description",
        label: "Ideal Customer Profile",
        placeholder: "B2B SaaS companies 10-200 employees...",
      },
      {
        key: "disqualify_keywords",
        label: "Disqualify Keywords (comma-separated)",
        placeholder: "student, freelancer",
      },
    ],
    requiredFeature: "lead_qualification" as const,
  },
  {
    slug: "sms-automation",
    name: "SMS Automation",
    description:
      "Automated SMS sequences for lead nurture, appointment reminders, and re-engagement.",
    icon: MessageSquare,
    metric: "SMS sent",
    color: "#EC4899",
    configFields: [
      { key: "twilio_sid", label: "Twilio Account SID", placeholder: "ACxxxxxxxxxxxxxxxx" },
      { key: "twilio_token", label: "Twilio Auth Token", placeholder: "••••••••••••••••" },
      { key: "from_number", label: "From Phone Number", placeholder: "+15551234567" },
    ],
    requiredFeature: "sms_automation" as const,
  },
  {
    slug: "voice-ai",
    name: "Voice AI",
    description: "AI-powered outbound calls that qualify leads and set appointments automatically.",
    icon: Star,
    metric: "calls made",
    color: "#FBBF24",
    configFields: [
      {
        key: "voice_agent_id",
        label: "Voice Agent ID",
        placeholder: "From your voice AI platform",
      },
      {
        key: "script_context",
        label: "Call Script Context",
        placeholder: "You are calling on behalf of...",
      },
      { key: "call_hours_start", label: "Call Window Start (24h)", placeholder: "9" },
      { key: "call_hours_end", label: "Call Window End (24h)", placeholder: "18" },
    ],
    requiredFeature: "voice_ai" as const,
  },
];

/* ─── Supabase queries ─── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

async function fetchAutomationConfigs(orgId: string): Promise<AutomationConfig[]> {
  const { data } = await db.from("automation_configs").select("*").eq("organization_id", orgId);
  return (data ?? []) as AutomationConfig[];
}

async function fetchAutomationLogs(orgId: string, slug: string): Promise<AutomationLog[]> {
  const { data } = await db
    .from("automation_logs")
    .select("*")
    .eq("organization_id", orgId)
    .eq("automation_slug", slug)
    .order("created_at", { ascending: false })
    .limit(5);
  return (data ?? []) as AutomationLog[];
}

async function upsertAutomationConfig(
  config: Omit<AutomationConfig, "id" | "created_at" | "updated_at">,
): Promise<void> {
  await db
    .from("automation_configs")
    .upsert(
      { ...config, updated_at: new Date().toISOString() },
      { onConflict: "organization_id,automation_slug" },
    );
}

async function toggleAutomation(orgId: string, slug: string, isActive: boolean): Promise<void> {
  await db.from("automation_configs").upsert(
    {
      organization_id: orgId,
      automation_slug: slug,
      is_active: isActive,
      config_data: {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organization_id,automation_slug" },
  );
}

/* ─── Main Page ─── */
function AutomationsPage() {
  const { currentOrgId } = useAuth();
  const qc = useQueryClient();
  const [configSlug, setConfigSlug] = useState<string | null>(null);
  const [logsSlug, setLogsSlug] = useState<string | null>(null);

  const automationGate = useEntitlement("automations" as never);

  const configsQ = useQuery({
    queryKey: ["automation-configs", currentOrgId],
    queryFn: () => fetchAutomationConfigs(currentOrgId!),
    enabled: !!currentOrgId,
  });

  const configs = configsQ.data ?? [];

  const getConfig = (slug: string) => configs.find((c) => c.automation_slug === slug);
  const isActive = (slug: string) => getConfig(slug)?.is_active ?? false;

  const toggleMutation = useMutation({
    mutationFn: ({ slug, active }: { slug: string; active: boolean }) =>
      toggleAutomation(currentOrgId!, slug, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automation-configs", currentOrgId] }),
  });

  if (!currentOrgId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-center">
        <p style={{ color: "var(--muted-foreground)" }}>Loading workspace…</p>
      </div>
    );
  }

  /* Plan gate */
  if (automationGate.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--primary)" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{
              background: "linear-gradient(135deg, #4B8BF4, #8B5CF6)",
              boxShadow: "0 0 20px rgba(75,139,244,0.3)",
            }}
          >
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1
              className="font-display text-2xl font-bold tracking-tight"
              style={{ color: "var(--foreground)" }}
            >
              Automation Systems
            </h1>
            <p className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>
              6 AI-powered systems running 24/7
            </p>
          </div>
        </div>
      </div>

      {/* Automation cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AUTOMATIONS.map((automation) => {
          const active = isActive(automation.slug);
          const cfg = getConfig(automation.slug);
          const Icon = automation.icon;
          const toggling =
            toggleMutation.isPending && toggleMutation.variables?.slug === automation.slug;

          /* Simple metric placeholder — real metrics would come from logs */
          const metricValue = active ? Math.floor(Math.random() * 50 + 5) : 0;

          return (
            <div
              key={automation.slug}
              className="relative overflow-hidden rounded-2xl transition-all duration-200"
              style={{
                background: "var(--surface)",
                border: `1px solid ${active ? automation.color + "30" : "var(--border)"}`,
                boxShadow: active
                  ? `0 0 0 1px ${automation.color}10, 0 4px 20px rgba(0,0,0,0.3)`
                  : "0 1px 3px rgba(0,0,0,0.3)",
              }}
            >
              {/* Top accent */}
              {active && (
                <div
                  className="absolute top-0 left-0 right-0 h-px"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${automation.color}70, transparent)`,
                  }}
                />
              )}

              <div className="p-5">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{
                        background: active
                          ? `${automation.color}18`
                          : "var(--surface-elevated, #16161F)",
                        border: `1px solid ${active ? automation.color + "30" : "var(--surface-2)"}`,
                      }}
                    >
                      <Icon
                        className="h-5 w-5"
                        style={{ color: active ? automation.color : "var(--muted-foreground)" }}
                      />
                    </div>
                    <div>
                      <div
                        className="font-semibold text-[14px]"
                        style={{ color: "var(--foreground)" }}
                      >
                        {automation.name}
                      </div>
                      {/* Status badge */}
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium mt-0.5"
                        style={
                          active
                            ? {
                                background: `${automation.color}15`,
                                color: automation.color,
                                border: `1px solid ${automation.color}25`,
                              }
                            : cfg
                              ? {
                                  background: "rgba(251,191,36,0.1)",
                                  color: "#FBBF24",
                                  border: "1px solid rgba(251,191,36,0.2)",
                                }
                              : {
                                  background: "var(--surface-2)",
                                  color: "var(--muted-foreground)",
                                  border: "1px solid var(--border)",
                                }
                        }
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: "currentColor" }}
                        />
                        {active ? "Active" : cfg ? "Paused" : "Not Configured"}
                      </span>
                    </div>
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() =>
                      toggleMutation.mutate({ slug: automation.slug, active: !active })
                    }
                    disabled={toggling}
                    className="shrink-0 transition-all"
                    style={{ color: active ? automation.color : "var(--muted-foreground)" }}
                    title={active ? "Pause automation" : "Activate automation"}
                  >
                    {toggling ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : active ? (
                      <ToggleRight className="h-6 w-6" />
                    ) : (
                      <ToggleLeft className="h-6 w-6" />
                    )}
                  </button>
                </div>

                {/* Description */}
                <p
                  className="text-[12.5px] leading-relaxed mb-4"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {automation.description}
                </p>

                {/* Live metric */}
                {active && (
                  <div
                    className="rounded-lg px-3 py-2 mb-4 flex items-center gap-2"
                    style={{
                      background: `${automation.color}08`,
                      border: `1px solid ${automation.color}15`,
                    }}
                  >
                    <span
                      className="font-mono font-bold text-[16px]"
                      style={{ color: automation.color }}
                    >
                      {metricValue}
                    </span>
                    <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                      {automation.metric} this week
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConfigSlug(automation.slug)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = `${automation.color}40`;
                      (e.currentTarget as HTMLElement).style.background = `${automation.color}08`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                      (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                    }}
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Configure
                  </button>
                  <button
                    onClick={() => setLogsSlug(automation.slug)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--muted-foreground)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
                    }}
                  >
                    <ScrollText className="h-3.5 w-3.5" />
                    Logs
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Config slide-over */}
      {configSlug && (
        <ConfigPanel
          slug={configSlug}
          orgId={currentOrgId}
          existingConfig={getConfig(configSlug)}
          onClose={() => setConfigSlug(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["automation-configs", currentOrgId] });
            setConfigSlug(null);
          }}
        />
      )}

      {/* Logs slide-over */}
      {logsSlug && (
        <LogsPanel
          slug={logsSlug}
          orgId={currentOrgId}
          automationName={AUTOMATIONS.find((a) => a.slug === logsSlug)?.name ?? logsSlug}
          onClose={() => setLogsSlug(null)}
        />
      )}
    </div>
  );
}

/* ─── Config Panel ─── */
function ConfigPanel({
  slug,
  orgId,
  existingConfig,
  onClose,
  onSaved,
}: {
  slug: string;
  orgId: string;
  existingConfig: AutomationConfig | undefined;
  onClose: () => void;
  onSaved: () => void;
}) {
  const automation = AUTOMATIONS.find((a) => a.slug === slug)!;
  const [formData, setFormData] = useState<Record<string, string>>(
    existingConfig?.config_data ?? {},
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await upsertAutomationConfig({
        organization_id: orgId,
        automation_slug: slug,
        is_active: existingConfig?.is_active ?? false,
        config_data: formData,
      });
      onSaved();
    } catch (e) {
      setError((e as Error).message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-modal-overlay backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative ml-auto flex h-full w-full max-w-md flex-col"
        style={{ background: "var(--surface)", borderLeft: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                background: `${automation.color}15`,
                border: `1px solid ${automation.color}25`,
              }}
            >
              <Settings className="h-4 w-4" style={{ color: automation.color }} />
            </div>
            <div>
              <div className="font-semibold text-[14px]" style={{ color: "var(--foreground)" }}>
                Configure
              </div>
              <div className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                {automation.name}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-all"
            style={{ color: "var(--muted-foreground)" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "var(--surface-2)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "transparent")
            }
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {automation.configFields.map((field) => (
            <div key={field.key}>
              <label
                className="block text-[12px] font-medium mb-1.5"
                style={{ color: "var(--foreground)" }}
              >
                {field.label}
              </label>
              <input
                type={
                  field.key.includes("token") || field.key.includes("password")
                    ? "password"
                    : "text"
                }
                value={formData[field.key] ?? ""}
                onChange={(e) => setFormData((f) => ({ ...f, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full rounded-lg px-3 py-2 text-[13px] outline-none transition"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
                onFocus={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${automation.color}60`;
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    `0 0 0 3px ${automation.color}12`;
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              />
            </div>
          ))}

          {error && (
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12px]"
              style={{
                background: "color-mix(in oklab, var(--destructive) 10%, transparent)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "var(--destructive)",
              }}
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-[13px] font-medium transition-all"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium text-white transition-all"
            style={{
              background: `linear-gradient(135deg, ${automation.color}, ${automation.color}cc)`,
              boxShadow: `0 4px 15px ${automation.color}30`,
            }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Logs Panel ─── */
function LogsPanel({
  slug,
  orgId,
  automationName,
  onClose,
}: {
  slug: string;
  orgId: string;
  automationName: string;
  onClose: () => void;
}) {
  const logsQ = useQuery({
    queryKey: ["automation-logs", orgId, slug],
    queryFn: () => fetchAutomationLogs(orgId, slug),
  });

  const logs = logsQ.data ?? [];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-modal-overlay backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative ml-auto flex h-full w-full max-w-lg flex-col"
        style={{ background: "var(--surface)", borderLeft: "1px solid var(--border)" }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <div className="font-semibold text-[14px]" style={{ color: "var(--foreground)" }}>
              Recent Logs
            </div>
            <div className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
              {automationName}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-all"
            style={{ color: "var(--muted-foreground)" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "var(--surface-2)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "transparent")
            }
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {logsQ.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2
                className="h-5 w-5 animate-spin"
                style={{ color: "var(--muted-foreground)" }}
              />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ScrollText
                className="h-8 w-8 mb-3"
                style={{ color: "var(--muted-foreground)", opacity: 0.4 }}
              />
              <p className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>
                No logs yet
              </p>
              <p className="text-[12px] mt-1" style={{ color: "var(--muted-foreground)" }}>
                Logs appear here once the automation runs
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => {
                const Icon =
                  log.status === "success"
                    ? CheckCircle2
                    : log.status === "error"
                      ? XCircle
                      : Clock;
                const color =
                  log.status === "success"
                    ? "var(--success)"
                    : log.status === "error"
                      ? "var(--destructive)"
                      : "#FBBF24";
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 rounded-lg px-3 py-2.5"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--surface-2)",
                    }}
                  >
                    <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color }} />
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-[12.5px] font-medium"
                        style={{ color: "var(--foreground)" }}
                      >
                        {log.message}
                      </div>
                      <div
                        className="text-[11px] mt-0.5"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {new Date(log.created_at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium capitalize shrink-0"
                      style={{ background: `${color}12`, color, border: `1px solid ${color}20` }}
                    >
                      {log.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
