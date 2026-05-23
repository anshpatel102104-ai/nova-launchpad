import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import {
  organizationQuery,
  subscriptionQuery,
  toolRunsQuery,
  usageQuery,
  planEntitlementsQuery,
  generatedAssetsQuery,
  leadsQuery,
} from "@/lib/queries";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lightbulb,
  Megaphone,
  Target,
  Skull,
  Trophy,
  UserPlus,
  FileText,
  Mail,
  GitCompare,
  Globe,
  LineChart,
  Sparkles,
  TrendingUp,
  Crosshair,
  Tags,
  ClipboardList,
  DollarSign,
  Star,
  Flame,
  Zap,
  ArrowUpRight,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });

function greetingFor(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

type PhaseConfig = {
  id: string;
  number: number;
  label: string;
  tagline: string;
  color: string;
  bg: string;
  border: string;
  tools: { key: string; label: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; to: string }[];
};

const PHASES: PhaseConfig[] = [
  {
    id: "validate",
    number: 1,
    label: "Validate",
    tagline: "Pressure-test your idea before you build",
    color: "#f97316",
    bg: "#fff7ed",
    border: "#fed7aa",
    tools: [
      { key: "validate-idea", label: "Idea Validator", icon: Lightbulb, to: "/app/launchpad/idea-validator" },
      { key: "kill-my-idea", label: "Kill My Idea", icon: Skull, to: "/app/launchpad/kill-my-idea" },
      { key: "idea-vs-idea", label: "Idea vs Idea", icon: GitCompare, to: "/app/launchpad/idea-vs-idea" },
    ],
  },
  {
    id: "position",
    number: 2,
    label: "Position",
    tagline: "Define your market, message, and edge",
    color: "#ea580c",
    bg: "#fff7ed",
    border: "#fdba74",
    tools: [
      { key: "generate-gtm-strategy", label: "GTM Strategy", icon: Target, to: "/app/launchpad/gtm-strategy" },
      { key: "competitor-analysis", label: "Competitor Analysis", icon: Crosshair, to: "/app/launchpad/competitor" },
      { key: "pricing-strategy", label: "Pricing Strategy", icon: Tags, to: "/app/launchpad/pricing" },
    ],
  },
  {
    id: "build",
    number: 3,
    label: "Build",
    tagline: "Create the assets that attract customers",
    color: "#c2410c",
    bg: "#fff7ed",
    border: "#fb923c",
    tools: [
      { key: "generate-offer", label: "Offer Builder", icon: Sparkles, to: "/app/launchpad/offer" },
      { key: "landing-page", label: "Landing Page", icon: Globe, to: "/app/launchpad/landing-page" },
      { key: "analyze-website", label: "Website Auditor", icon: TrendingUp, to: "/app/launchpad/website-audit" },
    ],
  },
  {
    id: "launch",
    number: 4,
    label: "Launch",
    tagline: "Go to market and win your first customers",
    color: "#9a3412",
    bg: "#fff7ed",
    border: "#f97316",
    tools: [
      { key: "first-10-customers", label: "First 10 Customers", icon: UserPlus, to: "/app/launchpad/first-10-customers" },
      { key: "generate-followup-sequence", label: "Follow-Up Sequence", icon: Mail, to: "/app/launchpad/followup" },
      { key: "generate-pitch", label: "Pitch Generator", icon: Megaphone, to: "/app/launchpad/pitch-generator" },
    ],
  },
  {
    id: "scale",
    number: 5,
    label: "Scale",
    tagline: "Build systems, raise capital, and grow",
    color: "#7c2d12",
    bg: "#fff7ed",
    border: "#ea580c",
    tools: [
      { key: "business-plan", label: "Business Plan", icon: FileText, to: "/app/launchpad/business-plan" },
      { key: "generate-ops-plan", label: "Ops Plan", icon: ClipboardList, to: "/app/launchpad/ops-plan" },
      { key: "funding-score", label: "Funding Score", icon: Trophy, to: "/app/launchpad/funding-score" },
      { key: "investor-emails", label: "Investor Emails", icon: DollarSign, to: "/app/launchpad/investor-emails" },
      { key: "revenue-projector", label: "Revenue Projector", icon: LineChart, to: "/app/launchpad/revenue-projector" },
    ],
  },
];

function Dashboard() {
  const { currentOrgId, profile, user } = useAuth();

  const orgQ = useQuery({ ...organizationQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const subQ = useQuery({ ...subscriptionQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const runsQ = useQuery({ ...toolRunsQuery(currentOrgId ?? "", 8), enabled: !!currentOrgId });
  const allRunsQ = useQuery({ ...toolRunsQuery(currentOrgId ?? "", 200), enabled: !!currentOrgId });
  const usageQ = useQuery({ ...usageQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const plansQ = useQuery(planEntitlementsQuery());
  const assetsQ = useQuery({ ...generatedAssetsQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const leadsQ = useQuery({ ...leadsQuery(currentOrgId ?? ""), enabled: !!currentOrgId });

  const org = orgQ.data;
  const sub = subQ.data;
  const recentRuns = runsQ.data ?? [];
  const allRuns = allRunsQ.data ?? [];
  const usage = usageQ.data ?? [];
  const leads = leadsQ.data ?? [];

  const isLoading = orgQ.isLoading || subQ.isLoading || runsQ.isLoading;

  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="rounded-2xl bg-orange-50 border border-orange-100" style={{ minHeight: 180 }} />
        <div className="grid gap-3 lg:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl bg-orange-50 border border-orange-100" style={{ height: 140 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!currentOrgId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl text-white"
          style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", boxShadow: "0 4px 24px rgba(249,115,22,0.3)" }}
        >
          <Sparkles className="h-8 w-8" />
        </div>
        <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-gray-900">
          Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h2>
        <p className="mt-2 text-[13.5px] text-gray-500">
          Finish onboarding to start your bootcamp.
        </p>
        <Link to="/onboarding">
          <button
            className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", boxShadow: "0 4px 20px rgba(249,115,22,0.3)" }}
          >
            Start Bootcamp <ArrowRight className="h-4 w-4" />
          </button>
        </Link>
      </div>
    );
  }

  const succeeded = (k: string) => allRuns.some((r) => r.tool_key === k && r.status === "succeeded");

  const totalUsed = usage.reduce((s, r) => s + (r.count as number), 0);
  const limit = plansQ.data?.find((p) => p.plan === sub?.plan)?.monthly_generation_limit ?? null;
  const firstName = (profile?.full_name || "").split(" ")[0] || "there";
  const planLabel = (sub?.plan ?? "starter").charAt(0).toUpperCase() + (sub?.plan ?? "starter").slice(1);

  // XP: 50 per completed tool
  const allToolKeys = PHASES.flatMap((p) => p.tools.map((t) => t.key));
  const completedCount = allToolKeys.filter(succeeded).length;
  const totalXP = completedCount * 50;
  const maxXP = allToolKeys.length * 50;
  const xpPercent = maxXP > 0 ? Math.round((totalXP / maxXP) * 100) : 0;

  // Current phase: first phase with incomplete tools
  const currentPhaseIdx = PHASES.findIndex((p) => p.tools.some((t) => !succeeded(t.key)));
  const currentPhase = PHASES[currentPhaseIdx >= 0 ? currentPhaseIdx : PHASES.length - 1];

  // Next mission
  const nextMission = (() => {
    for (const phase of PHASES) {
      for (const tool of phase.tools) {
        if (!succeeded(tool.key)) return { ...tool, phase };
      }
    }
    return null;
  })();

  // Phase completion status
  const phaseStatus = (phase: PhaseConfig) => {
    const done = phase.tools.filter((t) => succeeded(t.key)).length;
    return { done, total: phase.tools.length, pct: Math.round((done / phase.tools.length) * 100) };
  };

  return (
    <div className="space-y-6">
      {/* ── HERO: Bootcamp HQ ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{
          background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)",
          border: "1px solid #fdba74",
        }}
      >
        {/* Decorative orb */}
        <div
          className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(249,115,22,0.15), transparent 70%)" }}
        />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400 mb-2">
              {planLabel} plan · AI Mentor Bootcamp
            </div>
            <h1
              className="font-display font-black tracking-tight leading-none text-gray-900"
              style={{ fontSize: "clamp(1.7rem, 3vw + 0.8rem, 2.8rem)", letterSpacing: "-0.03em" }}
            >
              {greetingFor()}, {firstName}
            </h1>
            <p className="mt-2 text-[13.5px] text-gray-600">
              {org?.name ? `${org.name} · ` : ""}Your journey from idea to business starts here.
            </p>
          </div>

          {/* XP + Stats */}
          <div className="flex flex-col items-start gap-3 md:items-end">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-bold text-orange-700"
                style={{ background: "rgba(249,115,22,0.12)", border: "1px solid #fdba74" }}
              >
                <Star className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                {totalXP} XP
              </div>
              <div
                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-bold text-orange-700"
                style={{ background: "rgba(249,115,22,0.12)", border: "1px solid #fdba74" }}
              >
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                {completedCount} missions
              </div>
            </div>
            {/* XP Progress bar */}
            <div className="flex items-center gap-2 w-full md:w-56">
              <div className="flex-1 h-2 rounded-full bg-orange-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${xpPercent}%`,
                    background: "linear-gradient(90deg, #f97316, #ea580c)",
                  }}
                />
              </div>
              <span className="text-[11px] font-mono font-semibold text-orange-600">
                {xpPercent}%
              </span>
            </div>
            {nextMission && (
              <Link to={nextMission.to}>
                <button
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-bold text-white transition-all hover:-translate-y-0.5"
                  style={{
                    background: "linear-gradient(135deg, #f97316, #ea580c)",
                    boxShadow: "0 4px 20px rgba(249,115,22,0.35)",
                  }}
                >
                  <Zap className="h-3.5 w-3.5" />
                  Next Mission: {nextMission.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </Link>
            )}
            {!nextMission && (
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-bold text-orange-700"
                style={{ background: "rgba(249,115,22,0.1)", border: "1px solid #fdba74" }}
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                All missions complete! You're a founder.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 5 PHASE CARDS ── */}
      <section>
        {!false && (
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-display text-[15px] font-bold text-gray-900">Your Bootcamp Journey</h2>
            <span className="text-[12px] text-gray-400">· {completedCount} of {allToolKeys.length} missions done</span>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PHASES.map((phase) => {
            const { done, total, pct } = phaseStatus(phase);
            const isCurrent = phase.id === currentPhase?.id && done < total;
            const isComplete = done === total;
            return (
              <div
                key={phase.id}
                className={cn(
                  "relative overflow-hidden rounded-2xl p-4 transition-all",
                  isCurrent && "ring-2 ring-orange-400 ring-offset-2",
                )}
                style={{
                  background: isComplete ? "#f0fdf4" : phase.bg,
                  border: `1px solid ${isComplete ? "#bbf7d0" : phase.border}`,
                }}
              >
                {isCurrent && (
                  <div className="absolute top-2 right-2">
                    <span
                      className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-orange-600"
                      style={{ background: "#fff7ed", border: "1px solid #fdba74" }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                      NOW
                    </span>
                  </div>
                )}

                {/* Phase number badge */}
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-[11px] font-black text-white mb-3"
                  style={{ background: isComplete ? "#22c55e" : phase.color }}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : phase.number}
                </div>

                <div className="font-display text-[13px] font-bold text-gray-900 uppercase tracking-tight">
                  {phase.label}
                </div>
                <div className="text-[10.5px] text-gray-500 mt-0.5 leading-snug">{phase.tagline}</div>

                {/* Progress */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                    <span>{done}/{total} done</span>
                    <span className="font-semibold" style={{ color: isComplete ? "#22c55e" : phase.color }}>
                      {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: isComplete
                          ? "linear-gradient(90deg, #22c55e, #16a34a)"
                          : `linear-gradient(90deg, ${phase.color}, ${phase.color}cc)`,
                      }}
                    />
                  </div>
                </div>

                {/* Tools */}
                <ul className="mt-3 space-y-1">
                  {phase.tools.map((tool) => {
                    const done = succeeded(tool.key);
                    return (
                      <li key={tool.key}>
                        <Link
                          to={tool.to}
                          className="flex items-center gap-2 rounded-lg px-2 py-1 text-[11.5px] transition-all hover:bg-white/70"
                        >
                          <span
                            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md"
                            style={{
                              background: done ? "rgba(34,197,94,0.1)" : "rgba(249,115,22,0.08)",
                              border: done ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(249,115,22,0.2)",
                            }}
                          >
                            {done ? (
                              <Check className="h-2.5 w-2.5 text-green-500" />
                            ) : (
                              <tool.icon className="h-2.5 w-2.5" style={{ color: phase.color }} />
                            )}
                          </span>
                          <span className={cn("truncate", done ? "line-through text-gray-400" : "text-gray-700")}>
                            {tool.label}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── MENTOR CARD + ACTIVITY ── */}
      <section className="grid gap-4 lg:grid-cols-12">
        {/* Nova AI Mentor */}
        {nextMission && (
          <div
            className="lg:col-span-4 relative overflow-hidden rounded-2xl p-5"
            style={{
              background: "linear-gradient(135deg, #fff7ed, #ffedd5)",
              border: "1px solid #fdba74",
            }}
          >
            <div
              className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(249,115,22,0.2), transparent 70%)" }}
            />
            <div className="relative">
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold text-[14px]"
                  style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", boxShadow: "0 4px 16px rgba(249,115,22,0.3)" }}
                >
                  N
                </div>
                <div>
                  <div className="text-[13px] font-bold text-gray-900">Nova</div>
                  <div className="text-[10px] text-orange-500 font-semibold">Your AI Mentor</div>
                </div>
                <div
                  className="ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold text-green-700"
                  style={{ background: "#dcfce7", border: "1px solid #bbf7d0" }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  Online
                </div>
              </div>

              <div
                className="rounded-xl p-3 text-[12.5px] text-gray-700 leading-relaxed"
                style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(249,115,22,0.15)" }}
              >
                Ready for your next mission? Let's tackle{" "}
                <span className="font-semibold text-orange-600">{nextMission.label}</span> — this is where founders separate themselves from dreamers.
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div
                  className="rounded-lg px-2.5 py-1 text-[10px] font-bold text-orange-700"
                  style={{ background: "rgba(249,115,22,0.1)", border: "1px solid #fdba74" }}
                >
                  Phase {nextMission.phase.number}: {nextMission.phase.label}
                </div>
                <div
                  className="rounded-lg px-2.5 py-1 text-[10px] font-bold text-orange-600"
                  style={{ background: "rgba(249,115,22,0.08)", border: "1px solid #fed7aa" }}
                >
                  +50 XP
                </div>
              </div>

              <Link to={nextMission.to} className="mt-4 flex">
                <button
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-bold text-white w-full justify-center transition-all hover:-translate-y-0.5"
                  style={{
                    background: "linear-gradient(135deg, #f97316, #ea580c)",
                    boxShadow: "0 4px 16px rgba(249,115,22,0.3)",
                  }}
                >
                  Start Mission <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </Link>

              {limit && (
                <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(249,115,22,0.15)" }}>
                  <div className="flex items-center justify-between text-[10.5px] text-gray-500 mb-1">
                    <span>AI generations this month</span>
                    <span className="font-mono font-semibold text-orange-600">{totalUsed} / {limit}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-orange-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, (totalUsed / limit) * 100)}%`,
                        background: "linear-gradient(90deg, #f97316, #ea580c)",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent activity */}
        <div
          className={cn("overflow-hidden rounded-2xl", nextMission ? "lg:col-span-8" : "lg:col-span-12")}
          style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid #f3f4f6" }}
          >
            <div>
              <div className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-orange-400">
                Activity
              </div>
              <h3 className="mt-0.5 font-display text-[14px] font-bold text-gray-900">
                Recent missions
              </h3>
            </div>
            <Link
              to="/app/launchpad"
              className="inline-flex items-center gap-1 text-[12px] text-orange-500 hover:text-orange-700 transition-colors font-medium"
            >
              All tools <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {recentRuns.length === 0 && leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}
              >
                <Zap className="h-5 w-5 text-orange-400" />
              </div>
              <p className="mt-4 text-[13px] font-semibold text-gray-900">No activity yet</p>
              <p className="mt-1 text-[12px] text-gray-500 max-w-xs">
                Complete your first mission to start earning XP and building your business.
              </p>
              <Link to="/app/launchpad/$tool" params={{ tool: "idea-validator" }} className="mt-4">
                <button
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", boxShadow: "0 4px 14px rgba(249,115,22,0.3)" }}
                >
                  Start with Idea Validator
                </button>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {recentRuns.slice(0, 8).map((r) => {
                const isOk = r.status === "succeeded";
                const isFail = r.status === "failed";
                const isRun = r.status === "running";
                return (
                  <li
                    key={r.id}
                    className="flex items-center gap-3.5 px-5 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: isOk ? "#f0fdf4" : isFail ? "#fef2f2" : "#fff7ed",
                        border: `1px solid ${isOk ? "#bbf7d0" : isFail ? "#fecaca" : "#fed7aa"}`,
                      }}
                    >
                      {isOk ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      ) : isFail ? (
                        <span className="h-3.5 w-3.5 text-red-400 text-[10px] font-bold flex items-center justify-center">✕</span>
                      ) : (
                        <Loader2 className="h-3.5 w-3.5 text-orange-500 animate-spin" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-gray-900">
                        {r.tool_key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {new Date(r.created_at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOk && (
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 rounded-full px-2 py-0.5 border border-orange-100">
                          +50 XP
                        </span>
                      )}
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
                        style={{
                          background: isOk ? "#f0fdf4" : isFail ? "#fef2f2" : "#fff7ed",
                          color: isOk ? "#16a34a" : isFail ? "#dc2626" : "#ea580c",
                          border: `1px solid ${isOk ? "#bbf7d0" : isFail ? "#fecaca" : "#fed7aa"}`,
                        }}
                      >
                        {r.status}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* ── STATS ROW ── */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="XP Earned"
          value={`${totalXP}`}
          sub={`${xpPercent}% of max ${maxXP} XP`}
          icon={Star}
          color="#f97316"
        />
        <StatCard
          label="Missions Done"
          value={completedCount}
          sub={`${allToolKeys.length - completedCount} remaining`}
          icon={CheckCircle2}
          color="#ea580c"
        />
        <StatCard
          label="Leads Captured"
          value={leads.length}
          sub={`${leads.filter((l) => l.stage === "Won").length} won`}
          icon={UserPlus}
          color="#c2410c"
        />
        <StatCard
          label="Assets Generated"
          value={(assetsQ.data ?? []).length}
          sub="pitch decks, plans & more"
          icon={FileText}
          color="#9a3412"
        />
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 transition-all hover:-translate-y-0.5"
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</div>
          <div
            className="mt-2 font-display font-black leading-none tabular-nums text-gray-900"
            style={{ fontSize: "2rem", letterSpacing: "-0.04em" }}
          >
            {value}
          </div>
          <div className="mt-2 text-[11px] text-gray-500">{sub}</div>
        </div>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
          style={{
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            boxShadow: `0 4px 14px ${color}30`,
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
