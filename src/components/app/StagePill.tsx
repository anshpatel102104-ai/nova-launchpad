import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { organizationQuery } from "@/lib/queries";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const STAGES = ["Idea", "Validate", "Launch", "Operate", "Scale"] as const;
type Stage = (typeof STAGES)[number];

export function StagePill({ className }: { className?: string }) {
  const { currentOrgId } = useAuth();
  const orgQ = useQuery({
    ...organizationQuery(currentOrgId ?? ""),
    enabled: !!currentOrgId,
  });
  const stage = (orgQ.data?.stage ?? "Idea") as Stage;
  const idx = STAGES.indexOf(stage);

  return (
    <Link
      to="/app/settings"
      className={cn(
        "hidden xl:inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 pl-2 pr-2.5 py-1 text-[10.5px] font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground transition",
        className,
      )}
      title={`Stage: ${stage}`}
    >
      <span className="flex items-center gap-0.5">
        {STAGES.map((_, i) => (
          <span
            key={i}
            className={cn("h-1 w-2.5 rounded-full", i <= idx ? "bg-primary" : "bg-surface-offset")}
          />
        ))}
      </span>
      <span className="text-foreground/80">{stage}</span>
    </Link>
  );
}
