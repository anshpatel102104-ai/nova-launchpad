import { Check, Copy, Download, Save, ThumbsDown, ThumbsUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Json = unknown;
type Out = Record<string, Json> | null;

export function OutputHeader({
  label = "Output",
  onCopy,
  onSave,
  onDownload,
  onFeedback,
  feedback,
}: {
  label?: string;
  onCopy?: () => void;
  onSave?: () => void;
  onDownload?: () => void;
  onFeedback?: (v: "up" | "down") => void;
  feedback?: "up" | "down" | null;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div
        className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: "var(--muted-foreground)" }}
      >
        <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--primary)" }} />
        {label}
      </div>
      <div className="flex items-center gap-1">
        {onFeedback && (
          <div
            className="mr-1 flex items-center gap-0.5 rounded-lg p-0.5"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            <button
              onClick={() => onFeedback("up")}
              className="flex h-6 w-6 items-center justify-center rounded-md transition"
              style={
                feedback === "up"
                  ? {
                      background: "color-mix(in oklab, var(--success) 15%, transparent)",
                      color: "var(--success)",
                    }
                  : { color: "var(--muted-foreground)" }
              }
              title="Helpful"
            >
              <ThumbsUp className="h-3 w-3" />
            </button>
            <button
              onClick={() => onFeedback("down")}
              className="flex h-6 w-6 items-center justify-center rounded-md transition"
              style={
                feedback === "down"
                  ? {
                      background: "color-mix(in oklab, var(--destructive) 15%, transparent)",
                      color: "var(--destructive)",
                    }
                  : { color: "var(--muted-foreground)" }
              }
              title="Needs work"
            >
              <ThumbsDown className="h-3 w-3" />
            </button>
          </div>
        )}
        {onCopy && <IconBtn onClick={onCopy} icon={Copy} label="Copy" />}
        {onDownload && <IconBtn onClick={onDownload} icon={Download} label="Export" />}
        {onSave && (
          <button
            onClick={onSave}
            className="flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[11.5px] font-medium transition"
            style={{
              background: "color-mix(in oklab, var(--primary) 10%, transparent)",
              border: "1px solid color-mix(in oklab, var(--primary) 25%, transparent)",
              color: "var(--primary)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "color-mix(in oklab, var(--primary) 16%, transparent)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "color-mix(in oklab, var(--primary) 10%, transparent)";
            }}
          >
            <Save className="h-3 w-3" /> Save
          </button>
        )}
      </div>
    </div>
  );
}

