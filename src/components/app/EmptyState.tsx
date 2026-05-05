import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  variant = "card",
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  variant?: "card" | "inline";
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center",
        variant === "card" && "rounded-2xl p-12",
        className,
      )}
      style={
        variant === "card"
          ? {
              background: "var(--surface)",
              border: "1px dashed rgba(59,130,246,0.2)",
              boxShadow: "inset 0 0 60px rgba(59,130,246,0.03)",
            }
          : undefined
      }
    >
      {/* Layered glow icon */}
      <div className="relative mb-6">
        {/* Outer ambient ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%)",
            filter: "blur(20px)",
            transform: "scale(2.5)",
          }}
        />
        {/* Middle ring */}
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: "rgba(59,130,246,0.05)",
            border: "1px solid rgba(59,130,246,0.15)",
            transform: "scale(1.3)",
            borderRadius: "18px",
          }}
        />
        {/* Icon container */}
        <span
          className="relative flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.1))",
            border: "1px solid rgba(59,130,246,0.2)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 20px rgba(59,130,246,0.15)",
          }}
        >
          <Icon
            className="h-6 w-6"
            style={{
              color: "var(--primary)",
              opacity: 0.8,
              filter: "drop-shadow(0 0 6px rgba(59,130,246,0.5))",
            }}
          />
        </span>
      </div>

      <h3
        className="font-display text-[16px] font-bold tracking-tight"
        style={{ color: "var(--foreground)" }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="mt-2 max-w-xs text-[12.5px] leading-relaxed"
          style={{ color: "var(--muted-foreground)" }}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
