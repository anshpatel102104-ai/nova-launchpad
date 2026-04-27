import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Rocket, Zap, ArrowRight, Check, Lightbulb, Target, Megaphone,
  Inbox, Globe, Mail, Skull, Trophy, UserPlus, FileText, GitCompare,
  Settings2, TrendingUp, Cpu, FolderOpen, Star, Users, Workflow,
} from "lucide-react";
import { guestStore } from "@/lib/guest";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled && session) navigate({ to: "/app/dashboard" });
    });
    return () => { cancelled = true; };
  }, [navigate]);

  const startDemo = () => {
    guestStore.enable();
    navigate({ to: "/app/dashboard" });
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <LandingNav />
      <HeroSection startDemo={startDemo} />
      <LogoStrip />
      <PillarsSection />
      <ToolsSection />
      <HowItWorks />
      <StatsSection />
      <CtaSection startDemo={startDemo} />
      <LandingFooter />
    </div>
  );
}

/* ─────────────────────────────── NAV ─────────────────────────────── */

function LandingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16">
      <div className="absolute inset-0 border-b border-border/50 bg-background/80 backdrop-blur-xl" />
      <div className="relative mx-auto flex h-full max-w-7xl items-center justify-between px-6 md:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-card"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
          >
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-[14px] font-semibold tracking-tight">Nova OPS</div>
            <div className="hidden text-[10px] text-muted-foreground sm:block">AI Business OS</div>
          </div>
        </div>

        {/* Center links */}
        <nav className="hidden items-center gap-7 md:flex">
          {[
            { label: "Features", href: "#features" },
            { label: "Tools", href: "#tools" },
            { label: "How it works", href: "#how" },
          ].map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* CTAs */}
        <div className="flex items-center gap-2">
          <Link to="/auth/sign-in">
            <Button variant="ghost" size="sm" className="h-8 text-[13px]">Sign in</Button>
          </Link>
          <Link to="/auth/sign-up">
            <Button
              size="sm"
              className="h-8 gap-1.5 text-white shadow-card transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
            >
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────────── HERO ─────────────────────────────── */

