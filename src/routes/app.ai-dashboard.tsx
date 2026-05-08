import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { hasLocalAiKey } from "@/lib/runToolLocally";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { NeuralCanvas } from "@/components/app/NeuralCanvas";

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

type AiDashboard = {
  headline: string;
  summary: string;
  stage: string;
  guides: Guide[];
  kpis: KpiCard[];
  quick_wins: QuickWin[];
  roadmap: RoadmapPhase[];
  tool_recommendations: ToolRec[];
  top_risk: string;
  north_star: string;
};

// ── Icon map ───────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
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
};

function getGuideIcon(iconKey: string) {
  return ICON_MAP[iconKey] ?? BookOpen;
}

const PRIORITY_COLOR = {
  critical: "#ef4444",
  high: "#f59e0b",
  medium: "#3b82f6",
};

const EFFORT_COLOR = {
  low: "var(--success)",
  medium: "#f59e0b",
  high: "#ef4444",
};

// ── AI call ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an elite business strategist and operator AI running a startup launchpad platform.
Your job is to analyze a founder's business and generate a fully personalized, actionable dashboard.

You must produce:
1. Real step-by-step guides (not generic — specific to their business)
2. Concrete KPIs with current/target numbers
3. Quick wins they can execute this week
4. A phased roadmap
5. Tool recommendations from the platform
6. Their #1 risk and north star metric

Be brutally specific. Reference their niche, customer type, and stage. No fluff.`;

function buildPrompt(input: {
  business: string;
  niche: string;
  stage: string;
  goal: string;
  revenue: string;
}): string {
  return `Generate a complete personalized dashboard for this founder:

Business: ${input.business}
Niche/Industry: ${input.niche}
Current Stage: ${input.stage}
Primary Goal (next 90 days): ${input.goal}
Current Monthly Revenue: ${input.revenue || "Pre-revenue"}

