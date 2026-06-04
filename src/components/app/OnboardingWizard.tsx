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
  { eyebrow: "Step 1 of 6 · Your Idea", heading: "What's your", accent: "var(--primary)" },
  { eyebrow: "Step 2 of 6 · Your Stage", heading: "Where are you", accent: "var(--primary)" },
  { eyebrow: "Step 3 of 6 · Your Customer", heading: "Who do you", accent: "var(--primary)" },
  { eyebrow: "Step 4 of 6 · Your Goal", heading: "What do you want", accent: "var(--primary)" },
  { eyebrow: "Step 5 of 6 · Your Revenue", heading: "Current monthly", accent: "var(--primary)" },
  { eyebrow: "Step 6 of 6 · Your Challenge", heading: "Biggest thing", accent: "var(--primary)" },
];

const HEADINGS = [
  <>
    "What's your <span style={{ color: "var(--primary)" }}>business idea</span>?"
  </>,
  <>
    Where are you <span style={{ color: "var(--primary)" }}>right now</span>?
  </>,
  <>
    Who do you <span style={{ color: "var(--primary)" }}>sell to</span>?
  </>,
  <>
    What do you want to <span style={{ color: "var(--primary)" }}>achieve</span> in 90 days?
  </>,
  <>
    Current monthly <span style={{ color: "var(--primary)" }}>revenue</span>?
  </>,
  <>
    Biggest thing <span style={{ color: "var(--primary)" }}>holding you back</span>?
  </>,
];

// ── Shared styles ─────────────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  background: "var(--surface)",
  backdropFilter: "blur(28px) saturate(1.4)",
  border: "1px solid color-mix(in oklab, var(--primary) 18%, transparent)",
  borderRadius: 22,
  boxShadow:
    "0 0 0 1px color-mix(in oklab, var(--primary) 8%, transparent), 0 40px 100px color-mix(in oklab, var(--background) 75%, transparent), inset 0 1px 0 color-mix(in oklab, var(--foreground) 5%, transparent)",
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
                ? "var(--primary)"
                : i === step
                  ? "linear-gradient(90deg, var(--primary), var(--accent))"
                  : "var(--border)",
            boxShadow: "none",
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
          ? "1.5px solid color-mix(in oklab, var(--primary) 40%, transparent)"
          : "1.5px solid var(--border-subtle)",
        background: selected ? "var(--primary-soft)" : "var(--surface)",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.18s",
        boxShadow: "none",
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
        background: selected ? "var(--primary-soft)" : "var(--border-subtle)",
        transition: "background 0.18s",
      }}
    >
      <Icon
        style={{
          width: 16,
          height: 16,
          color: selected ? "var(--primary)" : "var(--muted-foreground)",
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
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>{label}</div>
            <div
              style={{
                fontSize: 11,
                color: "var(--muted-foreground)",
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
              background: "linear-gradient(135deg, var(--primary), var(--accent))",
              fontSize: 11,
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "0.02em",
            }}
          >
            N
          </div>
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: "var(--foreground)",
              letterSpacing: "-0.01em",
            }}
          >
            Nova OS
          </span>
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--primary)",
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
            color: "var(--primary)",
            marginBottom: 8,
          }}
        >
          {eyebrow.split("·")[1]?.trim()}
        </div>
        <h2
          style={{
            fontSize: "clamp(1.6rem, 4.5vw, 2.1rem)",
            fontWeight: 800,
            color: "var(--foreground)",
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
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                fontSize: 14,
                outline: "none",
                width: "100%",
                borderRadius: 12,
                padding: "13px 14px",
                resize: "none",
                lineHeight: 1.6,
                fontFamily: "inherit",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "color-mix(in oklab, var(--primary) 50%, transparent)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border)";
              }}
            />
            <div style={{ fontSize: 10.5, color: "var(--muted-foreground)", marginTop: 6 }}>
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
              border: "1px solid var(--border)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--surface-2)",
              color: "var(--muted-foreground)",
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
                ? "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)"
                : "var(--surface-2)",
            color: canAdvance && !saving ? "#fff" : "var(--muted-foreground)",
            transition: "all 0.25s",
            boxShadow:
              canAdvance && !saving
                ? "0 0 40px color-mix(in oklab, var(--primary) 40%, transparent), 0 8px 24px color-mix(in oklab, var(--background) 60%, transparent)"
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
