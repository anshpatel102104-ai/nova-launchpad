import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { workflows } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Workflow as WorkflowIcon } from "lucide-react";

export const Route = createFileRoute("/app/nova/workflows")({
  component: Workflows,
});

function Workflows() {
  const [state, setState] = useState(workflows.map((w) => ({ ...w })));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Nova OS"
        title="Automation Workflows"
        description="Trigger → Action → Output. Move leads, send replies, kick off onboarding."
        actions={<Button size="sm"><Plus className="h-4 w-4" /> New workflow</Button>}
      />

      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {state.map((w, i) => (
          <div key={w.id} className="flex items-center gap-4 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-nova/10 text-nova">
              <WorkflowIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{w.name}</div>
              <div className="text-xs text-muted-foreground">Trigger: {w.trigger} · {w.actions} actions · {w.runs} runs</div>
            </div>
            <Switch
              checked={w.enabled}
              onCheckedChange={(v) => setState((s) => s.map((x, j) => j === i ? { ...x, enabled: v } : x))}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
