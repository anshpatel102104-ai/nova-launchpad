// Today's lesson — the home screen is a mentor handing you one assignment,
// not a mission checklist. One mentor speaks in first person; upcoming
// lessons sit behind as muted avatars, never a task list.
//
// Before the curriculum exists, Dhruv presents lesson zero: get (or accept)
// the Investment Assessment. Accepting it is what builds the curriculum.

import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, GraduationCap } from "lucide-react";
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
        className="animate-pulse rounded-xl border p-6"
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
            ? "Dhruv here. I've scored your idea the way an investor would. Read my verdict — if you accept it, I'll bring in the other five mentors and we'll build your program around this exact business."
            : "Dhruv here. Before anyone builds anything, we check the numbers. Bring me your idea and I'll give you a straight score and verdict. Accept it, and your personal program begins."
        }
        cta={assessment ? "Read Dhruv's verdict" : "Start with Dhruv"}
        to={assessment ? "/app/launchpad/outputs/$id" : "/app/launchpad/$tool"}
        params={assessment ? { id: assessment.id } : { tool: "idea-validator" }}
        upcoming={MENTOR_ROSTER.filter((m) => m.id !== "dhruv-patel").slice(0, 4)}
        footnote="Five more mentors join once you accept your assessment."
      />
    );
  }

  // ── The active lesson, in its mentor's voice ────────────────────────────
  const mentor = mentorById(activeLesson.mentor_id) ?? MENTOR_ROSTER[0];
  const upcomingMentors = upcoming
    .map((l) => mentorById(l.mentor_id))
    .filter((m): m is NonNullable<typeof m> => !!m);

  return (
    <LessonShell
      mentor={mentor}
      kicker={`Lesson ${completedCount + 1} of ${lessons.length} · ${mentor.domain}`}
      title={activeLesson.title}
      body={activeLesson.summary ?? mentor.voice}
      cta={`Start with ${mentor.first}`}
      to="/app/launchpad/$tool"
      params={{ tool: activeLesson.tool_key }}
      search={{ lesson: activeLesson.id }}
      upcoming={upcomingMentors}
      footnote={upcomingMentors.length > 0 ? "Up next in your program" : undefined}
    />
  );
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
  footnote?: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border p-6"
      style={{
        borderColor: `color-mix(in oklab, ${mentor.hue} 35%, var(--border))`,
        background: `linear-gradient(135deg, color-mix(in oklab, ${mentor.hue} 7%, var(--surface)), var(--surface))`,
      }}
    >
      <div className="flex items-start gap-4">
        <MentorAvatar mentor={mentor} size="xl" />
        <div className="min-w-0 flex-1">
          <div
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider"
            style={{ color: "var(--muted-foreground)" }}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            {kicker}
          </div>
          <div className="mt-0.5 text-[13px] font-semibold" style={{ color: mentor.hue }}>
            {mentor.name}
          </div>
          <h2
            className="mt-1 font-display text-xl font-bold leading-snug"
            style={{ color: "var(--foreground)" }}
          >
            {title}
          </h2>
          <p
            className="mt-2 max-w-2xl text-[13.5px] leading-relaxed"
            style={{ color: "var(--muted-foreground)" }}
          >
            {body}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Link
              to={to}
              params={params}
              search={search}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: mentor.hue }}
            >
              {cta}
              <ArrowRight className="h-4 w-4" />
            </Link>

            {upcoming.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {upcoming.map((m, i) => (
                    <MentorAvatar key={`${m.id}-${i}`} mentor={m} size="sm" muted />
                  ))}
                </div>
                {footnote && (
                  <span className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>
                    {footnote}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
