import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Search,
  Blocks,
  Brain,
  Zap,
  Users,
  Target,
  LayoutTemplate,
  TrendingUp,
  Lightbulb,
  BookOpen,
  ChevronRight,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────── */
interface GuidanceAction {
  id: string;
  label: string;
  description: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  priority: number;
  condition: (ctx: BusinessContext) => boolean;
}

interface BusinessContext {
  toolRunCount: number;
  leadCount: number;
  activeAutomationCount: number;
  hasCompanyProfile: boolean;
  hasResearch: boolean;
  hasAppliedTemplate: boolean;
  hasBuilderWorkflow: boolean;
  stageIdx: number;
}

/* ─── All possible guidance actions ─────────────────────── */
const ALL_ACTIONS: GuidanceAction[] = [
  {
    id: "add_company_profile",
    label: "Tell Nova about your business",
    description: "Add your company profile so every AI output is personalized to your situation.",
    to: "/app/memory",
    icon: Brain,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    priority: 10,
    condition: (ctx) => !ctx.hasCompanyProfile,
  },
  {
    id: "apply_template",
    label: "Apply a business template",
    description: "Pick the template that matches your business type. It sets up your tools and automations automatically.",
    to: "/app/templates",
    icon: LayoutTemplate,
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    priority: 9,
    condition: (ctx) => !ctx.hasAppliedTemplate,
  },
  {
    id: "run_first_tool",
    label: "Run your first Launchpad tool",
    description: "Validate your idea, build your ICP, or create a GTM strategy — takes under 20 minutes.",
    to: "/app/launchpad",
    icon: Sparkles,
    color: "text-primary",
    bg: "bg-primary/5",
    priority: 8,
    condition: (ctx) => ctx.toolRunCount === 0,
  },
  {
    id: "run_research",
    label: "Research your market",
    description: "Get a full competitive analysis, ICP breakdown, and acquisition strategy for your idea.",
    to: "/app/research",
    icon: Search,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    priority: 7,
    condition: (ctx) => !ctx.hasResearch && ctx.toolRunCount >= 1,
  },
  {
    id: "add_first_lead",
    label: "Add your first lead",
    description: "Start tracking potential customers so you can follow up and close your first deal.",
    to: "/app/nova/crm",
    icon: Users,
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    priority: 6,
    condition: (ctx) => ctx.leadCount === 0 && ctx.toolRunCount >= 2,
  },
  {
    id: "enable_automation",
    label: "Enable your first automation",
    description: "Turn on lead qualification or follow-up sequences so no lead falls through the cracks.",
    to: "/app/automations",
    icon: Zap,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    priority: 5,
    condition: (ctx) => ctx.activeAutomationCount === 0 && ctx.leadCount >= 1,
  },
  {
    id: "build_workflow",
    label: "Build a custom workflow",
    description: "Use the visual builder to create an automation unique to your business process.",
    to: "/app/builder",
    icon: Blocks,
    color: "text-indigo-600",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    priority: 4,
    condition: (ctx) => !ctx.hasBuilderWorkflow && ctx.activeAutomationCount >= 1,
  },
  {
    id: "scale_up",
    label: "Scale your systems",
    description: "You have traction. Now build the infrastructure to grow without adding more work.",
    to: "/app/scale",
    icon: TrendingUp,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    priority: 3,
    condition: (ctx) => ctx.stageIdx >= 3 && ctx.activeAutomationCount >= 2,
  },
  {
    id: "mentor_session",
    label: "Talk to your AI Mentor",
    description: "Get personalized strategy advice from an AI mentor tuned to your business type.",
    to: "/app/mentor",
    icon: Lightbulb,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    priority: 2,
    condition: (ctx) => ctx.toolRunCount >= 5,
  },
  {
    id: "review_playbook",
    label: "Review your playbook",
    description: "See the full step-by-step path for your business stage and check off completed milestones.",
    to: "/app/playbook",
    icon: BookOpen,
    color: "text-muted-foreground",
    bg: "bg-surface-1",
    priority: 1,
    condition: () => true,
  },
];

