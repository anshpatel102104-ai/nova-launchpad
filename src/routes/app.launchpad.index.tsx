import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { launchpadTools, currentCompany } from "@/lib/mock";
import { Rocket, Sparkles, ArrowRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/launchpad/")({
  component: LaunchpadOverview,
});

const SEQUENCE = ["idea-validator", "pitch-generator", "gtm-strategy", "first-10-customers", "landing-page"];

function LaunchpadOverview() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Launchpad"
        description="From idea to launch. Strategy that flows into Nova once you're live."
        actions={
          <Link to="/app/launchpad/history" className="text-sm text-muted-foreground hover:text-foreground">
            View history →
          </Link>
        }
      />

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-launchpad" />
          Recommended sequence for {currentCompany.stage}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {SEQUENCE.map((key, i) => {
            const tool = launchpadTools.find((t) => t.key === key)!;
            return (
              <Link key={key} to="/app/launchpad/$tool" params={{ tool: key }} className="flex items-center gap-2">
                <span className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-medium",
                  tool.outputs > 0 ? "border-success/30 bg-success/10 text-success" : "border-border bg-muted text-foreground hover:bg-accent",
                )}>
                  {i + 1}. {tool.name}
                </span>
                {i < SEQUENCE.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">All tools · 10</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {launchpadTools.map((tool) => (
            <Link
              key={tool.key}
              to="/app/launchpad/$tool"
              params={{ tool: tool.key }}
              className="group rounded-xl border border-border bg-card p-4 hover:border-foreground/20 hover:shadow-soft transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-launchpad/10 text-launchpad">
                  <Rocket className="h-4 w-4" />
                </div>
                {!tool.wired && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
              <div className="mt-3 text-sm font-semibold">{tool.name}</div>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{tool.desc}</p>
              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{tool.outputs} {tool.outputs === 1 ? "output" : "outputs"}</span>
                <span>{tool.lastUsed}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
