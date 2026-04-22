import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MissionHeader, StatusBadge, DifficultyBadge } from "@/components/app/MissionHeader";
import { launchpadCatalog } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Save, Terminal, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { blockIfGuest } from "@/lib/guest";

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

function useTypewriter(text: string, speed = 12) {
  const [out, setOut] = useState("");
  useEffect(() => {
    setOut("");
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      i += 4;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return out;
}

function ToolPage() {
  const { tool } = Route.useLoaderData();
  const { currentOrgId, user } = useAuth();
  const qc = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<Record<string, unknown> | null>(null);
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const outputText = output ? JSON.stringify(output, null, 2) : "";
  const typed = useTypewriter(outputText, 6);

  const handleGenerate = async () => {
    if (blockIfGuest("Sign up to run AI tools and unlock real outputs.")) return;
    if (!tool.wired) { toast.error("This tool is locked."); return; }
    if (!context.trim()) { toast.error("Add some context first."); return; }
    setGenerating(true);
    setOutput(null);
    try {
      const payload: Record<string, unknown> = { idea: context, business: title || context, target: title, context, goal: context, offer: context, url: context };
      const { data, error } = await supabase.functions.invoke(tool.toolKey, { body: payload });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setOutput(data.output);
      toast.success("Mission complete");
      if (currentOrgId) {
        qc.invalidateQueries({ queryKey: ["tool_runs", currentOrgId] });
        qc.invalidateQueries({ queryKey: ["generated_assets", currentOrgId] });
        qc.invalidateQueries({ queryKey: ["usage", currentOrgId] });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Mission failed");
    } finally {
      setGenerating(false);
    }
  };

  const saveToAssets = async () => {
    if (blockIfGuest("Sign up to save assets to your vault.")) return;
    if (!currentOrgId || !user || !output) return;
    const { error } = await supabase.from("generated_assets").insert([{
      organization_id: currentOrgId,
      user_id: user.id,
      category: tool.toolKey,
      kind: tool.key,
      title: title || tool.name,
      content: output as never,
    }]);
    if (error) toast.error(error.message);
    else { toast.success("Saved to vault"); qc.invalidateQueries({ queryKey: ["generated_assets", currentOrgId] }); }
  };

  return (
    <div className="space-y-6">
      <MissionHeader
        label="BRIEFING"
        title={tool.name}
        description={tool.desc}
        actions={
          <div className="flex items-center gap-2">
            <DifficultyBadge level={tool.difficulty} />
            <StatusBadge variant="active" live />
            <Link to="/app/launchpad" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground">← Back</Link>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Briefing / inputs */}
        <div className="tactical-card scanlines relative overflow-hidden rounded-xl border border-border bg-card p-5">
          <div className="relative z-[2]">
            <div className="mission-title text-[10px]">INTEL INPUT</div>
            <div className="mt-4 space-y-3">
              <div>
                <div className="mb-1.5 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Designation</div>
                <Input className="terminal-input" placeholder="e.g. Northwind Labs" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <div className="mb-1.5 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Mission Brief</div>
                <Textarea
                  rows={7}
                  className="terminal-input"
                  placeholder="> describe your idea, audience, and primary goal..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                />
              </div>
              <Button onClick={handleGenerate} disabled={generating || !context} className="btn-execute w-full">
                {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> EXECUTING...</> : <><Zap className="h-4 w-4" /> EXECUTE</>}
              </Button>
              <div className="text-center font-display text-[10px] tracking-[0.18em] text-primary-glow">
                REWARD: +{tool.xp} XP
              </div>
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="tactical-card scanlines relative min-h-[320px] overflow-hidden rounded-xl border border-border bg-card p-5">
          <div className="relative z-[2] flex items-center justify-between">
            <div className="mission-title text-[10px] flex items-center gap-2">
              <Terminal className="h-3 w-3" /> OUTPUT STREAM
            </div>
            {output && (
              <Button size="sm" variant="outline" onClick={saveToAssets} className="gap-1.5">
                <Save className="h-3.5 w-3.5" /> Save to Vault
              </Button>
            )}
          </div>

          {!output && !generating && (
            <div className="relative z-[2] mt-12 text-center text-sm text-muted-foreground">
              <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                <Terminal className="h-4 w-4" />
              </div>
              <div>Awaiting mission execution.</div>
            </div>
          )}

          {generating && (
            <div className="relative z-[2] mt-6 space-y-2 animate-pulse">
              <div className="h-3 w-3/4 rounded bg-muted" />
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-5/6 rounded bg-muted" />
              <div className="h-3 w-2/3 rounded bg-muted" />
            </div>
          )}

          {output && (
            <pre className="relative z-[2] mt-4 max-h-[420px] overflow-auto rounded-md border border-primary/20 bg-background/60 p-3 font-mono text-xs leading-relaxed text-foreground/90">
              <span className="caret">{typed}</span>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
