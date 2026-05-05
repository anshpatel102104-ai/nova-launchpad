import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { launchpadCatalog } from "@/lib/mock";
import { useAuth } from "@/lib/auth";
import { toolRunsQuery } from "@/lib/queries";
import {
  Lock,
  Rocket,
  Zap,
  Target,
  Megaphone,
  Settings2,
  Mail,
  Globe,
  Swords,
  Tags,
  LineChart,
  ArrowUpRight,
  Search,
  Lightbulb,
  Skull,
  Trophy,
  UserPlus,
  FileText,
  GitCompare,
  History,
} from "lucide-react";
import { WorkspaceHeader } from "@/components/app/WorkspaceHeader";
import { useOwnerMode } from "@/lib/ownerMode";

export const Route = createFileRoute("/app/launchpad/")({ component: LaunchpadOverview });

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "idea-validator": Lightbulb,
  "pitch-generator": Megaphone,
  "gtm-strategy": Target,
  offer: Zap,
  "ops-plan": Settings2,
  followup: Mail,
  "website-audit": Globe,
  "kill-my-idea": Skull,
  "funding-score": Trophy,
  "first-10-customers": UserPlus,
  "business-plan": FileText,
  "investor-emails": Mail,
  "idea-vs-idea": GitCompare,
  "landing-page": Globe,
  competitor: Swords,
  pricing: Tags,
  "revenue-projector": LineChart,
};

const ICON_COLORS: Record<string, string> = {
  "idea-validator": "linear-gradient(135deg, #5b8ef5, #9b74f7)",
  "pitch-generator": "linear-gradient(135deg, #9b74f7, #c084fc)",
  "gtm-strategy": "linear-gradient(135deg, #5b8ef5, #38bdf8)",
  "kill-my-idea": "linear-gradient(135deg, #ef4444, #f97316)",
  "funding-score": "linear-gradient(135deg, #f59e0b, #eab308)",
  "first-10-customers": "linear-gradient(135deg, #10b981, #5b8ef5)",
  "business-plan": "linear-gradient(135deg, #5b8ef5, #9b74f7)",
  "investor-emails": "linear-gradient(135deg, #9b74f7, #5b8ef5)",
  "idea-vs-idea": "linear-gradient(135deg, #f97316, #9b74f7)",
  "landing-page": "linear-gradient(135deg, #10b981, #38bdf8)",
};

const FILTERS = [
  { key: "all", label: "All tools" },
  { key: "active", label: "Available" },
  { key: "soon", label: "Coming soon" },
];

