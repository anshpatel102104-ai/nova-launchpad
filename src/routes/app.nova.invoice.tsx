import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Receipt, Plus, DollarSign, CheckCircle2, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { generatedAssetsQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { blockIfGuest } from "@/lib/guest";

export const Route = createFileRoute("/app/nova/invoice")({ component: Invoice });

type InvoiceMeta = {
  client_name: string;
  description: string;
  amount: number;
  currency: string;
  due_date: string;
  status: "draft" | "sent" | "paid" | "overdue";
  invoice_number: string;
};

const STATUS_STYLES: Record<InvoiceMeta["status"], { bg: string; text: string }> = {
  draft: { bg: "bg-muted", text: "text-muted-foreground" },
  sent: { bg: "bg-blue-500/10", text: "text-blue-400" },
  paid: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  overdue: { bg: "bg-rose-500/10", text: "text-rose-400" },
};

function padNum(n: number) {
  return String(n).padStart(4, "0");
}

function Invoice() {
  const { currentOrgId, user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    ...generatedAssetsQuery(currentOrgId ?? "", "invoice"),
    enabled: !!currentOrgId,
  });
  const items = (q.data ?? []) as Array<{ id: string; title: string; metadata: unknown; created_at: string }>;
  const invoices = items.map((a) => ({ ...a, meta: a.metadata as InvoiceMeta }));

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    client_name: "",
    description: "",
    amount: "",
    currency: "USD",
    due_date: "",
  });
  const [saving, setSaving] = useState(false);

  const totalBilled = invoices.reduce((s, i) => s + (i.meta.amount ?? 0), 0);
  const totalPaid = invoices
    .filter((i) => i.meta.status === "paid")
    .reduce((s, i) => s + (i.meta.amount ?? 0), 0);
  const totalOutstanding = invoices
    .filter((i) => i.meta.status !== "paid" && i.meta.status !== "draft")
    .reduce((s, i) => s + (i.meta.amount ?? 0), 0);

  const handleCreate = async () => {
    if (blockIfGuest("Sign up to create invoices.")) return;
    if (!form.client_name || !form.amount || !currentOrgId || !user) return;
    setSaving(true);
    const invoice_number = `INV-${padNum(invoices.length + 1)}`;
    const meta: InvoiceMeta = {
      client_name: form.client_name,
      description: form.description,
      amount: parseFloat(form.amount) || 0,
      currency: form.currency,
      due_date: form.due_date,
      status: "draft",
      invoice_number,
    };
    const { error } = await supabase.from("generated_assets").insert({
      organization_id: currentOrgId,
      user_id: user.id,
      category: "finance",
      kind: "invoice",
      title: `${invoice_number} · ${form.client_name}`,
      content: {},
      metadata: meta,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Invoice created");
    qc.invalidateQueries({ queryKey: ["generated_assets", currentOrgId, "invoice"] });
    setOpen(false);
    setForm({ client_name: "", description: "", amount: "", currency: "USD", due_date: "" });
  };

  const updateStatus = async (id: string, meta: InvoiceMeta, status: InvoiceMeta["status"]) => {
    if (blockIfGuest("Sign up to update invoices.")) return;
    const { error } = await supabase
      .from("generated_assets")
      .update({ metadata: { ...meta, status } })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Marked as ${status}`);
    qc.invalidateQueries({ queryKey: ["generated_assets", currentOrgId, "invoice"] });
  };

  const fmt = (n: number, cur = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(n);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Nova OS"
        title="Invoicing"
        description="Create, send, and track invoices for every client engagement."
        actions={
          <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New Invoice
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total Billed", value: fmt(totalBilled), icon: DollarSign },
          { label: "Paid", value: fmt(totalPaid), icon: CheckCircle2, accent: "emerald" },
          { label: "Outstanding", value: fmt(totalOutstanding), icon: Clock, accent: "amber" },
        ].map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <Icon className="h-3 w-3" /> {label}
            </div>
            <div
              className={`mt-1 font-display text-xl font-semibold tracking-tight ${accent === "emerald" ? "text-emerald-400" : accent === "amber" ? "text-amber-400" : ""}`}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No invoices yet"
          description="Create your first invoice to start tracking payments and billing your clients."
          action={
            <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Create invoice
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {["Invoice", "Client", "Amount", "Due", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map(({ id, meta }) => {
                const s = STATUS_STYLES[meta.status] ?? STATUS_STYLES.draft;
                return (
                  <tr key={id} className="transition-colors hover:bg-surface-2/50">
                    <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">{meta.invoice_number}</td>
                    <td className="px-4 py-3 font-medium">{meta.client_name}</td>
                    <td className="px-4 py-3 font-mono font-semibold">{fmt(meta.amount, meta.currency)}</td>
                    <td className="px-4 py-3 text-[12px] text-muted-foreground">
                      {meta.due_date ? new Date(meta.due_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium capitalize ${s.bg} ${s.text}`}>
                        {meta.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {meta.status === "draft" && (
                          <button
                            onClick={() => updateStatus(id, meta, "sent")}
                            className="rounded-md px-2 py-1 text-[11px] font-medium text-blue-400 hover:bg-blue-500/10 transition-colors"
                          >
                            Mark sent
                          </button>
                        )}
                        {(meta.status === "sent" || meta.status === "overdue") && (
                          <button
                            onClick={() => updateStatus(id, meta, "paid")}
                            className="rounded-md px-2 py-1 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                          >
                            Mark paid
                          </button>
                        )}
                        {meta.status === "sent" && (
                          <button
                            onClick={() => updateStatus(id, meta, "overdue")}
                            className="rounded-md px-2 py-1 text-[11px] font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            Overdue
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>New Invoice</SheetTitle>
            <SheetDescription>Create an invoice to send to a client.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-foreground">Client name *</label>
              <Input
                placeholder="Acme Corp"
                value={form.client_name}
                onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-foreground">Description</label>
              <Input
                placeholder="Strategy consultation, Q1"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-foreground">Amount *</label>
                <Input
                  type="number"
                  placeholder="2500"
                  min={0}
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-foreground">Currency</label>
                <Select
                  value={form.currency}
                  onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["USD", "EUR", "GBP", "CAD", "AUD"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-foreground">Due date</label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={saving || !form.client_name || !form.amount}
            >
              {saving ? "Creating…" : "Create invoice"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
