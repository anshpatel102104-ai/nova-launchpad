import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageHeader";
import { Switch } from "@/components/ui/switch";
import { Workflow as WorkflowIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { automationSettingsQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/nova/workflows")({ component: Workflows });

function Workflows() {
  const { currentOrgId } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({ ...automationSettingsQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const items = q.data ?? [];

  const toggle = async (id: string, enabled: boolean) => {
    const { error } = await supabase.from("automation_settings").update({ enabled }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(enabled ? "Enabled" : "Disabled"); qc.invalidateQueries({ queryKey: ["automation_settings", currentOrgId] }); }
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Nova OS" title="Automation Workflows" description="Trigger → Action → Output." />
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {items.length === 0 && <div className="px-4 py-6 text-center text-sm text-muted-foreground">No automations configured yet.</div>}
        {items.map((w) => (
          <div key={w.id} className="flex items-center gap-4 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-nova/10 text-nova"><WorkflowIcon className="h-4 w-4" /></div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{w.key}</div>
            </div>
            <Switch checked={w.enabled} onCheckedChange={(v) => toggle(w.id, v)} />
          </div>
        ))}
      </div>
    </div>
  );
}
