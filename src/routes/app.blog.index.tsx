import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { toolRunsQuery } from "@/lib/queries";
import { ArrowRight, BookOpen, PenLine, Clock } from "lucide-react";
import { EmptyState } from "@/components/app/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/app/blog/")({ component: BlogIndexPage });

type BlogRun = {
  id: string;
  created_at: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  status: string;
};

function BlogIndexPage() {
  const { currentOrgId } = useAuth();
  const q = useQuery({ ...toolRunsQuery(currentOrgId ?? "", 200), enabled: !!currentOrgId });

  const posts = useMemo(
    () =>
      ((q.data ?? []) as BlogRun[]).filter(
        (r) =>
          (r as unknown as { tool_key: string }).tool_key === "blog" && r.status === "succeeded",
      ),
    [q.data],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <h1
            className="font-display text-[1.75rem] font-semibold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            Blog Posts
          </h1>
          <p
            className="mt-1 max-w-xl text-[13.5px] leading-relaxed"
            style={{ color: "var(--muted-foreground)" }}
          >
            All blog posts you've generated. Click any post to open the full reader view.
          </p>
        </div>
        <Link
          to="/app/launchpad/$tool"
          params={{ tool: "blog" }}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition"
          style={{
            background: "linear-gradient(135deg, var(--primary), var(--accent))",
            boxShadow: "0 4px 16px color-mix(in oklab, var(--primary) 30%, transparent)",
            width: "fit-content",
          }}
        >
          <PenLine className="h-3.5 w-3.5" /> New post
        </Link>
      </div>

      {/* Loading */}
      {q.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl p-5 space-y-3"
              style={{
                background: "var(--surface)",
                border: "1px solid color-mix(in oklab, var(--border) 70%, transparent)",
              }}
            >
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-5/6 rounded" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!q.isLoading && posts.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="No blog posts yet"
          description="Use the Blog Post Generator to create your first SEO-optimized article."
          action={
            <Link
              to="/app/launchpad/$tool"
              params={{ tool: "blog" }}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12.5px] font-semibold text-white"
              style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
            >
              Generate a post <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
      )}

      {/* Grid */}
      {posts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const out = post.output ?? {};
            const title =
              str(out.title) || str((post.input as Record<string, unknown>).title) || "Untitled";
            const meta = str(out.meta_description);
            const score = num(out.readability_score);
            const tags = arr(out.suggested_tags).slice(0, 3);
            const mins = num(out.reading_time_minutes);
            return (
              <Link
                key={post.id}
                to="/app/blog/$id"
                params={{ id: post.id }}
                className="group flex flex-col overflow-hidden rounded-2xl transition-all duration-200"
                style={{
                  background: "var(--surface)",
                  border: "1px solid color-mix(in oklab, var(--border) 70%, transparent)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.border =
                    "1px solid color-mix(in oklab, var(--primary) 35%, transparent)";
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 4px 24px color-mix(in oklab, var(--primary) 12%, transparent)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.border =
                    "1px solid color-mix(in oklab, var(--border) 70%, transparent)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.3)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                {/* Top gradient bar */}
                <div
                  className="h-0.5"
                  style={{
                    background: "linear-gradient(90deg, var(--primary), var(--accent))",
                    opacity: 0,
                    transition: "opacity 0.2s",
                  }}
                  ref={(el) => {
                    if (!el) return;
                    const parent = el.closest("a");
                    if (!parent) return;
                    parent.addEventListener("mouseenter", () => (el.style.opacity = "1"));
                    parent.addEventListener("mouseleave", () => (el.style.opacity = "0"));
                  }}
                />

                <div className="flex flex-1 flex-col p-5">
                  <h2
                    className="line-clamp-2 font-display text-[15px] font-semibold leading-snug tracking-tight transition-colors group-hover:text-[var(--primary)]"
                    style={{ color: "var(--foreground)" }}
                  >
                    {title}
                  </h2>

                  {meta && (
                    <p
                      className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {meta}
                    </p>
                  )}

                  <div className="mt-auto pt-4 flex flex-wrap items-center gap-1.5">
                    {score > 0 && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                        style={{
                          background:
                            score >= 70
                              ? "color-mix(in oklab, var(--success) 12%, transparent)"
                              : score >= 50
                                ? "color-mix(in oklab, var(--primary) 12%, transparent)"
                                : "color-mix(in oklab, var(--warning) 12%, transparent)",
                          color:
                            score >= 70
                              ? "var(--success)"
                              : score >= 50
                                ? "var(--primary)"
                                : "var(--warning)",
                          border: `1px solid ${score >= 70 ? "color-mix(in oklab, var(--success) 25%, transparent)" : score >= 50 ? "color-mix(in oklab, var(--primary) 25%, transparent)" : "color-mix(in oklab, var(--warning) 25%, transparent)"}`,
                        }}
                      >
                        {score}/100 readability
                      </span>
                    )}
                    {mins > 0 && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px]"
                        style={{
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          color: "var(--muted-foreground)",
                        }}
                      >
                        <Clock className="h-2.5 w-2.5" /> {mins} min
                      </span>
                    )}
                    {tags.map((t, i) => (
                      <span
                        key={i}
                        className="rounded-full px-2 py-0.5 text-[10.5px]"
                        style={{
                          background: "color-mix(in oklab, var(--accent) 10%, transparent)",
                          border: "1px solid color-mix(in oklab, var(--accent) 20%, transparent)",
                          color: "var(--accent)",
                        }}
                      >
                        {typeof t === "string" ? t : ""}
                      </span>
                    ))}
                  </div>

                  <div
                    className="mt-3 flex items-center justify-between text-[11px]"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    <span className="inline-flex items-center gap-1 transition-colors group-hover:text-[color:var(--primary)]">
                      Read <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

const str = (v: unknown): string =>
  typeof v === "string" ? v : v == null ? "" : JSON.stringify(v);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const num = (v: unknown, fallback = 0): number => (typeof v === "number" ? v : fallback);
