import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageHeader";
import { useAuth } from "@/lib/auth";
import { generatedAssetsQuery } from "@/lib/queries";

export const Route = createFileRoute("/app/nova/crm")({ component: CRM });

function CRM() {
  const { currentOrgId } = useAuth();
  const q = useQuery({ ...generatedAssetsQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const items = q.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Nova OS" title="CRM Pipeline" description="Generated assets ready to move through your pipeline." />
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {items.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No assets yet. Run a Launchpad tool to populate your pipeline.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground"><tr><th className="px-4 py-2.5 text-left">Title</th><th className="px-4 py-2.5 text-left">Category</th><th className="px-4 py-2.5 text-left">Created</th></tr></thead>
            <tbody className="divide-y divide-border">
              {items.map((a) => (
                <tr key={a.id} className="hover:bg-accent/50">
                  <td className="px-4 py-2.5 font-medium">{a.title}</td>
                  <td className="px-4 py-2.5">{a.category}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
