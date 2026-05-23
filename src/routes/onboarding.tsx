import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  Hammer,
  DollarSign,
  TrendingUp,
  Rocket,
  Users,
  Package,
  Megaphone,
  CheckCircle2,
  Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type BusinessStage = Database["public"]["Enums"]["business_stage"];

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/auth/sign-in" });
  },
  component: Onboarding,
});

const STAGES: { id: BusinessStage; label: string; desc: string; icon: React.ElementType }[] = [
  { id: "Idea", label: "Idea Stage", desc: "Just a concept, nothing built yet", icon: Lightbulb },
  { id: "Validate", label: "Building", desc: "Actively building the product", icon: Hammer },
  { id: "Operate", label: "Revenue", desc: "I have paying customers", icon: DollarSign },
  { id: "Scale", label: "Scaling", desc: "Growing revenue and team", icon: TrendingUp },
];

const CHALLENGES = [
  { id: "fundraising", label: "Fundraising", desc: "Raising capital from investors", icon: Rocket },
  { id: "customers", label: "Getting customers", desc: "Finding my first buyers", icon: Users },
  { id: "product", label: "Building product", desc: "Shipping fast enough", icon: Package },
  { id: "marketing", label: "Marketing", desc: "Getting visibility and awareness", icon: Megaphone },
];

const CHALLENGE_TOOLS: Record<string, string[]> = {
  fundraising: ["pitch-generator", "funding-score", "investor-emails"],
  customers: ["first-10-customers", "offer", "followup"],
  product: ["idea-validator", "kill-my-idea", "gtm-strategy"],
  marketing: ["gtm-strategy", "landing-page", "website-audit"],
};

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [stepKey, setStepKey] = useState(0);
  const [name, setName] = useState("");
  const [idea, setIdea] = useState("");
  const [stage, setStage] = useState<BusinessStage | "">("");
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

  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? "⌘" : "Ctrl";

  const canAdvance =
    step === 0
      ? name.trim().length > 0 && idea.trim().length >= 20
      : step === 1
        ? !!stage
        : !!challenge;

  const goBack = () => {
    if (step > 0) {
      setStep((s) => s - 1);
      setStepKey((k) => k + 1);
    }
  };

  const advance = async () => {
    if (!canAdvance) return;
    if (step < 2) {
      setStep((s) => s + 1);
      setStepKey((k) => k + 1);
    } else {
      setSaving(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        await supabase.from("profiles").update({ full_name: name }).eq("id", user.id);

        const orgName = name ? `${name.split(" ")[0]}'s Workspace` : "My Workspace";
        const { data: org, error: orgErr } = await supabase
          .from("organizations")
          .insert({ name: orgName, owner_id: user.id, stage: stage || undefined })
          .select("id")
          .single();
        if (orgErr) throw orgErr;

        const { error: memberErr } = await supabase
          .from("organization_members")
          .insert({ organization_id: org.id, user_id: user.id, role: "owner" });
        if (memberErr) throw memberErr;

        await supabase.from("onboarding_responses").upsert(
          {
            user_id: user.id,
            organization_id: org.id,
            offer: idea,
            stage: (stage as Database["public"]["Enums"]["business_stage"]) || null,
            biggest_blocker: challenge,
            completed: true,
            completed_at: new Date().toISOString(),
          },
          { onConflict: "organization_id" },
        );

        await supabase.from("profiles").update({ onboarding_complete: true }).eq("id", user.id);

        const n8nBase = import.meta.env.VITE_N8N_BASE_URL ?? "/api/n8n";
        fetch(`${n8nBase}/webhook/nova-ops-dashboard-init`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            operator_name: name,
            primary_niche: challenge,
            recommended_tools: CHALLENGE_TOOLS[challenge] ?? [],
          }),
        }).catch(() => { /* best-effort */ });

        setDone(true);
        setTimeout(() => navigate({ to: "/app/dashboard" }), 3200);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setSaving(false);
      }
    }
  };

  if (done) return <WelcomeScreen name={name} onSkip={() => navigate({ to: "/app/dashboard" })} />;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #ffffff 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Subtle background pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(249,115,22,0.08) 1px, transparent 0)",
          backgroundSize: "24px 24px",
          pointerEvents: "none",
        }}
      />

      {/* Orange orb */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
          top: "10%",
          right: "-10%",
        }}
      />

      {/* Card */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: 560,
          margin: "0 20px",
          background: "#ffffff",
          border: "1px solid #fdba74",
          borderRadius: 20,
          boxShadow: "0 4px 6px rgba(0,0,0,0.05), 0 20px 60px rgba(249,115,22,0.12), 0 40px 80px rgba(0,0,0,0.06)",
          padding: "36px 36px 32px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #f97316, #ea580c)",
                fontSize: 12,
                fontWeight: 800,
                color: "#fff",
                boxShadow: "0 2px 8px rgba(249,115,22,0.35)",
              }}
            >
              N
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", letterSpacing: "-0.01em" }}>
                Nova Launchpad
              </div>
              <div style={{ fontSize: 10, color: "#f97316", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                AI Mentor Bootcamp
              </div>
            </div>
          </div>
          {/* Progress dots */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  height: 6,
                  borderRadius: 99,
                  transition: "all 0.45s cubic-bezier(0.16,1,0.3,1)",
                  width: i === step ? 28 : 6,
                  background: i < step ? "#22c55e" : i === step ? "#f97316" : "#e5e7eb",
                  boxShadow: i === step ? "0 0 10px rgba(249,115,22,0.5)" : "none",
                }}
              />
            ))}
          </div>
        </div>

        {/* Animated step */}
        <div
          key={stepKey}
          style={{ animation: "stepIn 0.5s cubic-bezier(0.16,1,0.3,1) both" }}
        >
          <style>{`
            @keyframes stepIn {
              from { opacity: 0; transform: translateX(40px) scale(0.98); }
              to   { opacity: 1; transform: translateX(0) scale(1); }
            }
          `}</style>
          {step === 0 && (
            <Step1 name={name} idea={idea} onName={setName} onIdea={setIdea} onSubmit={advance} modKey={modKey} />
          )}
          {step === 1 && <Step2 stage={stage} onStage={setStage} />}
          {step === 2 && <Step3 challenge={challenge} onChallenge={setChallenge} />}
        </div>

        {/* Navigation */}
        <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
          {step > 0 && (
            <button
              onClick={goBack}
              disabled={saving}
              style={{
                height: 48,
                width: 48,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f9fafb",
                color: "#6b7280",
                transition: "all 0.2s",
                flexShrink: 0,
                fontFamily: "inherit",
              }}
              aria-label="Go back"
            >
              <ArrowLeft style={{ width: 16, height: 16 }} />
            </button>
          )}
          <button
            onClick={advance}
            disabled={!canAdvance || saving}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 12,
              border: "none",
              cursor: canAdvance && !saving ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: "-0.01em",
              background: canAdvance && !saving
                ? "linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                : "#f3f4f6",
              color: canAdvance && !saving ? "#fff" : "#9ca3af",
              transition: "all 0.25s",
              boxShadow: canAdvance && !saving
                ? "0 4px 20px rgba(249,115,22,0.35), 0 8px 24px rgba(0,0,0,0.08)"
                : "none",
              fontFamily: "inherit",
            }}
          >
            {saving ? "Creating your bootcamp…" : step < 2 ? "Continue" : "Start Bootcamp"}
            {!saving && <ArrowRight style={{ width: 17, height: 17 }} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function Heading({ step: s }: { step: number }) {
  const labels = [
    { label: "Step 1 of 3", title: "Your business idea", highlight: "Let's validate it." },
    { label: "Step 2 of 3", title: "Your current stage", highlight: "Where are you now?" },
    { label: "Step 3 of 3", title: "Your biggest challenge", highlight: "We'll focus here." },
  ];
  const current = labels[s - 1];
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#f97316", marginBottom: 6 }}>
        {current.label}
      </div>
      <h2 style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 800, color: "#111827", lineHeight: 1.15, letterSpacing: "-0.03em", margin: "0 0 6px" }}>
        {current.title}
      </h2>
      <p style={{ fontSize: 13.5, color: "#6b7280", margin: 0 }}>{current.highlight}</p>
    </div>
  );
}

