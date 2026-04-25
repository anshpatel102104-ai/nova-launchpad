import { Check, Copy, Download, Save, ThumbsDown, ThumbsUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-3">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        {label}
      </div>
      <div className="flex items-center gap-1">
        {onFeedback && (
          <div className="mr-1 flex items-center gap-0.5 rounded-md border border-border bg-surface-2 p-0.5">
            <button
              onClick={() => onFeedback("up")}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition hover:text-foreground",
                feedback === "up" && "bg-success/15 text-success",
              )}
              title="Helpful"
              aria-label="Mark output helpful"
            >
              <ThumbsUp className="h-3 w-3" />
            </button>
            <button
              onClick={() => onFeedback("down")}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition hover:text-foreground",
                feedback === "down" && "bg-destructive/15 text-destructive",
              )}
              title="Needs work"
              aria-label="Mark output needs work"
            >
              <ThumbsDown className="h-3 w-3" />
            </button>
          </div>
        )}
        {onCopy && (
          <Button size="sm" variant="ghost" onClick={onCopy} className="h-7 gap-1.5 px-2 text-[11.5px]">
            <Copy className="h-3 w-3" /> Copy
          </Button>
        )}
        {onDownload && (
          <Button size="sm" variant="ghost" onClick={onDownload} className="h-7 gap-1.5 px-2 text-[11.5px]">
            <Download className="h-3 w-3" /> Export
          </Button>
        )}
        {onSave && (
          <Button size="sm" variant="outline" onClick={onSave} className="h-7 gap-1.5 px-2.5 text-[11.5px]">
            <Save className="h-3 w-3" /> Save
          </Button>
        )}
      </div>
    </div>
  );
}

export function copyText(text: string) {
  void navigator.clipboard.writeText(text).then(
    () => toast.success("Copied to clipboard"),
    () => toast.error("Copy failed"),
  );
}

