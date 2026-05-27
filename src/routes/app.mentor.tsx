/**
 * MISSION CONTROL — AI Mentorship Platform
 * Route: /app/mentor
 *
 * Design system: solar-system mission control · aerospace command glass
 * Brand: blue #3b82f6 (primary) · violet #8b5cf6 (AI) · cyan #06b6d4 (signal)
 *        orange #f97316 · green #10b981 · amber #f59e0b
 * Surfaces: #080810 → #0d0d1e → #111128
 *
 * Data wiring:
 *  - KPIs derived from leads + tool_runs + automation_settings via mentorKPIsQuery
 *  - Insights from mentor_insights table (populated by n8n workflows)
 *  - Chat sessions persisted to mentor_agent_sessions via saveMentorMessage
 *  - Agent chat routed to n8n mentor-agent-dispatch via runMentorAgent
 *  - Pipeline derived from leads table (stage distribution)
 *  - Weekly mission from missions table via workspace
 */

import React, { useState, useEffect, useRef, useCallback, useId } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  TrendingUp,
  Target,
  Workflow,
  DollarSign,
  PenLine,
  Layers,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  X,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Command,
  MessageSquare,
  Circle,
  Zap,
  Send,
  Radio,
  Signal,
  LayoutDashboard,
  Cpu,
  Navigation2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  leadsQuery,
  toolRunsQuery,
  automationSettingsQuery,
  mentorKPIsQuery,
  mentorInsightsQuery,
  mentorSessionQuery,
  saveMentorMessage,
  markInsightsRead,
  type MentorMessage,
  type MentorInsight,
} from "@/lib/queries";
import { runMentorAgent, type MentorAgentId } from "@/lib/operator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/mentor")({ component: MentorPage });

/* ─────────────────────────── BRAND TOKENS ─────────────────────────── */
const C = {
  blue: "#3b82f6",
  violet: "#8b5cf6",
  cyan: "#06b6d4",
  orange: "#f97316",
  green: "#10b981",
  amber: "#f59e0b",
  red: "#f87171",
} as const;

/* ─────────────────────────── AGENT DEFINITIONS ─────────────────────── */
interface BriefStep {
  title: string;
  detail: string;
  time: string;
  action: string;
  priority: "critical" | "high" | "medium";
  toolLink?: string;
}

interface AgentDef {
  id: MentorAgentId;
  role: string;
  codename: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  orbit: 1 | 2 | 3;
  brief: BriefStep[];
  /** Dynamic fields are computed from real data */
}

const AGENT_DEFS: AgentDef[] = [
  {
    id: "growth",
    role: "Growth Commander",
    codename: "GC-01",
    Icon: TrendingUp,
    color: C.blue,
    orbit: 1,
    brief: [
      {
        title: "Audit acquisition channels by CAC",
        detail:
          "LinkedIn is converting at 3× cold email. Focus budget here. Cut channels with CAC > $200.",
        time: "30 min",
        action: "Open CRM → Filter by source → Sort conversion rate",
        priority: "critical",
      },
      {
        title: "Scale outbound volume to 20 DMs/day",
        detail: "Doubling volume with the same framework compounds pipeline in 2 weeks.",
        time: "45 min",
        action: "Build sequence in Automation workflow",
        priority: "high",
        toolLink: "/app/nova/workflows",
      },
      {
        title: "Set weekly MRR checkpoints",
        detail: "Map targets at weeks 2, 4, 6 to catch trajectory issues early.",
        time: "15 min",
        action: "Open Revenue Projector",
        priority: "medium",
        toolLink: "/app/launchpad/revenue-projector",
      },
    ],
  },
  {
    id: "offer",
    role: "Offer Architect",
    codename: "OA-02",
    Icon: Layers,
    color: C.violet,
    orbit: 2,
    brief: [
      {
        title: "Write your strongest transformation statement",
        detail:
          "Best customer result → 2-sentence outcome statement. This anchors the entire offer.",
        time: "20 min",
        action: "Run Offer Builder",
        priority: "critical",
        toolLink: "/app/launchpad/offer",
      },
      {
        title: "Test outcome-framed copy",
        detail:
          "Replace feature bullets with outcomes: 'Save 12h/week' vs 'Automated workflow engine'.",
        time: "60 min",
        action: "Generate Landing Page variant",
        priority: "high",
        toolLink: "/app/launchpad/landing-page",
      },
    ],
  },
  {
    id: "sales",
    role: "Sales Operator",
    codename: "SO-03",
    Icon: Target,
    color: C.green,
    orbit: 1,
    brief: [
      {
        title: "Contact hot leads today — no delay",
        detail:
          "Leads with 3+ proposal opens or same-week discovery calls need contact within 24h or go cold.",
        time: "45 min",
        action: "Open CRM Pipeline → Hot Leads filter",
        priority: "critical",
        toolLink: "/app/nova/crm",
      },
      {
        title: "Trigger re-engagement on stalled deals",
        detail: "Deals quiet 7+ days: deploy 3-touch re-engagement sequence with 31% revival rate.",
        time: "20 min",
        action: "Deploy re-engagement automation",
        priority: "high",
        toolLink: "/app/nova/workflows",
      },
    ],
  },
  {
    id: "content",
    role: "Content Strategist",
    codename: "CS-04",
    Icon: PenLine,
    color: C.orange,
    orbit: 3,
    brief: [
      {
        title: "Define 3 content pillars for your ICP",
        detail:
          "Founder journey, client transformation stories, tactical how-to posts drive 80% of B2B founder engagement.",
        time: "30 min",
        action: "Run Blog Generator with pillar framework",
        priority: "medium",
        toolLink: "/app/launchpad/blog",
      },
    ],
  },
  {
    id: "automation",
    role: "Automation Engineer",
    codename: "AE-05",
    Icon: Zap,
    color: C.cyan,
    orbit: 2,
    brief: [
      {
        title: "Deploy lead scoring automation",
        detail:
          "Score leads on email opens, page visits, response speed. Auto-flag score 70+ for immediate sales contact.",
        time: "40 min",
        action: "Configure scoring in Automation Workflow",
        priority: "critical",
        toolLink: "/app/nova/workflows",
      },
      {
        title: "Build CRM → Slack notification bridge",
        detail: "Instant ping when a lead hits score threshold or opens a proposal. 3h/week saved.",
        time: "25 min",
        action: "Add webhook trigger in Nova OS Workflows",
        priority: "high",
        toolLink: "/app/nova/workflows",
      },
    ],
  },
  {
    id: "finance",
    role: "Finance Navigator",
    codename: "FN-06",
    Icon: DollarSign,
    color: C.amber,
    orbit: 3,
    brief: [
      {
        title: "Run LTV:CAC unit economics analysis",
        detail: "Benchmark 3:1+. Improving close rate 12% → 18% adds 4 months of runway.",
        time: "30 min",
        action: "Open Revenue Projector",
        priority: "high",
        toolLink: "/app/launchpad/revenue-projector",
      },
    ],
  },
];

