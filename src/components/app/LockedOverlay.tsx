import { Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function LockedOverlay({ requiredPlan = "Operate" }: { requiredPlan?: string }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <div className="rounded-xl border border-border bg-card p-5 shadow-elevated text-center max-w-xs">
        <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-muted">
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-sm font-medium">Available on {requiredPlan}</div>
        <p className="mt-1 text-xs text-muted-foreground">
          Unlock this to keep moving through your stage.
        </p>
        <Link
          to="/app/billing"
          className="mt-3 inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          Upgrade to {requiredPlan}
        </Link>
      </div>
    </div>
  );
}
