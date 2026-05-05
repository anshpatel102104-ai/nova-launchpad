import { STAGES, type Stage } from "@/lib/mock";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function StageTracker({ current }: { current: Stage }) {
  const idx = STAGES.indexOf(current);
  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      {STAGES.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap",
                done && "border-success/30 bg-success/10 text-success",
                active && "border-launchpad/30 bg-launchpad/10 text-launchpad",
                !done && !active && "border-border bg-muted text-muted-foreground",
              )}
            >
              {done ? (
                <Check className="h-3 w-3" />
              ) : (
                <span className="text-[10px] opacity-70">{i + 1}</span>
              )}
              {s}
            </div>
            {i < STAGES.length - 1 && <div className="h-px w-6 bg-border" />}
          </div>
        );
      })}
    </div>
  );
}
