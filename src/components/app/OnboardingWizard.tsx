import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Lightbulb,
  Hammer,
  DollarSign,
  TrendingUp,
  Users,
  Briefcase,
  ShoppingBag,
  Building2,
  Target,
  Rocket,
  BarChart2,
  Layers,
  UserX,
  Package,
  Megaphone,
  Banknote,
} from "lucide-react";

export interface OnboardingAnswers {
  idea: string;
  stage: string;
  target_customer: string;
  goal: string;
  revenue: string;
  challenge: string;
}

interface Props {
  onComplete: (answers: OnboardingAnswers) => Promise<void>;
}

const TOTAL_STEPS = 6;

// ── Question data ─────────────────────────────────────────────────────────────

const STAGES = [
  { id: "Idea", label: "Just an idea", desc: "Haven't built anything yet", Icon: Lightbulb },
  { id: "Validate", label: "Building it", desc: "Actively creating the product", Icon: Hammer },
  { id: "Operate", label: "Have customers", desc: "Real people are paying me", Icon: DollarSign },
  { id: "Scale", label: "Growing fast", desc: "Revenue is coming in", Icon: TrendingUp },
];

const CUSTOMERS = [
  {
    id: "Small businesses",
    label: "Small businesses",
    desc: "Local shops, agencies, SMBs",
    Icon: Briefcase,
  },
  { id: "Consumers", label: "Consumers", desc: "Everyday people (B2C)", Icon: ShoppingBag },
  {
    id: "Freelancers/Creators",
    label: "Freelancers / Creators",
    desc: "Solopreneurs, content creators",
    Icon: Users,
  },
  {
    id: "Enterprises",
    label: "Enterprises",
    desc: "Mid-market or large companies",
    Icon: Building2,
  },
];

const GOALS = [
  {
    id: "Get first customers",
    label: "Get first customers",
    desc: "Land paying customers ASAP",
    Icon: Target,
  },
  {
    id: "Reach $10k MRR",
    label: "Reach $10k MRR",
    desc: "Hit meaningful recurring revenue",
    Icon: BarChart2,
  },
  { id: "Raise funding", label: "Raise funding", desc: "Secure investors or grants", Icon: Rocket },
  {
    id: "Scale to $100k+",
    label: "Scale to $100k+",
    desc: "Build a real growth engine",
    Icon: Layers,
  },
];

const REVENUES = [
  { id: "Pre-revenue", label: "Pre-revenue", desc: "$0 — not yet monetised", Icon: DollarSign },
  { id: "$1–$1k/mo", label: "$1 – $1k/mo", desc: "Early traction", Icon: Banknote },
  {
    id: "$1k–$10k/mo",
    label: "$1k – $10k/mo",
    desc: "Product-market fit forming",
    Icon: TrendingUp,
  },
  { id: "$10k+/mo", label: "$10k+/mo", desc: "Established revenue", Icon: BarChart2 },
];

const CHALLENGES = [
  {
    id: "Finding customers",
    label: "Finding customers",
    desc: "No leads, no pipeline",
    Icon: UserX,
  },
  {
    id: "Building the product",
    label: "Building product",
    desc: "Shipping is the bottleneck",
    Icon: Package,
  },
  {
    id: "Marketing & awareness",
    label: "Getting attention",
    desc: "Nobody knows I exist",
    Icon: Megaphone,
  },
  { id: "Fundraising", label: "Raising capital", desc: "Need investors or revenue", Icon: Rocket },
];

const STEP_META = [
  { eyebrow: "Step 1 of 6 · Your Idea", heading: "What's your", accent: "#f97316" },
  { eyebrow: "Step 2 of 6 · Your Stage", heading: "Where are you", accent: "#f97316" },
  { eyebrow: "Step 3 of 6 · Your Customer", heading: "Who do you", accent: "#fb923c" },
  { eyebrow: "Step 4 of 6 · Your Goal", heading: "What do you want", accent: "#f97316" },
  { eyebrow: "Step 5 of 6 · Your Revenue", heading: "Current monthly", accent: "#fb923c" },
  { eyebrow: "Step 6 of 6 · Your Challenge", heading: "Biggest thing", accent: "#f97316" },
];

