import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, Rocket, Zap, ArrowRight, Check, Lightbulb, Target, Megaphone,
  Inbox, Globe, Mail, Skull, Trophy, UserPlus, FileText, GitCompare,
  Settings2, TrendingUp, Cpu, FolderOpen, Star, Users, Workflow, Tags, LineChart,
} from "lucide-react";
import { guestStore } from "@/lib/guest";

export const Route = createFileRoute("/")({ component: LandingPage });

/* ─────────────────────────── HOOKS ─────────────────────────── */

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

/* ─────────────────────────── CUSTOM CURSOR ─────────────────────────── */

function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: -200, y: -200 });
  const ring = useRef({ x: -200, y: -200 });
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Hide on touch devices
    if (window.matchMedia("(pointer: coarse)").matches) { setHidden(true); return; }
    document.body.style.cursor = "none";

    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
    };

    let raf: number;
    const animate = () => {
      ring.current.x += (mouse.current.x - ring.current.x) * 0.11;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.11;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x}px, ${ring.current.y}px)`;
      }
      raf = requestAnimationFrame(animate);
    };

    const onEnter = (e: Event) => {
      if ((e.target as HTMLElement).closest("a, button")) {
        if (ringRef.current) { ringRef.current.style.scale = "2.2"; ringRef.current.style.opacity = "0.7"; }
        if (dotRef.current) dotRef.current.style.scale = "0.4";
      }
    };
    const onLeave = () => {
      if (ringRef.current) { ringRef.current.style.scale = "1"; ringRef.current.style.opacity = "1"; }
      if (dotRef.current) dotRef.current.style.scale = "1";
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onEnter);
    window.addEventListener("mouseout", onLeave);
    raf = requestAnimationFrame(animate);
    return () => {
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onEnter);
      window.removeEventListener("mouseout", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (hidden) return null;
  return (
    <>
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] -translate-x-1/2 -translate-y-1/2 will-change-transform"
        style={{
          width: 8, height: 8, borderRadius: "50%", background: "#3b82f6",
          boxShadow: "0 0 10px rgba(59,130,246,1), 0 0 22px rgba(59,130,246,0.6)",
          transition: "scale 0.2s ease",
        }}
      />
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[9998] -translate-x-1/2 -translate-y-1/2 will-change-transform"
        style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "1.5px solid rgba(139,92,246,0.75)",
          boxShadow: "0 0 14px rgba(139,92,246,0.25), inset 0 0 14px rgba(139,92,246,0.08)",
          transition: "scale 0.4s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease",
        }}
      />
    </>
  );
}

/* ─────────────────────────── FADE-IN WRAPPER ─────────────────────────── */

function FadeIn({
  children, delay = 0, className = "", direction = "up",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "left" | "right" | "none";
}) {
  const [ref, inView] = useInView();
  const tx = direction === "left" ? "-40px" : direction === "right" ? "40px" : "0px";
  const ty = direction === "up" ? "40px" : "0px";
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : `translate(${tx}, ${ty})`,
        filter: inView ? "blur(0px)" : "blur(8px)",
        transition: `opacity 0.85s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.85s cubic-bezier(0.16,1,0.3,1) ${delay}ms, filter 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────── MAGNETIC BUTTON ─────────────────────────── */

function MagneticBtn({
  children, onClick, className = "", style = {},
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * 0.32;
    const y = (e.clientY - (r.top + r.height / 2)) * 0.32;
    el.style.transform = `translate(${x}px, ${y}px)`;
    el.style.transition = "transform 0.1s ease";
  };
  const onLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = "translate(0,0)";
    ref.current.style.transition = "transform 0.65s cubic-bezier(0.16,1,0.3,1)";
  };
  return (
    <button ref={ref} onClick={onClick} onMouseMove={onMove} onMouseLeave={onLeave}
      className={className} style={style}>
      {children}
    </button>
  );
}

/* ─────────────────────────── COUNTER ─────────────────────────── */

function Counter({ value, prefix, suffix, started }: {
  value: number; prefix: string; suffix: string; started: boolean;
}) {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!started) return;
    let startTs: number;
    const step = (ts: number) => {
      if (!startTs) startTs = ts;
      const progress = Math.min((ts - startTs) / 2200, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(step);
      else setDone(true);
    };
    requestAnimationFrame(step);
  }, [started, value]);

  return (
    <span style={done ? {
      animation: "statGlow 0.8s ease-out both",
      display: "inline-block",
    } : { display: "inline-block" }}>
      {prefix}{count}{suffix}
    </span>
  );
}

/* ─────────────────────────── SECTION HEADER ─────────────────────────── */

function SectionHeader({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div className="text-center">
      <FadeIn>
        <div style={{
          display: "inline-block",
          fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.2em",
          textTransform: "uppercase", color: "#3b82f6",
          padding: "4px 14px",
          borderRadius: "999px",
          border: "1px solid rgba(59,130,246,0.3)",
          background: "rgba(59,130,246,0.08)",
          marginBottom: "16px",
        }}>
          {eyebrow}
        </div>
      </FadeIn>
      <FadeIn delay={80}>
        <h2 style={{
          fontFamily: "Inter Display, Inter, sans-serif",
          fontSize: "clamp(1.8rem, 4vw, 3rem)",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          color: "#f0f4ff",
          marginTop: 0,
        }}>
          {title}
        </h2>
      </FadeIn>
      <FadeIn delay={160}>
        <p style={{
          marginTop: "16px",
          fontSize: "15.5px",
          lineHeight: 1.7,
          color: "rgba(240,244,255,0.55)",
          maxWidth: "600px",
          margin: "16px auto 0",
        }}>
          {desc}
        </p>
      </FadeIn>
    </div>
  );
}

