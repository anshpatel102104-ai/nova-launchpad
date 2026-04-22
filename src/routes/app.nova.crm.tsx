import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { leadsQuery } from "@/lib/queries";
import { Building2, Mail, Phone, Plus, KanbanSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/nova/crm")({ component: CRM });

const STAGES = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"] as const;
type Stage = (typeof STAGES)[number];

const STAGE_TONE: Record<Stage, string> = {
  New: "border-l-muted-foreground/40",
  Contacted: "border-l-blue-500/60",
  Qualified: "border-l-violet-500/60",
  Proposal: "border-l-amber-500/60",
  Won: "border-l-emerald-500/60",
  Lost: "border-l-rose-500/60",
};

function CRM() {
  const { currentOrgId } = useAuth();
  const q = useQuery({ ...leadsQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const leads = q.data ?? [];

  const buckets = STAGES.map((s) => ({
    stage: s,
    items: leads.filter((l) => l.stage === s),
    value: leads.filter((l) => l.stage === s).reduce((sum, l) => sum + (Number(l.value) || 0), 0),
  }));

  const totalPipeline = leads
    .filter((l) => l.stage !== "Lost")
    .reduce((sum, l) => sum + (Number(l.value) || 0), 0);
  const wonValue = leads.filter((l) => l.stage === "Won").reduce((s, l) => s + (Number(l.value) || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Nova OS"
        title="Pipeline"
        description="Move deals through your funnel. Drag-ready cards, real conversion data."
        actions={
          <Link to="/app/nova/leads">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> New lead
            </Button>
          </Link>
        }
      />

      {/* KPI strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        <KPI label="Open pipeline" value={`$${totalPipeline.toLocaleString()}`} />
        <KPI label="Won this period" value={`$${wonValue.toLocaleString()}`} />
        <KPI label="Active deals" value={leads.filter((l) => l.stage !== "Lost" && l.stage !== "Won").length.toString()} />
      </div>

      {leads.length === 0 ? (
        <EmptyState
          icon={KanbanSquare}
          title="Your pipeline is empty"
          description="Add your first lead or capture inbound from a Launchpad output to start tracking conversions."
          action={
            <Link to="/app/nova/leads">
              <Button size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add a lead
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="-mx-1 flex gap-3 overflow-x-auto pb-2 px-1">
          {buckets.map(({ stage, items, value }) => (
            <div
              key={stage}
              className="flex w-[280px] shrink-0 flex-col rounded-xl border border-border bg-surface/40"
            >
              <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[12.5px] font-semibold tracking-tight">{stage}</span>
                  <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10.5px] font-medium text-muted-foreground">
                    {items.length}
                  </span>
                </div>
                {value > 0 && (
                  <span className="font-mono text-[10.5px] text-muted-foreground">
                    ${value.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-2 min-h-[120px]">
                {items.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center text-[11.5px] text-muted-foreground/60">
                    No deals
                  </div>
                ) : (
                  items.map((l) => (
                    <div
                      key={l.id}
                      className={cn(
                        "rounded-lg border border-border bg-surface px-3 py-2.5 shadow-soft border-l-2 cursor-grab",
                        STAGE_TONE[l.stage as Stage],
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-medium">{l.name}</div>
                          {l.source && (
                            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              <span className="truncate">{l.source}</span>
                            </div>
                          )}
                        </div>
                        {l.value ? (
                          <span className="shrink-0 font-mono text-[11px] font-medium text-foreground/90">
                            ${Number(l.value).toLocaleString()}
                          </span>
                        ) : null}
                      </div>
                      {(l.email || l.phone) && (
                        <div className="mt-2 flex items-center gap-2 text-[10.5px] text-muted-foreground">
                          {l.email && (
                            <span className="inline-flex items-center gap-1 truncate">
                              <Mail className="h-2.5 w-2.5" />
                              {l.email}
                            </span>
                          )}
                          {l.phone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-2.5 w-2.5" />
                              {l.phone}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="mt-2 text-[10px] text-muted-foreground/70">
                        {new Date(l.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}
