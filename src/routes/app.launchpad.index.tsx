import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { launchpadCatalog } from "@/lib/mock";
import { useAuth } from "@/lib/auth";
import { toolRunsQuery } from "@/lib/queries";
import {
  Lock, Rocket, Zap, Target, Megaphone, Settings2, Mail, Globe, Swords, Tags, LineChart,
  ArrowUpRight, Search, Lightbulb, Skull, Trophy, UserPlus, FileText, GitCompare, History,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/launchpad/")({ component: LaunchpadOverview });

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "idea-validator": Lightbulb,
  "pitch-generator": Megaphone,
  "gtm-strategy": Target,
  "offer": Zap,
  "ops-plan": Settings2,
  "followup": Mail,
  "website-audit": Globe,
  "kill-my-idea": Skull,
  "funding-score": Trophy,
  "first-10-customers": UserPlus,
  "business-plan": FileText,
  "investor-emails": Mail,
  "idea-vs-idea": GitCompare,
  "landing-page": Globe,
  "competitor": Swords,
  "pricing": Tags,
  "revenue-projector": LineChart,
};

const FILTERS = [
  { key: "all",      label: "All tools" },
  { key: "active",   label: "Available" },
  { key: "soon",     label: "Coming soon" },
];

function LaunchpadOverview() {
  const { currentOrgId } = useAuth();
  const runsQ = useQuery({ ...toolRunsQuery(currentOrgId ?? "", 100), enabled: !!currentOrgId });
  const runsByTool = useMemo(() => {
    const map = new Map<string, number>();
    (runsQ.data ?? []).forEach((r) => map.set(r.tool_key, (map.get(r.tool_key) ?? 0) + 1));
    return map;
  }, [runsQ.data]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const tools = useMemo(() => {
    return launchpadCatalog.filter((t) => {
      if (filter === "active" && !t.wired) return false;
      if (filter === "soon" && t.wired) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!t.name.toLowerCase().includes(s) && !t.desc.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [filter, search]);

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.10em] text-muted-foreground">
            Launchpad
          </div>
          <h1 className="mt-2 font-display text-[1.75rem] font-semibold tracking-tight">
            AI tools for founders
          </h1>
          <p className="mt-1 max-w-2xl text-[13.5px] text-muted-foreground">
            Each tool generates a polished, ready-to-use asset for your business. Drafts auto-save as you type.
          </p>
        </div>
        <Link
          to="/app/launchpad/history"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-[12px] font-medium text-foreground/85 hover:border-foreground/20 transition"
        >
          <History className="h-3.5 w-3.5" /> View history
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools…"
            className="pl-9 bg-surface-2"
          />
        </div>
        <div className="flex gap-1 rounded-md border border-border bg-surface-2 p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded px-3 py-1 text-[12px] font-medium transition",
                filter === f.key ? "bg-surface text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => {
          const Icon = ICONS[tool.key] ?? Rocket;
          const locked = !tool.wired;
          const runs = runsByTool.get(tool.toolKey) ?? 0;

          const card = (
            <div
              className={cn(
                "group relative h-full rounded-xl border border-border bg-surface p-5 shadow-card transition",
                "hover:border-primary/30 hover:shadow-hover",
                locked && "opacity-90 hover:border-border",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg transition",
                    locked
                      ? "bg-surface-2 text-muted-foreground"
                      : "bg-primary/10 text-primary group-hover:bg-primary/15",
                  )}
                >
                  {locked ? <Lock className="h-4 w-4" /> : <Icon className="h-5 w-5" />}
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                    locked
                      ? "border-border bg-surface-2 text-muted-foreground"
                      : "border-success/30 bg-success/10 text-success",
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", locked ? "bg-muted-foreground" : "bg-success")} />
                  {locked ? "Soon" : "Available"}
                </span>
              </div>

              <div className="mt-4">
                <div className="font-display text-[15px] font-semibold tracking-tight">
                  {tool.name}
                </div>
                <p className="mt-1 line-clamp-2 text-[12.5px] text-muted-foreground">{tool.desc}</p>
              </div>

              <div className="mt-5 flex items-center justify-between text-[11.5px]">
                <span className={cn(
                  "rounded-full border px-2 py-0.5 font-medium",
                  tool.difficulty === "Beginner" && "border-success/30 bg-success/10 text-success",
                  tool.difficulty === "Intermediate" && "border-primary/30 bg-primary/10 text-primary",
                  tool.difficulty === "Advanced" && "border-warning/30 bg-warning/10 text-warning",
                )}>
                  {tool.difficulty}
                </span>
                {!locked ? (
                  <span className="inline-flex items-center gap-1 font-medium text-primary">
                    {runs > 0 ? `${runs} run${runs === 1 ? "" : "s"}` : "Open"} <ArrowUpRight className="h-3 w-3" />
                  </span>
                ) : (
                  <span className="text-muted-foreground">Launching soon</span>
                )}
              </div>
            </div>
          );

          return (
            <Link
              key={tool.key}
              to="/app/launchpad/$tool"
              params={{ tool: tool.key }}
              className="block"
            >
              {card}
            </Link>
          );
        })}
      </div>

      {tools.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-[13px] text-muted-foreground">
          No tools match your filter.
        </div>
      )}
    </div>
  );
}
