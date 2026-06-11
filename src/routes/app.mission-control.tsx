// Home — Nova holds your hand and walks you across the street.
// One screen that answers, in plain words, top to bottom:
//   1. Where am I?            → journey bar ("YOU ARE HERE")
//   2. What do I do now?      → one big guided step (NextStepHero)
//   3. What comes after?      → locked next steps + one thing to fix
//   4. How am I doing?        → charts and a leads table where every row
//                               tells you the next move
// Sharp corners, no decoration. Cards drag-and-drop to rearrange.

import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SectionTabs } from "@/components/app/SectionTabs";
import { useAuth } from "@/lib/auth";
import { useBusinessGraph, type LeadRow } from "@/hooks/use-business-graph";
import { NextStepHero } from "@/components/app/dashboard/NextStepHero";
import { ArrowRight, AlertTriangle, Clock, GripVertical, Lock } from "lucide-react";

export const Route = createFileRoute("/app/mission-control")({
  component: HomePage,
});

const STAGES = ["Idea", "Validate", "Launch", "Operate", "Scale"] as const;
// Plain words for each stage of the journey.
const STAGE_LABELS: Record<(typeof STAGES)[number], string> = {
  Idea: "Idea",
  Validate: "Prove it",
  Launch: "Launch",
  Operate: "Run",
  Scale: "Grow",
};

const LAYOUT_KEY = "nova-home-layout";
const DEFAULT_ORDER = ["money", "leads", "table"];

function HomePage() {
  const { user, profile } = useAuth();
  const graph = useBusinessGraph();

  const name = profile?.full_name?.split(" ")[0] || "Founder";
  const stageIdx = Math.max(0, STAGES.indexOf(graph.stage));
  const blocker = graph.blockers[0];
  const upNext = graph.recommendations.filter((r) => r.id !== "continue-mission").slice(0, 2);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <SectionTabs section="path" />

      {/* ── 1 · Header: where am I? ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-[22px] font-bold leading-tight"
            style={{ color: "var(--foreground)", letterSpacing: "-0.025em" }}
          >
            {greeting()}, {name}
          </h1>
          <p className="mt-0.5 text-[13px]" style={{ color: "var(--muted-foreground)" }}>
            {graph.businessName} &nbsp;·&nbsp;{" "}
            {blocker
              ? "You have one thing to do, and one thing to fix."
              : "You have one thing to do today. Nova will guide you."}
          </p>
        </div>
        <span
          className="mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-[3px] border px-2.5 py-1 text-[11.5px] font-bold"
          style={
            blocker
              ? {
                  color: "var(--warning)",
                  background: "color-mix(in oklab, var(--warning) 10%, var(--surface))",
                  borderColor: "color-mix(in oklab, var(--warning) 30%, transparent)",
                }
              : {
                  color: "var(--success)",
                  background: "color-mix(in oklab, var(--success) 9%, var(--surface))",
                  borderColor: "color-mix(in oklab, var(--success) 30%, transparent)",
                }
          }
        >
          {blocker ? "1 thing to fix" : "On track"}
        </span>
      </div>

      {/* ── Journey bar ── */}
      <div
        className="rounded-[6px] border px-6 pb-5 pt-4"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div className="mb-4 flex items-baseline justify-between">
          <span className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
            Your journey
          </span>
          <span className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
            Step {stageIdx + 1} of {STAGES.length}
          </span>
        </div>
        <div className="flex items-start">
          {STAGES.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex w-[72px] shrink-0 flex-col items-center md:w-[86px]">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-[4px] text-[12.5px] font-bold"
                  style={
                    i < stageIdx
                      ? { background: "var(--success)", color: "var(--success-foreground)" }
                      : i === stageIdx
                        ? {
                            background: "var(--primary)",
                            color: "var(--primary-foreground)",
                            boxShadow: "0 0 0 4px var(--primary-soft)",
                          }
                        : {
                            background: "var(--surface)",
                            color: "var(--text-faint)",
                            border: "2px solid var(--border)",
                          }
                  }
                >
                  {i < stageIdx ? "✓" : i + 1}
                </div>
                <span
                  className="mt-2 text-[11.5px] font-semibold"
                  style={{
                    color:
                      i === stageIdx
                        ? "var(--primary)"
                        : i < stageIdx
                          ? "var(--foreground)"
                          : "var(--muted-foreground)",
                  }}
                >
                  {STAGE_LABELS[s]}
                </span>
                {i === stageIdx && (
                  <span
                    className="mt-0.5 text-[10px] font-bold tracking-[0.04em]"
                    style={{ color: "var(--primary)" }}
                  >
                    YOU ARE HERE
                  </span>
                )}
              </div>
              {i < STAGES.length - 1 && (
                <div
                  className="mt-[13px] h-[3px] flex-1"
                  style={{ background: i < stageIdx ? "var(--success)" : "var(--border)" }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── 2 · Do this now ── */}
      <div>
        <SectionLabel>Do this now</SectionLabel>
        {user?.id && <NextStepHero userId={user.id} />}
      </div>

      {/* ── 3 · After this step ── */}
      <div>
        <SectionLabel>After this step</SectionLabel>
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-[1.4fr_1fr]">
          <div
            className="rounded-[6px] border px-5 py-4"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <div
              className="mb-2 text-[12.5px] font-bold"
              style={{ color: "var(--muted-foreground)" }}
            >
              Nova unlocks these next — don't worry about them yet
            </div>
            {upNext.length === 0 ? (
              <div className="py-2 text-[12.5px]" style={{ color: "var(--text-faint)" }}>
                Finish the step above and Nova will line up what's next.
              </div>
            ) : (
              upNext.map((r, i) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 py-2.5 opacity-80"
                  style={{ borderTop: i > 0 ? "1px solid var(--border-subtle)" : "none" }}
                >
                  <span
                    className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[4px] border"
                    style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                  >
                    <Lock className="h-3 w-3" style={{ color: "var(--text-faint)" }} />
                  </span>
                  <div className="min-w-0">
                    <div
                      className="text-[13px] font-semibold"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {r.title}
                    </div>
                    <div className="text-[12px]" style={{ color: "var(--text-faint)" }}>
                      {r.impact}
                    </div>
                  </div>
                  <span
                    className="ml-auto inline-flex shrink-0 items-center gap-1 text-[11.5px] font-semibold"
                    style={{ color: "var(--text-faint)" }}
                  >
                    <Clock className="h-3 w-3" />
                    {r.estimatedMinutes}m
                  </span>
                </div>
              ))
            )}
          </div>

          {blocker ? (
            <div
              className="rounded-[6px] border px-5 py-4"
              style={{
                background: "color-mix(in oklab, var(--warning) 9%, var(--surface))",
                borderColor: "color-mix(in oklab, var(--warning) 30%, transparent)",
                borderLeft: "3px solid var(--warning)",
              }}
            >
              <div
                className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-bold"
                style={{ color: "var(--warning)" }}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                One thing to fix
              </div>
              <div className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
                {blocker.title}
              </div>
              <div
                className="mt-0.5 text-[12.5px] leading-relaxed"
                style={{ color: "var(--muted-foreground)" }}
              >
                {blocker.why}
              </div>
              <Link
                to={blocker.resolveTo}
                className="mt-2.5 inline-flex items-center gap-1.5 text-[12.5px] font-bold"
                style={{ color: "var(--warning)" }}
              >
                {blocker.resolveLabel} · takes {blocker.estimatedMinutes} min
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <div
              className="flex items-center justify-center rounded-[6px] border px-5 py-4 text-center text-[12.5px]"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface)",
                color: "var(--text-faint)",
              }}
            >
              Nothing is in your way right now. Keep going.
            </div>
          )}
        </div>
      </div>

      {/* ── 4 · Your numbers (drag to rearrange) ── */}
      <DashboardCards leads={graph.leads} />
    </div>
  );
}

