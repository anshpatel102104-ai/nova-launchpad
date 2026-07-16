// Mission Control — the founder's home. One screen, one clear hierarchy:
//
//   1. CURRENT MISSION   → the dominant element. Where you are, and the single
//                          next move, with a big CTA. Nothing competes with it.
//   2. TASKS             → the queue behind the mission — what's next, ranked.
//   3. NEXT STEP         → the current mission step with its mentor's teaching,
//                          and a way to talk to the mentor.
//   4. PROGRESS          → level, XP, health, next milestone — the game layer.
//   5. SUPPORTING TOOLS  → everything else, deliberately quiet.
//
// This is not a dashboard of equal widgets. It's an operating system that
// always answers "what do I do next?" before anything else.

import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { type LeadRow } from "@/hooks/use-business-graph";
import { useProgressSpine } from "@/hooks/use-progress-spine";
import { useFounderProgress } from "@/hooks/use-founder-progress";
import { useFounderStreak } from "@/hooks/use-founder-streak";
import { NextStepHero } from "@/components/app/dashboard/NextStepHero";
import { MentorChatCard } from "@/components/app/dashboard/MentorChatCard";
import { NovaHandoffCard } from "@/components/launchpad/NovaHandoffCard";
import { CasefileSummary } from "@/components/launchpad/CasefileSummary";
import { type LaunchpadProgress } from "@/lib/ecosystem";
import { gradeForScore } from "@/lib/business-grade";
import { HexLevelBadge } from "@/components/app/gamification/HexLevelBadge";
import { XPProgressBar } from "@/components/app/gamification/XPProgressBar";
import { ProgressRing } from "@/components/app/ProgressRing";
import {
  ArrowRight,
  AlertTriangle,
  Check,
  Clock,
  Lock,
  Target,
  Zap,
  Trophy,
  ChevronRight,
  Map,
  FlaskConical,
  FileText,
  Users,
  Bot,
  Radio,
} from "lucide-react";

export const Route = createFileRoute("/app/mission-control")({
  component: HomePage,
});

