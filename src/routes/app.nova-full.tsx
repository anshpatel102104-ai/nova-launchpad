import React, { useState, useRef, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useEntitlement } from "@/hooks/use-entitlements";
import {
  Bot,
  Send,
  Plus,
  ChevronRight,
  ChevronLeft,
  X,
  Loader2,
  Lock,
  MessageSquare,
  Zap,
  TrendingUp,
  GraduationCap,
  ArrowRight,
  Settings,
  Sparkles,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Route = createFileRoute("/app/nova-full" as any)({ component: NovaFullPage });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/* ─── Types ─── */
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface NovaSession {
  id: string;
  organization_id: string;
  session_id: string;
  title: string | null;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

/* ─── Supabase helpers ─── */
async function fetchSessions(orgId: string): Promise<NovaSession[]> {
  const { data } = await db
    .from("nova_conversations")
    .select("*")
    .eq("organization_id", orgId)
    .order("updated_at", { ascending: false })
    .limit(30);
  return (data ?? []) as NovaSession[];
}

async function upsertSession(session: Partial<NovaSession> & { organization_id: string; session_id: string }): Promise<void> {
  await db
    .from("nova_conversations")
    .upsert({ ...session, updated_at: new Date().toISOString() }, { onConflict: "session_id" });
}

/* ─── Markdown renderer (simple) ─── */
function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code style="background:rgba(255,255,255,0.08);padding:1px 4px;border-radius:3px;font-family:monospace;font-size:0.9em">$1</code>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:14px;font-weight:700;margin:8px 0 4px">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:15px;font-weight:700;margin:10px 0 4px">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:16px;font-weight:700;margin:12px 0 4px">$1</h1>')
    .replace(/^- (.+)$/gm, '<li style="margin:2px 0;padding-left:4px">$1</li>')
    .replace(/((?:<li.*<\/li>\n?)+)/g, '<ul style="list-style:disc;padding-left:20px;margin:6px 0">$1</ul>')
    .replace(/\n\n/g, "</p><p style='margin:6px 0'>")
    .replace(/\n/g, "<br />");
}

/* ─── Quick action prompts ─── */
const QUICK_ACTIONS = [
  { label: "Run a Tool", prompt: "What AI tool should I run next for my business?", icon: Zap },
  { label: "Check My Progress", prompt: "Show me a summary of my progress on Launchpad Path", icon: TrendingUp },
  { label: "Talk to a Mentor", prompt: "I need strategic advice. Can you act as my business mentor?", icon: GraduationCap },
];

/* ─── Main Page ─── */
function NovaFullPage() {
  const { currentOrgId, user } = useAuth();
  const qc = useQueryClient();
  const novaGate = useEntitlement("nova_ai" as never);

  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [contextPanelOpen, setContextPanelOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sessionsQ = useQuery({
    queryKey: ["nova-sessions", currentOrgId],
    queryFn: () => fetchSessions(currentOrgId!),
    enabled: !!currentOrgId,
  });

  const sessions = sessionsQ.data ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const loadSession = (session: NovaSession) => {
    setSessionId(session.session_id);
    setMessages(session.messages ?? []);
  };

  const newSession = () => {
    setSessionId(crypto.randomUUID());
    setMessages([]);
    setInput("");
  };

  const sendMessage = useCallback(
    async (messageText?: string) => {
      const text = (messageText ?? input).trim();
      if (!text || streaming) return;

      const userMsg: ChatMessage = { role: "user", content: text, timestamp: Date.now() };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput("");
      setStreaming(true);
      setStreamingText("");

      try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        const token = authSession?.access_token;

        abortRef.current = new AbortController();

        const response = await fetch("/api/nova", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            message: text,
            conversation_history: messages.slice(-10),
            user_context: { org_id: currentOrgId, user_id: user?.id },
            session_id: sessionId,
          }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) throw new Error(`API error ${response.status}`);

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        let fullText = "";
        const decoder = new TextDecoder();

        // Check for session ID from response header
        const newSessionId = response.headers.get("x-session-id");
        if (newSessionId && newSessionId !== sessionId) {
          setSessionId(newSessionId);
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6).trim();
              if (dataStr === "[DONE]") break;
              try {
                const parsed = JSON.parse(dataStr) as { text?: string; delta?: string };
                const delta = parsed.text ?? parsed.delta ?? "";
                fullText += delta;
                setStreamingText(fullText);
              } catch {
                // Non-JSON SSE line, append raw
                if (dataStr) {
                  fullText += dataStr;
                  setStreamingText(fullText);
                }
              }
            }
          }
        }

        const assistantMsg: ChatMessage = { role: "assistant", content: fullText, timestamp: Date.now() };
        const finalMessages = [...newMessages, assistantMsg];
        setMessages(finalMessages);
        setStreamingText("");

        // Save session to Supabase
        if (currentOrgId) {
          const sessionTitle =
            newMessages[0]?.content.slice(0, 60) || "Nova conversation";
          await upsertSession({
            organization_id: currentOrgId,
            session_id: sessionId,
            title: sessionTitle,
            messages: finalMessages,
          });
          qc.invalidateQueries({ queryKey: ["nova-sessions", currentOrgId] });
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          const errMsg: ChatMessage = {
            role: "assistant",
            content: "Sorry, I ran into an issue. Please try again.",
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, errMsg]);
        }
      } finally {
        setStreaming(false);
        setStreamingText("");
      }
    },
    [input, messages, streaming, sessionId, currentOrgId, user?.id, qc]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /* Plan gate */
  if (novaGate.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--muted-foreground)" }} />
      </div>
    );
  }

  if (!novaGate.allowed) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4">
        <div
          className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl text-white"
          style={{ background: "linear-gradient(135deg, #4B8BF4, #8B5CF6)", boxShadow: "0 0 40px rgba(75,139,244,0.4)" }}
        >
          <Lock className="h-10 w-10" />
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight mb-2" style={{ color: "var(--foreground)" }}>
          Nova AI requires an upgrade
        </h2>
        <p className="text-[14px] max-w-md mb-6" style={{ color: "var(--muted-foreground)" }}>
          Full Nova AI chat is available on the Launch plan and above. Upgrade to unlock unlimited AI conversations.
        </p>
        <button
          onClick={() => window.location.href = "/app/billing"}
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[14px] font-bold text-white"
          style={{ background: "linear-gradient(135deg, #4B8BF4, #8B5CF6)", boxShadow: "0 4px 20px rgba(75,139,244,0.4)" }}
        >
          <Sparkles className="h-4 w-4" />
          Upgrade to Launch
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden rounded-2xl" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "var(--surface)" }}>

      {/* ── Left Sidebar: Past Sessions ── */}
      <div
        className={cn(
          "flex flex-col shrink-0 transition-all duration-200 overflow-hidden",
          sidebarOpen ? "w-64" : "w-0"
        )}
        style={{ borderRight: sidebarOpen ? "1px solid rgba(255,255,255,0.06)" : "none" }}
      >
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
            Sessions
          </span>
          <button
            onClick={newSession}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-all"
            style={{ color: "var(--muted-foreground)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(75,139,244,0.4)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)")}
            title="New session"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {sessionsQ.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--muted-foreground)" }} />
            </div>
          ) : sessions.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <MessageSquare className="h-6 w-6 mx-auto mb-2" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
              <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>No sessions yet</p>
            </div>
          ) : (
            sessions.map((sess) => {
              const isActive = sess.session_id === sessionId;
              return (
                <button
                  key={sess.id}
                  onClick={() => loadSession(sess)}
                  className="w-full text-left px-3 py-2.5 transition-all"
                  style={
                    isActive
                      ? { background: "rgba(75,139,244,0.1)", borderRight: "2px solid #4B8BF4" }
                      : { borderRight: "2px solid transparent" }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <div className="text-[12px] font-medium truncate" style={{ color: isActive ? "#4B8BF4" : "var(--foreground)" }}>
                    {sess.title ?? "New conversation"}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                    <Clock className="h-2.5 w-2.5" />
                    {new Date(sess.updated_at).toLocaleDateString()}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Main Chat Area ── */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Chat header */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-all"
            style={{ color: "var(--muted-foreground)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          <div className="flex items-center gap-2 flex-1">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold text-white"
              style={{ background: "linear-gradient(135deg, #4B8BF4, #8B5CF6)" }}
            >
              ◈
            </div>
            <div>
              <div className="font-semibold text-[13px]" style={{ color: "var(--foreground)" }}>Nova AI</div>
              <div className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                {streaming ? "Thinking…" : "Ready"}
              </div>
            </div>
            {streaming && (
              <div className="flex items-center gap-1 ml-2">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full animate-bounce"
                    style={{ background: "#4B8BF4", animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setContextPanelOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all"
            style={{
              background: contextPanelOpen ? "rgba(75,139,244,0.1)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${contextPanelOpen ? "rgba(75,139,244,0.3)" : "rgba(255,255,255,0.08)"}`,
              color: contextPanelOpen ? "#4B8BF4" : "var(--muted-foreground)",
            }}
          >
            <Settings className="h-3.5 w-3.5" />
            Context
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
          {messages.length === 0 && !streamingText && (
            <div className="flex flex-col items-center justify-center min-h-full text-center py-12">
              <div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-white text-[20px]"
                style={{ background: "linear-gradient(135deg, #4B8BF4, #8B5CF6)", boxShadow: "0 0 30px rgba(75,139,244,0.3)" }}
              >
                ◈
              </div>
              <h2 className="font-display text-[20px] font-bold tracking-tight mb-2" style={{ color: "var(--foreground)" }}>
                Nova AI
              </h2>
              <p className="text-[13px] max-w-sm mb-8" style={{ color: "var(--muted-foreground)" }}>
                Your AI business operator. Ask anything about your business, get strategic advice, or run tools.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_ACTIONS.map((qa) => (
                  <button
                    key={qa.label}
                    onClick={() => sendMessage(qa.prompt)}
                    className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-medium transition-all"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "var(--foreground)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(75,139,244,0.3)";
                      (e.currentTarget as HTMLElement).style.background = "rgba(75,139,244,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                    }}
                  >
                    <qa.icon className="h-3.5 w-3.5" style={{ color: "#4B8BF4" }} />
                    {qa.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <ChatBubble key={idx} message={msg} />
          ))}

          {/* Streaming bubble */}
          {streaming && streamingText && (
            <div className="flex items-start gap-3">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white mt-0.5"
                style={{ background: "linear-gradient(135deg, #4B8BF4, #8B5CF6)" }}
              >
                ◈
              </div>
              <div
                className="max-w-[75%] rounded-2xl rounded-tl-md px-4 py-3"
                style={{ background: "rgba(75,139,244,0.08)", border: "1px solid rgba(75,139,244,0.15)" }}
              >
                <div
                  className="text-[13.5px] leading-relaxed"
                  style={{ color: "var(--foreground)" }}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(streamingText) }}
                />
                <span
                  className="inline-block w-1.5 h-4 ml-0.5 rounded-sm animate-pulse"
                  style={{ background: "#4B8BF4", verticalAlign: "text-bottom" }}
                />
              </div>
            </div>
          )}

          {/* Typing indicator (no text yet) */}
          {streaming && !streamingText && (
            <div className="flex items-start gap-3">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white mt-0.5"
                style={{ background: "linear-gradient(135deg, #4B8BF4, #8B5CF6)" }}
              >
                ◈
              </div>
              <div
                className="flex items-center gap-1.5 rounded-2xl rounded-tl-md px-4 py-3"
                style={{ background: "rgba(75,139,244,0.08)", border: "1px solid rgba(75,139,244,0.15)" }}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-2 w-2 rounded-full animate-bounce"
                    style={{ background: "#4B8BF4", animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="px-4 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {/* Quick actions */}
          {messages.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {QUICK_ACTIONS.map((qa) => (
                <button
                  key={qa.label}
                  onClick={() => sendMessage(qa.prompt)}
                  disabled={streaming}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all disabled:opacity-40"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "var(--muted-foreground)",
                  }}
                  onMouseEnter={(e) => {
                    if (!streaming) {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(75,139,244,0.3)";
                      (e.currentTarget as HTMLElement).style.color = "#4B8BF4";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                    (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
                  }}
                >
                  <qa.icon className="h-3 w-3" />
                  {qa.label}
                </button>
              ))}
            </div>
          )}

          <div
            className="flex items-end gap-3 rounded-2xl px-4 py-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" }}
            onFocus={() => { /* highlight on focus via CSS would be added */ }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Nova anything… (Enter to send, Shift+Enter for new line)"
              rows={1}
              className="flex-1 resize-none bg-transparent outline-none text-[13.5px] leading-relaxed"
              style={{ color: "var(--foreground)", minHeight: "24px", maxHeight: "160px" }}
              disabled={streaming}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || streaming}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white transition-all disabled:opacity-40"
              style={{
                background: input.trim() && !streaming
                  ? "linear-gradient(135deg, #4B8BF4, #8B5CF6)"
                  : "rgba(255,255,255,0.08)",
              }}
              onMouseEnter={(e) => {
                if (input.trim() && !streaming)
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "none";
              }}
            >
              {streaming
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />
              }
            </button>
          </div>
          <p className="mt-2 text-center text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
            Nova AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>

      {/* ── Context Panel ── */}
      {contextPanelOpen && (
        <ContextPanel orgId={currentOrgId} onClose={() => setContextPanelOpen(false)} />
      )}
    </div>
  );
}

/* ─── Chat Bubble ─── */
function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white mt-0.5"
        style={
          isUser
            ? { background: "linear-gradient(135deg, #F97316, #EA580C)" }
            : { background: "linear-gradient(135deg, #4B8BF4, #8B5CF6)" }
        }
      >
        {isUser ? "U" : "◈"}
      </div>

      {/* Bubble */}
      <div
        className={cn("max-w-[75%] rounded-2xl px-4 py-3", isUser ? "rounded-tr-md" : "rounded-tl-md")}
        style={
          isUser
            ? { background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.2)" }
            : { background: "rgba(75,139,244,0.08)", border: "1px solid rgba(75,139,244,0.15)" }
        }
      >
        {isUser ? (
          <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--foreground)" }}>
            {message.content}
          </p>
        ) : (
          <div
            className="text-[13.5px] leading-relaxed"
            style={{ color: "var(--foreground)" }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
          />
        )}
        <div className="mt-1.5 text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}

/* ─── Context Panel ─── */
function ContextPanel({ orgId, onClose }: { orgId: string | null; onClose: () => void }) {
  const [context, setContext] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    db
      .from("organizations")
      .select("context_data, name, stage, industry")
      .eq("id", orgId)
      .maybeSingle()
      .then(({ data }: { data: Record<string, unknown> | null }) => {
        if (data) {
          setContext({
            name: (data.name as string) ?? "",
            stage: (data.stage as string) ?? "",
            industry: (data.industry as string) ?? "",
            ...((data.context_data as Record<string, string>) ?? {}),
          });
        }
        setLoading(false);
      });
  }, [orgId]);

  const handleSave = async () => {
    if (!orgId) return;
    setSaving(true);
    await db.from("organizations").update({ context_data: context }).eq("id", orgId);
    setSaving(false);
  };

  return (
    <div
      className="flex flex-col w-72 shrink-0"
      style={{ borderLeft: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="text-[12px] font-semibold" style={{ color: "var(--foreground)" }}>Org Context</span>
        <button onClick={onClose} style={{ color: "var(--muted-foreground)" }}>
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--muted-foreground)" }} />
          </div>
        ) : (
          <>
            {[
              { key: "name", label: "Company Name" },
              { key: "stage", label: "Business Stage" },
              { key: "industry", label: "Industry" },
              { key: "target_customer", label: "Target Customer" },
              { key: "business_model", label: "Business Model" },
              { key: "main_challenge", label: "Main Challenge" },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>
                  {f.label}
                </label>
                <input
                  value={context[f.key] ?? ""}
                  onChange={(e) => setContext((c) => ({ ...c, [f.key]: e.target.value }))}
                  className="w-full rounded-lg px-3 py-1.5 text-[12px] outline-none"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "var(--foreground)",
                  }}
                />
              </div>
            ))}
          </>
        )}
      </div>

      <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg py-2 text-[12px] font-medium text-white transition-all disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #4B8BF4, #8B5CF6)" }}
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Update Context
        </button>
      </div>
    </div>
  );
}