/* ─── Data fetching ──────────────────────────────────────── */
function useBusinessContext(orgId: string, userId: string): { data: BusinessContext; isLoading: boolean } {
  const toolRunsQ = useQuery({
    queryKey: ["guidance_tool_runs", orgId],
    queryFn: async () => {
      const { count } = await supabase.from("tool_runs").select("*", { count: "exact", head: true }).eq("organization_id", orgId);
      return count ?? 0;
    },
    enabled: !!orgId,
  });

  const leadsQ = useQuery({
    queryKey: ["guidance_leads", orgId],
    queryFn: async () => {
      const { count } = await supabase.from("leads").select("*", { count: "exact", head: true }).eq("organization_id", orgId);
      return count ?? 0;
    },
    enabled: !!orgId,
  });

  const automationsQ = useQuery({
    queryKey: ["guidance_automations", orgId],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count } = await (supabase as any).from("automation_configs").select("*", { count: "exact", head: true }).eq("organization_id", orgId).eq("is_active", true);
      return count ?? 0;
    },
    enabled: !!orgId,
  });

  const memoryQ = useQuery({
    queryKey: ["guidance_memory", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("operator_memory")
        .select("memory_type")
        .eq("user_id", userId)
        .eq("pruned", false)
        .in("memory_type", ["company_profile", "research"]);
      return (data ?? []).map((r) => r.memory_type as string);
    },
    enabled: !!userId,
  });

  const templateQ = useQuery({
    queryKey: ["guidance_templates", orgId],
    queryFn: async () => {
      const { count } = await supabase.from("template_applications").select("*", { count: "exact", head: true }).eq("organization_id", orgId);
      return (count ?? 0) > 0;
    },
    enabled: !!orgId,
  });

  const builderQ = useQuery({
    queryKey: ["guidance_builder", userId],
    queryFn: async () => {
      const { count } = await supabase.from("workflow_builders").select("*", { count: "exact", head: true }).eq("user_id", userId);
      return (count ?? 0) > 0;
    },
    enabled: !!userId,
  });

  const isLoading = toolRunsQ.isLoading || leadsQ.isLoading;

  return {
    data: {
      toolRunCount: toolRunsQ.data ?? 0,
      leadCount: leadsQ.data ?? 0,
      activeAutomationCount: automationsQ.data ?? 0,
      hasCompanyProfile: (memoryQ.data ?? []).includes("company_profile"),
      hasResearch: (memoryQ.data ?? []).includes("research"),
      hasAppliedTemplate: templateQ.data ?? false,
      hasBuilderWorkflow: builderQ.data ?? false,
      stageIdx: 0,
    },
    isLoading,
  };
}

/* ─── Progress bar ───────────────────────────────────────── */
function ContextBar({ ctx }: { ctx: BusinessContext }) {
  const checks = [
    ctx.hasCompanyProfile,
    ctx.hasAppliedTemplate,
    ctx.toolRunCount > 0,
    ctx.leadCount > 0,
    ctx.activeAutomationCount > 0,
  ];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-border/60 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: "var(--primary)" }}
        />
      </div>
      <div className="text-[11px] font-bold text-muted-foreground shrink-0">{score}% set up</div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
export function AdaptiveGuidance({ orgId, userId, stageIdx }: { orgId: string; userId: string; stageIdx: number }) {
  const { data: ctx, isLoading } = useBusinessContext(orgId, userId);
  const contextWithStage = { ...ctx, stageIdx };

  const actions = ALL_ACTIONS
    .filter((a) => a.condition(contextWithStage))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);

  if (isLoading) return null;
  if (actions.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-background overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-[13px] font-bold text-foreground">What to do next</span>
          </div>
          <Link to="/app/playbook" className="flex items-center gap-1 text-[11.5px] text-muted-foreground hover:text-primary transition-colors">
            Full playbook <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <ContextBar ctx={contextWithStage} />
      </div>

      {/* Action list */}
      <div className="divide-y divide-border/60">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.id}
              to={action.to}
              className="group flex items-center gap-4 px-5 py-4 hover:bg-surface-1/50 transition-colors"
            >
              {/* Priority number */}
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-[11px] font-bold text-muted-foreground group-hover:border-primary/30 group-hover:text-primary transition-all">
                {i + 1}
              </div>

              {/* Icon */}
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", action.bg)}>
                <Icon className={cn("h-4.5 w-4.5", action.color)} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">
                  {action.label}
                </div>
                <div className="text-[12px] text-muted-foreground mt-0.5 line-clamp-1">
                  {action.description}
                </div>
              </div>

              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>
          );
        })}
      </div>

      {/* Footer nudge */}
      <div className="px-5 py-3 border-t border-border/60 bg-surface-1/30">
        <div className="text-[11.5px] text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          These suggestions update automatically as you complete steps and add data to your workspace.
        </div>
      </div>
    </div>
  );
}
