import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MissionHeader } from "@/components/app/MissionHeader";
import { useAuth } from "@/lib/auth";
import { generatedAssetsQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Vault, Rocket, FileText, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { blockIfGuest } from "@/lib/guest";

export const Route = createFileRoute("/app/assets")({ component: AssetsPage });

const KIND_TONE: Record<string, string> = {
  "generate-pitch": "border-purple-500/30 bg-purple-500/10 text-purple-400",
  "generate-offer": "border-primary/30 bg-primary/10 text-primary-glow",
  "generate-followup-sequence": "border-blue-500/30 bg-blue-500/10 text-blue-400",
  "analyze-website": "border-warning/30 bg-warning/10 text-warning",
  "generate-gtm-strategy": "border-launchpad/30 bg-launchpad/10 text-launchpad",
  "validate-idea": "border-success/30 bg-success/10 text-success",
  "generate-ops-plan": "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "generate-pitch", label: "Pitch Decks" },
  { key: "generate-offer", label: "Offers" },
  { key: "generate-followup-sequence", label: "Email Sequences" },
  { key: "analyze-website", label: "Audits" },
];

function AssetsPage() {
  const { currentOrgId } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const assetsQ = useQuery({ ...generatedAssetsQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const all = assetsQ.data ?? [];
  const assets = useMemo(() => filter === "all" ? all : all.filter((a) => a.category === filter), [all, filter]);

  const downloadJSON = (a: { title: string; content: unknown }) => {
    const blob = new Blob([JSON.stringify(a.content, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${a.title.replace(/\s+/g, "_")}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const deleteAsset = async (id: string) => {
    if (blockIfGuest("Sign up to manage your real vault.")) return;
    const { error } = await supabase.from("generated_assets").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Removed from vault"); qc.invalidateQueries({ queryKey: ["generated_assets", currentOrgId] }); }
  };

  return (
    <div className="space-y-6">
      <MissionHeader
        label="VAULT — GENERATED ASSETS"
        title="Asset Library"
        description="Every battle-ready asset your AI specialists have generated."
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full border px-3 py-1.5 font-display text-[11px] font-semibold uppercase tracking-[0.14em] transition",
              filter === f.key
                ? "border-primary bg-primary/15 text-primary-glow"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {assets.length === 0 ? (
        <div className="tactical-card scanlines relative rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <div className="relative z-[2]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
              <Vault className="h-6 w-6" />
            </div>
            <h2 className="mt-4 font-display text-lg font-semibold">Your vault is empty</h2>
            <p className="mt-1 text-sm text-muted-foreground">Run a tool to generate your first asset.</p>
            <Link to="/app/launchpad">
              <Button className="btn-execute mt-4 gap-2"><Rocket className="h-4 w-4" /> OPEN LAUNCHPAD</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((a) => (
            <div key={a.id} className="tactical-card scanlines relative overflow-hidden rounded-xl border border-border bg-card p-5">
              <div className="relative z-[2] flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <span className={cn("rounded border px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.14em]", KIND_TONE[a.category] ?? "border-border text-muted-foreground")}>
                  {a.category.replace(/-/g, " ")}
                </span>
              </div>
              <div className="relative z-[2] mt-4 truncate font-display text-base font-semibold">{a.title}</div>
              <div className="relative z-[2] mt-1 text-[11px] text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</div>
              <div className="relative z-[2] mt-4 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => downloadJSON(a)}>
                  <Download className="h-3.5 w-3.5" /> Download
                </Button>
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => deleteAsset(a.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
