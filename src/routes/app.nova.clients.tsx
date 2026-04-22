import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageHeader";
import { useAuth } from "@/lib/auth";
import { generatedAssetsQuery } from "@/lib/queries";

export const Route = createFileRoute("/app/nova/clients")({ component: Clients });

function Clients() {
  const { currentOrgId } = useAuth();
  const q = useQuery({ ...generatedAssetsQuery(currentOrgId ?? "", "ops"), enabled: !!currentOrgId });
  const items = q.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Nova OS" title="Client Onboarding" description="Ops plans and onboarding assets." />
      <div className="grid gap-4 lg:grid-cols-3">
        {items.length === 0 && <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground lg:col-span-3">No client assets yet.</div>}
        {items.map((c) => (
          <div key={c.id} className="rounded-xl border border-border bg-card p-5">
            <div className="text-sm font-semibold">{c.title}</div>
            <div className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
