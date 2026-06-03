import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { generatedAssetsQuery } from "@/lib/queries";
import { Mail, Plus, ArrowRight, CalendarDays } from "lucide-react";

export const Route = createFileRoute("/app/nova/followup")({ component: FollowUp });

function stepCount(metadata: unknown): number {
  const m = (metadata ?? {}) as Record<string, unknown>;
  const steps = m.steps as unknown[] | undefined;
  if (Array.isArray(steps)) return steps.length;
  const total = m.total_steps;
  if (typeof total === "number") return total;
  return 5;
}

function FollowUp() {
  const { currentOrgId } = useAuth();
  const q = useQuery({
    ...generatedAssetsQuery(currentOrgId ?? "", "generate-followup-sequence"),
    enabled: !!currentOrgId,
  });
  const items = q.data ?? [];

  const totalSteps = items.reduce((sum, a) => sum + stepCount(a.metadata), 0);
  const newest = items[0];
  const lastRun = newest
    ? new Date(newest.created_at).toLocaleDateString()
    : "Never";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Nova OS"
        title="Follow-Up & Booking"
        description="AI-generated outreach sequences and booking automations."
        actions={
          <Link to="/app/launchpad/$tool" params={{ tool: "followup-sequence" }}>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> New sequence
            </Button>
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KPI label="Total Sequences" value={items.length.toString()} />
        <KPI label="Total Steps" value={totalSteps.toString()} accent />
        <KPI label="Last Run" value={lastRun} />
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No follow-up sequences yet"
          description="Generate a multi-step outreach sequence from Launchpad, then manage it here."
          action={
            <Link to="/app/launchpad/$tool" params={{ tool: "followup-sequence" }}>
              <Button>Generate sequence</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-2">
          {items.map((asset) => {
            const steps = stepCount(asset.metadata);
            return (
              <div
                key={asset.id}
                className="rounded-xl border border-border bg-surface p-4 shadow-soft"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-[14px] font-semibold tracking-tight">
                      {asset.title}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5">
                        {steps} {steps === 1 ? "step" : "steps"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5">
                        <CalendarDays className="h-2.5 w-2.5" />
                        Generated {new Date(asset.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link to="/app/launchpad/history">
                      <Button size="sm" variant="outline" className="gap-1.5 text-[12px]">
                        View <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                    <Link to="/app/launchpad/$tool" params={{ tool: "followup-sequence" }}>
                      <Button size="sm" className="text-[12px]">
                        Generate New
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function KPI({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={
          "mt-1 font-display text-xl font-semibold tracking-tight " + (accent ? "text-accent" : "")
        }
      >
        {value}
      </div>
    </div>
  );
}
