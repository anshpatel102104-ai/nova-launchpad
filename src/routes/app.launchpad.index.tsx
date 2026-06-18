import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { LAUNCHPAD_TOOLS } from "@/lib/catalog";
import { launchpadCatalog } from "@/lib/mock";
import { useAuth } from "@/lib/auth";
import {
  toolRunsQuery,
  organizationQuery,
  subscriptionQuery,
  planEntitlementsQuery,
  workspaceStatusQuery,
  businessContextQuery,
} from "@/lib/queries";
import {
  selectPlaybook,
  computePlaybookProgress,
  ALL_PLAYBOOKS,
  type Playbook,
} from "@/lib/playbooks";
import { NovaResearchPanel } from "@/components/app/playbook/NovaResearchPanel";
import {
  Lock,
  Search,
  History,
  ChevronRight,
  ChevronDown,
  Check,
  CheckCircle2,
  Circle,
  MessageSquare,
  ArrowRight,
  Clock,
  Sparkles,
  PartyPopper,
} from "lucide-react";
import { useOwnerMode } from "@/lib/ownerMode";
import { NovaAvatar } from "@/components/nova/NovaAvatar";

export const Route = createFileRoute("/app/launchpad/")({ component: LaunchpadOverview });

/** Safe nested read from a jsonb-ish object. */
function pick(obj: unknown, key: string): string {
  if (obj && typeof obj === "object") {
    const v = (obj as Record<string, unknown>)[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function LaunchpadOverview() {
  const { currentOrgId, user } = useAuth();
  const isOwner = useOwnerMode();

  const runsQ = useQuery({ ...toolRunsQuery(currentOrgId ?? "", 200), enabled: !!currentOrgId });
  const orgQ = useQuery({ ...organizationQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const subQ = useQuery({ ...subscriptionQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const plansQ = useQuery(planEntitlementsQuery());
  const wsQ = useQuery({ ...workspaceStatusQuery(user?.id ?? ""), enabled: !!user?.id });
  const bcQ = useQuery({ ...businessContextQuery(currentOrgId ?? ""), enabled: !!currentOrgId });

  // ── Completed tool keys (raw tool_runs.tool_key values) ───────────────────
  const completedKeys = useMemo(() => {
    const set = new Set<string>();
    for (const r of runsQ.data ?? []) {
      if ((r as { status?: string }).status !== "failed") set.add(r.tool_key);
    }
    return set;
  }, [runsQ.data]);

  // ── Business context for grounded research + north-star goal ──────────────
  const bc = bcQ.data as Record<string, unknown> | null | undefined;
  const orgName = (orgQ.data?.name as string) ?? "";
  const idea = pick(bc?.identity, "description") || pick(bc?.identity, "name") || orgName;
  const goal = pick(bc?.goals, "goal_90d") || pick(bc?.goals, "scale_goal");
  const niche = pick(bc?.identity, "niche") || pick(bc?.identity, "industry");
  const targetCustomer = pick(bc?.customer, "target") || pick(bc?.customer, "description");

  const lane = (wsQ.data?.lane as string | undefined) ?? undefined;
  const stage = (wsQ.data?.stage as string | undefined) ?? (orgQ.data?.stage as string) ?? "Idea";

  // ── Active playbook (lane-driven, switchable) ─────────────────────────────
  const recommended = useMemo(() => selectPlaybook({ lane, stage }), [lane, stage]);
  const [activePlaybookId, setActivePlaybookId] = useState<string | null>(null);
  const activePlaybook: Playbook =
    ALL_PLAYBOOKS.find((p) => p.id === activePlaybookId) ?? recommended;

  const progress = useMemo(
    () => computePlaybookProgress(activePlaybook, completedKeys),
    [activePlaybook, completedKeys],
  );

  // The step whose guidance is shown — defaults to the current step.
  const [focusedStepId, setFocusedStepId] = useState<string | null>(null);
  const focusedStep =
    progress.steps.find((s) => s.id === focusedStepId) ??
    progress.steps.find((s) => s.current) ??
    progress.steps[progress.steps.length - 1];

  // ── Tool grid gating (the secondary "browse all" surface) ─────────────────
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

  const [showAllTools, setShowAllTools] = useState(false);
  const [search, setSearch] = useState("");
  const filteredTools = useMemo(() => {
    if (!search) return LAUNCHPAD_TOOLS;
    const s = search.toLowerCase();
    return LAUNCHPAD_TOOLS.filter(
      (t) => t.name.toLowerCase().includes(s) || t.description.toLowerCase().includes(s),
    );
  }, [search]);

  const novaMood: "active" | "thinking" | "alert" =
    progress.completedCount >= 3 ? "active" : progress.completedCount >= 1 ? "thinking" : "alert";

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <NovaAvatar size="md" mood={novaMood} />
          <div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "28px",
                fontWeight: 800,
                color: "var(--foreground)",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              Your mission with Nova
            </h1>
            <p
              className="mt-1"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                color: "var(--muted-foreground)",
              }}
            >
              I run the playbook. You make the calls. One step at a time — no toolbox to figure out.
            </p>
          </div>
        </div>
        <Link
          to="/app/launchpad/history"
          className="hidden sm:inline-flex items-center gap-2 rounded-lg transition-colors shrink-0"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            fontWeight: 500,
            padding: "8px 14px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--muted-foreground)",
          }}
        >
          <History style={{ width: 14, height: 14 }} />
          History
        </Link>
      </div>

      {/* ── North Star: keep the founder's goal in front of every step ── */}
      {goal && (
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-2.5"
          style={{
            background: "color-mix(in oklab, var(--primary) 7%, transparent)",
            border: "1px solid color-mix(in oklab, var(--primary) 22%, var(--border))",
          }}
        >
          <Sparkles style={{ width: 15, height: 15, color: "var(--primary)", flexShrink: 0 }} />
          <p
            style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--foreground)" }}
          >
            <span style={{ color: "var(--muted-foreground)" }}>Your goal: </span>
            <span style={{ fontWeight: 600 }}>{goal}</span>
            <span style={{ color: "var(--muted-foreground)" }}>
              {" "}
              — every step below moves you toward it.
            </span>
          </p>
        </div>
      )}

      {/* ── Mission selector ── */}
      <div className="flex flex-wrap gap-2">
        {ALL_PLAYBOOKS.map((pb) => {
          const active = pb.id === activePlaybook.id;
          const isRec = pb.id === recommended.id;
          return (
            <button
              key={pb.id}
              onClick={() => {
                setActivePlaybookId(pb.id);
                setFocusedStepId(null);
              }}
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-left transition-colors"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12.5px",
                fontWeight: active ? 600 : 500,
                background: active
                  ? "color-mix(in oklab, var(--primary) 12%, transparent)"
                  : "var(--surface)",
                border: `1px solid ${active ? "color-mix(in oklab, var(--primary) 45%, transparent)" : "var(--border)"}`,
                color: active ? "var(--primary)" : "var(--muted-foreground)",
                cursor: "pointer",
              }}
            >
              <span>{pb.emoji}</span>
              <span>{pb.title}</span>
              {isRec && !active && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                  style={{
                    background: "color-mix(in oklab, var(--primary) 14%, transparent)",
                    color: "var(--primary)",
                  }}
                >
                  For you
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Mission card ── */}
      <div
        className="rounded-2xl border p-5"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <span style={{ fontSize: 26 }}>{activePlaybook.emoji}</span>
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "var(--foreground)",
                  letterSpacing: "-0.01em",
                }}
              >
                {activePlaybook.title}
              </h2>
              <p
                className="mt-0.5"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  color: "var(--muted-foreground)",
                }}
              >
                {activePlaybook.objective}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--primary)",
                fontWeight: 600,
              }}
            >
              {progress.completedCount}/{progress.totalCount} done
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "var(--text-faint)",
              }}
            >
              {progress.percent}%
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="h-1.5 rounded-full overflow-hidden mb-5"
          style={{ background: "var(--border)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress.percent}%`, background: "var(--primary)" }}
          />
        </div>

        {/* ── Focused step guidance OR completion ── */}
        {progress.isComplete ? (
          <div
            className="rounded-xl p-5 text-center"
            style={{
              background: "color-mix(in oklab, var(--success) 8%, transparent)",
              border: "1px solid color-mix(in oklab, var(--success) 30%, transparent)",
            }}
          >
            <PartyPopper
              style={{ width: 28, height: 28, color: "var(--success)", margin: "0 auto" }}
            />
            <h3
              className="mt-2"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "17px",
                fontWeight: 700,
                color: "var(--foreground)",
              }}
            >
              Mission complete — {activePlaybook.title}
            </h3>
            <p
              className="mt-1 mb-4"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                color: "var(--muted-foreground)",
              }}
            >
              {activePlaybook.outcome} Pick your next mission above, or keep refining what you
              built.
            </p>
            <Link
              to="/app/mentor"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold"
              style={{ background: "var(--primary)", color: "#fff" }}
            >
              Ask Nova what's next <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
        ) : focusedStep ? (
          <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            {/* Step guidance */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    background: focusedStep.done
                      ? "color-mix(in oklab, var(--success) 12%, transparent)"
                      : "color-mix(in oklab, var(--primary) 12%, transparent)",
                    color: focusedStep.done ? "var(--success)" : "var(--primary)",
                  }}
                >
                  {focusedStep.done
                    ? "Done"
                    : `Step ${progress.steps.indexOf(focusedStep) + 1} of ${progress.totalCount}`}
                </span>
                <span
                  className="inline-flex items-center gap-1"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    color: "var(--text-faint)",
                  }}
                >
                  <Clock style={{ width: 10, height: 10 }} />~{focusedStep.estimatedMinutes} min
                </span>
              </div>

              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "var(--foreground)",
                  lineHeight: 1.25,
                  letterSpacing: "-0.01em",
                }}
              >
                {focusedStep.novaQuestion}
              </h3>
              <p
                className="mt-1.5"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "13.5px",
                  color: "var(--muted-foreground)",
                  lineHeight: 1.5,
                }}
              >
                {focusedStep.why}
              </p>

              {/* Done-when */}
              <div className="mt-3 space-y-1.5">
                <div
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  You're done when
                </div>
                {focusedStep.doneWhen.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-[12.5px]"
                    style={{ color: "var(--foreground)" }}
                  >
                    <Check
                      style={{
                        width: 13,
                        height: 13,
                        marginTop: 2,
                        flexShrink: 0,
                        color: "var(--primary)",
                      }}
                    />
                    {d}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                {focusedStep.route ? (
                  <Link
                    to="/app/launchpad/$tool"
                    params={{ tool: focusedStep.route }}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-colors"
                    style={{ background: "var(--primary)", color: "#fff" }}
                  >
                    {focusedStep.done ? "Run again" : focusedStep.ctaLabel}
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </Link>
                ) : null}
                <Link
                  to="/app/mentor"
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-colors"
                  style={{
                    background: "transparent",
                    border: "1px solid var(--primary-border)",
                    color: "var(--primary)",
                  }}
                >
                  <MessageSquare style={{ width: 14, height: 14 }} />
                  Ask Nova
                </Link>
              </div>
            </div>

            {/* Research panel — keyed by playbook so cache stays per mission */}
            <NovaResearchPanel
              key={activePlaybook.id}
              stepId={focusedStep.id}
              focus={focusedStep.researchFocus}
              idea={idea}
              goal={goal}
              niche={niche}
              targetCustomer={targetCustomer}
              stage={stage}
              orgId={currentOrgId ?? undefined}
            />
          </div>
        ) : null}

        {/* ── Steps rail ── */}
        <div className="mt-5 pt-4 border-t" style={{ borderColor: "var(--divider)" }}>
          <div className="space-y-1">
            {progress.steps.map((s, i) => {
              const isFocused = focusedStep?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setFocusedStepId(s.id)}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors"
                  style={{
                    background: isFocused ? "var(--surface-2)" : "transparent",
                    border: `1px solid ${isFocused ? "var(--primary-border)" : "transparent"}`,
                    cursor: "pointer",
                  }}
                >
                  {s.done ? (
                    <CheckCircle2
                      style={{ width: 17, height: 17, color: "var(--success)", flexShrink: 0 }}
                    />
                  ) : s.current ? (
                    <div
                      style={{
                        width: 17,
                        height: 17,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {i + 1}
                    </div>
                  ) : (
                    <Circle
                      style={{ width: 17, height: 17, color: "var(--text-faint)", flexShrink: 0 }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "13px",
                        fontWeight: s.current || isFocused ? 600 : 500,
                        color: s.done ? "var(--muted-foreground)" : "var(--foreground)",
                      }}
                    >
                      {s.title}
                    </div>
                  </div>
                  {s.current && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0"
                      style={{
                        background: "color-mix(in oklab, var(--primary) 14%, transparent)",
                        color: "var(--primary)",
                      }}
                    >
                      You're here
                    </span>
                  )}
                  <ChevronRight
                    style={{ width: 14, height: 14, color: "var(--text-faint)", flexShrink: 0 }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Browse all tools (secondary) ── */}
      <div
        className="rounded-2xl border"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <button
          onClick={() => setShowAllTools((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4"
          style={{ cursor: "pointer", background: "transparent", border: "none" }}
        >
          <div className="text-left">
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--foreground)",
              }}
            >
              Browse all tools
            </div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12.5px",
                color: "var(--muted-foreground)",
              }}
            >
              Prefer to drive yourself? Every Launchpad tool, on tap.
            </div>
          </div>
          <ChevronDown
            style={{
              width: 18,
              height: 18,
              color: "var(--muted-foreground)",
              transform: showAllTools ? "rotate(180deg)" : "none",
              transition: "transform 200ms",
            }}
          />
        </button>

        {showAllTools && (
          <div className="px-5 pb-5">
            <div className="relative mb-4">
              <Search
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 14,
                  height: 14,
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
                  borderRadius: 8,
                  padding: "9px 14px 9px 38px",
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                  outline: "none",
                }}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTools.map((tool) => (
                <ToolCard
                  key={tool.slug}
                  slug={tool.slug}
                  name={tool.name}
                  description={tool.description}
                  available={isToolAvailable(tool.slug)}
                  runCount={runsByTool.get(tool.slug) ?? 0}
                  estimatedMinutes={tool.estimatedMinutes}
                  icon={tool.icon}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Tool Card (used by the secondary "browse all tools" grid) ── */
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
    <Link
      to={available ? "/app/launchpad/$tool" : ("/app/launchpad/" as never)}
      params={available ? { tool: slug } : { tool: "" }}
      className="group block"
      style={{ pointerEvents: available ? "auto" : "none" }}
    >
      <div
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: 16,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          opacity: available ? 1 : 0.45,
          cursor: available ? "pointer" : "not-allowed",
        }}
      >
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
          {!available ? (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "3px 8px",
                borderRadius: 999,
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
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "3px 8px",
                borderRadius: 999,
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
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 15,
            fontWeight: 600,
            color: "var(--foreground)",
            letterSpacing: "-0.01em",
            marginBottom: 4,
          }}
        >
          {name}
        </p>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 12,
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
        <div className="mt-3 flex items-center justify-between">
          <span
            style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-faint)" }}
          >
            ~{estimatedMinutes} min
          </span>
          {available ? (
            <span
              className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 12,
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
                fontSize: 11,
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
