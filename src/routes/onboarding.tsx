import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowRight, Lightbulb, Hammer, DollarSign, TrendingUp, Rocket, Users, Package, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NeuralCanvas } from "@/components/app/NeuralCanvas";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/auth/sign-in" });
  },
  component: Onboarding,
});

const STAGES = [
  { id: "Idea",     label: "Idea",     desc: "Just a concept, nothing built",    icon: Lightbulb  },
  { id: "Building", label: "Building", desc: "Actively building the product",    icon: Hammer     },
  { id: "Revenue",  label: "Revenue",  desc: "I have paying customers",          icon: DollarSign },
  { id: "Scaling",  label: "Scaling",  desc: "Growing revenue and team",         icon: TrendingUp },
];

const CHALLENGES = [
  { id: "fundraising", label: "Fundraising",        desc: "Raising capital from investors",    icon: Rocket   },
  { id: "customers",   label: "Getting customers",  desc: "Finding my first buyers",           icon: Users    },
  { id: "product",     label: "Building product",   desc: "Shipping fast enough",              icon: Package  },
  { id: "marketing",   label: "Marketing",          desc: "Getting visibility and awareness",  icon: Megaphone},
];

const ANIM_CSS = `
  @keyframes stepIn {
    from { opacity: 0; transform: translateX(52px) scale(0.98); }
    to   { opacity: 1; transform: translateX(0) scale(1); }
  }
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
  .ob-step   { animation: stepIn 0.55s cubic-bezier(0.16,1,0.3,1) both; }
  .ob-input  { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #f0f4ff; font-size: 14px; outline: none; width: 100%; border-radius: 10px; transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box; font-family: inherit; }
  .ob-input:focus { border-color: rgba(59,130,246,0.65); box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
  .ob-card { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; padding: 16px; border-radius: 12px; cursor: pointer; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); transition: all 0.2s; text-align: left; width: 100%; }
  .ob-card:hover { border-color: rgba(255,255,255,0.18); background: rgba(255,255,255,0.06); }
  .ob-card-sel { border-color: rgba(59,130,246,0.65) !important; background: rgba(59,130,246,0.09) !important; box-shadow: 0 0 28px rgba(59,130,246,0.2), inset 0 0 16px rgba(59,130,246,0.04) !important; }
`;

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [stepKey, setStepKey] = useState(0);
  const [name, setName] = useState("");
  const [idea, setIdea] = useState("");
  const [stage, setStage] = useState("");
  const [challenge, setChallenge] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const m = user?.user_metadata;
      const n = m?.full_name || m?.name || "";
      if (n) setName(n);
    });
  }, []);

  const canAdvance = step === 0 ? name.trim().length > 0 && idea.trim().length > 0
    : step === 1 ? !!stage
    : !!challenge;

  const advance = async () => {
    if (!canAdvance) return;
    if (step < 2) {
      setStep(s => s + 1);
      setStepKey(k => k + 1);
    } else {
      setSaving(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        await Promise.all([
          supabase.from("onboarding_responses").upsert(
            [
              { user_id: user.id, question_key: "fullName",  answer: name },
              { user_id: user.id, question_key: "idea",      answer: idea },
              { user_id: user.id, question_key: "stage",     answer: stage },
              { user_id: user.id, question_key: "challenge", answer: challenge },
            ],
            { onConflict: "user_id,question_key" },
          ),
          supabase.from("profiles").update({ onboarding_complete: true, full_name: name }).eq("id", user.id),
        ]);
        setDone(true);
        setTimeout(() => navigate({ to: "/app/dashboard" }), 3600);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setSaving(false);
      }
    }
  };

  if (done) return <WelcomeScreen name={name} />;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#080810", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{ANIM_CSS}</style>

      {/* Neural canvas */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.3 }}>
        <NeuralCanvas className="w-full h-full" />
      </div>

      {/* Center ambient glow */}
      <div style={{
        position: "absolute", width: 700, height: 500, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)",
        animation: "ambientPulse 4s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      {/* Card */}
      <div style={{
        position: "relative", zIndex: 10, width: "100%", maxWidth: 560, margin: "0 20px",
        background: "rgba(11,11,26,0.88)", backdropFilter: "blur(28px) saturate(1.4)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 22,
        boxShadow: "0 0 0 1px rgba(59,130,246,0.06), 0 40px 100px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)",
        padding: "38px 38px 34px",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 34 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: "0.02em",
            }}>N</div>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "#f0f4ff", letterSpacing: "-0.01em" }}>Nova OS</span>
          </div>
          {/* Progress dots */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                height: 6, borderRadius: 99,
                transition: "all 0.45s cubic-bezier(0.16,1,0.3,1)",
                width: i === step ? 28 : 6,
                background: i < step ? "#3b82f6" : i === step ? "#3b82f6" : "rgba(255,255,255,0.12)",
                boxShadow: i === step ? "0 0 14px rgba(59,130,246,0.9), 0 0 28px rgba(59,130,246,0.4)" : "none",
              }} />
            ))}
          </div>
        </div>

        {/* Animated step */}
        <div key={stepKey} className="ob-step">
          {step === 0 && <Step1 name={name} idea={idea} onName={setName} onIdea={setIdea} onSubmit={advance} />}
          {step === 1 && <Step2 stage={stage} onStage={setStage} />}
          {step === 2 && <Step3 challenge={challenge} onChallenge={setChallenge} />}
        </div>

        {/* Continue button */}
        <button
          onClick={advance}
          disabled={!canAdvance || saving}
          style={{
            marginTop: 28, width: "100%", height: 52, borderRadius: 12, border: "none",
            cursor: canAdvance && !saving ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            fontWeight: 600, fontSize: 15, letterSpacing: "-0.01em",
            background: canAdvance && !saving
              ? "linear-gradient(135deg, #3b82f6 0%, #6366f1 60%, #8b5cf6 100%)"
              : "rgba(255,255,255,0.06)",
            color: canAdvance && !saving ? "#fff" : "rgba(255,255,255,0.25)",
            transition: "all 0.25s",
            boxShadow: canAdvance && !saving
              ? "0 0 40px rgba(59,130,246,0.45), 0 0 80px rgba(99,102,241,0.2), 0 8px 24px rgba(0,0,0,0.4)"
              : "none",
            fontFamily: "inherit",
          }}
        >
          {saving ? "Initializing Nova…" : step < 2 ? "Continue" : "Launch Nova"}
          {!saving && <ArrowRight style={{ width: 17, height: 17 }} />}
        </button>
      </div>
    </div>
  );
}

