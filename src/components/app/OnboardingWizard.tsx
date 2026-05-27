// TASK-061 · Guided Onboarding Wizard UI
// Multi-step wizard that collects name, idea, stage, and challenge.
// Renders inside the onboarding route and calls back with collected answers.

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Lightbulb,
  Hammer,
  DollarSign,
  TrendingUp,
  Rocket,
  Users,
  Package,
  Megaphone,
} from "lucide-react";
import type { BusinessStage } from "@/lib/lane-classifier";

export interface OnboardingAnswers {
  name: string;
  idea: string;
  stage: BusinessStage | "";
  challenge: string;
}

interface Props {
  initialName?: string;
  onComplete: (answers: OnboardingAnswers) => Promise<void>;
}

const STEPS = 3;

const STAGES: Array<{ id: BusinessStage; label: string; desc: string; Icon: React.ElementType }> = [
  {
    id: "Idea",
    label: "Just an idea",
    desc: "I have a concept but haven't built anything yet",
    Icon: Lightbulb,
  },
  {
    id: "Validate",
    label: "Building it",
    desc: "I'm actively creating the product or service",
    Icon: Hammer,
  },
  {
    id: "Operate",
    label: "I have customers",
    desc: "Real people are paying me money",
    Icon: DollarSign,
  },
  {
    id: "Scale",
    label: "Growing fast",
    desc: "I'm making money and want to grow bigger",
    Icon: TrendingUp,
  },
];

const CHALLENGES: Array<{ id: string; label: string; desc: string; Icon: React.ElementType }> = [
  {
    id: "fundraising",
    label: "Getting investment",
    desc: "I need money from investors to grow",
    Icon: Rocket,
  },
  {
    id: "customers",
    label: "Finding customers",
    desc: "I need real paying customers — fast",
    Icon: Users,
  },
  {
    id: "product",
    label: "Building the product",
    desc: "I need to ship my product or service",
    Icon: Package,
  },
  {
    id: "marketing",
    label: "Getting attention",
    desc: "Nobody knows I exist yet",
    Icon: Megaphone,
  },
];

// ── Styles ────────────────────────────────────────────────────────────
const CARD_STYLE: React.CSSProperties = {
  background: "rgba(11,11,26,0.88)",
  backdropFilter: "blur(28px) saturate(1.4)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 22,
  boxShadow:
    "0 0 0 1px rgba(59,130,246,0.06), 0 40px 100px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)",
  padding: "38px 38px 34px",
  width: "100%",
  maxWidth: 560,
};

function ProgressDots({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {Array.from({ length: STEPS }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 6,
            borderRadius: 99,
            transition: "all 0.45s cubic-bezier(0.16,1,0.3,1)",
            width: i === step ? 28 : 6,
            background: i < step ? "#22c55e" : i === step ? "#3b82f6" : "rgba(255,255,255,0.12)",
            boxShadow:
              i === step ? "0 0 14px rgba(59,130,246,0.9), 0 0 28px rgba(59,130,246,0.4)" : "none",
          }}
        />
      ))}
    </div>
  );
}

