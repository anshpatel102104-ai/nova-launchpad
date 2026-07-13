// NextStepHero — the one big "do this now" card on Home.
// Shows the current mission's next open step with full hand-holding:
// what it is, why it matters, 3 numbered moves, "you are done when",
// and one purple button. Nova holds your hand; you never guess.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Clock, Loader2, Target, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StepExecutionGuide } from "@/components/app/StepExecutionGuide";
import { getStepGuidance, makeFallbackGuidance } from "@/lib/step-execution-guidance";

interface Props {
  userId: string;
}

interface StepRow {
  id: string;
  title: string;
  description: string | null;
  tool_key: string | null;
  status: string;
  sort_order: number;
}

async function fetchCurrentMission(userId: string) {
  const { data: ws } = await supabase
    .from("workspaces")
    .select("id, name, lane, stage, current_mission_id")
    .eq("owner_id", userId)
    .maybeSingle();
  if (!ws) return null;

  const { data: mission } = await supabase
    .from("missions")
    .select("id, title, description, lane, status")
    .eq("workspace_id", ws.id)
    .eq("status", "active")
    .order("sort_order")
    .limit(1)
    .maybeSingle();
  if (!mission) return null;

  const { data: steps } = await supabase
    .from("mission_steps")
    .select("id, title, description, tool_key, status, sort_order")
    .eq("mission_id", mission.id)
    .order("sort_order");

  return { workspace: ws, mission, steps: (steps ?? []) as StepRow[] };
}

export function NextStepHero({ userId }: Props) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["current-mission", userId],
    queryFn: () => fetchCurrentMission(userId),
    staleTime: 30_000,
    retry: 4,
    retryDelay: 5_000,
  });

  if (isLoading) {
    return (
      <div
        className="flex min-h-[180px] items-center justify-center rounded-[6px] border"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <Loader2
          className="h-5 w-5"
          style={{ color: "var(--muted-foreground)", animation: "spin 1s linear infinite" }}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className="rounded-[6px] border p-6 text-center"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <Target className="mx-auto mb-3 h-6 w-6" style={{ color: "var(--muted-foreground)" }} />
        <div className="text-[15px] font-bold" style={{ color: "var(--foreground)" }}>
          No step waiting right now
        </div>
        <div
          className="mx-auto mt-1.5 max-w-md text-[13px]"
          style={{ color: "var(--muted-foreground)" }}
        >
          If you just signed up, your first step may still be loading — check again in a moment. Or
          pick a goal and Nova will build your steps.
        </div>
        <div className="mt-4 flex justify-center gap-2.5">
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["current-mission", userId] })}
            className="rounded-[4px] border px-4 py-2 text-[13px] font-semibold"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface-2)",
              color: "var(--muted-foreground)",
            }}
          >
            Check again
          </button>
          <Link
            to="/app/outcomes/$category"
            params={{ category: "build" }}
            className="inline-flex items-center gap-1.5 rounded-[4px] px-4 py-2 text-[13px] font-bold text-white"
            style={{ background: "var(--primary)" }}
          >
            Pick a goal <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  const { mission, steps } = data;
  const done = steps.filter((s) => s.status === "completed" || s.status === "skipped").length;
  const current = steps.find((s) => s.status !== "completed" && s.status !== "skipped");

  // Whole mission finished — celebrate plainly, point at the next one.
  if (!current) {
    return (
      <div
        className="rounded-[6px] border p-6"
        style={{
          borderColor: "color-mix(in oklab, var(--success) 35%, transparent)",
          borderLeft: "4px solid var(--success)",
          background: "var(--surface)",
        }}
      >
        <div className="text-[16px] font-extrabold" style={{ color: "var(--foreground)" }}>
          You finished "{mission.title as string}". Great work!
        </div>
        <div className="mt-1 text-[13px]" style={{ color: "var(--muted-foreground)" }}>
          Every step is done. Nova has your next goal ready.
        </div>
        <Link
          to="/app/outcomes/$category"
          params={{ category: "build" }}
          className="mt-4 inline-flex items-center gap-2 rounded-[4px] px-4 py-2.5 text-[13px] font-bold text-white"
          style={{ background: "var(--primary)" }}
        >
          See your next goal <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  const guidance =
    getStepGuidance(current.tool_key) ??
    makeFallbackGuidance(current.title, current.description, current.tool_key);

  return (
    <div
      className="overflow-hidden rounded-[6px] border"
      style={{
        borderColor: "var(--primary-border)",
        borderLeft: "4px solid var(--primary)",
        background: "var(--surface)",
        boxShadow:
          "0 4px 8px var(--primary-glow), 0 12px 32px color-mix(in oklab, var(--primary) 8%, transparent)",
      }}
    >
      {/* Top strip */}
      <div
        className="flex items-center justify-between px-6 py-2.5"
        style={{
          background: "var(--primary-soft)",
          borderBottom: "1px solid var(--primary-border)",
        }}
      >
        <span
          className="text-[11.5px] font-extrabold uppercase tracking-[0.08em]"
          style={{ color: "var(--primary)" }}
        >
          Your next step · {done + 1} of {steps.length}
        </span>
        <span
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold"
          style={{ color: "var(--muted-foreground)" }}
        >
          <Clock className="h-3 w-3" />
          about {guidance.minutes} minutes
        </span>
      </div>

      <div className="px-6 py-5">
        <div className="text-[11.5px] font-semibold" style={{ color: "var(--text-faint)" }}>
          Goal: {mission.title as string}
        </div>
        <h2
          className="mt-0.5 text-[22px] font-extrabold leading-tight"
          style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}
        >
          {guidance.title}
        </h2>
        <p
          className="mt-1 text-[14px] leading-relaxed"
          style={{ color: "var(--muted-foreground)" }}
        >
          {guidance.plainWhat}
        </p>

        <div className="mt-4">
          <StepExecutionGuide guidance={guidance} stepId={current.id} />
        </div>
      </div>
    </div>
  );
}
