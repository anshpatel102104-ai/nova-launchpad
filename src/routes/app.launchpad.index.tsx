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
  Search,
  Lightbulb,
  Skull,
  Trophy,
  UserPlus,
  FileText,
  GitCompare,
  History,
  ChevronRight,
  Sparkles,
  Clock,
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

const ICON_COLORS: Record<string, { from: string; to: string; glow: string }> = {
  "idea-validator": { from: "#5b8ef5", to: "#9b74f7", glow: "rgba(91,142,245,0.35)" },
  "pitch-generator": { from: "#9b74f7", to: "#c084fc", glow: "rgba(155,116,247,0.35)" },
  "gtm-strategy": { from: "#F97316", to: "#FBBF24", glow: "rgba(249,115,22,0.35)" },
  "kill-my-idea": { from: "#ef4444", to: "#f97316", glow: "rgba(239,68,68,0.35)" },
  "funding-score": { from: "#f59e0b", to: "#eab308", glow: "rgba(245,158,11,0.35)" },
  "first-10-customers": { from: "#10b981", to: "#5b8ef5", glow: "rgba(16,185,129,0.35)" },
  "business-plan": { from: "#5b8ef5", to: "#9b74f7", glow: "rgba(91,142,245,0.35)" },
  "investor-emails": { from: "#9b74f7", to: "#5b8ef5", glow: "rgba(155,116,247,0.35)" },
  "idea-vs-idea": { from: "#F97316", to: "#9b74f7", glow: "rgba(249,115,22,0.35)" },
  "landing-page": { from: "#10b981", to: "#38bdf8", glow: "rgba(16,185,129,0.35)" },
};

const FILTERS = [
  { key: "all", label: "All Tools" },
  { key: "active", label: "Available" },
  { key: "soon", label: "Coming Soon" },
];

