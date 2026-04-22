import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageHeader";
import { useAuth } from "@/lib/auth";
import { toolRunsQuery } from "@/lib/queries";

export const Route = createFileRoute("/app/launchpad/history")({ component: History });

function History() {
  const { currentOrgId } = useAuth();
  const q = useQuery({ ...toolRunsQuery(currentOrgId ?? "", 100), enabled: !!currentOrgId });
  const runs = q.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Launchpad" title="History" description="Every output you've generated." actions={<Link to="/app/launchpad" className="text-sm text-muted-foreground hover:text-foreground">← Back</Link>} />
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {runs.length === 0 && <div className="px-4 py-6 text-center text-sm text-muted-foreground">No runs yet.</div>}
        {runs.map((r) => (
          <div key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <div className="font-medium">{r.tool_key}</div>
              <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()} · {r.status}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
