// Today's lesson — the home screen is a mentor handing you one assignment,
// not a mission checklist. One mentor speaks in first person; upcoming
// lessons sit behind as muted avatars, never a task list.
//
// Before the curriculum exists, Dhruv presents lesson zero: get (or accept)
// the Investment Assessment. Accepting it is what builds the curriculum.

import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, GraduationCap, Quote } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useCurriculum } from "@/hooks/use-curriculum";
import { mentorById, isAcceptableCasefile, MENTOR_ROSTER, type Mentor } from "@/lib/mentors";
import { MentorAvatar } from "@/components/app/MentorAvatar";
import { toolRunsQuery } from "@/lib/queries";

export function TodaysLessonHero() {
  const { currentOrgId } = useAuth();
  const { playbook, activeLesson, upcoming, lessons, completedCount, isLoading } = useCurriculum();

  const runsQ = useQuery({ ...toolRunsQuery(currentOrgId ?? "", 50), enabled: !!currentOrgId });

  if (isLoading) {
    return (
      <div
        className="animate-pulse rounded-2xl border p-6"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div className="h-5 w-48 rounded bg-surface-2" />
        <div className="mt-3 h-8 w-3/4 rounded bg-surface-2" />
      </div>
    );
  }

  // ── Lesson zero: no curriculum yet ──────────────────────────────────────
  if (!playbook || !activeLesson) {
    const dhruv = mentorById("dhruv-patel")!;
    const runs = (runsQ.data ?? []) as Array<{ id: string; tool_key?: string; status: string }>;
    const assessment = runs.find(
      (r) => r.status === "succeeded" && isAcceptableCasefile(r.tool_key ?? ""),
    );

    return (
      <LessonShell
        mentor={dhruv}
        kicker="Your first assignment"
        title={
          assessment
            ? "Your assessment is in — review it with me"
            : "Let's find out if this idea is worth backing"
        }
        body={
          assessment
            ? "I've scored your idea the way an investor would. Read my verdict — if you accept it, I'll bring in the other five mentors and we'll build your program around this exact business."
            : "Before anyone builds anything, we check the numbers. Bring me your idea and I'll give you a straight score and verdict. Accept it, and your personal program begins."
        }
        cta={assessment ? "Read Dhruv's verdict" : "Start with Dhruv"}
        to={assessment ? "/app/launchpad/outputs/$id" : "/app/launchpad/$tool"}
        params={assessment ? { id: assessment.id } : { tool: "idea-validator" }}
        upcoming={MENTOR_ROSTER.filter((m) => m.id !== "dhruv-patel").slice(0, 5)}
        footnote="join once you accept"
        progress={null}
      />
    );
  }

  // ── The active lesson, in its mentor's voice ────────────────────────────
  const mentor = mentorById(activeLesson.mentor_id) ?? MENTOR_ROSTER[0];
  const upcomingMentors = upcoming
    .map((l) => mentorById(l.mentor_id))
    .filter((m): m is Mentor => !!m);

  return (
    <LessonShell
      mentor={mentor}
      kicker={`Lesson ${completedCount + 1} of ${lessons.length}`}
      title={activeLesson.title}
      body={stripSelfIntro(activeLesson.summary) ?? mentor.voice}
      cta={`Start with ${mentor.first}`}
      to="/app/launchpad/$tool"
      params={{ tool: activeLesson.tool_key }}
      search={{ lesson: activeLesson.id }}
      upcoming={upcomingMentors}
      footnote="up next"
      progress={{ done: completedCount, total: lessons.length }}
    />
  );
}

/** Lesson summaries open with "Maya here." / "Dhruv." — redundant next to the
 *  mentor's name in the header, so strip the salutation for the hero quote. */
function stripSelfIntro(text: string | null): string | null {
  if (!text) return null;
  return text.replace(/^[A-Z][a-z]+( here)?[.,]\s*/, "");
}

