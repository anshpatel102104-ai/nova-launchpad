import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import {
  aiDashboardQuery,
  onboardingResponseQuery,
  generateAiDashboard,
  deleteAiDashboard,
  type GenerateDashboardInput,
} from "@/lib/queries";
import {
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Target,
  Zap,
  Rocket,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  AlertTriangle,
  RefreshCw,
  Map,
  Lightbulb,
  LayoutDashboard,
  Mail,
  Megaphone,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { NeuralCanvas } from "@/components/app/NeuralCanvas";
import { toast } from "sonner";

export const Route = createFileRoute("/app/ai-dashboard")({
  component: AiDashboardPage,
});

// ── Types ──────────────────────────────────────────────────────────────────────

type GuideStep = {
  title: string;
  description: string;
  time_estimate: string;
  action: string;
};

type Guide = {
  title: string;
  icon: string;
  summary: string;
  priority: "critical" | "high" | "medium";
  steps: GuideStep[];
};

type KpiCard = {
  metric: string;
  current: string;
  target: string;
  timeframe: string;
  how: string;
};

type QuickWin = {
  title: string;
  impact: string;
  effort: "low" | "medium" | "high";
  description: string;
};

type RoadmapPhase = {
  phase: string;
  duration: string;
  goal: string;
  milestones: string[];
};

type ToolRec = {
  tool: string;
  reason: string;
  slug: string;
};

type DashboardPayload = {
  headline: string;
  summary: string;
  stage: string;
  north_star_metric: string;
  top_risks: string[];
  guides: Guide[];
  kpis: KpiCard[];
  quick_wins: QuickWin[];
  roadmap: RoadmapPhase[];
  tool_recommendations: ToolRec[];
};

// ── Icon registry ──────────────────────────────────────────────────────────────

const ICONS: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  target: Target,
  rocket: Rocket,
  users: Users,
  "bar-chart": BarChart3,
  zap: Zap,
  "trending-up": TrendingUp,
  "dollar-sign": DollarSign,
  lightbulb: Lightbulb,
  book: BookOpen,
  map: Map,
  mail: Mail,
  megaphone: Megaphone,
};

function guideIcon(key: string) {
  return ICONS[key] ?? BookOpen;
}

const PRIORITY_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high: "#f59e0b",
  medium: "#3b82f6",
};

const EFFORT_COLOR: Record<string, string> = {
  low: "var(--success)",
  medium: "#f59e0b",
  high: "#ef4444",
};

const STAGE_COLOR: Record<string, string> = {
  Idea: "#f59e0b",
  Validate: "#3b82f6",
  Launch: "#8b5cf6",
  Operate: "#10b981",
  Scale: "#ef4444",
};

