import { cn } from "@/lib/utils";

export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative h-7 w-7 rounded-sm border border-primary/40 bg-background grid place-items-center nova-glow">
        {/* crosshair */}
        <div className="absolute inset-0 grid place-items-center">
          <div className="h-px w-3 bg-primary/60" />
        </div>
        <div className="absolute inset-0 grid place-items-center">
          <div className="w-px h-3 bg-primary/60" />
        </div>
        <div className="relative h-1.5 w-1.5 rounded-full bg-primary nova-live-dot" />
      </div>
      {showWordmark && (
        <div className="leading-none flex items-baseline gap-1">
          <span className="font-mono text-[13px] font-semibold tracking-[0.18em] uppercase">Nova</span>
          <span className="font-mono text-[13px] font-semibold tracking-[0.18em] uppercase text-primary">Ops</span>
        </div>
      )}
    </div>
  );
}
