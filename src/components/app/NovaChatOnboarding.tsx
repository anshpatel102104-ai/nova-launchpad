// Nova Chat Onboarding — conversational intake, no form wizards.
// Collects the same OnboardingAnswers as the old wizard via a chat-style UI.

import React, { useState, useEffect, useRef } from "react";

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

// ── Question config ────────────────────────────────────────────────────────────

type ChipOption = { id: string; label: string; desc: string; emoji: string };

type Question =
  | { key: keyof OnboardingAnswers; type: "text"; novaText: string; placeholder: string }
  | { key: keyof OnboardingAnswers; type: "chips"; novaText: string; options: ChipOption[] };

const QUESTIONS: Question[] = [
  {
    key: "idea",
    type: "text",
    novaText:
      "Hey — I'm Nova, your AI founder OS.\n\nI'll personalise your command center right now. Takes 60 seconds.\n\nFirst: what's the business idea you're working on?",
    placeholder: "Describe your idea in a sentence or two…",
  },
  {
    key: "stage",
    type: "chips",
    novaText: "Got it.\n\nWhere are you at with it right now?",
    options: [
      { id: "Idea", label: "Just an idea", desc: "Haven't started building yet", emoji: "💡" },
      {
        id: "Validate",
        label: "Building it",
        desc: "Actively creating the product",
        emoji: "🔨",
      },
      { id: "Operate", label: "Have customers", desc: "Real people are paying", emoji: "💰" },
      { id: "Scale", label: "Growing fast", desc: "Revenue is coming in", emoji: "🚀" },
    ],
  },
  {
    key: "target_customer",
    type: "chips",
    novaText: "Understood.\n\nWho are you building this for?",
    options: [
      {
        id: "Small businesses",
        label: "Small businesses",
        desc: "Local shops, agencies, SMBs",
        emoji: "🏢",
      },
      { id: "Consumers", label: "Consumers", desc: "Everyday people (B2C)", emoji: "👤" },
      {
        id: "Freelancers/Creators",
        label: "Freelancers / Creators",
        desc: "Solopreneurs, content creators",
        emoji: "✏️",
      },
      {
        id: "Enterprises",
        label: "Enterprises",
        desc: "Mid-market or large companies",
        emoji: "🏦",
      },
    ],
  },
  {
    key: "goal",
    type: "chips",
    novaText: "Good.\n\nWhat's your number one goal for the next 90 days?",
    options: [
      {
        id: "Get first customers",
        label: "Get first customers",
        desc: "Land paying customers ASAP",
        emoji: "🎯",
      },
      {
        id: "Reach $10k MRR",
        label: "Reach $10k MRR",
        desc: "Hit meaningful recurring revenue",
        emoji: "📈",
      },
      {
        id: "Raise funding",
        label: "Raise funding",
        desc: "Secure investment capital",
        emoji: "💸",
      },
      { id: "Scale to $100k+", label: "Scale to $100k+", desc: "Grow aggressively", emoji: "🔥" },
    ],
  },
  {
    key: "revenue",
    type: "chips",
    novaText: "Clear.\n\nWhere are you on revenue today?",
    options: [
      { id: "Pre-revenue", label: "Pre-revenue", desc: "Not earning yet", emoji: "⬜" },
      { id: "$1-$1k/mo", label: "$1 – $1k / mo", desc: "Early traction", emoji: "🟡" },
      { id: "$1k-$10k/mo", label: "$1k – $10k / mo", desc: "Growing", emoji: "🟠" },
      { id: "$10k+/mo", label: "$10k+ / mo", desc: "Scaling fast", emoji: "🟢" },
    ],
  },
  {
    key: "challenge",
    type: "chips",
    novaText: "Last one.\n\nWhat's your biggest blocker right now?",
    options: [
      {
        id: "Finding customers",
        label: "Finding customers",
        desc: "Lead gen and acquisition",
        emoji: "🔍",
      },
      {
        id: "Building product",
        label: "Building the product",
        desc: "Product development speed",
        emoji: "⚙️",
      },
      {
        id: "Marketing",
        label: "Marketing & content",
        desc: "Getting visibility",
        emoji: "📣",
      },
      { id: "Fundraising", label: "Raising capital", desc: "Getting funded", emoji: "💰" },
    ],
  },
];

