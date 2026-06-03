// Nova AI Chat — JARVIS-style full-screen overlay for Nova Launchpad.
// Streams responses from the nova-chat edge function with action chip support.

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { buildAgentContext } from "@/lib/agent-context";
import { Sparkles, Send, X, RotateCcw, ArrowUpRight, Zap, Activity } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
};

const QUICK_PROMPTS = [
  "What should I work on next?",
  "Analyse my startup progress",
  "What's my highest-leverage move?",
  "How do I get my first 10 customers?",
  "Show me the AI tool suite",
];

const BOOT_LINES = [
  "NOVA CORE INITIALIZING...",
  "SCANNING WORKSPACE DATA...",
  "LOADING AI MODULES...",
  "ALL SYSTEMS ONLINE",
];

function renderText(text: string): React.ReactNode {
  return text.split("\n").map((line, j, arr) => {
    const isBullet = line.startsWith("- ") || line.startsWith("• ");
    const content = isBullet ? line.slice(2) : line;
    const boldParts = content.split(/(\*\*[^*]+\*\*)/g);
    const rendered = boldParts.map((bp, k) => {
      const bold = bp.match(/\*\*([^*]+)\*\*/);
      return bold ? <strong key={k}>{bold[1]}</strong> : <span key={k}>{bp}</span>;
    });
    return (
      <span key={j}>
        {isBullet && (
          <span
            style={{ display: "inline-block", width: 14, color: "var(--primary)", opacity: 0.8 }}
          >
            ›
          </span>
        )}
        {rendered}
        {j < arr.length - 1 && <br />}
      </span>
    );
  });
}

function renderContent(text: string, onNavigate: (path: string) => void): React.ReactNode[] {
  const ALL_RE = /(\[→\s*TOOL:\s*([^|]+)\|\s*([^\]]+)\])|(\*\*\[(.+?)\]\((.+?)\)\*\*)/g;
  const segments: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = ALL_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push(
        <span key={`t-${match.index}`}>{renderText(text.slice(lastIndex, match.index))}</span>,
      );
    }
    if (match[1]) {
      const toolKey = match[2].trim();
      const label = match[3].trim();
      segments.push(
        <button
          key={`chip-${match.index}`}
          onClick={() => onNavigate(`/app/launchpad/${toolKey}`)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 10px",
            borderRadius: 20,
            border: "1px solid rgba(249,115,22,0.5)",
            background: "rgba(249,115,22,0.1)",
            color: "#F97316",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            margin: "2px 3px",
            transition: "all 0.12s",
            verticalAlign: "middle",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(249,115,22,0.2)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(249,115,22,0.8)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(249,115,22,0.1)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(249,115,22,0.5)";
          }}
        >
          <Zap style={{ width: 10, height: 10 }} />
          {label}
        </button>,
      );
    } else if (match[4]) {
      const label = match[5];
      const path = match[6];
      segments.push(
        <Link
          key={`link-${match.index}`}
          to={path as never}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            fontWeight: 600,
            color: "#F97316",
            textDecoration: "none",
            verticalAlign: "middle",
          }}
        >
          {label}
          <ArrowUpRight style={{ width: 11, height: 11 }} />
        </Link>,
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push(<span key={`tail`}>{renderText(text.slice(lastIndex))}</span>);
  }
  return segments;
}

