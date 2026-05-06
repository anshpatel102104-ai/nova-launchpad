import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusPill } from "@/components/app/StatusPill";
import { LockedOverlay } from "@/components/app/LockedOverlay";
import { NOVA_SYSTEMS } from "@/lib/catalog";
import { useWorkspace } from "@/hooks/use-workspace";
import { canAccessSystem, PLANS } from "@/lib/plan";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/nova-os")({
  component: NovaOSPage,
});

function NovaOSPage() {
  const { workspace } = useWorkspace();
  return (
    <>
      <PageHeader
        eyebrow="Nova OS"
        title="6 systems that run your business."
        description="Activate ready-made automations for capture, booking, follow-up, reviews, and more."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {NOVA_SYSTEMS.map((sys, i) => {
          const unlocked = canAccessSystem(workspace.plan, i);
          return (
            <div key={sys.slug} className="relative">
              <div className="nova-card nova-card-hover p-5 h-full flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-9 w-9 rounded-md border border-border bg-surface-elevated grid place-items-center">
                    <sys.icon className="h-4 w-4 text-primary" />
                  </div>
                  <StatusPill tone={i === 0 ? "primary" : "muted"}>{i === 0 ? "Setup needed" : "Inactive"}</StatusPill>
                </div>
                <h3 className="text-sm font-semibold">{sys.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground flex-1">{sys.description}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                  <Cell label="Trigger" value={sys.trigger} />
                  <Cell label="Action" value={sys.action} />
                  <Cell label="Output" value={sys.output} />
                </div>
                <Button asChild size="sm" className="mt-4 w-fit" variant="outline">
                  <Link to="/app/nova-os/$slug" params={{ slug: sys.slug }}>
                    Open system <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
              {!unlocked && <LockedOverlay requiredPlan={PLANS.operate.name} />}
            </div>
          );
        })}
      </div>
    </>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-[11px] text-foreground mt-0.5 truncate">{value}</p>
    </div>
  );
}
