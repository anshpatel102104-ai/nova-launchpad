import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { launchpadCatalog } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/app/launchpad/$tool")({
  loader: ({ params }) => {
    const tool = launchpadCatalog.find((t) => t.key === params.tool);
    if (!tool) throw notFound();
    return { tool };
  },
  component: ToolPage,
  notFoundComponent: () => (
    <div className="p-6"><div className="text-sm">Unknown tool. <Link to="/app/launchpad" className="underline">Back to Launchpad</Link></div></div>
  ),
});

function ToolPage() {
  const { tool } = Route.useLoaderData();
  const { currentOrgId } = useAuth();
  const qc = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<Record<string, unknown> | null>(null);
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");

  const handleGenerate = async () => {
    if (!tool.wired) { toast.error("This tool isn't wired yet."); return; }
    setGenerating(true);
    setOutput(null);
    try {
      const payload: Record<string, unknown> = { idea: context, business: title || context, target: title, context, goal: context, offer: context, url: context };
      const { data, error } = await supabase.functions.invoke(tool.toolKey, { body: payload });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setOutput(data.output);
      toast.success("Generated");
      if (currentOrgId) {
        qc.invalidateQueries({ queryKey: ["tool_runs", currentOrgId] });
        qc.invalidateQueries({ queryKey: ["generated_assets", currentOrgId] });
        qc.invalidateQueries({ queryKey: ["usage", currentOrgId] });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Launchpad" title={tool.name} description={tool.desc} actions={<Link to="/app/launchpad" className="text-sm text-muted-foreground hover:text-foreground">← Back</Link>} />

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Input</div>
          <div className="mt-3 space-y-3">
            <div>
              <div className="mb-1.5 text-xs font-medium">Title / business</div>
              <Input placeholder="e.g. Northwind Labs" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <div className="mb-1.5 text-xs font-medium">Context</div>
              <Textarea rows={6} placeholder="Describe your idea, audience, and goal." value={context} onChange={(e) => setContext(e.target.value)} />
            </div>
            <Button onClick={handleGenerate} disabled={generating || !context} className="w-full">
              {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="h-4 w-4" /> Generate</>}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 min-h-[280px]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Output</div>
          {!output && !generating && <div className="mt-10 text-center text-sm text-muted-foreground">Your structured output will appear here.</div>}
          {generating && (
            <div className="mt-4 space-y-2 animate-pulse">
              <div className="h-4 w-3/4 rounded bg-muted" /><div className="h-3 w-full rounded bg-muted" /><div className="h-3 w-5/6 rounded bg-muted" />
            </div>
          )}
          {output && (
            <pre className="mt-4 overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(output, null, 2)}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