/* ─────────────────────────── DATA ─────────────────────────── */

const STATS = [
  { value: 14,  prefix: "$", suffix: "k",    label: "Avg. month-1 revenue recovered", icon: TrendingUp },
  { value: 6,   prefix: "",  suffix: " hrs",  label: "Saved per week on follow-up",    icon: Cpu        },
  { value: 90,  prefix: "",  suffix: " sec",  label: "Average lead response time",     icon: Inbox      },
  { value: 14,  prefix: "",  suffix: " days", label: "From idea to live business",     icon: FolderOpen },
];

const TOOLS = [
  { icon: Lightbulb,  name: "Idea Validator",     desc: "Pressure-test market fit in 60 sec",          live: true  },
  { icon: Megaphone,  name: "Pitch Generator",    desc: "Investor-ready deck copy, instantly",          live: true  },
  { icon: Target,     name: "GTM Strategy",       desc: "Channel plan + ICP messaging map",            live: true  },
  { icon: Zap,        name: "Offer Builder",      desc: "Irresistible offer with risk reversal",        live: true  },
  { icon: Settings2,  name: "Ops Plan",           desc: "Workflows, automations, KPIs",                 live: true  },
  { icon: Mail,       name: "Follow-Up Sequence", desc: "Multi-touch email + DM sequences",             live: true  },
  { icon: Globe,      name: "Website Auditor",    desc: "AI audit of your live site",                   live: true  },
  { icon: Skull,      name: "Kill My Idea",       desc: "Stress-test every fatal flaw",                 live: true  },
  { icon: Trophy,     name: "Funding Score",      desc: "How investable is your idea right now",        live: false },
  { icon: UserPlus,   name: "First 10 Customers", desc: "Tactical roadmap to first revenue",            live: false },
  { icon: FileText,   name: "Business Plan",      desc: "Shareable document-style operating plan",      live: false },
  { icon: GitCompare, name: "Idea vs Idea",       desc: "Side-by-side comparison of two ideas",         live: false },
  { icon: Tags,       name: "Pricing Strategy",   desc: "Tiered pricing model for your offer",          live: false },
  { icon: LineChart,  name: "Revenue Projector",  desc: "12-month ARR forecast with milestones",        live: false },
];

const PILLARS = [
  {
    id: "launchpad", label: "Launchpad", icon: Rocket,
    gradient: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    glow: "rgba(59,130,246,0.2)", border: "rgba(59,130,246,0.25)",
    title: "AI tools that do the thinking",
    desc: "17 specialized generators produce investor pitches, GTM strategies, offer blueprints, and more — in under 60 seconds.",
    features: ["Business Idea Validator", "Pitch Generator", "GTM Strategy Builder", "Offer & Pricing Designer", "Kill My Idea (stress-test)", "Investor Email Sequences"],
  },
  {
    id: "nova", label: "Nova OS", icon: Zap,
    gradient: "linear-gradient(135deg, #8b5cf6, #f97316)",
    glow: "rgba(139,92,246,0.2)", border: "rgba(139,92,246,0.25)",
    title: "Automation that runs your ops",
    desc: "Six business modules handle lead capture, follow-up sequences, client onboarding, and more — all on autopilot.",
    features: ["Lead Capture & Routing", "Multi-touch Follow-Up", "Client Onboarding Flow", "Invoice & Payment Tracker", "Reputation Manager", "Reporting Dashboard"],
  },
  {
    id: "crm", label: "Pipeline CRM", icon: Users,
    gradient: "linear-gradient(135deg, #f97316, #3b82f6)",
    glow: "rgba(249,115,22,0.15)", border: "rgba(249,115,22,0.22)",
    title: "Track every deal, close more",
    desc: "A lightweight CRM built into the same workspace — no exports or integrations required. Visual pipeline, activity log, revenue forecasting.",
    features: ["Visual Kanban Pipeline", "Lead Stage Automation", "Activity Timeline", "Won/Lost Analytics", "Source Attribution", "Revenue Forecasting"],
  },
];

const STEPS = [
  { n: "01", icon: Lightbulb, title: "Start with your idea",  desc: "Describe your business, target customer, and goals. Nova's AI immediately pressure-tests and shapes it into something real." },
  { n: "02", icon: Rocket,    title: "Generate every asset",  desc: "Run Launchpad tools in sequence — pitch, GTM, offer, ops plan, investor emails. Each tool builds on the last." },
  { n: "03", icon: Workflow,  title: "Automate and scale",    desc: "Wire Nova OS to your existing stack. Lead capture, follow-up, onboarding, invoicing — all on autopilot while you focus on growth." },
];

/* ─────────────────────────── LANDING PAGE ─────────────────────────── */

