import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { leads, type Lead } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Table as TableIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/nova/crm")({
  component: CRM,
});

const STAGES: Lead["stage"][] = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"];

function CRM() {
  const [view, setView] = useState<"kanban" | "table">("kanban");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Nova OS"
        title="CRM Pipeline"
        description="Every lead, every deal, every stage — in one place."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-border bg-card p-0.5">
              <button onClick={() => setView("kanban")} className={cn("flex items-center gap-1 rounded px-2 py-1 text-xs", view === "kanban" && "bg-accent")}>
                <LayoutGrid className="h-3.5 w-3.5" /> Kanban
              </button>
              <button onClick={() => setView("table")} className={cn("flex items-center gap-1 rounded px-2 py-1 text-xs", view === "table" && "bg-accent")}>
                <TableIcon className="h-3.5 w-3.5" /> Table
              </button>
            </div>
            <Button size="sm"><Plus className="h-4 w-4" /> New deal</Button>
          </div>
        }
      />

      {view === "kanban" ? (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          {STAGES.map((stage) => {
            const items = leads.filter((l) => l.stage === stage);
            return (
              <div key={stage} className="rounded-xl border border-border bg-muted/30 p-2.5">
                <div className="mb-2 flex items-center justify-between px-1">
                  <div className="text-xs font-semibold">{stage}</div>
                  <div className="text-[10px] text-muted-foreground">{items.length}</div>
                </div>
                <div className="space-y-2">
                  {items.length === 0 ? (
                    <div className="rounded-md border border-dashed border-border p-3 text-center text-[11px] text-muted-foreground">Empty</div>
                  ) : (
                    items.map((l) => (
                      <div key={l.id} className="rounded-md border border-border bg-card p-2.5 shadow-soft cursor-pointer hover:border-foreground/20">
                        <div className="text-sm font-medium">{l.name}</div>
                        <div className="text-[11px] text-muted-foreground">{l.company}</div>
                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">{l.source}</span>
                          <span className="font-medium">${(l.value / 1000).toFixed(0)}k</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                {["Lead", "Company", "Stage", "Source", "Value", "Last touch"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.map((l) => (
                <tr key={l.id} className="hover:bg-accent/50">
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{l.name}</div>
                    <div className="text-xs text-muted-foreground">{l.email}</div>
                  </td>
                  <td className="px-4 py-2.5">{l.company}</td>
                  <td className="px-4 py-2.5"><StageBadge stage={l.stage} /></td>
                  <td className="px-4 py-2.5 text-muted-foreground">{l.source}</td>
                  <td className="px-4 py-2.5 font-medium">${l.value.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{l.lastTouch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StageBadge({ stage }: { stage: Lead["stage"] }) {
  const cls: Record<Lead["stage"], string> = {
    New: "bg-muted text-foreground",
    Contacted: "bg-launchpad/10 text-launchpad",
    Qualified: "bg-nova/10 text-nova",
    Proposal: "bg-warning/15 text-warning-foreground",
    Won: "bg-success/15 text-success",
    Lost: "bg-destructive/10 text-destructive",
  };
  return <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", cls[stage])}>{stage}</span>;
}
