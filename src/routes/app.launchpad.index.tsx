import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { launchpadCatalog } from "@/lib/mock";
import { Rocket, Lock } from "lucide-react";

export const Route = createFileRoute("/app/launchpad/")({ component: LaunchpadOverview });

function LaunchpadOverview() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Launchpad"
        description="From idea to launch. Strategy that flows into Nova once you're live."
        actions={<Link to="/app/launchpad/history" className="text-sm text-muted-foreground hover:text-foreground">View history →</Link>}
      />
      <div>
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">All tools · {launchpadCatalog.length}</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {launchpadCatalog.map((tool) => (
            <Link key={tool.key} to="/app/launchpad/$tool" params={{ tool: tool.key }} className="group rounded-xl border border-border bg-card p-4 hover:border-foreground/20 hover:shadow-soft transition">
              <div className="flex items-start justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-launchpad/10 text-launchpad"><Rocket className="h-4 w-4" /></div>
                {!tool.wired && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
              <div className="mt-3 text-sm font-semibold">{tool.name}</div>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{tool.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
