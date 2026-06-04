import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { X, Send, RotateCcw, ArrowUpRight, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { buildAgentContext } from "@/lib/agent-context";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
};

// Page-context greetings Nova sends on first open
const PAGE_GREETINGS: Record<string, string> = {
  "/app/dashboard":
    "Hey — looking at your command center. What stage are you focused on today, and what's the highest-leverage thing I can help you move forward?",
  "/app/launchpad":
    "You're in the Launchpad — 18 AI-powered tools to take your idea from concept to traction. Which phase are you in: validating, planning, or acquiring customers?",
  "/app/contacts":
    "Your CRM. A clean contact list is the backbone of revenue. Need help with outreach strategy, lead scoring, or following up on cold contacts?",
  "/app/memory":
    "Company Memory is where your business knowledge lives. Connect your docs, URLs, or Notion workspace and I'll use it to give you sharper advice.",
  "/app/automations":
    "Automations run your business while you sleep. What do you want to automate first — lead follow-up, appointment setting, or CRM updates?",
  "/app/integrations":
    "Integrations connect your stack. The more data sources you connect to Memory, the smarter my answers get. What tools are you using?",
  "/app/settings":
    "Settings — if you need to update your workspace, plan, or profile, I can help you figure out what's worth changing.",
  "/app/billing":
    "Billing. If you're thinking about upgrading, tell me what you're trying to unlock and I'll tell you if it's worth it for your stage.",
};

const DEFAULT_GREETING =
  "What are you working on? I have context on your workspace and can give you a specific recommendation.";

const QUICK_PROMPTS = [
  "What should I do next?",
  "What's my highest-leverage move?",
  "How do I get my first 10 customers?",
  "Analyse my progress so far",
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
          <span style={{ display: "inline-block", width: 12, color: "var(--primary)", opacity: 0.8 }}>›</span>
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
            gap: 4,
            padding: "3px 9px",
            borderRadius: 20,
            border: "1px solid rgba(255,107,26,0.4)",
            background: "rgba(255,107,26,0.08)",
            color: "var(--primary)",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            margin: "1px 2px",
            transition: "all 0.1s",
            verticalAlign: "middle",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,107,26,0.14)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,107,26,0.08)";
          }}
        >
          <Zap style={{ width: 9, height: 9 }} />
          {label}
        </button>,
      );
    } else if (match[4]) {
      const label = match[5];
      const path = match[6];
      segments.push(
        <button
          key={`link-${match.index}`}
          onClick={() => onNavigate(path)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            fontWeight: 600,
            color: "var(--primary)",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "inherit",
            padding: 0,
            verticalAlign: "middle",
          }}
        >
          {label}
          <ArrowUpRight style={{ width: 10, height: 10 }} />
        </button>,
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push(<span key="tail">{renderText(text.slice(lastIndex))}</span>);
  }
  return segments;
}

interface IntelligenceRailProps {
  open: boolean;
  onClose: () => void;
}