interface Props {
  open: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export function NovaChatModal({ open, onClose, initialQuery }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [context, setContext] = useState<Record<string, unknown>>({});
  const [bootPhase, setBootPhase] = useState(0);
  const hasBooted = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch workspace context once on open
  useEffect(() => {
    if (!open || !user?.id) return;
    buildAgentContext(user.id).then((ctx) => setContext(ctx as unknown as Record<string, unknown>));
  }, [open, user?.id]);

  // Boot sequence animation
  useEffect(() => {
    if (!open) return;
    if (hasBooted.current) {
      setBootPhase(4);
      return;
    }
    setBootPhase(0);
    const timers = [
      setTimeout(() => setBootPhase(1), 480),
      setTimeout(() => setBootPhase(2), 960),
      setTimeout(() => setBootPhase(3), 1440),
      setTimeout(() => {
        setBootPhase(4);
        hasBooted.current = true;
        setTimeout(() => inputRef.current?.focus(), 80);
      }, 1900),
    ];
    return () => timers.forEach(clearTimeout);
  }, [open]);

  // Auto-focus + handle initialQuery
  useEffect(() => {
    if (open && hasBooted.current) {
      setTimeout(() => inputRef.current?.focus(), 80);
      if (initialQuery && messages.length === 0) setInput(initialQuery);
    }
  }, [open]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const handleClose = () => {
    abortRef.current?.abort();
    onClose();
  };

  const resetChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setInput("");
    setStreaming(false);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      pending: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setStreaming(true);

    const updatedHistory = [...messages, userMsg];

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const abort = new AbortController();
      abortRef.current = abort;

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nova-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: updatedHistory.map((m) => ({ role: m.role, content: m.content })),
          context,
        }),
        signal: abort.signal,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `HTTP ${resp.status}`);
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
              accumulated += parsed.delta.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id ? { ...m, content: accumulated, pending: false } : m,
                ),
              );
            }
          } catch {
            // non-JSON SSE line, skip
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: accumulated || "No response generated.", pending: false }
            : m,
        ),
      );
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error && err.name === "AbortError"
          ? null
          : `Error: ${err instanceof Error ? err.message : "Unknown"}`.trim();

      setMessages((prev) =>
        prev
          .map((m) =>
            m.id === assistantMsg.id ? { ...m, content: errMsg ?? "", pending: false } : m,
          )
          .filter((m) => m.id !== assistantMsg.id || errMsg),
      );
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Extract telemetry from workspace context
  const ctxAny = context as Record<string, unknown> & {
    name?: string;
    plan?: string;
    idea?: string;
    mission?: string;
    recentToolRuns?: Array<{ toolKey?: string; tool?: string }>;
    toolRunCount?: number;
  };
  const displayName = ctxAny.name || user?.email?.split("@")[0] || "Founder";
  const planTier = (ctxAny.plan as string) || "starter";
  const currentIdea = (ctxAny.idea as string) || null;
  const currentMission = (ctxAny.mission as string) || null;
  const recentRuns = (ctxAny.recentToolRuns as Array<{ toolKey?: string; tool?: string }>) || [];
  const toolRunCount = (ctxAny.toolRunCount as number) || 0;

  if (typeof window === "undefined") return null;

  const content = open ? (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.88)",
          backdropFilter: "blur(6px)",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "relative",
          width: "min(94vw, 1080px)",
          height: "min(92vh, 780px)",
          borderRadius: 20,
          border: "1px solid rgba(249,115,22,0.2)",
          background: "#0d0d0f",
          boxShadow: "0 32px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(249,115,22,0.06) inset",
          display: "flex",
          overflow: "hidden",
          backgroundImage:
            "linear-gradient(rgba(249,115,22,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.025) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      >
        {/* ── Left Sidebar ── */}
        <div
          style={{
            width: 248,
            borderRight: "1px solid rgba(249,115,22,0.1)",
            display: "flex",
            flexDirection: "column",
            padding: "20px 16px",
            gap: 20,
            flexShrink: 0,
            overflow: "hidden",
          }}
          className="nova-sidebar"
        >
          {/* Nova Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #F97316, #ea580c)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: streaming
                  ? "0 0 0 3px rgba(249,115,22,0.25), 0 0 14px rgba(249,115,22,0.3)"
                  : "0 0 10px rgba(249,115,22,0.2)",
                transition: "box-shadow 0.4s",
              }}
            >
              <Sparkles style={{ width: 15, height: 15, color: "#fff" }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: 0.5 }}>
                NOVA
              </div>
              <div style={{ fontSize: 10, color: "#F97316", letterSpacing: 1.5, opacity: 0.8 }}>
                AI INTELLIGENCE
              </div>
            </div>
          </div>

          {/* System status */}
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(249,115,22,0.12)",
              background: "rgba(249,115,22,0.04)",
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: "rgba(249,115,22,0.6)",
                letterSpacing: 1.5,
                marginBottom: 8,
              }}
            >
              SYSTEM STATUS
            </div>
            {[
              { label: "AI Core", ok: true },
              { label: "Workspace", ok: Object.keys(context).length > 0 },
              { label: "Streaming", ok: true },
            ].map(({ label, ok }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 5,
                }}
              >
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{label}</span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: ok ? "#22c55e" : "#ef4444",
                    letterSpacing: 1,
                  }}
                >
                  {ok ? "ONLINE" : "OFFLINE"}
                </span>
              </div>
            ))}
          </div>

          {/* Founder telemetry */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 9, color: "rgba(249,115,22,0.6)", letterSpacing: 1.5 }}>
              WORKSPACE INTEL
            </div>
            <TelemetryRow label="Operator" value={displayName} />
            <TelemetryRow label="Plan" value={planTier.toUpperCase()} accent />
            {currentIdea && <TelemetryRow label="Idea" value={currentIdea} truncate />}
            {currentMission && <TelemetryRow label="Mission" value={currentMission} truncate />}
            <TelemetryRow label="Tool Runs" value={String(toolRunCount || recentRuns.length)} />
          </div>

          {/* Recent tool runs */}
          {recentRuns.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 9, color: "rgba(249,115,22,0.6)", letterSpacing: 1.5 }}>
                RECENT ACTIVITY
              </div>
              {recentRuns.slice(0, 4).map((run, i) => {
                const key = run.toolKey || run.tool || "tool";
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 8px",
                      borderRadius: 7,
                      border: "1px solid var(--border-subtle)",
                      background: "var(--surface)",
                    }}
                  >
                    <Activity style={{ width: 10, height: 10, color: "rgba(249,115,22,0.5)" }} />
                    <span
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.55)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {key.replace(/-/g, " ")}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick nav */}
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 5 }}>
            {[
              { label: "Tool Suite", path: "/app/launchpad" },
              { label: "Mentors", path: "/app/mentor" },
              { label: "Dashboard", path: "/app/dashboard" },
            ].map(({ label, path }) => (
              <Link
                key={path}
                to={path as never}
                onClick={handleClose}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 11,
                  fontWeight: 500,
                  textDecoration: "none",
                  transition: "all 0.12s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "#F97316";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(249,115,22,0.2)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(249,115,22,0.05)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--surface-2)";
                  (e.currentTarget as HTMLElement).style.background = "var(--surface)";
                }}
              >
                {label}
                <ArrowUpRight style={{ width: 10, height: 10 }} />
              </Link>
            ))}
          </div>
        </div>

        {/* ── Main Chat Area ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 20px",
              borderBottom: "1px solid rgba(249,115,22,0.1)",
              flexShrink: 0,
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                Ask Nova
                {streaming && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: 1.5,
                      color: "#F97316",
                      animation: "nova-pulse 1.5s ease-in-out infinite",
                    }}
                  >
                    THINKING...
                  </span>
                )}
              </div>
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.3)" }}>
                Chief of Staff · 30-tool suite · startup strategy
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {messages.length > 0 && (
                <HeaderBtn onClick={resetChat} title="New conversation">
                  <RotateCcw style={{ width: 12, height: 12 }} />
                </HeaderBtn>
              )}
              <HeaderBtn onClick={handleClose} title="Close (Esc)">
                <X style={{ width: 13, height: 13 }} />
              </HeaderBtn>
            </div>
          </div>

          {/* Boot screen OR messages */}
          {bootPhase < 4 ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                padding: 40,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #F97316, #ea580c)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 40px rgba(249,115,22,0.3)",
                  animation: "nova-pulse 1.5s ease-in-out infinite",
                }}
              >
                <Sparkles style={{ width: 28, height: 28, color: "#fff" }} />
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}
              >
                {BOOT_LINES.slice(0, bootPhase + 1).map((line, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 2,
                      color: i === bootPhase ? "#F97316" : "rgba(249,115,22,0.35)",
                      fontFamily: "monospace",
                      transition: "color 0.3s",
                    }}
                  >
                    {i < bootPhase ? "✓ " : ""}
                    {line}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {messages.length === 0 && (
                <EmptyState displayName={displayName} onSend={sendMessage} />
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    flexDirection: msg.role === "user" ? "row-reverse" : "row",
                    gap: 10,
                    alignItems: "flex-start",
                  }}
                >
                  {msg.role === "assistant" && (
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #F97316, #ea580c)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 2,
                        boxShadow: streaming ? "0 0 12px rgba(249,115,22,0.5)" : "none",
                        transition: "box-shadow 0.3s",
                      }}
                    >
                      <Sparkles style={{ width: 12, height: 12, color: "#fff" }} />
                    </div>
                  )}
                  <div
                    style={{
                      maxWidth: "78%",
                      padding: "10px 14px",
                      borderRadius:
                        msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      background:
                        msg.role === "user"
                          ? "linear-gradient(135deg, #F97316, #ea580c)"
                          : "var(--surface-2)",
                      border: msg.role === "assistant" ? "1px solid rgba(249,115,22,0.1)" : "none",
                      fontSize: 13,
                      lineHeight: 1.65,
                      color: msg.role === "user" ? "#fff" : "rgba(255,255,255,0.85)",
                    }}
                  >
                    {msg.pending && !msg.content ? (
                      <span
                        style={{
                          display: "inline-flex",
                          gap: 4,
                          alignItems: "center",
                          color: "#F97316",
                        }}
                      >
                        <span style={{ animation: "nova-pulse 1.4s ease-in-out infinite" }}>●</span>
                        <span style={{ animation: "nova-pulse 1.4s ease-in-out 0.2s infinite" }}>
                          ●
                        </span>
                        <span style={{ animation: "nova-pulse 1.4s ease-in-out 0.4s infinite" }}>
                          ●
                        </span>
                      </span>
                    ) : msg.role === "assistant" ? (
                      renderContent(msg.content, (path) => {
                        navigate({ to: path as never });
                        handleClose();
                      })
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Input */}
          <div
            style={{
              padding: "12px 20px 16px",
              borderTop: "1px solid rgba(249,115,22,0.1)",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid rgba(249,115,22,0.2)",
                background: "var(--surface)",
                transition: "border-color 0.15s",
              }}
              onFocusCapture={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(249,115,22,0.45)";
              }}
              onBlurCapture={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(249,115,22,0.2)";
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask NOVA anything… Enter to send, Shift+Enter for newline"
                rows={1}
                disabled={streaming || bootPhase < 4}
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  resize: "none",
                  fontSize: 13,
                  color: "#fff",
                  fontFamily: "inherit",
                  lineHeight: 1.5,
                  maxHeight: 120,
                  overflowY: "auto",
                  caretColor: "#F97316",
                }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || streaming || bootPhase < 4}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  border: "none",
                  background:
                    input.trim() && !streaming
                      ? "linear-gradient(135deg, #F97316, #ea580c)"
                      : "var(--surface-2)",
                  color: input.trim() && !streaming ? "#fff" : "var(--muted-foreground)",
                  cursor: input.trim() && !streaming ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.15s",
                  boxShadow: input.trim() && !streaming ? "0 0 10px rgba(249,115,22,0.3)" : "none",
                }}
              >
                <Send style={{ width: 13, height: 13 }} />
              </button>
            </div>
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.2)",
                marginTop: 6,
                textAlign: "center",
                letterSpacing: 0.5,
              }}
            >
              NOVA AI · responses are AI-generated · always verify critical decisions
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes nova-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @media (max-width: 680px) {
          .nova-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  ) : null;

  return createPortal(content, document.body);
}

