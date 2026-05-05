import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { generatedAssetsQuery } from "@/lib/queries";
import { UserCheck, ArrowRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/nova/clients")({ component: Clients });

// Synthesize an onboarding "progress" from asset metadata when present, else stage from age.
function synthProgress(createdAt: string, metadata: Record<string, unknown> | null) {
  const meta = metadata ?? {};
  const explicit = typeof meta.progress === "number" ? meta.progress : null;
  if (explicit !== null) return Math.max(0, Math.min(100, explicit));
  const days = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / 86400000);
  if (days < 1) return 15;
  if (days < 3) return 35;
  if (days < 7) return 60;
  if (days < 14) return 80;
  return 100;
}

function Clients() {
  const { currentOrgId } = useAuth();
  const q = useQuery({
    ...generatedAssetsQuery(currentOrgId ?? "", "ops"),
    enabled: !!currentOrgId,
  });
  const items = q.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Nova OS"
        title="Client Onboarding"
        description="Track each client through your operating system from kickoff to live."
      />

      {items.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No active clients"
          description="Generate an Ops Plan in Launchpad to seed your first onboarding workflow, or wire the Onboarding module in Nova."
          action={
            <div className="flex gap-2">
              <Link to="/app/launchpad/$tool" params={{ tool: "ops-plan" }}>
                <Button size="sm" className="gap-1.5">
                  Generate Ops Plan <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <Link to="/app/nova">
                <Button size="sm" variant="outline">
                  Open modules
                </Button>
              </Link>
            </div>
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {items.map((c) => {
            const progress = synthProgress(
              c.created_at,
              c.metadata as Record<string, unknown> | null,
            );
            const stage =
              progress >= 100
                ? "Live"
                : progress >= 80
                  ? "Final review"
                  : progress >= 60
                    ? "Implementation"
                    : progress >= 35
                      ? "Discovery"
                      : "Kickoff";
            return (
              <div
                key={c.id}
                className="rounded-xl border border-border bg-surface p-5 shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      <FileText className="h-3 w-3" /> Ops plan
                    </div>
                    <div className="mt-1 truncate font-display text-[15px] font-semibold tracking-tight">
                      {c.title}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                      progress >= 100
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-accent/10 text-accent",
                    )}
                  >
                    {stage}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Onboarding progress</span>
                    <span className="font-mono">{progress}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-[11.5px] text-muted-foreground">
                  <span>Started {new Date(c.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
