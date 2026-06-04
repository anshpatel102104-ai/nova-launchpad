import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { toolRunsQuery, leadsQuery } from "@/lib/queries";
import { BarChart3, CheckCircle2, XCircle, Users, Zap, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/app/scale/reports")({
  component: ScaleReports,
});

function ScaleReports() {
  const { currentOrgId } = useAuth();
  const runsQ = useQuery({ ...toolRunsQuery(currentOrgId ?? "", 100), enabled: !!currentOrgId });
  const leadsQ = useQuery({ ...leadsQuery(currentOrgId ?? ""), enabled: !!currentOrgId });

  const runs = (runsQ.data ?? []) as Array<{
    id: string;
    tool_key?: string;
    status: string;
    created_at: string;
  }>;
  const leads = (leadsQ.data ?? []) as Array<{ id: string; stage?: string; created_at: string }>;

  const succeeded = runs.filter((r) => r.status === "succeeded").length;
  const failed = runs.filter((r) => r.status === "failed").length;
  const wonLeads = leads.filter((l) => l.stage === "Won").length;

  // Group runs by tool
  const toolCounts: Record<string, number> = {};
  for (const run of runs) {
    if (run.status === "succeeded" && run.tool_key) {
      toolCounts[run.tool_key] = (toolCounts[run.tool_key] ?? 0) + 1;
    }
  }
  const topTools = Object.entries(toolCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  // Last 7 days activity
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const count = runs.filter((r) => {
      const rd = new Date(r.created_at);
      return (
        rd.getDate() === d.getDate() &&
        rd.getMonth() === d.getMonth() &&
        rd.getFullYear() === d.getFullYear() &&
        r.status === "succeeded"
      );
    }).length;
    return { label: dateStr, count };
  });
  const maxDay = Math.max(...last7.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div
          className="text-[10px] font-mono font-bold uppercase tracking-widest mb-0.5"
          style={{ color: "rgba(251,146,60,0.65)" }}
        >
          ● Scale Mode · Reports
        </div>
        <h1
          className="font-display text-[20px] font-bold"
          style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}
        >
          Analytics & Reports
        </h1>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Runs", value: runs.length, icon: Zap, color: "#FF6B1A" },
          { label: "Succeeded", value: succeeded, icon: CheckCircle2, color: "#34D399" },
          { label: "Failed", value: failed, icon: XCircle, color: "#F87171" },
          { label: "Leads Won", value: wonLeads, icon: Users, color: "#7DD3FC" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl p-4 nova-card">
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
              className="font-mono font-black text-[26px] leading-none"
              style={{ color: kpi.color }}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Activity chart */}
        <div className="rounded-xl p-5 nova-card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4" style={{ color: "#FF6B1A" }} />
            <div
              className="text-[11px] font-bold uppercase tracking-wide"
              style={{ color: "var(--muted-foreground)" }}
            >
              Activity — Last 7 Days
            </div>
          </div>
          <div className="flex items-end gap-2" style={{ height: 100 }}>
            {last7.map((day) => (
              <div key={day.label} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-sm transition-all"
                  style={{
                    height: `${(day.count / maxDay) * 80}px`,
                    minHeight: day.count > 0 ? 4 : 2,
                    background:
                      day.count > 0
                        ? "linear-gradient(180deg, #FF6B1A, #F5A623)"
                        : "rgba(245,200,140,0.08)",
                    boxShadow: day.count > 0 ? "0 0 8px rgba(249,115,22,0.35)" : "none",
                  }}
                />
                <span
                  className="text-[9px]"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {day.label.split(" ")[1]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top tools */}
        <div className="rounded-xl p-5 nova-card">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4" style={{ color: "#7DD3FC" }} />
            <div
              className="text-[11px] font-bold uppercase tracking-wide"
              style={{ color: "var(--muted-foreground)" }}
            >
              Top Tools Used
            </div>
          </div>
          {topTools.length === 0 ? (
            <div
              className="text-center py-8 text-[12.5px]"
              style={{ color: "var(--muted-foreground)" }}
            >
              Run tools to see analytics here
            </div>
          ) : (
            <div className="space-y-2.5">
              {topTools.map(([toolKey, count]) => {
                const label = toolKey
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase());
                const pct = (count / (topTools[0]?.[1] ?? 1)) * 100;
                return (
                  <div key={toolKey}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-medium" style={{ color: "var(--foreground)" }}>
                        {label}
                      </span>
                      <span className="text-[11px] font-mono" style={{ color: "#7DD3FC" }}>
                        {count}×
                      </span>
                    </div>
                    <div
                      className="rounded-full overflow-hidden"
                      style={{ height: 3, background: "rgba(245,200,140,0.08)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: "#7DD3FC",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent runs */}
      {runs.length > 0 && (
        <div className="rounded-xl p-5 nova-card">
          <div
            className="text-[10px] font-bold uppercase tracking-widest mb-4"
            style={{ color: "var(--muted-foreground)" }}
          >
            Recent Tool Runs
          </div>
          <div className="space-y-2">
            {runs.slice(0, 10).map((run) => (
              <div key={run.id} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                <div
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{
                    background:
                      run.status === "succeeded"
                        ? "var(--success)"
                        : run.status === "failed"
                          ? "var(--destructive)"
                          : "var(--warning)",
                  }}
                />
                <span className="flex-1 text-[12px] font-medium truncate" style={{ color: "var(--foreground)" }}>
                  {(run.tool_key ?? "tool").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                  style={{
                    background:
                      run.status === "succeeded"
                        ? "color-mix(in oklab, var(--success) 12%, transparent)"
                        : "color-mix(in oklab, var(--destructive) 12%, transparent)",
                    color: run.status === "succeeded" ? "var(--success)" : "var(--destructive)",
                  }}
                >
                  {run.status}
                </span>
                <span className="text-[10px] shrink-0" style={{ color: "var(--muted-foreground)" }}>
                  {new Date(run.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