function LaunchpadOverview() {
  const { currentOrgId } = useAuth();
  const isOwner = useOwnerMode();
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
      // In owner mode all tools count as wired/active
      const wired = isOwner ? true : t.wired;
      if (filter === "active" && !wired) return false;
      if (filter === "soon" && wired) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!t.name.toLowerCase().includes(s) && !t.desc.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [filter, search]);

  return (
    <div className="space-y-7">
      <WorkspaceHeader
        variant="launchpad"
        icon={Rocket}
        eyebrow="Launchpad · creation lab"
        title="AI tools for founders"
        description="Each tool generates a polished, ready-to-use asset for your business. Drafts auto-save as you type."
        actions={
          <Link
            to="/app/launchpad/history"
            className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[12px] font-medium transition"
            style={{
              background: "color-mix(in oklab, var(--surface) 80%, transparent)",
              border: "1px solid color-mix(in oklab, var(--border) 80%, transparent)",
              backdropFilter: "blur(10px)",
              color: "var(--foreground)",
              opacity: 0.85,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "color-mix(in oklab, var(--primary) 40%, transparent)";
              (e.currentTarget as HTMLElement).style.opacity = "1";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "color-mix(in oklab, var(--border) 80%, transparent)";
              (e.currentTarget as HTMLElement).style.opacity = "0.85";
            }}
          >
            <History className="h-3.5 w-3.5" /> View history
          </Link>
        }
      />

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--muted-foreground)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools…"
            className="w-full rounded-xl py-2 pl-9 pr-4 text-[13px] outline-none transition"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "color-mix(in oklab, var(--primary) 40%, transparent)";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 0 0 3px color-mix(in oklab, var(--primary) 8%, transparent)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          />
        </div>
        <div
          className="flex rounded-xl p-1"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
        >
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="rounded-lg px-3 py-1 text-[12px] font-medium transition"
              style={
                filter === f.key
                  ? {
                      background: "var(--surface)",
                      color: "var(--foreground)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                    }
                  : {
                      color: "var(--muted-foreground)",
                    }
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tools grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool, idx) => {
          const Icon = ICONS[tool.key] ?? Rocket;
          const locked = isOwner ? false : !tool.wired;
          const effectiveToolKey = tool.toolKey || (isOwner ? tool.key : "");
          const runs = runsByTool.get(effectiveToolKey) ?? 0;
          const iconGrad =
            ICON_COLORS[tool.key] ?? "linear-gradient(135deg, var(--primary), var(--accent))";

          return (
            <Link
              key={tool.key}
              to="/app/launchpad/$tool"
              params={{ tool: tool.key }}
              className="group block"
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <div
                className="relative h-full overflow-hidden rounded-2xl transition-all duration-300"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-card)",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  if (!locked) {
                    el.style.borderColor = "color-mix(in oklab, var(--primary) 35%, transparent)";
                    el.style.boxShadow =
                      "var(--shadow-hover), 0 0 0 1px color-mix(in oklab, var(--primary) 15%, transparent)";
                    el.style.transform = "translateY(-2px) scale(1.005)";
                  } else {
                    el.style.borderColor = "color-mix(in oklab, var(--border) 150%, transparent)";
                  }
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "var(--border)";
                  el.style.boxShadow = "var(--shadow-card)";
                  el.style.transform = "none";
                }}
              >
                {/* Corner glow on hover */}
                {!locked && (
                  <div
                    className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(circle, ${iconGrad.includes("ef4444") ? "rgba(239,68,68,0.15)" : "color-mix(in oklab, var(--primary) 15%, transparent)"}, transparent 70%)`,
                    }}
                  />
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-card transition-transform duration-300 group-hover:scale-110"
                      style={{
                        background: locked ? "var(--surface-2)" : iconGrad,
                        boxShadow: locked
                          ? "none"
                          : "0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
                      }}
                    >
                      {locked ? (
                        <Lock className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={
                        locked
                          ? {
                              background: "var(--surface-2)",
                              border: "1px solid var(--border)",
                              color: "var(--muted-foreground)",
                            }
                          : {
                              background: "color-mix(in oklab, var(--success) 12%, transparent)",
                              border:
                                "1px solid color-mix(in oklab, var(--success) 30%, transparent)",
                              color: "var(--success)",
                            }
                      }
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          background: locked ? "var(--muted-foreground)" : "var(--success)",
                        }}
                      />
                      {locked ? "Soon" : "Ready"}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div
                      className="font-display text-[15px] font-semibold tracking-tight"
                      style={{ color: "var(--foreground)" }}
                    >
                      {tool.name}
                    </div>
                    <p
                      className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {tool.desc}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={
                        tool.difficulty === "Beginner"
                          ? {
                              background: "color-mix(in oklab, var(--success) 12%, transparent)",
                              color: "var(--success)",
                              border:
                                "1px solid color-mix(in oklab, var(--success) 25%, transparent)",
                            }
                          : tool.difficulty === "Intermediate"
                            ? {
                                background: "color-mix(in oklab, var(--primary) 12%, transparent)",
                                color: "var(--primary)",
                                border:
                                  "1px solid color-mix(in oklab, var(--primary) 25%, transparent)",
                              }
                            : {
                                background: "color-mix(in oklab, var(--warning) 12%, transparent)",
                                color: "var(--warning)",
                                border:
                                  "1px solid color-mix(in oklab, var(--warning) 25%, transparent)",
                              }
                      }
                    >
                      {tool.difficulty}
                    </span>
                    {!locked ? (
                      <span
                        className="inline-flex items-center gap-1 text-[11.5px] font-medium transition-transform duration-200 group-hover:translate-x-0.5"
                        style={{ color: "var(--primary)" }}
                      >
                        {runs > 0 ? `${runs} run${runs === 1 ? "" : "s"}` : "Open"}
                        <ArrowUpRight className="h-3 w-3" />
                      </span>
                    ) : (
                      <span className="text-[11.5px]" style={{ color: "var(--muted-foreground)" }}>
                        Launching soon
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {tools.length === 0 && (
        <div
          className="rounded-2xl border border-dashed p-12 text-center"
          style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
        >
          <div className="text-[13px]">No tools match your filter.</div>
        </div>
      )}
    </div>
  );
}