function LandingPage() {
  const navigate = useNavigate();
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled && session) navigate({ to: "/app/dashboard" });
    });
    return () => { cancelled = true; };
  }, [navigate]);

  const startDemo = () => { guestStore.enable(); navigate({ to: "/app/dashboard" }); };

  return (
    <>
      <CustomCursor />
      <style>{`
        @keyframes wordIn {
          from { opacity: 0; transform: translateY(110%) skewY(4deg); filter: blur(12px); }
          to   { opacity: 1; transform: translateY(0) skewY(0); filter: blur(0); }
        }
        @keyframes statGlow {
          0%   { text-shadow: none; }
          40%  { text-shadow: 0 0 40px rgba(59,130,246,0.9), 0 0 80px rgba(139,92,246,0.5); }
          100% { text-shadow: 0 0 12px rgba(59,130,246,0.3); }
        }
        @keyframes heroFloat {
          0%,100% { transform: translateY(0px); }
          50%     { transform: translateY(-18px); }
        }
        @keyframes badgePulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
          50%     { box-shadow: 0 0 0 8px rgba(59,130,246,0); }
        }
        @keyframes scrollHint {
          0%,100% { opacity: 0.3; transform: translateY(0); }
          50%     { opacity: 0.8; transform: translateY(6px); }
        }
        * { cursor: none !important; }
        @media (pointer: coarse) { * { cursor: auto !important; } }
      `}</style>

      <div style={{ background: "#080810", color: "#f0f4ff", overflowX: "hidden", minHeight: "100vh" }}>
        <LandingNav startDemo={startDemo} />
        <HeroSection startDemo={startDemo} />
        <LogoStrip />
        <PillarsSection />
        <HorizontalToolsSection />
        <HowItWorks />
        <StatsSection />
        <CtaSection startDemo={startDemo} />
        <LandingFooter />
      </div>
    </>
  );
}

/* ─────────────────────────── NAV ─────────────────────────── */

