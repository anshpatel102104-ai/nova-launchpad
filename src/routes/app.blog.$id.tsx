import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  ArrowLeft,
  Copy,
  Download,
  Clock,
  Check,
  BookOpen,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/app/blog/$id")({
  component: BlogReaderPage,
  notFoundComponent: () => (
    <div className="p-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
      Blog post not found.{" "}
      <Link to="/app/blog" className="underline">
        Back to posts
      </Link>
    </div>
  ),
});

type BlogOutput = {
  title?: string;
  meta_description?: string;
  body_markdown?: string;
  body?: string;
  suggested_tags?: unknown[];
  readability_score?: number;
  reading_time_minutes?: number;
  primary_keyword?: string;
  cta?: string;
};

function BlogReaderPage() {
  const { id } = Route.useParams();
  const { currentOrgId } = useAuth();

  const [run, setRun] = useState<{
    id: string;
    created_at: string;
    output: BlogOutput | null;
    input: Record<string, unknown>;
    tool_key: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id || !currentOrgId) return;
    setLoading(true);
    supabase
      .from("tool_runs")
      .select("id, created_at, output, input, tool_key")
      .eq("id", id)
      .eq("organization_id", currentOrgId)
      .maybeSingle()
      .then(({ data, error }) => {
        setLoading(false);
        if (error || !data) {
          throw notFound();
        }
        setRun(data as typeof run);
      });
  }, [id, currentOrgId]);

  const o = run?.output ?? {};
  const title = str(o.title) || str(run?.input?.title) || "Untitled";
  const meta = str(o.meta_description);
  const body = str(o.body_markdown ?? o.body);
  const tags = arr(o.suggested_tags);
  const score = num(o.readability_score);
  const mins = num(o.reading_time_minutes);
  const keyword = str(o.primary_keyword);
  const cta = str(o.cta);

  const handleCopy = () => {
    const text = [`# ${title}`, meta && `_${meta}_`, "", body, "", cta && `**CTA:** ${cta}`]
      .filter(Boolean)
      .join("\n");
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      },
      () => toast.error("Copy failed"),
    );
  };

  const handleDownload = () => {
    const md = [`# ${title}`, meta && `> ${meta}`, "", body, "", cta && `---\n**CTA:** ${cta}`]
      .filter(Boolean)
      .join("\n");
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-4 w-40 rounded" />
        <Skeleton className="h-10 w-3/4 rounded" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-5/6 rounded" />
        <div className="space-y-3 pt-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-4 w-full rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!run) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
        <Link
          to="/app/blog"
          className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Blog Posts
        </Link>
        <span style={{ opacity: 0.4 }}>/</span>
        <span
          className="max-w-[200px] truncate"
          style={{ color: "var(--foreground)" }}
          title={title}
        >
          {title}
        </span>
      </div>

      {/* Article card */}
      <article
        className="overflow-hidden rounded-2xl"
        style={{
          background: "var(--surface)",
          border: "1px solid rgba(59,130,246,0.12)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        }}
      >
        {/* Top neon bar */}
        <div
          className="h-0.5"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--primary), var(--accent), transparent)",
          }}
        />

        {/* Header */}
        <div
          className="space-y-4 px-8 py-6"
          style={{ borderBottom: "1px solid color-mix(in oklab, var(--border) 60%, transparent)" }}
        >
          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2">
            {score > 0 && (
              <ScorePill score={score} />
            )}
            {mins > 0 && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px]"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--muted-foreground)",
                }}
              >
                <Clock className="h-3 w-3" /> {mins} min read
              </span>
            )}
            {keyword && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px]"
                style={{
                  background: "color-mix(in oklab, var(--accent) 8%, transparent)",
                  border: "1px solid color-mix(in oklab, var(--accent) 20%, transparent)",
                  color: "var(--accent)",
                }}
              >
                <Tag className="h-3 w-3" /> {keyword}
              </span>
            )}
            <span
              className="ml-auto text-[11px]"
              style={{ color: "var(--muted-foreground)" }}
            >
              {new Date(run.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>

          {/* Title */}
          <h1
            className="font-display text-[1.9rem] font-bold leading-tight tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            {title}
          </h1>

          {/* Meta description */}
          {meta && (
            <p
              className="text-[14.5px] leading-relaxed"
              style={{
                color: "var(--muted-foreground)",
                borderLeft: "3px solid color-mix(in oklab, var(--primary) 50%, transparent)",
                paddingLeft: "1rem",
              }}
            >
              {meta}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--muted-foreground)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
                (e.currentTarget as HTMLElement).style.background = "color-mix(in oklab, var(--surface-2) 80%, var(--primary))";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
                (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
              }}
            >
              {copied ? (
                <><Check className="h-3.5 w-3.5 text-[color:var(--success)]" /> Copied</>
              ) : (
                <><Copy className="h-3.5 w-3.5" /> Copy markdown</>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--muted-foreground)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
                (e.currentTarget as HTMLElement).style.background = "color-mix(in oklab, var(--surface-2) 80%, var(--primary))";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
                (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
              }}
            >
              <Download className="h-3.5 w-3.5" /> Download .md
            </button>
          </div>
        </div>

        {/* Body */}
        {body ? (
          <div className="px-8 py-7">
            <MarkdownBody text={body} />
          </div>
        ) : (
          <div
            className="flex flex-col items-center gap-2 px-8 py-16 text-center"
            style={{ color: "var(--muted-foreground)" }}
          >
            <BookOpen className="h-8 w-8 opacity-30" />
            <p className="text-[13px]">No body content available for this post.</p>
          </div>
        )}

        {/* CTA block */}
        {cta && (
          <div
            className="mx-8 mb-7 rounded-xl p-4"
            style={{
              background: "color-mix(in oklab, var(--accent) 6%, var(--surface-2))",
              border: "1px solid color-mix(in oklab, var(--accent) 20%, transparent)",
              borderLeft: "3px solid var(--accent)",
            }}
          >
            <div
              className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: "var(--accent)" }}
            >
              Call to action
            </div>
            <div className="text-[13.5px] leading-relaxed" style={{ color: "var(--foreground)" }}>
              {cta}
            </div>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div
            className="flex flex-wrap items-center gap-2 px-8 pb-7"
          >
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: "var(--muted-foreground)" }}
            >
              Tags
            </span>
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
        )}
      </article>

      {/* Footer action */}
      <div className="flex items-center justify-between pb-6">
        <Link
          to="/app/blog"
          className="inline-flex items-center gap-1.5 text-[12.5px] transition-colors hover:text-foreground"
          style={{ color: "var(--muted-foreground)" }}
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All posts
        </Link>
        <Link
          to="/app/launchpad/$tool"
          params={{ tool: "blog" }}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12.5px] font-semibold text-white"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
        >
          Generate another post
        </Link>
      </div>
    </div>
  );
}