/* Tool categories for grouping */
const CATEGORIES = [
  {
    key: "validate",
    label: "Validate & Research",
    description: "Test your idea before you build",
    color: "#5b8ef5",
    tools: ["idea-validator", "kill-my-idea", "idea-vs-idea", "funding-score", "competitor"],
  },
  {
    key: "plan",
    label: "Plan & Strategy",
    description: "Map the path to product-market fit",
    color: "#F97316",
    tools: ["gtm-strategy", "business-plan", "pricing", "revenue-projector", "ops-plan"],
  },
  {
    key: "launch",
    label: "Launch & Acquire",
    description: "Get your first customers",
    color: "#10b981",
    tools: ["pitch-generator", "first-10-customers", "offer", "landing-page", "investor-emails"],
  },
  {
    key: "grow",
    label: "Grow & Scale",
    description: "Accelerate what's working",
    color: "#FBBF24",
    tools: ["blog", "followup", "website-audit"],
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
  const [viewMode, setViewMode] = useState<"grid" | "category">("category");

  const tools = useMemo(() => {
    return launchpadCatalog.filter((t) => {
      const wired = isOwner ? true : t.wired;
      if (filter === "active" && !wired) return false;
      if (filter === "soon" && wired) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!t.name.toLowerCase().includes(s) && !t.desc.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [filter, search, isOwner]);

  const totalCompleted = useMemo(() => {
    return launchpadCatalog.filter((t) => {
      const key = t.toolKey || t.key;
      return (runsByTool.get(key) ?? 0) > 0;
    }).length;
  }, [runsByTool]);

  const availableCount = launchpadCatalog.filter((t) => (isOwner ? true : t.wired)).length;

  return (
    <div className="space-y-7">
      <WorkspaceHeader
        variant="launchpad"
        icon={Rocket}
        eyebrow="Launchpad · Execution Lab"
        title="AI tools for founders"
        description="Each tool generates a polished, ready-to-use asset for your business. Guided step-by-step — no experience needed."
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

      {/* Progress stats bar */}
      <div
        className="grid grid-cols-3 gap-3 rounded-2xl p-4 overflow-hidden relative"
        style={{ background: "var(--surface)", border: "1px solid rgba(249,115,22,0.1)" }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.4), transparent)",
          }}
        />
        {[
          {
            label: "Total Tools",
            value: launchpadCatalog.length,
            sub: "in the execution lab",
            color: "#F97316",
          },
          { label: "Available Now", value: availableCount, sub: "ready to run", color: "#10b981" },
          {
            label: "Completed",
            value: totalCompleted,
            sub: `of ${launchpadCatalog.length} total`,
            color: "#FBBF24",
          },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="text-center">
            <div
              className="font-mono font-black tabular-nums"
              style={{ fontSize: "1.8rem", color, letterSpacing: "-0.04em", lineHeight: 1 }}
            >
              {value}
            </div>
            <div className="mt-1 text-[11px] font-semibold" style={{ color: "var(--foreground)" }}>
              {label}
            </div>
            <div className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
              {sub}
            </div>
          </div>
        ))}
      </div>

      {/* Filter + Search bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--muted-foreground)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search execution tools…"
            className="w-full rounded-xl py-2 pl-9 pr-4 text-[13px] outline-none transition"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(249,115,22,0.4)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px rgba(249,115,22,0.08)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          />
        </div>

        <div className="flex items-center gap-2">
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
                    : { color: "var(--muted-foreground)" }
                }
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div
            className="flex rounded-xl p-1"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            {[
              { key: "category", label: "Categories" },
              { key: "grid", label: "Grid" },
            ].map((v) => (
              <button
                key={v.key}
                onClick={() => setViewMode(v.key as "grid" | "category")}
                className="rounded-lg px-3 py-1 text-[12px] font-medium transition"
                style={
                  viewMode === v.key
                    ? {
                        background: "var(--surface)",
                        color: "var(--primary)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                      }
                    : { color: "var(--muted-foreground)" }
                }
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category view */}
      {viewMode === "category" && !search && filter === "all" ? (
        <div className="space-y-8">
          {CATEGORIES.map((cat) => {
            const catTools = tools.filter((t) => cat.tools.includes(t.key));
            if (catTools.length === 0) return null;
            return (
              <div key={cat.key}>
                {/* Category header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-6" style={{ background: cat.color, opacity: 0.5 }} />
                  <div>
                    <h3
                      className="font-display text-[15px] font-bold tracking-tight"
                      style={{ color: "var(--foreground)" }}
                    >
                      {cat.label}
                    </h3>
                    <p className="text-[11.5px]" style={{ color: "var(--muted-foreground)" }}>
                      {cat.description}
                    </p>
                  </div>
                  <div className="h-px flex-1" style={{ background: cat.color, opacity: 0.12 }} />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {catTools.map((tool, idx) => (
                    <ToolCard
                      key={tool.key}
                      tool={tool}
                      idx={idx}
                      isOwner={isOwner}
                      runCount={runsByTool.get(tool.toolKey || (isOwner ? tool.key : "")) ?? 0}
                      categoryColor={cat.color}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Grid view */
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool, idx) => (
            <ToolCard
              key={tool.key}
              tool={tool}
              idx={idx}
              isOwner={isOwner}
              runCount={runsByTool.get(tool.toolKey || (isOwner ? tool.key : "")) ?? 0}
            />
          ))}
        </div>
      )}

      {tools.length === 0 && (
        <div
          className="rounded-2xl border border-dashed p-12 text-center"
          style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
        >
          <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-30" />
          <div className="text-[13px] font-semibold">No tools match your filter.</div>
          <div className="text-[12px] mt-1 opacity-70">Try adjusting your search or filter.</div>
        </div>
      )}
    </div>
  );
}

/* ── Tool Card Component ── */
function ToolCard({
  tool,
  idx,
  isOwner,
  runCount,
  categoryColor,
}: {
  tool: import("@/lib/mock").LaunchpadTool;
  idx: number;
  isOwner: boolean;
  runCount: number;
  categoryColor?: string;
}) {
  const Icon = ICONS[tool.key] ?? Rocket;
  const locked = isOwner ? false : !tool.wired;
  const colors = ICON_COLORS[tool.key];
  const gradFrom = colors?.from ?? categoryColor ?? "var(--primary)";
  const gradTo = colors?.to ?? gradFrom;
  const iconGrad = `linear-gradient(135deg, ${gradFrom}, ${gradTo})`;
  const glowColor = colors?.glow ?? `${gradFrom}35`;
  const hasRuns = runCount > 0;

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
          border: `1px solid ${locked ? "var(--border)" : "rgba(249,115,22,0.08)"}`,
          boxShadow: "var(--shadow-card)",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          if (!locked) {
            el.style.borderColor = `${gradFrom}40`;
            el.style.boxShadow = `var(--shadow-hover), 0 0 0 1px ${gradFrom}18, 0 0 24px ${glowColor}`;
            el.style.transform = "translateY(-2px) scale(1.004)";
          }
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = locked ? "var(--border)" : "rgba(249,115,22,0.08)";
          el.style.boxShadow = "var(--shadow-card)";
          el.style.transform = "none";
        }}
      >
        {/* Top accent line */}
        {!locked && (
          <div
            className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `linear-gradient(90deg, transparent, ${gradFrom}60, transparent)`,
            }}
          />
        )}

        {/* Completed badge glow */}
        {hasRuns && !locked && (
          <div
            className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-30"
            style={{ background: `radial-gradient(circle, ${gradFrom}40, transparent 70%)` }}
          />
        )}

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            {/* Icon */}
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-card transition-all duration-300 group-hover:scale-105"
              style={{
                background: locked ? "var(--surface-2)" : iconGrad,
                boxShadow: locked
                  ? "none"
                  : `0 4px 12px rgba(0,0,0,0.3), 0 0 16px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.15)`,
              }}
            >
              {locked ? (
                <Lock className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
              ) : (
                <Icon className="h-5 w-5" />
              )}
            </div>

            {/* Status badge */}
            <div className="flex flex-col items-end gap-1.5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={
                  locked
                    ? {
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        color: "var(--muted-foreground)",
                      }
                    : hasRuns
                      ? {
                          background: "color-mix(in oklab, var(--success) 12%, transparent)",
                          border: "1px solid color-mix(in oklab, var(--success) 30%, transparent)",
                          color: "var(--success)",
                        }
                      : {
                          background: `${gradFrom}12`,
                          border: `1px solid ${gradFrom}25`,
                          color: gradFrom,
                        }
                }
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background: locked
                      ? "var(--muted-foreground)"
                      : hasRuns
                        ? "var(--success)"
                        : gradFrom,
                  }}
                />
                {locked
                  ? "Soon"
                  : hasRuns
                    ? `${runCount} run${runCount !== 1 ? "s" : ""}`
                    : "Ready"}
              </span>
            </div>
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

          {/* What you get preview */}
          {!locked && (
            <div
              className="mt-3 rounded-lg px-3 py-2 text-[11px] leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{
                background: `${gradFrom}08`,
                border: `1px solid ${gradFrom}15`,
                color: "var(--muted-foreground)",
              }}
            >
              <span style={{ color: gradFrom, fontWeight: 600 }}>Output: </span>
              {`A complete ${tool.name.toLowerCase()} — ready to use immediately`}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={
                tool.difficulty === "Beginner"
                  ? {
                      background: "color-mix(in oklab, var(--success) 12%, transparent)",
                      color: "var(--success)",
                      border: "1px solid color-mix(in oklab, var(--success) 25%, transparent)",
                    }
                  : tool.difficulty === "Intermediate"
                    ? {
                        background: `${gradFrom}12`,
                        color: gradFrom,
                        border: `1px solid ${gradFrom}25`,
                      }
                    : {
                        background: "color-mix(in oklab, var(--warning) 12%, transparent)",
                        color: "var(--warning)",
                        border: "1px solid color-mix(in oklab, var(--warning) 25%, transparent)",
                      }
              }
            >
              {tool.difficulty}
            </span>
            {!locked ? (
              <span
                className="inline-flex items-center gap-1 text-[11.5px] font-semibold transition-all duration-200 group-hover:translate-x-0.5"
                style={{ color: gradFrom }}
              >
                {hasRuns ? "Run again" : "Launch"}
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            ) : (
              <span
                className="flex items-center gap-1 text-[11.5px]"
                style={{ color: "var(--muted-foreground)" }}
              >
                <Clock className="h-3 w-3" /> Launching soon
              </span>
            )}
          </div>
        </div>

        {/* Corner aerospace brackets */}
        {!locked && (
          <>
            <div
              className="absolute top-0 left-0 w-3 h-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                borderTop: `1px solid ${gradFrom}50`,
                borderLeft: `1px solid ${gradFrom}50`,
              }}
            />
            <div
              className="absolute bottom-0 right-0 w-3 h-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                borderBottom: `1px solid ${gradFrom}30`,
                borderRight: `1px solid ${gradFrom}30`,
              }}
            />
          </>
        )}
      </div>
    </Link>
  );
}
