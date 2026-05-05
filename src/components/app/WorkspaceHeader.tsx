import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Variant = "dashboard" | "launchpad" | "nova" | "assets" | "billing" | "settings" | "neutral";

const V: Record<
  Variant,
  {
    gradient: string;
    eyebrowColor: string;
    borderColor: string;
    glowColor: string;
    orb1: string;
    orb2: string;
  }
> = {
  dashboard: {
    gradient: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
    eyebrowColor: "#60a5fa",
    borderColor: "rgba(59,130,246,0.2)",
    glowColor: "rgba(59,130,246,0.08)",
    orb1: "rgba(59,130,246,0.18)",
    orb2: "rgba(139,92,246,0.12)",
  },
  launchpad: {
    gradient: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
    eyebrowColor: "#60a5fa",
    borderColor: "rgba(59,130,246,0.2)",
    glowColor: "rgba(59,130,246,0.06)",
    orb1: "rgba(59,130,246,0.15)",
    orb2: "rgba(99,102,241,0.1)",
  },
  nova: {
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #f97316 100%)",
    eyebrowColor: "#a78bfa",
    borderColor: "rgba(139,92,246,0.2)",
    glowColor: "rgba(139,92,246,0.06)",
    orb1: "rgba(139,92,246,0.18)",
    orb2: "rgba(249,115,22,0.1)",
  },
  assets: {
    gradient: "linear-gradient(135deg, #f97316 0%, #8b5cf6 100%)",
    eyebrowColor: "#fb923c",
    borderColor: "rgba(249,115,22,0.2)",
    glowColor: "rgba(249,115,22,0.06)",
    orb1: "rgba(249,115,22,0.15)",
    orb2: "rgba(139,92,246,0.1)",
  },
  billing: {
    gradient: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
    eyebrowColor: "#22d3ee",
    borderColor: "rgba(6,182,212,0.2)",
    glowColor: "rgba(6,182,212,0.05)",
    orb1: "rgba(59,130,246,0.12)",
    orb2: "rgba(6,182,212,0.12)",
  },
  settings: {
    gradient: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
    eyebrowColor: "rgba(240,244,255,0.4)",
    borderColor: "rgba(255,255,255,0.06)",
    glowColor: "rgba(255,255,255,0.02)",
    orb1: "rgba(255,255,255,0.04)",
    orb2: "rgba(255,255,255,0.02)",
  },
  neutral: {
    gradient: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)",
    eyebrowColor: "rgba(240,244,255,0.4)",
    borderColor: "rgba(255,255,255,0.06)",
    glowColor: "rgba(255,255,255,0.02)",
    orb1: "rgba(255,255,255,0.04)",
    orb2: "rgba(255,255,255,0.02)",
  },
};

export function WorkspaceHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  variant = "neutral",
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  variant?: Variant;
  actions?: React.ReactNode;
  className?: string;
}) {
  const v = V[variant];
  const isVibrant = !["settings", "neutral"].includes(variant);

  return (
    <header
      className={cn("relative overflow-hidden rounded-2xl", className)}
      style={{
        background: "var(--surface)",
        border: `1px solid ${v.borderColor}`,
        boxShadow: `0 0 0 1px ${v.borderColor}, 0 1px 3px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      {/* Ambient orbs */}
      {isVibrant && (
        <>
          <div
            className="orb-float pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full"
            style={{
              background: `radial-gradient(circle, ${v.orb1}, transparent 70%)`,
              filter: "blur(40px)",
            }}
          />
          <div
            className="orb-float-2 pointer-events-none absolute -bottom-20 -right-10 h-48 w-48 rounded-full"
            style={{
              background: `radial-gradient(circle, ${v.orb2}, transparent 70%)`,
              filter: "blur(30px)",
            }}
          />
        </>
      )}

      {/* Top neon edge */}
      {isVibrant && (
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${v.eyebrowColor}60, transparent)`,
          }}
        />
      )}

      {/* Dot grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(${v.eyebrowColor}18 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="flex min-w-0 items-start gap-4">
          {Icon && (
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
              style={{
                background: v.gradient,
                boxShadow: `0 4px 20px ${v.eyebrowColor}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
              }}
            >
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <div
                className="text-[9.5px] font-bold uppercase tracking-[0.22em]"
                style={{ color: v.eyebrowColor }}
              >
                {eyebrow}
              </div>
            )}
            <h1
              className="mt-1 font-display font-bold tracking-tight leading-tight"
              style={{
                fontSize: "clamp(1.5rem, 2vw + 1rem, 2.25rem)",
                color: "var(--foreground)",
                letterSpacing: "-0.03em",
              }}
            >
              {title}
            </h1>
            {description && (
              <p
                className="mt-1.5 max-w-2xl text-[13px] leading-relaxed"
                style={{ color: "var(--muted-foreground)" }}
              >
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
