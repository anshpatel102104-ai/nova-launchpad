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

// ─── Markdown renderer for full_report fields ────────────────────────────────
// Handles the patterns our AI prompts produce: ## headers, **bold**, tables,
// bullet lists, ordered lists, --- dividers, and paragraphs.
export function MarkdownReport({ content }: { content: string }) {
  if (!content) return null;

  // Inline: **bold**, *italic*, `code`
  function renderInline(text: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) parts.push(text.slice(last, m.index));
      if (m[2] !== undefined)
        parts.push(<strong key={m.index} style={{ color: "var(--foreground)", fontWeight: 600 }}>{m[2]}</strong>);
      else if (m[3] !== undefined)
        parts.push(<em key={m.index}>{m[3]}</em>);
      else if (m[4] !== undefined)
        parts.push(
          <code key={m.index} style={{ background: "var(--surface-3, var(--surface-2))", borderRadius: 4, padding: "1px 5px", fontSize: "0.85em", color: "var(--primary)" }}>{m[4]}</code>
        );
      last = m.index + m[0].length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
  }

  // Table row parser
  function parseTableRow(line: string): string[] {
    return line.split("|").map(c => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1);
  }

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines between blocks
    if (!trimmed) { i++; continue; }

    // Horizontal rule
    if (/^---+$/.test(trimmed)) {
      elements.push(
        <hr key={i} style={{ border: "none", borderTop: "1px solid color-mix(in oklab, var(--border) 60%, transparent)", margin: "4px 0" }} />
      );
      i++; continue;
    }

    // H2 heading
    if (trimmed.startsWith("## ")) {
      const text = trimmed.slice(3);
      elements.push(
        <h2 key={i} style={{
          fontSize: "13px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
          color: "var(--primary)", marginTop: elements.length ? "20px" : 0, marginBottom: "6px",
        }}>
          {renderInline(text)}
        </h2>
      );
      i++; continue;
    }

    // H3 heading
    if (trimmed.startsWith("### ")) {
      const text = trimmed.slice(4);
      elements.push(
        <h3 key={i} style={{
          fontSize: "13px", fontWeight: 700, color: "var(--foreground)", marginTop: "14px", marginBottom: "4px",
        }}>
          {renderInline(text)}
        </h3>
      );
      i++; continue;
    }

    // Table — collect header + separator + rows
    if (trimmed.startsWith("|") && i + 1 < lines.length && /^\|[-| :]+\|$/.test(lines[i + 1].trim())) {
      const headers = parseTableRow(trimmed);
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(parseTableRow(lines[i].trim()));
        i++;
      }
      elements.push(
        <div key={`table-${i}`} style={{ overflowX: "auto", marginTop: "8px", marginBottom: "8px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
            <thead>
              <tr style={{ background: "color-mix(in oklab, var(--primary) 8%, var(--surface-2))" }}>
                {headers.map((h, hi) => (
                  <th key={hi} style={{ padding: "7px 12px", textAlign: "left", fontWeight: 600, color: "var(--foreground)", borderBottom: "1px solid color-mix(in oklab, var(--border) 60%, transparent)", whiteSpace: "nowrap" }}>
                    {renderInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} style={{ borderBottom: "1px solid color-mix(in oklab, var(--border) 35%, transparent)" }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{ padding: "6px 12px", color: "color-mix(in oklab, var(--foreground) 85%, transparent)", verticalAlign: "top" }}>
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Unordered list — collect consecutive bullet lines
    if (/^[-*] /.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i].trim())) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ paddingLeft: "16px", margin: "4px 0 8px" }}>
          {items.map((item, ii) => (
            <li key={ii} style={{ fontSize: "13px", color: "color-mix(in oklab, var(--foreground) 90%, transparent)", marginBottom: "3px", lineHeight: 1.55 }}>
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\. /, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} style={{ paddingLeft: "18px", margin: "4px 0 8px" }}>
          {items.map((item, ii) => (
            <li key={ii} style={{ fontSize: "13px", color: "color-mix(in oklab, var(--foreground) 90%, transparent)", marginBottom: "3px", lineHeight: 1.55 }}>
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Blockquote (email templates)
    if (trimmed.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("> ")) {
        quoteLines.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <blockquote key={`bq-${i}`} style={{
          borderLeft: "3px solid var(--primary)", paddingLeft: "14px", margin: "8px 0",
          color: "color-mix(in oklab, var(--foreground) 80%, transparent)", fontStyle: "italic", fontSize: "13px", lineHeight: 1.6,
        }}>
          {quoteLines.map((ql, qi) => <p key={qi} style={{ margin: "3px 0" }}>{renderInline(ql)}</p>)}
        </blockquote>
      );
      continue;
    }

    // Paragraph
    elements.push(
      <p key={i} style={{ fontSize: "13px", lineHeight: 1.6, color: "color-mix(in oklab, var(--foreground) 88%, transparent)", margin: "4px 0 6px" }}>
        {renderInline(trimmed)}
      </p>
    );
    i++;
  }

  return <div style={{ lineHeight: 1.6 }}>{elements}</div>;
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
    case "business-plan-generator":
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
    case "blog":
      return <BlogOut o={o} />;
    case "social":
      return <SocialOut o={o} />;
    case "email_sequence":
      return <EmailSequenceOut o={o} />;
    case "sales_script":
      return <SalesScriptOut o={o} />;
    case "ad_creative":
      return <AdCreativeOut o={o} />;
    case "vsl":
      return <VslOut o={o} />;
    case "cold_email":
      return <ColdEmailOut o={o} />;
    case "niche_validator":
      return <NicheValidatorOut o={o} />;
    case "icp":
      return <IcpOut o={o} />;
    case "pitch_deck":
      return <PitchDeckOut o={o} />;
    case "lead_magnet":
      return <LeadMagnetOut o={o} />;
    case "automation":
      return <AutomationOut o={o} />;
    case "client_report":
      return <ClientReportOut o={o} />;
    case "niche-scorer":
      return <NicheScorerOut o={o} />;
    case "positioning-engine":
      return <PositioningEngineOut o={o} />;
    case "mvp-planner":
      return <MvpPlannerOut o={o} />;
    default:
      return <GenericOut o={o} />;
  }
}

const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown): string =>
  typeof v === "string" ? v : v == null ? "" : JSON.stringify(v);
const num = (v: unknown, fallback = 0): number => (typeof v === "number" ? v : fallback);

function ValidatorOut({ o }: { o: Record<string, unknown> }) {
  // Edge function returns total_score (out of 80) — normalize to 0-100
  const rawScore = o.score ?? o.viability_score ?? o.overall_score ?? o.total_score;
  const score =
    typeof rawScore === "number" && rawScore > 0
      ? rawScore > 100
        ? Math.round((rawScore / 80) * 100)
        : rawScore
      : 0;
  const verdict = str(o.verdict ?? o.recommendation);
  const summary = str(o.summary ?? o.full_report);
  const strengths = arr(o.strengths);
  const weaknesses = arr(o.weaknesses);
  const risks = arr(o.risks);
  const next = arr(o.next_steps ?? o.recommendations ?? o.action_items);
  const fullReport = str(o.full_report);
  return (
    <div className="space-y-3">
      {(score > 0 || verdict) && <ScoreGauge value={score} label={verdict || "Viability score"} />}
      {summary && !fullReport && <Block title="Summary">{summary}</Block>}
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
      {fullReport && strengths.length === 0 && weaknesses.length === 0 && (
        <Block title="Full Report">
          <MarkdownReport content={fullReport} />
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
  // Edge function returns verbal_pitch + slide_narrative
  const verbalPitch = str(o.verbal_pitch);
  const slideNarrative = arr(o.slide_narrative);
  const fullReport = str(o.full_report);

  // If no structured fields, render verbal_pitch + slides
  const hasStructured = headline || problem || solution || outcome || cta;

  if (!hasStructured) {
    return (
      <div className="space-y-3">
        {verbalPitch && (
          <div
            className="overflow-hidden rounded-xl p-5"
            style={{
              background: "color-mix(in oklab, var(--primary) 7%, var(--surface-2))",
              border: "1px solid color-mix(in oklab, var(--primary) 25%, transparent)",
              borderLeft: "3px solid var(--primary)",
            }}
          >
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-3"
              style={{ color: "var(--primary)" }}
            >
              60-Second Verbal Pitch
            </div>
            <div
              className="whitespace-pre-wrap text-[13.5px] leading-relaxed"
              style={{ color: "var(--foreground)" }}
            >
              {verbalPitch}
            </div>
          </div>
        )}
        {slideNarrative.length > 0 && (
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
              10-Slide Narrative
            </div>
            <ol
              className="divide-y"
              style={{ borderColor: "color-mix(in oklab, var(--border) 50%, transparent)" }}
            >
              {slideNarrative.map((s, i) => {
                const slide =
                  typeof s === "object" && s
                    ? (s as Record<string, unknown>)
                    : { content: String(s) };
                const title = str(slide.title ?? slide.slide ?? slide.name ?? `Slide ${i + 1}`);
                const content = str(
                  slide.content ??
                    slide.description ??
                    slide.body ??
                    slide.key_insight ??
                    slide.key_stat,
                );
                return (
                  <li key={i} className="flex gap-3 px-4 py-3">
                    <span
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{
                        background: "linear-gradient(135deg, var(--primary), var(--accent))",
                      }}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1 text-[13.5px]">
                      <div className="font-semibold" style={{ color: "var(--foreground)" }}>
                        {title}
                      </div>
                      {content && (
                        <div
                          className="mt-0.5 text-[13px]"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {content}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
        {!verbalPitch && !slideNarrative.length && fullReport && (
          <Block title="Pitch Package">
            <MarkdownReport content={fullReport} />
          </Block>
        )}
      </div>
    );
  }

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
  // Edge function returns positioning_statement, top_channels, kpis
  const positioning = str(o.positioning ?? o.positioning_statement);
  const channels = arr(o.channels ?? o.top_channels);
  const phases = arr(o.phases ?? o.timeline);
  const priorities = arr(o.priorities ?? o.kpis);
  const fullReport = str(o.full_report);
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
      {fullReport && !positioning && channels.length === 0 && (
        <Block title="GTM Strategy">
          <MarkdownReport content={fullReport} />
        </Block>
      )}
    </div>
  );
}

function OfferOut({ o }: { o: Record<string, unknown> }) {
  const name = str(o.name);
  const promise = str(o.promise);
  const deliverables = arr(o.deliverables);
  // Edge function returns price_recommendation, not price_anchor
  const priceAnchor = str(o.price_anchor ?? o.price_recommendation ?? o.dream_outcome);
  const guarantee = str(o.guarantee);
  const fullReport = str(o.full_report);
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
  // Edge function returns fatal_flaw (singular) and reasons_to_fail array
  const killShot = str(o.the_kill_shot ?? o.fatal_flaw);
  const fatalFlaws = arr(o.fatal_flaws ?? o.reasons_to_fail);
  const marketRisks = arr(o.market_risks);
  const executionRisks = arr(o.execution_risks);
  const assumptions = arr(o.dangerous_assumptions);
  const ifYouProceed = arr(o.if_you_proceed ?? o.pivots);
  const fullReport = str(o.full_report);

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
      {fullReport && !killShot && fatalFlaws.length === 0 && (
        <Block title="Devil's Advocate Report">
          <MarkdownReport content={fullReport} />
        </Block>
      )}
    </div>
  );
}

function FundingScoreOut({ o }: { o: Record<string, unknown> }) {
  // Edge function returns overall_score, grade, dimension_scores
  const score = num(o.score ?? o.funding_score ?? o.overall_score, 0);
  const verdict = str(o.verdict ?? o.summary ?? o.grade);
  const breakdown = arr(o.breakdown ?? o.criteria ?? o.dimension_scores);
  const strengths = arr(o.investor_strengths ?? o.strengths);
  const weaknesses = arr(o.investor_concerns ?? o.weaknesses);
  const recommendations = arr(o.recommendations ?? o.next_steps);
  const investorType = str(o.investor_type);
  const fullReport = str(o.full_report);
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
      {investorType && (
        <Block title="Best investor match" accent="accent">
          {investorType}
        </Block>
      )}
      {fullReport && score === 0 && breakdown.length === 0 && (
        <Block title="Funding Readiness Report">
          <MarkdownReport content={fullReport} />
        </Block>
      )}
    </div>
  );
}

function FirstTenOut({ o }: { o: Record<string, unknown> }) {
  const strategy = str(o.strategy ?? o.overview);
  // Edge function returns steps array and template strings
  const channels = arr(o.channels ?? o.acquisition_channels);
  // Edge function returns steps array and cold_dm_template / cold_email_template strings
  const scripts = arr(o.outreach_scripts ?? o.scripts ?? o.steps);
  const weekByWeek = arr(o.week_by_week ?? o.plan ?? o.timeline);
  const templates = arr(o.templates ?? o.outreach_templates);
  const coldDm = str(o.cold_dm_template);
  const coldEmail = str(o.cold_email_template);
  const linkedin = str(o.linkedin_template);
  const fullReport = str(o.full_report);
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
      {coldDm && (
        <Block title="Cold DM Template" accent="primary">
          <div className="whitespace-pre-wrap text-[13px] leading-relaxed">{coldDm}</div>
        </Block>
      )}
      {coldEmail && (
        <Block title="Cold Email Template">
          <div className="whitespace-pre-wrap text-[13px] leading-relaxed">{coldEmail}</div>
        </Block>
      )}
      {linkedin && (
        <Block title="LinkedIn Outreach">
          <div className="whitespace-pre-wrap text-[13px] leading-relaxed">{linkedin}</div>
        </Block>
      )}
      {fullReport && !strategy && scripts.length === 0 && !coldDm && (
        <Block title="First 10 Customers Playbook">
          <MarkdownReport content={fullReport} />
        </Block>
      )}
    </div>
  );
}

function BusinessPlanOut({ o }: { o: Record<string, unknown> }) {
  const exec = str(o.executive_summary ?? o.summary);
  const fullReport = str(o.full_report);
  // Only show structured side-fields if they're real strings (not JSON blobs)
  const competitive = str(o.competitive_landscape ?? o.competition);
  const risks = arr(o.risks ?? o.key_risks);

  return (
    <div className="space-y-3">
      {/* Executive summary — prominent pull-quote style */}
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
            Executive Summary
          </div>
          <div
            className="text-[13.5px] leading-relaxed"
            style={{ color: "color-mix(in oklab, var(--foreground) 90%, transparent)" }}
          >
            {exec}
          </div>
        </div>
      )}
      {/* Full report — always render if present; this is the complete document */}
      {fullReport && (
        <Block title="Full Business Plan">
          <MarkdownReport content={fullReport} />
        </Block>
      )}
      {/* Supplemental structured fields only if they exist as real strings */}
      {competitive && !fullReport && (
        <Block title="Competitive landscape">{competitive}</Block>
      )}
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
  // Edge fn returns rationale as array — join if needed
  const rationaleRaw = o.winner_rationale ?? o.rationale ?? o.recommendation;
  const rationale = Array.isArray(rationaleRaw)
    ? (rationaleRaw as string[]).join("\n")
    : str(rationaleRaw);
  const comparison = arr(o.comparison ?? o.criteria);
  const ideaA = str(o.idea_a_summary ?? o.idea_a);
  const ideaB = str(o.idea_b_summary ?? o.idea_b);
  const fullReport = str(o.full_report);
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
      {fullReport && !winner && (
        <Block title="Idea Comparison">
          <MarkdownReport content={fullReport} />
        </Block>
      )}
    </div>
  );
}

function LandingPageOut({ o }: { o: Record<string, unknown> }) {
  // Edge function returns hero as an object — extract fields from it
  const heroObj = (typeof o.hero === "object" && o.hero ? o.hero : {}) as Record<string, unknown>;
  const headline = str(o.headline ?? heroObj.headline);
  const subheadline = str(o.subheadline ?? o.sub_headline ?? heroObj.subheadline);
  const heroCopy = str(o.hero_copy ?? heroObj.copy ?? heroObj.body);
  const features = arr(o.features ?? o.value_props ?? o.sections);
  const socialProof = str(o.social_proof ?? o.testimonial_hooks);
  const cta = str(o.cta ?? o.call_to_action ?? heroObj.cta);
  const seoKeywords = arr(o.seo_keywords ?? o.keywords);
  const abVariants = arr(o.ab_variants ?? o.headline_variants);
  const fullReport = str(o.full_report);
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
      {fullReport && !headline && !heroCopy && (
        <Block title="Landing Page Copy">
          <MarkdownReport content={fullReport} />
        </Block>
      )}
    </div>
  );
}

function CompetitorOut({ o }: { o: Record<string, unknown> }) {
  const overview = str(o.market_overview ?? o.overview);
  // Edge function returns tier1 + tier2 arrays instead of a combined competitors array
  const tier1 = arr(o.tier1);
  const tier2 = arr(o.tier2);
  const competitors = arr(o.competitors).length > 0 ? arr(o.competitors) : [...tier1, ...tier2];
  const gaps = arr(o.gaps ?? o.market_gaps);
  const opportunity = str(o.positioning_opportunity ?? o.opportunity ?? o.winning_angle);
  const gtm = str(o.go_to_market ?? o.recommendation);
  const fullReport = str(o.full_report);
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
      {fullReport && competitors.length === 0 && !opportunity && (
        <Block title="Competitive Analysis">
          <MarkdownReport content={fullReport} />
        </Block>
      )}
    </div>
  );
}

function PricingOut({ o }: { o: Record<string, unknown> }) {
  // Edge function returns recommended_strategy and recommended_price (number)
  const model = str(o.recommended_model ?? o.pricing_model ?? o.model ?? o.recommended_strategy);
  const rationale = str(o.rationale ?? o.positioning_rationale);
  const recommendedPrice = o.recommended_price != null ? `$${String(o.recommended_price)}` : "";
  const tiers = arr(o.pricing_tiers ?? o.tiers ?? o.plans);
  const comparison = str(o.competitor_comparison ?? o.market_context);
  // Edge function returns revenue_projections as object with scenarios, not array
  const revenueObj = o.revenue_projections;
  const revenue = Array.isArray(revenueObj)
    ? (revenueObj as unknown[])
    : revenueObj && typeof revenueObj === "object"
      ? Object.entries(revenueObj as Record<string, unknown>).map(([k, v]) => `${k}: ${String(v)}`)
      : [];
  const fullReport = str(o.full_report);
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
      {recommendedPrice && !model && (
        <Block title="Recommended Price" accent="success">
          <span className="font-display text-2xl font-bold">{recommendedPrice}</span>
        </Block>
      )}
      {comparison && <Block title="Competitor comparison">{comparison}</Block>}
      {revenue.length > 0 && (
        <Block title="Revenue projections" accent="success">
          <BulletList items={revenue} accent="success" />
        </Block>
      )}
      {fullReport && !model && tiers.length === 0 && (
        <Block title="Pricing Strategy">
          <MarkdownReport content={fullReport} />
        </Block>
      )}
    </div>
  );
}

function RevenueOut({ o }: { o: Record<string, unknown> }) {
  const assumptions = arr(o.assumptions);
  // Edge function returns conservative_scenario, base_scenario, optimistic_scenario objects
  const projections = arr(o.projections ?? o.monthly_projections ?? o.yearly_projections);
  const baseScenario = o.base_scenario as Record<string, unknown> | undefined;
  const conservativeScenario = o.conservative_scenario as Record<string, unknown> | undefined;
  const optimisticScenario = o.optimistic_scenario as Record<string, unknown> | undefined;
  const growthLevers = arr(o.growth_levers);
  const breakeven = str(o.breakeven_analysis);
  const verdict = str(o.unit_economics_verdict);
  const totalArr = str(o.total_arr ?? o.projected_arr ?? o.arr);
  const milestones = arr(o.milestones);
  const risks = arr(o.risks ?? o.key_risks);
  const fullReport = str(o.full_report);
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
      {/* Edge function scenario blocks */}
      {!projections.length && (baseScenario || conservativeScenario || optimisticScenario) && (
        <div className="space-y-2">
          {[
            { label: "Conservative", data: conservativeScenario, accent: "warning" as const },
            { label: "Base", data: baseScenario, accent: "primary" as const },
            { label: "Optimistic", data: optimisticScenario, accent: "success" as const },
          ]
            .filter((s) => s.data)
            .map((s) => (
              <Block key={s.label} title={`${s.label} scenario`} accent={s.accent}>
                <div className="whitespace-pre-wrap text-[13px] leading-relaxed">
                  {Object.entries(s.data as Record<string, unknown>)
                    .map(([k, v]) => `${k}: ${String(v)}`)
                    .join("\n")}
                </div>
              </Block>
            ))}
        </div>
      )}
      {verdict && (
        <Block title="Unit economics verdict" accent="accent">
          {verdict}
        </Block>
      )}
      {breakeven && <Block title="Breakeven analysis">{breakeven}</Block>}
      {growthLevers.length > 0 && (
        <Block title="Growth levers" accent="primary">
          <BulletList items={growthLevers} accent="primary" />
        </Block>
      )}
      {fullReport && !totalArr && projections.length === 0 && !baseScenario && (
        <Block title="Revenue Projection">
          <MarkdownReport content={fullReport} />
        </Block>
      )}
    </div>
  );
}

function BlogOut({ o }: { o: Record<string, unknown> }) {
  const title = str(o.title);
  const metaDesc = str(o.meta_description);
  const body = str(o.body_markdown ?? o.body);
  const tags = arr(o.suggested_tags ?? o.tags);
  const readability = num(o.readability_score, 0);
  return (
    <div className="space-y-3">
      {title && (
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
            Title
          </div>
          <div
            className="font-display text-[1.25rem] font-semibold leading-tight tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            {title}
          </div>
          {metaDesc && (
            <div
              className="mt-2 text-[13px] leading-relaxed"
              style={{ color: "var(--muted-foreground)" }}
            >
              {metaDesc}
            </div>
          )}
        </div>
      )}
      {readability > 0 && <ScoreGauge value={readability} label="Readability score" />}
      {body && (
        <Block title="Article">
          <div className="whitespace-pre-wrap text-[13px] leading-relaxed">{body}</div>
        </Block>
      )}
      {tags.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{
            background: "var(--surface-2)",
            border: "1px solid color-mix(in oklab, var(--border) 70%, transparent)",
          }}
        >
          <div
            className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--muted-foreground)" }}
          >
            Suggested tags
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t, i) => (
              <span
                key={i}
                className="rounded-full px-2.5 py-0.5 text-[11.5px]"
                style={{
                  background: "color-mix(in oklab, var(--primary) 10%, transparent)",
                  border: "1px solid color-mix(in oklab, var(--primary) 25%, transparent)",
                  color: "var(--primary)",
                }}
              >
                {typeof t === "string" ? t : JSON.stringify(t)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SocialOut({ o }: { o: Record<string, unknown> }) {
  const platform = str(o.platform);
  const posts = arr(o.posts);
  return (
    <div className="space-y-3">
      {platform && (
        <div
          className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]"
          style={{
            background: "color-mix(in oklab, var(--primary) 10%, transparent)",
            border: "1px solid color-mix(in oklab, var(--primary) 25%, transparent)",
            color: "var(--primary)",
          }}
        >
          {platform}
        </div>
      )}
      {posts.map((p, i) => {
        const post = typeof p === "object" && p ? (p as Record<string, unknown>) : {};
        const hook = str(post.hook);
        const body = str(post.body ?? post.copy ?? post.content);
        const cta = str(post.cta);
        const hashtags = arr(post.hashtags ?? post.tags);
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
              className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{
                borderBottom: "1px solid color-mix(in oklab, var(--border) 50%, transparent)",
                color: "var(--muted-foreground)",
              }}
            >
              Post {i + 1}
            </div>
            <div className="space-y-2 p-4">
              {hook && (
                <div
                  className="text-[13.5px] font-semibold leading-relaxed"
                  style={{ color: "var(--foreground)" }}
                >
                  {hook}
                </div>
              )}
              {body && (
                <div
                  className="whitespace-pre-wrap text-[13px] leading-relaxed"
                  style={{ color: "color-mix(in oklab, var(--foreground) 85%, transparent)" }}
                >
                  {body}
                </div>
              )}
              {cta && (
                <div className="text-[12.5px] font-medium" style={{ color: "var(--primary)" }}>
                  {cta}
                </div>
              )}
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {hashtags.map((h, j) => (
                    <span
                      key={j}
                      className="rounded-full px-2 py-0.5 text-[11px]"
                      style={{
                        background: "color-mix(in oklab, var(--primary) 8%, transparent)",
                        color: "var(--primary)",
                      }}
                    >
                      {typeof h === "string" ? h : String(h)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmailSequenceOut({ o }: { o: Record<string, unknown> }) {
  const name = str(o.sequence_name ?? o.name);
  const emails = arr(o.emails);
  return (
    <div className="space-y-3">
      {name && (
        <Block title="Sequence name" accent="primary">
          {name}
        </Block>
      )}
      {emails.map((e, i) => {
        const email = typeof e === "object" && e ? (e as Record<string, unknown>) : {};
        const subject = str(email.subject);
        const preview = str(email.preview_text);
        const body = str(email.body ?? email.content);
        const cta = str(email.cta);
        const day = email.send_day != null ? str(email.send_day) : String(i + 1);
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
              }}
            >
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: "var(--muted-foreground)" }}
              >
                Email {i + 1}
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  background: "color-mix(in oklab, var(--primary) 10%, transparent)",
                  color: "var(--primary)",
                }}
              >
                Day {day}
              </span>
            </div>
            <div className="space-y-2 p-4">
              {subject && (
                <div className="text-[13.5px] font-semibold" style={{ color: "var(--foreground)" }}>
                  {subject}
                </div>
              )}
              {preview && (
                <div className="text-[12px] italic" style={{ color: "var(--muted-foreground)" }}>
                  {preview}
                </div>
              )}
              {body && (
                <div
                  className="whitespace-pre-wrap text-[13px] leading-relaxed"
                  style={{ color: "color-mix(in oklab, var(--foreground) 85%, transparent)" }}
                >
                  {body}
                </div>
              )}
              {cta && (
                <div className="text-[12.5px] font-medium" style={{ color: "var(--primary)" }}>
                  CTA: {cta}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SalesScriptOut({ o }: { o: Record<string, unknown> }) {
  const scriptType = str(o.script_type);
  const opener = str(o.opener);
  const questions = arr(o.discovery_questions);
  const pitch = str(o.pitch_section);
  const objections = arr(o.objection_handlers);
  const close = str(o.close);
  const followUp = str(o.follow_up);
  return (
    <div className="space-y-3">
      {scriptType && (
        <div
          className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]"
          style={{
            background: "color-mix(in oklab, var(--primary) 10%, transparent)",
            border: "1px solid color-mix(in oklab, var(--primary) 25%, transparent)",
            color: "var(--primary)",
          }}
        >
          {scriptType}
        </div>
      )}
      {opener && (
        <Block title="Opener" accent="primary">
          {opener}
        </Block>
      )}
      {questions.length > 0 && (
        <Block title="Discovery questions">
          <BulletList items={questions} accent="primary" />
        </Block>
      )}
      {pitch && <Block title="Pitch section">{pitch}</Block>}
      {objections.length > 0 && (
        <div
          className="overflow-hidden rounded-xl"
          style={{
            background: "var(--surface-2)",
            border: "1px solid color-mix(in oklab, var(--border) 70%, transparent)",
          }}
        >
          <div
            className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{
              borderBottom: "1px solid color-mix(in oklab, var(--border) 50%, transparent)",
              color: "var(--muted-foreground)",
            }}
          >
            Objection handlers
          </div>
          <div
            className="divide-y p-1"
            style={{ borderColor: "color-mix(in oklab, var(--border) 50%, transparent)" }}
          >
            {objections.map((obj, i) => {
              const item = typeof obj === "object" && obj ? (obj as Record<string, unknown>) : {};
              return (
                <div key={i} className="px-3 py-2.5">
                  <div className="text-[12px] font-semibold" style={{ color: "var(--warning)" }}>
                    {str(item.objection)}
                  </div>
                  <div
                    className="mt-1 text-[13px] leading-relaxed"
                    style={{ color: "var(--foreground)" }}
                  >
                    {str(item.response)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {close && (
        <Block title="Close" accent="success">
          {close}
        </Block>
      )}
      {followUp && <Block title="Follow-up">{followUp}</Block>}
    </div>
  );
}

function AdCreativeOut({ o }: { o: Record<string, unknown> }) {
  const platform = str(o.platform);
  const variants = arr(o.variants);
  const targeting = str(o.targeting_notes);
  return (
    <div className="space-y-3">
      {platform && (
        <div
          className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]"
          style={{
            background: "color-mix(in oklab, var(--primary) 10%, transparent)",
            border: "1px solid color-mix(in oklab, var(--primary) 25%, transparent)",
            color: "var(--primary)",
          }}
        >
          {platform}
        </div>
      )}
      {variants.map((v, i) => {
        const variant = typeof v === "object" && v ? (v as Record<string, unknown>) : {};
        const headline = str(variant.headline);
        const primaryText = str(variant.primary_text ?? variant.body);
        const description = str(variant.description);
        const cta = str(variant.cta);
        const angle = str(variant.angle);
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
              }}
            >
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: "var(--muted-foreground)" }}
              >
                Variant {i + 1}
              </div>
              {angle && (
                <span className="text-[11px] italic" style={{ color: "var(--muted-foreground)" }}>
                  {angle}
                </span>
              )}
            </div>
            <div className="space-y-2 p-4">
              {headline && (
                <div
                  className="text-[14px] font-bold leading-tight"
                  style={{ color: "var(--foreground)" }}
                >
                  {headline}
                </div>
              )}
              {primaryText && (
                <div
                  className="whitespace-pre-wrap text-[13px] leading-relaxed"
                  style={{ color: "color-mix(in oklab, var(--foreground) 85%, transparent)" }}
                >
                  {primaryText}
                </div>
              )}
              {description && (
                <div className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                  {description}
                </div>
              )}
              {cta && (
                <div
                  className="inline-flex items-center rounded-lg px-3 py-1 text-[12px] font-semibold"
                  style={{
                    background: "color-mix(in oklab, var(--primary) 12%, transparent)",
                    color: "var(--primary)",
                  }}
                >
                  {cta}
                </div>
              )}
            </div>
          </div>
        );
      })}
      {targeting && <Block title="Targeting notes">{targeting}</Block>}
    </div>
  );
}

function VslOut({ o }: { o: Record<string, unknown> }) {
  const hook = str(o.hook);
  const problem = str(o.problem_agitation);
  const solution = str(o.solution_reveal);
  const proof = str(o.proof_section);
  const offerStack = str(o.offer_stack);
  const guarantee = str(o.guarantee);
  const close = str(o.close_and_cta);
  const fullScript = str(o.full_script);
  const minutes = o.estimated_minutes ? num(o.estimated_minutes, 0) : 0;
  type VslSection = {
    title: string;
    content: string;
    accent?: "primary" | "warning" | "success" | "destructive" | "accent";
  };
  const sections: VslSection[] = (
    [
      { title: "Hook", content: hook, accent: "primary" },
      { title: "Problem agitation", content: problem, accent: "warning" },
      { title: "Solution reveal", content: solution, accent: "success" },
      { title: "Proof section", content: proof },
      { title: "Offer stack", content: offerStack, accent: "accent" },
      { title: "Guarantee", content: guarantee },
      { title: "Close & CTA", content: close, accent: "primary" },
    ] as VslSection[]
  ).filter((s) => s.content);
  return (
    <div className="space-y-3">
      {minutes > 0 && (
        <div
          className="rounded-xl p-3 text-center text-[13px] font-medium"
          style={{
            background: "var(--surface-2)",
            border: "1px solid color-mix(in oklab, var(--border) 70%, transparent)",
            color: "var(--muted-foreground)",
          }}
        >
          Estimated length:{" "}
          <span style={{ color: "var(--foreground)", fontWeight: 600 }}>{minutes} minutes</span>
        </div>
      )}
      {sections.map((s) => (
        <Block key={s.title} title={s.title} accent={s.accent}>
          <div className="whitespace-pre-wrap">{s.content}</div>
        </Block>
      ))}
      {fullScript && (
        <Block title="Full script">
          <div className="whitespace-pre-wrap text-[13px] leading-relaxed">{fullScript}</div>
        </Block>
      )}
    </div>
  );
}

function ColdEmailOut({ o }: { o: Record<string, unknown> }) {
  const subjects = arr(o.subject_lines);
  const emails = arr(o.emails);
  const followUp = str(o.follow_up_template);
  return (
    <div className="space-y-3">
      {subjects.length > 0 && (
        <Block title="Subject lines" accent="primary">
          <BulletList items={subjects} accent="primary" />
        </Block>
      )}
      {emails.map((e, i) => {
        const email = typeof e === "object" && e ? (e as Record<string, unknown>) : {};
        const angle = str(email.angle);
        const subject = str(email.subject);
        const body = str(email.body ?? email.content);
        const ps = str(email.ps_line ?? email.ps);
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
              }}
            >
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: "var(--muted-foreground)" }}
              >
                Variant {i + 1}
              </div>
              {angle && (
                <span className="text-[11px] italic" style={{ color: "var(--muted-foreground)" }}>
                  {angle}
                </span>
              )}
            </div>
            <div className="space-y-2 p-4">
              {subject && (
                <div className="text-[13.5px] font-semibold" style={{ color: "var(--foreground)" }}>
                  Subject: {subject}
                </div>
              )}
              {body && (
                <div
                  className="whitespace-pre-wrap text-[13px] leading-relaxed"
                  style={{ color: "color-mix(in oklab, var(--foreground) 85%, transparent)" }}
                >
                  {body}
                </div>
              )}
              {ps && (
                <div className="text-[12px] italic" style={{ color: "var(--muted-foreground)" }}>
                  P.S. {ps}
                </div>
              )}
            </div>
          </div>
        );
      })}
      {followUp && <Block title="Follow-up template">{followUp}</Block>}
    </div>
  );
}

function NicheValidatorOut({ o }: { o: Record<string, unknown> }) {
  const verdict = str(o.verdict);
  const demandScore = num(o.demand_score ?? o.demand, 0);
  const competitionScore = num(o.competition_score ?? o.competition, 0);
  const monetisationScore = num(o.monetisation_score ?? o.monetisation, 0);
  const overallScore = num(o.overall_score ?? o.score, 0);
  const strengths = arr(o.strengths);
  const risks = arr(o.risks);
  const subNiches = arr(o.sub_niches);
  const entry = str(o.recommended_entry);
  const verdictColor =
    verdict === "strong"
      ? "var(--success)"
      : verdict === "viable"
        ? "var(--primary)"
        : verdict === "risky"
          ? "var(--warning)"
          : "var(--destructive)";
  return (
    <div className="space-y-3">
      {(overallScore > 0 || verdict) && (
        <ScoreGauge
          value={overallScore}
          label={verdict ? `Verdict: ${verdict.toUpperCase()}` : "Overall score"}
        />
      )}
      {(demandScore > 0 || competitionScore > 0 || monetisationScore > 0) && (
        <div
          className="grid grid-cols-3 gap-2 rounded-xl p-3"
          style={{
            background: "var(--surface-2)",
            border: "1px solid color-mix(in oklab, var(--border) 70%, transparent)",
          }}
        >
          {[
            { label: "Demand", val: demandScore },
            { label: "Competition", val: competitionScore },
            { label: "Monetisation", val: monetisationScore },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div
                className="font-display text-[1.4rem] font-semibold tabular-nums"
                style={{ color: verdictColor }}
              >
                {s.val}
              </div>
              <div
                className="text-[10px] font-medium uppercase tracking-[0.08em]"
                style={{ color: "var(--muted-foreground)" }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}
      {strengths.length > 0 && (
        <Block title="Strengths" accent="success">
          <BulletList items={strengths} accent="success" />
        </Block>
      )}
      {risks.length > 0 && (
        <Block title="Risks" accent="warning">
          <BulletList items={risks} accent="warning" />
        </Block>
      )}
      {subNiches.length > 0 && (
        <Block title="Sub-niches to explore" accent="primary">
          <BulletList items={subNiches} accent="primary" />
        </Block>
      )}
      {entry && <Block title="Recommended entry">{entry}</Block>}
    </div>
  );
}

function IcpOut({ o }: { o: Record<string, unknown> }) {
  const primary = str(o.primary_icp);
  const demographics =
    typeof o.demographics === "object" && o.demographics
      ? (o.demographics as Record<string, unknown>)
      : null;
  const psychographics =
    typeof o.psychographics === "object" && o.psychographics
      ? (o.psychographics as Record<string, unknown>)
      : null;
  const painPoints = arr(o.pain_points);
  const goals = arr(o.goals);
  const triggers = arr(o.buying_triggers);
  const objections = arr(o.objections);
  const whereToFind = arr(o.where_to_find_them);
  const message = str(o.message_that_resonates);
  return (
    <div className="space-y-3">
      {primary && (
        <div
          className="overflow-hidden rounded-xl p-5"
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
            Primary ICP
          </div>
          <div
            className="text-[14px] font-semibold leading-snug"
            style={{ color: "var(--foreground)" }}
          >
            {primary}
          </div>
        </div>
      )}
      {demographics && (
        <Block title="Demographics">
          <div className="space-y-1">
            {Object.entries(demographics).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span
                  className="w-28 shrink-0 text-[11px] font-medium capitalize"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {k.replace(/_/g, " ")}
                </span>
                <span className="text-[13px]" style={{ color: "var(--foreground)" }}>
                  {str(v)}
                </span>
              </div>
            ))}
          </div>
        </Block>
      )}
      {psychographics && (
        <Block title="Psychographics">
          <div className="space-y-1">
            {Object.entries(psychographics).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span
                  className="w-28 shrink-0 text-[11px] font-medium capitalize"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {k.replace(/_/g, " ")}
                </span>
                <span className="text-[13px]" style={{ color: "var(--foreground)" }}>
                  {str(v)}
                </span>
              </div>
            ))}
          </div>
        </Block>
      )}
      {painPoints.length > 0 && (
        <Block title="Pain points" accent="destructive">
          <BulletList items={painPoints} accent="destructive" />
        </Block>
      )}
      {goals.length > 0 && (
        <Block title="Goals" accent="success">
          <BulletList items={goals} accent="success" />
        </Block>
      )}
      {triggers.length > 0 && (
        <Block title="Buying triggers" accent="primary">
          <BulletList items={triggers} accent="primary" />
        </Block>
      )}
      {objections.length > 0 && (
        <Block title="Objections" accent="warning">
          <BulletList items={objections} accent="warning" />
        </Block>
      )}
      {whereToFind.length > 0 && (
        <Block title="Where to find them">
          <BulletList items={whereToFind} accent="primary" />
        </Block>
      )}
      {message && (
        <Block title="Message that resonates" accent="accent">
          {message}
        </Block>
      )}
    </div>
  );
}

function PitchDeckOut({ o }: { o: Record<string, unknown> }) {
  const slides = arr(o.slides);
  const elevatorPitch = str(o.elevator_pitch);
  const oneLiner = str(o.one_line_summary ?? o.one_liner);
  return (
    <div className="space-y-3">
      {oneLiner && (
        <div
          className="rounded-xl p-4"
          style={{
            background: "color-mix(in oklab, var(--primary) 7%, var(--surface-2))",
            border: "1px solid color-mix(in oklab, var(--primary) 25%, transparent)",
            borderLeft: "3px solid var(--primary)",
          }}
        >
          <div
            className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-1.5"
            style={{ color: "var(--primary)" }}
          >
            One-liner
          </div>
          <div className="text-[14px] font-semibold" style={{ color: "var(--foreground)" }}>
            {oneLiner}
          </div>
        </div>
      )}
      {elevatorPitch && <Block title="Elevator pitch">{elevatorPitch}</Block>}
      {slides.map((s, i) => {
        const slide = typeof s === "object" && s ? (s as Record<string, unknown>) : {};
        const title = str(slide.title);
        const points = arr(slide.key_points);
        const notes = str(slide.speaker_notes);
        const num2 = slide.slide_number != null ? String(slide.slide_number) : String(i + 1);
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
              className="flex items-center gap-3 px-4 py-2.5"
              style={{
                borderBottom: "1px solid color-mix(in oklab, var(--border) 50%, transparent)",
              }}
            >
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                style={{
                  background: "color-mix(in oklab, var(--primary) 15%, transparent)",
                  color: "var(--primary)",
                }}
              >
                {num2}
              </span>
              <div className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>
                {title}
              </div>
            </div>
            <div className="p-4 space-y-2">
              {points.length > 0 && <BulletList items={points} accent="primary" />}
              {notes && (
                <div className="text-[11.5px] italic" style={{ color: "var(--muted-foreground)" }}>
                  {notes}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LeadMagnetOut({ o }: { o: Record<string, unknown> }) {
  const title = str(o.title);
  const subtitle = str(o.subtitle);
  const format = str(o.format);
  const sections = arr(o.sections);
  const optInHeadline = str(o.opt_in_headline);
  const optInSubtext = str(o.opt_in_subtext);
  const deliverySequence = arr(o.delivery_sequence);
  return (
    <div className="space-y-3">
      {(title || subtitle) && (
        <div
          className="rounded-xl p-5"
          style={{
            background: "color-mix(in oklab, var(--primary) 7%, var(--surface-2))",
            border: "1px solid color-mix(in oklab, var(--primary) 25%, transparent)",
            borderLeft: "3px solid var(--primary)",
          }}
        >
          {format && (
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-2"
              style={{ color: "var(--primary)" }}
            >
              {format}
            </div>
          )}
          {title && (
            <div
              className="text-[15px] font-bold leading-snug"
              style={{ color: "var(--foreground)" }}
            >
              {title}
            </div>
          )}
          {subtitle && (
            <div className="mt-1 text-[13px]" style={{ color: "var(--muted-foreground)" }}>
              {subtitle}
            </div>
          )}
        </div>
      )}
      {sections.map((s, i) => {
        const sec = typeof s === "object" && s ? (s as Record<string, unknown>) : {};
        const heading = str(sec.heading);
        const content = str(sec.content);
        return (
          <Block key={i} title={heading || `Section ${i + 1}`}>
            <div className="whitespace-pre-wrap">{content}</div>
          </Block>
        );
      })}
      {(optInHeadline || optInSubtext) && (
        <div
          className="rounded-xl p-4"
          style={{
            background: "color-mix(in oklab, var(--success) 6%, var(--surface-2))",
            border: "1px solid color-mix(in oklab, var(--success) 22%, transparent)",
          }}
        >
          <div
            className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-2"
            style={{ color: "var(--success)" }}
          >
            Opt-in copy
          </div>
          {optInHeadline && (
            <div className="text-[14px] font-bold" style={{ color: "var(--foreground)" }}>
              {optInHeadline}
            </div>
          )}
          {optInSubtext && (
            <div className="mt-1 text-[13px]" style={{ color: "var(--muted-foreground)" }}>
              {optInSubtext}
            </div>
          )}
        </div>
      )}
      {deliverySequence.length > 0 && (
        <Block title="Delivery sequence" accent="primary">
          <BulletList items={deliverySequence} accent="primary" />
        </Block>
      )}
    </div>
  );
}

function AutomationOut({ o }: { o: Record<string, unknown> }) {
  const name = str(o.workflow_name ?? o.name);
  const trigger = str(o.trigger);
  const steps = arr(o.steps);
  const integrations = arr(o.integrations_needed ?? o.integrations);
  const timeSaved = str(o.time_saved_per_week);
  const effort = str(o.implementation_effort);
  const effortColor =
    effort === "low"
      ? "var(--success)"
      : effort === "medium"
        ? "var(--warning)"
        : "var(--destructive)";
  return (
    <div className="space-y-3">
      {name && (
        <div
          className="rounded-xl p-4"
          style={{
            background: "color-mix(in oklab, var(--primary) 7%, var(--surface-2))",
            border: "1px solid color-mix(in oklab, var(--primary) 25%, transparent)",
            borderLeft: "3px solid var(--primary)",
          }}
        >
          <div
            className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-1"
            style={{ color: "var(--primary)" }}
          >
            Workflow
          </div>
          <div className="text-[14px] font-semibold" style={{ color: "var(--foreground)" }}>
            {name}
          </div>
        </div>
      )}
      {(timeSaved || effort) && (
        <div className="grid grid-cols-2 gap-2">
          {timeSaved && (
            <div
              className="rounded-xl p-3 text-center"
              style={{
                background: "var(--surface-2)",
                border: "1px solid color-mix(in oklab, var(--border) 70%, transparent)",
              }}
            >
              <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                Time saved/week
              </div>
              <div className="text-[14px] font-bold" style={{ color: "var(--success)" }}>
                {timeSaved}
              </div>
            </div>
          )}
          {effort && (
            <div
              className="rounded-xl p-3 text-center"
              style={{
                background: "var(--surface-2)",
                border: "1px solid color-mix(in oklab, var(--border) 70%, transparent)",
              }}
            >
              <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                Effort
              </div>
              <div className="text-[14px] font-bold capitalize" style={{ color: effortColor }}>
                {effort}
              </div>
            </div>
          )}
        </div>
      )}
      {trigger && <Block title="Trigger">{trigger}</Block>}
      {steps.length > 0 && (
        <div
          className="overflow-hidden rounded-xl"
          style={{
            background: "var(--surface-2)",
            border: "1px solid color-mix(in oklab, var(--border) 70%, transparent)",
          }}
        >
          <div
            className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{
              borderBottom: "1px solid color-mix(in oklab, var(--border) 50%, transparent)",
              color: "var(--muted-foreground)",
            }}
          >
            Steps
          </div>
          <div
            className="divide-y"
            style={{ borderColor: "color-mix(in oklab, var(--border) 50%, transparent)" }}
          >
            {steps.map((s, i) => {
              const step = typeof s === "object" && s ? (s as Record<string, unknown>) : {};
              const action = str(step.action ?? step.step ?? s);
              const tool2 = str(step.tool);
              const notes = str(step.notes);
              return (
                <div key={i} className="flex gap-3 px-4 py-2.5">
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{
                      background: "color-mix(in oklab, var(--primary) 12%, transparent)",
                      color: "var(--primary)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13px]" style={{ color: "var(--foreground)" }}>
                      {action}
                    </div>
                    {tool2 && (
                      <div className="text-[11px] font-medium" style={{ color: "var(--primary)" }}>
                        {tool2}
                      </div>
                    )}
                    {notes && (
                      <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                        {notes}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {integrations.length > 0 && (
        <Block title="Integrations needed">
          <div className="flex flex-wrap gap-1.5">
            {integrations.map((int, i) => (
              <span
                key={i}
                className="rounded-full px-2.5 py-0.5 text-[11.5px] font-medium"
                style={{
                  background: "color-mix(in oklab, var(--primary) 10%, transparent)",
                  border: "1px solid color-mix(in oklab, var(--primary) 25%, transparent)",
                  color: "var(--primary)",
                }}
              >
                {typeof int === "string" ? int : str(int)}
              </span>
            ))}
          </div>
        </Block>
      )}
    </div>
  );
}

function ClientReportOut({ o }: { o: Record<string, unknown> }) {
  const title = str(o.report_title ?? o.title);
  const period = str(o.period);
  const summary = str(o.executive_summary ?? o.summary);
  const metrics = arr(o.key_metrics ?? o.metrics);
  const wins = arr(o.wins);
  const improvements = arr(o.improvements);
  const nextSteps = arr(o.next_steps);
  return (
    <div className="space-y-3">
      {(title || period) && (
        <div
          className="rounded-xl p-5"
          style={{
            background: "color-mix(in oklab, var(--primary) 7%, var(--surface-2))",
            border: "1px solid color-mix(in oklab, var(--primary) 25%, transparent)",
            borderLeft: "3px solid var(--primary)",
          }}
        >
          {period && (
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-1"
              style={{ color: "var(--primary)" }}
            >
              {period}
            </div>
          )}
          {title && (
            <div className="text-[15px] font-bold" style={{ color: "var(--foreground)" }}>
              {title}
            </div>
          )}
        </div>
      )}
      {summary && <Block title="Executive summary">{summary}</Block>}
      {metrics.length > 0 && (
        <div
          className="overflow-hidden rounded-xl"
          style={{
            background: "var(--surface-2)",
            border: "1px solid color-mix(in oklab, var(--border) 70%, transparent)",
          }}
        >
          <div
            className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{
              borderBottom: "1px solid color-mix(in oklab, var(--border) 50%, transparent)",
              color: "var(--muted-foreground)",
            }}
          >
            Key metrics
          </div>
          <div
            className="divide-y p-1"
            style={{ borderColor: "color-mix(in oklab, var(--border) 50%, transparent)" }}
          >
            {metrics.map((m, i) => {
              const metric = typeof m === "object" && m ? (m as Record<string, unknown>) : {};
              const name = str(metric.name ?? metric.metric ?? m);
              const value = str(metric.value ?? metric.result);
              const change = str(metric.change ?? metric.delta);
              return (
                <div key={i} className="flex items-center justify-between px-3 py-2">
                  <span className="text-[13px]" style={{ color: "var(--foreground)" }}>
                    {name}
                  </span>
                  <div className="flex items-center gap-2">
                    {value && (
                      <span
                        className="font-mono text-[13px] font-semibold"
                        style={{ color: "var(--foreground)" }}
                      >
                        {value}
                      </span>
                    )}
                    {change && (
                      <span
                        className="text-[11px]"
                        style={{
                          color: change.startsWith("-") ? "var(--destructive)" : "var(--success)",
                        }}
                      >
                        {change}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {wins.length > 0 && (
        <Block title="Wins this period" accent="success">
          <BulletList items={wins} accent="success" />
        </Block>
      )}
      {improvements.length > 0 && (
        <Block title="Areas for improvement" accent="warning">
          <BulletList items={improvements} accent="warning" />
        </Block>
      )}
      {nextSteps.length > 0 && (
        <Block title="Next steps" accent="primary">
          <BulletList items={nextSteps} accent="primary" />
        </Block>
      )}
    </div>
  );
}

function NicheScorerOut({ o }: { o: Record<string, unknown> }) {
  const score = num(o.score ?? o.overall_score, 0);
  const dimensions = arr(o.dimension_breakdown ?? o.dimensions ?? o.breakdown);
  const confidence = str(o.confidence);
  const recommendation = str(o.recommendation);
  const fullReport = str(o.full_report);
  const confidenceColor = confidence.toLowerCase().startsWith("high")
    ? "var(--success)"
    : confidence.toLowerCase().startsWith("med")
      ? "var(--primary)"
      : confidence.toLowerCase().startsWith("low")
        ? "var(--warning)"
        : "var(--muted-foreground)";
  return (
    <div className="space-y-3">
      <ScoreGauge value={score} label="Niche opportunity score" />
      {dimensions.length > 0 && (
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
            Dimension breakdown
          </div>
          <div
            className="divide-y"
            style={{ borderColor: "color-mix(in oklab, var(--border) 50%, transparent)" }}
          >
            {dimensions.map((d, i) => {
              const item =
                typeof d === "object" && d
                  ? (d as Record<string, unknown>)
                  : { dimension: String(d) };
              const label = str(item.dimension ?? item.name ?? item.category ?? item.criterion);
              const sc = num(item.score, 0);
              const note = str(item.notes ?? item.rationale ?? item.note ?? item.detail);
              const pct = Math.min(100, (sc / 25) * 100);
              const color =
                pct >= 70 ? "var(--success)" : pct >= 40 ? "var(--primary)" : "var(--warning)";
              return (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className="text-[12.5px] font-medium"
                      style={{ color: "var(--foreground)" }}
                    >
                      {label}
                    </span>
                    <span className="font-mono text-[12px] font-semibold" style={{ color }}>
                      {sc}/25
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
      {confidence && (
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-2.5"
          style={{
            background: "var(--surface-2)",
            border: "1px solid color-mix(in oklab, var(--border) 70%, transparent)",
          }}
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Confidence
          </span>
          <span className="text-[12.5px] font-semibold" style={{ color: confidenceColor }}>
            {confidence}
          </span>
        </div>
      )}
      {recommendation && (
        <Block title="Recommendation" accent="primary">
          {recommendation}
        </Block>
      )}
      {fullReport && score === 0 && dimensions.length === 0 && (
        <Block title="Niche Score Report">
          <MarkdownReport content={fullReport} />
        </Block>
      )}
    </div>
  );
}

function PositioningEngineOut({ o }: { o: Record<string, unknown> }) {
  const statement = str(o.positioning_statement ?? o.statement);
  const categoryFrame = str(o.category_frame ?? o.category);
  const alternatives = arr(o.against_alternatives ?? o.alternatives ?? o.against_the_alternatives);
  const proofPoints = arr(o.proof_points ?? o.proofs);
  const pillars = arr(o.messaging_pillars ?? o.pillars);
  const fullReport = str(o.full_report);
  return (
    <div className="space-y-3">
      {statement && (
        <div
          className="overflow-hidden rounded-xl"
          style={{
            background: "color-mix(in oklab, var(--primary) 6%, var(--surface-2))",
            border: "1px solid color-mix(in oklab, var(--primary) 25%, transparent)",
            borderLeft: "3px solid var(--primary)",
          }}
        >
          <div
            className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--primary)" }}
          >
            Positioning statement
          </div>
          <div
            className="px-4 pb-4 text-[14px] leading-relaxed italic"
            style={{ color: "var(--foreground)" }}
          >
            "{statement}"
          </div>
        </div>
      )}
      {categoryFrame && (
        <Block title="Category frame" accent="accent">
          {categoryFrame}
        </Block>
      )}
      {alternatives.length > 0 && (
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
            Against the alternatives
          </div>
          <div
            className="divide-y"
            style={{ borderColor: "color-mix(in oklab, var(--border) 50%, transparent)" }}
          >
            {alternatives.map((alt, i) => {
              const item =
                typeof alt === "object" && alt
                  ? (alt as Record<string, unknown>)
                  : { name: String(alt) };
              const name = str(item.name ?? item.alternative ?? item.competitor);
              const youWin = str(item.where_you_win ?? item.you_win ?? item.win ?? item.advantage);
              const theyWin = str(
                item.where_they_win ?? item.they_win ?? item.concession ?? item.weakness,
              );
              return (
                <div key={i} className="px-4 py-3">
                  <div
                    className="text-[12.5px] font-semibold mb-1.5"
                    style={{ color: "var(--foreground)" }}
                  >
                    {name}
                  </div>
                  {youWin && (
                    <div className="text-[11.5px] mb-1">
                      <span className="font-medium" style={{ color: "var(--success)" }}>
                        Where you win:{" "}
                      </span>
                      <span style={{ color: "var(--foreground)" }}>{youWin}</span>
                    </div>
                  )}
                  {theyWin && (
                    <div className="text-[11.5px]">
                      <span className="font-medium" style={{ color: "var(--muted-foreground)" }}>
                        Where they win:{" "}
                      </span>
                      <span style={{ color: "var(--muted-foreground)" }}>{theyWin}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {proofPoints.length > 0 && (
        <Block title="Proof points" accent="success">
          <BulletList items={proofPoints} accent="success" />
        </Block>
      )}
      {pillars.length > 0 && (
        <Block title="Messaging pillars" accent="primary">
          <BulletList items={pillars} accent="primary" />
        </Block>
      )}
      {fullReport && !statement && (
        <Block title="Positioning Report">
          <MarkdownReport content={fullReport} />
        </Block>
      )}
    </div>
  );
}

function MvpPlannerOut({ o }: { o: Record<string, unknown> }) {
  const scope = arr(o.mvp_scope ?? o.scope ?? o.must_haves);
  const cutList = arr(o.cut_list ?? o.cuts ?? o.not_yet);
  const sequence = arr(o.build_sequence ?? o.phases ?? o.sequence);
  const milestones = arr(o.validation_milestones ?? o.milestones ?? o.checkpoints);
  const techRec = str(o.tech_recommendation ?? o.tech_stack ?? o.stack);
  const fullReport = str(o.full_report);
  return (
    <div className="space-y-3">
      {scope.length > 0 && (
        <Block title="MVP scope — must have" accent="success">
          <BulletList items={scope} accent="success" />
        </Block>
      )}
      {cutList.length > 0 && (
        <Block title="Cut list — don't build yet" accent="warning">
          <BulletList items={cutList} accent="warning" />
        </Block>
      )}
      {sequence.length > 0 && (
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
            Build sequence
          </div>
          <div
            className="divide-y"
            style={{ borderColor: "color-mix(in oklab, var(--border) 50%, transparent)" }}
          >
            {sequence.map((ph, i) => {
              const item =
                typeof ph === "object" && ph
                  ? (ph as Record<string, unknown>)
                  : { phase: String(ph) };
              const phaseName = str(item.phase ?? item.name ?? item.title);
              const what = str(
                item.what_to_build ?? item.description ?? item.deliverable ?? item.build,
              );
              const done = str(item.done_looks_like ?? item.done ?? item.success ?? item.goal);
              return (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold font-mono"
                      style={{ background: "rgba(249,115,22,0.12)", color: "var(--primary)" }}
                    >
                      {i + 1}
                    </span>
                    <span
                      className="text-[12.5px] font-semibold"
                      style={{ color: "var(--foreground)" }}
                    >
                      {phaseName}
                    </span>
                  </div>
                  {what && (
                    <div className="ml-7 text-[11.5px] mb-1" style={{ color: "var(--foreground)" }}>
                      {what}
                    </div>
                  )}
                  {done && (
                    <div className="ml-7 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                      ✓ Done when: {done}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {milestones.length > 0 && (
        <Block title="Validation milestones" accent="primary">
          <BulletList items={milestones} accent="primary" />
        </Block>
      )}
      {techRec && (
        <Block title="Tech recommendation" accent="accent">
          {techRec}
        </Block>
      )}
      {fullReport && scope.length === 0 && sequence.length === 0 && (
        <Block title="MVP / Build Plan">
          <MarkdownReport content={fullReport} />
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
