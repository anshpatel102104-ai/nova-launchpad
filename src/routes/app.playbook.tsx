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
import { ProgressRing } from "@/components/app/ProgressRing";

export const Route = createFileRoute("/app/playbook")({ component: ProgramPage });

function ProgramPage() {
  const { playbook, lessons, isLoading, completedCount } = useCurriculum();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-6">
        <div className="h-24 animate-pulse rounded-2xl bg-surface-2" />
        <div className="h-64 animate-pulse rounded-2xl bg-surface-2" />
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
  const pct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-9 p-4 sm:p-6">
      {/* ── Header band — the program, not a checklist ── */}
      <div
        className="relative overflow-hidden rounded-2xl border px-6 py-6"
        style={{
          borderColor: "var(--border)",
          background:
            "linear-gradient(125deg, color-mix(in oklab, var(--primary) 8%, var(--surface)), var(--surface) 60%)",
        }}
      >
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0">
            <div
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest"
              style={{ color: "var(--primary)" }}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              Your program
            </div>
            <h1
              className="mt-1.5 font-display text-[26px] font-bold leading-tight tracking-tight"
              style={{ color: "var(--foreground)" }}
            >
              Built for your {BUSINESS_MODEL_LABELS[playbook.business_model].toLowerCase()}
            </h1>
            {activeLesson && activeMentor && (
              <p className="mt-1.5 text-[13.5px]" style={{ color: "var(--muted-foreground)" }}>
                Module {activeStageIdx + 1}: {STAGE_MODULE_LABELS[activeStage]} —{" "}
                {doneIn(activeStage)} of {totalIn(activeStage)} lessons complete,{" "}
                <span className="font-semibold" style={{ color: activeMentor.hue }}>
                  {activeMentor.first}&rsquo;s up next
                </span>
                .
              </p>
            )}
          </div>

          {/* Overall progress dial */}
          <div className="flex items-center gap-3">
            <ProgressRing percent={pct} />
            <div>
              <div
                className="text-[20px] font-bold leading-none"
                style={{ color: "var(--foreground)" }}
              >
                {completedCount}
                <span className="text-[13px] font-semibold" style={{ color: "var(--text-faint)" }}>
                  {" "}
                  / {lessons.length}
                </span>
              </div>
              <div
                className="mt-1 text-[11px] font-medium uppercase tracking-wider"
                style={{ color: "var(--muted-foreground)" }}
              >
                lessons done
              </div>
            </div>
          </div>
        </div>

        {/* Faculty strip */}
        <div
          className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-4"
          style={{ borderColor: "color-mix(in oklab, var(--border) 70%, transparent)" }}
        >
          <span
            className="text-[10.5px] font-bold uppercase tracking-widest"
            style={{ color: "var(--text-faint)" }}
          >
            Your mentors
          </span>
          {uniqueMentors(lessons).map((m) => (
            <span key={m.id} className="flex items-center gap-1.5">
              <MentorAvatar mentor={m} size="sm" />
              <span
                className="text-[12px] font-medium"
                style={{ color: "var(--muted-foreground)" }}
              >
                {m.first}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Stage timeline with mentor ownership ── */}
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-[680px] items-stretch">
          {stages.map((s, i) => {
            const done = doneIn(s);
            const total = totalIn(s);
            const stageMentors = uniqueMentors(lessons.filter((l) => l.stage === s));
            const isDone = done === total;
            const isCurrent = i === activeStageIdx;
            const isUpcoming = i > activeStageIdx && !isDone;
            return (
              <div key={s} className="flex flex-1 items-stretch">
                <div
                  className="relative flex-1 rounded-xl border p-3.5 transition-shadow"
                  style={{
                    borderColor: isCurrent
                      ? "color-mix(in oklab, var(--primary) 50%, var(--border))"
                      : isDone
                        ? "color-mix(in oklab, var(--success) 35%, var(--border))"
                        : "var(--border)",
                    background: isCurrent
                      ? "color-mix(in oklab, var(--primary) 7%, var(--surface))"
                      : "var(--surface)",
                    opacity: isUpcoming ? 0.55 : 1,
                    boxShadow: isCurrent
                      ? "0 4px 16px color-mix(in oklab, var(--primary) 14%, transparent)"
                      : "none",
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                      style={
                        isDone
                          ? {
                              background: "var(--success)",
                              color: "var(--success-foreground, white)",
                            }
                          : isCurrent
                            ? {
                                background: "var(--primary)",
                                color: "var(--primary-foreground, white)",
                              }
                            : { border: "1.5px solid var(--border)", color: "var(--text-faint)" }
                      }
                    >
                      {isDone ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    <span
                      className="text-[10.5px] font-semibold"
                      style={{ color: isCurrent ? "var(--primary)" : "var(--text-faint)" }}
                    >
                      {done}/{total}
                    </span>
                  </div>
                  <div
                    className="mt-2 text-[13px] font-bold leading-tight"
                    style={{ color: "var(--foreground)" }}
                  >
                    {STAGE_MODULE_LABELS[s]}
                  </div>
                  <div
                    className="text-[10.5px] font-medium uppercase tracking-wider"
                    style={{ color: "var(--text-faint)" }}
                  >
                    Module {i + 1}
                  </div>
                  <div className="mt-2.5 flex -space-x-1.5">
                    {stageMentors.map((m) => (
                      <MentorAvatar key={m.id} mentor={m} size="sm" muted={isUpcoming} />
                    ))}
                  </div>
                </div>
                {i < stages.length - 1 && (
                  <div className="flex w-5 shrink-0 items-center">
                    <div
                      className="h-[2px] w-full"
                      style={{
                        background: i < activeStageIdx ? "var(--success)" : "var(--border)",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Lessons by module ── */}
      {stages.map((s, i) => (
        <div key={s}>
          <div className="mb-3 flex items-baseline gap-2.5">
            <span
              className="font-display text-[15px] font-bold"
              style={{ color: "var(--foreground)" }}
            >
              Module {i + 1} · {STAGE_MODULE_LABELS[s]}
            </span>
            <span className="text-[11.5px] font-medium" style={{ color: "var(--text-faint)" }}>
              {doneIn(s)} of {totalIn(s)} complete
            </span>
          </div>
          <div className="space-y-2.5">
            {lessons
              .filter((l) => l.stage === s)
              .map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} />
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

function LessonCard({ lesson }: { lesson: Lesson }) {
  const mentor = mentorById(lesson.mentor_id);
  if (!mentor) return null;

  const isActive = lesson.status === "active";
  const isDone = lesson.status === "completed" || lesson.status === "skipped";

  const card = (
    <div
      className="relative flex items-center gap-4 overflow-hidden rounded-xl border py-3.5 pl-5 pr-4 transition-shadow"
      style={{
        borderColor: isActive
          ? `color-mix(in oklab, ${mentor.hue} 45%, var(--border))`
          : "var(--border)",
        background: isActive
          ? `linear-gradient(115deg, color-mix(in oklab, ${mentor.hue} 7%, var(--surface)), var(--surface) 55%)`
          : "var(--surface)",
        opacity: lesson.status === "locked" ? 0.55 : 1,
        boxShadow: isActive
          ? `0 4px 18px color-mix(in oklab, ${mentor.hue} 16%, transparent)`
          : "none",
      }}
    >
      {/* Mentor-hue spine */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{
          background: isDone
            ? "var(--success)"
            : isActive
              ? mentor.hue
              : "color-mix(in oklab, var(--border) 80%, transparent)",
        }}
      />
      <MentorAvatar
        mentor={mentor}
        size={isActive ? "lg" : "md"}
        muted={lesson.status === "locked"}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`truncate font-semibold ${isActive ? "text-[15px]" : "text-[14px]"}`}
            style={{ color: "var(--foreground)" }}
          >
            {lesson.title}
          </span>
          {isActive && (
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-white"
              style={{ background: mentor.hue }}
            >
              Now
            </span>
          )}
        </div>
        <div className="mt-0.5 truncate text-[12px]" style={{ color: "var(--muted-foreground)" }}>
          {mentor.name} · {mentor.domain}
        </div>
        {isActive && lesson.summary && (
          <p
            className="mt-1.5 line-clamp-2 max-w-xl text-[12.5px] leading-relaxed"
            style={{ color: "var(--muted-foreground)" }}
          >
            &ldquo;{lesson.summary}&rdquo;
          </p>
        )}
      </div>
      {isDone ? (
        <span
          className="flex shrink-0 items-center gap-1.5 text-[12px] font-semibold"
          style={{ color: "var(--success)" }}
        >
          <Check className="h-4 w-4" /> Done
        </span>
      ) : isActive ? (
        <span
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold text-white"
          style={{ background: mentor.hue }}
        >
          Start with {mentor.first} <ArrowRight className="h-3.5 w-3.5" />
        </span>
      ) : (
        <Lock className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--text-faint)" }} />
      )}
    </div>
  );

  // Completed lessons open the casefile they produced, unchanged.
  if (isDone && lesson.tool_run_id) {
    return (
      <Link
        to="/app/launchpad/outputs/$id"
        params={{ id: lesson.tool_run_id }}
        className="block transition-transform hover:translate-y-[-1px]"
      >
        {card}
      </Link>
    );
  }
  if (isActive) {
    return (
      <Link
        to="/app/launchpad/$tool"
        params={{ tool: lesson.tool_key }}
        search={{ lesson: lesson.id }}
        className="block transition-transform hover:translate-y-[-1px]"
      >
        {card}
      </Link>
    );
  }
  return <div>{card}</div>;
}

/** Pre-acceptance state: the program doesn't exist until the founder commits. */
function NoProgramYet() {
  const dhruv = mentorById("dhruv-patel")!;
  return (
    <div className="mx-auto flex min-h-[62vh] max-w-2xl flex-col items-center justify-center p-6 text-center">
      {/* Faculty behind Dhruv */}
      <div className="mb-1 flex items-end justify-center">
        <div className="flex -space-x-2.5">
          {["maya-okafor", "alex-chen"].map((id) => {
            const m = mentorById(id)!;
            return <MentorAvatar key={id} mentor={m} size="md" muted />;
          })}
        </div>
        <MentorAvatar mentor={dhruv} size="xl" className="z-10 mx-2" />
        <div className="flex -space-x-2.5">
          {["james-rivera", "priya-nair", "mo-latif"].map((id) => {
            const m = mentorById(id)!;
            return <MentorAvatar key={id} mentor={m} size="md" muted />;
          })}
        </div>
      </div>
      <div
        className="mt-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10.5px] font-bold uppercase tracking-widest"
        style={{
          borderColor: "color-mix(in oklab, var(--primary) 35%, transparent)",
          color: "var(--primary)",
          background: "color-mix(in oklab, var(--primary) 7%, transparent)",
        }}
      >
        <GraduationCap className="h-3 w-3" /> Six mentors, one program
      </div>
      <h1
        className="mt-3 font-display text-[24px] font-bold tracking-tight"
        style={{ color: "var(--foreground)" }}
      >
        Your program starts with a decision
      </h1>
      <p
        className="mt-2 max-w-lg text-[13.5px] leading-relaxed"
        style={{ color: "var(--muted-foreground)" }}
      >
        Bring Dhruv your idea and he&rsquo;ll score it the way an investor would — straight verdict,
        no sugar. The moment you accept his assessment, all six mentors build your personal program
        around exactly what you&rsquo;re starting.
      </p>
      <Link
        to="/app/launchpad/$tool"
        params={{ tool: "idea-validator" }}
        className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold text-white shadow-sm transition-all hover:translate-y-[-1px] hover:opacity-95"
        style={{
          background: dhruv.hue,
          boxShadow: `0 4px 14px color-mix(in oklab, ${dhruv.hue} 35%, transparent)`,
        }}
      >
        Start with Dhruv <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