/* ─────────────────────────── CANVAS ─────────────────────────────────── */
function OrbitalCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const STARS = Array.from({ length: 100 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 0.8 + 0.2,
      a: Math.random() * 0.35 + 0.08,
    }));

    const ORBS = [
      { frac: 0.28, speed: 0.00018, angle: 0, color: C.blue },
      { frac: 0.28, speed: 0.00018, angle: Math.PI, color: C.green },
      { frac: 0.4, speed: 0.00012, angle: 0.8, color: C.violet },
      { frac: 0.4, speed: 0.00012, angle: 3.6, color: C.cyan },
      { frac: 0.52, speed: 0.00008, angle: 1.2, color: C.orange },
      { frac: 0.52, speed: 0.00008, angle: 4.5, color: C.amber },
    ];

    const draw = () => {
      t++;
      const W = canvas.width,
        H = canvas.height;
      const cx = W * 0.5,
        cy = H * 0.5;

      ctx.clearRect(0, 0, W, H);

      STARS.forEach((s) => {
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240,244,255,${s.a})`;
        ctx.fill();
      });

      [0.28, 0.4, 0.52].forEach((frac, i) => {
        const R = Math.min(W, H) * frac;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(59,130,246,${0.07 - i * 0.015})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 10]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Radar sweep
      const sweep = (t * 0.003) % (Math.PI * 2);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(sweep);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, Math.min(W, H) * 0.6, -0.25, 0);
      ctx.closePath();
      ctx.fillStyle = "rgba(59,130,246,0.022)";
      ctx.fill();
      ctx.restore();

      ORBS.forEach((o) => {
        o.angle += o.speed * 60;
        const R = Math.min(W, H) * o.frac;
        const x = cx + Math.cos(o.angle) * R;
        const y = cy + Math.sin(o.angle) * R;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 7);
        g.addColorStop(0, o.color + "bb");
        g.addColorStop(1, o.color + "00");
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = o.color;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity: 0.48,
        zIndex: 0,
      }}
    />
  );
}

/* ─────────────────────────── SPARKLINE ──────────────────────────────── */
function Sparkline({
  data,
  color,
  w = 72,
  h = 22,
}: {
  data: number[];
  color: string;
  w?: number;
  h?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const min = Math.min(...data),
    max = Math.max(...data);
  const rng = max - min || 1;
  const pts = data
    .map(
      (v, i) =>
        `${((i / (data.length - 1)) * w).toFixed(1)},${(h - ((v - min) / rng) * (h - 2) - 1).toFixed(1)}`,
    )
    .join(" ");
  const last = pts.split(" ").at(-1)?.split(",") ?? ["0", "0"];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`sg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M0,${h} ${pts} L${w},${h} Z`} fill={`url(#sg-${uid})`} />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <circle cx={last[0]} cy={last[1]} r="2" fill={color} opacity="0.9" />
    </svg>
  );
}

/* ─────────────────────────── STATUS BADGE ───────────────────────────── */
type AgentStatus = "active" | "analyzing" | "standby";
function StatusBadge({ status }: { status: AgentStatus }) {
  const cfg = {
    active: { label: "ACTIVE", color: C.green, pulse: true },
    analyzing: { label: "ANALYZING", color: C.blue, pulse: false },
    standby: { label: "STANDBY", color: "rgba(240,244,255,0.3)", pulse: false },
  }[status];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
      style={{
        fontSize: "9px",
        fontWeight: 700,
        letterSpacing: "0.12em",
        color: cfg.color,
        background: `${cfg.color}14`,
        border: `1px solid ${cfg.color}28`,
      }}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", cfg.pulse && "nova-live-dot")}
        style={{ background: cfg.color }}
      />
      {cfg.label}
    </span>
  );
}

/* ─────────────────────────── CONFIDENCE RING ───────────────────────── */
function ConfRing({ value, color, size = 28 }: { value: number; color: string; size?: number }) {
  const r = (size - 4) / 2,
    c2 = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="2.5"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={c2}
          strokeDashoffset={c2 - (c2 * value) / 100}
          style={{ filter: `drop-shadow(0 0 3px ${color}80)` }}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center font-mono"
        style={{ fontSize: "8px", fontWeight: 800, color, letterSpacing: "-0.02em" }}
      >
        {value}
      </div>
    </div>
  );
}

/* ─────────────────────────── AGENT CARD ─────────────────────────────── */
interface LiveAgent extends AgentDef {
  status: AgentStatus;
  confidence: number;
  lastRec: string;
  nextMove: string;
  objective: string;
}

