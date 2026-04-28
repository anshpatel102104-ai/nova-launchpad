import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({ component: LandingPage });

function LandingPage() {
  const navigate = useNavigate();
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled && session) navigate({ to: "/app/dashboard" });
    });
    return () => { cancelled = true; };
  }, [navigate]);
  return <CinematicLanding />;
}

// ─── Dashboard mock UI ──────────────────────────────────────────────────────

function DashboardMock() {
  return (
    <div style={{
      width: 860, maxWidth: "90vw", borderRadius: 14,
      background: "#0a0a1c", border: "1px solid rgba(255,255,255,0.09)",
      boxShadow: "0 40px 120px rgba(0,0,0,0.9), 0 0 0 1px rgba(59,130,246,0.07)",
      overflow: "hidden", userSelect: "none", flexShrink: 0,
    }}>
      {/* Traffic lights */}
      <div style={{
        height: 38, background: "#06061a", borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", padding: "0 14px", gap: 7,
      }}>
        {["#ff5f56","#ffbd2e","#27c93f"].map(c => (
          <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c, opacity: 0.85 }} />
        ))}
        <div style={{ flex: 1, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.18)", fontFamily: "monospace" }}>
          nova-os — dashboard
        </div>
      </div>
      {/* Body */}
      <div style={{ display: "flex", height: 490 }}>
        {/* Sidebar */}
        <div style={{ width: 188, background: "#07071a", borderRight: "1px solid rgba(255,255,255,0.05)", padding: "14px 10px" }}>
          {[
            { name: "Dashboard", active: false },
            { name: "Idea Validator", active: true },
            { name: "Pitch Generator", active: false },
            { name: "GTM Strategy", active: false },
            { name: "Funding Score", active: false },
            { name: "Investor Emails", active: false },
            { name: "First 10 Customers", active: false },
          ].map(({ name, active }) => (
            <div key={name} style={{
              padding: "7px 10px", borderRadius: 7, marginBottom: 3, fontSize: 11.5,
              background: active ? "rgba(59,130,246,0.14)" : "transparent",
              color: active ? "#3b82f6" : "rgba(255,255,255,0.38)",
              border: active ? "1px solid rgba(59,130,246,0.22)" : "1px solid transparent",
              fontWeight: active ? 600 : 400,
            }}>{name}</div>
          ))}
        </div>
        {/* Main panel */}
        <div style={{ flex: 1, padding: "22px 24px", overflow: "hidden" }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#f0f4ff", marginBottom: 3 }}>Idea Validator</div>
          <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.3)", marginBottom: 18 }}>Stress-test your concept before you build</div>
          <div style={{
            background: "#0f0f28", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10,
            padding: "13px 15px", marginBottom: 14,
          }}>
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.28)", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.1em" }}>Your idea</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
              AI that writes investor updates in 30 seconds so founders focus on building…
            </div>
          </div>
          {[
            { label: "Market Viability",  pct: 87, color: "#3b82f6" },
            { label: "Competition Level", pct: 64, color: "#8b5cf6" },
            { label: "Execution Risk",    pct: 38, color: "#06b6d4" },
            { label: "Investor Appeal",   pct: 91, color: "#10b981" },
          ].map(({ label, pct, color }) => (
            <div key={label} style={{ marginBottom: 11 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 5 }}>
                <span>{label}</span>
                <span style={{ color, fontWeight: 600 }}>{pct}%</span>
              </div>
              <div style={{ height: 3.5, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                <div style={{ height: 3.5, width: `${pct}%`, background: color, borderRadius: 2, boxShadow: `0 0 8px ${color}55` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Crack SVG paths (viewBox 0 0 100 100, center = 50 50) ──────────────────

const CRACKS = [
  "M50,50 L8,12 L2,0",
  "M50,50 L82,8 L96,0",
  "M50,50 L96,42 L100,28",
  "M50,50 L88,78 L100,92",
  "M50,50 L62,96 L55,100",
  "M50,50 L24,92 L12,100",
  "M50,50 L4,68 L0,82",
  "M50,50 L6,32 L0,18",
];

// ─── Main cinematic component ────────────────────────────────────────────────

function CinematicLanding() {
  const wrapRef        = useRef<HTMLDivElement>(null);
  const heroRef        = useRef<HTMLElement>(null);
  const dashSecRef     = useRef<HTMLElement>(null);
  const flashSecRef    = useRef<HTMLElement>(null);
  const finalSecRef    = useRef<HTMLElement>(null);
  const dashRevealRef  = useRef<HTMLDivElement>(null);
  const dashMockRef    = useRef<HTMLDivElement>(null);
  const ctaBtnRef      = useRef<HTMLButtonElement>(null);
  const floodRef       = useRef<HTMLDivElement>(null);
  const typeRef        = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let gsapCtx: { revert: () => void } | undefined;

    const boot = async () => {
      const { gsap }         = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      const { TextPlugin }    = await import("gsap/TextPlugin");
      gsap.registerPlugin(ScrollTrigger, TextPlugin);

      gsapCtx = gsap.context(() => {

        // ── 1. Hero letter drop-in ──────────────────────────────────────────
        const letters = gsap.utils.toArray<HTMLElement>(".gsap-letter");
        gsap.set(letters, { y: -160, opacity: 0, rotationX: -90, transformOrigin: "50% 0%" });
        gsap.to(letters, {
          y: 0, opacity: 1, rotationX: 0,
          stagger: 0.055, duration: 0.9, ease: "back.out(1.7)", delay: 0.25,
        });

        gsap.set(".gsap-subtitle", { y: 54, opacity: 0 });
        gsap.to(".gsap-subtitle", { y: 0, opacity: 1, duration: 1.1, ease: "power3.out", delay: 1.7 });

        // ── 2. Orb slow pulse ────────────────────────────────────────────────
        gsap.to(".gsap-orb", {
          scale: 1.45, opacity: 0.38, duration: 3.2,
          repeat: -1, yoyo: true, ease: "sine.inOut",
        });

        // ── 3. Pinned crack + reveal ─────────────────────────────────────────
        gsap.set(".gsap-crack-svg", { opacity: 0 });
        gsap.set(".gsap-crack-path", (i: number, el: SVGPathElement) => {
          const len = el.getTotalLength?.() ?? 300;
          gsap.set(el, { strokeDasharray: len, strokeDashoffset: len });
        });
        gsap.set(dashRevealRef.current, { scale: 0.04, opacity: 0 });
        gsap.set(".gsap-hero-text", { opacity: 1 });

        const crackTl = gsap.timeline({ defaults: { ease: "none" } });
        crackTl
          .to(".gsap-hero-text",    { opacity: 0, duration: 0.18 })
          .to(".gsap-crack-svg",    { opacity: 1, duration: 0.05 }, "<")
          .to(".gsap-crack-path",   { strokeDashoffset: 0, stagger: 0.07, duration: 0.32 }, "<0.06")
          .to(dashRevealRef.current, { scale: 1, opacity: 1, duration: 0.55, ease: "power2.out" }, "-=0.12")
          .to(".gsap-crack-svg",    { opacity: 0, duration: 0.18 }, "-=0.06");

        ScrollTrigger.create({
          trigger: heroRef.current,
          start: "top top",
          end: "+=290%",
          pin: true,
          scrub: 2,
          animation: crackTl,
        });

        // ── 4. Pinned dashboard zoom into Idea Validator ─────────────────────
        gsap.set(".gsap-tool-overlay", { opacity: 0 });

        const zoomTl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
        zoomTl
          .to(dashMockRef.current, { scale: 2.6, x: -160, y: -90, duration: 0.4 })
          .to(".gsap-tool-overlay",  { opacity: 1, duration: 0.22 }, "-=0.05")
          .to(".gsap-tool-overlay",  { opacity: 0, duration: 0.2 },  "+=0.38")
          .to(dashMockRef.current, { scale: 1, x: 0, y: 0, duration: 0.4 });

        ScrollTrigger.create({
          trigger: dashSecRef.current,
          start: "top top",
          end: "+=230%",
          pin: true,
          scrub: 2,
          animation: zoomTl,
        });

        // ── 5. White flash → typewriter ──────────────────────────────────────
        gsap.set(".gsap-flash",    { opacity: 0 });
        gsap.set(".gsap-flash-bg", { opacity: 0 });
        if (typeRef.current) typeRef.current.textContent = "";

        const flashTl = gsap.timeline({
          scrollTrigger: {
            trigger: flashSecRef.current,
            start: "top 65%",
            toggleActions: "play none none none",
          },
        });
        flashTl
          .to(".gsap-flash",    { opacity: 1, duration: 0.08 })
          .to(".gsap-flash-bg", { opacity: 1, duration: 0.28 }, "+=0.06")
          .to(".gsap-flash",    { opacity: 0, duration: 0.3 })
          .to(typeRef.current,  {
            text: { value: "Your competitors launched last Tuesday.", delimiter: "" },
            duration: 2.8, ease: "none",
          }, "-=0.1")
          .to(".gsap-cursor",   { opacity: 0, duration: 0.2 }, "+=1.6")
          .to(typeRef.current,  { opacity: 0, y: -22, duration: 0.5, delay: 0.2 });

        // ── 6. CTA glow pulse ────────────────────────────────────────────────
        gsap.to(ctaBtnRef.current, {
          boxShadow: "0 0 80px rgba(59,130,246,1), 0 0 160px rgba(59,130,246,0.45), 0 0 240px rgba(99,102,241,0.25)",
          duration: 1.7, repeat: -1, yoyo: true, ease: "sine.inOut",
          scrollTrigger: { trigger: finalSecRef.current, start: "top 80%" },
        });

        // ── 7. Hover flood ────────────────────────────────────────────────────
        const btn   = ctaBtnRef.current;
        const flood = floodRef.current;
        if (btn && flood) {
          gsap.set(flood, { clipPath: "inset(50% 50% 50% 50% round 50%)" });
          const enter = () => gsap.to(flood, { clipPath: "inset(0% 0% 0% 0% round 0%)", duration: 0.65, ease: "power2.out" });
          const leave = () => gsap.to(flood, { clipPath: "inset(50% 50% 50% 50% round 50%)", duration: 0.45, ease: "power2.in" });
          btn.addEventListener("mouseenter", enter);
          btn.addEventListener("mouseleave", leave);
          return () => { btn.removeEventListener("mouseenter", enter); btn.removeEventListener("mouseleave", leave); };
        }

      }, wrapRef);
    };

    boot();
    return () => { gsapCtx?.revert(); };
  }, []);

  const S: React.CSSProperties = {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    position: "relative", overflow: "hidden",
  };

  return (
    <div ref={wrapRef} style={{ background: "#000", color: "#fff", overflowX: "hidden" }}>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .gsap-letter { display: inline-block; }
      `}</style>

      {/* ── Crack SVG overlay (fixed during pin) ────────────────────────── */}
      <svg
        className="gsap-crack-svg"
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 30, pointerEvents: "none" }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="crack-glow">
            <feGaussianBlur stdDeviation="0.6" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {CRACKS.map((d, i) => (
          <path
            key={i}
            className="gsap-crack-path"
            d={d}
            stroke="rgba(59,130,246,0.95)"
            strokeWidth="0.45"
            fill="none"
            strokeLinecap="round"
            filter="url(#crack-glow)"
          />
        ))}
      </svg>

      {/* ══ SECTION 1 — HERO (pinned) ════════════════════════════════════════ */}
      <section ref={heroRef} style={{ ...S, background: "#000" }}>

        {/* Slow-pulsing electric blue orb */}
        <div className="gsap-orb" style={{
          position: "absolute", width: 680, height: 680, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,130,246,0.22) 0%, rgba(59,130,246,0.06) 45%, transparent 70%)",
          opacity: 0.55, pointerEvents: "none",
        }} />

        {/* Hero text */}
        <div className="gsap-hero-text" style={{ textAlign: "center", zIndex: 5, padding: "0 24px", position: "relative" }}>
          <div style={{
            fontSize: "clamp(3.8rem, 12vw, 10rem)", fontWeight: 900,
            letterSpacing: "-0.055em", lineHeight: 0.92,
            display: "flex", flexWrap: "wrap", justifyContent: "center",
          }}>
            {"STOP JUGGLING.".split("").map((ch, i) => (
              <span
                key={i}
                className="gsap-letter"
                style={{
                  color: ch === "." ? "#3b82f6" : "#fff",
                  textShadow: ch === "." ? "0 0 50px rgba(59,130,246,0.9)" : "none",
                  marginRight: ch === " " ? "0.22em" : 0,
                }}
              >{ch === " " ? " " : ch}</span>
            ))}
          </div>

          <div className="gsap-subtitle" style={{
            marginTop: 30, fontSize: "clamp(1rem, 2.4vw, 1.55rem)",
            color: "rgba(255,255,255,0.48)", fontWeight: 400, letterSpacing: "-0.01em",
          }}>
            One OS. Every tool you need.
          </div>
        </div>

        {/* Dashboard that scales up through the cracks */}
        <div
          ref={dashRevealRef}
          style={{
            position: "absolute", inset: 0, zIndex: 20,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 48, pointerEvents: "none",
          }}
        >
          <DashboardMock />
        </div>
      </section>

      {/* ══ SECTION 2 — DASHBOARD ZOOM (pinned) ═════════════════════════════ */}
      <section ref={dashSecRef} style={{ ...S, background: "#03030e" }}>
        <div style={{ position: "relative" }}>
          <div ref={dashMockRef} style={{ transformOrigin: "30% 35%" }}>
            <DashboardMock />
          </div>
          {/* Overlay that fades in during zoom */}
          <div className="gsap-tool-overlay" style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)",
            borderRadius: 14,
          }}>
            <div style={{
              fontSize: "clamp(1.4rem, 4vw, 3rem)", fontWeight: 800,
              letterSpacing: "-0.04em", color: "#fff", textAlign: "center",
              textShadow: "0 0 60px rgba(59,130,246,0.4)",
            }}>
              Validate your idea in{" "}
              <span style={{ color: "#3b82f6", textShadow: "0 0 40px rgba(59,130,246,0.9)" }}>60 seconds.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 3 — FLASH + TYPEWRITER ══════════════════════════════════ */}
      <section ref={flashSecRef} style={{ ...S, background: "#000" }}>
        {/* White flash */}
        <div className="gsap-flash" style={{
          position: "absolute", inset: 0, background: "#fff",
          opacity: 0, zIndex: 20, pointerEvents: "none",
        }} />
        {/* Pure black bg that fades in behind flash */}
        <div className="gsap-flash-bg" style={{
          position: "absolute", inset: 0, background: "#000",
          opacity: 0, zIndex: 10,
        }} />

        <div style={{ position: "relative", zIndex: 30, textAlign: "center", padding: "0 24px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
            <span
              ref={typeRef}
              style={{
                fontSize: "clamp(1.1rem, 3.2vw, 2.4rem)", fontWeight: 700,
                letterSpacing: "-0.03em", color: "#f0f4ff", lineHeight: 1.3,
                fontFamily: "inherit",
              }}
            />
            <span className="gsap-cursor" style={{
              display: "inline-block", width: 3, height: "1.15em",
              background: "#3b82f6", marginLeft: 2, verticalAlign: "middle",
              animation: "blink 1s step-end infinite",
            }} />
          </div>
        </div>
      </section>

      {/* ══ SECTION 4 — FINAL CTA ════════════════════════════════════════════ */}
      <section ref={finalSecRef} style={{ ...S, background: "#000" }}>
        {/* Flood overlay — clips in from button center on hover */}
        <div ref={floodRef} style={{
          position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none",
          background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 45%, #6366f1 80%, #8b5cf6 100%)",
        }} />

        <div style={{ position: "relative", zIndex: 10, textAlign: "center" }}>
          <div style={{
            marginBottom: 32, fontSize: "clamp(0.85rem, 2vw, 1.1rem)",
            color: "rgba(255,255,255,0.28)", letterSpacing: "0.18em",
            textTransform: "uppercase", fontWeight: 500,
          }}>
            The OS for founders who ship
          </div>

          <button
            ref={ctaBtnRef}
            onClick={() => { window.location.href = "/auth/sign-up"; }}
            style={{
              padding: "22px 60px",
              fontSize: "clamp(1rem, 2.5vw, 1.4rem)",
              fontWeight: 700, letterSpacing: "-0.02em",
              background: "transparent",
              border: "2px solid rgba(59,130,246,0.7)",
              borderRadius: 14, color: "#fff",
              cursor: "pointer",
              boxShadow: "0 0 30px rgba(59,130,246,0.4)",
              position: "relative", zIndex: 20,
              fontFamily: "inherit",
              transition: "color 0.3s",
            }}
          >
            Build now →
          </button>

          <div style={{
            marginTop: 20, fontSize: 13,
            color: "rgba(255,255,255,0.2)",
          }}>
            No credit card required
          </div>
        </div>
      </section>
    </div>
  );
}
