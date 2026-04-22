import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { clients, onboardingTasks } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { Plus, Check, Circle } from "lucide-react";

export const Route = createFileRoute("/app/nova/clients")({
  component: Clients,
});

function Clients() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Nova OS"
        title="Client Onboarding"
        description="Every new client moves through the same automated checklist."
        actions={<Button size="sm"><Plus className="h-4 w-4" /> Add client</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {clients.map((c) => (
          <div key={c.id} className="rounded-xl border border-border bg-card p-5">
            <div className="text-sm font-semibold">{c.name}</div>
            <div className="text-xs text-muted-foreground">Started {c.started}</div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{c.tasksDone} / {c.tasksTotal} tasks</span>
              <span className="font-medium">{c.progress}%</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-muted">
              <div className="h-full rounded-full bg-nova" style={{ width: `${c.progress}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="text-sm font-semibold">Standard onboarding checklist</div>
        <div className="mt-3 space-y-2">
          {onboardingTasks.map((t) => (
            <div key={t.title} className="flex items-center gap-2 text-sm">
              {t.done
                ? <Check className="h-4 w-4 text-success" />
                : <Circle className="h-4 w-4 text-muted-foreground" />}
              <span className={t.done ? "text-muted-foreground line-through" : ""}>{t.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