// ── Message types ─────────────────────────────────────────────────────────────

type Msg = { id: string; from: "nova"; text: string } | { id: string; from: "user"; text: string };

// ── Component ────────────────────────────────────────────────────────────────

const ANIM = `
  @keyframes msgIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes dot {
    0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
    40%           { opacity: 1;   transform: scale(1);   }
  }
  @keyframes chipIn {
    from { opacity: 0; transform: scale(0.96) translateY(6px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
`;

export function NovaChatOnboarding({ onComplete }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [step, setStep] = useState(0); // current question index
  const [typing, setTyping] = useState(false); // Nova typing indicator
  const [inputReady, setInputReady] = useState(false); // show input/chips
  const [textValue, setTextValue] = useState("");
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, inputReady]);

  // kick off first question on mount
  useEffect(() => {
    deliverNovaMessage(0);
  }, []);

  function deliverNovaMessage(qIdx: number) {
    if (qIdx >= QUESTIONS.length) return;
    setTyping(true);
    setInputReady(false);
    const delay = qIdx === 0 ? 600 : 500;
    setTimeout(() => {
      setTyping(false);
      const q = QUESTIONS[qIdx];
      setMessages((prev) => [...prev, { id: `nova-${qIdx}`, from: "nova", text: q.novaText }]);
      setTimeout(() => setInputReady(true), 220);
    }, delay + 600);
  }

  function submitAnswer(value: string) {
    if (!value.trim() || submitting) return;
    const q = QUESTIONS[step];
    const label =
      q.type === "chips" ? (q.options.find((o) => o.id === value)?.label ?? value) : value.trim();

    const newAnswers = { ...answers, [q.key]: value.trim() };
    setAnswers(newAnswers);
    setInputReady(false);
    setTextValue("");

    setMessages((prev) => [...prev, { id: `user-${step}`, from: "user", text: label }]);

    const nextStep = step + 1;

    if (nextStep >= QUESTIONS.length) {
      // all questions answered
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setDone(true);
        setMessages((prev) => [
          ...prev,
          {
            id: "nova-final",
            from: "nova",
            text: "Perfect — I have everything I need.\n\nBuilding your command center now.",
          },
        ]);
        setSubmitting(true);
        setTimeout(async () => {
          await onComplete(newAnswers as OnboardingAnswers);
        }, 1200);
      }, 900);
    } else {
      setStep(nextStep);
      deliverNovaMessage(nextStep);
    }
  }

  const currentQ = QUESTIONS[step];

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 620,
        display: "flex",
        flexDirection: "column",
        height: "min(640px, 90vh)",
      }}
    >
      <style>{ANIM}</style>

      {/* Progress bar */}
      <div
        style={{
          height: 2,
          borderRadius: 2,
          background: "rgba(249,115,22,0.15)",
          marginBottom: 24,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${((Math.min(step, QUESTIONS.length) / QUESTIONS.length) * 100).toFixed(0)}%`,
            background: "linear-gradient(90deg, #f97316, #fbbf24)",
            borderRadius: 2,
            transition: "width 0.5s ease",
          }}
        />
      </div>

      {/* Message list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingBottom: 8,
          scrollbarWidth: "none",
        }}
      >
        {messages.map((msg) => (
          <ChatBubble key={msg.id} msg={msg} />
        ))}

        {typing && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      {inputReady && !done && (
        <div style={{ animation: "fadeIn 0.3s ease both", marginTop: 16 }}>
          {currentQ.type === "text" ? (
            <TextInput
              placeholder={currentQ.placeholder}
              value={textValue}
              onChange={setTextValue}
              onSubmit={() => submitAnswer(textValue)}
              textareaRef={textareaRef}
            />
          ) : (
            <ChipGrid options={currentQ.options} onSelect={submitAnswer} />
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ChatBubble({ msg }: { msg: Msg }) {
  const isNova = msg.from === "nova";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isNova ? "flex-start" : "flex-end",
        marginBottom: 14,
        animation: "msgIn 0.35s ease both",
      }}
    >
      {isNova && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #f97316, #ea580c)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 800,
            color: "#fff",
            flexShrink: 0,
            marginRight: 10,
            marginTop: 4,
            boxShadow: "0 0 12px rgba(249,115,22,0.35)",
          }}
        >
          N
        </div>
      )}
      <div
        style={{
          maxWidth: "78%",
          padding: isNova ? "12px 16px" : "10px 15px",
          borderRadius: isNova ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
          background: isNova
            ? "rgba(255,255,255,0.05)"
            : "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
          border: isNova ? "1px solid rgba(255,255,255,0.08)" : "none",
          fontSize: 14,
          lineHeight: 1.65,
          color: isNova ? "rgba(247,240,232,0.88)" : "#fff",
          fontFamily: "inherit",
          whiteSpace: "pre-line",
        }}
      >
        {msg.text}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 14,
        animation: "msgIn 0.25s ease both",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #f97316, #ea580c)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 800,
          color: "#fff",
          flexShrink: 0,
          boxShadow: "0 0 12px rgba(249,115,22,0.35)",
        }}
      >
        N
      </div>
      <div
        style={{
          padding: "12px 16px",
          borderRadius: "4px 16px 16px 16px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          gap: 5,
          alignItems: "center",
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#f97316",
              display: "inline-block",
              animation: `dot 1.2s ease-in-out ${i * 0.16}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function TextInput({
  placeholder,
  value,
  onChange,
  onSubmit,
  textareaRef,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(249,115,22,0.25)",
        borderRadius: 14,
        padding: "10px 10px 10px 16px",
        transition: "border-color 0.2s",
      }}
    >
      <textarea
        ref={textareaRef}
        autoFocus
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        rows={2}
        style={{
          flex: 1,
          background: "none",
          border: "none",
          outline: "none",
          resize: "none",
          color: "rgba(247,240,232,0.9)",
          fontSize: 14,
          lineHeight: 1.6,
          fontFamily: "inherit",
        }}
      />
      <button
        onClick={onSubmit}
        disabled={!value.trim()}
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: value.trim() ? "#f97316" : "rgba(249,115,22,0.2)",
          border: "none",
          cursor: value.trim() ? "pointer" : "not-allowed",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          alignSelf: "flex-end",
          transition: "background 0.2s",
          fontSize: 16,
        }}
      >
        ↑
      </button>
    </div>
  );
}