function LandingNav({ startDemo }: { startDemo: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header style={{
      position: "fixed", inset: "0 0 auto 0", zIndex: 50, height: 64,
      background: scrolled ? "rgba(8,8,16,0.88)" : "transparent",
      backdropFilter: scrolled ? "blur(24px) saturate(1.8)" : "none",
      borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
      transition: "background 0.4s ease, backdrop-filter 0.4s ease, border-color 0.4s ease",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            boxShadow: "0 0 20px rgba(59,130,246,0.4)",
          }}>
            <Sparkles style={{ width: 16, height: 16, color: "#fff" }} />
          </div>
          <span style={{ fontFamily: "Inter Display, Inter, sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: "-0.02em" }}>
            Nova <span style={{ color: "rgba(240,244,255,0.4)", fontWeight: 400 }}>OPS</span>
          </span>
        </div>

        {/* Center nav */}
        <nav style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {[{ label: "Features", href: "#features" }, { label: "Tools", href: "#tools" }, { label: "How it works", href: "#how" }].map((l) => (
            <a key={l.label} href={l.href} style={{
              fontSize: 13.5, color: "rgba(240,244,255,0.55)", textDecoration: "none",
              transition: "color 0.2s",
            }}
              onMouseEnter={e => { (e.target as HTMLElement).style.color = "#f0f4ff"; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.color = "rgba(240,244,255,0.55)"; }}
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Link to="/auth/sign-in">
            <button style={{
              height: 36, padding: "0 16px", borderRadius: 10, fontSize: 13, fontWeight: 500,
              background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(240,244,255,0.7)",
              transition: "border-color 0.2s, color 0.2s",
            }}
              onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = "rgba(59,130,246,0.5)"; el.style.color = "#f0f4ff"; }}
              onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = "rgba(255,255,255,0.1)"; el.style.color = "rgba(240,244,255,0.7)"; }}
            >
              Sign in
            </button>
          </Link>
          <MagneticBtn
            onClick={startDemo}
            style={{
              height: 36, padding: "0 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              color: "#fff", border: "none",
              boxShadow: "0 4px 16px rgba(59,130,246,0.35)",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            Get started <ArrowRight style={{ width: 13, height: 13 }} />
          </MagneticBtn>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────── HERO ─────────────────────────── */

function HeroSection({ startDemo }: { startDemo: () => void }) {
  const scrollY = useScrollY();
  const orbRef1 = useRef<HTMLDivElement>(null);
  const orbRef2 = useRef<HTMLDivElement>(null);
  const meshRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (meshRef.current) meshRef.current.style.transform = `translateY(${scrollY * 0.3}px)`;
    if (orbRef1.current) orbRef1.current.style.transform = `translateY(${scrollY * 0.18}px)`;
    if (orbRef2.current) orbRef2.current.style.transform = `translateY(${scrollY * 0.24}px)`;
  }, [scrollY]);

  const words1 = "The AI operating system".split(" ");
  const words2 = "built for founders.".split(" ");

  return (
    <section style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "112px 24px 80px", overflow: "hidden" }}>

      {/* Parallax mesh */}
      <div ref={meshRef} style={{
        position: "absolute", inset: "-20%", pointerEvents: "none", willChange: "transform",
        background: "radial-gradient(80rem 50rem at 20% 30%, rgba(59,130,246,0.14), transparent 60%), radial-gradient(60rem 40rem at 80% 20%, rgba(139,92,246,0.12), transparent 60%), radial-gradient(50rem 35rem at 50% 80%, rgba(6,182,212,0.08), transparent 60%)",
      }} />

      {/* Dot grid */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.25,
        backgroundImage: "radial-gradient(rgba(59,130,246,0.5) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />

      {/* Orb 1 */}
      <div ref={orbRef1} style={{
        position: "absolute", top: "15%", left: "-10%", width: 600, height: 600,
        borderRadius: "50%", pointerEvents: "none", willChange: "transform",
        background: "radial-gradient(circle, rgba(59,130,246,0.22), transparent 70%)",
        filter: "blur(64px)", animation: "heroFloat 20s ease-in-out infinite",
      }} />

      {/* Orb 2 */}
      <div ref={orbRef2} style={{
        position: "absolute", top: "25%", right: "-12%", width: 500, height: 500,
        borderRadius: "50%", pointerEvents: "none", willChange: "transform",
        background: "radial-gradient(circle, rgba(139,92,246,0.18), transparent 70%)",
        filter: "blur(64px)", animation: "heroFloat 26s ease-in-out infinite reverse",
      }} />

      {/* Orange bottom orb */}
      <div style={{
        position: "absolute", bottom: "-5%", left: "50%", transform: "translateX(-50%)",
        width: 700, height: 320, borderRadius: "50%", pointerEvents: "none",
        background: "radial-gradient(circle, rgba(249,115,22,0.1), transparent 70%)",
        filter: "blur(60px)",
      }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 10, maxWidth: 900, margin: "0 auto" }}>

        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          borderRadius: 999, border: "1px solid rgba(59,130,246,0.3)",
          background: "rgba(59,130,246,0.08)", padding: "6px 18px",
          fontSize: 12, fontWeight: 600, color: "#60a5fa",
          backdropFilter: "blur(12px)",
          animation: "badgePulse 3s ease-in-out infinite, pageIn 0.6s both",
          marginBottom: 32,
        }}>
          <span style={{
            position: "relative", display: "inline-flex", width: 8, height: 8,
          }}>
            <span style={{
              position: "absolute", inset: 0, borderRadius: "50%", background: "#3b82f6",
              animation: "ping 1.4s cubic-bezier(0,0,0.2,1) infinite", opacity: 0.6,
            }} />
            <span style={{ position: "relative", width: 8, height: 8, borderRadius: "50%", background: "#3b82f6" }} />
          </span>
          Kill My Idea tool is now live — try it free
          <ArrowRight style={{ width: 13, height: 13, opacity: 0.6 }} />
        </div>

        {/* Split-word headline */}
        <h1 style={{
          fontFamily: "Inter Display, Inter, sans-serif",
          fontSize: "clamp(2.6rem, 6.5vw, 5rem)",
          fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.03,
          margin: 0,
        }}>
          <span style={{ display: "block", overflow: "hidden" }}>
            {words1.map((w, i) => (
              <span key={i} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom", marginRight: "0.28em" }}>
                <span style={{ display: "inline-block", animation: `wordIn 0.9s cubic-bezier(0.16,1,0.3,1) ${i * 90}ms both` }}>
                  {w}
                </span>
              </span>
            ))}
          </span>
          <span style={{ display: "block", overflow: "hidden" }}>
            {words2.map((w, i) => (
              <span key={i} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom", marginRight: "0.28em" }}>
                <span style={{
                  display: "inline-block",
                  animation: `wordIn 0.9s cubic-bezier(0.16,1,0.3,1) ${(words1.length + i) * 90 + 80}ms both`,
                  background: "linear-gradient(110deg, #3b82f6 0%, #6366f1 40%, #8b5cf6 70%, #06b6d4 100%)",
                  backgroundSize: "300% 100%",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  animation2: "brandShift 6s ease-in-out infinite",
                }}>
                  {w}
                </span>
              </span>
            ))}
          </span>
        </h1>

        {/* Subheadline */}
        <p style={{
          maxWidth: 640, margin: "28px auto 0", fontSize: "clamp(1rem, 2vw, 1.2rem)",
          lineHeight: 1.7, color: "rgba(240,244,255,0.55)",
          animation: "pageIn 0.9s cubic-bezier(0.16,1,0.3,1) 600ms both",
        }}>
          Go from idea to automated revenue without juggling ten tools.
          Nova OPS combines AI generation, automation pipelines, and a
          lightweight CRM into one intelligent workspace.
        </p>

        {/* CTAs */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 44,
          animation: "pageIn 0.9s cubic-bezier(0.16,1,0.3,1) 700ms both",
        }}>
          <MagneticBtn
            onClick={startDemo}
            style={{
              height: 52, padding: "0 36px", borderRadius: 14, fontSize: 15.5, fontWeight: 700,
              color: "#fff", border: "none",
              background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)",
              boxShadow: "0 0 0 1px rgba(59,130,246,0.4), 0 8px 32px rgba(59,130,246,0.35), 0 0 60px rgba(59,130,246,0.1)",
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            Try the live demo <ArrowRight style={{ width: 16, height: 16 }} />
          </MagneticBtn>
          <Link to="/auth/sign-up">
            <MagneticBtn style={{
              height: 52, padding: "0 32px", borderRadius: 14, fontSize: 15.5, fontWeight: 600,
              background: "rgba(255,255,255,0.04)", color: "#f0f4ff",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(12px)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              Sign up free
            </MagneticBtn>
          </Link>
        </div>

        <p style={{
          fontSize: 12, color: "rgba(240,244,255,0.3)", marginTop: 16,
          animation: "pageIn 0.9s cubic-bezier(0.16,1,0.3,1) 800ms both",
        }}>
          No credit card · Instant access · Cancel anytime
        </p>

        {/* Stats pill */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          maxWidth: 480, margin: "64px auto 0",
          borderRadius: 18, overflow: "hidden",
          border: "1px solid rgba(59,130,246,0.15)",
          boxShadow: "0 0 0 1px rgba(59,130,246,0.06), 0 8px 32px rgba(0,0,0,0.5)",
          animation: "pageIn 0.9s cubic-bezier(0.16,1,0.3,1) 900ms both",
        }}>
          {[{ n: "14+", label: "AI tools" }, { n: "6", label: "OS modules" }, { n: "14 days", label: "To go live" }].map((s, i) => (
            <div key={s.n} style={{
              background: "rgba(13,13,30,0.8)", backdropFilter: "blur(20px)",
              padding: "20px 16px", textAlign: "center",
              borderRight: i < 2 ? "1px solid rgba(59,130,246,0.1)" : "none",
            }}>
              <div style={{
                fontFamily: "Inter Display, Inter, sans-serif",
                fontSize: "1.8rem", fontWeight: 700, letterSpacing: "-0.03em",
                background: "linear-gradient(110deg, #3b82f6, #8b5cf6)",
                WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
              }}>{s.n}</div>
              <div style={{ fontSize: 11.5, color: "rgba(240,244,255,0.45)", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll hint */}
      <div style={{
        position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        color: "rgba(240,244,255,0.25)",
      }}>
        <div style={{ width: 1, height: 48, background: "linear-gradient(to bottom, transparent, rgba(59,130,246,0.5), transparent)", animation: "scrollHint 2s ease-in-out infinite" }} />
        <span style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase" }}>Scroll</span>
      </div>
    </section>
  );
}

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    let ticking = false;
    const fn = () => {
      if (!ticking) { requestAnimationFrame(() => { setY(window.scrollY); ticking = false; }); ticking = true; }
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return y;
}

/* ─────────────────────────── LOGO STRIP ─────────────────────────── */

function LogoStrip() {
  const items = ["Founders", "Consultants", "Agencies", "Coaches", "SaaS builders", "Service businesses", "Solopreneurs"];
  return (
    <div style={{
      borderTop: "1px solid rgba(255,255,255,0.05)",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
      background: "rgba(13,13,30,0.5)", backdropFilter: "blur(12px)",
      padding: "20px 24px",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "8px 32px" }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(240,244,255,0.2)" }}>Built for</span>
        {items.map((item) => (
          <span key={item} style={{ fontSize: 13.5, fontWeight: 500, color: "rgba(240,244,255,0.45)" }}>{item}</span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── PILLARS ─────────────────────────── */

function PillarsSection() {
  return (
    <section id="features" style={{ padding: "120px 24px", position: "relative" }}>
      {/* Top fade */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 120, pointerEvents: "none", background: "linear-gradient(to bottom, #080810, transparent)" }} />
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <SectionHeader
          eyebrow="Platform"
          title="Everything a founder needs. Nothing they don't."
          desc="Three tightly integrated systems that replace the ten-tab workflow most founders are stuck in."
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginTop: 64 }}>
          {PILLARS.map((p, i) => (
            <FadeIn key={p.id} delay={i * 120}>
              <PillarCard pillar={p} />
            </FadeIn>
          ))}
        </div>
      </div>
      {/* Bottom fade */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120, pointerEvents: "none", background: "linear-gradient(to top, #080810, transparent)" }} />
    </section>
  );
}

function PillarCard({ pillar: p }: { pillar: typeof PILLARS[0] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 24, padding: 36, position: "relative", overflow: "hidden",
        background: "rgba(13,13,30,0.8)",
        border: `1px solid ${hovered ? p.border : "rgba(255,255,255,0.06)"}`,
        boxShadow: hovered ? `0 0 0 1px ${p.border}, 0 20px 60px rgba(0,0,0,0.6), 0 0 80px ${p.glow}` : "0 4px 24px rgba(0,0,0,0.4)",
        transform: hovered ? "translateY(-4px)" : "none",
        transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Top neon line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${p.border}, transparent)`,
        opacity: hovered ? 1 : 0.4, transition: "opacity 0.4s",
      }} />

      {/* Corner glow */}
      <div style={{
        position: "absolute", top: -60, right: -60, width: 200, height: 200,
        borderRadius: "50%", background: `radial-gradient(circle, ${p.glow}, transparent 70%)`,
        filter: "blur(20px)", opacity: hovered ? 1 : 0, transition: "opacity 0.5s",
        pointerEvents: "none",
      }} />

      <div style={{
        width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
        background: p.gradient, boxShadow: `0 4px 20px ${p.glow}, inset 0 1px 0 rgba(255,255,255,0.2)`,
        transform: hovered ? "scale(1.1) rotate(-3deg)" : "none",
        transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <p.icon style={{ width: 22, height: 22, color: "#fff" }} />
      </div>

      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(240,244,255,0.35)", marginTop: 20 }}>{p.label}</div>
      <h3 style={{ fontFamily: "Inter Display, Inter, sans-serif", fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#f0f4ff", marginTop: 8, lineHeight: 1.25 }}>{p.title}</h3>
      <p style={{ fontSize: 13.5, lineHeight: 1.65, color: "rgba(240,244,255,0.5)", marginTop: 12 }}>{p.desc}</p>

      <ul style={{ listStyle: "none", padding: 0, margin: "24px 0 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {p.features.map((f) => (
          <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <span style={{
              flexShrink: 0, width: 18, height: 18, borderRadius: "50%",
              background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Check style={{ width: 10, height: 10, color: "#10b981" }} />
            </span>
            <span style={{ color: "rgba(240,244,255,0.75)" }}>{f}</span>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 32 }}>
        <Link to="/auth/sign-up">
          <button style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(240,244,255,0.7)", transition: "all 0.2s",
          }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = p.border; el.style.color = "#f0f4ff"; el.style.background = `${p.glow.replace("0.2)", "0.08)")}`; }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = "rgba(255,255,255,0.1)"; el.style.color = "rgba(240,244,255,0.7)"; el.style.background = "rgba(255,255,255,0.05)"; }}
          >
            Get started <ArrowRight style={{ width: 13, height: 13 }} />
          </button>
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────────── HORIZONTAL TOOLS SCROLL ─────────────────────────── */

function HorizontalToolsSection() {
  const outerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const outer = outerRef.current;
      const track = trackRef.current;
      if (!outer || !track) return;
      const rect = outer.getBoundingClientRect();
      const scrollableH = outer.offsetHeight - window.innerHeight;
      const scrolled = Math.max(0, -rect.top);
      const progress = Math.min(1, scrolled / scrollableH);
      const maxTravel = track.scrollWidth - window.innerWidth + 96;
      track.style.transform = `translateX(${-progress * Math.max(0, maxTravel)}px)`;
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <section id="tools" style={{ position: "relative" }}>
      {/* Top section fade */}
      <div style={{ position: "absolute", inset: "0 0 auto 0", height: 140, pointerEvents: "none", zIndex: 2, background: "linear-gradient(to bottom, #080810, transparent)" }} />

      <div ref={outerRef} style={{ height: "420vh", position: "relative" }}>
        <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center" }}>

          <div style={{ textAlign: "center", padding: "0 24px 40px" }}>
            <FadeIn>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#3b82f6", marginBottom: 12, display: "inline-block", padding: "4px 14px", borderRadius: 999, border: "1px solid rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.08)" }}>
                AI Launchpad
              </div>
            </FadeIn>
            <FadeIn delay={80}>
              <h2 style={{ fontFamily: "Inter Display, Inter, sans-serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 700, letterSpacing: "-0.03em", color: "#f0f4ff", margin: "0 0 12px" }}>
                14 tools. Every founder workflow.
              </h2>
            </FadeIn>
            <FadeIn delay={160}>
              <p style={{ fontSize: 14.5, color: "rgba(240,244,255,0.45)", maxWidth: 520, margin: "0 auto" }}>
                Scroll to explore. Each tool ships a polished asset in under 60 seconds.
              </p>
            </FadeIn>
          </div>

          {/* Scroll track */}
          <div style={{ overflow: "visible", position: "relative" }}>
            {/* Left fade */}
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 80, zIndex: 4, background: "linear-gradient(to right, #080810, transparent)", pointerEvents: "none" }} />
            {/* Right fade */}
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 80, zIndex: 4, background: "linear-gradient(to left, #080810, transparent)", pointerEvents: "none" }} />

            <div
              ref={trackRef}
              style={{
                display: "flex", gap: 20, padding: "8px 48px 20px",
                willChange: "transform", transition: "none",
                width: "max-content",
              }}
            >
              {TOOLS.map((tool, i) => <HToolCard key={tool.name} tool={tool} index={i} />)}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div style={{ position: "absolute", inset: "auto 0 0 0", height: 140, pointerEvents: "none", zIndex: 2, background: "linear-gradient(to top, #080810, transparent)" }} />
    </section>
  );
}

function HToolCard({ tool, index }: { tool: typeof TOOLS[0]; index: number }) {
  const [hovered, setHovered] = useState(false);
  const iconGrads = [
    "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    "linear-gradient(135deg, #8b5cf6, #c084fc)",
    "linear-gradient(135deg, #3b82f6, #38bdf8)",
    "linear-gradient(135deg, #10b981, #3b82f6)",
    "linear-gradient(135deg, #f97316, #8b5cf6)",
    "linear-gradient(135deg, #06b6d4, #3b82f6)",
    "linear-gradient(135deg, #3b82f6, #6366f1)",
    "linear-gradient(135deg, #ef4444, #f97316)",
  ];
  const grad = tool.live ? iconGrads[index % iconGrads.length] : "rgba(255,255,255,0.05)";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 260, flexShrink: 0, borderRadius: 20, padding: 24,
        background: hovered ? "rgba(17,17,40,0.95)" : "rgba(13,13,30,0.7)",
        border: hovered && tool.live ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.06)",
        boxShadow: hovered && tool.live
          ? "0 0 0 1px rgba(59,130,246,0.15), 0 20px 60px rgba(0,0,0,0.5), 0 0 50px rgba(59,130,246,0.1)"
          : "0 4px 20px rgba(0,0,0,0.3)",
        transform: hovered ? "translateY(-6px) scale(1.02)" : "none",
        transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
        backdropFilter: "blur(20px)",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Neon top edge */}
      {tool.live && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)",
          opacity: hovered ? 1 : 0.3, transition: "opacity 0.4s",
        }} />
      )}

      {/* Icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
        background: grad,
        boxShadow: tool.live ? "0 4px 16px rgba(59,130,246,0.3), inset 0 1px 0 rgba(255,255,255,0.2)" : "none",
        transform: hovered ? "scale(1.12) rotate(-5deg)" : "none",
        transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
        marginBottom: 16,
      }}>
        <tool.icon style={{ width: 20, height: 20, color: tool.live ? "#fff" : "rgba(240,244,255,0.25)" }} />
      </div>

      <div style={{ fontSize: 14.5, fontWeight: 700, color: tool.live ? "#f0f4ff" : "rgba(240,244,255,0.4)", letterSpacing: "-0.01em", marginBottom: 6 }}>
        {tool.name}
      </div>
      <div style={{ fontSize: 12.5, color: "rgba(240,244,255,0.45)", lineHeight: 1.55, marginBottom: 16 }}>
        {tool.desc}
      </div>

      {/* Badge */}
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        fontSize: 10.5, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
        background: tool.live ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${tool.live ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.08)"}`,
        color: tool.live ? "#10b981" : "rgba(240,244,255,0.25)",
      }}>
        {tool.live && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981", display: "inline-block" }} />}
        {tool.live ? "Live" : "Coming soon"}
      </span>
    </div>
  );
}

/* ─────────────────────────── HOW IT WORKS ─────────────────────────── */

function HowItWorks() {
  return (
    <section id="how" style={{ padding: "120px 24px", position: "relative" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 120, pointerEvents: "none", background: "linear-gradient(to bottom, #080810, transparent)" }} />
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <SectionHeader
          eyebrow="How it works"
          title="Idea to revenue. In days, not months."
          desc="A three-step sequence that takes you from zero to a running, automated business — without hiring an ops team."
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 40, marginTop: 72 }}>
          {STEPS.map((s, i) => (
            <FadeIn key={s.n} delay={i * 140}>
              <div style={{ position: "relative" }}>
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div style={{
                    position: "absolute", top: 28, left: "calc(100% + 20px)", width: 40, height: 1,
                    background: "linear-gradient(to right, rgba(59,130,246,0.4), transparent)",
                    display: "none", // shown via CSS on lg
                  }} />
                )}

                <div style={{ position: "relative", marginBottom: 24, display: "inline-flex" }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)",
                    boxShadow: "0 0 30px rgba(59,130,246,0.1)",
                  }}>
                    <s.icon style={{ width: 24, height: 24, color: "#3b82f6" }} />
                  </div>
                  <span style={{
                    position: "absolute", top: -8, right: -8,
                    width: 22, height: 22, borderRadius: "50%",
                    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 800, color: "#fff",
                    boxShadow: "0 0 12px rgba(59,130,246,0.5)",
                  }}>{i + 1}</span>
                </div>

                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.16em", color: "rgba(240,244,255,0.2)", marginBottom: 8 }}>
                  {s.n}
                </div>
                <h3 style={{ fontFamily: "Inter Display, Inter, sans-serif", fontSize: "1.2rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#f0f4ff", margin: "0 0 10px" }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.65, color: "rgba(240,244,255,0.5)", margin: 0 }}>
                  {s.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120, pointerEvents: "none", background: "linear-gradient(to top, #080810, transparent)" }} />
    </section>
  );
}