/* ─── Draggable dashboard cards ─────────────────────────────── */

function loadOrder(): string[] {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    if (!raw) return DEFAULT_ORDER;
    const o = JSON.parse(raw) as string[];
    return DEFAULT_ORDER.every((k) => o.includes(k)) ? o : DEFAULT_ORDER;
  } catch {
    return DEFAULT_ORDER;
  }
}

function DashboardCards({ leads }: { leads: LeadRow[] }) {
  const [order, setOrder] = React.useState<string[]>(loadOrder);
  const dragId = React.useRef<string | null>(null);

  const onDrop = (targetId: string) => {
    const sourceId = dragId.current;
    dragId.current = null;
    if (!sourceId || sourceId === targetId) return;
    setOrder((prev) => {
      const next = prev.filter((k) => k !== sourceId);
      next.splice(
        next.indexOf(targetId) + (prev.indexOf(sourceId) < prev.indexOf(targetId) ? 1 : 0),
        0,
        sourceId,
      );
      localStorage.setItem(LAYOUT_KEY, JSON.stringify(next));
      return next;
    });
  };

  const weekly = bucketLeadsByWeek(leads, 8);
  const totalValue = leads.reduce((sum, l) => sum + (l.value ?? 0), 0);

  const cards: Record<string, React.ReactNode> = {
    money: (
      <ChartCard title="Money you could win" key="money">
        <div className="flex items-baseline gap-2">
          <span
            className="text-[24px] font-extrabold"
            style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
          >
            {formatMoney(totalValue)}
          </span>
          {weekly.valueDelta > 0 && (
            <span className="text-[11.5px] font-bold" style={{ color: "var(--success)" }}>
              ▲ {formatMoney(weekly.valueDelta)} this week
            </span>
          )}
        </div>
        <div className="mb-2.5 mt-0.5 text-[11.5px]" style={{ color: "var(--text-faint)" }}>
          {totalValue > 0
            ? "All your open leads, added up · last 8 weeks"
            : "This grows when you add leads."}
        </div>
        <LineChart points={weekly.cumulativeValue} />
      </ChartCard>
    ),
    leads: (
      <ChartCard title="Leads — goal: 10" key="leads">
        <div className="flex items-baseline gap-2">
          <span
            className="text-[24px] font-extrabold"
            style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
          >
            {leads.length}
          </span>
          <span className="text-[12.5px] font-semibold" style={{ color: "var(--text-faint)" }}>
            / 10
          </span>
          {weekly.countDelta > 0 && (
            <span className="text-[11.5px] font-bold" style={{ color: "var(--success)" }}>
              ▲ {weekly.countDelta} this week
            </span>
          )}
        </div>
        <div className="mb-2.5 mt-0.5 text-[11.5px]" style={{ color: "var(--text-faint)" }}>
          {leads.length > 0 ? "New leads each week" : "Nova will help you find them."}
        </div>
        <BarChart values={weekly.countPerWeek} />
      </ChartCard>
    ),
    table: <LeadsTable leads={leads.slice(0, 5)} key="table" />,
  };

  return (
    <div>
      <SectionLabel>
        Your numbers
        <span
          className="ml-1 inline-flex items-center gap-1 normal-case tracking-normal"
          style={{ color: "var(--text-faint)", fontWeight: 550 }}
        >
          <GripVertical className="h-3 w-3" />
          drag any card to move it — Nova saves your layout
        </span>
      </SectionLabel>
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        {order.map((id) => (
          <div
            key={id}
            draggable
            onDragStart={() => (dragId.current = id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(id)}
            className={id === "table" ? "md:col-span-2" : ""}
          >
            {cards[id]}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="h-full rounded-[6px] border"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div
        className="flex items-center justify-between px-4.5 py-3"
        style={{ borderBottom: "1px solid var(--border-subtle)", padding: "12px 18px" }}
      >
        <span className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
          {title}
        </span>
        <GripVertical className="h-3.5 w-3.5 cursor-grab" style={{ color: "var(--text-faint)" }} />
      </div>
      <div style={{ padding: "14px 18px 16px" }}>{children}</div>
    </div>
  );
}

/* ─── Charts (plain SVG, sharp) ─────────────────────────────── */

function LineChart({ points }: { points: number[] }) {
  const W = 340;
  const H = 110;
  const max = Math.max(...points, 1);
  const x = (i: number) => (i / Math.max(points.length - 1, 1)) * (W - 12);
  const y = (v: number) => 100 - (v / max) * 75;
  const path = points.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)} ${y(v)}`).join(" ");
  const area = `${path} L${x(points.length - 1)} 100 L0 100 Z`;
  const last = points[points.length - 1] ?? 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full">
      {[20, 60, 100].map((gy) => (
        <line
          key={gy}
          x1="0"
          y1={gy}
          x2={W}
          y2={gy}
          stroke="var(--border-subtle)"
          strokeWidth="1"
        />
      ))}
      <path d={area} fill="var(--primary)" opacity="0.10" />
      <path d={path} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" />
      <rect
        x={x(points.length - 1) - 3.5}
        y={y(last) - 3.5}
        width="7"
        height="7"
        fill="var(--primary)"
      />
    </svg>
  );
}

function BarChart({ values }: { values: number[] }) {
  const W = 340;
  const H = 110;
  const max = Math.max(...values, 1);
  const bw = Math.min(26, (W - 8) / values.length - 14);
  // Older weeks fade; the current week is full strength.
  const opacity = (i: number) => 0.3 + (0.7 * i) / Math.max(values.length - 1, 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full">
      {[20, 60, 100].map((gy) => (
        <line
          key={gy}
          x1="0"
          y1={gy}
          x2={W}
          y2={gy}
          stroke="var(--border-subtle)"
          strokeWidth="1"
        />
      ))}
      {values.map((v, i) => {
        const h = (v / max) * 75;
        return (
          <rect
            key={i}
            x={8 + i * ((W - 16) / values.length)}
            y={100 - h}
            width={bw}
            height={Math.max(h, v > 0 ? 4 : 1.5)}
            fill="var(--primary)"
            opacity={v > 0 ? opacity(i) : 0.12}
          />
        );
      })}
    </svg>
  );
}

/* ─── Leads table — every row tells you the next move ───────── */

function LeadsTable({ leads }: { leads: LeadRow[] }) {
  return (
    <div
      className="overflow-hidden rounded-[6px] border"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div
        className="flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border-subtle)", padding: "12px 18px" }}
      >
        <span className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
          Your leads — each row tells you the next move
        </span>
        <Link
          to="/app/contacts"
          className="text-[12px] font-semibold"
          style={{ color: "var(--primary)" }}
        >
          See all →
        </Link>
      </div>

      {leads.length === 0 ? (
        <div
          className="px-5 py-6 text-center text-[13px]"
          style={{ color: "var(--muted-foreground)" }}
        >
          No leads yet — that's okay. When you add people, each row here will tell you exactly what
          to do next.
        </div>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: "var(--surface-2)" }}>
              {["Name", "Came from", "Status", "What to do next"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2 text-left text-[10.5px] font-bold uppercase tracking-[0.07em]"
                  style={{ color: "var(--text-faint)", borderBottom: "1px solid var(--border)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => {
              const next = nextMove(l);
              return (
                <tr key={l.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td
                    className="px-4 py-2.5 text-[13px] font-bold"
                    style={{ color: "var(--foreground)" }}
                  >
                    {l.name || "No name"}
                  </td>
                  <td
                    className="px-4 py-2.5 text-[12.5px]"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {l.source || "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className="inline-flex rounded-[3px] border px-2 py-0.5 text-[11px] font-bold"
                      style={statusStyle(next.tone)}
                    >
                      {next.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <Link
                      to="/app/contacts"
                      className="inline-flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1 text-[12px] font-bold"
                      style={{
                        color: "var(--primary)",
                        background: "var(--primary-soft)",
                        borderColor: "var(--primary-border)",
                      }}
                    >
                      {next.action}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

type Tone = "violet" | "amber" | "green" | "muted";

function statusStyle(tone: Tone): React.CSSProperties {
  const m: Record<Tone, [string, string]> = {
    violet: ["var(--primary)", "var(--primary-soft)"],
    amber: ["var(--warning)", "color-mix(in oklab, var(--warning) 10%, var(--surface))"],
    green: ["var(--success)", "color-mix(in oklab, var(--success) 9%, var(--surface))"],
    muted: ["var(--muted-foreground)", "var(--surface-2)"],
  };
  const [color, background] = m[tone];
  return { color, background, borderColor: `color-mix(in oklab, ${color} 30%, transparent)` };
}

/** Plain next move for a lead, from its stage and age. */
function nextMove(l: LeadRow): { status: string; action: string; tone: Tone } {
  const stage = (l.stage || "new").toLowerCase();
  const days = l.created_at
    ? Math.floor((Date.now() - new Date(l.created_at).getTime()) / 86_400_000)
    : 0;

  if (stage.includes("won") || stage.includes("closed"))
    return { status: "Won", action: "Say thanks + ask for a referral", tone: "green" };
  if (stage.includes("lost"))
    return { status: "Lost", action: "Move on — add a new lead", tone: "muted" };
  if (stage.includes("qualified") || stage.includes("interested"))
    return { status: "Interested", action: "Book the call", tone: "green" };
  if (stage.includes("proposal") || stage.includes("negotiat"))
    return { status: "Deciding", action: "Check in — answer questions", tone: "amber" };
  if (stage.includes("contact"))
    return days >= 3
      ? { status: `Waiting ${days} days`, action: "Send the follow-up", tone: "amber" }
      : { status: "Contacted", action: "Wait, then follow up", tone: "muted" };
  return { status: "New", action: "Send the intro email", tone: "violet" };
}

/* ─── Helpers ───────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-2.5 flex items-center gap-2 px-0.5 text-[12px] font-bold uppercase tracking-[0.07em]"
      style={{ color: "var(--text-faint)" }}
    >
      {children}
    </div>
  );
}

function bucketLeadsByWeek(leads: LeadRow[], weeks: number) {
  const countPerWeek = new Array<number>(weeks).fill(0);
  const valuePerWeek = new Array<number>(weeks).fill(0);
  const now = Date.now();
  for (const l of leads) {
    if (!l.created_at) continue;
    const age = Math.floor((now - new Date(l.created_at).getTime()) / (7 * 86_400_000));
    const idx = weeks - 1 - age;
    if (idx >= 0 && idx < weeks) {
      countPerWeek[idx] += 1;
      valuePerWeek[idx] += l.value ?? 0;
    }
  }
  const cumulativeValue: number[] = [];
  let running = 0;
  for (const v of valuePerWeek) {
    running += v;
    cumulativeValue.push(running);
  }
  return {
    countPerWeek,
    cumulativeValue,
    countDelta: countPerWeek[weeks - 1],
    valueDelta: valuePerWeek[weeks - 1],
  };
}

function formatMoney(v: number): string {
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${Math.round(v)}`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