function ChipGrid({
  options,
  onSelect,
}: {
  options: ChipOption[];
  onSelect: (id: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const choose = (id: string) => {
    if (selected) return;
    setSelected(id);
    setTimeout(() => onSelect(id), 200);
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8,
      }}
    >
      {options.map((opt, i) => (
        <button
          key={opt.id}
          onClick={() => choose(opt.id)}
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            background: selected === opt.id ? "rgba(249,115,22,0.18)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${selected === opt.id ? "rgba(249,115,22,0.6)" : "rgba(255,255,255,0.08)"}`,
            cursor: selected ? "default" : "pointer",
            textAlign: "left",
            transition: "all 0.15s",
            animation: `chipIn 0.3s ease ${i * 0.06}s both`,
            opacity: selected && selected !== opt.id ? 0.45 : 1,
          }}
        >
          <div style={{ fontSize: 18, marginBottom: 4 }}>{opt.emoji}</div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: selected === opt.id ? "#f97316" : "rgba(247,240,232,0.9)",
              lineHeight: 1.3,
            }}
          >
            {opt.label}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "rgba(247,240,232,0.4)",
              marginTop: 2,
              lineHeight: 1.3,
            }}
          >
            {opt.desc}
          </div>
        </button>
      ))}
    </div>
  );
}
