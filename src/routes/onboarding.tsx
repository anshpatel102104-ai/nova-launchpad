// Two-track onboarding: CREATE A BUSINESS (founders) vs OPERATE A BUSINESS
// (operators). Every answer persists to onboarding_sessions (resume on return);
// completion is a single server-side saga (complete-onboarding edge function)
// — the profile is only flagged complete after the workspace actually exists.

import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NeuralCanvas } from "@/components/app/NeuralCanvas";
import { NovaIntakeChat, type IntakeAnswers } from "@/components/app/NovaIntakeChat";
import { FOUNDER_QUESTIONS, OPERATOR_QUESTIONS } from "@/constants/onboarding-questions";
import { invokeEdge, EdgeError } from "@/lib/invokeEdge";

type Mode = "create" | "operate";

const ACCENTS: Record<Mode, { accent: string; accentDark: string }> = {
  create: { accent: "#f97316", accentDark: "#ea580c" },
  operate: { accent: "#06b6d4", accentDark: "#0e7490" },
};

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/auth/sign-in" });
  },
  component: Onboarding,
});

const ANIM_CSS = `
  @keyframes bootLine {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes nameReveal {
    from { opacity: 0; transform: scale(0.9) translateY(28px); filter: blur(18px); }
    to   { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
  }
  @keyframes lineExpand {
    from { width: 0; opacity: 0; }
    to   { width: 140px; opacity: 1; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ambientPulse {
    0%   { opacity: 0.3; }
    50%  { opacity: 0.7; }
    100% { opacity: 0.3; }
  }
`;

type Phase = "loading" | "fork" | "chat" | "provisioning" | "done";

function Onboarding() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("loading");
  const [mode, setMode] = useState<Mode>("create");
  const [resume, setResume] = useState<{ step: number; answers: IntakeAnswers } | null>(null);
  const [pendingAnswers, setPendingAnswers] = useState<IntakeAnswers | null>(null);
  const [provisionError, setProvisionError] = useState<string | null>(null);

  // Restore an abandoned session so users never re-answer from scratch.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("onboarding_sessions")
          .select("mode, step, answers, status")
          .eq("user_id", user.id)
          .maybeSingle();
        if (cancelled) return;
        if (data && data.status === "in_progress" && data.mode) {
          setMode(data.mode as Mode);
          setResume({
            step: (data.step as number) ?? 0,
            answers: (data.answers as IntakeAnswers) ?? {},
          });
          setPhase("chat");
        } else {
          setPhase("fork");
        }
      } catch {
        if (!cancelled) setPhase("fork");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveSession = (m: Mode, step: number, answers: IntakeAnswers) => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("onboarding_sessions")
        .upsert(
          { user_id: user.id, mode: m, step, answers, status: "in_progress" },
          { onConflict: "user_id" },
        );
    })();
  };

  const chooseMode = (m: Mode) => {
    setMode(m);
    setResume(null);
    saveSession(m, 0, {});
    setPhase("chat");
  };

  const complete = async (answers: IntakeAnswers) => {
    setPendingAnswers(answers);
    setProvisionError(null);
    setPhase("provisioning");
    try {
      await invokeEdge("complete-onboarding", { mode, answers }, { timeoutMs: 90_000, retries: 1 });
      setPhase("done");
      setTimeout(() => navigate({ to: "/app/mission-control" }), 3200);
    } catch (e) {
      setProvisionError(
        e instanceof EdgeError ? e.message : "Something went wrong while building your workspace.",
      );
    }
  };

  if (phase === "done")
    return <WelcomeScreen mode={mode} onSkip={() => navigate({ to: "/app/mission-control" })} />;

  const { accent, accentDark } = ACCENTS[mode];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0a0805",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <style>{ANIM_CSS}</style>

      <div style={{ position: "absolute", inset: 0, opacity: 0.25 }}>
        <NeuralCanvas className="w-full h-full" />
      </div>

      <div
        style={{
          position: "absolute",
          width: 700,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(ellipse, color-mix(in oklab, ${phase === "fork" ? "#8b5cf6" : accent} 7%, transparent) 0%, transparent 70%)`,
          animation: "ambientPulse 4s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxHeight: "100vh",
          padding: "24px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Nova wordmark */}
        <div style={{ marginBottom: 28, display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background:
                phase === "fork"
                  ? "linear-gradient(135deg, #8b5cf6, #6d28d9)"
                  : `linear-gradient(135deg, ${accent}, ${accentDark})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 800,
              color: "#fff",
            }}
          >
            N
          </div>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "rgba(247,240,232,0.7)",
            }}
          >
            Nova
          </span>
        </div>

        {phase === "loading" && (
          <div style={{ color: "rgba(247,240,232,0.4)", fontSize: 13, fontFamily: "monospace" }}>
            loading…
          </div>
        )}

        {phase === "fork" && <ForkScreen onChoose={chooseMode} />}

        {phase === "chat" && (
          <NovaIntakeChat
            key={mode}
            questions={mode === "operate" ? OPERATOR_QUESTIONS : FOUNDER_QUESTIONS}
            accent={accent}
            accentDark={accentDark}
            initialAnswers={resume?.answers}
            initialStep={resume?.step ?? 0}
            onAnswer={(key, value, step) => {
              const merged = { ...(resume?.answers ?? {}), [key]: value };
              setResume({ step, answers: merged });
              saveSession(mode, step, merged);
            }}
            onComplete={complete}
          />
        )}

        {phase === "provisioning" && (
          <ProvisioningScreen
            mode={mode}
            accent={accent}
            error={provisionError}
            onRetry={() => pendingAnswers && complete(pendingAnswers)}
          />
        )}
      </div>
    </div>
  );
}