function Heading({ step: s }: { step: number }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#3b82f6", marginBottom: 8 }}>
        Step {s} of 3
      </div>
      <h2 style={{
        fontSize: "clamp(1.7rem, 5vw, 2.3rem)", fontWeight: 800, color: "#f0f4ff",
        lineHeight: 1.08, letterSpacing: "-0.04em", margin: 0,
      }}>
        {s === 1 && <>What's your<br /><span style={{ color: "#3b82f6" }}>startup idea</span>?</>}
        {s === 2 && <>What stage<br /><span style={{ color: "#8b5cf6" }}>are you at</span>?</>}
        {s === 3 && <>What's your<br /><span style={{ color: "#06b6d4" }}>biggest challenge</span>?</>}
      </h2>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11.5, color: "rgba(240,244,255,0.4)", fontWeight: 500, marginBottom: 7 }}>{children}</div>;
}

function Step1({ name, idea, onName, onIdea, onSubmit }: {
  name: string; idea: string;
  onName: (v: string) => void; onIdea: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div>
      <Heading step={1} />
      <div style={{ marginBottom: 14 }}>
        <FieldLabel>Your name</FieldLabel>
        <input
          autoFocus
          value={name}
          onChange={e => onName(e.target.value)}
          placeholder="Alex Founder"
          className="ob-input"
          style={{ height: 44, padding: "0 14px" }}
        />
      </div>
      <div>
        <FieldLabel>Describe it in one sentence</FieldLabel>
        <textarea
          value={idea}
          onChange={e => onIdea(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit(); }}
          placeholder="e.g. AI that writes investor updates in 30 seconds so founders can focus on building"
          rows={3}
          className="ob-input"
          style={{ padding: "12px 14px", resize: "none", lineHeight: 1.55 }}
        />
        <div style={{ fontSize: 10.5, color: "rgba(240,244,255,0.25)", marginTop: 5 }}>⌘+Enter to continue</div>
      </div>
    </div>
  );
}

