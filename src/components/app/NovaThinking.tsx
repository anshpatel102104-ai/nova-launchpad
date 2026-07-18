import { useEffect, useRef, useState } from "react";
import { Zap } from "lucide-react";

// Staged, literal status copy — advances with elapsed time instead of
// cycling. Boring on purpose: it should read like a status line, not sales
// copy. The last stage holds until the run finishes.
const RUN_STAGES: Array<{ afterSeconds: number; label: string }> = [
  { afterSeconds: 0, label: "Reading your business context…" },
  { afterSeconds: 3, label: "Working through your inputs…" },
  { afterSeconds: 8, label: "Writing the result…" },
  { afterSeconds: 20, label: "Still working — long runs can take up to a minute…" },
];

type Props = {
  streamText: string;
  toolName?: string;
};

export function NovaThinking({ streamText, toolName }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const started = Date.now();
    const interval = setInterval(() => {
      setElapsed((Date.now() - started) / 1000);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const stage = [...RUN_STAGES].reverse().find((s) => elapsed >= s.afterSeconds) ?? RUN_STAGES[0];

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
          <div className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>
            {toolName ? `Nova — ${toolName}` : "Nova AI"}
          </div>
          <div
            className="text-[11.5px] transition-all duration-500"
            style={{ color: "var(--muted-foreground)" }}
            key={stage.label}
          >
            {stage.label}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="font-mono text-[10px]" style={{ color: "var(--muted-foreground)" }}>
            {charCount > 0 ? `${charCount} chars` : `${Math.floor(elapsed)}s`}
          </span>
          <ThinkingDots />
        </div>
      </div>

      {/* Stream display — only when the run actually streams text.
          Non-streaming runs (most tools) show the staged status line alone,
          never an empty panel with a blinking caret. */}
      {streamText.length > 0 && (
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
              {streamText}
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
      )}

      <style>{`
        @keyframes caret-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="caret-blink"] { animation: none !important; }
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
        @media (prefers-reduced-motion: reduce) {
          [style*="dotBounce"] { animation: none !important; }
        }
      `}</style>
    </span>
  );
}
