// TASK-070 · Ask Your Operator Dashboard Module
// Inline AI chat card on the dashboard — lightweight, stays in context.
// Sends messages to the /functions/v1/operator endpoint.

import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Send, Loader2, Bot, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  workspaceId?: string;
  className?: string;
}

export function AskOperatorCard({ workspaceId, className }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/operator`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text, workspace_id: workspaceId }),
      });

      const data = await res.json();

      if (data.status === "success") {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else if (data.status === "credit_insufficient") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `🔒 ${data.upsell_message}\n\n[Upgrade your plan](/app/billing) to continue.`,
          },
        ]);
      } else {
        throw new Error(data.error ?? "Operator error");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I ran into an issue. Please try again." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div
      className={className}
      style={{
        borderRadius: 18,
        border: "1px solid var(--border)",
        background: "var(--surface)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px 12px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Bot style={{ width: 16, height: 16, color: "#fff" }} />
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--foreground)" }}>
            Ask Nova
          </div>
          <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
            Your AI founder operator
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 16px",
          minHeight: 160,
          maxHeight: 280,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {isEmpty && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 4 }}>
              Try asking:
            </div>
            {[
              "What should I work on today?",
              "Help me validate my idea",
              "How do I find my first 10 customers?",
            ].map((q) => (
              <button
                key={q}
                onClick={() => {
                  setInput(q);
                  inputRef.current?.focus();
                }}
                style={{
                  padding: "7px 12px",
                  borderRadius: 8,
                  textAlign: "left",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--muted-foreground)",
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Sparkles style={{ width: 12, height: 12, color: "#3b82f6", flexShrink: 0 }} />
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              gap: 8,
              alignItems: "flex-start",
            }}
          >
            {msg.role === "assistant" && (
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  flexShrink: 0,
                  background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bot style={{ width: 12, height: 12, color: "#fff" }} />
              </div>
            )}
            <div
              style={{
                maxWidth: "80%",
                padding: "8px 12px",
                borderRadius: msg.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                background:
                  msg.role === "user"
                    ? "linear-gradient(135deg, #3b82f6, #6366f1)"
                    : "var(--border-subtle)",
                border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                fontSize: 12.5,
                color: msg.role === "user" ? "#fff" : "var(--foreground)",
                lineHeight: 1.55,
                whiteSpace: "pre-wrap",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                flexShrink: 0,
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bot style={{ width: 12, height: 12, color: "#fff" }} />
            </div>
            <div
              style={{
                padding: "8px 12px",
                borderRadius: "12px 12px 12px 4px",
                background: "var(--border-subtle)",
                border: "1px solid var(--border)",
              }}
            >
              <Loader2
                style={{
                  width: 14,
                  height: 14,
                  color: "#3b82f6",
                  animation: "spin 1s linear infinite",
                }}
              />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "10px 12px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          gap: 8,
          alignItems: "flex-end",
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Nova anything…"
          rows={1}
          style={{
            flex: 1,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "8px 12px",
            fontSize: 13,
            color: "var(--foreground)",
            resize: "none",
            outline: "none",
            fontFamily: "inherit",
            lineHeight: 1.5,
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            border: "none",
            background:
              input.trim() && !loading
                ? "linear-gradient(135deg, #3b82f6, #6366f1)"
                : "var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: input.trim() && !loading ? "pointer" : "default",
            flexShrink: 0,
            transition: "all 0.2s",
          }}
        >
          <Send
            style={{
              width: 15,
              height: 15,
              color: input.trim() && !loading ? "#fff" : "var(--muted-foreground)",
            }}
          />
        </button>
      </div>
    </div>
  );
}
