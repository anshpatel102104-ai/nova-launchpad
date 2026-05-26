// TASK-053 · Fix onboarding completion — always creates/attaches correct workspace
// TASK-054 · Save all onboarding answers persistently (workspace_intake + onboarding_responses)
// TASK-055 · Lane classification engine (via lib/lane-classifier)
// TASK-061 · Guided onboarding wizard UI (OnboardingWizard component)

import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NeuralCanvas } from "@/components/app/NeuralCanvas";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
import { OnboardingWizard, type OnboardingAnswers } from "@/components/app/OnboardingWizard";
import { classifyLane } from "@/lib/lane-classifier";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/auth/sign-in" });
  },
  component: Onboarding,
});

const CHALLENGE_TOOLS: Record<string, string[]> = {
  fundraising: ["pitch-generator", "funding-score", "investor-emails"],
  customers: ["first-10-customers", "offer", "followup"],
  product: ["idea-validator", "kill-my-idea", "gtm-strategy"],
  marketing: ["gtm-strategy", "landing-page", "website-audit"],
};

const ANIM_CSS = `
  @keyframes bootLine {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes nameReveal {
    from { opacity: 0; transform: scale(0.9) translateY(28px); filter: blur(18px); }
    to   { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
  }
  @keyframes lineExpand {
    from { width: 0; opacity: 0; }
    to   { width: 140px; opacity: 1; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ambientPulse {
    0%   { opacity: 0.3; }
    50%  { opacity: 0.7; }
    100% { opacity: 0.3; }
  }
  .ob-input  {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: #f0f4ff;
    font-size: 14px;
    outline: none;
    width: 100%;
    border-radius: 10px;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
    font-family: inherit;
  }
  .ob-input:focus {
    border-color: rgba(59,130,246,0.65);
    box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
  }
`;

function Onboarding() {
  const navigate = useNavigate();
  const [initialName, setInitialName] = useState("");
  const [done, setDone] = useState(false);
  const [finalName, setFinalName] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const m = user?.user_metadata;
      const n = m?.full_name || m?.name || "";
      if (n) setInitialName(n);
    });
  }, []);

  const handleComplete = async (answers: OnboardingAnswers) => {
    const { name, idea, stage, challenge } = answers;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // ── 1. Update profile display name ────────────────────────────
    await supabase.from("profiles").update({ full_name: name }).eq("id", user.id);

    // ── 2. Create org + membership ─────────────────────────────────
    const orgName = name ? `${name.split(" ")[0]}'s Workspace` : "My Workspace";
    const { data: existingOrg } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    let orgId: string;
    if (existingOrg) {
      // User already has an org (e.g. from a previous partial onboarding)
      orgId = existingOrg.organization_id as string;
    } else {
      const { data: org, error: orgErr } = await supabase
        .from("organizations")
        .insert({ name: orgName, owner_id: user.id, stage: stage || undefined })
        .select("id")
        .single();
      if (orgErr) throw orgErr;
      orgId = org.id as string;

      const { error: memberErr } = await supabase
        .from("organization_members")
        .insert({ organization_id: orgId, user_id: user.id, role: "owner" });
      if (memberErr) throw memberErr;
    }

    // ── 3. Classify lane from answers ─────────────────────────────
    const lane = classifyLane(stage || "Idea", challenge);

    // ── 4. Provision workspace + seed missions (edge function) ─────
    // Uses service-role internally; we pass the user JWT for auth.
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    const supabaseBase = import.meta.env.VITE_SUPABASE_URL;
    const provisionRes = await fetch(`${supabaseBase}/functions/v1/provision-workspace`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        organization_id: orgId,
        name: orgName,
        lane,
        stage: stage || "Idea",
        idea,
      }),
    });

    let workspaceId: string | null = null;
    if (provisionRes.ok) {
      const provisionData = await provisionRes.json();
      workspaceId = provisionData.workspace_id ?? null;
    }
    // Non-blocking: if provision fails, onboarding still completes

    // ── 5. Persist onboarding answers to workspace_intake ─────────
    if (workspaceId) {
      await db.from("workspace_intake").upsert(
        {
          workspace_id: workspaceId,
          user_id: user.id,
          full_name: name,
          idea,
          stage: stage || "Idea",
          challenge,
          lane: lane as "Idea" | "Offer" | "Customer" | "Systems",
          raw_answers: { name, idea, stage, challenge },
          completed: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "workspace_id" },
      );
    }

    // ── 6. Backwards-compat save to onboarding_responses ──────────
    await supabase.from("onboarding_responses").upsert(
      {
        user_id: user.id,
        organization_id: orgId,
        offer: idea,
        stage: stage || null,
        biggest_blocker: challenge,
        completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "organization_id" },
    );

    // ── 7. Mark onboarding complete ────────────────────────────────
    await supabase.from("profiles").update({ onboarding_complete: true }).eq("id", user.id);

    // ── 8. Log activation event ────────────────────────────────────
    if (accessToken) {
      fetch(`${supabaseBase}/functions/v1/log-activation-event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          event_name: "onboarding_complete",
          workspace_id: workspaceId,
          properties: { lane, stage, challenge, has_idea: idea.length > 0 },
        }),
      }).catch(() => {});
    }

    // ── 9. Trigger n8n dashboard creation workflow (non-blocking) ──
    const n8nProxy = import.meta.env.VITE_N8N_BASE_URL ?? "/api/n8n";
    fetch(`${n8nProxy}/webhook/nova-ops-dashboard-init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        operator_name: name,
        primary_niche: challenge,
        recommended_tools: CHALLENGE_TOOLS[challenge] ?? [],
        lane,
      }),
    }).catch(() => {});

    setFinalName(name);
    setDone(true);
    setTimeout(() => navigate({ to: "/app/dashboard" }), 3600);
  };

  if (done)
    return <WelcomeScreen name={finalName} onSkip={() => navigate({ to: "/app/dashboard" })} />;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#080810",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <style>{ANIM_CSS}</style>

      <div style={{ position: "absolute", inset: 0, opacity: 0.3 }}>
        <NeuralCanvas className="w-full h-full" />
      </div>

      <div
        style={{
          position: "absolute",
          width: 700,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)",
          animation: "ambientPulse 4s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          padding: "0 20px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <OnboardingWizard
          initialName={initialName}
          onComplete={async (answers) => {
            try {
              await handleComplete(answers);
            } catch (e) {
              toast.error(
                e instanceof Error ? e.message : "Something went wrong. Please try again.",
              );
              throw e;
            }
          }}
        />
      </div>
    </div>
  );
}

