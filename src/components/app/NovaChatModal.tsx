// Nova AI Chat — conversational assistant for the platform.
// Opens via cmd+shift+K or the search bar. Streams responses from the nova-chat edge function.

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { buildAgentContext } from "@/lib/agent-context";
import { Sparkles, Send, X, RotateCcw, ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
};

const QUICK_PROMPTS = [
  "What should I work on next?",
  "How do I validate my idea?",
  "Show me the AI tools",
  "How do I get my first customers?",
  "What's my current mission?",
];

// Parse **[Label](/path)** style links from assistant markdown
function renderContent(text: string) {
  const parts = text.split(/(\*\*\[.+?\]\(.+?\)\*\*)/g);
  return parts.map((part, i) => {
    const linkMatch = part.match(/\*\*\[(.+?)\]\((.+?)\)\*\*/);
    if (linkMatch) {
      return (
        <Link
          key={i}
          to={linkMatch[2] as never}
          className="inline-flex items-center gap-1 font-semibold"
          style={{ color: "var(--primary)" }}
        >
          {linkMatch[1]}
          <ArrowUpRight style={{ width: 11, height: 11, display: "inline" }} />
        </Link>
      );
    }
    // Render basic markdown: bold, bullet lines
    return (
      <span key={i}>
        {part.split("\n").map((line, j) => {
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
                  style={{
                    display: "inline-block",
                    width: 14,
                    color: "var(--primary)",
                    opacity: 0.7,
                  }}
                >
                  ›
                </span>
              )}
              {rendered}
              {j < part.split("\n").length - 1 && <br />}
            </span>
          );
        })}
      </span>
    );
  });
}

interface Props {
  open: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export function NovaChatModal({ open, onClose, initialQuery }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [context, setContext] = useState<Record<string, unknown>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch user context once on open
  useEffect(() => {
    if (!open || !user?.id) return;
    buildAgentContext(user.id).then((ctx) => setContext(ctx as unknown as Record<string, unknown>));
  }, [open, user?.id]);

  // Auto-focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
      if (initialQuery && messages.length === 0) {
        setInput(initialQuery);
      }
    }
  }, [open]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
            // Anthropic SSE: content_block_delta with type=text_delta
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

      // Finalize
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? {
                ...m,
                content: accumulated || "Sorry, I couldn't generate a response.",
                pending: false,
              }
            : m,
        ),
      );
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error && err.name === "AbortError"
          ? null
          : `Something went wrong. ${err instanceof Error ? err.message : ""}`.trim();

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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        style={{
          maxWidth: 680,
          width: "95vw",
          padding: 0,
          overflow: "hidden",
          borderRadius: 18,
          border: "1px solid rgba(99,102,241,0.25)",
          background: "var(--surface)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "80vh",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 18px",
            borderBottom: "1px solid rgba(99,102,241,0.12)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles style={{ width: 14, height: 14, color: "#fff" }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>
              Ask Nova
            </div>
            <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
              AI assistant · platform guide · startup advisor
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            {messages.length > 0 && (
              <button
                onClick={resetChat}
                title="New conversation"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  border: "1px solid var(--border)",
                  background: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--muted-foreground)",
                }}
              >
                <RotateCcw style={{ width: 13, height: 13 }} />
              </button>
            )}
            <button
              onClick={handleClose}
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                border: "1px solid var(--border)",
                background: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--muted-foreground)",
              }}
            >
              <X style={{ width: 13, height: 13 }} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {messages.length === 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 180,
                gap: 20,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--foreground)",
                    marginBottom: 6,
                  }}
                >
                  What can I help you with?
                </div>
                <div style={{ fontSize: 12.5, color: "var(--muted-foreground)" }}>
                  Ask me anything about your startup, the platform, or what to do next.
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 20,
                      border: "1px solid rgba(99,102,241,0.25)",
                      background: "rgba(99,102,241,0.06)",
                      color: "var(--foreground)",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.12s",
                    }}
                    onMouseEnter={(e: React.MouseEvent) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.14)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.5)";
                    }}
                    onMouseLeave={(e: React.MouseEvent) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.06)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.25)";
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
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
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  <Sparkles style={{ width: 12, height: 12, color: "#fff" }} />
                </div>
              )}
              <div
                style={{
                  maxWidth: "80%",
                  padding: "10px 14px",
                  borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background:
                    msg.role === "user"
                      ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                      : "var(--surface-2)",
                  border: msg.role === "assistant" ? "1px solid rgba(99,102,241,0.12)" : "none",
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: msg.role === "user" ? "#fff" : "var(--foreground)",
                }}
              >
                {msg.pending && !msg.content ? (
                  <span
                    style={{
                      display: "inline-flex",
                      gap: 4,
                      alignItems: "center",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    <span style={{ animation: "pulse 1.4s ease-in-out infinite" }}>●</span>
                    <span style={{ animation: "pulse 1.4s ease-in-out 0.2s infinite" }}>●</span>
                    <span style={{ animation: "pulse 1.4s ease-in-out 0.4s infinite" }}>●</span>
                  </span>
                ) : msg.role === "assistant" ? (
                  renderContent(msg.content)
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          style={{
            padding: "12px 18px 14px",
            borderTop: "1px solid rgba(99,102,241,0.12)",
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
              border: "1px solid rgba(99,102,241,0.25)",
              background: "var(--surface-2)",
              transition: "border-color 0.15s",
            }}
            onFocus={() => {}}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything… (Enter to send, Shift+Enter for newline)"
              rows={1}
              disabled={streaming}
              style={{
                flex: 1,
                background: "none",
                border: "none",
                outline: "none",
                resize: "none",
                fontSize: 13,
                color: "var(--foreground)",
                fontFamily: "inherit",
                lineHeight: 1.5,
                maxHeight: 120,
                overflowY: "auto",
              }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || streaming}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                border: "none",
                background:
                  input.trim() && !streaming
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    : "var(--surface-offset)",
                color: input.trim() && !streaming ? "#fff" : "var(--muted-foreground)",
                cursor: input.trim() && !streaming ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.15s",
              }}
            >
              <Send style={{ width: 13, height: 13 }} />
            </button>
          </div>
          <div
            style={{
              fontSize: 10.5,
              color: "var(--muted-foreground)",
              opacity: 0.5,
              marginTop: 6,
              textAlign: "center",
            }}
          >
            Nova AI · answers are AI-generated and may not be perfect
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
