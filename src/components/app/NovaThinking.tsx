import { useEffect, useRef, useState } from "react";
import { Zap } from "lucide-react";

const THINKING_PHRASES = [
  "Nova is analyzing your context…",
  "Building your strategy…",
  "Synthesizing market intelligence…",
  "Crafting your output…",
  "Running competitive analysis…",
  "Structuring insights…",
  "Consulting the knowledge base…",
  "Generating your asset…",
];

type Props = {
  streamText: string;
  toolName?: string;
};

export function NovaThinking({ streamText, toolName }: Props) {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIdx((i) => (i + 1) % THINKING_PHRASES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCharCount(streamText.length);
    if (textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [streamText]);

  return (
    <div className="flex flex-col gap-4 py-2">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "var(--primary-soft)" }}
        >
          <Zap className="h-4 w-4" style={{ color: "var(--primary)" }} />
        </div>
        <div>
          <div
            className="text-[13px] font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            {toolName ? `Nova — ${toolName}` : "Nova AI"}
          </div>
          <div
            className="text-[11.5px] transition-all duration-500"
            style={{ color: "var(--muted-foreground)" }}
            key={phraseIdx}
          >
            {THINKING_PHRASES[phraseIdx]}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="font-mono text-[10px]" style={{ color: "var(--muted-foreground)" }}>
            {charCount} chars
          </span>
          <ThinkingDots />
        </div>
      </div>

      {/* Stream display */}
      <div
        ref={textRef}
        className="relative overflow-hidden rounded-xl"
        style={{
          maxHeight: "280px",
          overflowY: "auto",
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="px-4 py-3">
          <div
            className="font-mono text-[10.5px] leading-relaxed break-all whitespace-pre-wrap"
            style={{ color: "var(--muted-foreground)" }}
          >
            {streamText || ""}
            <span
              className="inline-block w-1.5 h-3 ml-0.5 align-middle"
              style={{
                background: "var(--primary)",
                animation: "caret-blink 0.7s steps(2) infinite",
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes caret-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function ThinkingDots() {
  return (
    <span className="flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full"
          style={{
            background: "var(--primary)",
            animation: "dotBounce 1.4s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </span>
  );
}
