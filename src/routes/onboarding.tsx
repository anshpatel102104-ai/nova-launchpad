import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NeuralCanvas } from "@/components/app/NeuralCanvas";
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
`;

function Onboarding() {
  const navigate = useNavigate();
  const [done, setDone] = useState(false);

  const handleComplete = async (answers: OnboardingAnswers) => {
    const { idea, stage, target_customer, goal, revenue, challenge } = answers;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // ── 1. Create org + membership ────────────────────────────────────
    const { data: existingOrg } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    let orgId: string;
    if (existingOrg) {
      orgId = existingOrg.organization_id as string;
    } else {
      const { data: org, error: orgErr } = await supabase
        .from("organizations")
        .insert({
          name: "My Workspace",
          owner_id: user.id,
          stage: (stage || undefined) as
            | "Idea"
            | "Validate"
            | "Launch"
            | "Operate"
            | "Scale"
            | undefined,
        })
        .select("id")
        .single();
      if (orgErr) throw orgErr;
      orgId = org.id as string;

      await supabase
        .from("organization_members")
        .insert({ organization_id: orgId, user_id: user.id, role: "owner" });
    }

    // ── 2. Classify lane ──────────────────────────────────────────────
    const lane = classifyLane(stage || "Idea", challenge);

    // ── 3. Provision workspace ────────────────────────────────────────
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    const supabaseBase = import.meta.env.VITE_SUPABASE_URL;

    let workspaceId: string | null = null;
    try {
      const provisionRes = await fetch(`${supabaseBase}/functions/v1/provision-workspace`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          organization_id: orgId,
          name: "My Workspace",
          lane,
          stage: stage || "Idea",
          idea,
        }),
      });
      if (provisionRes.ok) {
        const d = await provisionRes.json();
        workspaceId = d.workspace_id ?? null;
      }
    } catch {
      /* non-blocking */
    }

    // ── 4. Save onboarding answers ────────────────────────────────────
    const { error: onboardingErr } = await supabase.from("onboarding_responses").upsert(
      {
        user_id: user.id,
        organization_id: orgId,
        offer: idea,
        niche: target_customer,
        target_customer,
        goal,
        current_revenue: revenue,
        stage: (stage || null) as "Idea" | "Validate" | "Launch" | "Operate" | "Scale" | null,
        biggest_blocker: challenge,
        completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (onboardingErr) {
      console.error("[onboarding] Failed to save responses:", onboardingErr.message);
      // Non-fatal — continue so profile still gets marked complete
    }

    if (workspaceId) {
      await supabase.from("workspace_intake").upsert(
        {
          workspace_id: workspaceId,
          user_id: user.id,
          idea,
          stage: stage || "Idea",
          challenge,
          lane: lane as "Idea" | "Offer" | "Customer" | "Systems",
          raw_answers: { idea, stage, target_customer, goal, revenue, challenge },
          completed: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "workspace_id" },
      );
    }

    // ── 5. Mark onboarding complete ───────────────────────────────────
    const { error: profileErr } = await supabase
      .from("profiles")
      .update({ onboarding_complete: true })
      .eq("id", user.id);
    if (profileErr) throw new Error("Failed to mark onboarding complete: " + profileErr.message);

    // ── 6. Generate AI dashboard (non-blocking — happens in background) ──
    fetch(`${supabaseBase}/functions/v1/generate-ai-dashboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        business: idea,
        niche: target_customer,
        stage,
        goal,
        current_revenue: revenue,
        target_customer,
        biggest_blocker: challenge,
        organization_id: orgId,
      }),
    }).catch((e) => console.warn("[onboarding] AI dashboard gen failed (non-blocking):", e));

    // ── 7. Log activation event ───────────────────────────────────────
    fetch(`${supabaseBase}/functions/v1/log-activation-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        event_name: "onboarding_complete",
        workspace_id: workspaceId,
        properties: { lane, stage, challenge, goal, has_idea: idea.length > 0 },
      }),
    }).catch(() => {});

    setDone(true);
    setTimeout(() => navigate({ to: "/app/dashboard" }), 3200);
  };

  if (done) return <WelcomeScreen onSkip={() => navigate({ to: "/app/dashboard" })} />;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0a0805",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <style>{ANIM_CSS}</style>

      <div style={{ position: "absolute", inset: 0, opacity: 0.25 }}>
        <NeuralCanvas className="w-full h-full" />
      </div>

      <div
        style={{
          position: "absolute",
          width: 700,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(249,115,22,0.07) 0%, transparent 70%)",
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

// ── Welcome / boot screen ─────────────────────────────────────────────────────

const BOOT_LINES = [
  "nova_os://init — kernel loaded",
  "analysing your business context…",
  "calibrating AI tools for your stage…",
  "building your command center…",
];

function WelcomeScreen({ onSkip }: { onSkip: () => void }) {
  const [phase, setPhase] = useState<"boot" | "reveal">("boot");
  const [lineIdx, setLineIdx] = useState(0);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    BOOT_LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setLineIdx(i + 1), i * 380 + 200));
    });
    timers.push(setTimeout(() => setPhase("reveal"), BOOT_LINES.length * 380 + 600));
    timers.push(setTimeout(() => setShowFallback(true), 6000));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0a0805",
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
          opacity: phase === "reveal" ? 0.12 : 0.22,
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
            "radial-gradient(ellipse, rgba(249,115,22,0.12) 0%, rgba(251,191,36,0.05) 40%, transparent 70%)",
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
                  color: "rgba(249,115,22,0.85)",
                  lineHeight: 2.1,
                  animation: "bootLine 0.35s ease both",
                }}
              >
                <span style={{ color: "rgba(251,191,36,0.7)", marginRight: 8 }}>›</span>
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
                color: "#f97316",
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
                color: "#f7f0e8",
                margin: "0 0 8px",
                textShadow: "0 0 60px rgba(249,115,22,0.2)",
              }}
            >
              Nova is ready.
            </h1>

            <div
              style={{
                margin: "22px auto 0",
                height: 2,
                borderRadius: 2,
                background: "linear-gradient(90deg, transparent, #f97316, #fbbf24, transparent)",
                boxShadow: "0 0 20px rgba(249,115,22,0.6)",
                animation: "lineExpand 0.9s cubic-bezier(0.16,1,0.3,1) 0.3s both",
              }}
            />

            <p
              style={{
                marginTop: 22,
                fontSize: 16,
                color: "rgba(247,240,232,0.45)",
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
                gap: 14,
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
                    background: "#f97316",
                    boxShadow: "0 0 10px #f97316",
                    animation: "ambientPulse 1.4s ease-in-out infinite",
                  }}
                />
                <span
                  style={{ fontSize: 12, color: "rgba(247,240,232,0.3)", fontFamily: "monospace" }}
                >
                  loading dashboard…
                </span>
              </div>
              <button
                onClick={onSkip}
                style={{
                  fontSize: 12,
                  color: "rgba(247,240,232,0.5)",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(249,115,22,0.15)",
                  borderRadius: 8,
                  padding: "6px 16px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                }}
              >
                Skip → Go to dashboard
              </button>
              {showFallback && (
                <div style={{ fontSize: 11, color: "rgba(247,240,232,0.3)", marginTop: 4 }}>
                  Taking too long?{" "}
                  <button
                    onClick={onSkip}
                    style={{
                      fontSize: 11,
                      color: "#f97316",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      padding: 0,
                      textDecoration: "underline",
                    }}
                  >
                    Go to your dashboard
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