/* ─────────────────────────── STATS ─────────────────────────── */

function StatsSection() {
  const [sectionRef, inView] = useInView(0.3);
  return (
    <section style={{ padding: "80px 24px", position: "relative" }}>
      {/* Gradient BG */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(135deg, rgba(59,130,246,0.05), rgba(139,92,246,0.05))",
        borderTop: "1px solid rgba(59,130,246,0.08)",
        borderBottom: "1px solid rgba(59,130,246,0.08)",
      }} />

      <div ref={sectionRef} style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, position: "relative" }}>
        {STATS.map((s, i) => (
          <FadeIn key={s.label} delay={i * 100}>
            <StatCard stat={s} started={inView} />
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

function StatCard({ stat, started }: { stat: typeof STATS[0]; started: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 20, padding: "28px 24px", textAlign: "center",
        background: hovered ? "rgba(17,17,40,0.9)" : "rgba(13,13,30,0.6)",
        border: "1px solid rgba(59,130,246,0.12)",
        boxShadow: hovered ? "0 0 40px rgba(59,130,246,0.12), 0 8px 32px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.3)",
        transform: hovered ? "translateY(-3px)" : "none",
        transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12, margin: "0 auto 20px",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
      }}>
        <stat.icon style={{ width: 20, height: 20, color: "#3b82f6" }} />
      </div>
      <div style={{
        fontFamily: "Inter Display, Inter, sans-serif",
        fontSize: "2.4rem", fontWeight: 800, letterSpacing: "-0.04em",
        background: "linear-gradient(110deg, #3b82f6, #8b5cf6)",
        WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
        lineHeight: 1,
      }}>
        <Counter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} started={started} />
      </div>
      <div style={{ fontSize: 12.5, color: "rgba(240,244,255,0.45)", marginTop: 10, lineHeight: 1.4 }}>
        {stat.label}
      </div>
    </div>
  );
}

