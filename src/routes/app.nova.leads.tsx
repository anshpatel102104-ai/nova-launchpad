import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Inbox, Plus, Search, Filter } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { leadsQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { blockIfGuest } from "@/lib/guest";

export const Route = createFileRoute("/app/nova/leads")({ component: Leads });

const STAGES = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"] as const;
type Stage = (typeof STAGES)[number];

const STAGE_BADGE: Record<Stage, string> = {
  New: "bg-muted text-foreground",
  Contacted: "bg-blue-500/15 text-blue-400",
  Qualified: "bg-violet-500/15 text-violet-400",
  Proposal: "bg-amber-500/15 text-amber-400",
  Won: "bg-emerald-500/15 text-emerald-400",
  Lost: "bg-rose-500/15 text-rose-400",
};

function Leads() {
  const { currentOrgId, user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({ ...leadsQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const all = q.data ?? [];

  const [filter, setFilter] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage | "All">("All");
  const [createOpen, setCreateOpen] = useState(false);

  const items = useMemo(() => {
    return all.filter((l) => {
      if (stageFilter !== "All" && l.stage !== stageFilter) return false;
      if (!filter) return true;
      const t = filter.toLowerCase();
      return (
        l.name?.toLowerCase().includes(t) ||
        l.email?.toLowerCase().includes(t) ||
        l.source?.toLowerCase().includes(t)
      );
    });
  }, [all, filter, stageFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Nova OS"
        title="Lead Capture"
        description="Inbound leads, qualification status, and source attribution."
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New lead
          </Button>
        }
      />

      {/* Controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, email, source…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-8 h-9 bg-surface"
          />
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-0.5 overflow-x-auto">
          <Filter className="h-3 w-3 mx-1.5 shrink-0 text-muted-foreground" />
          {(["All", ...STAGES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStageFilter(s)}
              className={cn(
                "shrink-0 rounded px-2 py-1 text-[11px] font-medium transition",
                stageFilter === s
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {items.length === 0 ? (
          <EmptyState
            variant="inline"
            className="py-14"
            icon={Inbox}
            title={all.length === 0 ? "No leads yet" : "No leads match your filters"}
            description={
              all.length === 0
                ? "Capture leads from your landing page, generated GTM outputs, or add them manually."
                : "Try clearing the search or selecting a different stage."
            }
            action={
              all.length === 0 && (
                <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add lead
                </Button>
              )
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5 text-left">Lead</th>
                <th className="px-4 py-2.5 text-left">Source</th>
                <th className="px-4 py-2.5 text-left">Stage</th>
                <th className="px-4 py-2.5 text-right">Value</th>
                <th className="px-4 py-2.5 text-left">Last touch</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {items.map((l) => (
                <tr key={l.id} className="hover:bg-surface-2/60 transition">
                  <td className="px-4 py-3">
                    <div className="font-medium">{l.name}</div>
                    {l.email && (
                      <div className="text-[11.5px] text-muted-foreground">{l.email}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[12.5px] text-muted-foreground">
                    {l.source ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={l.stage}
                      onChange={async (e) => {
                        if (blockIfGuest("Sign up to update your pipeline.")) return;
                        const next = e.target.value as Stage;
                        const { error } = await supabase
                          .from("leads")
                          .update({ stage: next })
                          .eq("id", l.id);
                        if (error) toast.error(error.message);
                        else {
                          toast.success(`Moved to ${next}`);
                          qc.invalidateQueries({ queryKey: ["leads", currentOrgId] });
                        }
                      }}
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10.5px] font-medium border-0 outline-none cursor-pointer",
                        STAGE_BADGE[l.stage as Stage],
                      )}
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[12.5px]">
                    {l.value ? `$${Number(l.value).toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">
                    {new Date(l.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={async () => {
                        if (blockIfGuest("Sign up to remove leads.")) return;
                        if (!confirm("Delete lead?")) return;
                        const { error } = await supabase.from("leads").delete().eq("id", l.id);
                        if (error) toast.error(error.message);
                        else {
                          toast.success("Lead deleted");
                          qc.invalidateQueries({ queryKey: ["leads", currentOrgId] });
                        }
                      }}
                      className="text-[11.5px] text-muted-foreground hover:text-destructive transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CreateLeadSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={async (lead) => {
          if (blockIfGuest("Sign up to add leads.")) return;
          if (!currentOrgId || !user) return;
          const { error } = await supabase.from("leads").insert({
            ...lead,
            organization_id: currentOrgId,
            user_id: user.id,
          });
          if (error) toast.error(error.message);
          else {
            toast.success("Lead added");
            qc.invalidateQueries({ queryKey: ["leads", currentOrgId] });
            setCreateOpen(false);
          }
        }}
      />
    </div>
  );
}

function CreateLeadSheet({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreate: (l: {
    name: string;
    email: string;
    phone: string;
    source: string;
    value: number | null;
    stage: Stage;
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("");
  const [value, setValue] = useState("");
  const [stage, setStage] = useState<Stage>("New");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            New lead
          </div>
          <SheetTitle className="font-display">Capture a new lead</SheetTitle>
          <SheetDescription>
            Add a contact to your pipeline. You can update stage and value any time.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-5 space-y-3 px-4">
          <Field label="Full name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
            />
          </Field>
          <Field label="Phone">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 555 5555"
            />
          </Field>
          <Field label="Source">
            <Input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Landing page, referral…"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Value (USD)">
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0"
              />
            </Field>
            <Field label="Stage">
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as Stage)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {STAGES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>
          <Button
            className="w-full mt-2"
            disabled={!name.trim()}
            onClick={() =>
              onCreate({
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                source: source.trim(),
                value: value ? Number(value) : null,
                stage,
              })
            }
          >
            Add to pipeline
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({
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
      <div className="mb-1.5 text-[12px] font-medium text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </div>
      {children}
    </label>
  );
}