function Step1({
  name, idea, onName, onIdea, onSubmit, modKey,
}: {
  name: string; idea: string; onName: (v: string) => void; onIdea: (v: string) => void; onSubmit: () => void; modKey: string;
}) {
  return (
    <div>
      <Heading step={1} />
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Your name</div>
        <input
          autoFocus
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder="Alex Founder"
          style={{
            height: 44,
            padding: "0 14px",
            width: "100%",
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            color: "#111827",
            fontSize: 14,
            outline: "none",
            boxSizing: "border-box",
            fontFamily: "inherit",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#f97316";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.12)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#e5e7eb";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Describe your idea</div>
        <textarea
          value={idea}
          onChange={(e) => onIdea(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit(); }}
          placeholder="e.g. AI that writes investor updates in 30 seconds so founders can focus on building"
          rows={3}
          style={{
            padding: "12px 14px",
            resize: "none",
            lineHeight: 1.55,
            width: "100%",
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            color: "#111827",
            fontSize: 14,
            outline: "none",
            boxSizing: "border-box",
            fontFamily: "inherit",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#f97316";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.12)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#e5e7eb";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        <div style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 5 }}>
          {idea.length < 20
            ? `Keep going — ${Math.max(0, 20 - idea.length)} more characters needed`
            : `${modKey}+Enter to continue`}
        </div>
      </div>
    </div>
  );
}

function Step2({ stage, onStage }: { stage: BusinessStage | ""; onStage: (v: BusinessStage) => void }) {
  return (
    <div>
      <Heading step={2} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {STAGES.map(({ id, label, desc, icon: Icon }) => {
          const sel = stage === id;
          return (
            <button
              key={id}
              onClick={() => onStage(id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 10,
                padding: 16,
                borderRadius: 12,
                cursor: "pointer",
                background: sel ? "#fff7ed" : "#f9fafb",
                border: `1.5px solid ${sel ? "#f97316" : "#e5e7eb"}`,
                transition: "all 0.2s",
                textAlign: "left",
                boxShadow: sel ? "0 0 20px rgba(249,115,22,0.15)" : "none",
                fontFamily: "inherit",
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: sel ? "rgba(249,115,22,0.15)" : "#e5e7eb",
                transition: "background 0.2s",
              }}>
                <Icon style={{ width: 16, height: 16, color: sel ? "#f97316" : "#6b7280" }} />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>{label}</div>
                <div style={{ fontSize: 11.5, color: "#6b7280", lineHeight: 1.4, marginTop: 2 }}>{desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Step3({ challenge, onChallenge }: { challenge: string; onChallenge: (v: string) => void }) {
  return (
    <div>
      <Heading step={3} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {CHALLENGES.map(({ id, label, desc, icon: Icon }) => {
          const sel = challenge === id;
          return (
            <button
              key={id}
              onClick={() => onChallenge(id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 10,
                padding: 16,
                borderRadius: 12,
                cursor: "pointer",
                background: sel ? "#fff7ed" : "#f9fafb",
                border: `1.5px solid ${sel ? "#f97316" : "#e5e7eb"}`,
                transition: "all 0.2s",
                textAlign: "left",
                boxShadow: sel ? "0 0 20px rgba(249,115,22,0.15)" : "none",
                fontFamily: "inherit",
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: sel ? "rgba(249,115,22,0.15)" : "#e5e7eb",
                transition: "background 0.2s",
              }}>
                <Icon style={{ width: 16, height: 16, color: sel ? "#f97316" : "#6b7280" }} />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>{label}</div>
                <div style={{ fontSize: 11.5, color: "#6b7280", lineHeight: 1.4, marginTop: 2 }}>{desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WelcomeScreen({ name, onSkip }: { name: string; onSkip: () => void }) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 400);
    const fallback = setTimeout(onSkip, 8000);
    return () => { clearTimeout(t); clearTimeout(fallback); };
  }, [onSkip]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 60%, #ffffff 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }
        @keyframes lineGrow { from { width:0; } to { width:120px; } }
      `}</style>

      <div
        style={{
          position: "absolute",
          width: 700,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {showContent && (
        <div style={{ textAlign: "center", padding: "0 24px", maxWidth: 500, position: "relative", zIndex: 10 }}>
          <div style={{ animation: "scaleIn 0.6s cubic-bezier(0.16,1,0.3,1) both" }}>
            <div
              style={{
                width: 72, height: 72, borderRadius: 20,
                background: "linear-gradient(135deg, #f97316, #ea580c)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
                boxShadow: "0 8px 32px rgba(249,115,22,0.35)",
              }}
            >
              <Star style={{ width: 32, height: 32, color: "#fff", fill: "#fff" }} />
            </div>
          </div>

          <div style={{ animation: "fadeUp 0.6s ease 0.3s both", opacity: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#f97316", marginBottom: 16 }}>
              Bootcamp Ready
            </div>
            <h1 style={{ fontSize: "clamp(2.2rem, 6vw, 3.5rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.06, color: "#111827", margin: "0 0 8px" }}>
              You're in,{" "}
              <span style={{ color: "#f97316" }}>{name || "Founder"}</span>
            </h1>
          </div>

          <div
            style={{
              margin: "20px auto",
              height: 3,
              borderRadius: 3,
              background: "linear-gradient(90deg, #f97316, #ea580c)",
              boxShadow: "0 0 16px rgba(249,115,22,0.5)",
              animation: "lineGrow 0.8s cubic-bezier(0.16,1,0.3,1) 0.5s both",
              width: 0,
            }}
          />

          <div style={{ animation: "fadeUp 0.6s ease 0.6s both", opacity: 0 }}>
            <p style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.65 }}>
              Your AI mentor bootcamp is ready.
              <br />
              Let's go from idea to business.
            </p>

            <div style={{ marginTop: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 style={{ width: 16, height: 16, color: "#22c55e" }} />
                <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>Bootcamp plan created</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 style={{ width: 16, height: 16, color: "#22c55e" }} />
                <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>Nova mentor assigned</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 style={{ width: 16, height: 16, color: "#22c55e" }} />
                <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>15 AI missions unlocked</span>
              </div>
            </div>

            <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f97316", animation: "scaleIn 1s ease infinite alternate" }} />
              <span style={{ fontSize: 13, color: "#9ca3af" }}>Taking you to your dashboard…</span>
              <button onClick={onSkip} style={{ fontSize: 12, color: "#f97316", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" }}>
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
