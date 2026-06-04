import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { LAUNCHPAD_TOOLS } from "@/lib/catalog";
import { useAuth } from "@/lib/auth";
import { toolRunsQuery } from "@/lib/queries";
import { Lock, Zap, Search, History, ChevronRight, Clock, Check } from "lucide-react";
import { useOwnerMode } from "@/lib/ownerMode";

export const Route = createFileRoute("/app/launchpad/")({ component: LaunchpadOverview });

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Available" },
  { key: "soon", label: "Coming soon" },
];

const CATEGORIES = [
  {
    key: "validate",
    label: "Validate & Research",
    desc: "Test your idea before you build",
  },
  {
    key: "plan",
    label: "Plan & Strategy",
    desc: "Map the path to product-market fit",
  },
  {
    key: "customers",
    label: "Launch & Acquire",
    desc: "Get your first customers",
  },
  {
    key: "launch",
    label: "Launch & Scale",
    desc: "Accelerate what's working",
  },
  {
    key: "funding",
    label: "Funding",
    desc: "Raise from investors",
  },
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
  const [viewMode, setViewMode] = useState<"category" | "grid">("category");

  const allTools = LAUNCHPAD_TOOLS;

  const filtered = useMemo(() => {
    return allTools.filter((t) => {
      const available = isOwner || t.plan === "0";
      if (filter === "active" && !available) return false;
      if (filter === "soon" && available) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!t.name.toLowerCase().includes(s) && !t.description.toLowerCase().includes(s))
          return false;
      }
      return true;
    });
  }, [filter, search, isOwner, allTools]);

  const totalCompleted = useMemo(
    () => allTools.filter((t) => (runsByTool.get(t.slug) ?? 0) > 0).length,
    [runsByTool, allTools],
  );
  const availableCount = allTools.filter((t) => isOwner || t.plan === "0").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>
            Launchpad
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
            18 AI-powered tools to take your idea from concept to traction.
          </p>
        </div>
        <Link
          to="/app/launchpad/history"
          className="hidden sm:inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] transition-colors"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--muted-foreground)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
          }}
        >
          <History className="h-3.5 w-3.5" />
          History
        </Link>
      </div>

      {/* Stats strip */}
      <div
        className="grid grid-cols-3 divide-x rounded-xl overflow-hidden"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        {[
          { label: "Total tools", value: allTools.length },
          { label: "Available now", value: availableCount },
          { label: "Completed", value: totalCompleted },
        ].map(({ label, value }, i) => (
          <div
            key={label}
            className="px-5 py-4"
            style={{ borderRight: i < 2 ? "1px solid var(--border)" : "none" }}
          >
            <div
              className="text-2xl font-bold font-mono tabular-nums"
              style={{ color: i === 0 ? "var(--primary)" : "var(--foreground)" }}
            >
              {value}
            </div>
            <div className="text-[11.5px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--muted-foreground)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools..."
            className="w-full rounded-lg py-2 pl-9 pr-4 text-[13px] outline-none transition-colors"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "color-mix(in oklab, var(--primary) 50%, transparent)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            }}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div
            className="flex rounded-lg p-0.5"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors"
                style={
                  filter === f.key
                    ? { background: "var(--surface)", color: "var(--foreground)" }
                    : { color: "var(--muted-foreground)" }
                }
              >
                {f.label}
              </button>
            ))}
          </div>

          <div
            className="flex rounded-lg p-0.5"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            {(["category", "grid"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className="rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors capitalize"
                style={
                  viewMode === v
                    ? {
                        background: "var(--surface)",
                        color: "var(--primary)",
                      }
                    : { color: "var(--muted-foreground)" }
                }
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tools */}
      {viewMode === "category" && !search && filter === "all" ? (
        <div className="space-y-8">
          {CATEGORIES.map((cat) => {
            const catTools = filtered.filter((t) => t.category === cat.key);
            if (catTools.length === 0) return null;
            return (
              <div key={cat.key}>
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-widest font-mono"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {cat.label}
                  </span>
                  <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                  <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                    {catTools.length}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {catTools.map((tool) => (
                    <ToolCard
                      key={tool.slug}
                      slug={tool.slug}
                      name={tool.name}
                      description={tool.description}
                      available={isOwner || tool.plan === "0"}
                      runCount={runsByTool.get(tool.slug) ?? 0}
                      estimatedMinutes={tool.estimatedMinutes}
                      icon={tool.icon}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tool) => (
            <ToolCard
              key={tool.slug}
              slug={tool.slug}
              name={tool.name}
              description={tool.description}
              available={isOwner || tool.plan === "0"}
              runCount={runsByTool.get(tool.slug) ?? 0}
              estimatedMinutes={tool.estimatedMinutes}
              icon={tool.icon}
            />
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div
          className="rounded-xl border-dashed border p-12 text-center"
          style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
        >
          <div className="text-[13px] font-medium">No tools match your filter.</div>
          <div className="text-[12px] mt-1 opacity-70">Try adjusting your search.</div>
        </div>
      )}
    </div>
  );
}

/* ── Tool Card ── */
function ToolCard({
  slug,
  name,
  description,
  available,
  runCount,
  estimatedMinutes,
  icon: Icon,
}: {
  slug: string;
  name: string;
  description: string;
  available: boolean;
  runCount: number;
  estimatedMinutes: number;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}) {
  const hasRuns = runCount > 0;

  return (
    <Link to="/app/launchpad/$tool" params={{ tool: slug }} className="group block">
      <div
        className="relative h-full rounded-xl p-4 transition-colors"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
        onMouseEnter={(e) => {
          if (available) {
            (e.currentTarget as HTMLElement).style.borderColor =
              "color-mix(in oklab, var(--primary) 35%, transparent)";
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          {/* Icon */}
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{
              background: available ? "var(--primary-soft)" : "var(--surface-2)",
            }}
          >
            {available ? (
              <Icon className="h-4 w-4" style={{ color: "var(--primary)" }} />
            ) : (
              <Lock className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
            )}
          </div>

          {/* Status */}
          {available ? (
            hasRuns ? (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0"
                style={{
                  background: "var(--surface-2)",
                  color: "var(--muted-foreground)",
                  border: "1px solid var(--border)",
                }}
              >
                <Check className="h-2.5 w-2.5" style={{ color: "var(--primary)" }} />
                {runCount} run{runCount !== 1 ? "s" : ""}
              </span>
            ) : null
          ) : (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] shrink-0"
              style={{
                background: "var(--surface-2)",
                color: "var(--muted-foreground)",
                border: "1px solid var(--border)",
              }}
            >
              <Clock className="h-2.5 w-2.5" />
              Soon
            </span>
          )}
        </div>

        <div className="text-[14px] font-semibold mb-1" style={{ color: "var(--foreground)" }}>
          {name}
        </div>
        <p
          className="text-[12px] leading-relaxed line-clamp-2"
          style={{ color: "var(--muted-foreground)" }}
        >
          {description}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
            ~{estimatedMinutes}m
          </span>
          {available ? (
            <span
              className="inline-flex items-center gap-1 text-[12px] font-medium transition-all group-hover:translate-x-0.5"
              style={{ color: "var(--primary)" }}
            >
              {hasRuns ? "Run again" : "Launch"}
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 text-[11px]"
              style={{ color: "var(--muted-foreground)" }}
            >
              Upgrade to unlock
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
