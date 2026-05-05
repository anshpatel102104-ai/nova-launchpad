import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MissionHeader, XpBar } from "@/components/app/MissionHeader";
import { useAuth } from "@/lib/auth";
import { leadsQuery, subscriptionQuery, planEntitlementsQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Inbox, Plus, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { blockIfGuest } from "@/lib/guest";

export const Route = createFileRoute("/app/leads")({ component: LeadsPage });

const STAGES = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"] as const;
type Stage = (typeof STAGES)[number];

const STAGE_COLOR: Record<Stage, string> = {
  New: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  Contacted: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  Qualified: "bg-primary/10 text-primary border-primary/30",
  Proposal: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  Won: "bg-success/10 text-success border-success/30",
  Lost: "bg-destructive/10 text-destructive border-destructive/30",
};

const PLAN_LIMIT: Record<string, number> = {
  starter: 50,
  launch: 250,
  operate: 2000,
  scale: 10000,
};

function LeadsPage() {
  const { currentOrgId, user } = useAuth();
  const qc = useQueryClient();
  const leadsQ = useQuery({ ...leadsQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const subQ = useQuery({ ...subscriptionQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const _plansQ = useQuery(planEntitlementsQuery());

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [openAdd, setOpenAdd] = useState(false);

  const leads = leadsQ.data ?? [];
  const limit = PLAN_LIMIT[subQ.data?.plan ?? "starter"] ?? 50;
  const usagePct = Math.min(100, (leads.length / limit) * 100);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (stageFilter !== "all" && l.stage !== stageFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return [l.name, l.email, l.phone, l.source].some((v) => v?.toLowerCase().includes(s));
      }
      return true;
    });
  }, [leads, search, stageFilter]);

  const updateStage = async (id: string, stage: Stage) => {
    if (blockIfGuest("Sign up to update your live pipeline.")) return;
    const { error } = await supabase.from("leads").update({ stage }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Stage updated");
      qc.invalidateQueries({ queryKey: ["leads", currentOrgId] });
    }
  };

  const deleteLead = async (id: string) => {
    if (blockIfGuest("Sign up to manage your real pipeline.")) return;
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Lead removed");
      qc.invalidateQueries({ queryKey: ["leads", currentOrgId] });
    }
  };

  return (
    <div className="space-y-6">
      <MissionHeader
        label="Leads"
        title="Pipeline"
        description="Track every prospect from first touch to close."
        actions={
          <Button
            onClick={() => {
              if (!blockIfGuest("Sign up to start tracking real leads.")) setOpenAdd(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Add lead
          </Button>
        }
      />

      {/* Lead count vs plan */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[11.5px] font-medium text-muted-foreground">Capacity</div>
            <div className="mt-1 font-display text-[18px] font-semibold">
              {leads.length}{" "}
              <span className="text-sm font-normal text-muted-foreground">/ {limit} leads</span>
            </div>
          </div>
          <div className="w-1/2 max-w-xs">
            <XpBar value={usagePct} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads..."
            className="pl-9"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {STAGES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table or empty */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Inbox className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-display text-lg font-semibold">No leads yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first lead to start tracking the pipeline.
          </p>
          <Button
            onClick={() => {
              if (!blockIfGuest("Sign up to start tracking real leads.")) setOpenAdd(true);
            }}
            className="mt-4 gap-2"
          >
            <Plus className="h-4 w-4" /> Add lead
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="border-b border-border text-left text-[11.5px] font-medium text-muted-foreground">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Added</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr
                    key={l.id}
                    className="border-b border-border/60 transition last:border-b-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium">{l.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{l.email ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{l.phone ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={l.stage as string}
                        onValueChange={(v) => updateStage(l.id, v as Stage)}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-7 w-32 border text-[11.5px] font-medium",
                            STAGE_COLOR[l.stage as Stage],
                          )}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STAGES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{l.source ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(l.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteLead(l.id)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddLeadDialog
        open={openAdd}
        onOpenChange={setOpenAdd}
        onCreate={async (form) => {
          if (!currentOrgId || !user) return;
          const { error } = await supabase.from("leads").insert({
            organization_id: currentOrgId,
            user_id: user.id,
            ...form,
          });
          if (error) toast.error(error.message);
          else {
            toast.success("Lead added");
            qc.invalidateQueries({ queryKey: ["leads", currentOrgId] });
            setOpenAdd(false);
          }
        }}
      />
    </div>
  );
}

function AddLeadDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreate: (form: {
    name: string;
    email?: string;
    phone?: string;
    source?: string;
    notes?: string;
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Name required");
      return;
    }
    setBusy(true);
    await onCreate({
      name,
      email: email || undefined,
      phone: phone || undefined,
      source: source || undefined,
      notes: notes || undefined,
    });
    setBusy(false);
    setName("");
    setEmail("");
    setPhone("");
    setSource("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-[18px]">Add a new lead</DialogTitle>
          <DialogDescription>
            Capture a prospect and start tracking them through your pipeline.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label="Name *">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
          </div>
          <Field label="Source">
            <Input
              placeholder="e.g. LinkedIn, referral"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </Field>
          <Field label="Notes">
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            Add lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[12.5px] font-medium text-foreground">{label}</div>
      {children}
    </label>
  );
}
