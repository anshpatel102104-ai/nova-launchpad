import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { leads } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { Plus, Inbox, Globe, Users as UsersIcon } from "lucide-react";

export const Route = createFileRoute("/app/nova/leads")({
  component: Leads,
});

function Leads() {
  const sourceCounts = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.source] = (acc[l.source] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Nova OS"
        title="Leads"
        description="Capture forms, inbound channels, and your live lead inbox."
        actions={<Button size="sm"><Plus className="h-4 w-4" /> New capture form</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold"><Globe className="h-4 w-4 text-nova" /> Capture forms</div>
          <div className="mt-3 space-y-2 text-sm">
            <FormRow name="Homepage hero" submissions={48} />
            <FormRow name="Pricing CTA" submissions={22} />
            <FormRow name="Demo request" submissions={14} />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold"><UsersIcon className="h-4 w-4 text-nova" /> Sources</div>
          <div className="mt-3 space-y-2 text-sm">
            {Object.entries(sourceCounts).map(([s, n]) => (
              <div key={s} className="flex items-center justify-between">
                <span className="text-muted-foreground">{s}</span>
                <span className="font-medium">{n}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold"><Inbox className="h-4 w-4 text-nova" /> SLA</div>
          <div className="mt-3 text-3xl font-semibold">63s</div>
          <div className="text-xs text-muted-foreground">avg response · target &lt;90s</div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div className="text-sm font-semibold">Lead inbox</div>
          <div className="text-xs text-muted-foreground">{leads.length} total</div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Name</th>
              <th className="px-4 py-2 text-left font-medium">Email</th>
              <th className="px-4 py-2 text-left font-medium">Source</th>
              <th className="px-4 py-2 text-left font-medium">Stage</th>
              <th className="px-4 py-2 text-left font-medium">Last touch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {leads.map((l) => (
              <tr key={l.id} className="hover:bg-accent/50">
                <td className="px-4 py-2.5 font-medium">{l.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{l.email}</td>
                <td className="px-4 py-2.5">{l.source}</td>
                <td className="px-4 py-2.5">{l.stage}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{l.lastTouch}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FormRow({ name, submissions }: { name: string; submissions: number }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border px-2.5 py-2">
      <span>{name}</span>
      <span className="text-xs text-muted-foreground">{submissions} this week</span>
    </div>
  );
}