const HEADINGS = [
  <>
    "What's your <span style={{ color: "#f97316" }}>business idea</span>?"
  </>,
  <>
    Where are you <span style={{ color: "#f97316" }}>right now</span>?
  </>,
  <>
    Who do you <span style={{ color: "#fb923c" }}>sell to</span>?
  </>,
  <>
    What do you want to <span style={{ color: "#f97316" }}>achieve</span> in 90 days?
  </>,
  <>
    Current monthly <span style={{ color: "#fb923c" }}>revenue</span>?
  </>,
  <>
    Biggest thing <span style={{ color: "#f97316" }}>holding you back</span>?
  </>,
];

// ── Shared styles ─────────────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  background: "rgba(10,8,5,0.92)",
  backdropFilter: "blur(28px) saturate(1.4)",
  border: "1px solid rgba(249,115,22,0.12)",
  borderRadius: 22,
  boxShadow:
    "0 0 0 1px rgba(249,115,22,0.06), 0 40px 100px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.05)",
  padding: "38px 38px 34px",
  width: "100%",
  maxWidth: 560,
};

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 4,
            flex: 1,
            borderRadius: 99,
            transition: "background 0.4s ease",
            background:
              i < step
                ? "#f97316"
                : i === step
                  ? "linear-gradient(90deg, #f97316, #fbbf24)"
                  : "rgba(255,255,255,0.08)",
            boxShadow: i === step ? "0 0 10px rgba(249,115,22,0.6)" : "none",
          }}
        />
      ))}
    </div>
  );
}

// ── Option card ───────────────────────────────────────────────────────────────

function OptionCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "13px 15px",
        borderRadius: 13,
        border: selected
          ? "1.5px solid rgba(249,115,22,0.5)"
          : "1.5px solid rgba(255,255,255,0.07)",
        background: selected ? "rgba(249,115,22,0.09)" : "rgba(255,255,255,0.03)",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.18s",
        boxShadow: selected ? "0 0 20px rgba(249,115,22,0.18)" : "none",
        fontFamily: "inherit",
        width: "100%",
      }}
    >
      {children}
    </button>
  );
}

// ── Icon box ──────────────────────────────────────────────────────────────────

function IconBox({ Icon, selected }: { Icon: React.ElementType; selected: boolean }) {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 9,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: selected ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.05)",
        transition: "background 0.18s",
      }}
    >
      <Icon
        style={{
          width: 16,
          height: 16,
          color: selected ? "#f97316" : "rgba(240,244,255,0.3)",
        }}
      />
    </div>
  );
}

// ── MC grid ───────────────────────────────────────────────────────────────────