function LessonShell({
  mentor,
  kicker,
  title,
  body,
  cta,
  to,
  params,
  search,
  upcoming,
  footnote,
  progress,
}: {
  mentor: Mentor;
  kicker: string;
  title: string;
  body: string;
  cta: string;
  to: string;
  params: Record<string, string>;
  search?: Record<string, string>;
  upcoming: Mentor[];
  footnote: string;
  progress: { done: number; total: number } | null;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border"
      style={{
        borderColor: `color-mix(in oklab, ${mentor.hue} 30%, var(--border))`,
        background: "var(--surface)",
        boxShadow: "0 1px 3px color-mix(in oklab, var(--foreground) 6%, transparent)",
      }}
    >
      {/* Mentor-hued wash behind the mentor column */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[290px] max-md:w-full max-md:h-[120px]"
        style={{
          background: `linear-gradient(120deg, color-mix(in oklab, ${mentor.hue} 14%, var(--surface)), transparent 85%)`,
        }}
      />
      {/* Oversized watermark initials — quiet depth, never text the user reads */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -left-4 select-none font-display text-[150px] font-black leading-none opacity-[0.05]"
        style={{ color: mentor.hue }}
      >
        {mentor.first[0]}
        {mentor.name.split(" ")[1]?.[0]}
      </div>

      <div className="relative grid gap-0 md:grid-cols-[250px_1fr]">
        {/* ── Mentor column ── */}
        <div
          className="flex flex-row items-center gap-4 p-6 md:flex-col md:items-start md:justify-center md:border-r"
          style={{ borderColor: "color-mix(in oklab, var(--border) 70%, transparent)" }}
        >
          <MentorAvatar mentor={mentor} size="xl" />
          <div>
            <div
              className="text-[16px] font-bold leading-tight"
              style={{ color: "var(--foreground)" }}
            >
              {mentor.name}
            </div>
            <div className="mt-0.5 text-[12px] font-medium" style={{ color: mentor.hue }}>
              {mentor.domain}
            </div>
            <div
              className="mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider"
              style={{
                borderColor: `color-mix(in oklab, ${mentor.hue} 35%, transparent)`,
                color: mentor.hue,
                background: `color-mix(in oklab, ${mentor.hue} 8%, transparent)`,
              }}
            >
              <GraduationCap className="h-3 w-3" />
              Your mentor
            </div>
          </div>
        </div>

        {/* ── Assignment column ── */}
        <div className="flex flex-col justify-center p-6 md:py-7 md:pl-7">
          <div className="flex items-center gap-3">
            <span
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: "var(--muted-foreground)" }}
            >
              {kicker}
            </span>
            {progress && progress.total > 0 && (
              <span
                className="h-[5px] w-28 overflow-hidden rounded-full"
                style={{ background: "var(--surface-2, var(--border))" }}
              >
                <span
                  className="block h-full rounded-full transition-[width]"
                  style={{
                    width: `${Math.round((progress.done / progress.total) * 100)}%`,
                    background: mentor.hue,
                  }}
                />
              </span>
            )}
          </div>

          <h2
            className="mt-2 font-display text-[26px] font-bold leading-[1.15] tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            {title}
          </h2>

          {/* The mentor speaks — quoted, in their voice */}
          <div className="mt-3 flex max-w-2xl gap-2.5">
            <Quote
              className="mt-0.5 h-4 w-4 shrink-0 -scale-x-100"
              style={{ color: `color-mix(in oklab, ${mentor.hue} 60%, transparent)` }}
            />
            <p className="text-[14px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              {body}
              <span
                className="ml-2 text-[12px] font-semibold not-italic"
                style={{ color: mentor.hue }}
              >
                — {mentor.first}
              </span>
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-5">
            <Link
              to={to}
              params={params}
              search={search}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold text-white shadow-sm transition-all hover:translate-y-[-1px] hover:opacity-95"
              style={{
                background: mentor.hue,
                boxShadow: `0 4px 14px color-mix(in oklab, ${mentor.hue} 35%, transparent)`,
              }}
            >
              {cta}
              <ArrowRight className="h-4 w-4" />
            </Link>

            {upcoming.length > 0 && (
              <div className="flex items-center gap-2.5">
                <div className="flex -space-x-2.5">
                  {upcoming.map((m, i) => (
                    <MentorAvatar key={`${m.id}-${i}`} mentor={m} size="sm" muted />
                  ))}
                </div>
                <span
                  className="text-[11.5px] leading-tight"
                  style={{ color: "var(--text-faint)" }}
                >
                  {upcoming
                    .slice(0, 2)
                    .map((m) => m.first)
                    .join(", ")}
                  {upcoming.length > 2 ? ` +${upcoming.length - 2}` : ""} {footnote}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
