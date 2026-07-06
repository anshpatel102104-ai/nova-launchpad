// Curriculum data layer — the founder's playbook and lessons.
// One playbook per org (created when they accept their Investment Assessment),
// ordered lessons each owned by one mentor. Completing a lesson unlocks the next.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdge } from "@/lib/invokeEdge";
import { useAuth } from "@/lib/auth";
import type { Lesson, Playbook } from "@/lib/mentors";

// Tables are newer than the generated Supabase types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function playbookQuery(orgId: string) {
  return {
    queryKey: ["playbook", orgId],
    queryFn: async (): Promise<Playbook | null> => {
      const { data, error } = await db
        .from("playbooks")
        .select("id, organization_id, casefile_run_id, business_model, stage")
        .eq("organization_id", orgId)
        .maybeSingle();
      if (error) throw error;
      return (data as Playbook) ?? null;
    },
    staleTime: 60_000,
  };
}

export function lessonsQuery(orgId: string) {
  return {
    queryKey: ["playbook-lessons", orgId],
    queryFn: async (): Promise<Lesson[]> => {
      const { data, error } = await db
        .from("playbook_lessons")
        .select(
          "id, playbook_id, mentor_id, stage, title, tool_key, output_format, status, position, summary, tool_run_id",
        )
        .eq("organization_id", orgId)
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Lesson[];
    },
    staleTime: 60_000,
  };
}

export function useCurriculum() {
  const { currentOrgId } = useAuth();
  const orgId = currentOrgId ?? "";

  const playbookQ = useQuery({ ...playbookQuery(orgId), enabled: !!orgId });
  const lessonsQ = useQuery({ ...lessonsQuery(orgId), enabled: !!orgId });

  const lessons = lessonsQ.data ?? [];
  const activeLesson = lessons.find((l) => l.status === "active") ?? null;
  const completed = lessons.filter((l) => l.status === "completed" || l.status === "skipped");

  return {
    isLoading: playbookQ.isLoading || lessonsQ.isLoading,
    playbook: playbookQ.data ?? null,
    lessons,
    activeLesson,
    completedCount: completed.length,
    /** Next lessons after the active one, for the muted "up next" avatars. */
    upcoming: lessons.filter((l) => l.status === "locked").slice(0, 4),
  };
}

/** Accept an Investment Assessment casefile → build the curriculum. */
export function useAcceptCasefile() {
  const qc = useQueryClient();
  const { currentOrgId } = useAuth();
  return useMutation({
    mutationFn: async (runId: string) =>
      invokeEdge<{ playbook_id: string; business_model: string; lesson_count: number }>(
        "generate-playbook",
        { run_id: runId },
        { timeoutMs: 45_000 },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["playbook", currentOrgId] });
      qc.invalidateQueries({ queryKey: ["playbook-lessons", currentOrgId] });
    },
  });
}

/**
 * Mark a lesson complete (linking the casefile it produced) and unlock the
 * next locked lesson so the curriculum always has exactly one active step.
 */
export function useCompleteLesson() {
  const qc = useQueryClient();
  const { currentOrgId } = useAuth();
  return useMutation({
    mutationFn: async ({ lesson, toolRunId }: { lesson: Lesson; toolRunId?: string }) => {
      const { error } = await db
        .from("playbook_lessons")
        .update({
          status: "completed",
          tool_run_id: toolRunId ?? null,
          completed_at: new Date().toISOString(),
        })
        .eq("id", lesson.id);
      if (error) throw error;

      const { data: next } = await db
        .from("playbook_lessons")
        .select("id")
        .eq("playbook_id", lesson.playbook_id)
        .eq("status", "locked")
        .order("position", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (next?.id) {
        await db.from("playbook_lessons").update({ status: "active" }).eq("id", next.id);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["playbook-lessons", currentOrgId] });
    },
  });
}