function IconBtn({
  onClick,
  icon: Icon,
  label,
}: {
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-7 items-center gap-1.5 rounded-lg px-2 text-[11.5px] font-medium transition"
      style={{ color: "var(--muted-foreground)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
        (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
        (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
      }}
      title={label}
    >
      <Icon className="h-3 w-3" /> {label}
    </button>
  );
}

export function copyText(text: string) {
  void navigator.clipboard.writeText(text).then(
    () => toast.success("Copied to clipboard"),
    () => toast.error("Copy failed"),
  );
}

/* ────────── Block primitives ────────── */

const ACCENT_STYLES: Record<string, { borderColor: string; bg: string; titleColor: string }> = {
  primary: {
    borderColor: "var(--primary)",
    bg: "color-mix(in oklab, var(--primary) 5%, var(--surface-2))",
    titleColor: "var(--primary)",
  },
  accent: {
    borderColor: "var(--accent)",
    bg: "color-mix(in oklab, var(--accent) 5%, var(--surface-2))",
    titleColor: "var(--accent)",
  },
  warning: {
    borderColor: "var(--warning)",
    bg: "color-mix(in oklab, var(--warning) 5%, var(--surface-2))",
    titleColor: "var(--warning)",
  },
  destructive: {
    borderColor: "var(--destructive)",
    bg: "color-mix(in oklab, var(--destructive) 5%, var(--surface-2))",
    titleColor: "var(--destructive)",
  },
  success: {
    borderColor: "var(--success)",
    bg: "color-mix(in oklab, var(--success) 5%, var(--surface-2))",
    titleColor: "var(--success)",
  },
};

export function Block({
  title,
  children,
  className,
  accent,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  accent?: "primary" | "accent" | "warning" | "destructive" | "success";
}) {
  const styles = accent ? ACCENT_STYLES[accent] : null;
  return (
    <section
      className={cn("overflow-hidden rounded-xl", className)}
      style={{
        background: styles ? styles.bg : "var(--surface-2)",
        border: `1px solid ${styles ? `color-mix(in oklab, ${styles.borderColor} 25%, transparent)` : "color-mix(in oklab, var(--border) 70%, transparent)"}`,
        borderLeft: styles ? `3px solid ${styles.borderColor}` : undefined,
      }}
    >
      <div className="p-4">
        {title && (
          <div
            className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: styles ? styles.titleColor : "var(--muted-foreground)" }}
          >
            {title}
          </div>
        )}
        <div
          className="text-[13.5px] leading-relaxed"
          style={{ color: "color-mix(in oklab, var(--foreground) 90%, transparent)" }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}

export function ScoreGauge({
  value,
  max = 100,
  label,
}: {
  value: number;
  max?: number;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color =
    pct >= 75
      ? "var(--success)"
      : pct >= 50
        ? "var(--primary)"
        : pct >= 25
          ? "var(--warning)"
          : "var(--destructive)";
  return (
    <div
      className="flex items-center gap-4 overflow-hidden rounded-xl p-4"
      style={{
        background: `color-mix(in oklab, ${color} 6%, var(--surface-2))`,
        border: `1px solid color-mix(in oklab, ${color} 20%, transparent)`,
      }}
    >
      <div
        className="font-display text-[2.6rem] font-semibold leading-none tabular-nums"
        style={{ color }}
      >
        {Math.round(value)}
        <span className="ml-0.5 text-sm font-normal" style={{ color: "var(--muted-foreground)" }}>
          /{max}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        {label && (
          <div className="text-[12.5px] font-medium" style={{ color: "var(--foreground)" }}>
            {label}
          </div>
        )}
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full"
          style={{ background: "var(--surface-offset)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}` }}
          />
        </div>
      </div>
    </div>
  );
}

export function BulletList({
  items,
  accent,
}: {
  items: unknown[];
  accent?: "success" | "destructive" | "warning" | "primary";
}) {
  const dotColor =
    accent === "success"
      ? "var(--success)"
      : accent === "destructive"
        ? "var(--destructive)"
        : accent === "warning"
          ? "var(--warning)"
          : accent === "primary"
            ? "var(--primary)"
            : "var(--muted-foreground)";

  return (
    <ul className="space-y-2 text-[13.5px] leading-relaxed">
      {items.filter(Boolean).map((it, i) => (
        <li key={i} className="flex gap-2.5">
          <span
            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: dotColor, flexShrink: 0, marginTop: "0.4rem" }}
          />
          <span style={{ color: "color-mix(in oklab, var(--foreground) 90%, transparent)" }}>
            {typeof it === "string" ? it : JSON.stringify(it)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ────────── Per-tool intelligent renderers ────────── */
export function OutputBody({ toolKey, output }: { toolKey: string; output: Out }) {
  if (!output) return null;
  const o = output as Record<string, unknown>;

  switch (toolKey) {
    case "validate-idea":
      return <ValidatorOut o={o} />;
    case "generate-pitch":
      return <PitchOut o={o} />;
    case "generate-gtm-strategy":
      return <GtmOut o={o} />;
    case "generate-offer":
      return <OfferOut o={o} />;
    case "generate-ops-plan":
      return <OpsOut o={o} />;
    case "generate-followup-sequence":
      return <FollowupOut o={o} />;
    case "analyze-website":
      return <WebsiteOut o={o} />;
    case "kill-my-idea":
      return <KillMyIdeaOut o={o} />;
    case "funding-score":
      return <FundingScoreOut o={o} />;
    case "first-10-customers":
      return <FirstTenOut o={o} />;
    case "business-plan":
      return <BusinessPlanOut o={o} />;
    case "investor-emails":
      return <InvestorEmailsOut o={o} />;
    case "idea-vs-idea":
      return <IdeaVsIdeaOut o={o} />;
    case "landing-page":
      return <LandingPageOut o={o} />;
    case "competitor-analysis":
      return <CompetitorOut o={o} />;
    case "pricing-strategy":
      return <PricingOut o={o} />;
    case "revenue-projector":
      return <RevenueOut o={o} />;
    default:
      return <GenericOut o={o} />;
  }
}

const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown): string =>
  typeof v === "string" ? v : v == null ? "" : JSON.stringify(v);
const num = (v: unknown, fallback = 0): number => (typeof v === "number" ? v : fallback);

function ValidatorOut({ o }: { o: Record<string, unknown> }) {
  const score = num(o.score ?? o.viability_score ?? o.overall_score, 0);
  const verdict = str(o.verdict ?? o.recommendation);
  const summary = str(o.summary);
  const strengths = arr(o.strengths);
  const weaknesses = arr(o.weaknesses);
  const risks = arr(o.risks);
  const next = arr(o.next_steps ?? o.recommendations);
  return (
    <div className="space-y-3">
      {(score > 0 || verdict) && <ScoreGauge value={score} label={verdict || "Viability score"} />}
      {summary && <Block title="Summary">{summary}</Block>}
      {strengths.length > 0 && (
        <Block title="Strengths" accent="success">
          <BulletList items={strengths} accent="success" />
        </Block>
      )}
      {weaknesses.length > 0 && (
        <Block title="Weaknesses" accent="warning">
          <BulletList items={weaknesses} accent="warning" />
        </Block>
      )}
      {risks.length > 0 && (
        <Block title="Key risks" accent="destructive">
          <BulletList items={risks} accent="destructive" />
        </Block>
      )}
      {next.length > 0 && (
        <Block title="Recommended next steps" accent="primary">
          <BulletList items={next} accent="primary" />
        </Block>
      )}
    </div>
  );
}

function PitchOut({ o }: { o: Record<string, unknown> }) {
  const headline = str(o.headline);
  const problem = str(o.problem);
  const solution = str(o.offer ?? o.solution);
  const outcome = str(o.outcome);
  const cta = str(o.cta);
  return (
    <div className="space-y-3">
      {headline && (
        <div
          className="overflow-hidden rounded-xl p-5"
          style={{
            background: "color-mix(in oklab, var(--primary) 7%, var(--surface-2))",
            border: "1px solid color-mix(in oklab, var(--primary) 25%, transparent)",
            borderLeft: "3px solid var(--primary)",
          }}
        >
          <div
            className="text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--primary)" }}
          >
            Headline
          </div>
          <div
            className="mt-2 font-display text-[1.35rem] font-semibold leading-tight tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            {headline}
          </div>
        </div>
      )}
      {problem && <Block title="Problem">{problem}</Block>}
      {solution && (
        <Block title="Solution" accent="primary">
          {solution}
        </Block>
      )}
      {outcome && (
        <Block title="Outcome" accent="success">
          {outcome}
        </Block>
      )}
      {cta && (
        <div
          className="rounded-xl p-4"
          style={{
            background: "color-mix(in oklab, var(--accent) 7%, var(--surface-2))",
            border: "1px solid color-mix(in oklab, var(--accent) 25%, transparent)",
            borderLeft: "3px solid var(--accent)",
          }}
        >
          <div
            className="text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--accent)" }}
          >
            Call to action
          </div>
          <div className="mt-1.5 text-[14px] font-semibold" style={{ color: "var(--foreground)" }}>
            {cta}
          </div>
        </div>
      )}
    </div>
  );
}

function GtmOut({ o }: { o: Record<string, unknown> }) {
  const icp = str(o.icp);
  const positioning = str(o.positioning);
  const channels = arr(o.channels);
  const phases = arr(o.phases ?? o.timeline);
  const priorities = arr(o.priorities);
  return (
    <div className="space-y-3">
      {icp && (
        <Block title="Ideal customer profile" accent="primary">
          {icp}
        </Block>
      )}
      {positioning && <Block title="Positioning">{positioning}</Block>}
      {channels.length > 0 && (
        <Block title="Channels">
          <BulletList items={channels} accent="primary" />
        </Block>
      )}
      {phases.length > 0 && (
        <div
          className="overflow-hidden rounded-xl"
          style={{
            background: "var(--surface-2)",
            border: "1px solid color-mix(in oklab, var(--border) 70%, transparent)",
          }}
        >
          <div
            className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{
              borderBottom: "1px solid color-mix(in oklab, var(--border) 50%, transparent)",
              color: "var(--muted-foreground)",
            }}
          >
            Launch phases
          </div>
          <ol
            className="space-y-0 divide-y"
            style={{ borderColor: "color-mix(in oklab, var(--border) 50%, transparent)" }}
          >
            {phases.map((p, i) => {
              const item =
                typeof p === "object" && p ? (p as Record<string, unknown>) : { name: String(p) };
              const name = str(item.name ?? item.title ?? `Phase ${i + 1}`);
              const description = str(item.description);
              return (
                <li key={i} className="flex gap-3 px-4 py-3">
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1 text-[13.5px]">
                    <div className="font-semibold" style={{ color: "var(--foreground)" }}>
                      {name}
                    </div>
                    {description && (
                      <div
                        className="mt-0.5 text-[13px]"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {description}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
      {priorities.length > 0 && (
        <Block title="Priorities" accent="warning">
          <BulletList items={priorities} accent="warning" />
        </Block>
      )}
    </div>
  );
}

function OfferOut({ o }: { o: Record<string, unknown> }) {
  const name = str(o.name);
  const promise = str(o.promise);
  const deliverables = arr(o.deliverables);
  const priceAnchor = str(o.price_anchor);
  const guarantee = str(o.guarantee);
  return (
    <div className="space-y-3">
      {name && (
        <div
          className="rounded-xl p-5"
          style={{
            background: "color-mix(in oklab, var(--primary) 7%, var(--surface-2))",
            border: "1px solid color-mix(in oklab, var(--primary) 25%, transparent)",
            borderLeft: "3px solid var(--primary)",
          }}
        >
          <div
            className="text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--primary)" }}
          >
            Offer
          </div>
          <div
            className="mt-2 font-display text-[1.35rem] font-semibold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            {name}
          </div>
          {promise && (
            <div className="mt-1.5 text-[13.5px]" style={{ color: "var(--muted-foreground)" }}>
              {promise}
            </div>
          )}
        </div>
      )}
      {deliverables.length > 0 && (
        <Block title="Deliverables" accent="primary">
          <BulletList items={deliverables} accent="primary" />
        </Block>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {priceAnchor && <Block title="Price anchor">{priceAnchor}</Block>}
        {guarantee && (
          <Block title="Guarantee" accent="success">
            {guarantee}
          </Block>
        )}
      </div>
    </div>
  );
}

function OpsOut({ o }: { o: Record<string, unknown> }) {
  const workflows = arr(o.workflows);
  const automations = arr(o.automations);
  const kpis = arr(o.kpis);
  return (
    <div className="space-y-3">
      {workflows.length > 0 && (
        <Block title="Workflows">
          <BulletList items={workflows} accent="primary" />
        </Block>
      )}
      {automations.length > 0 && (
        <Block title="Automations" accent="accent">
          <BulletList items={automations} accent="primary" />
        </Block>
      )}
      {kpis.length > 0 && (
        <Block title="Key metrics" accent="success">
          <BulletList items={kpis} accent="success" />
        </Block>
      )}
    </div>
  );
}

function FollowupOut({ o }: { o: Record<string, unknown> }) {
  const seq = arr(o.sequence ?? o.emails ?? o.steps);
  if (!seq.length) return <GenericOut o={o} />;
  return (
    <div className="space-y-3">
      {seq.map((s, i) => {
        const item =
          typeof s === "object" && s ? (s as Record<string, unknown>) : { body: String(s) };
        const day = str(item.day);
        const delay = str(item.delay);
        const channel = str(item.channel);
        const subject = str(item.subject);
        const body = str(item.body ?? item.message ?? item.content);
        return (
          <div
            key={i}
            className="overflow-hidden rounded-xl"
            style={{
              background: "var(--surface-2)",
              border: "1px solid color-mix(in oklab, var(--border) 70%, transparent)",
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{
                borderBottom: "1px solid color-mix(in oklab, var(--border) 50%, transparent)",
                background: "color-mix(in oklab, var(--surface-offset) 60%, transparent)",
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
                >
                  {i + 1}
                </span>
                <span
                  className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Step {i + 1}
                  {day ? ` · Day ${day}` : delay ? ` · ${delay}` : ""}
                </span>
              </div>
              {channel && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--muted-foreground)",
                  }}
                >
                  {channel}
                </span>
              )}
            </div>
            <div className="px-4 py-3">
              {subject && (
                <div
                  className="mb-2 text-[13.5px] font-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  {subject}
                </div>
              )}
              <div
                className="whitespace-pre-wrap text-[13px] leading-relaxed"
                style={{ color: "color-mix(in oklab, var(--foreground) 85%, transparent)" }}
              >
                {body}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WebsiteOut({ o }: { o: Record<string, unknown> }) {
  const issues = arr(o.issues);
  const opportunities = arr(o.opportunities);
  const suggested = arr(o.suggested_changes);
  const seo = str(o.seo_notes);
  const ux = str(o.ux_notes);
  return (
    <div className="space-y-3">
      {issues.length > 0 && (
        <Block title="Issues" accent="destructive">
          <BulletList items={issues} accent="destructive" />
        </Block>
      )}
      {opportunities.length > 0 && (
        <Block title="Opportunities" accent="primary">
          <BulletList items={opportunities} accent="primary" />
        </Block>
      )}
      {suggested.length > 0 && (
        <Block title="Suggested changes" accent="success">
          <BulletList items={suggested} accent="success" />
        </Block>
      )}
      {seo && <Block title="SEO notes">{seo}</Block>}
      {ux && <Block title="UX notes">{ux}</Block>}
    </div>
  );
}

function KillMyIdeaOut({ o }: { o: Record<string, unknown> }) {
  const score = num(o.survival_score, 0);
  const verdict = str(o.verdict);
  const killShot = str(o.the_kill_shot);
  const fatalFlaws = arr(o.fatal_flaws);
  const marketRisks = arr(o.market_risks);
  const executionRisks = arr(o.execution_risks);
  const assumptions = arr(o.dangerous_assumptions);
  const ifYouProceed = arr(o.if_you_proceed);

  const pct = Math.max(0, Math.min(100, score));
  const color = pct >= 65 ? "var(--warning)" : "var(--destructive)";

  return (
    <div className="space-y-3">
      {/* Survival score */}
      <div
        className="flex items-center gap-4 overflow-hidden rounded-xl p-4"
        style={{
          background: `color-mix(in oklab, ${color} 7%, var(--surface-2))`,
          border: `1px solid color-mix(in oklab, ${color} 25%, transparent)`,
        }}
      >
        <div
          className="font-display text-[2.6rem] font-semibold leading-none tabular-nums"
          style={{ color }}
        >
          {Math.round(score)}
          <span className="ml-0.5 text-sm font-normal" style={{ color: "var(--muted-foreground)" }}>
            /100
          </span>
        </div>
        <div className="min-w-0 flex-1">
          {verdict && (
            <div className="text-[12.5px] font-medium" style={{ color: "var(--foreground)" }}>
              {verdict}
            </div>
          )}
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full"
            style={{ background: "var(--surface-offset)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}` }}
            />
          </div>
          <div className="mt-1 text-[10.5px]" style={{ color: "var(--muted-foreground)" }}>
            Survival score — lower = higher failure risk
          </div>
        </div>
      </div>

      {/* Kill shot */}
      {killShot && (
        <div
          className="overflow-hidden rounded-xl"
          style={{
            background: "color-mix(in oklab, var(--destructive) 7%, var(--surface-2))",
            border: "1px solid color-mix(in oklab, var(--destructive) 25%, transparent)",
            borderLeft: "3px solid var(--destructive)",
          }}
        >
          <div className="p-4">
            <div
              className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "var(--destructive)" }}
            >
              The kill shot
            </div>
            <div
              className="text-[13.5px] leading-relaxed"
              style={{ color: "color-mix(in oklab, var(--foreground) 90%, transparent)" }}
            >
              {killShot}
            </div>
          </div>
        </div>
      )}

      {fatalFlaws.length > 0 && (
        <Block title="Fatal flaws" accent="destructive">
          <BulletList items={fatalFlaws} accent="destructive" />
        </Block>
      )}
      {marketRisks.length > 0 && (
        <Block title="Market risks" accent="warning">
          <BulletList items={marketRisks} accent="warning" />
        </Block>
      )}
      {executionRisks.length > 0 && (
        <Block title="Execution risks" accent="warning">
          <BulletList items={executionRisks} accent="warning" />
        </Block>
      )}

      {assumptions.length > 0 && (
        <div
          className="overflow-hidden rounded-xl"
          style={{
            background: "var(--surface-2)",
            border: "1px solid color-mix(in oklab, var(--border) 70%, transparent)",
          }}
        >
          <div
            className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{
              borderBottom: "1px solid color-mix(in oklab, var(--border) 50%, transparent)",
              color: "var(--muted-foreground)",
            }}
          >
            Dangerous assumptions
          </div>
          <div
            className="space-y-0 divide-y px-4"
            style={{ borderColor: "color-mix(in oklab, var(--border) 50%, transparent)" }}
          >
            {assumptions.map((a, i) => {
              const item = typeof a === "object" && a ? (a as Record<string, unknown>) : {};
              return (
                <div key={i} className="grid gap-3 py-3 sm:grid-cols-2">
                  <div>
                    <div
                      className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em]"
                      style={{ color: "var(--warning)" }}
                    >
                      You assume
                    </div>
                    <div
                      className="text-[12.5px]"
                      style={{ color: "color-mix(in oklab, var(--foreground) 90%, transparent)" }}
                    >
                      {str(item.assumption)}
                    </div>
                  </div>
                  <div>
                    <div
                      className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em]"
                      style={{ color: "var(--destructive)" }}
                    >
                      Reality
                    </div>
                    <div
                      className="text-[12.5px]"
                      style={{ color: "color-mix(in oklab, var(--foreground) 90%, transparent)" }}
                    >
                      {str(item.reality)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {ifYouProceed.length > 0 && (
        <Block title="If you proceed — fix these first" accent="primary">
          <BulletList items={ifYouProceed} accent="primary" />
        </Block>
      )}
    </div>
  );
}

function FundingScoreOut({ o }: { o: Record<string, unknown> }) {
  const score = num(o.score ?? o.funding_score ?? o.overall_score, 0);
  const verdict = str(o.verdict ?? o.summary);
  const breakdown = arr(o.breakdown ?? o.criteria);
  const strengths = arr(o.investor_strengths ?? o.strengths);
  const weaknesses = arr(o.investor_concerns ?? o.weaknesses);
  const recommendations = arr(o.recommendations ?? o.next_steps);
  return (
    <div className="space-y-3">
      <ScoreGauge value={score} label={verdict || "Fundability score"} />
      {breakdown.length > 0 && (
        <div
          className="overflow-hidden rounded-xl"
          style={{
            background: "var(--surface-2)",
            border: "1px solid color-mix(in oklab, var(--border) 70%, transparent)",
          }}
        >
          <div
            className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{
              borderBottom: "1px solid color-mix(in oklab, var(--border) 50%, transparent)",
              color: "var(--muted-foreground)",
            }}
          >
            Criteria breakdown
          </div>
          <div
            className="divide-y"
            style={{ borderColor: "color-mix(in oklab, var(--border) 50%, transparent)" }}
          >
            {breakdown.map((b, i) => {
              const item =
                typeof b === "object" && b
                  ? (b as Record<string, unknown>)
                  : { criterion: String(b) };
              const criterion = str(item.criterion ?? item.name ?? item.category);
              const sc = num(item.score, 0);
              const note = str(item.notes ?? item.rationale ?? item.note);
              const pct = Math.min(100, (sc / 10) * 100);
              const color =
                pct >= 70 ? "var(--success)" : pct >= 40 ? "var(--primary)" : "var(--warning)";
              return (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className="text-[12.5px] font-medium"
                      style={{ color: "var(--foreground)" }}
                    >
                      {criterion}
                    </span>
                    <span className="font-mono text-[12px] font-semibold" style={{ color }}>
                      {sc}/10
                    </span>
                  </div>
                  <div
                    className="h-1 overflow-hidden rounded-full mb-1.5"
                    style={{ background: "var(--surface-offset)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}` }}
                    />
                  </div>
                  {note && (
                    <div className="text-[11.5px]" style={{ color: "var(--muted-foreground)" }}>
                      {note}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {strengths.length > 0 && (
        <Block title="Investor strengths" accent="success">
          <BulletList items={strengths} accent="success" />
        </Block>
      )}
      {weaknesses.length > 0 && (
        <Block title="Investor concerns" accent="warning">
          <BulletList items={weaknesses} accent="warning" />
        </Block>
      )}
      {recommendations.length > 0 && (
        <Block title="To improve your score" accent="primary">
          <BulletList items={recommendations} accent="primary" />
        </Block>
      )}
    </div>
  );
}

function FirstTenOut({ o }: { o: Record<string, unknown> }) {
  const strategy = str(o.strategy ?? o.overview);
  const channels = arr(o.channels ?? o.acquisition_channels);
  const scripts = arr(o.outreach_scripts ?? o.scripts);
  const weekByWeek = arr(o.week_by_week ?? o.plan ?? o.timeline);
  const templates = arr(o.templates ?? o.outreach_templates);
  return (
    <div className="space-y-3">
      {strategy && (
        <Block title="Strategy" accent="primary">
          {strategy}
        </Block>
      )}
      {channels.length > 0 && (
        <Block title="Acquisition channels">
          <BulletList items={channels} accent="primary" />
        </Block>
      )}
      {weekByWeek.length > 0 && (
        <div
          className="overflow-hidden rounded-xl"
          style={{
            background: "var(--surface-2)",
            border: "1px solid color-mix(in oklab, var(--border) 70%, transparent)",
          }}
        >
          <div
            className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{
              borderBottom: "1px solid color-mix(in oklab, var(--border) 50%, transparent)",
              color: "var(--muted-foreground)",
            }}
          >
            Week-by-week plan
          </div>
          <ol
            className="divide-y"
            style={{ borderColor: "color-mix(in oklab, var(--border) 50%, transparent)" }}
          >
            {weekByWeek.map((w, i) => {
              const item =
                typeof w === "object" && w
                  ? (w as Record<string, unknown>)
                  : { actions: String(w) };
              const week = str(item.week ?? `Week ${i + 1}`);
              const focus = str(item.focus ?? item.goal ?? item.theme);
              const actions = arr(item.actions ?? item.tasks);
              return (
                <li key={i} className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="flex h-5 w-10 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{
                        background: "linear-gradient(135deg, var(--primary), var(--accent))",
                      }}
                    >
                      {week}
                    </span>
                    {focus && (
                      <span
                        className="text-[12.5px] font-semibold"
                        style={{ color: "var(--foreground)" }}
                      >
                        {focus}
                      </span>
                    )}
                  </div>
                  {actions.length > 0 && <BulletList items={actions} accent="primary" />}
                  {actions.length === 0 && !focus && (
                    <div className="text-[12.5px]" style={{ color: "var(--muted-foreground)" }}>
                      {str(w)}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}
      {scripts.length > 0 && (
        <div className="space-y-2">
          {scripts.map((s, i) => {
            const item =
              typeof s === "object" && s ? (s as Record<string, unknown>) : { script: String(s) };
            const channel = str(item.channel ?? item.type);
            const script = str(item.script ?? item.message ?? item.body);
            return (
              <div
                key={i}
                className="overflow-hidden rounded-xl"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid color-mix(in oklab, var(--border) 70%, transparent)",
                }}
              >
                {channel && (
                  <div
                    className="px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em]"
                    style={{
                      borderBottom: "1px solid color-mix(in oklab, var(--border) 50%, transparent)",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    {channel} script
                  </div>
                )}
                <div
                  className="px-4 py-3 whitespace-pre-wrap text-[12.5px] leading-relaxed"
                  style={{ color: "color-mix(in oklab, var(--foreground) 85%, transparent)" }}
                >
                  {script}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {templates.length > 0 && (
        <Block title="Outreach templates">
          <BulletList items={templates} accent="success" />
        </Block>
      )}
    </div>
  );
}

function BusinessPlanOut({ o }: { o: Record<string, unknown> }) {
  const exec = str(o.executive_summary ?? o.summary);
  const market = str(o.market_analysis ?? o.market);
  const competitive = str(o.competitive_landscape ?? o.competition);
  const revenue = str(o.revenue_model ?? o.business_model);
  const gtm = str(o.go_to_market ?? o.gtm);
  const ops = str(o.operations ?? o.operational_plan);
  const financials = str(o.financial_projections ?? o.financials);
  const risks = arr(o.risks ?? o.key_risks);
  return (
    <div className="space-y-3">
      {exec && (
        <div
          className="rounded-xl p-5"
          style={{
            background: "color-mix(in oklab, var(--primary) 7%, var(--surface-2))",
            border: "1px solid color-mix(in oklab, var(--primary) 25%, transparent)",
            borderLeft: "3px solid var(--primary)",
          }}
        >
          <div
            className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-2"
            style={{ color: "var(--primary)" }}
          >
            Executive summary
          </div>
          <div
            className="text-[13.5px] leading-relaxed"
            style={{ color: "color-mix(in oklab, var(--foreground) 90%, transparent)" }}
          >
            {exec}
          </div>
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {market && <Block title="Market analysis">{market}</Block>}
        {competitive && <Block title="Competitive landscape">{competitive}</Block>}
        {revenue && (
          <Block title="Revenue model" accent="success">
            {revenue}
          </Block>
        )}
        {gtm && (
          <Block title="Go-to-market" accent="primary">
            {gtm}
          </Block>
        )}
        {ops && <Block title="Operations">{ops}</Block>}
        {financials && (
          <Block title="Financial projections" accent="accent">
            {financials}
          </Block>
        )}
      </div>
      {risks.length > 0 && (
        <Block title="Key risks" accent="destructive">
          <BulletList items={risks} accent="destructive" />
        </Block>
      )}
    </div>
  );
}

function InvestorEmailsOut({ o }: { o: Record<string, unknown> }) {
  const emails = arr(o.emails ?? o.sequence ?? o.outreach_emails);
  const strategy = str(o.strategy ?? o.approach);
  if (!emails.length) return <GenericOut o={o} />;
  return (
    <div className="space-y-3">
      {strategy && (
        <Block title="Outreach strategy" accent="primary">
          {strategy}
        </Block>
      )}
      {emails.map((e, i) => {
        const item =
          typeof e === "object" && e ? (e as Record<string, unknown>) : { body: String(e) };
        const subject = str(item.subject ?? item.title);
        const body = str(item.body ?? item.content ?? item.message);
        const timing = str(item.timing ?? item.send_at ?? item.when);
        const investor_type = str(item.investor_type ?? item.type);
        return (
          <div
            key={i}
            className="overflow-hidden rounded-xl"
            style={{
              background: "var(--surface-2)",
              border: "1px solid color-mix(in oklab, var(--border) 70%, transparent)",
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{
                borderBottom: "1px solid color-mix(in oklab, var(--border) 50%, transparent)",
                background: "color-mix(in oklab, var(--accent) 5%, transparent)",
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: "linear-gradient(135deg, var(--accent), var(--primary))" }}
                >
                  {i + 1}
                </span>
                {subject && (
                  <span
                    className="text-[12.5px] font-semibold"
                    style={{ color: "var(--foreground)" }}
                  >
                    {subject}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {investor_type && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px]"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    {investor_type}
                  </span>
                )}
                {timing && (
                  <span className="text-[10.5px]" style={{ color: "var(--muted-foreground)" }}>
                    {timing}
                  </span>
                )}
              </div>
            </div>
            <div
              className="px-4 py-3 whitespace-pre-wrap text-[13px] leading-relaxed"
              style={{ color: "color-mix(in oklab, var(--foreground) 85%, transparent)" }}
            >
              {body}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function IdeaVsIdeaOut({ o }: { o: Record<string, unknown> }) {
  const winner = str(o.winner ?? o.recommended_idea);
  const rationale = str(o.winner_rationale ?? o.rationale ?? o.recommendation);
  const comparison = arr(o.comparison ?? o.criteria);
  const ideaA = str(o.idea_a_summary ?? o.idea_a);
  const ideaB = str(o.idea_b_summary ?? o.idea_b);
  return (
    <div className="space-y-3">
      {winner && (
        <div
          className="rounded-xl p-5"
          style={{
            background: "color-mix(in oklab, var(--success) 8%, var(--surface-2))",
            border: "1px solid color-mix(in oklab, var(--success) 30%, transparent)",
            borderLeft: "3px solid var(--success)",
          }}
        >
          <div
            className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-1.5"
            style={{ color: "var(--success)" }}
          >
            Winner
          </div>
          <div
            className="font-display text-[1.2rem] font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            {winner}
          </div>
          {rationale && (
            <div
              className="mt-2 text-[13px] leading-relaxed"
              style={{ color: "var(--muted-foreground)" }}
            >
              {rationale}
            </div>
          )}
        </div>
      )}
      {comparison.length > 0 && (
        <div
          className="overflow-hidden rounded-xl"
          style={{
            background: "var(--surface-2)",
            border: "1px solid color-mix(in oklab, var(--border) 70%, transparent)",
          }}
        >
          <div
            className="grid grid-cols-3 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{
              borderBottom: "1px solid color-mix(in oklab, var(--border) 50%, transparent)",
              color: "var(--muted-foreground)",
            }}
          >
            <span>Criterion</span>
            <span className="text-center" style={{ color: "var(--primary)" }}>
              {ideaA ? "Idea A" : "Option A"}
            </span>
            <span className="text-center" style={{ color: "var(--accent)" }}>
              {ideaB ? "Idea B" : "Option B"}
            </span>
          </div>
          <div
            className="divide-y"
            style={{ borderColor: "color-mix(in oklab, var(--border) 50%, transparent)" }}
          >
            {comparison.map((c, i) => {
              const item = typeof c === "object" && c ? (c as Record<string, unknown>) : {};
              const criterion = str(item.criterion ?? item.name ?? item.category);
              const a = str(item.idea_a ?? item.option_a ?? item.a);
              const b = str(item.idea_b ?? item.option_b ?? item.b);
              return (
                <div key={i} className="grid grid-cols-3 gap-2 px-4 py-3 text-[12.5px]">
                  <div className="font-medium" style={{ color: "var(--foreground)" }}>
                    {criterion}
                  </div>
                  <div style={{ color: "var(--muted-foreground)" }}>{a}</div>
                  <div style={{ color: "var(--muted-foreground)" }}>{b}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function LandingPageOut({ o }: { o: Record<string, unknown> }) {
  const headline = str(o.headline);
  const subheadline = str(o.subheadline ?? o.sub_headline);
  const heroCopy = str(o.hero_copy ?? o.hero);
  const features = arr(o.features ?? o.value_props);
  const socialProof = str(o.social_proof ?? o.testimonial_hooks);
  const cta = str(o.cta ?? o.call_to_action);
  const seoKeywords = arr(o.seo_keywords ?? o.keywords);
  const abVariants = arr(o.ab_variants ?? o.headline_variants);
  return (
    <div className="space-y-3">
      {headline && (
        <div
          className="rounded-xl p-5"
          style={{
            background: "color-mix(in oklab, var(--primary) 7%, var(--surface-2))",
            border: "1px solid color-mix(in oklab, var(--primary) 25%, transparent)",
            borderLeft: "3px solid var(--primary)",
          }}
        >
          <div
            className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-2"
            style={{ color: "var(--primary)" }}
          >
            Hero headline
          </div>
          <div
            className="font-display text-[1.4rem] font-bold leading-tight tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            {headline}
          </div>
          {subheadline && (
            <div className="mt-2 text-[14px]" style={{ color: "var(--muted-foreground)" }}>
              {subheadline}
            </div>
          )}
        </div>
      )}
      {heroCopy && <Block title="Hero copy">{heroCopy}</Block>}
      {features.length > 0 && (
        <div
          className="overflow-hidden rounded-xl"
          style={{
            background: "var(--surface-2)",
            border: "1px solid color-mix(in oklab, var(--border) 70%, transparent)",
          }}
        >
          <div
            className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{
              borderBottom: "1px solid color-mix(in oklab, var(--border) 50%, transparent)",
              color: "var(--muted-foreground)",
            }}
          >
            Feature / value props
          </div>
          <div
            className="divide-y p-0"
            style={{ borderColor: "color-mix(in oklab, var(--border) 50%, transparent)" }}
          >
            {features.map((f, i) => {
              const item =
                typeof f === "object" && f ? (f as Record<string, unknown>) : { title: String(f) };
              const title = str(item.title ?? item.name);
              const desc = str(item.description ?? item.benefit);
              return (
                <div key={i} className="flex gap-3 px-4 py-3">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <div
                      className="text-[13px] font-semibold"
                      style={{ color: "var(--foreground)" }}
                    >
                      {title}
                    </div>
                    {desc && (
                      <div
                        className="mt-0.5 text-[12.5px]"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {desc}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {socialProof && (
          <Block title="Social proof hooks" accent="success">
            {socialProof}
          </Block>
        )}
        {cta && (
          <Block title="CTA" accent="accent">
            {cta}
          </Block>
        )}
      </div>
      {abVariants.length > 0 && (
        <Block title="A/B headline variants">
          <BulletList items={abVariants} accent="primary" />
        </Block>
      )}
      {seoKeywords.length > 0 && (
        <Block title="SEO keywords">
          <BulletList items={seoKeywords} />
        </Block>
      )}
    </div>
  );
}

function CompetitorOut({ o }: { o: Record<string, unknown> }) {
  const overview = str(o.market_overview ?? o.overview);
  const competitors = arr(o.competitors);
  const gaps = arr(o.gaps ?? o.market_gaps);
  const opportunity = str(o.positioning_opportunity ?? o.opportunity);
  const gtm = str(o.go_to_market ?? o.recommendation);
  return (
    <div className="space-y-3">
      {overview && (
        <Block title="Market overview" accent="primary">
          {overview}
        </Block>
      )}
      {competitors.length > 0 && (
        <div className="space-y-2">
          {competitors.map((c, i) => {
            const item =
              typeof c === "object" && c ? (c as Record<string, unknown>) : { name: String(c) };
            const name = str(item.name ?? item.company);
            const strengths = arr(item.strengths);
            const weaknesses = arr(item.weaknesses);
            const positioning = str(item.positioning ?? item.description);
            return (
              <div
                key={i}
                className="overflow-hidden rounded-xl"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid color-mix(in oklab, var(--border) 70%, transparent)",
                }}
              >
                <div
                  className="px-4 py-2.5 font-semibold text-[13px]"
                  style={{
                    borderBottom: "1px solid color-mix(in oklab, var(--border) 50%, transparent)",
                    color: "var(--foreground)",
                    background: "color-mix(in oklab, var(--primary) 5%, transparent)",
                  }}
                >
                  {name}
                </div>
                <div className="p-4 space-y-2">
                  {positioning && (
                    <div className="text-[12.5px]" style={{ color: "var(--muted-foreground)" }}>
                      {positioning}
                    </div>
                  )}
                  <div className="grid gap-3 md:grid-cols-2">
                    {strengths.length > 0 && (
                      <div>
                        <div
                          className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em]"
                          style={{ color: "var(--success)" }}
                        >
                          Strengths
                        </div>
                        <BulletList items={strengths} accent="success" />
                      </div>
                    )}
                    {weaknesses.length > 0 && (
                      <div>
                        <div
                          className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em]"
                          style={{ color: "var(--warning)" }}
                        >
                          Weaknesses
                        </div>
                        <BulletList items={weaknesses} accent="warning" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {gaps.length > 0 && (
        <Block title="Market gaps you can own" accent="accent">
          <BulletList items={gaps} accent="primary" />
        </Block>
      )}
      {opportunity && (
        <Block title="Positioning opportunity" accent="success">
          {opportunity}
        </Block>
      )}
      {gtm && (
        <Block title="GTM recommendation" accent="primary">
          {gtm}
        </Block>
      )}
    </div>
  );
}

function PricingOut({ o }: { o: Record<string, unknown> }) {
  const model = str(o.recommended_model ?? o.pricing_model ?? o.model);
  const rationale = str(o.rationale ?? o.positioning_rationale);
  const tiers = arr(o.pricing_tiers ?? o.tiers ?? o.plans);
  const comparison = str(o.competitor_comparison ?? o.market_context);
  const revenue = arr(o.revenue_projections ?? o.projections);
  return (
    <div className="space-y-3">
      {model && (
        <div
          className="rounded-xl p-5"
          style={{
            background: "color-mix(in oklab, var(--accent) 7%, var(--surface-2))",
            border: "1px solid color-mix(in oklab, var(--accent) 25%, transparent)",
            borderLeft: "3px solid var(--accent)",
          }}
        >
          <div
            className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-1.5"
            style={{ color: "var(--accent)" }}
          >
            Recommended model
          </div>
          <div
            className="font-display text-[1.2rem] font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            {model}
          </div>
          {rationale && (
            <div
              className="mt-2 text-[13px] leading-relaxed"
              style={{ color: "var(--muted-foreground)" }}
            >
              {rationale}
            </div>
          )}
        </div>
      )}
      {tiers.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tiers.map((t, i) => {
            const item =
              typeof t === "object" && t ? (t as Record<string, unknown>) : { name: String(t) };
            const name = str(item.name ?? item.tier ?? item.plan);
            const price = str(item.price ?? item.pricing);
            const features = arr(item.features ?? item.includes);
            const highlight = !!(item.recommended ?? item.highlighted ?? i === 1);
            return (
              <div
                key={i}
                className="overflow-hidden rounded-xl"
                style={{
                  background: highlight
                    ? "color-mix(in oklab, var(--primary) 8%, var(--surface-2))"
                    : "var(--surface-2)",
                  border: highlight
                    ? "1px solid color-mix(in oklab, var(--primary) 30%, transparent)"
                    : "1px solid color-mix(in oklab, var(--border) 70%, transparent)",
                  boxShadow: highlight
                    ? "0 0 20px color-mix(in oklab, var(--primary) 10%, transparent)"
                    : "none",
                }}
              >
                {highlight && (
                  <div
                    className="h-0.5"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, var(--primary), transparent)",
                    }}
                  />
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className="text-[13px] font-semibold"
                      style={{ color: "var(--foreground)" }}
                    >
                      {name}
                    </div>
                    {highlight && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[9.5px] font-bold"
                        style={{
                          background: "color-mix(in oklab, var(--primary) 15%, transparent)",
                          color: "var(--primary)",
                          border: "1px solid color-mix(in oklab, var(--primary) 30%, transparent)",
                        }}
                      >
                        POPULAR
                      </span>
                    )}
                  </div>
                  {price && (
                    <div
                      className="font-display text-[1.5rem] font-bold mb-3"
                      style={{ color: highlight ? "var(--primary)" : "var(--foreground)" }}
                    >
                      {price}
                    </div>
                  )}
                  {features.length > 0 && <BulletList items={features} accent="success" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {comparison && <Block title="Competitor comparison">{comparison}</Block>}
      {revenue.length > 0 && (
        <Block title="Revenue projections" accent="success">
          <BulletList items={revenue} accent="success" />
        </Block>
      )}
    </div>
  );
}

function RevenueOut({ o }: { o: Record<string, unknown> }) {
  const assumptions = arr(o.assumptions);
  const projections = arr(o.projections ?? o.monthly_projections ?? o.yearly_projections);
  const totalArr = str(o.total_arr ?? o.projected_arr ?? o.arr);
  const milestones = arr(o.milestones);
  const risks = arr(o.risks ?? o.key_risks);
  return (
    <div className="space-y-3">
      {totalArr && (
        <div
          className="rounded-xl p-5"
          style={{
            background: "color-mix(in oklab, var(--success) 8%, var(--surface-2))",
            border: "1px solid color-mix(in oklab, var(--success) 30%, transparent)",
            borderLeft: "3px solid var(--success)",
          }}
        >
          <div
            className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-1"
            style={{ color: "var(--success)" }}
          >
            Projected ARR
          </div>
          <div className="font-display text-[2rem] font-bold" style={{ color: "var(--success)" }}>
            {totalArr}
          </div>
        </div>
      )}
      {assumptions.length > 0 && (
        <Block title="Key assumptions">
          <BulletList items={assumptions} />
        </Block>
      )}
      {projections.length > 0 && (
        <div
          className="overflow-hidden rounded-xl"
          style={{
            background: "var(--surface-2)",
            border: "1px solid color-mix(in oklab, var(--border) 70%, transparent)",
          }}
        >
          <div
            className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{
              borderBottom: "1px solid color-mix(in oklab, var(--border) 50%, transparent)",
              color: "var(--muted-foreground)",
            }}
          >
            Projections
          </div>
          <div
            className="divide-y"
            style={{ borderColor: "color-mix(in oklab, var(--border) 50%, transparent)" }}
          >
            {projections.map((p, i) => {
              const item =
                typeof p === "object" && p ? (p as Record<string, unknown>) : { period: String(p) };
              const period = str(
                item.period ?? item.month ?? item.year ?? item.quarter ?? `Period ${i + 1}`,
              );
              const revenue = str(item.revenue ?? item.mrr ?? item.arr);
              const users = str(item.users ?? item.customers);
              const note = str(item.note ?? item.notes);
              return (
                <div key={i} className="flex items-center gap-4 px-4 py-2.5">
                  <span
                    className="w-20 shrink-0 text-[11px] font-semibold"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {period}
                  </span>
                  {revenue && (
                    <span
                      className="font-mono text-[13px] font-semibold"
                      style={{ color: "var(--success)" }}
                    >
                      {revenue}
                    </span>
                  )}
                  {users && (
                    <span className="text-[11.5px]" style={{ color: "var(--muted-foreground)" }}>
                      {users} users
                    </span>
                  )}
                  {note && (
                    <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                      {note}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {milestones.length > 0 && (
        <Block title="Key milestones" accent="primary">
          <BulletList items={milestones} accent="primary" />
        </Block>
      )}
      {risks.length > 0 && (
        <Block title="Revenue risks" accent="warning">
          <BulletList items={risks} accent="warning" />
        </Block>
      )}
    </div>
  );
}

function GenericOut({ o }: { o: Record<string, unknown> }) {
  const entries = Object.entries(o);
  return (
    <div className="space-y-3">
      {entries.map(([k, v]) => {
        if (v == null) return null;
        if (Array.isArray(v)) {
          return (
            <Block key={k} title={k.replace(/_/g, " ")}>
              <BulletList items={v} accent="primary" />
            </Block>
          );
        }
        if (typeof v === "object") {
          return (
            <Block key={k} title={k.replace(/_/g, " ")}>
              <pre
                className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg p-2 font-mono text-[12px]"
                style={{ background: "var(--surface-offset)", color: "var(--foreground)" }}
              >
                {JSON.stringify(v, null, 2)}
              </pre>
            </Block>
          );
        }
        return (
          <Block key={k} title={k.replace(/_/g, " ")}>
            {String(v)}
          </Block>
        );
      })}
    </div>
  );
}

export function SavedTick({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px]"
      style={{ color: "var(--muted-foreground)" }}
    >
      <Check className="h-3 w-3" style={{ color: "var(--success)" }} /> {label}
    </span>
  );
}
