// Roadmap item: "Domain/business-setup checklist persistence"
// Renders the org's setup_checklist_items grouped by category with toggleable status.

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { blockIfGuest } from "@/lib/guest";
import {
  CHECKLIST_CATEGORY_META,
  setChecklistItemStatus,
  type ChecklistCategory,
  type SetupChecklistItem,
} from "@/lib/queries";

interface Props {
  orgId: string;
  items: SetupChecklistItem[];
  onChanged?: () => void;
}

const CATEGORY_ORDER: ChecklistCategory[] = ["domain", "email", "legal", "banking", "tools"];

export function SetupChecklistCard({ orgId, items, onChanged }: Props) {
  const qc = useQueryClient();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const total = items.length;
  const done = items.filter((i) => i.status === "done").length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  const toggle = async (item: SetupChecklistItem) => {
    if (blockIfGuest("Sign up to track your business-setup checklist.")) return;
    const next = item.status === "done" ? "pending" : "done";
    setPendingId(item.id);
    try {
      await setChecklistItemStatus(item.id, next);
      await qc.invalidateQueries({ queryKey: ["setup_checklist_items", orgId] });
      onChanged?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't update that item");
    } finally {
      setPendingId(null);
    }
  };

  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: items.filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Progress
          </span>
          <span className="text-[11px] font-mono font-semibold text-primary">
            {done}/{total} done
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${progress}%`, background: "var(--primary)" }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {grouped.map(({ cat, items: catItems }) => (
          <div key={cat}>
            <div className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-2">
              {CHECKLIST_CATEGORY_META[cat].label}
            </div>
            <div className="space-y-1.5">
              {catItems.map((item) => {
                const isDone = item.status === "done";
                const isPending = pendingId === item.id;
                return (
                  <label
                    key={item.id}
                    className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer transition-colors hover:bg-surface-2"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 mt-0.5 shrink-0 animate-spin text-muted-foreground" />
                    ) : (
                      <Checkbox
                        checked={isDone}
                        onCheckedChange={() => toggle(item)}
                        className="mt-0.5"
                      />
                    )}
                    <span
                      className={
                        isDone
                          ? "text-[13px] text-muted-foreground line-through"
                          : "text-[13px] text-foreground"
                      }
                    >
                      {item.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChecklistSummaryRow({ items }: { items: SetupChecklistItem[] }) {
  const total = items.length;
  const done = items.filter((i) => i.status === "done").length;
  const isComplete = total > 0 && done === total;
  return (
    <div className="flex items-center gap-2 text-[12px]">
      {isComplete ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--success)]" />
      ) : (
        <Circle className="h-3.5 w-3.5 text-muted-foreground" />
      )}
      <span className="text-muted-foreground">
        Business setup: <span className="font-semibold text-foreground">{done}</span>/{total}{" "}
        complete
      </span>
    </div>
  );
}