/* ── Readability score pill ── */
function ScorePill({ score }: { score: number }) {
  const color =
    score >= 70 ? "var(--success)" : score >= 50 ? "var(--primary)" : "var(--warning)";
  const bg =
    score >= 70
      ? "color-mix(in oklab, var(--success) 12%, transparent)"
      : score >= 50
        ? "color-mix(in oklab, var(--primary) 12%, transparent)"
        : "color-mix(in oklab, var(--warning) 12%, transparent)";
  const border =
    score >= 70
      ? "color-mix(in oklab, var(--success) 25%, transparent)"
      : score >= 50
        ? "color-mix(in oklab, var(--primary) 25%, transparent)"
        : "color-mix(in oklab, var(--warning) 25%, transparent)";

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ background: bg, border: `1px solid ${border}`, color }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color }}
      />
      {score}/100 readability
    </span>
  );
}

/* ── Inline markdown renderer (no library) ── */
function MarkdownBody({ text }: { text: string }) {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^### /.test(line)) {
      nodes.push(<H3 key={i}>{inlineFormat(line.slice(4))}</H3>);
      i++;
    } else if (/^## /.test(line)) {
      nodes.push(<H2 key={i}>{inlineFormat(line.slice(3))}</H2>);
      i++;
    } else if (/^# /.test(line)) {
      nodes.push(<H1 key={i}>{inlineFormat(line.slice(2))}</H1>);
      i++;
    } else if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <ul key={`ul-${i}`} className="my-3 space-y-1.5 pl-4">
          {items.map((it, j) => (
            <li key={j} className="flex gap-2.5 text-[14px] leading-relaxed" style={{ color: "color-mix(in oklab, var(--foreground) 88%, transparent)" }}>
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--muted-foreground)", flexShrink: 0 }} />
              <span>{inlineFormat(it)}</span>
            </li>
          ))}
        </ul>,
      );
    } else if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      let n = 1;
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
        n++;
      }
      nodes.push(
        <ol key={`ol-${i}`} className="my-3 space-y-1.5 pl-4 list-decimal">
          {items.map((it, j) => (
            <li key={j} className="text-[14px] leading-relaxed pl-1" style={{ color: "color-mix(in oklab, var(--foreground) 88%, transparent)" }}>
              {inlineFormat(it)}
            </li>
          ))}
        </ol>,
      );
      void n;
    } else if (/^---$/.test(line.trim())) {
      nodes.push(
        <hr key={i} className="my-5" style={{ borderColor: "color-mix(in oklab, var(--border) 60%, transparent)" }} />,
      );
      i++;
    } else if (line.trim() === "") {
      nodes.push(<div key={i} className="h-4" />);
      i++;
    } else {
      nodes.push(
        <p key={i} className="text-[14px] leading-[1.8] my-1" style={{ color: "color-mix(in oklab, var(--foreground) 88%, transparent)" }}>
          {inlineFormat(line)}
        </p>,
      );
      i++;
    }
  }

  return <div className="prose-blog">{nodes}</div>;
}

function H1({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-6 mb-3 font-display text-[1.4rem] font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
      {children}
    </h2>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-5 mb-2 font-display text-[1.15rem] font-semibold" style={{ color: "var(--foreground)" }}>
      {children}
    </h3>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mt-4 mb-1.5 text-[1rem] font-semibold" style={{ color: "var(--foreground)" }}>
      {children}
    </h4>
  );
}

function inlineFormat(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return (
        <strong key={i} style={{ color: "var(--foreground)", fontWeight: 600 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (/^\*[^*]+\*$/.test(part)) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (/^`[^`]+`$/.test(part)) {
      return (
        <code
          key={i}
          className="rounded px-1 py-0.5 font-mono text-[12.5px]"
          style={{
            background: "var(--surface-2)",
            color: "var(--primary)",
            border: "1px solid var(--border)",
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

const str = (v: unknown): string =>
  typeof v === "string" ? v : v == null ? "" : JSON.stringify(v);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const num = (v: unknown, fallback = 0): number => (typeof v === "number" ? v : fallback);
