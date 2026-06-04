import { cn } from "@/lib/utils";
import type { FounderLevel } from "@/hooks/use-founder-progress";

interface FounderLevelBadgeProps {
  level: FounderLevel;
  levelLabel: string;
  xpProgressInLevel?: number;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
  className?: string;
}

const LEVEL_COLORS: Record<number, string> = {
  1: "var(--level-1-color)",
  2: "var(--level-2-color)",
  3: "var(--level-3-color)",
  4: "var(--level-4-color)",
  5: "var(--level-5-color)",
  6: "var(--level-6-color)",
  7: "var(--level-7-color)",
  8: "var(--level-8-color)",
  9: "var(--level-9-color)",
  10: "var(--level-10-color)",
};

const SIZE_CLASSES = {
  sm: "text-[9px] px-1.5 py-0.5 gap-1",
  md: "text-[10px] px-2 py-0.5 gap-1.5",
  lg: "text-[12px] px-3 py-1 gap-2",
};

export function FounderLevelBadge({
  level,
  levelLabel,
  xpProgressInLevel,
  size = "md",
  showProgress = false,
  className,
}: FounderLevelBadgeProps) {
  const color = LEVEL_COLORS[level] ?? LEVEL_COLORS[1];

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className={cn("level-badge shrink-0", SIZE_CLASSES[size])} style={{ color }}>
        <span
          className="font-mono font-black"
          style={{
            background: `radial-gradient(circle, ${color} 0%, color-mix(in oklab, ${color} 70%, white) 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          L{level}
        </span>
        <span>{levelLabel}</span>
      </span>

      {showProgress && typeof xpProgressInLevel === "number" && (
        <div className="context-xp-bar w-full">
          <div className="fill" style={{ width: `${xpProgressInLevel}%` }} />
        </div>
      )}
    </div>
  );
}
