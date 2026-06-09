import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { automationSettingsQuery, toolRunsQuery, leadsQuery, mentorKPIsQuery } from "@/lib/queries";
import { NOVA_SYSTEMS } from "@/lib/catalog";
import {
  Zap,
  TrendingUp,
  Users,
  Activity,
  ArrowRight,
  CheckCircle2,
  Circle,
  LayoutDashboard,
  Workflow,
  LayoutTemplate,
} from "lucide-react";

export const Route = createFileRoute("/app/command-center")({
  component: CommandCenterPage,
});

function CommandCenterPage() {
  const { currentOrgId, profile } = useAuth();
  const orgId = currentOrgId ?? "";

  const settingsQ = useQuery({ ...automationSettingsQuery(orgId), enabled: !!orgId });
  const kpisQ = useQuery({ ...mentorKPIsQuery(orgId), enabled: !!orgId });
  const leadsQ = useQuery({ ...leadsQuery(orgId), enabled: !!orgId });
  const runsQ = useQuery({ ...toolRunsQuery(orgId, 20), enabled: !!orgId });

  const settings = settingsQ.data ?? [];
  const settingsByKey = Object.fromEntries(settings.map((s) => [s.key, s]));
  const kpis = kpisQ.data;
  const leads = leadsQ.data ?? [];
  const recentRuns = (runsQ.data ?? []).slice(0, 8) as Array<{
    id: string;
    tool_key?: string;
    status: string;
    created_at: string;
  }>;

  const activeCount = settings.filter((s) => (s as { enabled?: boolean }).enabled).length;
  const wonLeads = leads.filter((l) => (l as { stage?: string }).stage === "Won").length;

  const name = profile?.full_name?.split(" ")[0] || "Operator";

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(125,211,252,0.08) 0%, rgba(167,139,250,0.04) 100%)",
          border: "1px solid rgba(125,211,252,0.18)",
        }}
      >
        <div
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(125,211,252,0.1) 0%, transparent 70%)",
          }}
        />
        <div className="relative">
          <div
            className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-widest mb-1"
            style={{ color: "rgba(125,211,252,0.7)" }}
          >
            <LayoutDashboard className="h-3 w-3" />
            Command Center
          </div>
          <h1
            className="font-display text-[22px] font-bold leading-tight"
            style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}
          >
            Welcome back, {name}
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--muted-foreground)" }}>
            {activeCount} automation{activeCount !== 1 ? "s" : ""} active · {leads.length} contacts
            in pipeline
          </p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Active Systems",
            value: activeCount,
            suffix: `/${NOVA_SYSTEMS.length}`,
            icon: Zap,
            color: "#7DD3FC",
          },
          {
            label: "Pipeline Value",
            value: kpis ? `$${(kpis.pipelineValue / 1000).toFixed(1)}k` : "—",
            suffix: "",
            icon: TrendingUp,
            color: "#34D399",
          },
          {
            label: "Total Contacts",
            value: leads.length,
            suffix: "",
            icon: Users,
            color: "#A78BFA",
          },
          {
            label: "Deals Won",
            value: wonLeads,
            suffix: "",
            icon: Activity,
            color: "#F5A623",
          },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl p-4 nova-card nova-card-hover">
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[9px] font-bold uppercase tracking-widest"
                style={{ color: "var(--muted-foreground)" }}
              >
                {kpi.label}
              </span>
              <kpi.icon className="h-3.5 w-3.5" style={{ color: kpi.color, opacity: 0.7 }} />
            </div>
            <div
              className="font-mono font-black text-[24px] leading-none"
              style={{ color: kpi.color }}
            >
              {kpi.value}
              {kpi.suffix && (
                <span
                  className="text-[13px] font-medium"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {kpi.suffix}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Automation systems status — 2 cols */}
        <div className="lg:col-span-2 rounded-xl p-5 nova-card space-y-3">
          <div className="flex items-center justify-between">
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "var(--muted-foreground)" }}
            >
              Automation Systems
            </span>
            <Link
              to="/app/nova-os"
              className="flex items-center gap-1 text-[11px]"
              style={{ color: "var(--muted-foreground)" }}
            >
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {NOVA_SYSTEMS.map((sys) => {
              const setting = settingsByKey[sys.slug];
              const isEnabled = (setting as { enabled?: boolean } | undefined)?.enabled ?? false;
              const isConfigured = setting != null;
              return (
                <Link
                  key={sys.slug}
                  to="/app/nova-os/$slug"
                  params={{ slug: sys.slug }}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/30"
                >
                  <div
                    className="h-7 w-7 rounded-md grid place-items-center shrink-0"
                    style={{
                      background: isEnabled
                        ? "rgba(52,211,153,0.1)"
                        : "rgba(var(--muted-foreground-rgb,150,150,150),0.08)",
                      border: `1px solid ${isEnabled ? "rgba(52,211,153,0.25)" : "var(--border)"}`,
                    }}
                  >
                    <sys.icon
                      className="h-3.5 w-3.5"
                      style={{ color: isEnabled ? "#34D399" : "var(--muted-foreground)" }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-medium truncate">{sys.name}</div>
                    <div
                      className="text-[10.5px] truncate"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {sys.trigger} → {sys.output}
                    </div>
                  </div>
                  {isEnabled ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: "#34D399" }} />
                  ) : isConfigured ? (
                    <Circle className="h-3.5 w-3.5 shrink-0" style={{ color: "#F5A623" }} />
                  ) : (
                    <Circle
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: "var(--muted-foreground)", opacity: 0.4 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Recent activity */}
          <div className="rounded-xl p-5 nova-card space-y-3">
            <div
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "var(--muted-foreground)" }}
            >
              Recent Activity
            </div>
            {recentRuns.length === 0 ? (
              <p className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                No activity yet
              </p>
            ) : (
              <div className="space-y-2">
                {recentRuns.map((run) => (
                  <div key={run.id} className="flex items-center gap-2">
                    <div
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{
                        background:
                          run.status === "succeeded"
                            ? "#34D399"
                            : run.status === "failed"
                              ? "#F87171"
                              : "#F5A623",
                      }}
                    />
                    <span className="text-[11.5px] truncate flex-1">{run.tool_key ?? "task"}</span>
                    <span
                      className="text-[10px] shrink-0"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {new Date(run.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="rounded-xl p-5 nova-card space-y-2">
            <div
              className="text-[10px] font-bold uppercase tracking-widest mb-3"
              style={{ color: "var(--muted-foreground)" }}
            >
              Quick links
            </div>
            {[
              { to: "/app/automations", label: "Automations", icon: Workflow },
              { to: "/app/templates", label: "Templates", icon: LayoutTemplate },
              { to: "/app/nova/crm", label: "Pipeline", icon: TrendingUp },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-muted/30"
              >
                <item.icon
                  className="h-3.5 w-3.5 shrink-0"
                  style={{ color: "var(--muted-foreground)" }}
                />
                <span className="text-[12.5px] font-medium">{item.label}</span>
                <ArrowRight
                  className="h-3 w-3 ml-auto"
                  style={{ color: "var(--muted-foreground)", opacity: 0.5 }}
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