function StepLabel({ step }: { step: number }) {
  const labels = [
    {
      eyebrow: "Step 1 of 3 · Your Business Idea",
      heading: (
        <>
          Tell us about your <span style={{ color: "#3b82f6" }}>business idea</span>
        </>
      ),
    },
    {
      eyebrow: "Step 2 of 3 · Your Progress",
      heading: (
        <>
          Where are you <span style={{ color: "#8b5cf6" }}>right now</span>?
        </>
      ),
    },
    {
      eyebrow: "Step 3 of 3 · Your Biggest Problem",
      heading: (
        <>
          What's holding <span style={{ color: "#06b6d4" }}>you back</span>?
        </>
      ),
    },
  ];
  const { eyebrow, heading } = labels[step];
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#3b82f6",
          marginBottom: 8,
        }}
      >
        {eyebrow}
      </div>
      <h2
        style={{
          fontSize: "clamp(1.7rem, 5vw, 2.3rem)",
          fontWeight: 800,
          color: "#f0f4ff",
          lineHeight: 1.08,
          letterSpacing: "-0.04em",
          margin: 0,
        }}
      >
        {heading}
      </h2>
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  accentColor,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  accentColor: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        borderRadius: 14,
        border: selected ? `1.5px solid ${accentColor}55` : "1.5px solid rgba(255,255,255,0.07)",
        background: selected
          ? `rgba(${accentColor === "#3b82f6" ? "59,130,246" : accentColor === "#06b6d4" ? "6,182,212" : "255,255,255"},0.07)`
          : "rgba(255,255,255,0.03)",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.2s",
        boxShadow: selected ? `0 0 20px ${accentColor}22` : "none",
        fontFamily: "inherit",
        width: "100%",
      }}
    >
      {children}
    </button>
  );
}

export function OnboardingWizard({ initialName = "", onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [stepKey, setStepKey] = useState(0);
  const [name, setName] = useState(initialName);
  const [idea, setIdea] = useState("");
  const [stage, setStage] = useState<BusinessStage | "">("");
  const [challenge, setChallenge] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialName && !name) setName(initialName);
  }, [initialName]);

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
    if (!canAdvance || saving) return;
    if (step < STEPS - 1) {
      setStep((s) => s + 1);
      setStepKey((k) => k + 1);
    } else {
      setSaving(true);
      try {
        await onComplete({ name, idea, stage, challenge });
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div style={CARD_STYLE}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 34,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              fontSize: 11,
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "0.02em",
            }}
          >
            N
          </div>
          <span
            style={{ fontSize: 13.5, fontWeight: 600, color: "#f0f4ff", letterSpacing: "-0.01em" }}
          >
            Nova OS
          </span>
        </div>
        <ProgressDots step={step} />
      </div>

      {/* Step content */}
      <div key={stepKey}>
        {step === 0 && (
          <Step1
            name={name}
            idea={idea}
            modKey={modKey}
            onName={setName}
            onIdea={setIdea}
            onSubmit={advance}
          />
        )}
        {step === 1 && <Step2 stage={stage} onStage={setStage} />}
        {step === 2 && <Step3 challenge={challenge} onChallenge={setChallenge} />}
      </div>

      {/* Navigation */}
      <div style={{ marginTop: 28, display: "flex", gap: 10 }}>
        {step > 0 && (
          <button
            onClick={goBack}
            disabled={saving}
            aria-label="Go back"
            style={{
              height: 52,
              width: 52,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(240,244,255,0.5)",
              transition: "all 0.2s",
              flexShrink: 0,
              fontFamily: "inherit",
            }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
          </button>
        )}
        <button
          onClick={advance}
          disabled={!canAdvance || saving}
          style={{
            flex: 1,
            height: 52,
            borderRadius: 12,
            border: "none",
            cursor: canAdvance && !saving ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontWeight: 600,
            fontSize: 15,
            letterSpacing: "-0.01em",
            background:
              canAdvance && !saving
                ? "linear-gradient(135deg, #3b82f6 0%, #6366f1 60%, #8b5cf6 100%)"
                : "rgba(255,255,255,0.06)",
            color: canAdvance && !saving ? "#fff" : "rgba(255,255,255,0.25)",
            transition: "all 0.25s",
            boxShadow:
              canAdvance && !saving
                ? "0 0 40px rgba(59,130,246,0.45), 0 0 80px rgba(99,102,241,0.2), 0 8px 24px rgba(0,0,0,0.4)"
                : "none",
            fontFamily: "inherit",
          }}
        >
          {saving ? "Initializing Nova…" : step < STEPS - 1 ? "Continue" : "Launch Nova"}
          {!saving && <ArrowRight style={{ width: 17, height: 17 }} />}
        </button>
      </div>
    </div>
  );
}

