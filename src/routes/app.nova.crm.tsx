import React, { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  X,
  Building2,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  DollarSign,
  Target,
  Loader2,
  Trash2,
  SlidersHorizontal,
  Tag,
  FileText,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { leadsQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { blockIfGuest } from "@/lib/guest";

export const Route = createFileRoute("/app/nova/crm")({ component: CRMPage });

/* ── Types ── */
const STAGES = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"] as const;
type Stage = (typeof STAGES)[number];

interface Deal {
  id: string;
  organization_id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  notes: string | null;
  stage: Stage;
  value: number | null;
  probability: number;
  close_date: string | null;
  created_at: string;
  updated_at: string;
}

/* ── Stage config ── */
const STAGE_CONFIG: Record<Stage, { color: string; bg: string; text: string; dot: string }> = {
  New: { color: "#6B7280", bg: "rgba(107,114,128,0.10)", text: "#374151", dot: "#6B7280" },
  Contacted: { color: "#3B82F6", bg: "rgba(59,130,246,0.10)", text: "#1D4ED8", dot: "#3B82F6" },
  Qualified: { color: "#7C3AED", bg: "rgba(124,58,237,0.10)", text: "#5B21B6", dot: "#7C3AED" },
  Proposal: { color: "#D97706", bg: "rgba(217,119,6,0.10)", text: "#92400E", dot: "#D97706" },
  Won: { color: "#059669", bg: "rgba(5,150,105,0.10)", text: "#065F46", dot: "#059669" },
  Lost: { color: "#DC2626", bg: "rgba(220,38,38,0.10)", text: "#991B1B", dot: "#DC2626" },
};

const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `$${(n / 1_000).toFixed(1)}k`
      : `$${n}`;

const fmtFull = (n: number) => `$${Number(n).toLocaleString()}`;

/* ═══════════════════════════════ PAGE ═══════════════════════════════ */
function CRMPage() {
  const { currentOrgId } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({ ...leadsQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const deals = (q.data ?? []) as Deal[];

  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage | "All">("All");
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);

  /* filter */
  const filtered = useMemo(() => {
    let arr = deals;
    if (stageFilter !== "All") arr = arr.filter((d) => d.stage === stageFilter);
    if (search.trim()) {
      const s = search.toLowerCase();
      arr = arr.filter(
        (d) =>
          d.name?.toLowerCase().includes(s) ||
          d.email?.toLowerCase().includes(s) ||
          d.company?.toLowerCase().includes(s) ||
          d.source?.toLowerCase().includes(s),
      );
    }
    return arr;
  }, [deals, stageFilter, search]);

  /* stats */
  const pipeline = deals
    .filter((d) => d.stage !== "Lost" && d.stage !== "Won")
    .reduce((s, d) => s + (d.value || 0), 0);
  const won = deals.filter((d) => d.stage === "Won").reduce((s, d) => s + (d.value || 0), 0);
  const active = deals.filter((d) => d.stage !== "Lost" && d.stage !== "Won").length;
  const closed = deals.filter((d) => d.stage === "Won" || d.stage === "Lost").length;
  const winRate =
    closed > 0 ? Math.round((deals.filter((d) => d.stage === "Won").length / closed) * 100) : 0;
  const avgSize = active > 0 ? Math.round(pipeline / active) : 0;

  /* mutations */
  const updateStage = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: Stage }) => {
      const { error } = await supabase.from("leads").update({ stage }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { stage }) => {
      qc.invalidateQueries({ queryKey: ["leads", currentOrgId] });
      if (selectedDeal) setSelectedDeal((d) => (d ? { ...d, stage } : d));
      toast.success(`Moved to ${stage}`);
    },
    onError: () => toast.error("Failed to update stage"),
  });

  const saveNotes = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase.from("leads").update({ notes }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads", currentOrgId] });
      toast.success("Notes saved");
    },
  });

  const deleteDeal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads", currentOrgId] });
      setSelectedDeal(null);
      toast.success("Deal deleted");
    },
  });

  const onSelect = (d: Deal) => setSelectedDeal((prev) => (prev?.id === d.id ? null : d));

  return (
    <div className="flex flex-col h-full -mx-5 -my-5 md:-mx-7 md:-my-6">
      {/* ── Header ── */}
      <div className="shrink-0 px-6 pt-5 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h1
              className="font-display text-[22px] font-bold tracking-tight"
              style={{ color: "var(--foreground)" }}
            >
              Pipeline
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              {deals.length} deal{deals.length !== 1 ? "s" : ""} across {STAGES.length} stages
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div
              className="flex rounded-lg p-0.5 gap-0.5"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
            >
              {(
                [
                  ["kanban", LayoutGrid],
                  ["table", List],
                ] as const
              ).map(([v, Icon]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-all"
                  style={
                    view === v
                      ? {
                          background: "var(--background)",
                          color: "var(--foreground)",
                          boxShadow: "var(--shadow-xs)",
                        }
                      : { color: "var(--muted-foreground)" }
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="capitalize">{v}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                if (blockIfGuest("Sign up to add deals.")) return;
                setAddOpen(true);
              }}
              className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-[13px] font-semibold transition-colors"
              style={{ background: "var(--primary)", color: "white" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--primary-hover)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--primary)";
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              New Deal
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Pipeline", value: fmt(pipeline), icon: TrendingUp, accent: "#7C3AED" },
            { label: "Won", value: fmt(won), icon: DollarSign, accent: "#059669" },
            { label: "Active", value: String(active), icon: Target, accent: "#3B82F6" },
            { label: "Win Rate", value: `${winRate}%`, icon: SlidersHorizontal, accent: "#D97706" },
            { label: "Avg Deal", value: fmt(avgSize), icon: FileText, accent: "#EC4899" },
          ].map(({ label, value, icon: Icon, accent }) => (
            <div
              key={label}
              className="rounded-xl p-3.5"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className="text-[11px] font-medium"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {label}
                </span>
                <div
                  className="h-6 w-6 rounded-md flex items-center justify-center"
                  style={{ background: `${accent}18` }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
                </div>
              </div>
              <div
                className="font-display text-[18px] font-bold tracking-tight"
                style={{ color: "var(--foreground)" }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div
        className="shrink-0 flex items-center gap-2 px-6 py-3 overflow-x-auto"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--background)" }}
      >
        <div className="relative shrink-0 w-[220px]">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none"
            style={{ color: "var(--muted-foreground)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deals…"
            className="w-full h-8 rounded-lg pl-8 pr-3 text-[12.5px] outline-none"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
          />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {(["All", ...STAGES] as const).map((s) => {
            const cfg = s !== "All" ? STAGE_CONFIG[s] : null;
            const active = stageFilter === s;
            return (
              <button
                key={s}
                onClick={() => setStageFilter(s)}
                className="flex items-center gap-1.5 h-8 rounded-lg px-2.5 text-[12px] font-medium whitespace-nowrap transition-all"
                style={
                  active
                    ? { background: cfg?.color ?? "var(--foreground)", color: "white" }
                    : { color: "var(--muted-foreground)", background: "transparent" }
                }
                onMouseEnter={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {cfg && (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: active ? "white" : cfg.color }}
                  />
                )}
                {s}
              </button>
            );
          })}
        </div>
        <div className="ml-auto shrink-0 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
          {filtered.length} deal{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* ── Main content + detail panel ── */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          {q.isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2
                className="h-5 w-5 animate-spin"
                style={{ color: "var(--muted-foreground)" }}
              />
            </div>
          ) : filtered.length === 0 && deals.length === 0 ? (
            <EmptyPipeline onAdd={() => setAddOpen(true)} />
          ) : view === "kanban" ? (
            <KanbanBoard
              deals={filtered}
              selectedId={selectedDeal?.id}
              onSelect={onSelect}
              onAddInStage={() => {
                setAddOpen(true);
              }}
            />
          ) : (
            <DealsTable
              deals={filtered}
              selectedId={selectedDeal?.id}
              onSelect={onSelect}
              onStageChange={(id, stage) => {
                if (blockIfGuest("Sign up to update deals.")) return;
                updateStage.mutate({ id, stage });
              }}
            />
          )}
        </div>

        {/* Detail panel */}
        {selectedDeal && (
          <DealDetailPanel
            deal={selectedDeal}
            onClose={() => setSelectedDeal(null)}
            onStageChange={(stage) => {
              if (blockIfGuest("Sign up to update deals.")) return;
              updateStage.mutate({ id: selectedDeal.id, stage });
            }}
            onSaveNotes={(notes) => saveNotes.mutate({ id: selectedDeal.id, notes })}
            onDelete={() => {
              if (blockIfGuest("Sign up to delete deals.")) return;
              if (!confirm("Delete this deal?")) return;
              deleteDeal.mutate(selectedDeal.id);
            }}
            onEdit={() => {
              setEditDeal(selectedDeal);
            }}
          />
        )}
      </div>

      {/* Add / Edit deal modal */}
      {(addOpen || editDeal) && (
        <DealFormModal
          deal={editDeal}
          onClose={() => {
            setAddOpen(false);
            setEditDeal(null);
          }}
          onSave={async (data) => {
            if (blockIfGuest("Sign up to manage deals.")) return;
            if (!currentOrgId) return;
            if (editDeal) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { error } = await (supabase as any)
                .from("leads")
                .update(data)
                .eq("id", editDeal.id);
              if (error) {
                toast.error(error.message);
                return;
              }
              toast.success("Deal updated");
              if (selectedDeal?.id === editDeal.id)
                setSelectedDeal((d) => (d ? { ...d, ...data } : d));
            } else {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { error } = await (supabase as any)
                .from("leads")
                .insert({ ...data, organization_id: currentOrgId });
              if (error) {
                toast.error(error.message);
                return;
              }
              toast.success("Deal created");
            }
            qc.invalidateQueries({ queryKey: ["leads", currentOrgId] });
            setAddOpen(false);
            setEditDeal(null);
          }}
        />
      )}
    </div>
  );
}

/* ════════════════════════════ KANBAN ════════════════════════════ */
function KanbanBoard({
  deals,
  selectedId,
  onSelect,
  onAddInStage,
}: {
  deals: Deal[];
  selectedId?: string;
  onSelect: (d: Deal) => void;
  onAddInStage: () => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 h-full">
      {STAGES.map((stage) => {
        const items = deals.filter((d) => d.stage === stage);
        const total = items.reduce((s, d) => s + (d.value || 0), 0);
        const cfg = STAGE_CONFIG[stage];
        return (
          <div
            key={stage}
            className="flex flex-col w-[264px] shrink-0 rounded-xl overflow-hidden"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            {/* Column header */}
            <div
              className="flex items-center gap-2 px-3 py-2.5"
              style={{ borderBottom: `2px solid ${cfg.color}` }}
            >
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ background: cfg.color }}
              />
              <span
                className="font-semibold text-[12.5px] flex-1"
                style={{ color: "var(--foreground)" }}
              >
                {stage}
              </span>
              <span
                className="rounded-full px-2 py-px text-[10.5px] font-medium"
                style={{ background: cfg.bg, color: cfg.text }}
              >
                {items.length}
              </span>
              {total > 0 && (
                <span
                  className="font-mono text-[10.5px]"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {fmt(total)}
                </span>
              )}
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[160px]">
              {items.length === 0 ? (
                <div
                  className="flex items-center justify-center py-8 text-[11.5px]"
                  style={{ color: "var(--muted-foreground)", opacity: 0.5 }}
                >
                  No deals
                </div>
              ) : (
                items.map((d) => (
                  <DealCard
                    key={d.id}
                    deal={d}
                    active={selectedId === d.id}
                    stageConfig={STAGE_CONFIG[d.stage]}
                    onClick={() => onSelect(d)}
                  />
                ))
              )}
            </div>

            {/* Add in column */}
            <button
              onClick={() => onAddInStage()}
              className="flex items-center gap-1.5 px-3 py-2 text-[11.5px] transition-colors w-full"
              style={{ borderTop: "1px solid var(--border)", color: "var(--muted-foreground)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <Plus className="h-3 w-3" />
              Add deal
            </button>
          </div>
        );
      })}
    </div>
  );
}

function DealCard({
  deal,
  active,
  stageConfig,
  onClick,
}: {
  deal: Deal;
  active: boolean;
  stageConfig: (typeof STAGE_CONFIG)[Stage];
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="rounded-lg cursor-pointer transition-all"
      style={{
        background: active ? "var(--primary-soft)" : "var(--background)",
        border: active ? "1.5px solid var(--primary-border)" : "1px solid var(--border)",
        boxShadow: active ? "var(--shadow-glow-primary)" : "var(--shadow-xs)",
      }}
    >
      {/* Stage color top line */}
      <div className="h-[3px] rounded-t-lg" style={{ background: stageConfig.color }} />
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <div
              className="font-semibold text-[13px] truncate"
              style={{ color: "var(--foreground)" }}
            >
              {deal.name}
            </div>
            {(deal.company || deal.source) && (
              <div
                className="flex items-center gap-1 mt-0.5 text-[11px]"
                style={{ color: "var(--muted-foreground)" }}
              >
                <Building2 className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{deal.company || deal.source}</span>
              </div>
            )}
          </div>
          {deal.value ? (
            <span
              className="shrink-0 font-mono text-[12px] font-bold"
              style={{ color: "var(--foreground)" }}
            >
              {fmt(deal.value)}
            </span>
          ) : null}
        </div>

        {deal.email && (
          <div
            className="flex items-center gap-1.5 text-[10.5px] mb-2"
            style={{ color: "var(--muted-foreground)" }}
          >
            <Mail className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{deal.email}</span>
          </div>
        )}

        {/* Probability bar */}
        <div className="space-y-1">
          <div
            className="flex items-center justify-between text-[10px]"
            style={{ color: "var(--muted-foreground)" }}
          >
            <span>Probability</span>
            <span className="font-medium">{deal.probability}%</span>
          </div>
          <div className="h-1 rounded-full" style={{ background: "var(--border)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${deal.probability}%`, background: stageConfig.color }}
            />
          </div>
        </div>

        {deal.close_date && (
          <div
            className="flex items-center gap-1 mt-2 text-[10.5px]"
            style={{ color: "var(--muted-foreground)" }}
          >
            <Calendar className="h-2.5 w-2.5" />
            {new Date(deal.close_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════ TABLE VIEW ═══════════════════════════ */
function DealsTable({
  deals,
  selectedId,
  onSelect,
  onStageChange,
}: {
  deals: Deal[];
  selectedId?: string;
  onSelect: (d: Deal) => void;
  onStageChange: (id: string, stage: Stage) => void;
}) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      <table className="w-full text-left">
        <thead>
          <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
            {["Deal", "Stage", "Value", "Probability", "Close Date", "Last Updated"].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--muted-foreground)" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {deals.map((d) => {
            const cfg = STAGE_CONFIG[d.stage];
            const isSelected = selectedId === d.id;
            return (
              <tr
                key={d.id}
                onClick={() => onSelect(d)}
                className="cursor-pointer transition-colors"
                style={{
                  borderBottom: "1px solid var(--border)",
                  background: isSelected ? "var(--primary-soft)" : undefined,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected)
                    (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected)
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-[13px]" style={{ color: "var(--foreground)" }}>
                    {d.name}
                  </div>
                  {(d.company || d.email) && (
                    <div
                      className="text-[11px] mt-0.5"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {d.company || d.email}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={d.stage}
                    onChange={(e) => onStageChange(d.id, e.target.value as Stage)}
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold cursor-pointer outline-none border-0"
                    style={{ background: cfg.bg, color: cfg.text }}
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td
                  className="px-4 py-3 font-mono text-[12.5px] font-medium"
                  style={{ color: "var(--foreground)" }}
                >
                  {d.value ? fmtFull(d.value) : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 h-1.5 rounded-full max-w-[60px]"
                      style={{ background: "var(--border)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${d.probability}%`, background: cfg.color }}
                      />
                    </div>
                    <span
                      className="text-[11px] tabular-nums"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {d.probability}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                  {d.close_date
                    ? new Date(d.close_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </td>
                <td className="px-4 py-3 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                  {new Date(d.updated_at).toLocaleDateString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════ DEAL DETAIL ═══════════════════════════ */
function DealDetailPanel({
  deal,
  onClose,
  onStageChange,
  onSaveNotes,
  onDelete,
  onEdit,
}: {
  deal: Deal;
  onClose: () => void;
  onStageChange: (stage: Stage) => void;
  onSaveNotes: (notes: string) => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const [notes, setNotes] = useState(deal.notes ?? "");
  const cfg = STAGE_CONFIG[deal.stage];
  const stageIdx = STAGES.indexOf(deal.stage);
  const expected = deal.value ? Math.round((deal.value * deal.probability) / 100) : 0;

  // sync notes when deal changes
  React.useEffect(() => {
    setNotes(deal.notes ?? "");
  }, [deal.id, deal.notes]);

  return (
    <div
      className="flex flex-col shrink-0 overflow-y-auto"
      style={{
        width: 380,
        borderLeft: "1px solid var(--border)",
        background: "var(--background)",
      }}
    >
      {/* Panel header */}
      <div
        className="flex items-start justify-between gap-3 px-5 py-4 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="min-w-0">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold mb-2"
            style={{ background: cfg.bg, color: cfg.text }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.color }} />
            {deal.stage}
          </span>
          <h2
            className="font-display text-[17px] font-bold leading-tight truncate"
            style={{ color: "var(--foreground)" }}
          >
            {deal.name}
          </h2>
          {deal.company && (
            <p className="text-[12.5px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              {deal.company}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors"
          style={{ color: "var(--muted-foreground)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Stage progression */}
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <p
          className="text-[10px] font-semibold uppercase tracking-wider mb-3"
          style={{ color: "var(--muted-foreground)" }}
        >
          Stage
        </p>
        <div className="relative flex items-center">
          {STAGES.filter((s) => s !== "Lost").map((s, i, arr) => {
            const si = STAGES.indexOf(s);
            const isActive = si === stageIdx;
            const isPast = si < stageIdx && deal.stage !== "Lost";
            const sCfg = STAGE_CONFIG[s];
            return (
              <React.Fragment key={s}>
                <button
                  onClick={() => onStageChange(s)}
                  title={s}
                  className="flex flex-col items-center gap-1 transition-all group relative z-10"
                >
                  <div
                    className="h-5 w-5 rounded-full border-2 transition-all flex items-center justify-center"
                    style={{
                      borderColor: isActive || isPast ? sCfg.color : "var(--border)",
                      background: isActive || isPast ? sCfg.color : "var(--background)",
                    }}
                  >
                    {(isActive || isPast) && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                  <span
                    className="text-[9px] font-medium hidden sm:block"
                    style={{ color: isActive ? sCfg.text : "var(--muted-foreground)" }}
                  >
                    {s}
                  </span>
                </button>
                {i < arr.length - 1 && (
                  <div
                    className="flex-1 h-px mx-0.5 mb-3"
                    style={{ background: isPast ? cfg.color : "var(--border)" }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
        {deal.stage === "Lost" && (
          <div
            className="mt-2 text-center text-[11px] font-medium"
            style={{ color: STAGE_CONFIG.Lost.text }}
          >
            Deal marked as Lost
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Deal metrics */}
        <div className="px-5 py-4 space-y-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <p
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--muted-foreground)" }}
          >
            Deal Info
          </p>
          <div className="grid grid-cols-2 gap-3">
            <MetricBox label="Value" value={deal.value ? fmtFull(deal.value) : "—"} />
            <MetricBox label="Expected" value={expected ? fmt(expected) : "—"} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5 text-[12px]">
              <span style={{ color: "var(--muted-foreground)" }}>Probability</span>
              <span className="font-semibold" style={{ color: "var(--foreground)" }}>
                {deal.probability}%
              </span>
            </div>
            <div className="h-2 rounded-full" style={{ background: "var(--surface-2)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${deal.probability}%`, background: cfg.color }}
              />
            </div>
          </div>
          {[
            {
              icon: Calendar,
              label: "Close Date",
              value: deal.close_date
                ? new Date(deal.close_date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : null,
            },
            { icon: Tag, label: "Source", value: deal.source },
          ]
            .filter((r) => r.value)
            .map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-2.5">
                <Icon
                  className="h-3.5 w-3.5 shrink-0"
                  style={{ color: "var(--muted-foreground)" }}
                />
                <div>
                  <div className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                    {label}
                  </div>
                  <div className="text-[12.5px] font-medium" style={{ color: "var(--foreground)" }}>
                    {value}
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Contact info */}
        {(deal.email || deal.phone) && (
          <div className="px-5 py-4 space-y-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <p
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--muted-foreground)" }}
            >
              Contact
            </p>
            {deal.email && (
              <a href={`mailto:${deal.email}`} className="flex items-center gap-2.5 group">
                <Mail
                  className="h-3.5 w-3.5 shrink-0"
                  style={{ color: "var(--muted-foreground)" }}
                />
                <span
                  className="text-[12.5px] group-hover:underline"
                  style={{ color: "var(--primary)" }}
                >
                  {deal.email}
                </span>
              </a>
            )}
            {deal.phone && (
              <a href={`tel:${deal.phone}`} className="flex items-center gap-2.5 group">
                <Phone
                  className="h-3.5 w-3.5 shrink-0"
                  style={{ color: "var(--muted-foreground)" }}
                />
                <span
                  className="text-[12.5px] group-hover:underline"
                  style={{ color: "var(--primary)" }}
                >
                  {deal.phone}
                </span>
              </a>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="px-5 py-4">
          <p
            className="text-[10px] font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--muted-foreground)" }}
          >
            Notes
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this deal…"
            rows={5}
            className="w-full rounded-lg px-3 py-2.5 text-[12.5px] outline-none resize-none transition"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--ring)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            }}
          />
          <button
            onClick={() => onSaveNotes(notes)}
            disabled={notes === (deal.notes ?? "")}
            className="mt-2 w-full rounded-lg py-2 text-[12.5px] font-semibold transition-all disabled:opacity-40"
            style={{ background: "var(--primary)", color: "white" }}
          >
            Save Notes
          </button>
        </div>
      </div>

      {/* Actions */}
      <div
        className="px-5 py-4 flex gap-2 shrink-0"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12.5px] font-medium transition-colors"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--surface-tertiary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
          }}
        >
          Edit Deal
        </button>
        <button
          onClick={onDelete}
          className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-medium transition-colors"
          style={{ color: "var(--destructive)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "color-mix(in oklab, var(--destructive) 8%, transparent)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-lg p-3"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
    >
      <div className="text-[10px] mb-1" style={{ color: "var(--muted-foreground)" }}>
        {label}
      </div>
      <div className="font-mono text-[14px] font-bold" style={{ color: "var(--foreground)" }}>
        {value}
      </div>
    </div>
  );
}

/* ═══════════════════════════ DEAL FORM ═══════════════════════════ */
function DealFormModal({
  deal,
  onClose,
  onSave,
}: {
  deal: Deal | null;
  onClose: () => void;
  onSave: (data: Partial<Deal>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: deal?.name ?? "",
    email: deal?.email ?? "",
    phone: deal?.phone ?? "",
    company: deal?.company ?? "",
    source: deal?.source ?? "",
    value: String(deal?.value ?? ""),
    probability: String(deal?.probability ?? 20),
    close_date: deal?.close_date ?? "",
    stage: (deal?.stage ?? "New") as Stage,
    notes: deal?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave({
      name: form.name.trim(),
      email: form.email || null,
      phone: form.phone || null,
      company: form.company || null,
      source: form.source || null,
      value: form.value ? Number(form.value) : null,
      probability: Number(form.probability),
      close_date: form.close_date || null,
      stage: form.stage,
      notes: form.notes || null,
    });
    setSaving(false);
  };

  const is = {
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    color: "var(--foreground)",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <span
            className="font-display font-bold text-[16px]"
            style={{ color: "var(--foreground)" }}
          >
            {deal ? "Edit Deal" : "New Deal"}
          </span>
          <button onClick={onClose} style={{ color: "var(--muted-foreground)" }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          <FField label="Deal name" required>
            <input
              autoFocus
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Acme Corp — Enterprise"
              className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
              style={is}
            />
          </FField>
          <div className="grid grid-cols-2 gap-3">
            <FField label="Company">
              <input
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="Acme Corp"
                className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
                style={is}
              />
            </FField>
            <FField label="Source">
              <input
                value={form.source}
                onChange={(e) => set("source", e.target.value)}
                placeholder="LinkedIn, referral…"
                className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
                style={is}
              />
            </FField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FField label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="contact@example.com"
                className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
                style={is}
              />
            </FField>
            <FField label="Phone">
              <input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+1 555 0000"
                className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
                style={is}
              />
            </FField>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FField label="Value ($)">
              <input
                type="number"
                value={form.value}
                onChange={(e) => set("value", e.target.value)}
                placeholder="0"
                className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
                style={is}
              />
            </FField>
            <FField label="Probability (%)">
              <input
                type="number"
                min={0}
                max={100}
                value={form.probability}
                onChange={(e) => set("probability", e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
                style={is}
              />
            </FField>
            <FField label="Close Date">
              <input
                type="date"
                value={form.close_date}
                onChange={(e) => set("close_date", e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
                style={is}
              />
            </FField>
          </div>
          <FField label="Stage">
            <div className="flex flex-wrap gap-1.5">
              {STAGES.map((s) => {
                const active = form.stage === s;
                const cfg = STAGE_CONFIG[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set("stage", s)}
                    className="rounded-full px-3 py-1 text-[11.5px] font-semibold transition-all"
                    style={
                      active
                        ? { background: cfg.color, color: "white" }
                        : { background: cfg.bg, color: cfg.text }
                    }
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </FField>
          <FField label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Notes about this deal…"
              rows={3}
              className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none resize-none"
              style={is}
            />
          </FField>
        </div>

        <div
          className="flex justify-end gap-2 px-5 py-4 shrink-0"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-[13px] font-medium"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--primary)", color: "white" }}
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {deal ? "Save Changes" : "Create Deal"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FField({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[12px] font-medium" style={{ color: "var(--muted-foreground)" }}>
        {label}
        {required && (
          <span className="ml-0.5" style={{ color: "var(--destructive)" }}>
            *
          </span>
        )}
      </div>
      {children}
    </label>
  );
}

function EmptyPipeline({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
        style={{ background: "var(--primary-soft)" }}
      >
        <LayoutGrid className="h-7 w-7" style={{ color: "var(--primary)" }} />
      </div>
      <h3
        className="font-display text-[18px] font-bold mb-2"
        style={{ color: "var(--foreground)" }}
      >
        Your pipeline is empty
      </h3>
      <p className="text-[13px] max-w-xs mb-6" style={{ color: "var(--muted-foreground)" }}>
        Add your first deal to start tracking your sales pipeline, close rates, and revenue.
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-[13px] font-semibold"
        style={{ background: "var(--primary)", color: "white" }}
      >
        <Plus className="h-4 w-4" />
        Add First Deal
      </button>
    </div>
  );
}