function HeroSection({ startDemo }: { startDemo: () => void }) {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pb-16 pt-28 text-center">
      {/* Animated mesh */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-mesh-animated opacity-70" />
      <div className="pointer-events-none absolute inset-0 bg-dotgrid opacity-30" />

      {/* Floating orbs */}
      <div
        className="pointer-events-none absolute -left-48 top-1/4 h-[640px] w-[640px] rounded-full opacity-25"
        style={{
          background: "radial-gradient(circle, color-mix(in oklab, var(--primary) 35%, transparent), transparent 70%)",
          filter: "blur(72px)",
          animation: "meshDrift 18s ease-in-out infinite",
        }}
      />
      <div
        className="pointer-events-none absolute -right-48 top-1/3 h-[540px] w-[540px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, color-mix(in oklab, var(--accent) 35%, transparent), transparent 70%)",
          filter: "blur(72px)",
          animation: "meshDrift 22s ease-in-out infinite reverse",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 h-[360px] w-[640px] -translate-x-1/2 rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, color-mix(in oklab, var(--orange) 30%, transparent), transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl">
        {/* Announcement badge */}
        <div className="page-in inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-[12px] font-medium text-primary backdrop-blur-sm">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Kill My Idea tool is now live — try it free
          <ChevronArrow />
        </div>

        {/* Headline */}
        <h1
          className="page-in mt-8 font-display font-semibold tracking-tight"
          style={{
            fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
            lineHeight: 1.04,
            animationDelay: "60ms",
          }}
        >
          The AI operating system
          <br className="hidden sm:block" />
          <span className="text-brand-cycle"> built for founders.</span>
        </h1>

        {/* Subheadline */}
        <p
          className="page-in mx-auto mt-6 max-w-2xl leading-relaxed text-muted-foreground"
          style={{ fontSize: "clamp(1rem, 2vw, 1.175rem)", animationDelay: "120ms" }}
        >
          Go from idea to automated revenue without juggling ten tools.
          Nova OPS combines AI generation, automation pipelines, and a
          lightweight CRM into one intelligent workspace.
        </p>

        {/* CTAs */}
        <div
          className="page-in mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          style={{ animationDelay: "180ms" }}
        >
          <button
            onClick={startDemo}
            className="group relative inline-flex h-12 items-center gap-2 overflow-hidden rounded-xl px-8 text-[15px] font-semibold text-white shadow-[0_0_0_1px_rgba(37,99,235,0.35),0_8px_32px_rgba(37,99,235,0.30)] transition-all hover:shadow-[0_0_0_1px_rgba(37,99,235,0.5),0_14px_44px_rgba(37,99,235,0.38)]"
            style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)" }}
          >
            <span>Try the live demo</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <Link to="/auth/sign-up">
            <button className="inline-flex h-12 items-center gap-2 rounded-xl border border-border/70 bg-surface/60 px-8 text-[15px] font-medium backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-primary/5">
              Sign up free
            </button>
          </Link>
        </div>

        <p
          className="page-in mt-4 text-[12px] text-muted-foreground"
          style={{ animationDelay: "220ms" }}
        >
          No credit card · Instant access · Cancel anytime
        </p>

        {/* Stats pill row */}
        <div
          className="page-in mx-auto mt-16 grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border/60 shadow-card"
          style={{ animationDelay: "300ms" }}
        >
          {[
            { n: "10+", label: "AI tools" },
            { n: "6", label: "OS modules" },
            { n: "14 days", label: "To go live" },
          ].map((s) => (
            <div
              key={s.n}
              className="flex flex-col items-center justify-center bg-surface/90 px-5 py-5 backdrop-blur-sm"
            >
              <div className="text-gradient font-display text-[1.75rem] font-semibold leading-none tracking-tight">
                {s.n}
              </div>
              <div className="mt-1.5 text-[11.5px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-muted-foreground/40">
        <div className="h-10 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
        <span className="text-[9px] uppercase tracking-widest">Scroll</span>
      </div>
    </section>
  );
}

function ChevronArrow() {
  return <ArrowRight className="h-3.5 w-3.5 opacity-60" />;
}

/* ─────────────────────────────── LOGO STRIP ─────────────────────────────── */

function LogoStrip() {
  const items = ["Founders", "Consultants", "Agencies", "Coaches", "SaaS builders", "Service businesses", "Solopreneurs"];
  return (
    <div className="border-y border-border/50 bg-surface/50 py-5 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
            Built for
          </span>
          {items.map((item) => (
            <span key={item} className="text-[13px] font-medium text-foreground/60">{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────── PILLARS ─────────────────────────────── */

const PILLARS = [
  {
    id: "launchpad",
    label: "Launchpad",
    icon: Rocket,
    iconGrad: ["var(--primary)", "var(--accent)"] as [string, string],
    glowColor: "rgba(37,99,235,0.15)",
    borderGlow: "rgba(37,99,235,0.25)",
    title: "AI tools that do the thinking",
    desc: "10 specialized generators produce investor pitches, GTM strategies, offer blueprints, and more — in under 60 seconds.",
    features: [
      "Business Idea Validator",
      "Pitch Generator",
      "GTM Strategy Builder",
      "Offer & Pricing Designer",
      "Kill My Idea (stress-test)",
      "Investor Email Sequences",
    ],
  },
  {
    id: "nova",
    label: "Nova OS",
    icon: Zap,
    iconGrad: ["var(--accent)", "var(--orange)"] as [string, string],
    glowColor: "rgba(139,92,246,0.15)",
    borderGlow: "rgba(139,92,246,0.25)",
    title: "Automation that runs your ops",
    desc: "Six business modules handle lead capture, follow-up sequences, client onboarding, and more — all on autopilot.",
    features: [
      "Lead Capture & Routing",
      "Multi-touch Follow-Up",
      "Client Onboarding Flow",
      "Invoice & Payment Tracker",
      "Reputation Manager",
      "Reporting Dashboard",
    ],
  },
  {
    id: "crm",
    label: "Pipeline CRM",
    icon: Users,
    iconGrad: ["var(--orange)", "var(--primary)"] as [string, string],
    glowColor: "rgba(255,122,41,0.12)",
    borderGlow: "rgba(255,122,41,0.22)",
    title: "Track every deal, close more",
    desc: "A lightweight CRM built into the same workspace — no exports or integrations required. Visual pipeline, activity log, revenue forecasting.",
    features: [
      "Visual Kanban Pipeline",
      "Lead Stage Automation",
      "Activity Timeline",
      "Won/Lost Analytics",
      "Source Attribution",
      "Revenue Forecasting",
    ],
  },
];

function PillarsSection() {
  return (
    <section id="features" className="relative py-28 px-6">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Platform"
          title="Everything a founder needs. Nothing they don't."
          desc="Three tightly integrated systems that replace the ten-tab workflow most founders are stuck in."
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {PILLARS.map((p, i) => (
            <div
              key={p.id}
              className="rise-in group relative overflow-hidden rounded-2xl border bg-surface p-8 shadow-card transition-all duration-300 hover:shadow-hover"
              style={{
                ["--i" as string]: i,
                borderColor: p.borderGlow,
              } as React.CSSProperties}
            >
              {/* Corner glow that appears on hover */}
              <div
                className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background: `radial-gradient(circle, ${p.glowColor}, transparent 70%)`,
                  filter: "blur(16px)",
                }}
              />

              {/* Icon */}
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-card"
                style={{ background: `linear-gradient(135deg, ${p.iconGrad[0]}, ${p.iconGrad[1]})` }}
              >
                <p.icon className="h-6 w-6" />
              </div>

              <div className="mt-5 text-[10.5px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {p.label}
              </div>
              <h3 className="mt-2 font-display text-[1.2rem] font-semibold leading-snug tracking-tight">
                {p.title}
              </h3>
              <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">{p.desc}</p>

              <ul className="mt-7 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-[13px]">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Link to="/auth/sign-up">
                  <button className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-surface-2 px-4 py-2 text-[12.5px] font-medium transition-all hover:border-primary/40 hover:text-primary">
                    Get started <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── TOOLS ─────────────────────────────── */

const TOOLS = [
  { icon: Lightbulb,  name: "Idea Validator",     desc: "Pressure-test market fit in 60 sec",    live: true  },
  { icon: Megaphone,  name: "Pitch Generator",    desc: "Investor-ready deck copy",              live: true  },
  { icon: Target,     name: "GTM Strategy",       desc: "Channel plan + ICP messaging map",      live: true  },
  { icon: Zap,        name: "Offer Builder",      desc: "Irresistible offer with risk reversal", live: true  },
  { icon: Settings2,  name: "Ops Plan",           desc: "Workflows, automations, KPIs",          live: true  },
  { icon: Mail,       name: "Follow-Up Sequence", desc: "Multi-touch email + DM sequences",      live: true  },
  { icon: Globe,      name: "Website Auditor",    desc: "AI audit of your live site",            live: true  },
  { icon: Skull,      name: "Kill My Idea",       desc: "Stress-test against the harshest objections", live: true  },
  { icon: Trophy,     name: "Funding Score",      desc: "How investable is your idea right now", live: false },
  { icon: UserPlus,   name: "First 10 Customers", desc: "Tactical roadmap to first revenue",     live: false },
  { icon: FileText,   name: "Business Plan",      desc: "Shareable document-style operating plan",live: false },
  { icon: GitCompare, name: "Idea vs Idea",       desc: "Side-by-side comparison of two ideas",  live: false },
];

function ToolsSection() {
  return (
    <section id="tools" className="relative overflow-hidden py-28 px-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(80rem 44rem at 50% 100%, color-mix(in oklab, var(--primary) 9%, transparent), transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="AI Launchpad"
          title="12 tools. Every founder workflow."
          desc="From validating your idea to generating investor emails — each tool ships a polished, ready-to-use asset in under a minute."
        />

        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((t, i) => (
            <div
              key={t.name}
              className="rise-in group relative rounded-xl border border-border bg-surface p-5 shadow-card transition-all hover:border-primary/25 hover:shadow-hover"
              style={{ ["--i" as string]: Math.floor(i / 4) } as React.CSSProperties}
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110",
                  t.live ? "bg-primary/10 text-primary" : "bg-surface-2 text-muted-foreground/60",
                )}
              >
                <t.icon className="h-4 w-4" />
              </div>
              <div className="mt-3.5 text-[13.5px] font-semibold leading-tight">{t.name}</div>
              <div className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{t.desc}</div>
              <div className="mt-4">
                {t.live ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                    Available now <ArrowRight className="h-3 w-3" />
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-muted-foreground/50">Coming soon</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── HOW IT WORKS ─────────────────────────────── */

const STEPS = [
  {
    n: "01",
    icon: Lightbulb,
    title: "Start with your idea",
    desc: "Describe your business, target customer, and goals. Nova's AI immediately pressure-tests and shapes it into something real.",
  },
  {
    n: "02",
    icon: Rocket,
    title: "Generate every asset",
    desc: "Run Launchpad tools in sequence — pitch, GTM, offer, ops plan, investor emails. Each tool builds on the last.",
  },
  {
    n: "03",
    icon: Workflow,
    title: "Automate and scale",
    desc: "Wire Nova OS to your existing stack. Lead capture, follow-up, onboarding, invoicing — all on autopilot while you focus on growth.",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="relative py-28 px-6">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="How it works"
          title="Idea to revenue. In days, not months."
          desc="A three-step sequence that takes you from zero to a running, automated business — without hiring an ops team."
        />

        <div className="mt-16 grid gap-10 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className="rise-in relative"
              style={{ ["--i" as string]: i } as React.CSSProperties}
            >
              {/* Connector */}
              {i < STEPS.length - 1 && (
                <div className="pointer-events-none absolute left-[calc(100%+1rem)] top-7 hidden h-px w-8 bg-gradient-to-r from-border to-transparent lg:block" />
              )}

              {/* Step icon */}
              <div className="relative mb-6 inline-flex">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-card"
                  style={{ background: "color-mix(in oklab, var(--primary) 10%, var(--surface))", border: "1px solid color-mix(in oklab, var(--primary) 20%, transparent)" }}
                >
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
                {/* Step number badge */}
                <span
                  className="absolute -right-2.5 -top-2.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
                >
                  {i + 1}
                </span>
              </div>

              <div className="font-mono text-[10.5px] font-bold tracking-widest text-muted-foreground/40">
                {s.n}
              </div>
              <h3 className="mt-2 font-display text-[1.2rem] font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── STATS ─────────────────────────────── */

const STATS = [
  { n: "$14k",    label: "Avg. month-1 revenue recovered",  icon: TrendingUp },
  { n: "6 hrs",   label: "Saved per week on follow-up",     icon: Cpu },
  { n: "90 sec",  label: "Average lead response time",      icon: Inbox },
  { n: "14 days", label: "From idea to live business",      icon: FolderOpen },
];

function StatsSection() {
  return (
    <section className="relative overflow-hidden py-20 px-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--primary) 6%, transparent), color-mix(in oklab, var(--accent) 6%, transparent))",
        }}
      />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={s.n}
              className="rise-in card-lift rounded-2xl border border-border bg-surface p-6 text-center shadow-card"
              style={{ ["--i" as string]: i } as React.CSSProperties}
            >
              <div
                className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl text-primary"
                style={{ background: "color-mix(in oklab, var(--primary) 10%, var(--surface-2))" }}
              >
                <s.icon className="h-5 w-5" />
              </div>
              <div className="text-gradient mt-5 font-display text-[2.25rem] font-semibold leading-none tracking-tight">
                {s.n}
              </div>
              <div className="mt-2.5 text-[12.5px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── CTA ─────────────────────────────── */

function CtaSection({ startDemo }: { startDemo: () => void }) {
  return (
    <section className="relative overflow-hidden px-6 py-28">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-mesh-animated opacity-60" />
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(80rem 50rem at 50% 50%, color-mix(in oklab, var(--primary) 12%, transparent), transparent 65%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-dotgrid opacity-20" />

      {/* Card */}
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-border/60 bg-surface/80 p-12 text-center shadow-hover backdrop-blur-sm">
        {/* Inner glow */}
        <div
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-40"
          style={{
            background:
              "radial-gradient(40rem 24rem at 50% 0%, color-mix(in oklab, var(--primary) 16%, transparent), transparent 60%)",
          }}
        />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-4 py-1.5 text-[12px] font-medium text-success">
            <Star className="h-3.5 w-3.5" />
            Free to start — no credit card needed
          </div>

          <h2
            className="mt-8 font-display font-semibold tracking-tight"
            style={{ fontSize: "clamp(1.9rem, 5vw, 3.25rem)", lineHeight: 1.08 }}
          >
            Ready to run your business{" "}
            <span className="text-gradient">like an OS?</span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-[15.5px] leading-relaxed text-muted-foreground">
            Join founders who've replaced their ten-tab workflow with one intelligent system.
            Start with the live demo — no setup, no credit card.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={startDemo}
              className="group inline-flex h-12 items-center gap-2 rounded-xl px-8 text-[15px] font-semibold text-white shadow-[0_8px_32px_rgba(37,99,235,0.30)] transition-all hover:shadow-[0_14px_44px_rgba(37,99,235,0.40)]"
              style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)" }}
            >
              Try live demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <Link to="/auth/sign-up">
              <button className="inline-flex h-12 items-center gap-2 rounded-xl border border-border/70 bg-surface-2 px-8 text-[15px] font-medium transition-all hover:border-primary/40 hover:text-primary">
                Create free account
              </button>
            </Link>
          </div>

          <div className="mt-7 flex items-center justify-center gap-7 text-[12px] text-muted-foreground">
            {["No credit card", "Instant access", "Cancel anytime"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-success" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── FOOTER ─────────────────────────────── */

function LandingFooter() {
  return (
    <footer className="border-t border-border/50 px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 md:flex-row md:justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md text-white"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
          >
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="font-display text-[13px] font-semibold">Nova OPS</span>
          <span className="text-[11px] text-muted-foreground">— AI Business OS</span>
        </div>

        <div className="flex items-center gap-6 text-[12.5px] text-muted-foreground">
          <Link to="/auth/sign-in" className="transition hover:text-foreground">Sign in</Link>
          <Link to="/auth/sign-up" className="transition hover:text-foreground">Sign up free</Link>
          <span>© {new Date().getFullYear()} Nova OPS</span>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────── SHARED ─────────────────────────────── */

function SectionHeader({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div className="text-center">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</div>
      <h2
        className="mt-3 font-display font-semibold tracking-tight leading-tight"
        style={{ fontSize: "clamp(1.7rem, 4vw, 2.9rem)" }}
      >
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}
