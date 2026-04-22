import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageHeader";
import { useAuth } from "@/lib/auth";
import { generatedAssetsQuery } from "@/lib/queries";

export const Route = createFileRoute("/app/nova/leads")({ component: Leads });

function Leads() {
  const { currentOrgId } = useAuth();
  const q = useQuery({ ...generatedAssetsQuery(currentOrgId ?? "", "gtm"), enabled: !!currentOrgId });
  const items = q.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Nova OS" title="Leads" description="GTM outputs and leads captured." />
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {items.length === 0 && <div className="px-4 py-6 text-center text-sm text-muted-foreground">No leads yet.</div>}
        {items.map((a) => (
          <div key={a.id} className="px-4 py-3 text-sm">
            <div className="font-medium">{a.title}</div>
            <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
