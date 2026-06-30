/**
 * FounderHome — the Founder-OS command center that leads /app/launchpad.
 *
 * Master-build "dream UI" Home: a Business Snapshot Bar + Active Mission card on
 * the main column, and a Nova Guidance panel, Pipeline Snapshot, and Recent
 * Memory rail. Everything reads live data (business_context, missions, leads,
 * tasks, memory_artifacts) through existing query helpers.
 */
import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Pencil, Sparkles, Target, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  organizationQuery,
  businessContextQuery,
  currentMissionQuery,
  leadsQuery,
  memoryArtifactsQuery,
} from "@/lib/queries";

const STAGES = ["Clarify", "Validate", "Build", "Launch", "Operate", "Scale"];

const GUIDANCE_BY_STAGE: Record<string, { prompt: string; cta: string }> = {
  Clarify: { prompt: "Let's pin down exactly who you're building for.", cta: "Clarify my customer" },
  Validate: { prompt: "Stress-test your idea before you build more.", cta: "Validate my idea" },
  Build: { prompt: "Turn your plan into the smallest shippable slice.", cta: "Plan my MVP" },
  Launch: { prompt: "Line up the assets and channels to go live.", cta: "Build my GTM path" },
  Operate: { prompt: "Tighten your follow-up so no lead goes cold.", cta: "Draft follow-ups" },
  Scale: { prompt: "Find the channel that compounds and double down.", cta: "Find my growth lever" },
};

function jsonText(v: unknown): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  try {
    return Object.values(v as Record<string, unknown>)
      .filter((x) => typeof x === "string" && x)
      .join(" · ");
  } catch {
    return "";
  }
}

