import React, { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  Plus,
  Search,
  ChevronUp,
  ChevronDown,
  X,
  Loader2,
  Mail,
  Phone,
  Building2,
  Tag,
  Filter,
  MoreHorizontal,
  Activity,
  ArrowRight,
  AlertCircle,
  CheckSquare,
  Square,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/contacts")({ component: ContactsPage });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/* ─── Types ─── */
interface Contact {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  notes: string | null;
  status: ContactStatus;
  lead_score: number | null;
  tags: string[] | null;
  last_contacted_at: string | null;
  created_at: string;
}

type ContactStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "engaged"
  | "nurture"
  | "cold"
  | "archived";

type SortField = "lead_score" | "status" | "created_at" | "last_contacted_at";
type SortDir = "asc" | "desc";

const STATUS_OPTIONS: ContactStatus[] = [
  "new",
  "contacted",
  "qualified",
  "engaged",
  "nurture",
  "cold",
  "archived",
];

const STATUS_COLORS: Record<ContactStatus, { bg: string; text: string; border: string }> = {
  new: { bg: "rgba(75,139,244,0.12)", text: "#4B8BF4", border: "rgba(75,139,244,0.25)" },
  contacted: { bg: "rgba(251,191,36,0.12)", text: "#FBBF24", border: "rgba(251,191,36,0.25)" },
  qualified: { bg: "rgba(34,197,94,0.12)", text: "#22C55E", border: "rgba(34,197,94,0.25)" },
  engaged: { bg: "rgba(139,92,246,0.12)", text: "#8B5CF6", border: "rgba(139,92,246,0.25)" },
  nurture: { bg: "rgba(249,115,22,0.12)", text: "#F97316", border: "rgba(249,115,22,0.25)" },
  cold: { bg: "rgba(136,136,170,0.12)", text: "#8888AA", border: "rgba(136,136,170,0.25)" },
  archived: {
    bg: "rgba(255,255,255,0.06)",
    text: "rgba(255,255,255,0.3)",
    border: "rgba(255,255,255,0.08)",
  },
};

function leadScoreColor(score: number | null) {
  if (!score)
    return { bg: "rgba(255,255,255,0.06)", text: "#8888AA", border: "rgba(255,255,255,0.08)" };
  if (score >= 70)
    return { bg: "rgba(34,197,94,0.12)", text: "#22C55E", border: "rgba(34,197,94,0.25)" };
  if (score >= 40)
    return { bg: "rgba(251,191,36,0.12)", text: "#FBBF24", border: "rgba(251,191,36,0.25)" };
  return { bg: "rgba(239,68,68,0.12)", text: "#EF4444", border: "rgba(239,68,68,0.25)" };
}

const PAGE_SIZE = 25;

/* ─── Supabase helpers ─── */
async function fetchContacts(userId: string): Promise<Contact[]> {
  const { data } = await db
    .from("contacts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Contact[];
}

async function createContact(contact: Omit<Contact, "id" | "created_at">): Promise<void> {
  await db.from("contacts").insert(contact);
}

async function updateContactStatus(id: string, status: ContactStatus): Promise<void> {
  await db.from("contacts").update({ status }).eq("id", id);
}

async function deleteContact(id: string): Promise<void> {
  await db.from("contacts").delete().eq("id", id);
}

async function fetchContactLogs(contactId: string): Promise<Record<string, unknown>[]> {
  const { data } = await db
    .from("automation_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  // Filter client-side to match contact references in trigger_payload
  return ((data ?? []) as Record<string, unknown>[]).filter((log) => {
    const payload = log.trigger_payload as Record<string, unknown> | null;
    return payload && (payload.contact_id === contactId || payload.email === contactId);
  });
}

/* ─── Main Page ─── */
function ContactsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [statusFilter, setStatusFilter] = useState<ContactStatus | "all">("all");
  const [minScore, setMinScore] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [detailContact, setDetailContact] = useState<Contact | null>(null);
  const [bulkAction, setBulkAction] = useState<"" | "status" | "trigger">("");

  const contactsQ = useQuery({
    queryKey: ["contacts", user?.id],
    queryFn: () => fetchContacts(user!.id),
    enabled: !!user?.id,
  });

  const allContacts = contactsQ.data ?? [];

  /* Filter + sort */
  const filtered = useMemo(() => {
    let arr = allContacts;
    if (statusFilter !== "all") arr = arr.filter((c) => c.status === statusFilter);
    if (minScore > 0) arr = arr.filter((c) => (c.lead_score ?? 0) >= minScore);
    if (search.trim()) {
      const s = search.toLowerCase();
      arr = arr.filter(
        (c) =>
          (c.first_name ?? "").toLowerCase().includes(s) ||
          (c.last_name ?? "").toLowerCase().includes(s) ||
          (c.email ?? "").toLowerCase().includes(s) ||
          (c.company ?? "").toLowerCase().includes(s),
      );
    }
    arr = [...arr].sort((a, b) => {
      let av: string | number = 0;
      let bv: string | number = 0;
      if (sortField === "lead_score") {
        av = a.lead_score ?? 0;
        bv = b.lead_score ?? 0;
      } else if (sortField === "status") {
        av = a.status;
        bv = b.status;
      } else if (sortField === "created_at") {
        av = a.created_at;
        bv = b.created_at;
      } else if (sortField === "last_contacted_at") {
        av = a.last_contacted_at ?? "";
        bv = b.last_contacted_at ?? "";
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [allContacts, statusFilter, minScore, search, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContactStatus }) =>
      updateContactStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts", user?.id] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteContact(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts", user?.id] });
      setDetailContact(null);
    },
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map((c) => c.id)));
  };

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field ? (
      sortDir === "asc" ? (
        <ChevronUp className="h-3 w-3" />
      ) : (
        <ChevronDown className="h-3 w-3" />
      )
    ) : (
      <ChevronDown className="h-3 w-3 opacity-30" />
    );

  if (!user) return null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{
              background: "linear-gradient(135deg, #4B8BF4, #8B5CF6)",
              boxShadow: "0 0 20px rgba(75,139,244,0.3)",
            }}
          >
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1
              className="font-display text-2xl font-bold tracking-tight"
              style={{ color: "var(--foreground)" }}
            >
              Contacts
            </h1>
            <p className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>
              {allContacts.length} contact{allContacts.length !== 1 ? "s" : ""} in your CRM
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition-all"
          style={{
            background: "linear-gradient(135deg, #4B8BF4, #8B5CF6)",
            boxShadow: "0 4px 15px rgba(75,139,244,0.3)",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.transform = "translateY(-1px)")
          }
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = "none")}
        >
          <Plus className="h-4 w-4" />
          Add Contact
        </button>
      </div>

      {/* Filters */}
      <div
        className="rounded-2xl p-4 space-y-3"
        style={{ background: "var(--surface)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none"
              style={{ color: "var(--muted-foreground)" }}
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search contacts…"
              className="w-full rounded-lg py-2 pl-9 pr-4 text-[13px] outline-none transition"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "var(--foreground)",
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(75,139,244,0.4)";
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
              }}
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ContactStatus | "all");
              setPage(1);
            }}
            className="rounded-lg px-3 py-2 text-[13px] outline-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "var(--foreground)",
            }}
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Score slider */}
        <div className="flex items-center gap-3">
          <Filter className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--muted-foreground)" }} />
          <span className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
            Min score:
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={minScore}
            onChange={(e) => {
              setMinScore(Number(e.target.value));
              setPage(1);
            }}
            className="flex-1 accent-blue-500"
          />
          <span
            className="text-[12px] font-mono w-6 text-right"
            style={{ color: "var(--foreground)" }}
          >
            {minScore}
          </span>
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-2.5"
          style={{ background: "rgba(75,139,244,0.08)", border: "1px solid rgba(75,139,244,0.2)" }}
        >
          <span className="text-[12px] font-medium" style={{ color: "#4B8BF4" }}>
            {selected.size} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value as "" | "status" | "trigger")}
              className="rounded-lg px-3 py-1.5 text-[12px] outline-none"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--foreground)",
              }}
            >
              <option value="">Bulk action…</option>
              <option value="status">Change status</option>
              <option value="trigger">Trigger automation</option>
            </select>
            {bulkAction === "status" && (
              <select
                onChange={async (e) => {
                  const status = e.target.value as ContactStatus;
                  await Promise.all([...selected].map((id) => updateContactStatus(id, status)));
                  qc.invalidateQueries({ queryKey: ["contacts", user?.id] });
                  setSelected(new Set());
                  setBulkAction("");
                }}
                className="rounded-lg px-3 py-1.5 text-[12px] outline-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "var(--foreground)",
                }}
              >
                <option value="">Select status…</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
            {bulkAction === "trigger" && (
              <button
                onClick={async () => {
                  const {
                    data: { session },
                  } = await supabase.auth.getSession();
                  const token = session?.access_token;
                  await fetch("/api/automations/trigger", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ contact_ids: [...selected] }),
                  });
                  setSelected(new Set());
                  setBulkAction("");
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-white"
                style={{ background: "linear-gradient(135deg, #4B8BF4, #8B5CF6)" }}
              >
                <Zap className="h-3.5 w-3.5" />
                Trigger
              </button>
            )}
            <button
              onClick={() => setSelected(new Set())}
              style={{ color: "var(--muted-foreground)" }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{ background: "var(--surface)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {contactsQ.isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2
              className="h-6 w-6 animate-spin"
              style={{ color: "var(--muted-foreground)" }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <tr>
                  <th className="px-4 py-3 w-10">
                    <button onClick={selectAll}>
                      {selected.size === paginated.length && paginated.length > 0 ? (
                        <CheckSquare className="h-4 w-4" style={{ color: "#4B8BF4" }} />
                      ) : (
                        <Square className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                      )}
                    </button>
                  </th>
                  <th
                    className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Name
                  </th>
                  <th
                    className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Company
                  </th>
                  <th
                    className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none"
                    style={{ color: "var(--muted-foreground)" }}
                    onClick={() => handleSort("lead_score")}
                  >
                    <span className="flex items-center gap-1">
                      Lead Score <SortIcon field="lead_score" />
                    </span>
                  </th>
                  <th
                    className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none"
                    style={{ color: "var(--muted-foreground)" }}
                    onClick={() => handleSort("status")}
                  >
                    <span className="flex items-center gap-1">
                      Status <SortIcon field="status" />
                    </span>
                  </th>
                  <th
                    className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hidden md:table-cell"
                    style={{ color: "var(--muted-foreground)" }}
                    onClick={() => handleSort("last_contacted_at")}
                  >
                    <span className="flex items-center gap-1">
                      Last Contacted <SortIcon field="last_contacted_at" />
                    </span>
                  </th>
                  <th className="px-4 py-3 w-16" />
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Users
                          className="h-8 w-8"
                          style={{ color: "var(--muted-foreground)", opacity: 0.3 }}
                        />
                        <p className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>
                          {search || statusFilter !== "all" || minScore > 0
                            ? "No contacts match your filters"
                            : "No contacts yet"}
                        </p>
                        {!search && statusFilter === "all" && minScore === 0 && (
                          <button
                            onClick={() => setShowAddModal(true)}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-white"
                            style={{ background: "linear-gradient(135deg, #4B8BF4, #8B5CF6)" }}
                          >
                            <Plus className="h-3.5 w-3.5" /> Add your first contact
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((contact) => {
                    const scoreColors = leadScoreColor(contact.lead_score);
                    const statusColors = STATUS_COLORS[contact.status];
                    const fullName =
                      [contact.first_name, contact.last_name].filter(Boolean).join(" ") || "—";

                    return (
                      <tr
                        key={contact.id}
                        className="transition-all cursor-pointer"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLElement).style.background =
                            "rgba(255,255,255,0.02)")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLElement).style.background = "transparent")
                        }
                        onClick={() => setDetailContact(contact)}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => toggleSelect(contact.id)}>
                            {selected.has(contact.id) ? (
                              <CheckSquare className="h-4 w-4" style={{ color: "#4B8BF4" }} />
                            ) : (
                              <Square
                                className="h-4 w-4"
                                style={{ color: "var(--muted-foreground)" }}
                              />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className="font-medium text-[13px]"
                            style={{ color: "var(--foreground)" }}
                          >
                            {fullName}
                          </div>
                          {contact.email && (
                            <div
                              className="text-[11px]"
                              style={{ color: "var(--muted-foreground)" }}
                            >
                              {contact.email}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-[13px]"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            {contact.company ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {contact.lead_score != null ? (
                            <span
                              className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-bold min-w-[36px]"
                              style={{
                                background: scoreColors.bg,
                                color: scoreColors.text,
                                border: `1px solid ${scoreColors.border}`,
                              }}
                            >
                              {contact.lead_score}
                            </span>
                          ) : (
                            <span
                              className="text-[12px]"
                              style={{ color: "var(--muted-foreground)" }}
                            >
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize"
                            style={{
                              background: statusColors.bg,
                              color: statusColors.text,
                              border: `1px solid ${statusColors.border}`,
                            }}
                          >
                            {contact.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span
                            className="text-[12px]"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            {contact.last_contacted_at
                              ? new Date(contact.last_contacted_at).toLocaleDateString()
                              : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="flex h-7 w-7 items-center justify-center rounded-lg transition-all"
                            style={{ color: "var(--muted-foreground)" }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background =
                                "rgba(255,255,255,0.06)";
                              (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background = "transparent";
                              (e.currentTarget as HTMLElement).style.color =
                                "var(--muted-foreground)";
                            }}
                            onClick={() => setDetailContact(contact)}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
              Page {page} of {totalPages} · {filtered.length} results
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg px-3 py-1 text-[12px] font-medium transition-all disabled:opacity-40"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "var(--foreground)",
                }}
              >
                Prev
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg px-3 py-1 text-[12px] font-medium transition-all disabled:opacity-40"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "var(--foreground)",
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <AddContactModal
          userId={user.id}
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["contacts", user?.id] });
            setShowAddModal(false);
          }}
        />
      )}

      {/* Contact Detail Slide-over */}
      {detailContact && (
        <ContactDetail
          contact={detailContact}
          onClose={() => setDetailContact(null)}
          onStatusChange={(id, status) => {
            updateMutation.mutate({ id, status });
            setDetailContact((c) => (c ? { ...c, status } : c));
          }}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      )}
    </div>
  );
}

