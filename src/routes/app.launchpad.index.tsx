import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { LAUNCHPAD_TOOLS } from "@/lib/catalog";
import { launchpadCatalog } from "@/lib/mock";
import { useAuth } from "@/lib/auth";
import {
  toolRunsQuery,
  organizationQuery,
  leadsQuery,
  subscriptionQuery,
  planEntitlementsQuery,
  workspaceStatusQuery,
} from "@/lib/queries";
import { recommendTools } from "@/lib/recommendTools";
import {
  Lock,
  Search,
  History,
  ChevronRight,
  Check,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { useOwnerMode } from "@/lib/ownerMode";
import { NovaAvatar } from "@/components/nova/NovaAvatar";

export const Route = createFileRoute("/app/launchpad/")({ component: LaunchpadOverview });

const STAGE_TABS = [
  { key: "all", label: "All" },
  { key: "validate", label: "Validate" },
  { key: "plan", label: "Position & plan" },
  { key: "customers", label: "Get customers" },
  { key: "launch", label: "Launch assets" },
  { key: "funding", label: "Fundraise" },
] as const;

const CATEGORY_META: Record<string, { label: string; desc: string }> = {
  validate: { label: "Validate the idea", desc: "Know it's worth building before you build it" },
  plan: { label: "Position & plan", desc: "Offer, pricing, and the plan to sell it" },
  customers: { label: "Get customers", desc: "Playbooks and outreach that land paying customers" },
  launch: { label: "Launch assets", desc: "Pages, emails, and content that convert" },
  funding: { label: "Fundraise", desc: "Score your readiness and reach investors" },
};

const NOVA_PROMPTS_BY_STAGE: Record<string, string[]> = {
  all: [
    "Which tool should I run first?",
    "What's my fastest path to first revenue?",
    "How do I know when I'm ready to scale?",
  ],
  validate: [
    "How do I validate without a product?",
    "What's a good validation score?",
    "How do I find people to interview?",
  ],
  plan: [
    "What's the right GTM for B2B SaaS?",
    "How detailed should my business plan be?",
    "How do I identify my ICP?",
  ],
  customers: [
    "How do I get my first 10 paying customers?",
    "What should my landing page hero say?",
    "How long is a good email sequence?",
  ],
  launch: [
    "What acquisition channels should I test first?",
    "How do I build a scalable campaign?",
    "When should I invest in paid ads?",
  ],
  funding: [
    "What do investors look for at seed stage?",
    "How do I cold email an investor?",
    "What's a strong funding readiness score?",
  ],
};

function LaunchpadOverview() {
  const { currentOrgId, user } = useAuth();
  const isOwner = useOwnerMode();
  const runsQ = useQuery({ ...toolRunsQuery(currentOrgId ?? "", 100), enabled: !!currentOrgId });
  const orgQ = useQuery({ ...organizationQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const leadsQ = useQuery({ ...leadsQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const subQ = useQuery({ ...subscriptionQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const plansQ = useQuery(planEntitlementsQuery());

  // Real per-plan entitlements — mirrors the `isToolLocked` check in app.launchpad.$tool.tsx
  // so a card's lock state always matches whether clicking it actually unlocks the tool.
  const planTier = subQ.data?.plan ?? "starter";
  const currentEnt = plansQ.data?.find((p) => p.plan === planTier);
  const toolKeyBySlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of launchpadCatalog) map.set(t.key, t.toolKey);
    return map;
  }, []);
  const isToolAvailable = (slug: string) => {
    if (isOwner) return true;
    if (!currentEnt) return true;
    return currentEnt.allowed_tools.includes(toolKeyBySlug.get(slug) ?? slug);
  };

  const runsByTool = useMemo(() => {
    const map = new Map<string, number>();
    (runsQ.data ?? []).forEach((r) => map.set(r.tool_key, (map.get(r.tool_key) ?? 0) + 1));
    return map;
  }, [runsQ.data]);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [novaSidebarOpen, setNovaSidebarOpen] = useState(true);

  const allTools = LAUNCHPAD_TOOLS;

  const filtered = useMemo(() => {
    return allTools.filter((t) => {
      if (activeTab !== "all" && t.category !== activeTab) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!t.name.toLowerCase().includes(s) && !t.description.toLowerCase().includes(s))
          return false;
      }
      return true;
    });
  }, [activeTab, search, allTools]);

  const totalCompleted = useMemo(
    () => allTools.filter((t) => (runsByTool.get(t.slug) ?? 0) > 0).length,
    [runsByTool, allTools],
  );

  const stage = (orgQ.data?.stage as string) ?? "Idea";
  const runCount = runsQ.data?.length ?? 0;
  const leadCount = leadsQ.data?.length ?? 0;

  const novaAnalysis =
    runCount === 0
      ? `You're at ${stage} stage with no tools run yet. I recommend starting with Idea Validation — it scores your concept across 8 critical dimensions and sets the direction for everything that follows.`
      : `You've completed ${totalCompleted} of ${allTools.length} tools at ${stage} stage. ${leadCount > 0 ? `Your ${leadCount} contacts give me signal to refine your GTM recommendations.` : "Adding contacts to your pipeline will help me personalise your execution path."}`;

  const novaMood: "active" | "thinking" | "alert" =
    runCount >= 5 ? "active" : runCount >= 1 ? "thinking" : "alert";

  const novaPrompts = NOVA_PROMPTS_BY_STAGE[activeTab] ?? NOVA_PROMPTS_BY_STAGE.all;

  // Group by category (only when not filtering)
  const showCategorised = activeTab === "all" && !search;
  const categories = Object.keys(CATEGORY_META).filter((cat) =>
    filtered.some((t) => t.category === cat),
  );

  // ── Context-driven recommendations (the default surface, not the catalog) ──
  const wsQ = useQuery({ ...workspaceStatusQuery(user?.id ?? ""), enabled: !!user?.id });
  const completedSlugs = useMemo(() => {
    const done = new Set<string>();
    for (const t of allTools) {
      const backendKey = toolKeyBySlug.get(t.slug) ?? t.slug;
      if ((runsByTool.get(backendKey) ?? 0) > 0 || (runsByTool.get(t.slug) ?? 0) > 0)
        done.add(t.slug);
    }
    return done;
  }, [allTools, runsByTool, toolKeyBySlug]);
  const recommendations = useMemo(
    () =>
      recommendTools({
        lane: wsQ.data?.lane,
        stage: wsQ.data?.stage ?? stage,
        mode: wsQ.data?.mode,
        completedSlugs,
      }),
    [wsQ.data, stage, completedSlugs],
  );

  return (
    <div className="flex gap-5 items-start">
      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "32px",
                fontWeight: 800,
                color: "var(--foreground)",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              Workbench
            </h1>
            <p
              className="mt-1"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "15px",
                color: "var(--muted-foreground)",
              }}
            >
              Outcome engines, playbooks, and asset generators — sequenced for your business, not
              browsed.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/app/launchpad/history"
              className="hidden sm:inline-flex items-center gap-2 rounded-lg transition-colors"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                fontWeight: 500,
                padding: "8px 14px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--muted-foreground)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--primary-border)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
              }}
            >
              <History style={{ width: 14, height: 14 }} />
              History
            </Link>
            <button
              onClick={() => setNovaSidebarOpen((o) => !o)}
              className="hidden lg:inline-flex items-center gap-2 rounded-lg transition-colors"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                fontWeight: 500,
                padding: "8px 14px",
                background: novaSidebarOpen ? "var(--primary-soft)" : "var(--surface)",
                border: `1px solid ${novaSidebarOpen ? "var(--primary-border)" : "var(--border)"}`,
                color: novaSidebarOpen ? "var(--primary)" : "var(--muted-foreground)",
                cursor: "pointer",
              }}
            >
              <MessageSquare style={{ width: 14, height: 14 }} />
              Nova
            </button>
          </div>
        </div>

        {/* Recommended next — context-ranked, with the WHY on every card */}
        {recommendations.length > 0 && !search && (
          <div
            className="rounded-2xl border p-4"
            style={{
              borderColor: "color-mix(in oklab, var(--primary) 25%, var(--border))",
              background: "color-mix(in oklab, var(--primary) 4%, transparent)",
            }}
          >
            <div
              className="mb-3 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: "var(--primary)" }}
            >
              Recommended next
              {wsQ.data?.lane && (
                <span
                  className="font-normal normal-case tracking-normal"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  · based on your {wsQ.data.lane} lane
                  {wsQ.data?.mode === "operate" ? " (operator mode)" : ""}
                </span>
              )}
            </div>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {recommendations.map((rec, i) => {
                const tool = allTools.find((t) => t.slug === rec.slug);
                if (!tool) return null;
                return (
                  <Link
                    key={rec.slug}
                    to="/app/launchpad/$tool"
                    params={{ tool: rec.slug }}
                    className="group rounded-xl border p-3.5 transition-all hover:-translate-y-0.5"
                    style={{
                      borderColor:
                        i === 0
                          ? "color-mix(in oklab, var(--primary) 40%, transparent)"
                          : "var(--border)",
                      background: "var(--surface)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[18px]">{tool.emoji}</span>
                      {i === 0 && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider"
                          style={{
                            background: "color-mix(in oklab, var(--primary) 14%, transparent)",
                            color: "var(--primary)",
                          }}
                        >
                          Start here
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-[13.5px] font-semibold leading-snug">{tool.name}</div>
                    <p
                      className="mt-1 text-[11.5px] leading-relaxed"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {rec.reason}
                    </p>
                    <div
                      className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-semibold opacity-0 transition-opacity group-hover:opacity-100"
                      style={{ color: "var(--primary)" }}
                    >
                      Run it <ArrowRight className="h-3 w-3" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Stage tabs */}
        <div className="flex items-center gap-0 border-b" style={{ borderColor: "var(--border)" }}>
          {STAGE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="relative px-4 pb-2.5 pt-0.5 transition-colors"
              style={{
                fontFamily: activeTab === tab.key ? "var(--font-display)" : "var(--font-body)",
                fontSize: "14px",
                fontWeight: activeTab === tab.key ? 600 : 400,
                color: activeTab === tab.key ? "var(--foreground)" : "var(--muted-foreground)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                borderBottom:
                  activeTab === tab.key ? "2px solid var(--primary)" : "2px solid transparent",
                marginBottom: "-1px",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "14px",
              height: "14px",
              color: "var(--muted-foreground)",
              pointerEvents: "none",
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools..."
            style={{
              width: "100%",
              borderRadius: "8px",
              padding: "9px 14px 9px 38px",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
              outline: "none",
              transition: "border-color 160ms",
            }}
            onFocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--primary)")}
            onBlur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border)")}
          />
        </div>

        {/* Tools */}
        {filtered.length === 0 ? (
          <div
            className="rounded-xl p-12 text-center"
            style={{ border: "1px dashed var(--border)", color: "var(--muted-foreground)" }}
          >
            <p style={{ fontFamily: "var(--font-body)", fontSize: "14px" }}>
              No tools match your search.
            </p>
          </div>
        ) : showCategorised ? (
          <div className="space-y-8">
            {categories.map((cat) => {
              const catTools = filtered.filter((t) => t.category === cat);
              const meta = CATEGORY_META[cat];
              if (!catTools.length || !meta) return null;
              return (
                <div key={cat}>
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        fontWeight: 600,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "var(--muted-foreground)",
                      }}
                    >
                      {meta.label}
                    </span>
                    <div className="flex-1 h-px" style={{ background: "var(--divider)" }} />
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        color: "var(--text-faint)",
                      }}
                    >
                      {catTools.length}
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {catTools.map((tool, i) => (
                      <ToolCard
                        key={tool.slug}
                        slug={tool.slug}
                        name={tool.name}
                        description={tool.description}
                        available={isToolAvailable(tool.slug)}
                        runCount={runsByTool.get(tool.slug) ?? 0}
                        estimatedMinutes={tool.estimatedMinutes}
                        icon={tool.icon}
                        isRecommended={runCount === 0 && i === 0 && cat === "validate"}
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
                available={isToolAvailable(tool.slug)}
                runCount={runsByTool.get(tool.slug) ?? 0}
                estimatedMinutes={tool.estimatedMinutes}
                icon={tool.icon}
                isRecommended={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Nova Sidebar ── */}
      {novaSidebarOpen && (
        <aside
          className="hidden lg:flex flex-col shrink-0 rounded-xl p-4 gap-4"
          style={{
            width: "280px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            position: "sticky",
            top: "24px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <NovaAvatar size="md" mood={novaMood} />
            <div>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "var(--foreground)",
                }}
              >
                Nova
              </p>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: "var(--primary)",
                  letterSpacing: "0.06em",
                }}
              >
                LAUNCHPAD GUIDE
              </p>
            </div>
          </div>

          <div
            className="rounded-lg p-3"
            style={{ background: "var(--surface-offset)", border: "1px solid var(--border)" }}
          >
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                color: "var(--foreground)",
                lineHeight: 1.5,
              }}
            >
              {novaAnalysis}
            </p>
          </div>

          <div className="space-y-1.5">
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: "var(--muted-foreground)",
                marginBottom: "6px",
              }}
            >
              Ask Nova
            </p>
            {novaPrompts.map((prompt) => (
              <Link
                key={prompt}
                to="/app/mentor"
                className="flex items-center gap-2 rounded-lg transition-colors"
                style={{
                  padding: "8px 12px",
                  border: "1px solid var(--border)",
                  background: "transparent",
                  fontFamily: "var(--font-body)",
                  fontSize: "12px",
                  color: "var(--muted-foreground)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--primary-border)";
                  (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
                  (e.currentTarget as HTMLElement).style.background = "var(--primary-soft)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <span className="flex-1">{prompt}</span>
              </Link>
            ))}
          </div>

          <Link
            to="/app/mentor"
            className="flex items-center justify-center gap-2 rounded-lg py-2.5 transition-colors"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              fontWeight: 500,
              border: "1px solid var(--primary-border)",
              color: "var(--primary)",
              background: "transparent",
              marginTop: "auto",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "var(--primary-soft)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "transparent")
            }
          >
            Open full chat
            <ArrowRight style={{ width: 13, height: 13 }} />
          </Link>
        </aside>
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
  isRecommended,
}: {
  slug: string;
  name: string;
  description: string;
  available: boolean;
  runCount: number;
  estimatedMinutes: number;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  isRecommended: boolean;
}) {
  const hasRuns = runCount > 0;

  const cardStyle: React.CSSProperties = {
    background: isRecommended ? "var(--primary-soft)" : "var(--surface)",
    border: `1px solid ${isRecommended ? "var(--primary-border)" : "var(--border)"}`,
    borderRadius: "10px",
    padding: "16px",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    transition: "border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease",
    opacity: !available ? 0.45 : 1,
    cursor: !available ? "not-allowed" : "pointer",
    position: "relative",
    boxShadow: "var(--shadow-sm)",
  };

  return (
    <Link
      to={available ? "/app/launchpad/$tool" : ("/app/launchpad/" as never)}
      params={available ? { tool: slug } : undefined}
      className="group block"
      style={{ pointerEvents: available ? "auto" : "none" }}
    >
      <div
        style={cardStyle}
        onMouseEnter={(e) => {
          if (available) {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--primary-border)";
            (e.currentTarget as HTMLElement).style.background = isRecommended
              ? "color-mix(in oklab, var(--primary) 8%, var(--surface-2))"
              : "var(--surface-2)";
            (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)";
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = isRecommended
            ? "var(--primary-border)"
            : "var(--border)";
          (e.currentTarget as HTMLElement).style.background = isRecommended
            ? "var(--primary-soft)"
            : "var(--surface)";
          (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)";
        }}
      >
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div
            className="flex items-center justify-center rounded-lg shrink-0"
            style={{
              width: 36,
              height: 36,
              background: available
                ? "color-mix(in oklab, var(--primary) 10%, transparent)"
                : "var(--surface-offset)",
            }}
          >
            {available ? (
              <Icon style={{ width: 16, height: 16, color: "var(--primary)" }} />
            ) : (
              <Lock style={{ width: 15, height: 15, color: "var(--muted-foreground)" }} />
            )}
          </div>

          {/* Status badge */}
          {!available ? (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                padding: "3px 8px",
                borderRadius: "999px",
                background: "var(--surface-offset)",
                color: "var(--muted-foreground)",
                border: "1px solid var(--border)",
              }}
            >
              Locked
            </span>
          ) : hasRuns ? (
            <span
              className="inline-flex items-center gap-1"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "3px 8px",
                borderRadius: "999px",
                background: "color-mix(in oklab, var(--success) 10%, transparent)",
                color: "var(--success)",
                border: "1px solid color-mix(in oklab, var(--success) 25%, transparent)",
              }}
            >
              <Check style={{ width: 9, height: 9 }} />
              Done
            </span>
          ) : null}
        </div>

        {/* Name + desc */}
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "15px",
            fontWeight: 600,
            color: "var(--foreground)",
            letterSpacing: "-0.01em",
            marginBottom: "4px",
          }}
        >
          {name}
        </p>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "12px",
            color: "var(--muted-foreground)",
            lineHeight: 1.4,
            flex: 1,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {description}
        </p>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between">
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "var(--text-faint)",
            }}
          >
            ~{estimatedMinutes} min
          </span>
          {available ? (
            <span
              className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--primary)",
              }}
            >
              {hasRuns ? "Run again" : "Launch"}
              <ChevronRight style={{ width: 13, height: 13 }} />
            </span>
          ) : (
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                color: "var(--muted-foreground)",
              }}
            >
              Upgrade to unlock
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