export function IntelligenceRail({ open, onClose }: IntelligenceRailProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [context, setContext] = useState<Record<string, unknown>>({});
  const [greeted, setGreeted] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load workspace context once
  useEffect(() => {
    if (!user?.id) return;
    buildAgentContext(user.id).then((ctx) =>
      setContext(ctx as unknown as Record<string, unknown>),
    );
  }, [user?.id]);

  // Send Nova's opening greeting when rail first opens
  useEffect(() => {
    if (!open || greeted) return;
    setGreeted(true);
    const greeting =
      Object.entries(PAGE_GREETINGS).find(([p]) => path.startsWith(p))?.[1] ??
      DEFAULT_GREETING;
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: greeting,
      },
    ]);
  }, [open, greeted, path]);

  // When page changes while rail is open, add a context note
  const prevPath = useRef(path);
  useEffect(() => {
    if (!open || prevPath.current === path) return;
    prevPath.current = path;
    const greeting =
      Object.entries(PAGE_GREETINGS).find(([p]) => path.startsWith(p))?.[1] ?? null;
    if (greeting) {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: greeting },
      ]);
    }
  }, [path, open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  const handleNavigate = useCallback(
    (navPath: string) => {
      navigate({ to: navPath as never });
    },
    [navigate],
  );

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

    const history = [...messages, userMsg];

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const abort = new AbortController();
      abortRef.current = abort;

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nova-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.content })),
            context,
          }),
          signal: abort.signal,
        },
      );

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
            if (
              parsed.type === "content_block_delta" &&
              parsed.delta?.type === "text_delta"
            ) {
              accumulated += parsed.delta.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, content: accumulated, pending: false }
                    : m,
                ),
              );
            }
          } catch {
            // skip non-JSON SSE lines
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
      const isAbort = err instanceof Error && err.name === "AbortError";
      if (!isAbort) {
        const errText =
          err instanceof Error ? err.message : "Something went wrong.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: `Error: ${errText}`, pending: false }
              : m,
          ),
        );
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id));
      }
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

  const resetChat = () => {
    abortRef.current?.abort();
    setStreaming(false);
    setInput("");
    setGreeted(false);
    setMessages([]);
  };

  if (!open) return null;

  return (
    <aside
      className={cn("hidden xl:flex shrink-0 flex-col w-[300px] h-full")}
      style={{
        background: "var(--background)",
        borderLeft: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div
        className="flex h-12 items-center justify-between px-4 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="h-5 w-5 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "var(--primary)" }}
          >
            <Zap className="h-3 w-3 text-white" />
          </div>
          <span className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>
            Nova
          </span>
          {streaming && (
            <span
              className="text-[9px] font-semibold tracking-widest uppercase"
              style={{ color: "var(--primary)" }}
            >
              thinking
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 1 && (
            <button
              onClick={resetChat}
              className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
              style={{ color: "var(--muted-foreground)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
              }}
              title="New conversation"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
            style={{ color: "var(--muted-foreground)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
              (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-2 items-start",
              msg.role === "user" && "flex-row-reverse",
            )}
          >
            {msg.role === "assistant" && (
              <div
                className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "var(--primary)" }}
              >
                <Zap className="h-3 w-3 text-white" />
              </div>
            )}
            <div
              className="rounded-xl px-3 py-2 text-[12.5px] leading-relaxed"
              style={{
                maxWidth: "calc(100% - 36px)",
                background:
                  msg.role === "user"
                    ? "var(--primary)"
                    : "var(--surface-2)",
                color:
                  msg.role === "user" ? "#fff" : "var(--foreground)",
                border:
                  msg.role === "assistant"
                    ? "1px solid var(--border)"
                    : "none",
                borderRadius:
                  msg.role === "user"
                    ? "12px 12px 4px 12px"
                    : "4px 12px 12px 12px",
              }}
            >
              {msg.pending && !msg.content ? (
                <span className="flex gap-1 items-center" style={{ color: "var(--primary)" }}>
                  <span style={{ animation: "pulse 1.2s ease-in-out infinite" }}>●</span>
                  <span style={{ animation: "pulse 1.2s ease-in-out 0.2s infinite" }}>●</span>
                  <span style={{ animation: "pulse 1.2s ease-in-out 0.4s infinite" }}>●</span>
                </span>
              ) : msg.role === "assistant" ? (
                renderContent(msg.content, handleNavigate)
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {/* Quick prompts when chat is fresh */}
        {messages.length <= 1 && !streaming && (
          <div className="pt-1 space-y-1.5">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="w-full text-left rounded-lg px-3 py-2 text-[11.5px] transition-colors"
                style={{
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--muted-foreground)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                  (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="px-3 pb-3 shrink-0"
        style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}
      >
        <div
          className="flex items-end gap-2 rounded-xl px-3 py-2"
          style={{
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
          }}
          onFocusCapture={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor =
              "rgba(255,107,26,0.35)";
          }}
          onBlurCapture={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Nova..."
            rows={1}
            disabled={streaming}
            className="flex-1 bg-transparent text-[12.5px] outline-none resize-none"
            style={{
              color: "var(--foreground)",
              maxHeight: 100,
              overflowY: "auto",
              lineHeight: 1.5,
              caretColor: "var(--primary)",
            }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors"
            style={{
              background: input.trim() && !streaming ? "var(--primary)" : "transparent",
              color:
                input.trim() && !streaming
                  ? "#fff"
                  : "var(--muted-foreground)",
              cursor: input.trim() && !streaming ? "pointer" : "not-allowed",
            }}
          >
            <Send className="h-3 w-3" />
          </button>
        </div>
        <p
          className="mt-1.5 text-center text-[10px]"
          style={{ color: "var(--muted-foreground)" }}
        >
          Nova AI · verify critical decisions
        </p>
      </div>
    </aside>
  );
}