// ── Step 0 — the fork ─────────────────────────────────────────────────────────

function ForkScreen({ onChoose }: { onChoose: (m: Mode) => void }) {
  const cards: Array<{
    mode: Mode;
    title: string;
    desc: string;
    bullets: string[];
    accent: string;
    accentDark: string;
    emoji: string;
  }> = [
    {
      mode: "create",
      title: "Create a business",
      desc: "I have an idea — take me from concept to paying customers.",
      bullets: ["Validate the idea", "Build the offer", "Land the first customers"],
      accent: "#f97316",
      accentDark: "#ea580c",
      emoji: "🚀",
    },
    {
      mode: "operate",
      title: "Operate a business",
      desc: "I'm running one — give me systems, automation, and visibility.",
      bullets: ["KPI cockpit", "Automation opportunities", "Scale playbooks"],
      accent: "#06b6d4",
      accentDark: "#0e7490",
      emoji: "⚙️",
    },
  ];

  return (
    <div style={{ width: "100%", maxWidth: 720, animation: "fadeUp 0.5s ease both" }}>
      <h1
        style={{
          textAlign: "center",
          fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color: "#f7f0e8",
          margin: "0 0 8px",
        }}
      >
        What brings you to Nova?
      </h1>
      <p
        style={{
          textAlign: "center",
          fontSize: 14,
          color: "rgba(247,240,232,0.45)",
          margin: "0 0 28px",
        }}
      >
        Two different operating systems. Pick the one that matches where you are.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 14,
        }}
      >
        {cards.map((c, i) => (
          <button
            key={c.mode}
            onClick={() => onChoose(c.mode)}
            style={{
              textAlign: "left",
              padding: "22px 20px",
              borderRadius: 18,
              cursor: "pointer",
              background: "rgba(255,255,255,0.035)",
              border: `1px solid color-mix(in oklab, ${c.accent} 28%, transparent)`,
              transition: "transform 0.15s, border-color 0.15s, background 0.15s",
              animation: `fadeUp 0.5s ease ${0.1 + i * 0.08}s both`,
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "translateY(-3px)";
              el.style.borderColor = c.accent;
              el.style.background = `color-mix(in oklab, ${c.accent} 7%, transparent)`;
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "none";
              el.style.borderColor = `color-mix(in oklab, ${c.accent} 28%, transparent)`;
              el.style.background = "rgba(255,255,255,0.035)";
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                background: `linear-gradient(135deg, ${c.accent}, ${c.accentDark})`,
                boxShadow: `0 4px 18px color-mix(in oklab, ${c.accent} 35%, transparent)`,
                marginBottom: 14,
              }}
            >
              {c.emoji}
            </div>
            <div
              style={{ fontSize: 17, fontWeight: 800, color: "#f7f0e8", letterSpacing: "-0.01em" }}
            >
              {c.title}
            </div>
            <p
              style={{
                fontSize: 13,
                color: "rgba(247,240,232,0.5)",
                margin: "6px 0 14px",
                lineHeight: 1.55,
              }}
            >
              {c.desc}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {c.bullets.map((b) => (
                <div
                  key={b}
                  style={{
                    fontSize: 12,
                    color: "rgba(247,240,232,0.65)",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: c.accent,
                      flexShrink: 0,
                    }}
                  />
                  {b}
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 16,
                fontSize: 12.5,
                fontWeight: 700,
                color: c.accent,
              }}
            >
              Start here →
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Provisioning — real checkpoints, real failure handling ───────────────────

const CREATE_CHECKPOINTS = [
  "Creating your workspace",
  "Seeding your first mission",
  "Writing your business context",
  "Generating your AI briefing",
];

const OPERATE_CHECKPOINTS = [
  "Creating your workspace",
  "Building your operating baseline",
  "Mapping your bottlenecks & stack",
  "Generating your ops briefing",
];

function ProvisioningScreen({
  mode,
  accent,
  error,
  onRetry,
}: {
  mode: Mode;
  accent: string;
  error: string | null;
  onRetry: () => void;
}) {
  const checkpoints = mode === "operate" ? OPERATE_CHECKPOINTS : CREATE_CHECKPOINTS;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (error) return;
    const t = setInterval(() => setTick((v) => Math.min(v + 1, checkpoints.length - 1)), 1600);
    return () => clearInterval(t);
  }, [error, checkpoints.length]);

  return (
    <div style={{ width: "100%", maxWidth: 420, animation: "fadeUp 0.4s ease both" }}>
      <div
        style={{
          borderRadius: 18,
          padding: "26px 24px",
          background: "rgba(255,255,255,0.035)",
          border: `1px solid color-mix(in oklab, ${error ? "#f87171" : accent} 30%, transparent)`,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: error ? "#f87171" : accent,
            marginBottom: 16,
            fontFamily: "monospace",
          }}
        >
          {error ? "provisioning failed" : "assembling workspace"}
        </div>

        {!error &&
          checkpoints.map((label, i) => {
            const state = i < tick ? "done" : i === tick ? "active" : "pending";
            return (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "7px 0",
                  opacity: state === "pending" ? 0.35 : 1,
                  transition: "opacity 0.4s",
                }}
              >
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    color: "#fff",
                    background:
                      state === "done"
                        ? accent
                        : state === "active"
                          ? `color-mix(in oklab, ${accent} 35%, transparent)`
                          : "rgba(255,255,255,0.08)",
                    animation: state === "active" ? "ambientPulse 1.2s infinite" : undefined,
                  }}
                >
                  {state === "done" ? "✓" : ""}
                </span>
                <span style={{ fontSize: 13.5, color: "rgba(247,240,232,0.8)" }}>{label}</span>
              </div>
            );
          })}

        {error && (
          <>
            <p
              style={{
                fontSize: 13.5,
                color: "rgba(247,240,232,0.75)",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {error}
            </p>
            <p style={{ fontSize: 12, color: "rgba(247,240,232,0.4)", lineHeight: 1.6 }}>
              Your answers are saved — nothing is lost. Retry now, or come back later and Nova will
              pick up where you left off.
            </p>
            <button
              onClick={onRetry}
              style={{
                marginTop: 10,
                width: "100%",
                padding: "11px 0",
                borderRadius: 12,
                border: "none",
                fontWeight: 700,
                fontSize: 13.5,
                color: "#fff",
                cursor: "pointer",
                background: `linear-gradient(135deg, ${accent}, color-mix(in oklab, ${accent} 55%, #000))`,
              }}
            >
              Retry provisioning
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Welcome / boot screen ─────────────────────────────────────────────────────

const BOOT_LINES = [
  "nova_os://init — kernel loaded",
  "analysing your business context…",
  "calibrating AI tools for your stage…",
  "building your command center…",
];

function WelcomeScreen({ mode, onSkip }: { mode: Mode; onSkip: () => void }) {
  const [phase, setPhase] = useState<"boot" | "reveal">("boot");
  const [lineIdx, setLineIdx] = useState(0);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    BOOT_LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setLineIdx(i + 1), i * 380 + 200));
    });
    timers.push(setTimeout(() => setPhase("reveal"), BOOT_LINES.length * 380 + 600));
    timers.push(setTimeout(() => setShowFallback(true), 6000));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0a0805",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <style>{ANIM_CSS}</style>

      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: phase === "reveal" ? 0.12 : 0.22,
          transition: "opacity 1s",
        }}
      >
        <NeuralCanvas className="w-full h-full" />
      </div>

      <div
        style={{
          position: "absolute",
          width: 800,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(249,115,22,0.12) 0%, rgba(251,191,36,0.05) 40%, transparent 70%)",
          transition: "opacity 1s",
          opacity: phase === "reveal" ? 1 : 0.4,
          animation: "ambientPulse 4s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          textAlign: "center",
          padding: "0 24px",
          maxWidth: 600,
        }}
      >
        {phase === "boot" && (
          <div style={{ fontFamily: "monospace", textAlign: "left", display: "inline-block" }}>
            {BOOT_LINES.slice(0, lineIdx).map((line, i) => (
              <div
                key={line}
                style={{
                  fontSize: 13,
                  color: "rgba(249,115,22,0.85)",
                  lineHeight: 2.1,
                  animation: "bootLine 0.35s ease both",
                }}
              >
                <span style={{ color: "rgba(251,191,36,0.7)", marginRight: 8 }}>›</span>
                {line}
                {i === lineIdx - 1 && (
                  <span style={{ animation: "ambientPulse 1s infinite" }}>_</span>
                )}
              </div>
            ))}
          </div>
        )}

        {phase === "reveal" && (
          <div style={{ animation: "nameReveal 1s cubic-bezier(0.16,1,0.3,1) both" }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#f97316",
                marginBottom: 20,
                animation: "fadeUp 0.6s ease 0.15s both",
                opacity: 0,
              }}
            >
              System ready
            </div>

            <h1
              style={{
                fontSize: "clamp(2.6rem, 7vw, 4.5rem)",
                fontWeight: 900,
                letterSpacing: "-0.05em",
                lineHeight: 1.04,
                color: "#f7f0e8",
                margin: "0 0 8px",
                textShadow: "0 0 60px rgba(249,115,22,0.2)",
              }}
            >
              Nova is ready.
            </h1>

            <div
              style={{
                margin: "22px auto 0",
                height: 2,
                borderRadius: 2,
                background: "linear-gradient(90deg, transparent, #f97316, #fbbf24, transparent)",
                boxShadow: "0 0 20px rgba(249,115,22,0.6)",
                animation: "lineExpand 0.9s cubic-bezier(0.16,1,0.3,1) 0.3s both",
              }}
            />

            <p
              style={{
                marginTop: 22,
                fontSize: 16,
                color: "rgba(247,240,232,0.45)",
                lineHeight: 1.65,
                animation: "fadeUp 0.6s ease 0.5s both",
                opacity: 0,
              }}
            >
              {mode === "operate" ? (
                <>
                  Your operations cockpit is online.
                  <br />
                  Time to build the machine that runs itself.
                </>
              ) : (
                <>
                  Your AI founder OS is online.
                  <br />
                  Let's build something remarkable.
                </>
              )}
            </p>

            <div
              style={{
                marginTop: 32,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 14,
                animation: "fadeUp 0.6s ease 0.75s both",
                opacity: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#f97316",
                    boxShadow: "0 0 10px #f97316",
                    animation: "ambientPulse 1.4s ease-in-out infinite",
                  }}
                />
                <span
                  style={{ fontSize: 12, color: "rgba(247,240,232,0.3)", fontFamily: "monospace" }}
                >
                  loading dashboard…
                </span>
              </div>
              <button
                onClick={onSkip}
                style={{
                  fontSize: 12,
                  color: "rgba(247,240,232,0.5)",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(249,115,22,0.15)",
                  borderRadius: 8,
                  padding: "6px 16px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                }}
              >
                Skip → Go to dashboard
              </button>
              {showFallback && (
                <div style={{ fontSize: 11, color: "rgba(247,240,232,0.3)", marginTop: 4 }}>
                  Taking too long?{" "}
                  <button
                    onClick={onSkip}
                    style={{
                      fontSize: 11,
                      color: "#f97316",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      padding: 0,
                      textDecoration: "underline",
                    }}
                  >
                    Go to your dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
