import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { useAuth } from "@/lib/auth";
import { toolRunsQuery, usageQuery, leadsQuery } from "@/lib/queries";
import { BarChart3, CheckCircle2, XCircle, Activity, Users } from "lucide-react";

export const Route = createFileRoute("/app/nova/reports")({ component: Reports });

function Reports() {
  const { currentOrgId } = useAuth();
  const runsQ = useQuery({ ...toolRunsQuery(currentOrgId ?? "", 100), enabled: !!currentOrgId });
  const usageQ = useQuery({ ...usageQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const leadsQ = useQuery({ ...leadsQuery(currentOrgId ?? ""), enabled: !!currentOrgId });

  const runs = runsQ.data ?? [];
  const usage = usageQ.data ?? [];
  const leads = leadsQ.data ?? [];

  const totalGens = usage.reduce((s, r) => s + (r.count as number), 0);
  const succeeded = runs.filter((r) => r.status === "succeeded").length;
  const failed = runs.filter((r) => r.status === "failed").length;
  const successRate = runs.length ? Math.round((succeeded / runs.length) * 100) : 0;

  const wonValue = leads
    .filter((l) => l.stage === "Won")
    .reduce((s, l) => s + (Number(l.value) || 0), 0);
  const openPipeline = leads
    .filter((l) => l.stage !== "Lost" && l.stage !== "Won")
    .reduce((s, l) => s + (Number(l.value) || 0), 0);

  // Sort usage by count desc and compute share
  const sortedUsage = [...usage].sort((a, b) => (b.count as number) - (a.count as number));
  const maxCount = sortedUsage[0]?.count ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Nova OS"
        title="Reporting"
        description="Workspace activity, AI throughput, and pipeline performance."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPI icon={Activity} label="Generations (mo)" value={totalGens.toLocaleString()} />
        <KPI icon={CheckCircle2} label="Success rate" value={`${successRate}%`} accent="emerald" />
        <KPI icon={Users} label="Open pipeline" value={`$${openPipeline.toLocaleString()}`} />
        <KPI
          icon={BarChart3}
          label="Won value"
          value={`$${wonValue.toLocaleString()}`}
          accent="primary"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="font-display text-[14px] font-semibold tracking-tight">Usage by tool</div>
          <div className="mt-4 space-y-2.5">
            {sortedUsage.length === 0 && (
              <div className="text-[12.5px] text-muted-foreground">No usage this month yet.</div>
            )}
            {sortedUsage.map((u) => {
              const pct = maxCount ? ((u.count as number) / maxCount) * 100 : 0;
              return (
                <div key={u.id}>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="truncate text-foreground">{u.tool_key}</span>
                    <span className="font-mono text-muted-foreground">{u.count}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="font-display text-[14px] font-semibold tracking-tight">Run health</div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="Succeeded" value={succeeded} icon={CheckCircle2} tone="emerald" />
            <Stat label="Failed" value={failed} icon={XCircle} tone="rose" />
          </div>
          <div className="mt-5">
            {runs.length === 0 ? (
              <EmptyState
                variant="inline"
                icon={Activity}
                title="No runs yet"
                description="Activity will appear here once you generate your first output."
                className="py-6"
              />
            ) : (
              <div className="space-y-1.5">
                {runs.slice(0, 6).map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-[12px]">
                    <span className="truncate text-foreground/90">{r.tool_key}</span>
                    <span
                      className={
                        "ml-3 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium " +
                        (r.status === "succeeded"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : r.status === "failed"
                            ? "bg-rose-500/10 text-rose-400"
                            : "bg-amber-500/10 text-amber-400")
                      }
                    >
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: "primary" | "emerald";
}) {
  const tone =
    accent === "primary"
      ? "text-primary"
      : accent === "emerald"
        ? "text-emerald-400"
        : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className={"mt-1 font-display text-xl font-semibold tracking-tight " + tone}>
        {value}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "emerald" | "rose";
}) {
  const cls = tone === "emerald" ? "text-emerald-400" : "text-rose-400";
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-2 p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Icon className={"h-3 w-3 " + cls} /> {label}
      </div>
      <div className={"mt-1 font-display text-lg font-semibold " + cls}>{value}</div>
    </div>
  );
}
