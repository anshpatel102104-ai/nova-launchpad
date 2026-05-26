// TASK-018-021 · Frontend UX rescue states
// TASK-019: Explain Simply — re-explains complex AI output in plain language
// TASK-020: Pick Best Option — identifies the strongest choice when output has multiple options
// TASK-021: Do This For Me — triggers the operator to auto-apply the recommended action

import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, Sparkles, Zap, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  content: string;
  toolKey?: string;
  workspaceId?: string | null;
  onResult?: (result: string, action: RescueAction) => void;
}

type RescueAction = "explain" | "pick" | "auto";

type ActionState = { loading: boolean; result: string | null };

const ACTION_CONFIG: Record<
  RescueAction,
  {
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ style?: React.CSSProperties }>;
    color: string;
    prompt: (content: string) => string;
  }
> = {
  explain: {
    label: "Explain Simply",
    shortLabel: "Explain",
    icon: Lightbulb,
    color: "#f59e0b",
    prompt: (content) =>
      `Explain this to me in plain, simple language as if I were smart but new to this topic. Avoid jargon. Use short sentences. Maximum 3 bullet points.\n\nContent to explain:\n${content}`,
  },
  pick: {
    label: "Pick Best Option",
    shortLabel: "Best Option",
    icon: Sparkles,
    color: "#6366f1",
    prompt: (content) =>
      `Look at the options in this output and tell me which single option is best for an early-stage founder. State your choice clearly (Option 1/2/3 or by name), give one sentence on why, and tell me the one concrete action I should take. Be decisive.\n\nOutput to evaluate:\n${content}`,
  },
  auto: {
    label: "Do This For Me",
    shortLabel: "Auto-do",
    icon: Zap,
    color: "#10b981",
    prompt: (content) =>
      `Based on this output, tell me exactly what to do RIGHT NOW — not a plan, not options, just the single highest-impact action I should take in the next 30 minutes. Make it specific: who, what, how. No hedging.\n\nContext:\n${content}`,
  },
};

async function callOperator(prompt: string, workspaceId?: string | null): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const resp = await fetch(
    `${(import.meta as { env: { VITE_SUPABASE_URL?: string } }).env.VITE_SUPABASE_URL}/functions/v1/operator`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ message: prompt, workspace_id: workspaceId ?? null }),
    },
  );
  if (!resp.ok) throw new Error("Operator call failed");
  const json = await resp.json();
  return json.reply ?? json.message ?? JSON.stringify(json);
}

export function RescueActionsBar({ content, workspaceId, onResult }: Props) {
  const [states, setStates] = React.useState<Record<RescueAction, ActionState>>({
    explain: { loading: false, result: null },
    pick: { loading: false, result: null },
    auto: { loading: false, result: null },
  });
  const [activeAction, setActiveAction] = React.useState<RescueAction | null>(null);

  const runAction = async (action: RescueAction) => {
    if (states[action].loading) return;
    const cfg = ACTION_CONFIG[action];
    setStates((s) => ({ ...s, [action]: { loading: true, result: null } }));
    setActiveAction(action);
    try {
      const result = await callOperator(cfg.prompt(content.slice(0, 2000)), workspaceId);
      setStates((s) => ({ ...s, [action]: { loading: false, result } }));
      onResult?.(result, action);
    } catch (err) {
      setStates((s) => ({ ...s, [action]: { loading: false, result: null } }));
      toast.error(`${cfg.label} failed. Try again.`);
    }
  };

  const dismiss = (action: RescueAction) => {
    setStates((s) => ({ ...s, [action]: { loading: false, result: null } }));
    if (activeAction === action) setActiveAction(null);
  };

  const activeResult = activeAction ? states[activeAction].result : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Action buttons */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {(
          Object.entries(ACTION_CONFIG) as [RescueAction, (typeof ACTION_CONFIG)[RescueAction]][]
        ).map(([key, cfg]) => {
          const { loading } = states[key];
          const Icon = cfg.icon;
          return (
            <button
              key={key}
              onClick={() => runAction(key)}
              disabled={loading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 12px",
                borderRadius: 7,
                border: `1px solid ${cfg.color}30`,
                background: activeAction === key ? `${cfg.color}12` : "var(--surface-2)",
                color: cfg.color,
                fontSize: 11.5,
                fontWeight: 600,
                cursor: loading ? "wait" : "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
                opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLElement).style.background = `${cfg.color}12`;
                  (e.currentTarget as HTMLElement).style.borderColor = `${cfg.color}50`;
                }
              }}
              onMouseLeave={(e) => {
                if (activeAction !== key) {
                  (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                  (e.currentTarget as HTMLElement).style.borderColor = `${cfg.color}30`;
                }
              }}
            >
              {loading ? (
                <Loader2 style={{ width: 11, height: 11, animation: "spin 1s linear infinite" }} />
              ) : (
                <Icon style={{ width: 11, height: 11 } as React.CSSProperties} />
              )}
              {cfg.shortLabel}
            </button>
          );
        })}
      </div>

      {/* Result panel */}
      {activeAction && activeResult && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: `1px solid ${ACTION_CONFIG[activeAction].color}25`,
            background: `${ACTION_CONFIG[activeAction].color}07`,
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: ACTION_CONFIG[activeAction].color,
              }}
            >
              {ACTION_CONFIG[activeAction].label}
            </span>
            <button
              onClick={() => dismiss(activeAction)}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--muted-foreground)",
                display: "flex",
                padding: 2,
              }}
              aria-label="Dismiss"
            >
              <X style={{ width: 12, height: 12 }} />
            </button>
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: "var(--foreground)",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}
          >
            {activeResult}
          </div>
        </div>
      )}
    </div>
  );
}
