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
  AlertCircle,
  CheckSquare,
  Square,
  Zap,
} from "lucide-react";

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
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Contacts
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {allContacts.length} contact{allContacts.length !== 1 ? "s" : ""} in your CRM
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-medium transition-opacity hover:opacity-80"
          style={{ background: "var(--primary)", color: "#fff" }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Contact
        </button>
      </div>

      {/* Filters */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "color-mix(in oklab, var(--primary) 50%, transparent)";
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ContactStatus | "all");
              setPage(1);
            }}
            className="rounded-lg px-3 py-2 text-[13px] outline-none"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
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
            className="flex-1"
            style={{ accentColor: "var(--primary)" }}
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
          style={{
            background: "var(--primary-soft)",
            border: "1px solid color-mix(in oklab, var(--primary) 25%, transparent)",
          }}
        >
          <span className="text-[12px] font-medium" style={{ color: "var(--primary)" }}>
            {selected.size} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value as "" | "status" | "trigger")}
              className="rounded-lg px-3 py-1.5 text-[12px] outline-none"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
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
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
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
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium"
                style={{ background: "var(--primary)", color: "#fff" }}
              >
                <Zap className="h-3.5 w-3.5" />
                Trigger
              </button>
            )}
            <button onClick={() => setSelected(new Set())} style={{ color: "var(--muted-foreground)" }}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div
        className="overflow-hidden rounded-xl"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {contactsQ.isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2
              className="h-5 w-5 animate-spin"
              style={{ color: "var(--muted-foreground)" }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th className="px-4 py-3 w-10">
                    <button onClick={selectAll}>
                      {selected.size === paginated.length && paginated.length > 0 ? (
                        <CheckSquare className="h-4 w-4" style={{ color: "var(--primary)" }} />
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
                      Score <SortIcon field="lead_score" />
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
                          className="h-7 w-7"
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
                            className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium"
                            style={{ background: "var(--primary)", color: "#fff" }}
                          >
                            <Plus className="h-3.5 w-3.5" /> Add your first contact
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((contact) => {
                    const score = contact.lead_score;
                    const fullName =
                      [contact.first_name, contact.last_name].filter(Boolean).join(" ") || "—";
                    const isActive = contact.status === "qualified" || contact.status === "engaged";

                    return (
                      <tr
                        key={contact.id}
                        className="transition-colors cursor-pointer"
                        style={{ borderBottom: "1px solid var(--border)" }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLElement).style.background = "var(--surface-2)")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLElement).style.background = "transparent")
                        }
                        onClick={() => setDetailContact(contact)}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => toggleSelect(contact.id)}>
                            {selected.has(contact.id) ? (
                              <CheckSquare className="h-4 w-4" style={{ color: "var(--primary)" }} />
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
                              className="text-[11px] mt-0.5"
                              style={{ color: "var(--muted-foreground)" }}
                            >
                              {contact.email}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>
                            {contact.company ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {score != null ? (
                            <span
                              className="inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[11px] font-bold tabular-nums min-w-[32px]"
                              style={
                                score >= 70
                                  ? { background: "var(--primary-soft)", color: "var(--primary)" }
                                  : {
                                      background: "var(--surface-2)",
                                      color: "var(--muted-foreground)",
                                      border: "1px solid var(--border)",
                                    }
                              }
                            >
                              {score}
                            </span>
                          ) : (
                            <span className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium capitalize"
                            style={
                              isActive
                                ? { background: "var(--primary-soft)", color: "var(--primary)" }
                                : {
                                    background: "var(--surface-2)",
                                    color: "var(--muted-foreground)",
                                    border: "1px solid var(--border)",
                                  }
                            }
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
                            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                            style={{ color: "var(--muted-foreground)" }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
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

        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: "1px solid var(--border)" }}
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
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
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
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

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

  const inputStyle = {
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    color: "var(--foreground)",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-lg rounded-xl"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="font-semibold text-[15px]" style={{ color: "var(--foreground)" }}>
            Add Contact
          </div>
          <button onClick={onClose} style={{ color: "var(--muted-foreground)" }}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "first_name", label: "First Name", placeholder: "Jane" },
              { key: "last_name", label: "Last Name", placeholder: "Doe" },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                  {f.label}
                </label>
                <input
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
                  style={inputStyle}
                />
              </div>
            ))}
          </div>
          {[
            { key: "email", label: "Email", placeholder: "jane@example.com", type: "email" },
            { key: "phone", label: "Phone", placeholder: "+1 555 000 0000", type: "tel" },
            { key: "company", label: "Company", placeholder: "Acme Corp", type: "text" },
            { key: "source", label: "Source", placeholder: "LinkedIn, referral, ad…", type: "text" },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                {f.label}
              </label>
              <input
                type={f.type}
                value={form[f.key as keyof typeof form]}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
                style={inputStyle}
              />
            </div>
          ))}
          <div>
            <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Any notes about this contact…"
              rows={3}
              className="w-full rounded-lg px-3 py-2 text-[13px] outline-none resize-none"
              style={inputStyle}
            />
          </div>
          {error && (
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12px]"
              style={{
                background: "color-mix(in oklab, var(--muted-foreground) 8%, transparent)",
                border: "1px solid color-mix(in oklab, var(--muted-foreground) 15%, transparent)",
                color: "var(--foreground)",
              }}
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
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
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-opacity hover:opacity-80 disabled:opacity-60"
              style={{ background: "var(--primary)", color: "#fff" }}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
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

  const fullName =
    [contact.first_name, contact.last_name].filter(Boolean).join(" ") || "Unnamed Contact";
  const isActive = contact.status === "qualified" || contact.status === "engaged";
  const score = contact.lead_score;

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
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative ml-auto flex h-full w-full max-w-md flex-col"
        style={{ background: "var(--surface)", borderLeft: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg font-bold text-[14px]"
              style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
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
          </div>
          <button onClick={onClose} style={{ color: "var(--muted-foreground)" }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Profile info */}
          <div className="px-5 py-5 space-y-4" style={{ borderBottom: "1px solid var(--border)" }}>
            {/* Score + status row */}
            <div className="flex items-center gap-2">
              {score != null && (
                <span
                  className="rounded-md px-2.5 py-1 text-[12px] font-bold"
                  style={
                    score >= 70
                      ? { background: "var(--primary-soft)", color: "var(--primary)" }
                      : {
                          background: "var(--surface-2)",
                          color: "var(--muted-foreground)",
                          border: "1px solid var(--border)",
                        }
                  }
                >
                  {score} pts
                </span>
              )}
              <span
                className="rounded-md px-2.5 py-1 text-[11px] font-medium capitalize"
                style={
                  isActive
                    ? { background: "var(--primary-soft)", color: "var(--primary)" }
                    : {
                        background: "var(--surface-2)",
                        color: "var(--muted-foreground)",
                        border: "1px solid var(--border)",
                      }
                }
              >
                {contact.status}
              </span>
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
                  <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--muted-foreground)" }} />
                  <span className="text-[13px]" style={{ color: "var(--foreground)" }}>
                    {value}
                  </span>
                </div>
              ))}

            {/* Status change */}
            <div>
              <label
                className="block text-[11px] font-semibold mb-2 uppercase tracking-wider"
                style={{ color: "var(--muted-foreground)" }}
              >
                Change Status
              </label>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((s) => {
                  const active = contact.status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => onStatusChange(contact.id, s)}
                      className="rounded-md px-2.5 py-1 text-[11px] font-medium capitalize transition-colors"
                      style={
                        active
                          ? { background: "var(--primary-soft)", color: "var(--primary)" }
                          : {
                              background: "var(--surface-2)",
                              color: "var(--muted-foreground)",
                              border: "1px solid var(--border)",
                            }
                      }
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {contact.notes && (
              <div>
                <label
                  className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Notes
                </label>
                <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--foreground)" }}>
                  {contact.notes}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={triggerAutomation}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium transition-opacity hover:opacity-80"
                style={{ background: "var(--primary)", color: "#fff" }}
              >
                <Zap className="h-3.5 w-3.5" /> Trigger Automation
              </button>
              <button
                onClick={() => onDelete(contact.id)}
                className="rounded-lg px-3 py-2 text-[12px] font-medium transition-colors"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--muted-foreground)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
                }}
              >
                Delete
              </button>
            </div>
          </div>

          {/* Activity timeline */}
          <div className="px-5 py-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
              <span
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--muted-foreground)" }}
              >
                Activity
              </span>
            </div>
            {logsQ.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2
                  className="h-4 w-4 animate-spin"
                  style={{ color: "var(--muted-foreground)" }}
                />
              </div>
            ) : logsQ.data && logsQ.data.length > 0 ? (
              <div className="space-y-3">
                {logsQ.data.map((log, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="w-1 h-1 rounded-full mt-2 shrink-0"
                      style={{ background: "var(--primary)" }}
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