/* ─── Add Contact Modal ─── */
function AddContactModal({
  userId,
  onClose,
  onSaved,
}: {
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company: "",
    source: "",
    notes: "",
    status: "new" as ContactStatus,
    lead_score: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createContact({
        user_id: userId,
        first_name: form.first_name || null,
        last_name: form.last_name || null,
        email: form.email || null,
        phone: form.phone || null,
        company: form.company || null,
        source: form.source || null,
        notes: form.notes || null,
        status: form.status,
        lead_score: form.lead_score ? parseInt(form.lead_score) : null,
        tags: null,
        last_contacted_at: null,
      });
      onSaved();
    } catch (err) {
      setError((err as Error).message ?? "Failed to create contact");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-lg rounded-2xl"
        style={{ background: "var(--surface)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="font-semibold text-[15px]" style={{ color: "var(--foreground)" }}>
            Add Contact
          </div>
          <button onClick={onClose} style={{ color: "var(--muted-foreground)" }}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "first_name", label: "First Name", placeholder: "Jane" },
              { key: "last_name", label: "Last Name", placeholder: "Doe" },
            ].map((f) => (
              <div key={f.key}>
                <label
                  className="block text-[12px] font-medium mb-1.5"
                  style={{ color: "var(--foreground)" }}
                >
                  {f.label}
                </label>
                <input
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "var(--foreground)",
                  }}
                />
              </div>
            ))}
          </div>
          {[
            { key: "email", label: "Email", placeholder: "jane@example.com", type: "email" },
            { key: "phone", label: "Phone", placeholder: "+1 555 000 0000", type: "tel" },
            { key: "company", label: "Company", placeholder: "Acme Corp", type: "text" },
            {
              key: "source",
              label: "Source",
              placeholder: "LinkedIn, referral, ad…",
              type: "text",
            },
          ].map((f) => (
            <div key={f.key}>
              <label
                className="block text-[12px] font-medium mb-1.5"
                style={{ color: "var(--foreground)" }}
              >
                {f.label}
              </label>
              <input
                type={f.type}
                value={form[f.key as keyof typeof form]}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "var(--foreground)",
                }}
              />
            </div>
          ))}
          <div>
            <label
              className="block text-[12px] font-medium mb-1.5"
              style={{ color: "var(--foreground)" }}
            >
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Any notes about this contact…"
              rows={3}
              className="w-full rounded-lg px-3 py-2 text-[13px] outline-none resize-none"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "var(--foreground)",
              }}
            />
          </div>
          {error && (
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12px]"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#EF4444",
              }}
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-[13px] font-medium"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "var(--foreground)",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium text-white"
              style={{ background: "linear-gradient(135deg, #4B8BF4, #8B5CF6)" }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Add Contact
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Contact Detail Slide-over ─── */
function ContactDetail({
  contact,
  onClose,
  onStatusChange,
  onDelete,
}: {
  contact: Contact;
  onClose: () => void;
  onStatusChange: (id: string, status: ContactStatus) => void;
  onDelete: (id: string) => void;
}) {
  const logsQ = useQuery({
    queryKey: ["contact-logs", contact.id],
    queryFn: () => fetchContactLogs(contact.id),
  });

  const scoreColors = leadScoreColor(contact.lead_score);
  const statusColors = STATUS_COLORS[contact.status];
  const fullName =
    [contact.first_name, contact.last_name].filter(Boolean).join(" ") || "Unnamed Contact";

  const triggerAutomation = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    await fetch("/api/automations/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ contact_id: contact.id }),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative ml-auto flex h-full w-full max-w-md flex-col"
        style={{ background: "var(--surface)", borderLeft: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="font-semibold text-[15px]" style={{ color: "var(--foreground)" }}>
            {fullName}
          </div>
          <button onClick={onClose} style={{ color: "var(--muted-foreground)" }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Profile */}
          <div
            className="px-6 py-5 space-y-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-white font-bold text-[16px]"
                style={{ background: "linear-gradient(135deg, #4B8BF4, #8B5CF6)" }}
              >
                {fullName[0]?.toUpperCase() ?? "?"}
              </div>
              <div>
                <div className="font-semibold text-[14px]" style={{ color: "var(--foreground)" }}>
                  {fullName}
                </div>
                <div className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                  {contact.company ?? "No company"}
                </div>
              </div>
              {contact.lead_score != null && (
                <span
                  className="ml-auto rounded-full px-2.5 py-1 text-[12px] font-bold"
                  style={{
                    background: scoreColors.bg,
                    color: scoreColors.text,
                    border: `1px solid ${scoreColors.border}`,
                  }}
                >
                  {contact.lead_score}
                </span>
              )}
            </div>

            {/* Info rows */}
            {[
              { icon: Mail, value: contact.email, label: "Email" },
              { icon: Phone, value: contact.phone, label: "Phone" },
              { icon: Building2, value: contact.company, label: "Company" },
              { icon: Tag, value: contact.source, label: "Source" },
            ]
              .filter((r) => r.value)
              .map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" style={{ color: "var(--muted-foreground)" }} />
                  <span className="text-[13px]" style={{ color: "var(--foreground)" }}>
                    {value}
                  </span>
                </div>
              ))}

            {/* Status change */}
            <div>
              <label
                className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider"
                style={{ color: "var(--muted-foreground)" }}
              >
                Status
              </label>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((s) => {
                  const sc = STATUS_COLORS[s];
                  const active = contact.status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => onStatusChange(contact.id, s)}
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize transition-all"
                      style={
                        active
                          ? { background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }
                          : {
                              background: "rgba(255,255,255,0.04)",
                              color: "var(--muted-foreground)",
                              border: "1px solid rgba(255,255,255,0.08)",
                            }
                      }
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            {contact.notes && (
              <div>
                <label
                  className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Notes
                </label>
                <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--foreground)" }}>
                  {contact.notes}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={triggerAutomation}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium text-white"
                style={{ background: "linear-gradient(135deg, #4B8BF4, #8B5CF6)" }}
              >
                <Zap className="h-3.5 w-3.5" /> Trigger Automation
              </button>
              <button
                onClick={() => onDelete(contact.id)}
                className="rounded-lg px-3 py-2 text-[12px] font-medium transition-all"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.15)",
                  color: "#EF4444",
                }}
              >
                Delete
              </button>
            </div>
          </div>

          {/* Activity timeline */}
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
              <span
                className="text-[12px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--muted-foreground)" }}
              >
                Activity Timeline
              </span>
            </div>
            {logsQ.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2
                  className="h-5 w-5 animate-spin"
                  style={{ color: "var(--muted-foreground)" }}
                />
              </div>
            ) : logsQ.data && logsQ.data.length > 0 ? (
              <div className="space-y-3">
                {logsQ.data.map((log, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                      style={{ background: "#4B8BF4" }}
                    />
                    <div>
                      <div className="text-[12.5px]" style={{ color: "var(--foreground)" }}>
                        {String(log.message ?? "Automation event")}
                      </div>
                      <div
                        className="text-[11px] mt-0.5"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {new Date(String(log.created_at)).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12.5px]" style={{ color: "var(--muted-foreground)" }}>
                No activity logged yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
