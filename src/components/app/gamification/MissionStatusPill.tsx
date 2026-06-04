import { cn } from "@/lib/utils";
import { Target } from "lucide-react";

interface MissionStatusPillProps {
  title: string | null;
  stepsCompleted: number;
  stepsTotal: number;
  compact?: boolean;
  className?: string;
}

export function MissionStatusPill({
  title,
  stepsCompleted,
  stepsTotal,
  compact = false,
  className,
}: MissionStatusPillProps) {
  const displayTitle = title ?? "No active mission";
  const truncated = displayTitle.length > (compact ? 28 : 40)
    ? displayTitle.slice(0, compact ? 28 : 40) + "…"
    : displayTitle;

  return (
    <div
      className={cn(
        "flex items-center gap-2 min-w-0",
        className,
      )}
    >
      {/* Live dot */}
      <span
        className="nova-live-dot h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: title ? "var(--primary)" : "var(--muted-foreground)" }}
      />

      {!compact && (
        <Target
          className="h-3 w-3 shrink-0"
          style={{ color: title ? "var(--primary)" : "var(--muted-foreground)" }}
        />
      )}

      <span
        className="truncate font-medium"
        style={{
          fontSize: compact ? "11px" : "12.5px",
          color: title ? "var(--foreground)" : "var(--muted-foreground)",
          letterSpacing: "-0.01em",
        }}
      >
        {truncated}
      </span>

      {stepsTotal > 0 && (
        <span
          className="shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold"
          style={{
            background: "rgba(249,115,22,0.10)",
            color: "var(--primary)",
            border: "1px solid rgba(249,115,22,0.22)",
          }}
        >
          {stepsCompleted}/{stepsTotal}
        </span>
      )}
    </div>
  );
}