/* ─────────────────────────── CTA ─────────────────────────── */

function CtaSection({ startDemo }: { startDemo: () => void }) {
  return (
    <section style={{ padding: "120px 24px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(80rem 50rem at 50% 50%, rgba(59,130,246,0.1), transparent 65%)" }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(rgba(59,130,246,0.12) 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.2 }} />

      <FadeIn>
        <div style={{ maxWidth: 720, margin: "0 auto", borderRadius: 28, overflow: "hidden", position: "relative" }}>
          {/* Neon card */}
          <div style={{
            background: "rgba(13,13,30,0.85)", backdropFilter: "blur(32px)",
            border: "1px solid rgba(59,130,246,0.2)",
            boxShadow: "0 0 0 1px rgba(59,130,246,0.08), 0 40px 100px rgba(0,0,0,0.6), inset 0 1px 0 rgba(59,130,246,0.15)",
            padding: "60px 48px", textAlign: "center",
          }}>
            {/* Top neon edge */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.7), rgba(139,92,246,0.5), transparent)" }} />

            {/* Inner glow */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200, pointerEvents: "none", background: "radial-gradient(60rem 16rem at 50% 0%, rgba(59,130,246,0.12), transparent 70%)" }} />

            <div style={{ position: "relative" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 999, border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.1)", padding: "5px 16px", fontSize: 12, fontWeight: 600, color: "#10b981" }}>
                <Star style={{ width: 13, height: 13 }} />
                Free to start — no credit card needed
              </div>

              <h2 style={{
                fontFamily: "Inter Display, Inter, sans-serif",
                fontSize: "clamp(2rem, 5vw, 3.25rem)",
                fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.05,
                color: "#f0f4ff", marginTop: 28, marginBottom: 0,
              }}>
                Ready to run your business{" "}
                <span style={{
                  background: "linear-gradient(110deg, #3b82f6, #8b5cf6)",
                  WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
                }}>
                  like an OS?
                </span>
              </h2>

              <p style={{ fontSize: 15.5, lineHeight: 1.65, color: "rgba(240,244,255,0.5)", maxWidth: 480, margin: "20px auto 0" }}>
                Join founders who've replaced their ten-tab workflow with one intelligent system. Start with the live demo — no setup, no credit card.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 44 }}>
                <MagneticBtn
                  onClick={startDemo}
                  style={{
                    height: 52, padding: "0 36px", borderRadius: 14,
                    fontSize: 15, fontWeight: 700, color: "#fff", border: "none",
                    background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)",
                    boxShadow: "0 0 0 1px rgba(59,130,246,0.4), 0 8px 32px rgba(59,130,246,0.4)",
                    display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  Try live demo <ArrowRight style={{ width: 16, height: 16 }} />
                </MagneticBtn>
                <Link to="/auth/sign-up">
                  <MagneticBtn style={{
                    height: 52, padding: "0 32px", borderRadius: 14,
                    fontSize: 15, fontWeight: 600,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(240,244,255,0.8)",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    Create free account
                  </MagneticBtn>
                </Link>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 28px", justifyContent: "center", marginTop: 28, fontSize: 12.5, color: "rgba(240,244,255,0.35)" }}>
                {["No credit card", "Instant access", "Cancel anytime"].map((t) => (
                  <span key={t} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Check style={{ width: 13, height: 13, color: "#10b981" }} />{t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

/* ─────────────────────────── FOOTER ─────────────────────────── */

function LandingFooter() {
  return (
    <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "40px 32px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", boxShadow: "0 0 16px rgba(59,130,246,0.3)" }}>
            <Sparkles style={{ width: 14, height: 14, color: "#fff" }} />
          </div>
          <span style={{ fontFamily: "Inter Display, Inter, sans-serif", fontWeight: 700, fontSize: 14 }}>Nova OPS</span>
          <span style={{ fontSize: 11.5, color: "rgba(240,244,255,0.3)" }}>— AI Business OS</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 24px", fontSize: 13, color: "rgba(240,244,255,0.35)" }}>
          <Link to="/auth/sign-in" style={{ color: "inherit", textDecoration: "none" }}>Sign in</Link>
          <Link to="/auth/sign-up" style={{ color: "inherit", textDecoration: "none" }}>Sign up free</Link>
          <span>© {new Date().getFullYear()} Nova OPS</span>
        </div>
      </div>
    </footer>
  );
}