// ── Sub-components ───────────────────────────────────────────────────────────

function HeaderBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(255,255,255,0.4)",
        transition: "all 0.12s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.color = "#fff";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)";
        (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
        (e.currentTarget as HTMLElement).style.background = "none";
      }}
    >
      {children}
    </button>
  );
}

function TelemetryRow({
  label,
  value,
  accent,
  truncate,
}: {
  label: string;
  value: string;
  accent?: boolean;
  truncate?: boolean;
}) {
  return (
    <div
      style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 6 }}
    >
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>{label}</span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: accent ? "#F97316" : "rgba(255,255,255,0.7)",
          overflow: truncate ? "hidden" : undefined,
          textOverflow: truncate ? "ellipsis" : undefined,
          whiteSpace: truncate ? "nowrap" : undefined,
          textAlign: "right",
          maxWidth: truncate ? 120 : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function EmptyState({
  displayName,
  onSend,
}: {
  displayName: string;
  onSend: (text: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 240,
        gap: 24,
        padding: "0 20px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#fff",
            marginBottom: 8,
          }}
        >
          Good to see you, {displayName}.
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
          I have full visibility into your workspace.
          <br />
          What's the mission today?
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 7,
          justifyContent: "center",
          maxWidth: 480,
        }}
      >
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => onSend(p)}
            style={{
              padding: "7px 14px",
              borderRadius: 20,
              border: "1px solid rgba(249,115,22,0.2)",
              background: "rgba(249,115,22,0.05)",
              color: "rgba(255,255,255,0.65)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(249,115,22,0.12)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(249,115,22,0.45)";
              (e.currentTarget as HTMLElement).style.color = "#F97316";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(249,115,22,0.05)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(249,115,22,0.2)";
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)";
            }}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
