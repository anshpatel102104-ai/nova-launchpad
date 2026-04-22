import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageHeader";
import { useAuth } from "@/lib/auth";
import { toolRunsQuery, usageQuery } from "@/lib/queries";

export const Route = createFileRoute("/app/nova/reports")({ component: Reports });

function Reports() {
  const { currentOrgId } = useAuth();
  const runsQ = useQuery({ ...toolRunsQuery(currentOrgId ?? "", 100), enabled: !!currentOrgId });
  const usageQ = useQuery({ ...usageQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const runs = runsQ.data ?? [];
  const usage = usageQ.data ?? [];
  const totalGens = usage.reduce((s, r) => s + (r.count as number), 0);
  const succeeded = runs.filter((r) => r.status === "succeeded").length;
  const failed = runs.filter((r) => r.status === "failed").length;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Nova OS" title="Reports" description="Workspace activity at a glance." />
      <div className="grid gap-3 sm:grid-cols-4">
        <KPI label="Generations (mo)" value={totalGens.toString()} />
        <KPI label="Total runs" value={runs.length.toString()} />
        <KPI label="Succeeded" value={succeeded.toString()} />
        <KPI label="Failed" value={failed.toString()} />
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 text-sm font-semibold">Usage by tool</div>
        <div className="space-y-2 text-sm">
          {usage.length === 0 && <div className="text-muted-foreground">No usage this month.</div>}
          {usage.map((u) => (
            <div key={u.id} className="flex items-center justify-between"><span>{u.tool_key}</span><span className="font-medium">{u.count}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-card p-4"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 text-2xl font-semibold">{value}</div></div>;
}
