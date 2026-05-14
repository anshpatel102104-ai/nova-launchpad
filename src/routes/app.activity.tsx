import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusPill } from "@/components/app/StatusPill";
import { EmptyState } from "@/components/app/EmptyState";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Loader2, Activity as ActivityIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/app/activity")({
  component: ActivityPage,
});

function ActivityPage() {
  const { currentOrgId } = useAuth();

  const { data: runs, isLoading } = useQuery({
    queryKey: ["activity_tool_runs", currentOrgId],
    enabled: !!currentOrgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tool_runs")
        .select("id, tool_key, title, status, created_at, completed_at, error")
        .eq("organization_id", currentOrgId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const toneForStatus = (status: string) => {
    if (status === "completed") return "success" as const;
    if (status === "failed") return "destructive" as const;
    if (status === "running") return "primary" as const;
    return "muted" as const;
  };

  return (
    <>
      <PageHeader eyebrow="Activity" title="Everything happening in your workspace." />

      <div className="nova-card p-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading activity…
          </div>
        ) : !runs || runs.length === 0 ? (
          <EmptyState
            icon={ActivityIcon}
            title="No activity yet"
            description="Tool runs and workspace events will appear here once you start using Nova."
          />
        ) : (
          <ul className="relative space-y-5">
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
            {runs.map((run) => (
              <li key={run.id} className="relative flex items-start gap-4">
                <div className="h-8 w-8 rounded-full border border-border bg-surface-elevated grid place-items-center shrink-0 z-10">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pt-1">
                  <div>
                    <p className="text-sm font-medium">
                      {run.title ?? run.tool_key.replace(/-/g, " ")}
                    </p>
                    {run.status === "failed" && run.error && (
                      <p className="text-xs text-destructive mt-0.5 truncate max-w-sm">
                        {run.error}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-2">
                      <StatusPill tone={toneForStatus(run.status)} dot={false}>
                        {run.status}
                      </StatusPill>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