// ── Step sub-components ───────────────────────────────────────────────

function Step1({
  name,
  idea,
  modKey,
  onName,
  onIdea,
  onSubmit,
}: {
  name: string;
  idea: string;
  modKey: string;
  onName: (v: string) => void;
  onIdea: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div>
      <StepLabel step={0} />
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: 11.5,
            color: "rgba(240,244,255,0.4)",
            fontWeight: 500,
            marginBottom: 7,
          }}
        >
          Your name
        </div>
        <input
          autoFocus
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder="Alex Founder"
          className="ob-input"
          style={{ height: 44, padding: "0 14px" }}
        />
      </div>
      <div>
        <div
          style={{
            fontSize: 11.5,
            color: "rgba(240,244,255,0.4)",
            fontWeight: 500,
            marginBottom: 7,
          }}
        >
          Describe your idea — who it helps and what it does
        </div>
        <textarea
          value={idea}
          onChange={(e) => onIdea(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit();
          }}
          placeholder="e.g. A meal-planning app for busy parents that automatically creates a grocery list based on what's already in their fridge"
          rows={3}
          className="ob-input"
          style={{ padding: "12px 14px", resize: "none", lineHeight: 1.55 }}
        />
        <div style={{ fontSize: 10.5, color: "rgba(240,244,255,0.25)", marginTop: 5 }}>
          {idea.length === 0
            ? `Tip: answer "who is it for?" and "what does it do?" — Nova uses this to personalize your action plan`
            : idea.length < 20
              ? `Keep going — ${20 - idea.length} more character${20 - idea.length === 1 ? "" : "s"} needed`
              : `Looks good! Press ${modKey}+Enter to continue · your idea stays private`}
        </div>
      </div>
    </div>
  );
}

function Step2({
  stage,
  onStage,
}: {
  stage: BusinessStage | "";
  onStage: (v: BusinessStage) => void;
}) {
  return (
    <div>
      <StepLabel step={1} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {STAGES.map(({ id, label, desc, Icon }) => (
          <OptionCard
            key={id}
            selected={stage === id}
            onClick={() => onStage(id)}
            accentColor="#3b82f6"
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: stage === id ? "rgba(59,130,246,0.22)" : "rgba(255,255,255,0.05)",
                transition: "background 0.2s",
              }}
            >
              <Icon
                style={{
                  width: 16,
                  height: 16,
                  color: stage === id ? "#3b82f6" : "rgba(240,244,255,0.35)",
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#f0f4ff" }}>{label}</div>
              <div
                style={{
                  fontSize: 11.5,
                  color: "rgba(240,244,255,0.38)",
                  lineHeight: 1.4,
                  marginTop: 2,
                }}
              >
                {desc}
              </div>
            </div>
          </OptionCard>
        ))}
      </div>
    </div>
  );
}

function Step3({
  challenge,
  onChallenge,
}: {
  challenge: string;
  onChallenge: (v: string) => void;
}) {
  return (
    <div>
      <StepLabel step={2} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {CHALLENGES.map(({ id, label, desc, Icon }) => (
          <OptionCard
            key={id}
            selected={challenge === id}
            onClick={() => onChallenge(id)}
            accentColor="#06b6d4"
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: challenge === id ? "rgba(6,182,212,0.18)" : "rgba(255,255,255,0.05)",
                transition: "background 0.2s",
              }}
            >
              <Icon
                style={{
                  width: 16,
                  height: 16,
                  color: challenge === id ? "#06b6d4" : "rgba(240,244,255,0.35)",
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#f0f4ff" }}>{label}</div>
              <div
                style={{
                  fontSize: 11.5,
                  color: "rgba(240,244,255,0.38)",
                  lineHeight: 1.4,
                  marginTop: 2,
                }}
              >
                {desc}
              </div>
            </div>
          </OptionCard>
        ))}
      </div>
    </div>
  );
}