// ── Welcome / boot screen ──────────────────────────────────────────────
const BOOT_LINES = [
  "nova_os://init — kernel loaded",
  "scanning founder profile…",
  "calibrating AI tools for your stage…",
  "building your command center…",
];

function WelcomeScreen({ name, onSkip }: { name: string; onSkip: () => void }) {
  const [phase, setPhase] = useState<"boot" | "reveal">("boot");
  const [lineIdx, setLineIdx] = useState(0);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    BOOT_LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setLineIdx(i + 1), i * 380 + 200));
    });
    timers.push(setTimeout(() => setPhase("reveal"), BOOT_LINES.length * 380 + 600));
    timers.push(setTimeout(() => setShowFallback(true), 7000));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#080810",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <style>{ANIM_CSS}</style>

      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: phase === "reveal" ? 0.15 : 0.25,
          transition: "opacity 1s",
        }}
      >
        <NeuralCanvas className="w-full h-full" />
      </div>

      <div
        style={{
          position: "absolute",
          width: 800,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(59,130,246,0.14) 0%, rgba(139,92,246,0.07) 40%, transparent 70%)",
          transition: "opacity 1s",
          opacity: phase === "reveal" ? 1 : 0.4,
          animation: "ambientPulse 4s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          textAlign: "center",
          padding: "0 24px",
          maxWidth: 600,
        }}
      >
        {phase === "boot" && (
          <div style={{ fontFamily: "monospace", textAlign: "left", display: "inline-block" }}>
            {BOOT_LINES.slice(0, lineIdx).map((line, i) => (
              <div
                key={line}
                style={{
                  fontSize: 13,
                  color: "rgba(59,130,246,0.85)",
                  lineHeight: 2.1,
                  animation: "bootLine 0.35s ease both",
                }}
              >
                <span style={{ color: "rgba(99,102,241,0.7)", marginRight: 8 }}>›</span>
                {line}
                {i === lineIdx - 1 && (
                  <span style={{ animation: "ambientPulse 1s infinite" }}>_</span>
                )}
              </div>
            ))}
          </div>
        )}

        {phase === "reveal" && (
          <div style={{ animation: "nameReveal 1s cubic-bezier(0.16,1,0.3,1) both" }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#3b82f6",
                marginBottom: 20,
                animation: "fadeUp 0.6s ease 0.15s both",
                opacity: 0,
              }}
            >
              System ready
            </div>

            <h1
              style={{
                fontSize: "clamp(2.6rem, 7vw, 4.5rem)",
                fontWeight: 900,
                letterSpacing: "-0.05em",
                lineHeight: 1.04,
                color: "#f0f4ff",
                margin: "0 0 8px",
                textShadow: "0 0 60px rgba(59,130,246,0.25)",
              }}
            >
              Nova is ready
              <br />
              for you,{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {name || "Founder"}
              </span>
            </h1>

            <div
              style={{
                margin: "22px auto 0",
                height: 2,
                borderRadius: 2,
                background:
                  "linear-gradient(90deg, transparent, #3b82f6, #8b5cf6, #06b6d4, transparent)",
                boxShadow: "0 0 20px rgba(59,130,246,0.7)",
                animation: "lineExpand 0.9s cubic-bezier(0.16,1,0.3,1) 0.3s both",
              }}
            />

            <p
              style={{
                marginTop: 22,
                fontSize: 16,
                color: "rgba(240,244,255,0.45)",
                lineHeight: 1.65,
                animation: "fadeUp 0.6s ease 0.5s both",
                opacity: 0,
              }}
            >
              Your AI founder OS is online.
              <br />
              Let's build something remarkable.
            </p>

            <div
              style={{
                marginTop: 32,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                animation: "fadeUp 0.6s ease 0.75s both",
                opacity: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#3b82f6",
                    boxShadow: "0 0 10px #3b82f6",
                    animation: "ambientPulse 1.4s ease-in-out infinite",
                  }}
                />
                <span
                  style={{ fontSize: 12, color: "rgba(240,244,255,0.3)", fontFamily: "monospace" }}
                >
                  loading dashboard…
                </span>
              </div>
              <button
                onClick={onSkip}
                style={{
                  fontSize: 12,
                  color: "rgba(240,244,255,0.45)",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  padding: "6px 16px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                }}
              >
                Skip intro → Go to dashboard
              </button>
              {showFallback && (
                <div style={{ fontSize: 11, color: "rgba(240,244,255,0.3)", marginTop: 4 }}>
                  Taking too long?{" "}
                  <button
                    onClick={onSkip}
                    style={{
                      fontSize: 11,
                      color: "#3b82f6",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      padding: 0,
                      textDecoration: "underline",
                    }}
                  >
                    Click here to go to your dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
