import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { templateApplicationsQuery, applyTemplate } from "@/lib/queries";
import {
  TEMPLATES,
  FOUNDER_TEMPLATES,
  OPERATOR_TEMPLATES,
  type AppTemplate,
} from "@/lib/templates-catalog";
import { blockIfGuest } from "@/lib/guest";
import { cn } from "@/lib/utils";
import {
  LayoutTemplate,
  CheckCircle2,
  ArrowRight,
  Rocket,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/app/templates")({ component: TemplatesPage });

const AUDIENCE_FILTERS = [
  { key: "all", label: "All templates" },
  { key: "founder", label: "Founder" },
  { key: "operator", label: "Operator" },
] as const;

type AudienceFilter = (typeof AUDIENCE_FILTERS)[number]["key"];

function TemplatesPage() {
  const { currentOrgId } = useAuth();
  const orgId = currentOrgId ?? "";
  const qc = useQueryClient();

  const appsQ = useQuery({ ...templateApplicationsQuery(orgId), enabled: !!orgId });
  const appliedSlugs = new Set((appsQ.data ?? []).map((a) => a.template_slug));

  const [audience, setAudience] = useState<AudienceFilter>("all");
  const [applying, setApplying] = useState<string | null>(null);

  const visible =
    audience === "all"
      ? TEMPLATES
      : audience === "founder"
        ? FOUNDER_TEMPLATES
        : OPERATOR_TEMPLATES;

  const handleApply = async (t: AppTemplate) => {
    if (blockIfGuest("Sign up to apply a template to your workspace.")) return;
    if (applying) return;
    setApplying(t.slug);
    try {
      await applyTemplate(orgId, t.slug);
      await qc.invalidateQueries({ queryKey: ["template_applications", orgId] });
      toast.success(`"${t.name}" template applied`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't apply template");
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(167,139,250,0.08) 0%, rgba(125,211,252,0.04) 100%)",
          border: "1px solid rgba(167,139,250,0.18)",
        }}
      >
        <div
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)" }}
        />
        <div className="relative">
          <div
            className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-widest mb-1"
            style={{ color: "rgba(167,139,250,0.7)" }}
          >
            <LayoutTemplate className="h-3 w-3" />
            Template Library
          </div>
          <h1
            className="font-display text-[22px] font-bold leading-tight"
            style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}
          >
            Start from a proven playbook
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--muted-foreground)" }}>
            Select the template that matches your business type. It pre-selects the right tools,
            automations, and priorities for your stage.
          </p>
        </div>
      </div>

      {/* Audience filter */}
      <div className="flex gap-2">
        {AUDIENCE_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setAudience(f.key)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition",
              audience === f.key
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((t) => {
          const isApplied = appliedSlugs.has(t.slug);
          const isApplying = applying === t.slug;
          return (
            <div
              key={t.slug}
              className="nova-card rounded-xl p-5 flex flex-col gap-3"
              style={{
                borderColor: isApplied ? "rgba(52,211,153,0.3)" : undefined,
                background: isApplied
                  ? "color-mix(in oklab, rgba(52,211,153,0.04), var(--card))"
                  : undefined,
              }}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-[24px] leading-none">{t.emoji}</span>
                  <div>
                    <div className="font-display text-[15px] font-semibold leading-tight">
                      {t.name}
                    </div>
                    <span
                      className="inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider mt-0.5"
                      style={{
                        background:
                          t.audience === "founder"
                            ? "rgba(249,115,22,0.12)"
                            : "rgba(125,211,252,0.12)",
                        color: t.audience === "founder" ? "var(--primary)" : "#7DD3FC",
                      }}
                    >
                      {t.audience}
                    </span>
                  </div>
                </div>
                {isApplied && (
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0 mt-0.5" style={{ color: "#34D399" }} />
                )}
              </div>

              {/* Description */}
              <p className="text-[12.5px] leading-relaxed text-muted-foreground flex-1">
                {t.description}
              </p>

              {/* Recommended tools count */}
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Rocket className="h-3 w-3" />
                  {t.recommendedTools.length} tools
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {t.recommendedAutomations.length} automations
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {t.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border px-1.5 py-0.5 text-[10px] font-medium"
                    style={{
                      borderColor: "rgba(var(--border-rgb,0,0,0), 0.5)",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <div className="flex items-center gap-2 pt-1">
                {isApplied ? (
                  <div className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: "#34D399" }}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Applied
                  </div>
                ) : (
                  <button
                    onClick={() => void handleApply(t)}
                    disabled={!!applying}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition disabled:opacity-50"
                    style={{
                      background: "rgba(167,139,250,0.1)",
                      color: "#A78BFA",
                      border: "1px solid rgba(167,139,250,0.2)",
                    }}
                  >
                    {isApplying ? "Applying…" : "Apply template"}
                  </button>
                )}
                <Link
                  to={t.audience === "founder" ? "/app/launchpad" : "/app/automations"}
                  className="flex items-center gap-1 text-[11.5px] text-muted-foreground hover:text-foreground transition ml-auto"
                >
                  {t.audience === "founder" ? "Launchpad" : "Automations"}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
