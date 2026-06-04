import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { leadsQuery } from "@/lib/queries";
import { Building2, Mail, Phone, Plus, KanbanSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/scale/pipeline")({
  component: ScalePipeline,
});

const STAGES = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"] as const;
type Stage = (typeof STAGES)[number];

const STAGE_COLORS: Record<Stage, string> = {
  New: "#9CA3AF",
  Contacted: "#7DD3FC",
  Qualified: "#A78BFA",
  Proposal: "#F5A623",
  Won: "#34D399",
  Lost: "#F87171",
};

function ScalePipeline() {
  const { currentOrgId } = useAuth();
  const q = useQuery({ ...leadsQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const leads = (q.data ?? []) as Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    stage?: string;
    created_at: string;
  }>;

  const buckets = STAGES.map((s) => ({
    stage: s,
    leads: leads.filter((l) => (l.stage ?? "New") === s),
  }));

  const totalValue = buckets.filter((b) => b.stage === "Won").flatMap((b) => b.leads).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div
            className="text-[10px] font-mono font-bold uppercase tracking-widest mb-0.5"
            style={{ color: "rgba(52,211,153,0.65)" }}
          >
            ● Scale Mode · Pipeline
          </div>
          <h1
            className="font-display text-[20px] font-bold"
            style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}
          >
            Sales Pipeline
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="text-[12px] px-3 py-1.5 rounded-xl font-mono"
            style={{
              background: "color-mix(in oklab, #34D399 10%, transparent)",
              border: "1px solid color-mix(in oklab, #34D399 25%, transparent)",
              color: "#34D399",
            }}
          >
            {leads.length} leads · {totalValue} won
          </div>
          <Link
            to="/app/nova/crm"
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold nova-card nova-card-hover"
            style={{ color: "var(--muted-foreground)" }}
          >
            <KanbanSquare className="h-3.5 w-3.5" />
            Full CRM
          </Link>
        </div>
      </div>

      {/* Kanban board */}
      {q.isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {STAGES.map((s) => (
            <div key={s} className="rounded-xl p-3 nova-card" style={{ minHeight: 120 }}>
              <div
                className="text-[10px] font-bold uppercase tracking-wide mb-2"
                style={{ color: "var(--muted-foreground)" }}
              >
                {s}
              </div>
              <div className="space-y-2">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className="h-16 rounded-lg animate-pulse"
                    style={{ background: "rgba(245,200,140,0.06)" }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {buckets.map(({ stage, leads: stagLeads }) => (
            <div key={stage} className="rounded-xl p-3 nova-card" style={{ minHeight: 120 }}>
              <div className="flex items-center justify-between mb-2">
                <div
                  className="text-[10px] font-bold uppercase tracking-wide"
                  style={{ color: STAGE_COLORS[stage] }}
                >
                  {stage}
                </div>
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded-full"
                  style={{
                    background: `color-mix(in oklab, ${STAGE_COLORS[stage]} 12%, transparent)`,
                    color: STAGE_COLORS[stage],
                  }}
                >
                  {stagLeads.length}
                </span>
              </div>

              <div className="space-y-2">
                {stagLeads.slice(0, 5).map((lead) => (
                  <div
                    key={lead.id}
                    className="rounded-lg p-2.5"
                    style={{
                      background: "rgba(245,200,140,0.04)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      className="text-[11.5px] font-medium truncate leading-tight"
                      style={{ color: "var(--foreground)" }}
                    >
                      {lead.name}
                    </div>
                    {lead.company && (
                      <div
                        className="text-[10px] truncate mt-0.5 flex items-center gap-1"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        <Building2 className="h-2.5 w-2.5 shrink-0" />
                        {lead.company}
                      </div>
                    )}
                    {lead.email && (
                      <div
                        className="text-[10px] truncate mt-0.5 flex items-center gap-1"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        <Mail className="h-2.5 w-2.5 shrink-0" />
                        {lead.email}
                      </div>
                    )}
                  </div>
                ))}
                {stagLeads.length > 5 && (
                  <div
                    className="text-[10px] text-center py-1"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    +{stagLeads.length - 5} more
                  </div>
                )}
                {stagLeads.length === 0 && (
                  <div
                    className="text-[10px] text-center py-3"
                    style={{ color: "rgba(245,200,140,0.25)" }}
                  >
                    No leads
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
