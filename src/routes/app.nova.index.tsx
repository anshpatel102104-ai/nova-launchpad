import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { novaSystemsCatalog } from "@/lib/mock";
import { Cpu, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/app/nova/")({ component: NovaOverview });

function NovaOverview() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Workspace" title="Nova OS" description="The operations layer. Capture, qualify, follow up, onboard — without manual work." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {novaSystemsCatalog.map((s) => (
          <Link key={s.key} to={s.href} className="group rounded-xl border border-border bg-card p-4 hover:border-foreground/20 hover:shadow-soft transition">
            <div className="flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-nova/10 text-nova"><Cpu className="h-4 w-4" /></div>
            </div>
            <div className="mt-3 text-sm font-semibold">{s.name}</div>
            <div className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground">Open <ArrowRight className="h-3 w-3" /></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