Create a dashboard that is 100% specific to their situation. Every guide, KPI, quick win, and milestone must reference their actual business.`;
}

const DASHBOARD_SCHEMA = {
  name: "generate_ai_dashboard",
  description: "Generate a fully personalized AI dashboard for a founder",
  input_schema: {
    type: "object",
    required: [
      "headline",
      "summary",
      "stage",
      "guides",
      "kpis",
      "quick_wins",
      "roadmap",
      "tool_recommendations",
      "top_risk",
      "north_star",
    ],
    properties: {
      headline: { type: "string", description: "Punchy 1-line summary of their situation" },
      summary: { type: "string", description: "2-3 sentence strategic summary" },
      stage: {
        type: "string",
        enum: ["Idea", "Validate", "Launch", "Operate", "Scale"],
        description: "Their actual business stage",
      },
      north_star: { type: "string", description: "The single most important metric to move" },
      top_risk: { type: "string", description: "The biggest risk they face right now" },
      guides: {
        type: "array",
        minItems: 3,
        maxItems: 5,
        items: {
          type: "object",
          required: ["title", "icon", "summary", "priority", "steps"],
          properties: {
            title: { type: "string" },
            icon: {
              type: "string",
              enum: ["target", "rocket", "users", "bar-chart", "zap", "trending-up", "dollar-sign", "lightbulb", "book", "map"],
            },
            summary: { type: "string" },
            priority: { type: "string", enum: ["critical", "high", "medium"] },
            steps: {
              type: "array",
              minItems: 3,
              maxItems: 6,
              items: {
                type: "object",
                required: ["title", "description", "time_estimate", "action"],
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  time_estimate: { type: "string" },
                  action: { type: "string" },
                },
              },
            },
          },
        },
      },
      kpis: {
        type: "array",
        minItems: 4,
        maxItems: 6,
        items: {
          type: "object",
          required: ["metric", "current", "target", "timeframe", "how"],
          properties: {
            metric: { type: "string" },
            current: { type: "string" },
            target: { type: "string" },
            timeframe: { type: "string" },
            how: { type: "string" },
          },
        },
      },
      quick_wins: {
        type: "array",
        minItems: 3,
        maxItems: 5,
        items: {
          type: "object",
          required: ["title", "impact", "effort", "description"],
          properties: {
            title: { type: "string" },
            impact: { type: "string" },
            effort: { type: "string", enum: ["low", "medium", "high"] },
            description: { type: "string" },
          },
        },
      },
      roadmap: {
        type: "array",
        minItems: 3,
        maxItems: 4,
        items: {
          type: "object",
          required: ["phase", "duration", "goal", "milestones"],
          properties: {
            phase: { type: "string" },
            duration: { type: "string" },
            goal: { type: "string" },
            milestones: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
          },
        },
      },
      tool_recommendations: {
        type: "array",
        minItems: 2,
        maxItems: 4,
        items: {
          type: "object",
          required: ["tool", "reason", "slug"],
          properties: {
            tool: { type: "string" },
            reason: { type: "string" },
            slug: {
              type: "string",
              enum: [
                "idea-validator",
                "pitch-generator",
                "gtm-strategy",
                "offer",
                "ops-plan",
                "followup",
                "website-audit",
                "first-10-customers",
                "kill-my-idea",
                "funding-score",
              ],
            },
          },
        },
      },
    },
  },
};

async function generateDashboard(
  input: { business: string; niche: string; stage: string; goal: string; revenue: string },
  onStream: (chunk: string) => void,
): Promise<AiDashboard> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
  if (!apiKey) throw new Error("VITE_ANTHROPIC_API_KEY is not configured.");

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      stream: true,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildPrompt(input) }],
      tools: [DASHBOARD_SCHEMA],
      tool_choice: { type: "tool", name: "generate_ai_dashboard" },
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    if (resp.status === 401) throw new Error("Invalid Anthropic API key.");
    if (resp.status === 429) throw new Error("Rate limited — wait a moment and try again.");
    throw new Error(`API error ${resp.status}: ${body.slice(0, 200)}`);
  }

  const reader = resp.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let jsonAccum = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (raw === "[DONE]") continue;
      try {
        const event = JSON.parse(raw) as {
          type: string;
          delta?: { type: string; partial_json?: string };
        };
        if (
          event.type === "content_block_delta" &&
          event.delta?.type === "input_json_delta" &&
          event.delta.partial_json
        ) {
          jsonAccum += event.delta.partial_json;
          onStream(event.delta.partial_json);
        }
      } catch { /* skip */ }
    }
  }

  if (!jsonAccum) throw new Error("No output received. Try again.");
  return JSON.parse(jsonAccum) as AiDashboard;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function GuideCard({ guide }: { guide: Guide }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<Set<number>>(new Set());
  const Icon = getGuideIcon(guide.icon);
  const color = PRIORITY_COLOR[guide.priority];

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: "var(--surface)",
        border: `1px solid ${color}20`,
        boxShadow: `0 0 0 1px ${color}0a, 0 2px 8px rgba(0,0,0,0.3)`,
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:opacity-90 transition-opacity"
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: `${color}15`,
            border: `1px solid ${color}30`,
          }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[14px]" style={{ color: "var(--foreground)" }}>
              {guide.title}
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider"
              style={{ background: `${color}15`, color }}
            >
              {guide.priority}
            </span>
          </div>
          <p className="text-[12px] mt-0.5 truncate" style={{ color: "var(--muted-foreground)" }}>
            {guide.summary}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
            {done.size}/{guide.steps.length} done
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
              className="flex gap-3 px-5 py-3.5 transition-all cursor-pointer"
              style={{
                borderBottom:
                  i < guide.steps.length - 1 ? `1px solid rgba(255,255,255,0.04)` : "none",
                background: done.has(i) ? `${color}06` : "transparent",
              }}
              onClick={() =>
                setDone((prev) => {
                  const next = new Set(prev);
                  next.has(i) ? next.delete(i) : next.add(i);
                  return next;
                })
              }
            >
              <div className="mt-0.5 shrink-0">
                {done.has(i) ? (
                  <CheckCircle2 className="h-4 w-4" style={{ color: "var(--success)" }} />
                ) : (
                  <Circle className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
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
                <div className="mt-1.5">
                  <span
                    className="text-[11px] font-medium"
                    style={{ color }}
                  >
                    → {step.action}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KpiCard({ kpi }: { kpi: KpiCard }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "var(--surface)",
        border: "1px solid rgba(59,130,246,0.12)",
        boxShadow: "0 0 0 1px rgba(59,130,246,0.04), 0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--muted-foreground)" }}>
        {kpi.metric}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-black text-[1.6rem] leading-none tabular-nums" style={{ color: "var(--foreground)", letterSpacing: "-0.04em" }}>
          {kpi.current}
        </span>
        <ArrowRight className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
        <span className="font-bold text-[1.1rem] leading-none" style={{ color: "#3b82f6" }}>
          {kpi.target}
        </span>
      </div>
      <div className="mt-1.5 text-[10.5px]" style={{ color: "var(--muted-foreground)" }}>
        {kpi.timeframe}
      </div>
      <div
        className="mt-2.5 text-[11.5px] pt-2.5"
        style={{ color: "var(--foreground)", borderTop: "1px solid rgba(255,255,255,0.05)" }}
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
      className="rounded-xl p-4 cursor-pointer transition-all"
      style={{
        background: done ? "rgba(16,185,129,0.05)" : "var(--surface)",
        border: done ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(255,255,255,0.06)",
        opacity: done ? 0.7 : 1,
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
            <span className={cn("text-[13px] font-semibold", done && "line-through opacity-60")} style={{ color: "var(--foreground)" }}>
              {win.title}
            </span>
            <span
              className="rounded-full px-1.5 py-0.5 text-[9.5px] font-bold uppercase"
              style={{
                background: `${EFFORT_COLOR[win.effort]}15`,
                color: EFFORT_COLOR[win.effort],
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
  revenue: string;
};

function IntakeForm({ onSubmit, loading }: { onSubmit: (v: IntakeValues) => void; loading: boolean }) {
  const [vals, setVals] = useState<IntakeValues>({
    business: "",
    niche: "",
    stage: "Validate",
    goal: "",
    revenue: "",
  });

  const set = (k: keyof IntakeValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setVals((v) => ({ ...v, [k]: e.target.value }));

  const valid = vals.business.trim().length > 10 && vals.goal.trim().length > 5;

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div
        className="w-full max-w-lg rounded-3xl p-8"
        style={{
          background: "var(--surface)",
          border: "1px solid rgba(139,92,246,0.15)",
          boxShadow: "0 0 0 1px rgba(139,92,246,0.05), 0 8px 40px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-7">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl"
            style={{
              background: "rgba(139,92,246,0.12)",
              border: "1px solid rgba(139,92,246,0.25)",
            }}
          >
            <Sparkles className="h-5 w-5" style={{ color: "#8b5cf6" }} />
          </div>
          <div>
            <div className="font-display font-bold text-[17px]" style={{ color: "var(--foreground)" }}>
              AI Dashboard Generator
            </div>
            <div className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
              Tell me about your business — I'll build your command center
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11.5px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--muted-foreground)" }}>
              Describe your business *
            </label>
            <Textarea
              value={vals.business}
              onChange={set("business")}
              placeholder="e.g. B2B SaaS for real estate agents that automates follow-up emails with leads from Zillow"
              rows={3}
              className="text-[13px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                Niche / Industry
              </label>
              <Input
                value={vals.niche}
                onChange={set("niche")}
                placeholder="e.g. PropTech, Health, Legal"
                className="text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                Current Stage
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
            <label className="block text-[11.5px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--muted-foreground)" }}>
              Primary goal — next 90 days *
            </label>
            <Input
              value={vals.goal}
              onChange={set("goal")}
              placeholder="e.g. Get first 10 paying customers, hit $5k MRR"
              className="text-[13px]"
            />
          </div>

          <div>
            <label className="block text-[11.5px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--muted-foreground)" }}>
              Monthly Revenue (optional)
            </label>
            <Input
              value={vals.revenue}
              onChange={set("revenue")}
              placeholder="e.g. $0, $2,500, $15k"
              className="text-[13px]"
            />
          </div>

          {!hasLocalAiKey() && (
            <div
              className="flex items-start gap-2.5 rounded-xl p-3.5 text-[12px]"
              style={{
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.2)",
                color: "#f59e0b",
              }}
            >
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                No local API key found. Add <code className="font-mono">VITE_ANTHROPIC_API_KEY</code> to your <code className="font-mono">.env</code> to use this feature.
              </span>
            </div>
          )}

          <Button
            className="w-full"
            disabled={!valid || loading || !hasLocalAiKey()}
            onClick={() => onSubmit(vals)}
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                AI is building your dashboard…
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

// ── Main dashboard view ────────────────────────────────────────────────────────

function DashboardView({
  data,
  onReset,
}: {
  data: AiDashboard;
  onReset: () => void;
}) {
  const [activeGuide, setActiveGuide] = useState<number | null>(null);

  const STAGE_COLORS: Record<string, string> = {
    Idea: "#f59e0b",
    Validate: "#3b82f6",
    Launch: "#8b5cf6",
    Operate: "#10b981",
    Scale: "#ef4444",
  };
  const stageColor = STAGE_COLORS[data.stage] ?? "#3b82f6";

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-3xl p-7"
        style={{
          background: "var(--surface)",
          border: `1px solid ${stageColor}20`,
          boxShadow: `0 0 0 1px ${stageColor}08, 0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)`,
        }}
      >
        <NeuralCanvas />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="rounded-full px-3 py-1 text-[10.5px] font-bold uppercase tracking-wider"
              style={{ background: `${stageColor}15`, color: stageColor }}
            >
              Stage: {data.stage}
            </span>
            <button
              onClick={onReset}
              className="ml-auto flex items-center gap-1.5 text-[11px] rounded-lg px-2.5 py-1.5 transition-colors hover:opacity-80"
              style={{
                background: "rgba(255,255,255,0.05)",
                color: "var(--muted-foreground)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <RefreshCw className="h-3 w-3" />
              Regenerate
            </button>
          </div>
          <h1
            className="font-display font-black text-[1.6rem] leading-tight mb-2"
            style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}
          >
            {data.headline}
          </h1>
          <p className="text-[14px] max-w-2xl" style={{ color: "var(--muted-foreground)" }}>
            {data.summary}
          </p>

          <div className="mt-5 flex flex-wrap gap-4">
            <div
              className="flex items-center gap-2.5 rounded-xl px-4 py-3"
              style={{
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.15)",
              }}
            >
              <TrendingUp className="h-4 w-4" style={{ color: "var(--success)" }} />
              <div>
                <div className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                  North Star
                </div>
                <div className="text-[12.5px] font-semibold" style={{ color: "var(--success)" }}>
                  {data.north_star}
                </div>
              </div>
            </div>
            <div
              className="flex items-center gap-2.5 rounded-xl px-4 py-3"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.15)",
              }}
            >
              <AlertTriangle className="h-4 w-4" style={{ color: "#ef4444" }} />
              <div>
                <div className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                  Top Risk
                </div>
                <div className="text-[12.5px] font-semibold" style={{ color: "#ef4444" }}>
                  {data.top_risk}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <section>
        <SectionHeader icon={BarChart3} label="Key Metrics" color="#3b82f6" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 mt-4">
          {data.kpis.map((k, i) => (
            <KpiCard key={i} kpi={k} />
          ))}
        </div>
      </section>

      {/* Guides */}
      <section>
        <SectionHeader icon={BookOpen} label="Guides" sub="Click to expand step-by-step playbooks" color="#8b5cf6" />
        <div className="space-y-3 mt-4">
          {data.guides.map((g, i) => (
            <GuideCard key={i} guide={g} />
          ))}
        </div>
      </section>

      {/* Quick Wins */}
      <section>
        <SectionHeader icon={Zap} label="Quick Wins" sub="Do these this week" color="#f59e0b" />
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
                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black"
                  style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}
                >
                  {i + 1}
                </div>
                <span className="font-bold text-[13px]" style={{ color: "var(--foreground)" }}>
                  {phase.phase}
                </span>
                <span className="ml-auto text-[10.5px]" style={{ color: "var(--muted-foreground)" }}>
                  {phase.duration}
                </span>
              </div>
              <p className="text-[12px] mb-3" style={{ color: "#10b981" }}>
                {phase.goal}
              </p>
              <ul className="space-y-1.5">
                {phase.milestones.map((m, j) => (
                  <li key={j} className="flex items-start gap-2 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                    <span className="mt-1.5 h-1 w-1 rounded-full shrink-0" style={{ background: "rgba(16,185,129,0.5)" }} />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Tool Recommendations */}
      <section>
        <SectionHeader icon={Rocket} label="Recommended Tools" sub="Launch these from Nova Launchpad" color="#3b82f6" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {data.tool_recommendations.map((rec, i) => (
            <a
              key={i}
              href={`/app/launchpad/${rec.slug}`}
              className="flex items-center gap-3.5 rounded-xl p-4 transition-all"
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
                style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}
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
              <ArrowRight className="h-4 w-4 shrink-0" style={{ color: "rgba(59,130,246,0.5)" }} />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  label,
  sub,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex h-7 w-7 items-center justify-center rounded-lg"
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

// ── Page ───────────────────────────────────────────────────────────────────────

function AiDashboardPage() {
  const { currentOrgId, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamProgress, setStreamProgress] = useState(0);
  const [dashboard, setDashboard] = useState<AiDashboard | null>(null);

  const handleGenerate = useCallback(async (vals: IntakeValues) => {
    setLoading(true);
    setError(null);
    setStreamProgress(0);
    try {
      let chars = 0;
      const result = await generateDashboard(vals, (chunk) => {
        chars += chunk.length;
        // rough progress: ~3000 chars = full output
        setStreamProgress(Math.min(95, Math.round((chars / 3000) * 100)));
      });
      setStreamProgress(100);
      setDashboard(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Page title when showing dashboard */}
        {dashboard && (
          <div className="flex items-center gap-2 mb-6">
            <LayoutDashboard className="h-5 w-5" style={{ color: "var(--primary)" }} />
            <span className="font-display font-bold text-[18px]" style={{ color: "var(--foreground)" }}>
              AI Dashboard
            </span>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}
            >
              <Sparkles className="h-7 w-7 animate-pulse" style={{ color: "#8b5cf6" }} />
            </div>
            <div className="text-center">
              <div className="font-bold text-[16px] mb-1" style={{ color: "var(--foreground)" }}>
                AI is analyzing your business…
              </div>
              <div className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>
                Building personalized guides, KPIs, and roadmap
              </div>
            </div>
            <div className="w-64 rounded-full overflow-hidden h-1.5" style={{ background: "rgba(255,255,255,0.07)" }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${streamProgress}%`,
                  background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                  boxShadow: "0 0 12px #8b5cf680",
                }}
              />
            </div>
            <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
              {streamProgress}% complete
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div
            className="mb-6 flex items-start gap-3 rounded-xl p-4 text-[13px]"
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

        {/* Intake or Dashboard */}
        {!loading && !dashboard && (
          <IntakeForm onSubmit={handleGenerate} loading={loading} />
        )}

        {!loading && dashboard && (
          <DashboardView data={dashboard} onReset={() => setDashboard(null)} />
        )}
      </div>
    </div>
  );
}
