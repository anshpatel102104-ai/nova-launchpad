import { useEffect, useRef, useState } from "react";

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
        <NeuralOrb />
        <div>
          <div
            className="text-[13px] font-semibold transition-all duration-700"
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
        <div className="ml-auto flex items-center gap-1.5">
          <span className="font-mono text-[10px]" style={{ color: "var(--primary)", opacity: 0.7 }}>
            {charCount} tokens
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
          border: "1px solid rgba(59,130,246,0.15)",
        }}
      >
        {/* Scan line effect */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-20 z-10"
          style={{
            background: "linear-gradient(to bottom, var(--surface-2), transparent)",
          }}
        />

        <div className="px-4 py-3">
          <div
            className="font-mono text-[10.5px] leading-relaxed break-all whitespace-pre-wrap"
            style={{ color: "rgba(59,130,246,0.9)" }}
          >
            {streamText || ""}
            <span
              className="inline-block w-1.5 h-3 ml-0.5 align-middle"
              style={{
                background: "var(--primary)",
                animation: "caret-blink 0.7s steps(2) infinite",
                boxShadow: "0 0 6px var(--primary)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Wave bars */}
      <div className="flex items-center justify-center gap-1 py-1">
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: "3px",
              height: "16px",
              background:
                i % 3 === 0
                  ? "var(--primary)"
                  : i % 3 === 1
                    ? "var(--accent)"
                    : "rgba(6,182,212,0.7)",
              animation: `wavebar 1.2s ease-in-out infinite`,
              animationDelay: `${i * 0.1}s`,
              opacity: 0.7,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes wavebar {
          0%, 100% { transform: scaleY(0.3); opacity: 0.4; }
          50% { transform: scaleY(1); opacity: 1; }
        }
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

function NeuralOrb() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const SIZE = 44;
    canvas.width = SIZE;
    canvas.height = SIZE;
    const cx = SIZE / 2;
    const cy = SIZE / 2;

    const ringData = [
      { r: 18, alpha: 0.25, speed: 0.025, color: "#3b82f6" },
      { r: 13, alpha: 0.35, speed: -0.035, color: "#8b5cf6" },
      { r: 8, alpha: 0.5, speed: 0.05, color: "#06b6d4" },
    ];

    const tick = () => {
      ctx.clearRect(0, 0, SIZE, SIZE);
      frame++;

      // Outer glow
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
      grd.addColorStop(0, "rgba(59,130,246,0.35)");
      grd.addColorStop(0.5, "rgba(139,92,246,0.15)");
      grd.addColorStop(1, "rgba(59,130,246,0)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.fill();

      // Rings
      ringData.forEach((ring, idx) => {
        const angle = frame * ring.speed;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.arc(0, 0, ring.r, 0, Math.PI * 1.6);
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = ring.alpha + 0.15 * Math.sin(frame * 0.04 + idx);
        ctx.shadowBlur = 8;
        ctx.shadowColor = ring.color;
        ctx.stroke();
        ctx.restore();

        // Dot on ring
        const dotAngle = frame * ring.speed + Math.PI * 1.6;
        const dx = Math.cos(dotAngle) * ring.r;
        const dy = Math.sin(dotAngle) * ring.r;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx + dx, cy + dy, 2, 0, Math.PI * 2);
        ctx.fillStyle = ring.color;
        ctx.globalAlpha = 0.9;
        ctx.shadowBlur = 10;
        ctx.shadowColor = ring.color;
        ctx.fill();
        ctx.restore();
      });

      // Core pulse
      const pulse = 0.7 + 0.3 * Math.sin(frame * 0.06);
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, 4 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = "#60a5fa";
      ctx.globalAlpha = 0.9;
      ctx.shadowBlur = 16;
      ctx.shadowColor = "#3b82f6";
      ctx.fill();
      ctx.restore();

      animId = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} style={{ width: 44, height: 44, flexShrink: 0 }} />;
}
