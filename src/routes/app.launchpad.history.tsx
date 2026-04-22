import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { recentOutputs } from "@/lib/mock";

export const Route = createFileRoute("/app/launchpad/history")({
  component: History,
});

function History() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Launchpad"
        title="History"
        description="Every output you've generated, organized and reusable."
        actions={<Link to="/app/launchpad" className="text-sm text-muted-foreground hover:text-foreground">← Back</Link>}
      />
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {recentOutputs.map((o) => (
          <div key={o.title} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <div className="font-medium">{o.title}</div>
              <div className="text-xs text-muted-foreground">{o.tool} · {o.when}</div>
            </div>
            <button className="text-xs text-muted-foreground hover:text-foreground">Open</button>
          </div>
        ))}
      </div>
    </div>
  );
}
