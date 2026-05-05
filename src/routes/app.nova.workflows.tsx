import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Switch } from "@/components/ui/switch";
import { Workflow as WorkflowIcon, Zap, ArrowRight, CircleDot } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { automationSettingsQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { blockIfGuest } from "@/lib/guest";

export const Route = createFileRoute("/app/nova/workflows")({ component: Workflows });

function prettyKey(k: string) {
  return k.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function Workflows() {
  const { currentOrgId } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({ ...automationSettingsQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const items = q.data ?? [];

  const toggle = async (id: string, enabled: boolean) => {
    if (blockIfGuest("Sign up to enable automations.")) return;
    const { error } = await supabase.from("automation_settings").update({ enabled }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(enabled ? "Automation enabled" : "Automation paused");
      qc.invalidateQueries({ queryKey: ["automation_settings", currentOrgId] });
    }
  };

  const enabled = items.filter((w) => w.enabled).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Nova OS"
        title="Automation Workflows"
        description="Trigger → Action → Output. Wire your business to itself."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KPI label="Total workflows" value={items.length.toString()} />
        <KPI label="Active" value={enabled.toString()} accent />
        <KPI label="Paused" value={(items.length - enabled).toString()} />
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={WorkflowIcon}
          title="No automations configured yet"
          description="Connect a Nova module to provision your first workflow. Each module ships with a default trigger → action chain."
        />
      ) : (
        <div className="space-y-2">
          {items.map((w) => {
            const config = (w.config as Record<string, unknown>) ?? {};
            const trigger = (config.trigger as string) ?? "Event received";
            const action = (config.action as string) ?? prettyKey(w.key);
            return (
              <div
                key={w.id}
                className="rounded-xl border border-border bg-surface p-4 shadow-soft"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <WorkflowIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-[14px] font-semibold tracking-tight">
                      {prettyKey(w.key)}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11.5px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5">
                        <CircleDot className="h-2.5 w-2.5" />
                        {trigger}
                      </span>
                      <ArrowRight className="h-3 w-3" />
                      <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5">
                        <Zap className="h-2.5 w-2.5" />
                        {action}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium " +
                        (w.enabled
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-muted text-muted-foreground")
                      }
                    >
                      <span
                        className={
                          "h-1.5 w-1.5 rounded-full " +
                          (w.enabled ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground")
                        }
                      />
                      {w.enabled ? "Live" : "Paused"}
                    </span>
                    <Switch checked={w.enabled} onCheckedChange={(v) => toggle(w.id, v)} />
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