function HomePage() {
  const { user, profile } = useAuth();
  const spine = useProgressSpine();
  const graph = spine.graph;
  const founder = useFounderProgress();
  const streak = useFounderStreak();
  const progress = spine.stage;
  const gpa = gradeForScore(founder.founderScore);

  const name = profile?.full_name?.split(" ")[0] || "Founder";
  const blocker = graph.blockers[0];
  const recs = graph.recommendations;

  // The single most important next move — a blocker to fix always wins,
  // otherwise the top recommendation, otherwise "continue this stage."
  const hero: HeroMove = blocker
    ? {
        tone: "fix",
        eyebrow: "Fix this first",
        title: blocker.title,
        sub: blocker.why,
        to: blocker.resolveTo,
        cta: blocker.resolveLabel,
        minutes: blocker.estimatedMinutes,
      }
    : recs[0]
      ? {
          tone: "do",
          eyebrow: "Do this next",
          title: recs[0].title,
          sub: recs[0].impact,
          to: recs[0].to,
          cta: "Start now",
          minutes: recs[0].estimatedMinutes,
        }
      : {
          tone: "do",
          eyebrow: "Continue your mission",
          title: progress.current.headline,
          sub: progress.current.proof,
          to: progress.current.to,
          cta: "Continue",
          minutes: 15,
        };

  // Task queue behind the hero — the recommendations we didn't surface above.
  const queue = (blocker ? recs.slice(0, 4) : recs.slice(1, 5)).filter(Boolean);

  const stageNumber = progress.currentIndex + 1;
  const stageCount = progress.stages.length;

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      {/* ── Greeting ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1
            className="font-display text-[26px] font-extrabold leading-tight"
            style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}
          >
            Welcome back, {name}
          </h1>
          <p className="mt-1 text-[13.5px]" style={{ color: "var(--muted-foreground)" }}>
            {graph.businessName} · you have one clear next move. Nova will guide you.
          </p>
        </div>
        <StatusChip tone={blocker ? "warning" : "success"}>
          {blocker ? "1 thing to fix" : "On track"}
        </StatusChip>
      </div>

      {/* ── Nova handoff — the build is proven, take it live ── */}
      {progress.readyForNova && <NovaHandoffCard graph={graph} />}

      {/* ══ 1 · CURRENT MISSION — the dominant element ══ */}
      <MissionHero
        hero={hero}
        stageLabel={progress.current.label}
        stageNumber={stageNumber}
        stageCount={stageCount}
        stages={progress.stages}
        missionPercent={spine.percent}
      />

      {/* ══ 2 · TASKS — the queue behind the mission ══ */}
      <section>
        <SectionLabel icon={Target}>Your task queue</SectionLabel>
        <div
          className="overflow-hidden rounded-2xl border"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          {queue.length === 0 ? (
            <div
              className="px-5 py-6 text-center text-[13px]"
              style={{ color: "var(--text-faint)" }}
            >
              Finish the mission above and Nova will line up what's next.
            </div>
          ) : (
            queue.map((r, i) => (
              <Link
                key={r.id}
                to={r.to}
                className="group flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-surface-2"
                style={{ borderTop: i > 0 ? "1px solid var(--border-subtle)" : "none" }}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold"
                  style={{
                    background: "var(--primary-soft)",
                    color: "var(--primary)",
                    border: "1px solid var(--primary-border)",
                  }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[13.5px] font-semibold"
                    style={{ color: "var(--foreground)" }}
                  >
                    {r.title}
                  </div>
                  <div className="truncate text-[12px]" style={{ color: "var(--text-faint)" }}>
                    {r.impact}
                  </div>
                </div>
                <span
                  className="hidden shrink-0 items-center gap-1 text-[11.5px] font-semibold sm:inline-flex"
                  style={{ color: "var(--text-faint)" }}
                >
                  <Clock className="h-3 w-3" />
                  {r.estimatedMinutes}m
                </span>
                <ArrowRight
                  className="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ color: "var(--primary)" }}
                />
              </Link>
            ))
          )}
        </div>
      </section>

      {/* ══ 3 · NEXT STEP — the current mission step, with its mentor's
             teaching folded into the step guidance (lessons merged into the
             execution spine — one "do this now", not two) ══ */}
      <section>
        <SectionLabel icon={Bot}>Your next step</SectionLabel>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.62fr_1fr]">
          {user?.id && <NextStepHero userId={user.id} />}
          <MentorChatCard />
        </div>
      </section>

      {/* ══ 4 · PROGRESS — the game layer ══ */}
      <section>
        <SectionLabel icon={Trophy}>
          Your progress
          <Link
            to="/app/roadmap"
            className="ml-auto inline-flex items-center gap-1 text-[11.5px] font-bold normal-case tracking-normal"
            style={{ color: "var(--primary)" }}
          >
            Full report card
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </SectionLabel>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
          {/* Level + XP */}
          <div
            className="flex items-center gap-5 rounded-2xl border p-5"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <HexLevelBadge level={founder.level} levelLabel={founder.levelLabel} size={76} />
            <div className="min-w-0 flex-1">
              <div
                className="text-[10.5px] font-bold uppercase tracking-[0.09em]"
                style={{ color: "var(--text-faint)" }}
              >
                Business level
              </div>
              <div
                className="mt-0.5 text-[16px] font-extrabold"
                style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
              >
                Level {founder.level} · {founder.levelLabel}
              </div>
              <div className="mt-2.5">
                <XPProgressBar
                  percent={founder.xpProgressInLevel}
                  currentXP={founder.totalXP}
                  xpForNextLevel={founder.xpForNextLevel}
                  height={6}
                  showLabel
                />
              </div>
              <div
                className="mt-2 flex items-center gap-1.5 text-[11.5px] font-semibold"
                style={{ color: "var(--primary)" }}
              >
                <Zap className="h-3 w-3" />
                {founder.nextMilestone}
              </div>
            </div>
          </div>

          {/* Health / GPA */}
          <div
            className="flex items-center gap-4 rounded-2xl border p-5"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <ProgressRing
              percent={founder.founderScore}
              size={78}
              strokeWidth={7}
              color="var(--success)"
              label={
                <span
                  className="font-display font-extrabold"
                  style={{ color: "var(--foreground)", fontSize: 22 }}
                >
                  {gpa.letter}
                </span>
              }
            />
            <div className="min-w-0 flex-1">
              <div
                className="text-[10.5px] font-bold uppercase tracking-[0.09em]"
                style={{ color: "var(--text-faint)" }}
              >
                Business health
              </div>
              <div
                className="mt-0.5 text-[16px] font-extrabold"
                style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
              >
                {founder.founderScore}
                <span className="text-[12px] font-semibold" style={{ color: "var(--text-faint)" }}>
                  {" "}
                  / 100
                </span>
              </div>
              <div
                className="mt-1.5 text-[12px] leading-snug"
                style={{ color: "var(--muted-foreground)" }}
              >
                {spine.percent > 0
                  ? `Current mission ${spine.percent}% complete`
                  : "Complete your mission to raise your grade"}
              </div>
            </div>
          </div>
        </div>

        {/* Concrete numbers — quiet, factual */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <StatTile
            label="Pipeline value"
            value={formatMoney(graph.leads.reduce((s, l) => s + (l.value ?? 0), 0))}
            delta={leadDelta(graph.leads).valueDelta}
            deltaLabel={(v) => `${formatMoney(v)} this week`}
          />
          <StatTile
            label="Leads"
            value={String(graph.leads.length)}
            suffix=" / 10 goal"
            delta={leadDelta(graph.leads).countDelta}
            deltaLabel={(v) => `+${v} this week`}
          />
          <StatTile
            label="Streak"
            value={String(streak.currentStreak)}
            suffix={streak.currentStreak === 1 ? " day" : " days"}
            delta={0}
            deltaLabel={() => ""}
          />
        </div>
      </section>

      {/* ══ 5 · SUPPORTING TOOLS — deliberately quiet ══ */}
      <section>
        <SectionLabel icon={Radio}>Supporting tools</SectionLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {SUPPORT_TOOLS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition-all hover:-translate-y-0.5"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: "var(--surface-2)", color: "var(--muted-foreground)" }}
              >
                <t.icon className="h-4 w-4" />
              </span>
              <span className="text-[12px] font-semibold" style={{ color: "var(--foreground)" }}>
                {t.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Casefile — supporting evidence, kept last ── */}
      <section>
        <SectionLabel icon={FileText}>Your casefile</SectionLabel>
        <CasefileSummary graph={graph} progress={progress} />
      </section>
    </div>
  );
}

/* ─── Current Mission hero ──────────────────────────────────── */

interface HeroMove {
  tone: "fix" | "do";
  eyebrow: string;
  title: string;
  sub: string;
  to: string;
  cta: string;
  minutes: number;
}

function MissionHero({
  hero,
  stageLabel,
  stageNumber,
  stageCount,
  stages,
  missionPercent,
}: {
  hero: HeroMove;
  stageLabel: string;
  stageNumber: number;
  stageCount: number;
  stages: LaunchpadProgress["stages"];
  missionPercent: number;
}) {
  const fix = hero.tone === "fix";
  const accent = fix ? "var(--warning)" : "var(--primary)";

  return (
    <div
      className="relative overflow-hidden rounded-[20px] border p-6 md:p-7"
      style={{
        borderColor: fix
          ? "color-mix(in oklab, var(--warning) 32%, transparent)"
          : "var(--primary-border)",
        background:
          "radial-gradient(120% 140% at 0% 0%, color-mix(in oklab, " +
          accent +
          " 12%, var(--surface)) 0%, var(--surface) 55%)",
        boxShadow: "var(--shadow-glow-primary)",
      }}
    >
      {/* ambient grid */}
      <div className="bg-grid-faint pointer-events-none absolute inset-0 opacity-40" />

      <div className="relative">
        {/* stage context + live pill */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em]"
            style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
          >
            <Target className="h-3 w-3" />
            Stage {stageNumber} of {stageCount} · {stageLabel}
          </span>
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.06em]"
            style={{ color: fix ? "var(--warning)" : "var(--success)" }}
          >
            <span
              className="nova-live-dot h-1.5 w-1.5 rounded-full"
              style={{ background: "currentColor" }}
            />
            {hero.eyebrow}
          </span>
        </div>

        {/* the objective */}
        <h2
          className="mt-3.5 font-display text-[24px] font-extrabold leading-[1.15] md:text-[28px]"
          style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}
        >
          {hero.title}
        </h2>
        <p
          className="mt-1.5 max-w-2xl text-[14px] leading-relaxed"
          style={{ color: "var(--muted-foreground)" }}
        >
          {hero.sub}
        </p>

        {/* CTA + time */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link
            to={hero.to}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[14px] font-bold transition-transform hover:-translate-y-0.5"
            style={{
              background: accent,
              color: fix ? "var(--warning-foreground)" : "var(--primary-foreground)",
              boxShadow: fix
                ? "0 6px 20px color-mix(in oklab, var(--warning) 35%, transparent)"
                : "0 6px 20px color-mix(in oklab, var(--primary) 40%, transparent)",
            }}
          >
            {fix ? <AlertTriangle className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
            {hero.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <span
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
            style={{ color: "var(--text-faint)" }}
          >
            <Clock className="h-3.5 w-3.5" />
            About {hero.minutes} min
          </span>
        </div>

        {/* stage stepper — the journey at a glance */}
        <div className="mt-6 flex items-center gap-1.5">
          {stages.map((s, i) => (
            <React.Fragment key={s.id}>
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10.5px] font-bold"
                title={s.label}
                style={
                  s.done
                    ? { background: "var(--success)", color: "var(--success-foreground)" }
                    : s.current
                      ? {
                          background: "var(--primary)",
                          color: "var(--primary-foreground)",
                          boxShadow: "0 0 0 3px var(--primary-soft)",
                        }
                      : {
                          background: "var(--surface-2)",
                          color: "var(--text-faint)",
                          border: "1px solid var(--border)",
                        }
                }
              >
                {s.done ? (
                  <Check className="h-3 w-3" />
                ) : s.upcoming ? (
                  <Lock className="h-2.5 w-2.5" />
                ) : (
                  i + 1
                )}
              </div>
              {i < stages.length - 1 && (
                <div
                  className="h-[2px] flex-1 rounded-full"
                  style={{ background: s.done ? "var(--success)" : "var(--border)" }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        {missionPercent > 0 && (
          <div className="mt-2 text-[11.5px] font-semibold" style={{ color: "var(--text-faint)" }}>
            Current mission {missionPercent}% complete
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Supporting tools ──────────────────────────────────────── */

const SUPPORT_TOOLS = [
  { label: "Roadmap", to: "/app/roadmap", icon: Map },
  { label: "Research", to: "/app/research", icon: FlaskConical },
  { label: "Assets", to: "/app/assets", icon: FileText },
  { label: "Automations", to: "/app/automations", icon: Zap },
  { label: "Contacts", to: "/app/contacts", icon: Users },
  { label: "Ask Nova", to: "/app/mentor", icon: Bot },
] as const;

/* ─── Small pieces ──────────────────────────────────────────── */

function SectionLabel({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div
      className="mb-3 flex items-center gap-2 px-0.5 text-[12px] font-bold uppercase tracking-[0.08em]"
      style={{ color: "var(--text-faint)" }}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </div>
  );
}

function StatusChip({
  tone,
  children,
}: {
  tone: "success" | "warning";
  children: React.ReactNode;
}) {
  const color = tone === "warning" ? "var(--warning)" : "var(--success)";
  return (
    <span
      className="mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[11.5px] font-bold"
      style={{
        color,
        background: `color-mix(in oklab, ${color} 12%, var(--surface))`,
        borderColor: `color-mix(in oklab, ${color} 30%, transparent)`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {children}
    </span>
  );
}

function StatTile({
  label,
  value,
  suffix,
  delta,
  deltaLabel,
}: {
  label: string;
  value: string;
  suffix?: string;
  delta: number;
  deltaLabel: (v: number) => string;
}) {
  return (
    <div
      className="rounded-2xl border px-5 py-4"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div
        className="text-[10.5px] font-bold uppercase tracking-[0.09em]"
        style={{ color: "var(--text-faint)" }}
      >
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span
          className="font-display text-[24px] font-extrabold"
          style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
        >
          {value}
        </span>
        {suffix && (
          <span className="text-[12px] font-semibold" style={{ color: "var(--text-faint)" }}>
            {suffix}
          </span>
        )}
      </div>
      {delta > 0 && (
        <div className="mt-0.5 text-[11.5px] font-bold" style={{ color: "var(--success)" }}>
          ▲ {deltaLabel(delta)}
        </div>
      )}
    </div>
  );
}

/* ─── Lead deltas (last week) ───────────────────────────────── */

function leadDelta(leads: LeadRow[]): { countDelta: number; valueDelta: number } {
  const now = Date.now();
  let countDelta = 0;
  let valueDelta = 0;
  for (const l of leads) {
    if (!l.created_at) continue;
    const age = Math.floor((now - new Date(l.created_at).getTime()) / (7 * 86_400_000));
    if (age === 0) {
      countDelta += 1;
      valueDelta += l.value ?? 0;
    }
  }
  return { countDelta, valueDelta };
}

function formatMoney(v: number): string {
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${Math.round(v)}`;
}