export function FounderHome({ orgId, userId }: { orgId: string; userId: string }) {
  const org = useQuery(organizationQuery(orgId));
  const ctx = useQuery(businessContextQuery(orgId));
  const mission = useQuery(currentMissionQuery(userId));
  const leads = useQuery(leadsQuery(orgId));
  const memory = useQuery(memoryArtifactsQuery(orgId));

  const tasksDue = useQuery({
    queryKey: ["tasks-due-today", orgId],
    queryFn: async () => {
      if (!orgId) return 0;
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const { count } = await supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .neq("status", "completed")
        .lte("due_date", end.toISOString());
      return count ?? 0;
    },
    staleTime: 30_000,
  });

  const stage = (org.data?.stage as string) || jsonText(ctx.data?.stage) || "Validate";
  const stageIndex = Math.max(0, STAGES.findIndex((s) => s.toLowerCase() === String(stage).toLowerCase()));
  const belief =
    jsonText(ctx.data?.identity) || (org.data?.offer as string) || (org.data?.niche as string) || "";
  const customer = jsonText(ctx.data?.customer) || (org.data?.target_customer as string) || "";

  const pipeline = useMemo(() => {
    const rows = leads.data ?? [];
    const active = rows.filter((l) => l.stage !== "Won" && l.stage !== "Lost");
    const value = active.reduce((s, l) => s + Number((l as { value?: number }).value ?? 0), 0);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const won = rows.filter(
      (l) => l.stage === "Won" && new Date((l as { updated_at?: string }).updated_at ?? 0) >= monthStart,
    ).length;
    return { active: active.length, value, won };
  }, [leads.data]);

  const guidance = GUIDANCE_BY_STAGE[STAGES[stageIndex]] ?? GUIDANCE_BY_STAGE.Validate;
  const activeMission = mission.data?.mission ?? null;
  const steps = mission.data?.steps ?? [];
  const doneSteps = steps.filter((s) => s.status === "done" || s.status === "completed").length;

  return (
    <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-[1.62fr_1fr]">
      {/* ── Main column ── */}
      <div className="space-y-5">
        {/* Business Snapshot Bar */}
        <div className="rounded-2xl border border-[--border] bg-[--bg-surface] p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <span className="truncate text-[15px] font-semibold text-[--text-primary]">
                  {org.data?.name || "Your business"}
                </span>
                <span className="rounded-full border border-violet-200 bg-[--accent-light] px-2.5 py-0.5 text-xs font-semibold text-[--accent]">
                  {STAGES[stageIndex]}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[--text-secondary]">
                {belief
                  ? `Nova believes you're building ${belief}${customer ? ` for ${customer}` : ""}.`
                  : "Tell Nova what you're building so it can tailor every mission to you."}
              </p>
            </div>
            <Link
              to="/app/launchpad/nova"
              className="shrink-0 rounded-lg p-1.5 text-[--text-muted] hover:bg-[--bg-surface-2] hover:text-[--accent]"
              aria-label="Update snapshot with Nova"
            >
              <Pencil className="h-4 w-4" />
            </Link>
          </div>
          {/* Stage progress row */}
          <div className="mt-4 flex gap-1.5">
            {STAGES.map((s, i) => (
              <div key={s} className="flex-1">
                <div className={`h-1.5 rounded-full ${i <= stageIndex ? "bg-[--accent]" : "bg-[--bg-surface-2]"}`} />
                <span className={`mt-1 block text-[10px] font-medium ${i === stageIndex ? "text-[--accent]" : "text-[--text-muted]"}`}>
                  {s}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Mission Card */}
        <div className="rounded-2xl border border-[--border] border-l-4 border-l-[--accent] bg-[--bg-surface] p-5 shadow-sm">
          <div className="mb-1 flex items-center gap-2">
            <Target className="h-4 w-4 text-[--accent]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[--text-muted]">Active Mission</span>
          </div>
          {mission.isLoading ? (
            <div className="h-20 animate-pulse rounded-xl bg-[--bg-surface-2]" />
          ) : activeMission ? (
            <>
              <h2 className="text-[18px] font-semibold tracking-[-0.015em] text-[--text-primary]">{activeMission.title}</h2>
              {activeMission.description && (
                <p className="mt-1 text-sm leading-relaxed text-[--text-secondary]">{activeMission.description}</p>
              )}
              {steps.length > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[--bg-surface-2]">
                    <div
                      className="h-full rounded-full bg-[--accent] transition-all duration-700"
                      style={{ width: `${Math.round((doneSteps / steps.length) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-[--text-muted]">
                    {doneSteps}/{steps.length}
                  </span>
                </div>
              )}
              <Link
                to="/app/launchpad/missions"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[--accent] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_2px_8px_var(--accent-glow)] hover:bg-[--accent-hover]"
              >
                Continue Mission <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <div className="py-2">
              <h2 className="text-[18px] font-semibold text-[--text-primary]">Start your first mission</h2>
              <p className="mt-1 text-sm text-[--text-secondary]">Nova will sequence the right moves for your stage.</p>
              <Link
                to="/app/launchpad/nova"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[--accent] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_2px_8px_var(--accent-glow)] hover:bg-[--accent-hover]"
              >
                Ask Nova to begin <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Right rail ── */}
      <div className="space-y-5">
        {/* Nova Guidance */}
        <div className="rounded-2xl border border-[--border] bg-[--bg-command] p-5 text-[--text-inverse] shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#b9a4ff]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#b9a4ff]">Nova Guidance</span>
          </div>
          <p className="text-sm leading-relaxed text-white/90">{guidance.prompt}</p>
          <Link
            to="/app/launchpad/nova"
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
          >
            {guidance.cta} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Pipeline Snapshot */}
        <div className="rounded-2xl border border-[--border] bg-[--bg-surface] p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[--text-muted]">Pipeline</span>
            <Link to="/app/nova/crm" className="text-xs font-semibold text-[--accent] hover:underline">
              View Pipeline →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Active Deals" value={pipeline.active} />
            <Stat label="Pipeline Value" value={pipeline.value ? `$${pipeline.value.toLocaleString()}` : "$0"} />
            <Stat label="Won This Month" value={pipeline.won} />
            <Stat label="Tasks Due" value={tasksDue.data ?? 0} icon={<Clock className="h-3 w-3" />} />
          </div>
        </div>

        {/* Recent Memory */}
        <div className="rounded-2xl border border-[--border] bg-[--bg-surface] p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[--text-muted]">Recent Memory</span>
            <Link to="/app/launchpad/history" className="text-xs font-semibold text-[--accent] hover:underline">
              View all →
            </Link>
          </div>
          {memory.isLoading ? (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-[--bg-surface-2]" />
              ))}
            </div>
          ) : (memory.data ?? []).length === 0 ? (
            <p className="py-3 text-xs text-[--text-muted]">Outputs Nova saves will appear here.</p>
          ) : (
            <div className="space-y-2">
              {(memory.data ?? []).slice(0, 3).map((m) => (
                <div key={(m as { id: string }).id} className="flex items-center gap-2 rounded-lg border border-[--border] bg-[--bg-surface-2] px-3 py-2">
                  <span className="truncate text-sm text-[--text-primary]">
                    {(m as { title?: string }).title || "Saved insight"}
                  </span>
                  <span className="ml-auto shrink-0 rounded-full bg-[--accent-light] px-2 py-0.5 text-[10px] font-semibold text-[--accent]">
                    {(m as { source_label?: string }).source_label || "memory"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[--border] bg-[--bg-surface-2] p-3">
      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[--text-muted]">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-[--text-primary]">{value}</p>
    </div>
  );
}