function Step2({ stage, onStage }: { stage: string; onStage: (v: string) => void }) {
  return (
    <div>
      <Heading step={2} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {STAGES.map(({ id, label, desc, icon: Icon }) => (
          <button key={id} onClick={() => onStage(id)} className={`ob-card${stage === id ? " ob-card-sel" : ""}`}>
            <div style={{
              width: 36, height: 36, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
              background: stage === id ? "rgba(59,130,246,0.22)" : "rgba(255,255,255,0.05)",
              transition: "background 0.2s",
            }}>
              <Icon style={{ width: 16, height: 16, color: stage === id ? "#3b82f6" : "rgba(240,244,255,0.35)" }} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#f0f4ff" }}>{label}</div>
              <div style={{ fontSize: 11.5, color: "rgba(240,244,255,0.38)", lineHeight: 1.4, marginTop: 2 }}>{desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step3({ challenge, onChallenge }: { challenge: string; onChallenge: (v: string) => void }) {
  return (
    <div>
      <Heading step={3} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {CHALLENGES.map(({ id, label, desc, icon: Icon }) => (
          <button key={id} onClick={() => onChallenge(id)} className={`ob-card${challenge === id ? " ob-card-sel" : ""}`}>
            <div style={{
              width: 36, height: 36, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
              background: challenge === id ? "rgba(6,182,212,0.18)" : "rgba(255,255,255,0.05)",
              transition: "background 0.2s",
            }}>
              <Icon style={{ width: 16, height: 16, color: challenge === id ? "#06b6d4" : "rgba(240,244,255,0.35)" }} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#f0f4ff" }}>{label}</div>
              <div style={{ fontSize: 11.5, color: "rgba(240,244,255,0.38)", lineHeight: 1.4, marginTop: 2 }}>{desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

const BOOT_LINES = [
  "nova_os://init — kernel loaded",
  "scanning founder profile…",
  "calibrating AI tools for your stage…",
  "building your command center…",
];

function WelcomeScreen({ name }: { name: string }) {
  const [phase, setPhase] = useState<"boot" | "reveal">("boot");
  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    BOOT_LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setLineIdx(i + 1), i * 380 + 200));
    });
    timers.push(setTimeout(() => setPhase("reveal"), BOOT_LINES.length * 380 + 600));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#080810", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <style>{ANIM_CSS}</style>

      <div style={{ position: "absolute", inset: 0, opacity: phase === "reveal" ? 0.15 : 0.25, transition: "opacity 1s" }}>
        <NeuralCanvas className="w-full h-full" />
      </div>

      {/* Radial glow — intensifies on reveal */}
      <div style={{
        position: "absolute", width: 800, height: 600, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(59,130,246,0.14) 0%, rgba(139,92,246,0.07) 40%, transparent 70%)",
        transition: "opacity 1s",
        opacity: phase === "reveal" ? 1 : 0.4,
        animation: "ambientPulse 4s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: "0 24px", maxWidth: 600 }}>
        {phase === "boot" && (
          <div style={{ fontFamily: "monospace", textAlign: "left", display: "inline-block" }}>
            {BOOT_LINES.slice(0, lineIdx).map((line, i) => (
              <div key={line} style={{
                fontSize: 13, color: "rgba(59,130,246,0.85)", lineHeight: 2.1,
                animation: "bootLine 0.35s ease both",
              }}>
                <span style={{ color: "rgba(99,102,241,0.7)", marginRight: 8 }}>›</span>{line}
                {i === lineIdx - 1 && <span style={{ animation: "ambientPulse 1s infinite" }}>_</span>}
              </div>
            ))}
          </div>
        )}

        {phase === "reveal" && (
          <div style={{ animation: "nameReveal 1s cubic-bezier(0.16,1,0.3,1) both" }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
              color: "#3b82f6", marginBottom: 20,
              animation: "fadeUp 0.6s ease 0.15s both", opacity: 0,
            }}>
              System ready
            </div>

            <h1 style={{
              fontSize: "clamp(2.6rem, 7vw, 4.5rem)", fontWeight: 900,
              letterSpacing: "-0.05em", lineHeight: 1.04, color: "#f0f4ff", margin: "0 0 8px",
              textShadow: "0 0 60px rgba(59,130,246,0.25)",
            }}>
              Nova is ready<br />for you,{" "}
              <span style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                {name || "Founder"}
              </span>
            </h1>

            <div style={{
              margin: "22px auto 0",
              height: 2, borderRadius: 2,
              background: "linear-gradient(90deg, transparent, #3b82f6, #8b5cf6, #06b6d4, transparent)",
              boxShadow: "0 0 20px rgba(59,130,246,0.7)",
              animation: "lineExpand 0.9s cubic-bezier(0.16,1,0.3,1) 0.3s both",
            }} />

            <p style={{
              marginTop: 22, fontSize: 16, color: "rgba(240,244,255,0.45)", lineHeight: 1.65,
              animation: "fadeUp 0.6s ease 0.5s both", opacity: 0,
            }}>
              Your AI founder OS is online.<br />Let's build something remarkable.
            </p>

            <div style={{
              marginTop: 32, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              animation: "fadeUp 0.6s ease 0.75s both", opacity: 0,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%", background: "#3b82f6",
                boxShadow: "0 0 10px #3b82f6", animation: "ambientPulse 1.4s ease-in-out infinite",
              }} />
              <span style={{ fontSize: 12, color: "rgba(240,244,255,0.3)", fontFamily: "monospace" }}>
                loading dashboard…
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