/* ────────── Block primitives ────────── */
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
  const accentCls =
    accent === "primary" ? "border-l-2 border-l-primary" :
    accent === "accent" ? "border-l-2 border-l-accent" :
    accent === "warning" ? "border-l-2 border-l-warning" :
    accent === "destructive" ? "border-l-2 border-l-destructive" :
    accent === "success" ? "border-l-2 border-l-success" :
    "";
  return (
    <section className={cn("rounded-md border border-border bg-surface-2/60 p-4", accentCls, className)}>
      {title && (
        <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {title}
        </div>
      )}
      <div className="text-[13.5px] leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}

export function ScoreGauge({
  value,
  max = 100,
  label,
}: { value: number; max?: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const tone =
    pct >= 75 ? "text-success" :
    pct >= 50 ? "text-primary" :
    pct >= 25 ? "text-warning" :
    "text-destructive";
  return (
    <div className="flex items-center gap-4 rounded-md border border-border bg-surface-2/60 p-4">
      <div className={cn("font-display text-[2.4rem] font-semibold leading-none tabular-nums", tone)}>
        {Math.round(value)}
        <span className="ml-0.5 text-sm font-normal text-muted-foreground">/{max}</span>
      </div>
      <div className="min-w-0 flex-1">
        {label && <div className="text-[12px] font-medium text-foreground/90">{label}</div>}
        <div className="mt-1.5 h-1.5 rounded-full bg-surface-offset">
          <div className={cn("h-full rounded-full", pct >= 75 ? "bg-success" : pct >= 50 ? "bg-primary" : pct >= 25 ? "bg-warning" : "bg-destructive")} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

export function BulletList({ items, accent }: { items: unknown[]; accent?: "success" | "destructive" | "warning" | "primary" }) {
  const dot =
    accent === "success" ? "bg-success" :
    accent === "destructive" ? "bg-destructive" :
    accent === "warning" ? "bg-warning" :
    accent === "primary" ? "bg-primary" :
    "bg-muted-foreground";
  return (
    <ul className="space-y-2 text-[13.5px] leading-relaxed">
      {items.filter(Boolean).map((it, i) => (
        <li key={i} className="flex gap-2.5">
          <span className={cn("mt-2 h-1 w-1 shrink-0 rounded-full", dot)} />
          <span className="text-foreground/90">{typeof it === "string" ? it : JSON.stringify(it)}</span>
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
    case "validate-idea":         return <ValidatorOut o={o} />;
    case "generate-pitch":        return <PitchOut o={o} />;
    case "generate-gtm-strategy": return <GtmOut o={o} />;
    case "generate-offer":        return <OfferOut o={o} />;
    case "generate-ops-plan":     return <OpsOut o={o} />;
    case "generate-followup-sequence": return <FollowupOut o={o} />;
    case "analyze-website":       return <WebsiteOut o={o} />;
    case "kill-my-idea":          return <KillMyIdeaOut o={o} />;
    default:                      return <GenericOut o={o} />;
  }
}

const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : JSON.stringify(v));
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
      {(score > 0 || verdict) && (
        <ScoreGauge value={score} label={verdict || "Viability score"} />
      )}
      {summary && <Block title="Summary">{summary}</Block>}
      {strengths.length > 0 && (
        <Block title="Strengths" accent="success"><BulletList items={strengths} accent="success" /></Block>
      )}
      {weaknesses.length > 0 && (
        <Block title="Weaknesses" accent="warning"><BulletList items={weaknesses} accent="warning" /></Block>
      )}
      {risks.length > 0 && (
        <Block title="Key risks" accent="destructive"><BulletList items={risks} accent="destructive" /></Block>
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
        <div className="rounded-md border border-primary/30 bg-primary/5 p-5">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-primary">Headline</div>
          <div className="mt-2 font-display text-[1.35rem] font-semibold leading-tight tracking-tight">{headline}</div>
        </div>
      )}
      {problem && <Block title="Problem">{problem}</Block>}
      {solution && <Block title="Solution" accent="primary">{solution}</Block>}
      {outcome && <Block title="Outcome" accent="success">{outcome}</Block>}
      {cta && (
        <div className="rounded-md border border-accent/30 bg-accent/5 p-4">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-accent">Call to action</div>
          <div className="mt-1.5 text-[14px] font-medium">{cta}</div>
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
      {icp && <Block title="Ideal customer profile" accent="primary">{icp}</Block>}
      {positioning && <Block title="Positioning">{positioning}</Block>}
      {channels.length > 0 && (
        <Block title="Channels"><BulletList items={channels} accent="primary" /></Block>
      )}
      {phases.length > 0 && (
        <div className="rounded-md border border-border bg-surface-2/60 p-4">
          <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Launch phases</div>
          <ol className="space-y-3">
            {phases.map((p, i) => {
              const item = (typeof p === "object" && p) ? p as Record<string, unknown> : { name: String(p) };
              const name = str(item.name ?? item.title ?? `Phase ${i + 1}`);
              const description = str(item.description);
              return (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-[11px] font-semibold text-primary tabular-nums">{i + 1}</span>
                  <div className="min-w-0 flex-1 text-[13.5px]">
                    <div className="font-semibold">{name}</div>
                    {description && <div className="mt-0.5 text-muted-foreground">{description}</div>}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
      {priorities.length > 0 && (
        <Block title="Priorities" accent="warning"><BulletList items={priorities} accent="warning" /></Block>
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
        <div className="rounded-md border border-primary/30 bg-primary/5 p-5">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-primary">Offer</div>
          <div className="mt-2 font-display text-[1.35rem] font-semibold tracking-tight">{name}</div>
          {promise && <div className="mt-1.5 text-[13.5px] text-muted-foreground">{promise}</div>}
        </div>
      )}
      {deliverables.length > 0 && (
        <Block title="Deliverables" accent="primary"><BulletList items={deliverables} accent="primary" /></Block>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {priceAnchor && <Block title="Price anchor">{priceAnchor}</Block>}
        {guarantee && <Block title="Guarantee" accent="success">{guarantee}</Block>}
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
        <Block title="Workflows"><BulletList items={workflows} accent="primary" /></Block>
      )}
      {automations.length > 0 && (
        <Block title="Automations" accent="accent"><BulletList items={automations} accent="primary" /></Block>
      )}
      {kpis.length > 0 && (
        <Block title="Key metrics" accent="success"><BulletList items={kpis} accent="success" /></Block>
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
        const item = typeof s === "object" && s ? s as Record<string, unknown> : { body: String(s) };
        const day = str(item.day);
        const delay = str(item.delay);
        const channel = str(item.channel);
        const subject = str(item.subject);
        const body = str(item.body ?? item.message ?? item.content);
        return (
          <div key={i} className="rounded-md border border-border bg-surface-2/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                Step {i + 1}{day ? ` · Day ${day}` : delay ? ` · ${delay}` : ""}
              </div>
              {channel && (
                <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] text-muted-foreground">{channel}</span>
              )}
            </div>
            {subject && <div className="mt-2 text-[13.5px] font-semibold">{subject}</div>}
            <div className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/90">
              {body}
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
        <Block title="Issues" accent="destructive"><BulletList items={issues} accent="destructive" /></Block>
      )}
      {opportunities.length > 0 && (
        <Block title="Opportunities" accent="primary"><BulletList items={opportunities} accent="primary" /></Block>
      )}
      {suggested.length > 0 && (
        <Block title="Suggested changes" accent="success"><BulletList items={suggested} accent="success" /></Block>
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

  const tone = score >= 65 ? "text-warning" : score >= 40 ? "text-destructive" : "text-destructive";
  const barColor = score >= 65 ? "bg-warning" : "bg-destructive";

  return (
    <div className="space-y-3">
      {/* Survival score */}
      <div className="flex items-center gap-4 rounded-md border border-border bg-surface-2/60 p-4">
        <div className={cn("font-display text-[2.4rem] font-semibold leading-none tabular-nums", tone)}>
          {Math.round(score)}
          <span className="ml-0.5 text-sm font-normal text-muted-foreground">/100</span>
        </div>
        <div className="min-w-0 flex-1">
          {verdict && <div className="text-[12px] font-medium text-foreground/90">{verdict}</div>}
          <div className="mt-1.5 h-1.5 rounded-full bg-surface-offset">
            <div className={cn("h-full rounded-full", barColor)} style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
          </div>
          <div className="mt-1 text-[10.5px] text-muted-foreground">Survival score — lower = higher failure risk</div>
        </div>
      </div>

      {/* The kill shot */}
      {killShot && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4">
          <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-destructive">The kill shot</div>
          <div className="text-[13.5px] leading-relaxed text-foreground/90">{killShot}</div>
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

      {/* Dangerous assumptions table */}
      {assumptions.length > 0 && (
        <div className="rounded-md border border-border bg-surface-2/60 p-4">
          <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Dangerous assumptions
          </div>
          <div className="space-y-3">
            {assumptions.map((a, i) => {
              const item = typeof a === "object" && a ? a as Record<string, unknown> : {};
              return (
                <div key={i} className="grid gap-1 rounded border border-border bg-surface p-3 sm:grid-cols-2">
                  <div>
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-warning">You assume</div>
                    <div className="text-[12.5px] text-foreground/90">{str(item.assumption)}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-destructive">Reality</div>
                    <div className="text-[12.5px] text-foreground/90">{str(item.reality)}</div>
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

function GenericOut({ o }: { o: Record<string, unknown> }) {
  // Render top-level keys nicely instead of raw JSON.
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
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap font-mono text-[12px] text-foreground/80">
                {JSON.stringify(v, null, 2)}
              </pre>
            </Block>
          );
        }
        return (
          <Block key={k} title={k.replace(/_/g, " ")}>{String(v)}</Block>
        );
      })}
    </div>
  );
}

/* ────────── Saved tick used inline ────────── */
export function SavedTick({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
      <Check className="h-3 w-3 text-success" /> {label}
    </span>
  );
}