function AgentCard({
  agent,
  isSelected,
  onClick,
}: {
  agent: LiveAgent;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="nova-card nova-card-hover group relative w-full overflow-hidden text-left transition-all duration-200"
      style={{
        borderColor: isSelected ? `${agent.color}50` : undefined,
        boxShadow: isSelected
          ? `0 0 0 1px ${agent.color}40, 0 4px 24px rgba(0,0,0,0.5), 0 0 30px ${agent.color}18`
          : agent.status === "active"
            ? `0 0 0 1px ${agent.color}28, 0 4px 16px rgba(0,0,0,0.4), 0 0 16px ${agent.color}10`
            : undefined,
        background: isSelected
          ? `color-mix(in oklab, ${agent.color} 5%, var(--surface))`
          : undefined,
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${agent.color}${agent.status === "active" ? "70" : "35"}, transparent)`,
        }}
      />
      {/* Aerospace corner brackets */}
      <div
        className="absolute top-0 left-0 w-3 h-3 pointer-events-none"
        style={{
          borderTop: `1px solid ${agent.color}40`,
          borderLeft: `1px solid ${agent.color}40`,
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-3 h-3 pointer-events-none"
        style={{
          borderBottom: `1px solid ${agent.color}28`,
          borderRight: `1px solid ${agent.color}28`,
        }}
      />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
              style={{
                background: `${agent.color}14`,
                border: `1px solid ${agent.color}28`,
                boxShadow: agent.status === "active" ? `0 0 12px ${agent.color}25` : "none",
              }}
            >
              <agent.Icon className="h-4 w-4" style={{ color: agent.color }} />
            </div>
            <div>
              <div
                className="font-display font-bold leading-tight"
                style={{ fontSize: "12.5px", color: "var(--foreground)" }}
              >
                {agent.role}
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: "9px",
                  color: agent.color,
                  letterSpacing: "0.1em",
                  opacity: 0.8,
                }}
              >
                {agent.codename} · ORBIT {agent.orbit}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <StatusBadge status={agent.status} />
            <ConfRing value={agent.confidence} color={agent.color} />
          </div>
        </div>

        <div
          className="text-[11.5px] leading-snug mb-3 line-clamp-2"
          style={{ color: "rgba(240,244,255,0.5)" }}
        >
          {agent.objective}
        </div>

        <div
          className="rounded-lg px-3 py-2 mb-3"
          style={{ background: `${agent.color}08`, border: `1px solid ${agent.color}18` }}
        >
          <div
            className="font-mono mb-0.5"
            style={{ fontSize: "8.5px", color: agent.color, letterSpacing: "0.1em", opacity: 0.7 }}
          >
            LAST SIGNAL
          </div>
          <div
            className="text-[11px] leading-snug line-clamp-2"
            style={{ color: "rgba(240,244,255,0.75)" }}
          >
            {agent.lastRec}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-1.5 text-[10.5px] truncate"
            style={{ color: "rgba(240,244,255,0.4)" }}
          >
            <ArrowRight className="h-3 w-3 shrink-0" style={{ color: agent.color }} />
            <span className="truncate">{agent.nextMove}</span>
          </div>
          <ChevronRight
            className="h-3.5 w-3.5 shrink-0 ml-2 transition-transform group-hover:translate-x-0.5"
            style={{ color: agent.color, opacity: 0.5 }}
          />
        </div>
      </div>
    </button>
  );
}

/* ─────────────────────────── MISSION BRIEF PANEL ───────────────────── */
function MissionBriefPanel({
  agent,
  orgId,
  userId,
  accessToken,
  onClose,
}: {
  agent: LiveAgent;
  orgId: string;
  userId: string;
  accessToken?: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<Set<number>>(new Set());
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load persisted chat session
  const sessionQ = useQuery({
    ...mentorSessionQuery(orgId, agent.id),
    enabled: !!orgId,
  });
  const messages: MentorMessage[] = (sessionQ.data?.messages ?? []) as MentorMessage[];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleDone = (i: number) =>
    setDone((p) => {
      const n = new Set(p);
      if (n.has(i)) {
        n.delete(i);
      } else {
        n.add(i);
      }
      return n;
    });

  const sendChat = async () => {
    if (!input.trim() || sending) return;
    const userMsg: MentorMessage = {
      role: "user",
      text: input.trim(),
      ts: new Date().toISOString(),
    };
    setSending(true);
    setInput("");

    // Optimistic update
    await saveMentorMessage(orgId, userId, agent.id, [userMsg]);
    qc.invalidateQueries({ queryKey: ["mentor_session", orgId, agent.id] });

    try {
      const result = await runMentorAgent(
        userId,
        {
          agent_id: agent.id,
          message: userMsg.text,
          org_id: orgId,
          business_context: `Agent role: ${agent.role}. Current objective: ${agent.objective}. Last recommendation: ${agent.lastRec}.`,
        },
        accessToken,
      );

      const agentMsg: MentorMessage = {
        role: "agent",
        text:
          result.success && result.response
            ? result.response
            : (result.error ?? "Unable to respond right now. Try again."),
        ts: new Date().toISOString(),
      };
      await saveMentorMessage(orgId, userId, agent.id, [agentMsg]);
      qc.invalidateQueries({ queryKey: ["mentor_session", orgId, agent.id] });
    } catch {
      toast.error("Agent unreachable. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const priorityColor: Record<string, string> = { critical: C.red, high: C.amber, medium: C.blue };

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(8,8,16,0.65)", backdropFilter: "blur(3px)" }}
        onClick={onClose}
      />
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col overflow-hidden slide-in-right"
        style={{
          width: "min(480px, 100vw)",
          background: "var(--surface)",
          borderLeft: `1px solid ${agent.color}30`,
          boxShadow: `-8px 0 48px rgba(0,0,0,0.65), 0 0 0 1px ${agent.color}15`,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-4 shrink-0"
          style={{ borderBottom: `1px solid ${agent.color}18` }}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: `${agent.color}14`,
              border: `1px solid ${agent.color}28`,
              boxShadow: `0 0 14px ${agent.color}22`,
            }}
          >
            <agent.Icon className="h-4 w-4" style={{ color: agent.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="font-display font-bold"
              style={{ fontSize: "13.5px", color: "var(--foreground)" }}
            >
              {agent.role}
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={agent.status} />
              <span
                className="font-mono"
                style={{
                  fontSize: "9px",
                  color: agent.color,
                  letterSpacing: "0.08em",
                  opacity: 0.7,
                }}
              >
                CONFIDENCE {agent.confidence}%
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
            style={{ color: "rgba(240,244,255,0.3)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "rgba(240,244,255,0.3)";
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div
          className="h-px shrink-0"
          style={{
            background: `linear-gradient(90deg, ${agent.color}, ${agent.color}00)`,
            opacity: 0.6,
          }}
        />

        <div className="flex-1 overflow-y-auto">
          {/* Active mission */}
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${agent.color}10` }}>
            <div
              className="font-mono mb-1"
              style={{
                fontSize: "8.5px",
                color: agent.color,
                letterSpacing: "0.14em",
                opacity: 0.7,
              }}
            >
              ACTIVE MISSION
            </div>
            <div
              className="font-display font-bold text-[14px]"
              style={{ color: "var(--foreground)" }}
            >
              {agent.objective}
            </div>
          </div>

          {/* Execution sequence */}
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${agent.color}10` }}>
            <div className="flex items-center justify-between mb-3">
              <span
                className="font-mono"
                style={{
                  fontSize: "8.5px",
                  color: agent.color,
                  letterSpacing: "0.14em",
                  opacity: 0.7,
                }}
              >
                EXECUTION SEQUENCE
              </span>
              <span className="font-mono text-[9px]" style={{ color: "rgba(240,244,255,0.3)" }}>
                {done.size}/{agent.brief.length} COMPLETE
              </span>
            </div>
            <div className="space-y-2">
              {agent.brief.map((step, i) => (
                <div
                  key={i}
                  onClick={() => toggleDone(i)}
                  className="cursor-pointer rounded-xl overflow-hidden transition-all duration-200"
                  style={{
                    background: done.has(i) ? "rgba(16,185,129,0.06)" : `${agent.color}06`,
                    border: done.has(i)
                      ? "1px solid rgba(16,185,129,0.2)"
                      : `1px solid ${agent.color}18`,
                    opacity: done.has(i) ? 0.6 : 1,
                  }}
                >
                  <div className="flex items-start gap-3 p-3">
                    <div className="mt-0.5 shrink-0">
                      {done.has(i) ? (
                        <CheckCircle2 className="h-4 w-4" style={{ color: C.green }} />
                      ) : (
                        <Circle
                          className="h-4 w-4"
                          style={{ color: `${priorityColor[step.priority]}80` }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={cn(
                            "font-semibold text-[12.5px]",
                            done.has(i) && "line-through opacity-50",
                          )}
                          style={{ color: "var(--foreground)" }}
                        >
                          {step.title}
                        </span>
                        <span
                          className="rounded-full px-1.5 py-0.5 font-mono"
                          style={{
                            fontSize: "8px",
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            color: priorityColor[step.priority],
                            background: `${priorityColor[step.priority]}14`,
                          }}
                        >
                          {step.priority.toUpperCase()}
                        </span>
                        <span
                          className="flex items-center gap-1 text-[10px]"
                          style={{ color: "rgba(240,244,255,0.3)" }}
                        >
                          <Clock className="h-2.5 w-2.5" />
                          {step.time}
                        </span>
                      </div>
                      <p
                        className="text-[11.5px] leading-relaxed mb-2"
                        style={{ color: "rgba(240,244,255,0.5)" }}
                      >
                        {step.detail}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <div
                          className="flex items-center gap-1.5 text-[10.5px] font-medium"
                          style={{ color: agent.color }}
                        >
                          <ArrowRight className="h-3 w-3" />
                          {step.action}
                        </div>
                        {step.toolLink && (
                          <Link
                            to={step.toolLink}
                            onClick={(e) => e.stopPropagation()}
                            className="ml-auto rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors"
                            style={{
                              background: `${agent.color}14`,
                              color: agent.color,
                              border: `1px solid ${agent.color}25`,
                            }}
                          >
                            Open →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat history */}
          {messages.length > 0 && (
            <div
              className="px-5 py-4 space-y-3"
              style={{ borderBottom: `1px solid ${agent.color}10` }}
            >
              <div
                className="font-mono"
                style={{
                  fontSize: "8.5px",
                  color: agent.color,
                  letterSpacing: "0.12em",
                  opacity: 0.6,
                }}
              >
                CONVERSATION LOG
              </div>
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className="max-w-[85%] rounded-xl px-3 py-2 text-[12px] leading-relaxed"
                    style={
                      m.role === "user"
                        ? {
                            background: `${agent.color}18`,
                            border: `1px solid ${agent.color}28`,
                            color: "var(--foreground)",
                          }
                        : {
                            background: "var(--surface-2)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            color: "rgba(240,244,255,0.8)",
                          }
                    }
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div
                    className="flex items-center gap-2 rounded-xl px-3 py-2"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <Loader2 className="h-3 w-3 animate-spin" style={{ color: agent.color }} />
                    <span className="text-[11px]" style={{ color: "rgba(240,244,255,0.4)" }}>
                      {agent.codename} thinking…
                    </span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Chat input */}
        <div className="shrink-0 p-4" style={{ borderTop: `1px solid ${agent.color}18` }}>
          <div
            className="font-mono mb-2"
            style={{ fontSize: "8.5px", color: agent.color, letterSpacing: "0.12em", opacity: 0.6 }}
          >
            ASK {agent.codename}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
              placeholder={`Ask ${agent.role.toLowerCase()} anything…`}
              className="terminal-input flex-1 px-3 py-2 text-[12.5px]"
              disabled={sending}
            />
            <button
              onClick={sendChat}
              disabled={!input.trim() || sending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-150 disabled:opacity-30"
              style={{
                background: `${agent.color}18`,
                border: `1px solid ${agent.color}28`,
                color: agent.color,
              }}
              onMouseEnter={(e) => {
                if (input.trim()) {
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 12px ${agent.color}30`;
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              {sending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────── COMMAND CENTER ─────────────────────────── */
function CommandCenter({
  agents,
  userId,
  orgId,
  accessToken,
  onClose,
}: {
  agents: LiveAgent[];
  userId: string;
  orgId: string;
  accessToken?: string;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [responses, setResponses] = useState<
    Array<{ agent: LiveAgent; text: string; loading: boolean }>
  >([]);
  const [sent, setSent] = useState(false);

  const activeAgents = agents.filter((a) => a.status === "active" || a.status === "analyzing");

  const STARTERS = [
    "I'm struggling to convert qualified leads — what should each agent focus on?",
    "We have budget to hire one person. Which role should we prioritize?",
    "I want to hit $10k MRR by month end. What's the combined action plan?",
    "CAC is rising. What's the cross-functional fix?",
  ];

  const handleSubmit = async () => {
    if (!query.trim()) return;
    setSent(true);
    const initial = activeAgents.map((a) => ({ agent: a, text: "", loading: true }));
    setResponses(initial);

    // Fire all agents in parallel
    await Promise.all(
      activeAgents.map(async (a, i) => {
        try {
          const res = await runMentorAgent(
            userId,
            {
              agent_id: a.id,
              message: query,
              org_id: orgId,
              business_context: `Role: ${a.role}. Objective: ${a.objective}.`,
            },
            accessToken,
          );
          setResponses((prev) => {
            const next = [...prev];
            next[i] = {
              agent: a,
              text: res.success && res.response ? res.response : (res.error ?? "No response"),
              loading: false,
            };
            return next;
          });
        } catch {
          setResponses((prev) => {
            const next = [...prev];
            next[i] = { agent: a, text: "Agent unreachable.", loading: false };
            return next;
          });
        }
      }),
    );
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(8,8,16,0.85)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
      />
      <div
        className="animate-scale-in fixed inset-x-4 inset-y-6 z-50 mx-auto flex flex-col overflow-hidden rounded-2xl sm:inset-x-8 sm:inset-y-8"
        style={{
          maxWidth: "840px",
          background: "var(--surface)",
          border: "1px solid rgba(59,130,246,0.25)",
          boxShadow: "0 0 0 1px rgba(59,130,246,0.1), 0 32px 80px rgba(0,0,0,0.8)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-6 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(59,130,246,0.12)" }}
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}
          >
            <Command className="h-4 w-4" style={{ color: C.blue }} />
          </div>
          <div>
            <div
              className="font-display font-bold text-[14px]"
              style={{ color: "var(--foreground)" }}
            >
              Command Center
            </div>
            <div className="text-[11px]" style={{ color: "rgba(240,244,255,0.4)" }}>
              {activeAgents.length} agents online · Multi-agent collaborative analysis
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ color: "rgba(240,244,255,0.3)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Agent pills */}
        <div
          className="flex gap-2 px-6 py-3 overflow-x-auto shrink-0"
          style={{ borderBottom: "1px solid rgba(59,130,246,0.08)" }}
        >
          {activeAgents.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 shrink-0"
              style={{ background: `${a.color}10`, border: `1px solid ${a.color}25` }}
            >
              <a.Icon className="h-3 w-3" style={{ color: a.color }} />
              <span className="text-[11px] font-medium" style={{ color: "rgba(240,244,255,0.8)" }}>
                {a.role}
              </span>
              <span
                className="h-1.5 w-1.5 rounded-full nova-live-dot"
                style={{ background: a.color }}
              />
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!sent ? (
            <div>
              <div
                className="font-mono mb-4"
                style={{ fontSize: "9px", color: "rgba(59,130,246,0.7)", letterSpacing: "0.14em" }}
              >
                MULTI-AGENT ANALYSIS REQUEST
              </div>
              <div className="space-y-2.5">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="w-full text-left rounded-xl px-4 py-3 text-[12.5px] transition-all duration-150"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid rgba(59,130,246,0.1)",
                      color: "rgba(240,244,255,0.65)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.3)";
                      (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.1)";
                      (e.currentTarget as HTMLElement).style.color = "rgba(240,244,255,0.65)";
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div
                className="rounded-xl px-4 py-3 text-[13px]"
                style={{
                  background: "rgba(59,130,246,0.08)",
                  border: "1px solid rgba(59,130,246,0.2)",
                  color: "var(--foreground)",
                }}
              >
                {query}
              </div>
              {responses.map((r, i) => (
                <div
                  key={r.agent.id}
                  className="rounded-xl p-4"
                  style={{
                    background: `${r.agent.color}06`,
                    border: `1px solid ${r.agent.color}18`,
                    animation: `riseIn 0.4s ease both`,
                    animationDelay: `${i * 80}ms`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <r.agent.Icon className="h-3.5 w-3.5" style={{ color: r.agent.color }} />
                    <span
                      className="font-mono"
                      style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        color: r.agent.color,
                        letterSpacing: "0.1em",
                      }}
                    >
                      {r.agent.codename} · {r.agent.role.toUpperCase()}
                    </span>
                    {r.loading && (
                      <Loader2
                        className="h-3 w-3 animate-spin ml-auto"
                        style={{ color: r.agent.color }}
                      />
                    )}
                  </div>
                  {r.loading ? (
                    <div className="skeleton h-12 w-full rounded-lg" />
                  ) : (
                    <p
                      className="text-[12.5px] leading-relaxed"
                      style={{ color: "rgba(240,244,255,0.75)" }}
                    >
                      {r.text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="shrink-0 p-4" style={{ borderTop: "1px solid rgba(59,130,246,0.1)" }}>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Describe your business challenge — all agents will respond…"
              className="terminal-input flex-1 px-3 py-2.5 text-[12.5px]"
              autoFocus
            />
            <button
              onClick={handleSubmit}
              disabled={!query.trim() || sent}
              className="btn-execute rounded-xl px-5 py-2.5 text-[12px] font-bold transition-all disabled:opacity-30 flex items-center gap-2"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────── MAIN PAGE ──────────────────────────────── */
function MentorPage() {
  const { currentOrgId, user, profile } = useAuth();
  const qc = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState<LiveAgent | null>(null);
  const [showCC, setShowCC] = useState(false);
  const [insightFilter, setInsightFilter] = useState<"all" | "high" | "warning">("all");
  const [accessToken, setAccessToken] = useState<string | undefined>();

  // Fetch Supabase access token for n8n proxy auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAccessToken(data.session?.access_token);
    });
  }, []);

  // ── Real data queries ──────────────────────────────────────────────
  const kpiQ = useQuery({ ...mentorKPIsQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const insightsQ = useQuery({
    ...mentorInsightsQuery(currentOrgId ?? ""),
    enabled: !!currentOrgId,
  });
  const leadsQ = useQuery({ ...leadsQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const runsQ = useQuery({ ...toolRunsQuery(currentOrgId ?? "", 100), enabled: !!currentOrgId });

  const kpis = kpiQ.data;
  const dbInsights: MentorInsight[] = insightsQ.data ?? [];
  const leads = leadsQ.data ?? [];
  const runs = runsQ.data ?? [];

  // ── Derive pipeline distribution from real leads ───────────────────
  const pipelineStages = [
    { label: "Signal", count: leads.length, color: C.blue, active: false },
    {
      label: "Qualified",
      count: leads.filter((l) => ["Qualified", "Proposal"].includes(l.stage as string)).length,
      color: C.cyan,
      active: false,
    },
    {
      label: "Proposal",
      count: leads.filter((l) => l.stage === "Proposal").length,
      color: C.violet,
      active: true,
    },
    {
      label: "Negotiation",
      count: leads.filter((l) => l.stage === "Negotiation").length,
      color: C.amber,
      active: false,
    },
    {
      label: "Won",
      count: leads.filter((l) => l.stage === "Won").length,
      color: C.green,
      active: false,
    },
  ];

  // ── Build live KPI cards ───────────────────────────────────────────
  const KPI_CARDS = [
    {
      label: "Revenue Signal",
      value: kpis ? `$${kpis.mrr.toLocaleString()}` : "—",
      change: kpis && kpis.wonLeads > 0 ? `+${kpis.wonLeads} won` : "0 won",
      positive: (kpis?.wonLeads ?? 0) > 0,
      sub: `${kpis?.totalLeads ?? 0} leads · Target: $10k MRR`,
      sparkline: [0, 0.3, 0.5, 0.4, 0.7, 0.85, 1].map((f) => (kpis?.mrr ?? 0) * f + 100),
      color: C.blue,
    },
    {
      label: "Pipeline Value",
      value: kpis ? `$${kpis.pipelineValue.toLocaleString()}` : "—",
      change: leads.length > 0 ? `${leads.length} deals` : "no deals",
      positive: leads.length > 0,
      sub: `${pipelineStages[1].count} qualified · ${pipelineStages[4].count} won`,
      sparkline: [0, 0.2, 0.45, 0.38, 0.6, 0.8, 1].map((f) => (kpis?.pipelineValue ?? 0) * f + 500),
      color: C.green,
    },
    {
      label: "Execution Index",
      value: kpis ? `${kpis.execIndex}/100` : "—",
      change: kpis && kpis.execIndex >= 60 ? "On track" : "Below target",
      positive: (kpis?.execIndex ?? 0) >= 60,
      sub: `${kpis?.completedRuns ?? 0} runs · ${kpis?.activeAutomations ?? 0} automations`,
      sparkline: [30, 35, 42, 40, 52, 62, kpis?.execIndex ?? 50],
      color: C.violet,
    },
    {
      label: "LTV:CAC Ratio",
      value: kpis ? `${kpis.cacRatio}×` : "—",
      change: (kpis?.cacRatio ?? 0) >= 3 ? "Healthy" : "Below 3×",
      positive: (kpis?.cacRatio ?? 0) >= 3,
      sub: "Target: 3× · " + ((kpis?.cacRatio ?? 0) < 3 ? "Watch" : "Good"),
      sparkline: [1.2, 1.5, 1.8, 2.0, 2.1, 2.2, kpis?.cacRatio ?? 1.5],
      color: C.amber,
    },
  ];

  // ── Compute agent live state from real data ───────────────────────
  const liveAgents: LiveAgent[] = AGENT_DEFS.map((def) => {
    let status: AgentStatus = "standby";
    let confidence = 65;
    let lastRec = "Analyzing your business data…";
    let nextMove = "Review current objectives";
    let objective = def.brief[0]?.title ?? "Awaiting business context";

    if (!kpis) return { ...def, status, confidence, lastRec, nextMove, objective };

    switch (def.id) {
      case "growth":
        status = runs.length > 0 ? "active" : "analyzing";
        confidence = Math.min(
          95,
          60 + Math.min(runs.filter((r) => r.status === "succeeded").length * 2, 30),
        );
        lastRec =
          leads.length > 5
            ? `${leads.length} leads in pipeline — optimize top-of-funnel for MRR growth`
            : "Start capturing leads — pipeline is empty";
        nextMove =
          runs.length === 0
            ? "Run Idea Validator or GTM Strategy"
            : "Scale best-performing channel";
        objective = `Scale MRR from $${kpis.mrr.toLocaleString()} → $10k in 60 days`;
        break;
      case "offer":
        status = runs.some((r) => r.tool_key === "generate-offer" && r.status === "succeeded")
          ? "active"
          : "analyzing";
        confidence = runs.some((r) => r.tool_key === "generate-offer") ? 78 : 60;
        lastRec = runs.some((r) => r.tool_key === "generate-offer")
          ? "Offer generated — test outcome-framed copy for 20-40% CVR improvement"
          : "No offer built yet — run Offer Builder to establish value proposition";
        nextMove = "Generate 3 pricing tier variants with outcome framing";
        objective = "Sharpen value proposition for SMB segment";
        break;
      case "sales":
        status = leads.some((l) => ["Qualified", "Proposal"].includes(l.stage as string))
          ? "active"
          : "standby";
        confidence = Math.min(95, 60 + kpis.wonLeads * 5 + pipelineStages[1].count * 3);
        lastRec =
          pipelineStages[2].count > 0
            ? `${pipelineStages[2].count} proposals out — follow up within 24h to avoid going cold`
            : leads.length > 0
              ? "Qualify your leads and move them to Proposal stage"
              : "Capture first leads to activate sales pipeline";
        nextMove =
          pipelineStages[2].count > 0
            ? "Send follow-ups to proposal-stage leads"
            : "Add leads to CRM";
        objective = `Close ${Math.max(1, pipelineStages[1].count)} deals from ${leads.length}-lead pipeline`;
        break;
      case "content":
        status = runs.some((r) => r.tool_key === "blog" && r.status === "succeeded")
          ? "active"
          : "standby";
        confidence = 64;
        lastRec = "Founder story posts outperform product posts 3:1 on your audience profile";
        nextMove = "Draft 5-post LinkedIn narrative series starting with origin story";
        objective = "Build inbound engine — 500 organic leads/month by Q2";
        break;
      case "automation":
        status = kpis.activeAutomations > 0 ? "active" : "analyzing";
        confidence = Math.min(95, 60 + kpis.activeAutomations * 10);
        lastRec =
          kpis.activeAutomations > 0
            ? `${kpis.activeAutomations} automation(s) active — consider adding lead scoring webhook`
            : "No automations active — deploy lead scoring to save 3h+/week";
        nextMove = "Deploy lead scoring trigger + Slack hot-lead notifications";
        objective = `Eliminate ${Math.max(6, 12 - kpis.activeAutomations * 2)}h/week of manual follow-up`;
        break;
      case "finance":
        status = kpis.mrr > 0 ? "active" : "analyzing";
        confidence = kpis.cacRatio >= 2 ? 79 : 55;
        lastRec =
          kpis.cacRatio < 3
            ? `LTV:CAC at ${kpis.cacRatio}× — target is 3× (improve close rate to extend runway)`
            : `LTV:CAC healthy at ${kpis.cacRatio}× — model aggressive growth scenarios`;
        nextMove = "Run 3 revenue scenarios: conservative / base / aggressive";
        objective = `Model path to $25k MRR with 18-month runway`;
        break;
    }
    return { ...def, status, confidence, lastRec, nextMove, objective };
  });

  const activeCount = liveAgents.filter((a) => a.status === "active").length;
  const avgConf = Math.round(liveAgents.reduce((s, a) => s + a.confidence, 0) / liveAgents.length);

  // ── Merge DB insights with derived insights ───────────────────────
  const derivedInsights = [
    pipelineStages[2].count > 0 && {
      id: "d1",
      agent: "Sales Operator",
      color: C.green,
      type: "signal" as const,
      title: `${pipelineStages[2].count} proposal${pipelineStages[2].count > 1 ? "s" : ""} awaiting follow-up`,
      detail: "High-value leads lose interest after 48h without contact. Act now.",
      ago: "live",
      priority: "high" as const,
      read: false,
      org_id: currentOrgId ?? "",
      agent_id: "sales",
      n8n_run_id: null,
      created_at: "",
    },
    (kpis?.cacRatio ?? 0) < 3 &&
      kpis?.cacRatio !== 0 && {
        id: "d2",
        agent: "Finance Navigator",
        color: C.amber,
        type: "warning" as const,
        title: `LTV:CAC at ${kpis?.cacRatio}× — below 3× target`,
        detail: "Improving close rate by 6pp would bring ratio to 3×+ and extend runway 4 months.",
        ago: "live",
        priority: "medium" as const,
        read: false,
        org_id: currentOrgId ?? "",
        agent_id: "finance",
        n8n_run_id: null,
        created_at: "",
      },
    kpis &&
      kpis.activeAutomations === 0 && {
        id: "d3",
        agent: "Automation Engineer",
        color: C.cyan,
        type: "recommendation" as const,
        title: "Lead scoring automation ready to deploy",
        detail: "3h+/week saved on manual pipeline monitoring. Configure in Nova OS Workflows.",
        ago: "live",
        priority: "medium" as const,
        read: false,
        org_id: currentOrgId ?? "",
        agent_id: "automation",
        n8n_run_id: null,
        created_at: "",
      },
  ].filter(Boolean) as MentorInsight[];

  const allInsights: MentorInsight[] = [...dbInsights, ...derivedInsights].slice(0, 8);

  const filteredInsights = allInsights.filter((ins) => {
    if (insightFilter === "all") return true;
    if (insightFilter === "high") return ins.priority === "high";
    if (insightFilter === "warning") return ins.type === "warning" || ins.type === "signal";
    return true;
  });

  // Mark insights read on open
  useEffect(() => {
    if (currentOrgId && dbInsights.some((i) => !i.read)) {
      markInsightsRead(currentOrgId).catch(() => {});
    }
  }, [currentOrgId, dbInsights]);

  // ── Loading state ──────────────────────────────────────────────────
  if (!currentOrgId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-center">
        <div>
          <div
            className="font-mono text-[10px] mb-2"
            style={{ color: "rgba(59,130,246,0.6)", letterSpacing: "0.2em" }}
          >
            MISSION CONTROL
          </div>
          <p className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>
            Complete onboarding to activate your agent fleet.
          </p>
          <Link to="/onboarding">
            <button className="btn-execute mt-4 rounded-xl px-5 py-2 text-[13px] font-bold">
              Start Onboarding
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-full space-y-5 pb-24">
      {/* ── MISSION STATUS HERO ──────────────────────────────────── */}
      <section
        className="rise-in relative overflow-hidden rounded-2xl"
        style={{
          ["--i" as string]: 0,
          minHeight: 180,
          background: "var(--surface)",
          border: "1px solid rgba(59,130,246,0.14)",
          boxShadow:
            "0 0 0 1px rgba(59,130,246,0.06), 0 1px 3px rgba(0,0,0,0.6), 0 8px 40px rgba(0,0,0,0.45)",
        }}
      >
        <OrbitalCanvas />
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background:
              "linear-gradient(135deg, rgba(8,8,16,0.88) 0%, rgba(13,13,30,0.72) 55%, rgba(8,8,16,0.82) 100%)",
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-px z-[2]"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(59,130,246,0.5), rgba(139,92,246,0.35), transparent)",
          }}
        />
        <div className="absolute inset-0 z-[1] nova-grid-bg opacity-25" />

        <div className="relative z-[3] flex flex-col gap-4 p-5 md:flex-row md:items-center md:p-7">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <span
                className="font-mono"
                style={{
                  fontSize: "9.5px",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  color: "rgba(59,130,246,0.8)",
                }}
              >
                MISSION CONTROL · {profile?.full_name?.split(" ")[0]?.toUpperCase() ?? "COMMANDER"}
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
                style={{
                  background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.25)",
                  color: C.green,
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current nova-live-dot" />
                {activeCount} AGENTS ACTIVE
              </span>
            </div>
            <h1
              className="font-display font-black leading-none mb-2"
              style={{
                fontSize: "clamp(1.5rem, 2.5vw + 0.5rem, 2.2rem)",
                letterSpacing: "-0.04em",
                background:
                  "linear-gradient(125deg, #ffffff 0%, rgba(255,255,255,0.82) 45%, #60a5fa 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Business Mission Control
            </h1>
            <p style={{ fontSize: "13px", color: "rgba(240,244,255,0.5)", lineHeight: 1.6 }}>
              {liveAgents.length} AI mentors monitoring your business. {allInsights.length} signals
              loaded.
            </p>
          </div>

          <div className="flex gap-3 md:flex-col md:items-end md:gap-3">
            <div className="flex gap-3 flex-wrap">
              {[
                { label: "FLEET", value: `${activeCount}/${liveAgents.length}`, color: C.green },
                { label: "CONFIDENCE", value: `${avgConf}%`, color: C.blue },
                { label: "SIGNALS", value: `${allInsights.length}`, color: C.violet },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="rounded-xl px-3 py-2 text-center"
                  style={{ background: `${color}08`, border: `1px solid ${color}20`, minWidth: 72 }}
                >
                  <div
                    className="font-mono"
                    style={{ fontSize: "8px", color: `${color}aa`, letterSpacing: "0.1em" }}
                  >
                    {label}
                  </div>
                  <div
                    className="font-mono font-black tabular-nums telem-flicker mt-0.5"
                    style={{ fontSize: "16px", color, letterSpacing: "-0.02em" }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowCC(true)}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-bold text-white transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                boxShadow: "0 4px 16px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 8px 24px rgba(59,130,246,0.5), inset 0 1px 0 rgba(255,255,255,0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "none";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 4px 16px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.15)";
              }}
            >
              <Command className="h-3.5 w-3.5" /> Command Center
            </button>
          </div>
        </div>
      </section>

      {/* ── KPI ROW ─────────────────────────────────────────────── */}
      <section
        className="rise-in grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        style={{ ["--i" as string]: 1 }}
      >
        {KPI_CARDS.map((kpi) => (
          <div key={kpi.label} className="nova-card nova-card-hover relative overflow-hidden">
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, ${kpi.color}60, transparent)` }}
            />
            <div className="p-4">
              <div
                className="font-mono mb-2"
                style={{
                  fontSize: "8.5px",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  color: "rgba(240,244,255,0.4)",
                }}
              >
                {kpi.label.toUpperCase()}
              </div>
              <div className="flex items-end justify-between mb-1">
                <div
                  className="font-display font-black tabular-nums leading-none"
                  style={{
                    fontSize: "1.5rem",
                    color: "var(--foreground)",
                    letterSpacing: "-0.04em",
                  }}
                >
                  {kpiQ.isLoading ? (
                    <span className="skeleton inline-block w-20 h-7 rounded" />
                  ) : (
                    kpi.value
                  )}
                </div>
                <Sparkline data={kpi.sparkline} color={kpi.color} />
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold"
                  style={{
                    background: kpi.positive ? "rgba(16,185,129,0.12)" : "rgba(248,113,113,0.12)",
                    color: kpi.positive ? C.green : C.red,
                  }}
                >
                  {kpi.change}
                </span>
                <span style={{ fontSize: "10.5px", color: "rgba(240,244,255,0.35)" }}>
                  {kpi.sub}
                </span>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── AGENT FLEET ─────────────────────────────────────────── */}
      <section className="rise-in" style={{ ["--i" as string]: 2 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="font-mono"
              style={{
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.18em",
                color: "rgba(59,130,246,0.7)",
              }}
            >
              AGENT FLEET
            </div>
            <div className="h-px w-8" style={{ background: "rgba(59,130,246,0.2)" }} />
            <span style={{ fontSize: "11px", color: "rgba(240,244,255,0.3)" }}>
              {activeCount} active · click agent for mission brief
            </span>
          </div>
          <div className="flex items-center gap-2">
            {(["active", "analyzing", "standby"] as const).map((s) => {
              const cnt = liveAgents.filter((a) => a.status === s).length;
              const clr =
                s === "active" ? C.green : s === "analyzing" ? C.blue : "rgba(240,244,255,0.2)";
              return (
                <span
                  key={s}
                  className="font-mono rounded-full px-2 py-0.5"
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: clr,
                    background: `${clr}12`,
                    border: `1px solid ${clr}25`,
                  }}
                >
                  {cnt} {s}
                </span>
              );
            })}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {liveAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isSelected={selectedAgent?.id === agent.id}
              onClick={() => setSelectedAgent((p) => (p?.id === agent.id ? null : agent))}
            />
          ))}
        </div>
      </section>

      {/* ── PIPELINE + INSIGHTS ─────────────────────────────────── */}
      <section className="rise-in grid gap-4 lg:grid-cols-12" style={{ ["--i" as string]: 3 }}>
        {/* Execution pipeline */}
        <div
          className="lg:col-span-7 overflow-hidden rounded-2xl"
          style={{ background: "var(--surface)", border: "1px solid rgba(59,130,246,0.1)" }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid rgba(59,130,246,0.08)" }}
          >
            <div>
              <div
                className="font-mono mb-0.5"
                style={{
                  fontSize: "8.5px",
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  color: "rgba(59,130,246,0.6)",
                }}
              >
                EXECUTION PIPELINE
              </div>
              <div
                className="font-display font-bold text-[13.5px]"
                style={{ color: "var(--foreground)" }}
              >
                Sales Trajectory
              </div>
            </div>
            <Link
              to="/app/nova/crm"
              className="inline-flex items-center gap-1 text-[11px] transition-colors"
              style={{ color: "rgba(59,130,246,0.7)" }}
            >
              Open CRM <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-5">
            <div className="flex items-stretch gap-1.5 mb-4">
              {pipelineStages.map((stage, i) => {
                const width = Math.max(
                  40,
                  stage.count > 0 ? Math.min(200, 40 + stage.count * 8) : 40,
                );
                return (
                  <div key={stage.label} className="flex flex-col" style={{ minWidth: width }}>
                    <div
                      className="rounded-lg relative overflow-hidden flex-1"
                      style={{
                        minHeight: 48,
                        padding: "8px",
                        background: stage.active ? `${stage.color}14` : `${stage.color}07`,
                        border: `1px solid ${stage.color}${stage.active ? "40" : "18"}`,
                        boxShadow: stage.active ? `0 0 10px ${stage.color}18` : "none",
                      }}
                    >
                      {stage.active && (
                        <div
                          className="absolute top-0 left-0 right-0 h-px"
                          style={{ background: stage.color, opacity: 0.6 }}
                        />
                      )}
                      <div
                        className="font-mono font-black tabular-nums"
                        style={{ fontSize: "14px", color: stage.color, letterSpacing: "-0.02em" }}
                      >
                        {stage.count}
                      </div>
                    </div>
                    <div
                      className="mt-1 font-mono text-center"
                      style={{
                        fontSize: "7.5px",
                        color: stage.active ? stage.color : "rgba(240,244,255,0.3)",
                        letterSpacing: "0.04em",
                        lineHeight: 1.3,
                      }}
                    >
                      {stage.label}
                    </div>
                  </div>
                );
              })}
            </div>
            {pipelineStages[2].count > 0 ? (
              <div
                className="rounded-xl px-4 py-3 flex items-center gap-3"
                style={{
                  background: "rgba(139,92,246,0.06)",
                  border: "1px solid rgba(139,92,246,0.15)",
                }}
              >
                <Radio className="h-4 w-4 shrink-0" style={{ color: C.violet }} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[12px]" style={{ color: "var(--foreground)" }}>
                    {pipelineStages[2].count} proposal{pipelineStages[2].count > 1 ? "s" : ""} live
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: "rgba(240,244,255,0.4)" }}>
                    Sales Operator recommends same-day follow-up to avoid cold leads
                  </div>
                </div>
                <Link to="/app/nova/crm">
                  <button
                    className="shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold"
                    style={{
                      background: "rgba(139,92,246,0.12)",
                      border: "1px solid rgba(139,92,246,0.25)",
                      color: C.violet,
                    }}
                  >
                    Act Now
                  </button>
                </Link>
              </div>
            ) : (
              <div
                className="rounded-xl px-4 py-3 text-center"
                style={{
                  background: "rgba(59,130,246,0.04)",
                  border: "1px solid rgba(59,130,246,0.1)",
                }}
              >
                <p className="text-[12px]" style={{ color: "rgba(240,244,255,0.4)" }}>
                  Pipeline empty — capture leads to activate Sales Operator
                </p>
                <Link to="/app/nova/leads">
                  <button
                    className="mt-2 rounded-lg px-3 py-1.5 text-[11px] font-semibold"
                    style={{
                      background: "rgba(59,130,246,0.1)",
                      border: "1px solid rgba(59,130,246,0.2)",
                      color: C.blue,
                    }}
                  >
                    Add Leads
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Signal feed */}
        <div
          className="lg:col-span-5 overflow-hidden rounded-2xl flex flex-col"
          style={{ background: "var(--surface)", border: "1px solid rgba(59,130,246,0.1)" }}
        >
          <div
            className="flex items-center justify-between px-5 py-4 shrink-0"
            style={{ borderBottom: "1px solid rgba(59,130,246,0.08)" }}
          >
            <div>
              <div
                className="font-mono mb-0.5"
                style={{
                  fontSize: "8.5px",
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  color: "rgba(59,130,246,0.6)",
                }}
              >
                SIGNAL FEED
              </div>
              <div
                className="font-display font-bold text-[13.5px]"
                style={{ color: "var(--foreground)" }}
              >
                Strategic Insights
              </div>
            </div>
            <div className="flex items-center gap-1">
              {(["all", "high", "warning"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setInsightFilter(f)}
                  className="rounded-md px-2 py-1 text-[10px] font-medium capitalize transition-all"
                  style={
                    insightFilter === f
                      ? {
                          background: "rgba(59,130,246,0.15)",
                          color: C.blue,
                          border: "1px solid rgba(59,130,246,0.3)",
                        }
                      : { color: "rgba(240,244,255,0.35)", border: "1px solid transparent" }
                  }
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <ul
            className="divide-y flex-1 overflow-y-auto"
            style={{ borderColor: "rgba(59,130,246,0.06)" }}
          >
            {filteredInsights.length === 0 ? (
              <li className="flex flex-col items-center justify-center px-5 py-10 text-center">
                <Activity className="h-6 w-6 mb-3" style={{ color: "rgba(59,130,246,0.3)" }} />
                <p className="text-[12px]" style={{ color: "rgba(240,244,255,0.3)" }}>
                  No signals yet — agents will surface insights as your data grows.
                </p>
              </li>
            ) : (
              filteredInsights.map((ins) => {
                const IconMap = {
                  signal: Signal,
                  opportunity: ArrowUpRight,
                  warning: AlertTriangle,
                  recommendation: Zap,
                };
                const TypeIcon = IconMap[ins.type];
                const typeColor = {
                  signal: C.blue,
                  opportunity: C.green,
                  warning: C.amber,
                  recommendation: C.cyan,
                }[ins.type];
                return (
                  <li
                    key={ins.id}
                    className="flex gap-3 px-5 py-3 transition-all duration-150"
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.03)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <span
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                      style={{ background: `${typeColor}12`, border: `1px solid ${typeColor}22` }}
                    >
                      <TypeIcon className="h-3 w-3" style={{ color: typeColor }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <div
                          className="font-medium text-[12px] leading-snug"
                          style={{ color: "var(--foreground)" }}
                        >
                          {ins.title}
                        </div>
                        {ins.priority === "high" && (
                          <span
                            className="shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[8px] font-bold"
                            style={{ color: C.red, background: "rgba(248,113,113,0.1)" }}
                          >
                            HIGH
                          </span>
                        )}
                      </div>
                      <div className="text-[11px]" style={{ color: "rgba(240,244,255,0.4)" }}>
                        {ins.detail}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ background: ins.color }}
                        />
                        <span className="text-[10px]" style={{ color: ins.color, opacity: 0.8 }}>
                          {ins.agent}
                        </span>
                        {ins.ago && (
                          <span className="text-[10px]" style={{ color: "rgba(240,244,255,0.2)" }}>
                            · {ins.ago}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </section>

      {/* ── WEEKLY MISSION + COMMAND QUEUE ───────────────────────── */}
      <section className="rise-in grid gap-4 lg:grid-cols-12" style={{ ["--i" as string]: 4 }}>
        <div
          className="lg:col-span-8 relative overflow-hidden rounded-2xl"
          style={{
            background: "var(--surface)",
            border: "1px solid rgba(139,92,246,0.15)",
            boxShadow: "0 0 30px rgba(139,92,246,0.05)",
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.5), transparent)",
            }}
          />
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div
                  className="font-mono mb-1"
                  style={{
                    fontSize: "8.5px",
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    color: "rgba(139,92,246,0.7)",
                  }}
                >
                  WEEKLY MISSION
                </div>
                <div
                  className="font-display font-bold text-[14px]"
                  style={{ color: "var(--foreground)" }}
                >
                  {runs.filter((r) => r.status === "succeeded").length > 0
                    ? `Close ${Math.max(1, pipelineStages[1].count)} deals + deploy lead scoring automation`
                    : "Launch your first business tool to begin tracking missions"}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {liveAgents
                .filter((a) => a.status !== "standby")
                .map((agent, i) => (
                  <div
                    key={agent.id}
                    className="flex items-center gap-3 rounded-xl px-4 py-2.5"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: `${agent.color}10`,
                        border: `1px solid ${agent.color}25`,
                      }}
                    >
                      <Circle className="h-3 w-3" style={{ color: `${agent.color}60` }} />
                    </span>
                    <span className="flex-1 text-[12.5px]" style={{ color: "var(--foreground)" }}>
                      {agent.nextMove}
                    </span>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[9.5px]"
                      style={{ color: agent.color, background: `${agent.color}10`, opacity: 0.8 }}
                    >
                      {agent.role}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-3">
          <div
            className="font-mono"
            style={{
              fontSize: "8.5px",
              fontWeight: 700,
              letterSpacing: "0.16em",
              color: "rgba(59,130,246,0.5)",
            }}
          >
            COMMAND QUEUE
          </div>
          {[
            { label: "Validate new offer angle", to: "/app/launchpad/offer", color: C.violet },
            { label: "Generate GTM plan", to: "/app/launchpad/gtm-strategy", color: C.blue },
            {
              label: "Run revenue projector",
              to: "/app/launchpad/revenue-projector",
              color: C.amber,
            },
            { label: "Open CRM pipeline", to: "/app/nova/crm", color: C.green },
          ].map((cmd) => (
            <Link key={cmd.to} to={cmd.to}>
              <div className="nova-card nova-card-hover flex items-center gap-3 px-4 py-3 cursor-pointer transition-all">
                <span
                  className="h-1.5 w-1.5 rounded-full nova-live-dot shrink-0"
                  style={{ background: cmd.color }}
                />
                <span
                  className="flex-1 text-[12px] font-medium"
                  style={{ color: "rgba(240,244,255,0.75)" }}
                >
                  {cmd.label}
                </span>
                <ArrowRight
                  className="h-3.5 w-3.5 shrink-0"
                  style={{ color: cmd.color, opacity: 0.6 }}
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── PANELS ──────────────────────────────────────────────── */}
      {selectedAgent && currentOrgId && user && (
        <MissionBriefPanel
          agent={selectedAgent}
          orgId={currentOrgId}
          userId={user.id}
          accessToken={accessToken}
          onClose={() => setSelectedAgent(null)}
        />
      )}
      {showCC && currentOrgId && user && (
        <CommandCenter
          agents={liveAgents}
          userId={user.id}
          orgId={currentOrgId}
          accessToken={accessToken}
          onClose={() => setShowCC(false)}
        />
      )}

      {/* ── MOBILE FAB ──────────────────────────────────────────── */}
      <div className="fixed bottom-20 right-4 z-30 lg:hidden">
        <button
          onClick={() => setShowCC(true)}
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            boxShadow: "0 4px 20px rgba(59,130,246,0.5)",
          }}
        >
          <Command className="h-5 w-5 text-white" />
        </button>
      </div>
    </div>
  );
}