// ── Small components ───────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  label,
  sub,
  color,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `${color}12`, border: `1px solid ${color}25` }}
      >
        <Icon className="h-3.5 w-3.5" style={{ color }} />
      </div>
      <div>
        <span className="font-display font-bold text-[15px]" style={{ color: "var(--foreground)" }}>
          {label}
        </span>
        {sub && (
          <span className="ml-2 text-[11.5px]" style={{ color: "var(--muted-foreground)" }}>
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

function GuideCard({ guide }: { guide: Guide }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<Set<number>>(new Set());
  const Icon = guideIcon(guide.icon);
  const color = PRIORITY_COLOR[guide.priority] ?? "#3b82f6";

  const toggle = (i: number) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--surface)",
        border: `1px solid ${color}1a`,
        boxShadow: `0 0 0 1px ${color}08, 0 2px 8px rgba(0,0,0,0.25)`,
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${color}12`, border: `1px solid ${color}25` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[13.5px]" style={{ color: "var(--foreground)" }}>
              {guide.title}
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
              style={{ background: `${color}12`, color }}
            >
              {guide.priority}
            </span>
          </div>
          <p className="text-[11.5px] mt-0.5 truncate" style={{ color: "var(--muted-foreground)" }}>
            {guide.summary}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10.5px]" style={{ color: "var(--muted-foreground)" }}>
            {done.size}/{guide.steps.length}
          </span>
          {open ? (
            <ChevronDown className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
          ) : (
            <ChevronRight className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
          )}
        </div>
      </button>

      {open && (
        <div style={{ borderTop: `1px solid ${color}10` }}>
          {guide.steps.map((step, i) => (
            <div
              key={i}
              className="flex gap-3 px-5 py-3.5 cursor-pointer"
              style={{
                borderBottom:
                  i < guide.steps.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                background: done.has(i) ? `${color}06` : "transparent",
              }}
              onClick={() => toggle(i)}
            >
              <div className="mt-0.5 shrink-0">
                {done.has(i) ? (
                  <CheckCircle2 className="h-4 w-4" style={{ color: "var(--success)" }} />
                ) : (
                  <Circle className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span
                    className={cn(
                      "text-[13px] font-medium",
                      done.has(i) && "line-through opacity-50",
                    )}
                    style={{ color: "var(--foreground)" }}
                  >
                    {step.title}
                  </span>
                  <span
                    className="flex items-center gap-1 text-[10.5px] shrink-0"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    <Clock className="h-3 w-3" />
                    {step.time_estimate}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                  {step.description}
                </p>
                <div className="mt-1.5 text-[11px] font-semibold" style={{ color }}>
                  → {step.action}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KpiCardView({ kpi }: { kpi: KpiCard }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "var(--surface)",
        border: "1px solid rgba(59,130,246,0.12)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }}
    >
      <div
        className="text-[9.5px] font-bold uppercase tracking-wider mb-2"
        style={{ color: "var(--muted-foreground)" }}
      >
        {kpi.metric}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className="font-black tabular-nums leading-none"
          style={{ fontSize: "1.55rem", color: "var(--foreground)", letterSpacing: "-0.04em" }}
        >
          {kpi.current}
        </span>
        <ArrowRight className="h-3 w-3 shrink-0" style={{ color: "var(--muted-foreground)" }} />
        <span className="font-bold text-[1.05rem] leading-none" style={{ color: "#3b82f6" }}>
          {kpi.target}
        </span>
      </div>
      <div className="mt-1 text-[10px]" style={{ color: "var(--muted-foreground)" }}>
        {kpi.timeframe}
      </div>
      <div
        className="mt-2.5 text-[11.5px] pt-2.5"
        style={{
          color: "var(--foreground)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {kpi.how}
      </div>
    </div>
  );
}

function QuickWinCard({ win }: { win: QuickWin }) {
  const [done, setDone] = useState(false);
  return (
    <div
      className="rounded-xl p-4 cursor-pointer"
      style={{
        background: done ? "rgba(16,185,129,0.05)" : "var(--surface)",
        border: done ? "1px solid rgba(16,185,129,0.18)" : "1px solid rgba(255,255,255,0.06)",
        opacity: done ? 0.65 : 1,
      }}
      onClick={() => setDone((v) => !v)}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {done ? (
            <CheckCircle2 className="h-4 w-4" style={{ color: "var(--success)" }} />
          ) : (
            <Circle className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn("text-[13px] font-semibold", done && "line-through opacity-60")}
              style={{ color: "var(--foreground)" }}
            >
              {win.title}
            </span>
            <span
              className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase"
              style={{
                background: `${EFFORT_COLOR[win.effort] ?? "#3b82f6"}15`,
                color: EFFORT_COLOR[win.effort] ?? "#3b82f6",
              }}
            >
              {win.effort} effort
            </span>
          </div>
          <p className="mt-0.5 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
            {win.description}
          </p>
          <div className="mt-1.5 text-[11.5px] font-medium" style={{ color: "var(--success)" }}>
            Impact: {win.impact}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Intake form ────────────────────────────────────────────────────────────────

type IntakeValues = {
  business: string;
  niche: string;
  stage: string;
  goal: string;
  current_revenue: string;
  target_customer: string;
  biggest_blocker: string;
};

function IntakeForm({
  defaults,
  onSubmit,
  loading,
}: {
  defaults: Partial<IntakeValues>;
  onSubmit: (v: IntakeValues) => void;
  loading: boolean;
}) {
  const [vals, setVals] = useState<IntakeValues>({
    business: defaults.business ?? "",
    niche: defaults.niche ?? "",
    stage: defaults.stage ?? "Validate",
    goal: defaults.goal ?? "",
    current_revenue: defaults.current_revenue ?? "",
    target_customer: defaults.target_customer ?? "",
    biggest_blocker: defaults.biggest_blocker ?? "",
  });

  const set =
    (k: keyof IntakeValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setVals((v) => ({ ...v, [k]: e.target.value }));

  const valid = vals.business.trim().length > 8 && vals.goal.trim().length > 4;

  const hasDefaults = !!defaults.business || !!defaults.goal || !!defaults.niche;

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div
        className="w-full max-w-lg rounded-3xl p-8"
        style={{
          background: "var(--surface)",
          border: "1px solid rgba(139,92,246,0.15)",
          boxShadow: "0 0 0 1px rgba(139,92,246,0.05), 0 8px 40px rgba(0,0,0,0.4)",
        }}
      >
        <div className="flex items-center gap-3 mb-7">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl"
            style={{
              background: "rgba(139,92,246,0.1)",
              border: "1px solid rgba(139,92,246,0.22)",
            }}
          >
            <Sparkles className="h-5 w-5" style={{ color: "#8b5cf6" }} />
          </div>
          <div>
            <div
              className="font-display font-bold text-[17px]"
              style={{ color: "var(--foreground)" }}
            >
              Nova Operator Dashboard
            </div>
            <div className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
              {hasDefaults
                ? "Pre-filled from your onboarding — adjust anything below"
                : "Tell Nova about your business to generate your command center"}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label
              className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--muted-foreground)" }}
            >
              Business / offer *
            </label>
            <Textarea
              value={vals.business}
              onChange={set("business")}
              placeholder="e.g. B2B SaaS for real estate agents that automates Zillow lead follow-up"
              rows={3}
              className="text-[13px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--muted-foreground)" }}
              >
                Niche / Industry
              </label>
              <Input
                value={vals.niche}
                onChange={set("niche")}
                placeholder="e.g. PropTech, Health"
                className="text-[13px]"
              />
            </div>
            <div>
              <label
                className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--muted-foreground)" }}
              >
                Stage
              </label>
              <select
                value={vals.stage}
                onChange={set("stage")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {["Idea", "Validate", "Launch", "Operate", "Scale"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--muted-foreground)" }}
            >
              Primary goal — next 90 days *
            </label>
            <Input
              value={vals.goal}
              onChange={set("goal")}
              placeholder="e.g. Get 10 paying customers, hit $5k MRR"
              className="text-[13px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--muted-foreground)" }}
              >
                Monthly Revenue
              </label>
              <Input
                value={vals.current_revenue}
                onChange={set("current_revenue")}
                placeholder="$0, $2k, Pre-revenue"
                className="text-[13px]"
              />
            </div>
            <div>
              <label
                className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--muted-foreground)" }}
              >
                Target Customer
              </label>
              <Input
                value={vals.target_customer}
                onChange={set("target_customer")}
                placeholder="e.g. Solo real estate agents"
                className="text-[13px]"
              />
            </div>
          </div>

          <div>
            <label
              className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--muted-foreground)" }}
            >
              Biggest blocker right now
            </label>
            <Input
              value={vals.biggest_blocker}
              onChange={set("biggest_blocker")}
              placeholder="e.g. Can't get first customer, no marketing traction"
              className="text-[13px]"
            />
          </div>

          <Button
            className="w-full"
            disabled={!valid || loading}
            onClick={() => onSubmit(vals)}
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Nova is generating your dashboard…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate My Dashboard
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard view ─────────────────────────────────────────────────────────────

function DashboardView({
  data,
  generatedAt,
  onRegenerate,
  regenerating,
}: {
  data: DashboardPayload;
  generatedAt: string;
  onRegenerate: () => void;
  regenerating: boolean;
}) {
  const stageColor = STAGE_COLOR[data.stage] ?? "#3b82f6";
  const timeAgo = (() => {
    const diff = Date.now() - new Date(generatedAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  })();

  return (
    <div className="space-y-8 pb-20">
      {/* Header card */}
      <div
        className="relative overflow-hidden rounded-3xl p-7"
        style={{
          background: "var(--surface)",
          border: `1px solid ${stageColor}1a`,
          boxShadow: `0 0 0 1px ${stageColor}08, 0 8px 40px rgba(0,0,0,0.35)`,
        }}
      >
        <NeuralCanvas />
        <div className="relative z-10">
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span
              className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: `${stageColor}15`, color: stageColor }}
            >
              Stage: {data.stage}
            </span>
            <span className="text-[10.5px] ml-auto" style={{ color: "var(--muted-foreground)" }}>
              Generated {timeAgo}
            </span>
            <button
              onClick={onRegenerate}
              disabled={regenerating}
              className="flex items-center gap-1.5 text-[11px] rounded-lg px-2.5 py-1.5"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "var(--muted-foreground)",
              }}
            >
              {regenerating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Regenerate
            </button>
          </div>

          <h1
            className="font-display font-black leading-tight mb-2"
            style={{
              fontSize: "clamp(1.3rem, 3vw, 1.75rem)",
              color: "var(--foreground)",
              letterSpacing: "-0.03em",
            }}
          >
            {data.headline}
          </h1>
          <p className="text-[13.5px] max-w-2xl" style={{ color: "var(--muted-foreground)" }}>
            {data.summary}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {/* North star */}
            <div
              className="flex items-center gap-2.5 rounded-xl px-4 py-3"
              style={{
                background: "rgba(16,185,129,0.07)",
                border: "1px solid rgba(16,185,129,0.15)",
              }}
            >
              <TrendingUp className="h-4 w-4 shrink-0" style={{ color: "var(--success)" }} />
              <div>
                <div
                  className="text-[9px] font-bold uppercase tracking-wider"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  North Star
                </div>
                <div className="text-[12.5px] font-semibold" style={{ color: "var(--success)" }}>
                  {data.north_star_metric}
                </div>
              </div>
            </div>

            {/* Top risks */}
            {data.top_risks.slice(0, 2).map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-xl px-4 py-3"
                style={{
                  background: "rgba(239,68,68,0.07)",
                  border: "1px solid rgba(239,68,68,0.15)",
                }}
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: "#ef4444" }} />
                <span className="text-[12px]" style={{ color: "#ef4444" }}>
                  {r}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <section>
        <SectionHeader icon={BarChart3} label="Key Metrics" color="#3b82f6" />
        <div className="grid grid-cols-2 gap-3 mt-4 sm:grid-cols-3">
          {data.kpis.map((k, i) => (
            <KpiCardView key={i} kpi={k} />
          ))}
        </div>
      </section>

      {/* Guides */}
      <section>
        <SectionHeader
          icon={BookOpen}
          label="Guides"
          sub="Click to expand step-by-step playbooks"
          color="#8b5cf6"
        />
        <div className="space-y-3 mt-4">
          {data.guides.map((g, i) => (
            <GuideCard key={i} guide={g} />
          ))}
        </div>
      </section>

      {/* Quick wins */}
      <section>
        <SectionHeader icon={Zap} label="Quick Wins" sub="Execute this week" color="#f59e0b" />
        <div className="space-y-2.5 mt-4">
          {data.quick_wins.map((w, i) => (
            <QuickWinCard key={i} win={w} />
          ))}
        </div>
      </section>

      {/* Roadmap */}
      <section>
        <SectionHeader icon={Map} label="Roadmap" color="#10b981" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.roadmap.map((phase, i) => (
            <div
              key={i}
              className="rounded-2xl p-5"
              style={{
                background: "var(--surface)",
                border: "1px solid rgba(16,185,129,0.12)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
                  style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}
                >
                  {i + 1}
                </div>
                <span className="font-bold text-[13px]" style={{ color: "var(--foreground)" }}>
                  {phase.phase}
                </span>
                <span className="ml-auto text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                  {phase.duration}
                </span>
              </div>
              <p className="text-[12px] mb-3 font-medium" style={{ color: "#10b981" }}>
                {phase.goal}
              </p>
              <ul className="space-y-1.5">
                {phase.milestones.map((m, j) => (
                  <li
                    key={j}
                    className="flex items-start gap-2 text-[11.5px]"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    <span
                      className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ background: "rgba(16,185,129,0.5)" }}
                    />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Tool recommendations */}
      <section>
        <SectionHeader
          icon={Rocket}
          label="Recommended Tools"
          sub="Actions inside Nova Launchpad"
          color="#3b82f6"
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {data.tool_recommendations.map((rec, i) => (
            <Link
              key={i}
              to="/app/launchpad/$tool"
              params={{ tool: rec.slug }}
              className="flex items-center gap-3.5 rounded-xl p-4 group"
              style={{
                background: "var(--surface)",
                border: "1px solid rgba(59,130,246,0.12)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.3)";
                (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.04)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.12)";
                (e.currentTarget as HTMLElement).style.background = "var(--surface)";
              }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: "rgba(59,130,246,0.1)",
                  border: "1px solid rgba(59,130,246,0.2)",
                }}
              >
                <Sparkles className="h-4 w-4" style={{ color: "#3b82f6" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[13px]" style={{ color: "var(--foreground)" }}>
                  {rec.tool}
                </div>
                <div className="text-[11.5px]" style={{ color: "var(--muted-foreground)" }}>
                  {rec.reason}
                </div>
              </div>
              <ExternalLink
                className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"
                style={{ color: "#3b82f6" }}
              />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

function AiDashboardPage() {
  const { currentOrgId } = useAuth();
  const qc = useQueryClient();

  const dashboardQ = useQuery({
    ...aiDashboardQuery(currentOrgId ?? ""),
    enabled: !!currentOrgId,
  });

  const onboardingQ = useQuery({
    ...onboardingResponseQuery(currentOrgId ?? ""),
    enabled: !!currentOrgId,
  });

  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateMutation = useMutation({
    mutationFn: (input: GenerateDashboardInput) => generateAiDashboard(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai_dashboard", currentOrgId] });
      setShowForm(false);
      setError(null);
      toast.success("Dashboard generated");
    },
    onError: (e: Error) => {
      setError(e.message);
      toast.error(e.message);
    },
  });

  const handleSubmit = useCallback(
    (vals: GenerateDashboardInput) => {
      setError(null);
      generateMutation.mutate(vals);
    },
    [generateMutation],
  );

  const handleRegenerate = useCallback(() => {
    const saved = dashboardQ.data;
    if (!saved) {
      setShowForm(true);
      return;
    }
    generateMutation.mutate({
      business: saved.business,
      niche: saved.niche ?? undefined,
      stage: saved.stage ?? undefined,
      goal: saved.goal ?? undefined,
      current_revenue: saved.current_revenue ?? undefined,
      target_customer: saved.target_customer ?? undefined,
      biggest_blocker: saved.biggest_blocker ?? undefined,
    });
  }, [dashboardQ.data, generateMutation]);

  // ── Derive intake defaults from onboarding or last saved dashboard ──────────
  const intakeDefaults: Partial<GenerateDashboardInput> = (() => {
    const saved = dashboardQ.data;
    const ob = onboardingQ.data;
    return {
      business: saved?.business || ob?.offer || ob?.business_type || "",
      niche: saved?.niche || ob?.niche || "",
      stage: saved?.stage || ob?.stage || "Validate",
      goal: saved?.goal || ob?.goal || "",
      current_revenue: saved?.current_revenue || ob?.current_revenue || "",
      target_customer: saved?.target_customer || ob?.target_customer || "",
      biggest_blocker: saved?.biggest_blocker || ob?.biggest_blocker || "",
    };
  })();

  const isLoading = dashboardQ.isLoading || onboardingQ.isLoading;
  const isGenerating = generateMutation.isPending;

  const hasDashboard = !!dashboardQ.data && !showForm;
  const payload = dashboardQ.data?.payload as DashboardPayload | undefined;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Page header */}
        <div className="flex items-center gap-2 mb-6">
          <LayoutDashboard className="h-5 w-5" style={{ color: "var(--primary)" }} />
          <span
            className="font-display font-bold text-[18px]"
            style={{ color: "var(--foreground)" }}
          >
            AI Dashboard
          </span>
          {hasDashboard && !isGenerating && (
            <button
              onClick={() => setShowForm(true)}
              className="ml-auto text-[11.5px] flex items-center gap-1.5 rounded-lg px-3 py-1.5"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "var(--muted-foreground)",
              }}
            >
              <RefreshCw className="h-3 w-3" /> Change inputs
            </button>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div
            className="mb-5 flex items-start gap-3 rounded-xl p-4 text-[13px]"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#ef4444",
            }}
          >
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && !isGenerating && (
          <div className="flex min-h-[60vh] items-center justify-center">
            <Loader2
              className="h-7 w-7 animate-spin"
              style={{ color: "var(--muted-foreground)" }}
            />
          </div>
        )}

        {/* Generating state */}
        {isGenerating && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{
                background: "rgba(139,92,246,0.1)",
                border: "1px solid rgba(139,92,246,0.22)",
              }}
            >
              <Sparkles className="h-7 w-7 animate-pulse" style={{ color: "#8b5cf6" }} />
            </div>
            <div className="text-center">
              <div className="font-bold text-[16px] mb-1" style={{ color: "var(--foreground)" }}>
                Nova is analyzing your business…
              </div>
              <div className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>
                Building guides, KPIs, roadmap, and quick wins
              </div>
            </div>
          </div>
        )}

        {/* Intake form */}
        {!isLoading && !isGenerating && (!hasDashboard || showForm) && (
          <IntakeForm defaults={intakeDefaults} onSubmit={handleSubmit} loading={isGenerating} />
        )}

        {/* Dashboard */}
        {!isLoading && !isGenerating && hasDashboard && payload && (
          <DashboardView
            data={payload}
            generatedAt={dashboardQ.data!.generated_at}
            onRegenerate={handleRegenerate}
            regenerating={isGenerating}
          />
        )}
      </div>
    </div>
  );
}
