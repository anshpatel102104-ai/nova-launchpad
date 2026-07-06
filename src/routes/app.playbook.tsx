/**
 * YOUR PROGRAM — /app/playbook
 *
 * The curriculum map. Not a template and not a tool list: this is the
 * personalized program built the moment the founder accepted their
 * Investment Assessment — lessons delegated across six mentors, tracked
 * like a school tracks a student (module and mentor, never raw task counts).
 *
 * Completed lessons open the casefile they produced. The active lesson opens
 * a session with its mentor. Locked lessons wait their turn.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, GraduationCap, Lock } from "lucide-react";
import { useCurriculum } from "@/hooks/use-curriculum";
import {
  BUSINESS_MODEL_LABELS,
  CURRICULUM_STAGES,
  STAGE_MODULE_LABELS,
  mentorById,
  type CurriculumStage,
  type Lesson,
  type Mentor,
} from "@/lib/mentors";
import { MentorAvatar } from "@/components/app/MentorAvatar";

export const Route = createFileRoute("/app/playbook")({ component: ProgramPage });

function ProgramPage() {
  const { playbook, lessons, isLoading } = useCurriculum();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-6">
        <div className="h-24 animate-pulse rounded-xl bg-surface-2" />
        <div className="h-64 animate-pulse rounded-xl bg-surface-2" />
      </div>
    );
  }

  if (!playbook || lessons.length === 0) return <NoProgramYet />;

  // Lessons grouped by stage → the modules of the program.
  const stages = CURRICULUM_STAGES.filter((s) => lessons.some((l) => l.stage === s));
  const activeLesson = lessons.find((l) => l.status === "active") ?? null;
  const activeMentor = activeLesson ? mentorById(activeLesson.mentor_id) : null;
  const activeStageIdx = activeLesson
    ? stages.indexOf(activeLesson.stage)
    : Math.max(stages.length - 1, 0);

  const doneIn = (s: CurriculumStage) =>
    lessons.filter((l) => l.stage === s && (l.status === "completed" || l.status === "skipped"))
      .length;
  const totalIn = (s: CurriculumStage) => lessons.filter((l) => l.stage === s).length;

  const activeStage = stages[activeStageIdx];

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6">
      {/* ── Header — the program, not a checklist ── */}
      <div>
        <div
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest"
          style={{ color: "var(--muted-foreground)" }}
        >
          <GraduationCap className="h-3.5 w-3.5" />
          Your program
        </div>
        <h1
          className="mt-1 font-display text-2xl font-bold tracking-tight"
          style={{ color: "var(--foreground)" }}
        >
          Built for your {BUSINESS_MODEL_LABELS[playbook.business_model].toLowerCase()}
        </h1>
        {activeLesson && activeMentor && (
          <p className="mt-1 text-[13.5px]" style={{ color: "var(--muted-foreground)" }}>
            Module {activeStageIdx + 1}: {STAGE_MODULE_LABELS[activeStage]} — {doneIn(activeStage)}{" "}
            of {totalIn(activeStage)} lessons complete, {activeMentor.first}&rsquo;s up next.
          </p>
        )}
      </div>

      {/* ── Stage timeline with mentor ownership ── */}
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-[640px] items-stretch gap-0">
          {stages.map((s, i) => {
            const done = doneIn(s);
            const total = totalIn(s);
            const stageMentors = uniqueMentors(lessons.filter((l) => l.stage === s));
            const state: "done" | "current" | "upcoming" =
              done === total ? "done" : i <= activeStageIdx ? "current" : "upcoming";
            return (
              <div key={s} className="flex flex-1 items-start">
                <div
                  className="flex-1 rounded-lg border p-3"
                  style={{
                    borderColor:
                      state === "current"
                        ? "color-mix(in oklab, var(--primary) 45%, var(--border))"
                        : "var(--border)",
                    background:
                      state === "current"
                        ? "color-mix(in oklab, var(--primary) 6%, var(--surface))"
                        : "var(--surface)",
                    opacity: state === "upcoming" ? 0.6 : 1,
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-[11px] font-bold uppercase tracking-wider"
                      style={{
                        color: state === "current" ? "var(--primary)" : "var(--muted-foreground)",
                      }}
                    >
                      Module {i + 1}
                    </span>
                    {done === total ? (
                      <Check className="h-3.5 w-3.5" style={{ color: "var(--success)" }} />
                    ) : (
                      <span className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>
                        {done} of {total}
                      </span>
                    )}
                  </div>
                  <div
                    className="mt-0.5 text-[13px] font-semibold"
                    style={{ color: "var(--foreground)" }}
                  >
                    {STAGE_MODULE_LABELS[s]}
                  </div>
                  <div className="mt-2 flex -space-x-1.5">
                    {stageMentors.map((m) => (
                      <MentorAvatar key={m.id} mentor={m} size="sm" muted={state === "upcoming"} />
                    ))}
                  </div>
                </div>
                {i < stages.length - 1 && (
                  <div
                    className="mt-8 h-[2px] w-3 shrink-0"
                    style={{ background: "var(--border)" }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Lessons by module ── */}
      {stages.map((s, i) => (
        <div key={s}>
          <div
            className="mb-2 text-[11px] font-bold uppercase tracking-widest"
            style={{ color: "var(--muted-foreground)" }}
          >
            Module {i + 1} · {STAGE_MODULE_LABELS[s]}
          </div>
          <div
            className="divide-y rounded-xl border"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            {lessons
              .filter((l) => l.stage === s)
              .map((lesson) => (
                <LessonRow key={lesson.id} lesson={lesson} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function uniqueMentors(lessons: Lesson[]): Mentor[] {
  const seen = new Set<string>();
  const out: Mentor[] = [];
  for (const l of lessons) {
    if (seen.has(l.mentor_id)) continue;
    seen.add(l.mentor_id);
    const m = mentorById(l.mentor_id);
    if (m) out.push(m);
  }
  return out;
}

function LessonRow({ lesson }: { lesson: Lesson }) {
  const mentor = mentorById(lesson.mentor_id);
  if (!mentor) return null;

  const inner = (
    <div
      className="flex items-center gap-3.5 px-4 py-3.5"
      style={{ opacity: lesson.status === "locked" ? 0.55 : 1 }}
    >
      <MentorAvatar mentor={mentor} size="md" muted={lesson.status === "locked"} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="truncate text-[14px] font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            {lesson.title}
          </span>
          {lesson.status === "active" && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
            >
              Now
            </span>
          )}
        </div>
        <div className="mt-0.5 truncate text-[12px]" style={{ color: "var(--muted-foreground)" }}>
          {mentor.name} · {mentor.domain}
        </div>
      </div>
      {lesson.status === "completed" ? (
        <span
          className="flex items-center gap-1.5 text-[12px] font-semibold"
          style={{ color: "var(--success)" }}
        >
          <Check className="h-4 w-4" /> Done
        </span>
      ) : lesson.status === "active" ? (
        <span
          className="flex items-center gap-1.5 text-[12.5px] font-semibold"
          style={{ color: "var(--primary)" }}
        >
          Start with {mentor.first} <ArrowRight className="h-3.5 w-3.5" />
        </span>
      ) : (
        <Lock className="h-3.5 w-3.5" style={{ color: "var(--text-faint)" }} />
      )}
    </div>
  );

  // Completed lessons open the casefile they produced, unchanged.
  if (lesson.status === "completed" && lesson.tool_run_id) {
    return (
      <Link
        to="/app/launchpad/outputs/$id"
        params={{ id: lesson.tool_run_id }}
        className="block transition-colors hover:bg-surface-2"
      >
        {inner}
      </Link>
    );
  }
  if (lesson.status === "active") {
    return (
      <Link
        to="/app/launchpad/$tool"
        params={{ tool: lesson.tool_key }}
        search={{ lesson: lesson.id }}
        className="block transition-colors hover:bg-surface-2"
      >
        {inner}
      </Link>
    );
  }
  return <div>{inner}</div>;
}

/** Pre-acceptance state: the program doesn't exist until the founder commits. */
function NoProgramYet() {
  const dhruv = mentorById("dhruv-patel")!;
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center p-6 text-center">
      <MentorAvatar mentor={dhruv} size="xl" />
      <h1
        className="mt-4 font-display text-xl font-bold tracking-tight"
        style={{ color: "var(--foreground)" }}
      >
        Your program starts with a decision
      </h1>
      <p
        className="mt-2 text-[13.5px] leading-relaxed"
        style={{ color: "var(--muted-foreground)" }}
      >
        Dhruv here. Bring me your idea and I&rsquo;ll score it the way an investor would — straight
        verdict, no sugar. The moment you accept my assessment, the six of us build your personal
        program around exactly what you&rsquo;re starting.
      </p>
      <Link
        to="/app/launchpad/$tool"
        params={{ tool: "idea-validator" }}
        className="mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: "var(--primary)" }}
      >
        Start with Dhruv <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