function MCGrid({
  options,
  value,
  onChange,
}: {
  options: Array<{ id: string; label: string; desc: string; Icon: React.ElementType }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
      {options.map(({ id, label, desc, Icon }) => (
        <OptionCard key={id} selected={value === id} onClick={() => onChange(id)}>
          <IconBox Icon={Icon} selected={value === id} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f7f0e8" }}>{label}</div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(240,230,220,0.38)",
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
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export function OnboardingWizard({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [key, setKey] = useState(0);
  const [saving, setSaving] = useState(false);

  const [idea, setIdea] = useState("");
  const [stage, setStage] = useState("");
  const [targetCustomer, setTargetCustomer] = useState("");
  const [goal, setGoal] = useState("");
  const [revenue, setRevenue] = useState("");
  const [challenge, setChallenge] = useState("");

  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? "⌘" : "Ctrl";

  const canAdvance =
    step === 0
      ? idea.trim().length >= 20
      : step === 1
        ? !!stage
        : step === 2
          ? !!targetCustomer
          : step === 3
            ? !!goal
            : step === 4
              ? !!revenue
              : !!challenge;

  const goBack = () => {
    if (step > 0) {
      setStep((s) => s - 1);
      setKey((k) => k + 1);
    }
  };

  const advance = async () => {
    if (!canAdvance || saving) return;
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
      setKey((k) => k + 1);
    } else {
      setSaving(true);
      try {
        await onComplete({
          idea,
          stage,
          target_customer: targetCustomer,
          goal,
          revenue,
          challenge,
        });
      } finally {
        setSaving(false);
      }
    }
  };

  const { eyebrow } = STEP_META[step];

  return (
    <div style={CARD}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
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
              background: "linear-gradient(135deg, #f97316, #ea580c)",
              fontSize: 11,
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "0.02em",
            }}
          >
            N
          </div>
          <span
            style={{ fontSize: 13.5, fontWeight: 600, color: "#f7f0e8", letterSpacing: "-0.01em" }}
          >
            Nova OS
          </span>
        </div>
        <div
          style={{
            fontSize: 11,
            color: "rgba(249,115,22,0.7)",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {eyebrow.split("·")[0].trim()}
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 30 }}>
        <ProgressBar step={step} />
      </div>

      {/* Step heading */}
      <div key={key} style={{ marginBottom: 22 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(249,115,22,0.75)",
            marginBottom: 8,
          }}
        >
          {eyebrow.split("·")[1]?.trim()}
        </div>
        <h2
          style={{
            fontSize: "clamp(1.6rem, 4.5vw, 2.1rem)",
            fontWeight: 800,
            color: "#f7f0e8",
            lineHeight: 1.1,
            letterSpacing: "-0.04em",
            margin: 0,
          }}
        >
          {HEADINGS[step]}
        </h2>
      </div>

      {/* Step content */}
      <div key={`content-${key}`}>
        {step === 0 && (
          <div>
            <textarea
              autoFocus
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) advance();
              }}
              placeholder="e.g. A SaaS tool for freelance designers to automate client invoicing and follow-ups, saving 3+ hours a week"
              rows={4}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(249,115,22,0.2)",
                color: "#f7f0e8",
                fontSize: 14,
                outline: "none",
                width: "100%",
                borderRadius: 12,
                padding: "13px 14px",
                resize: "none",
                lineHeight: 1.6,
                fontFamily: "inherit",
                boxSizing: "border-box",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(249,115,22,0.55)";
                e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(249,115,22,0.2)";
                e.target.style.boxShadow = "none";
              }}
            />
            <div style={{ fontSize: 10.5, color: "rgba(240,230,220,0.3)", marginTop: 6 }}>
              {idea.length === 0
                ? `Describe who it's for and what it does — Nova personalizes your entire dashboard from this`
                : idea.length < 20
                  ? `${20 - idea.length} more characters needed`
                  : `Good — press ${modKey}+Enter to continue`}
            </div>
          </div>
        )}
        {step === 1 && <MCGrid options={STAGES} value={stage} onChange={setStage} />}
        {step === 2 && (
          <MCGrid options={CUSTOMERS} value={targetCustomer} onChange={setTargetCustomer} />
        )}
        {step === 3 && <MCGrid options={GOALS} value={goal} onChange={setGoal} />}
        {step === 4 && <MCGrid options={REVENUES} value={revenue} onChange={setRevenue} />}
        {step === 5 && <MCGrid options={CHALLENGES} value={challenge} onChange={setChallenge} />}
      </div>

      {/* Navigation */}
      <div style={{ marginTop: 28, display: "flex", gap: 10 }}>
        {step > 0 && (
          <button
            onClick={goBack}
            disabled={saving}
            style={{
              height: 52,
              width: 52,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.09)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(240,230,220,0.4)",
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
                ? "linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                : "rgba(255,255,255,0.06)",
            color: canAdvance && !saving ? "#fff" : "rgba(255,255,255,0.2)",
            transition: "all 0.25s",
            boxShadow:
              canAdvance && !saving
                ? "0 0 40px rgba(249,115,22,0.4), 0 8px 24px rgba(0,0,0,0.4)"
                : "none",
            fontFamily: "inherit",
          }}
        >
          {saving
            ? "Building your dashboard…"
            : step < TOTAL_STEPS - 1
              ? "Continue"
              : "Launch Nova"}
          {!saving && <ArrowRight style={{ width: 17, height: 17 }} />}
        </button>
      </div>
    </div>
  );
}
