import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Shield,
  Users,
  Building2,
  CreditCard,
  Activity,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  ArrowUpRight,
  Crown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/app/admin")({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/auth/sign-in" });
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!data) throw redirect({ to: "/app/dashboard" });
  },
  component: AdminHub,
});

type TabKey = "overview" | "users" | "orgs" | "subs" | "runs";

const PLAN_COLORS: Record<string, string> = {
  starter: "bg-surface-offset text-foreground/70",
  launch: "bg-primary/15 text-primary",
  operate: "bg-accent/15 text-accent",
  scale: "bg-warning/15 text-warning",
};

function AdminHub() {
  const [tab, setTab] = useState<TabKey>("overview");
  const [search, setSearch] = useState("");

  const profilesQ = useQuery({
    queryKey: ["admin", "profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, onboarding_complete, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const orgsQ = useQuery({
    queryKey: ["admin", "orgs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, owner_id, stage, business_type, niche, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const subsQ = useQuery({
    queryKey: ["admin", "subs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select(
          "id, organization_id, plan, status, current_period_end, stripe_customer_id, created_at",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const runsQ = useQuery({
    queryKey: ["admin", "runs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tool_runs")
        .select("id, tool_key, status, organization_id, user_id, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const rolesQ = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      return data ?? [];
    },
  });

  const profiles = profilesQ.data ?? [];
  const orgs = orgsQ.data ?? [];
  const subs = subsQ.data ?? [];
  const runs = runsQ.data ?? [];
  const roles = rolesQ.data ?? [];

  const adminIds = useMemo(
    () => new Set(roles.filter((r) => r.role === "admin").map((r) => r.user_id)),
    [roles],
  );
  const orgById = useMemo(() => new Map(orgs.map((o) => [o.id, o])), [orgs]);
  const profileById = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  // Stats
  const totalUsers = profiles.length;
  const onboardedUsers = profiles.filter((p) => p.onboarding_complete).length;
  const totalOrgs = orgs.length;
  const paidSubs = subs.filter((s) => s.plan !== "starter" && s.status === "active").length;
  const PLAN_PRICES = { starter: 0, launch: 49, operate: 149, scale: 299 } as const;
  const mrr = subs
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + (PLAN_PRICES[s.plan as keyof typeof PLAN_PRICES] ?? 0), 0);
  const succeededRuns = runs.filter((r) => r.status === "succeeded").length;
  const last7d = runs.filter(
    (r) => Date.now() - new Date(r.created_at).getTime() < 7 * 86400e3,
  ).length;

  // Plan distribution
  const planCounts = subs.reduce<Record<string, number>>((acc, s) => {
    acc[s.plan] = (acc[s.plan] ?? 0) + 1;
    return acc;
  }, {});

  // Tool usage breakdown
  const toolCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of runs) m.set(r.tool_key, (m.get(r.tool_key) ?? 0) + 1);
    return Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [runs]);

  const filteredProfiles = profiles.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (p.email ?? "").toLowerCase().includes(q) || (p.full_name ?? "").toLowerCase().includes(q)
    );
  });
  const filteredOrgs = orgs.filter(
    (o) => !search || o.name.toLowerCase().includes(search.toLowerCase()),
  );

  const tabs: {
    key: TabKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }[] = [
    { key: "overview", label: "Overview", icon: Activity },
    { key: "users", label: "Users", icon: Users, count: totalUsers },
    { key: "orgs", label: "Workspaces", icon: Building2, count: totalOrgs },
    { key: "subs", label: "Subscriptions", icon: CreditCard, count: subs.length },
    { key: "runs", label: "Tool runs", icon: TrendingUp, count: runs.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-2.5 py-0.5 text-[10.5px] font-semibold text-warning">
              <Shield className="h-3 w-3" /> Admin
            </span>
            <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-[10.5px] font-medium text-muted-foreground">
              Platform-wide
            </span>
          </div>
          <h1 className="mt-3 font-display text-[1.75rem] font-semibold tracking-tight md:text-[2rem]">
            Admin Hub
          </h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            Operate the platform — users, workspaces, billing, and live activity.
          </p>
        </div>
      </section>

      {/* Stat row */}
      <section className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <AdminStat
          label="Total users"
          value={totalUsers}
          sub={`${onboardedUsers} onboarded`}
          icon={Users}
          accent="primary"
        />
        <AdminStat
          label="Workspaces"
          value={totalOrgs}
          sub={`${paidSubs} on paid plans`}
          icon={Building2}
          accent="primary"
        />
        <AdminStat
          label="Estimated MRR"
          value={`$${mrr.toLocaleString()}`}
          sub={`${paidSubs} active paid`}
          icon={CreditCard}
          accent="secondary"
        />
        <AdminStat
          label="Tool runs"
          value={succeededRuns}
          sub={`${last7d} in last 7d`}
          icon={TrendingUp}
          accent="secondary"
        />
      </section>

      {/* Tabs */}
      <section className="rounded-lg border border-border bg-surface shadow-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-2 py-2">
          <div className="flex flex-wrap gap-0.5">
            {tabs.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium transition",
                    active
                      ? "bg-surface-2 text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground",
                  )}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                  {typeof t.count === "number" && (
                    <span
                      className={cn(
                        "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                        active
                          ? "bg-primary/15 text-primary"
                          : "bg-surface-offset text-muted-foreground",
                      )}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {tab !== "overview" && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="h-8 pl-8 text-[12.5px]"
              />
            </div>
          )}
        </div>

        {/* Tab content */}
        {tab === "overview" && (
          <div className="grid gap-4 p-4 lg:grid-cols-2">
            {/* Plan distribution */}
            <div className="rounded-md border border-border bg-surface-2/40 p-4">
              <div className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
                Plan distribution
              </div>
              <div className="mt-3 space-y-2.5">
                {(["starter", "launch", "operate", "scale"] as const).map((p) => {
                  const count = planCounts[p] ?? 0;
                  const total = subs.length || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={p}>
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="capitalize font-medium">{p}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {count} · {pct}%
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-offset">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            p === "starter" && "bg-muted-foreground/40",
                            p === "launch" && "bg-primary",
                            p === "operate" && "bg-accent",
                            p === "scale" && "bg-warning",
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top tools */}
            <div className="rounded-md border border-border bg-surface-2/40 p-4">
              <div className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
                Top tools
              </div>
              <div className="mt-3 space-y-2">
                {toolCounts.length === 0 && (
                  <div className="text-[12px] text-muted-foreground">No runs yet.</div>
                )}
                {toolCounts.map(([key, count]) => {
                  const max = toolCounts[0][1];
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className="w-40 truncate text-[12.5px] font-medium">
                        {key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </div>
                      <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-surface-offset">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(count / max) * 100}%` }}
                        />
                      </div>
                      <div className="w-8 text-right text-[11.5px] tabular-nums text-muted-foreground">
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent activity */}
            <div className="lg:col-span-2 rounded-md border border-border bg-surface-2/40 p-4">
              <div className="flex items-center justify-between">
                <div className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
                  Live activity
                </div>
                <button
                  onClick={() => setTab("runs")}
                  className="text-[11.5px] text-primary hover:underline inline-flex items-center gap-1"
                >
                  View all <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
              <ul className="mt-3 divide-y divide-border">
                {runs.slice(0, 8).map((r) => {
                  const Icon =
                    r.status === "succeeded"
                      ? CheckCircle2
                      : r.status === "failed"
                        ? XCircle
                        : Loader2;
                  const owner = profileById.get(r.user_id);
                  const org = orgById.get(r.organization_id);
                  return (
                    <li key={r.id} className="flex items-center gap-3 py-2">
                      <Icon
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          r.status === "succeeded" && "text-success",
                          r.status === "failed" && "text-destructive",
                          r.status === "running" && "text-primary animate-spin",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12.5px] font-medium">
                          {r.tool_key.replace(/-/g, " ")}
                        </div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {org?.name ?? "—"} · {owner?.email ?? "—"}
                        </div>
                      </div>
                      <span className="text-[10.5px] text-muted-foreground tabular-nums">
                        {new Date(r.created_at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </li>
                  );
                })}
                {runs.length === 0 && (
                  <li className="py-4 text-center text-[12px] text-muted-foreground">
                    No activity yet.
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {tab === "users" && (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead className="bg-surface-2/40 text-[10.5px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">User</th>
                  <th className="text-left px-4 py-2 font-medium">Email</th>
                  <th className="text-left px-4 py-2 font-medium">Onboarded</th>
                  <th className="text-left px-4 py-2 font-medium">Role</th>
                  <th className="text-left px-4 py-2 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProfiles.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-2/40">
                    <td className="px-4 py-2.5 font-medium">{p.full_name || "—"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{p.email}</td>
                    <td className="px-4 py-2.5">
                      {p.onboarding_complete ? (
                        <span className="inline-flex items-center gap-1 text-success">
                          <CheckCircle2 className="h-3 w-3" /> Yes
                        </span>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {adminIds.has(p.id) ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[10.5px] font-semibold text-warning">
                          <Crown className="h-3 w-3" /> Admin
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[11.5px]">User</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {filteredProfiles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No users match.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "orgs" && (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead className="bg-surface-2/40 text-[10.5px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Workspace</th>
                  <th className="text-left px-4 py-2 font-medium">Owner</th>
                  <th className="text-left px-4 py-2 font-medium">Stage</th>
                  <th className="text-left px-4 py-2 font-medium">Niche</th>
                  <th className="text-left px-4 py-2 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrgs.map((o) => {
                  const owner = profileById.get(o.owner_id);
                  return (
                    <tr key={o.id} className="hover:bg-surface-2/40">
                      <td className="px-4 py-2.5 font-medium">{o.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{owner?.email ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[10.5px] font-medium text-primary">
                          {o.stage}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{o.niche || "—"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                        {new Date(o.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
                {filteredOrgs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No workspaces match.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "subs" && (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead className="bg-surface-2/40 text-[10.5px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Workspace</th>
                  <th className="text-left px-4 py-2 font-medium">Plan</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                  <th className="text-left px-4 py-2 font-medium">Renews</th>
                  <th className="text-left px-4 py-2 font-medium">Stripe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subs.map((s) => {
                  const org = orgById.get(s.organization_id);
                  if (search && org && !org.name.toLowerCase().includes(search.toLowerCase()))
                    return null;
                  return (
                    <tr key={s.id} className="hover:bg-surface-2/40">
                      <td className="px-4 py-2.5 font-medium">{org?.name ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10.5px] font-semibold capitalize",
                            PLAN_COLORS[s.plan] ?? "bg-surface-offset",
                          )}
                        >
                          {s.plan}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[11.5px]",
                            s.status === "active" ? "text-success" : "text-muted-foreground",
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              s.status === "active" ? "bg-success" : "bg-muted-foreground/40",
                            )}
                          />
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                        {s.current_period_end
                          ? new Date(s.current_period_end).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground font-mono text-[11px] truncate max-w-[160px]">
                        {s.stripe_customer_id ?? "—"}
                      </td>
                    </tr>
                  );
                })}
                {subs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No subscriptions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "runs" && (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead className="bg-surface-2/40 text-[10.5px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Tool</th>
                  <th className="text-left px-4 py-2 font-medium">Workspace</th>
                  <th className="text-left px-4 py-2 font-medium">User</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                  <th className="text-left px-4 py-2 font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {runs.map((r) => {
                  const owner = profileById.get(r.user_id);
                  const org = orgById.get(r.organization_id);
                  if (search) {
                    const q = search.toLowerCase();
                    const hay =
                      `${r.tool_key} ${org?.name ?? ""} ${owner?.email ?? ""}`.toLowerCase();
                    if (!hay.includes(q)) return null;
                  }
                  const Icon =
                    r.status === "succeeded"
                      ? CheckCircle2
                      : r.status === "failed"
                        ? XCircle
                        : Loader2;
                  return (
                    <tr key={r.id} className="hover:bg-surface-2/40">
                      <td className="px-4 py-2.5 font-medium">{r.tool_key.replace(/-/g, " ")}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{org?.name ?? "—"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{owner?.email ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[11.5px]",
                            r.status === "succeeded" && "text-success",
                            r.status === "failed" && "text-destructive",
                            r.status === "running" && "text-primary",
                          )}
                        >
                          <Icon
                            className={cn("h-3 w-3", r.status === "running" && "animate-spin")}
                          />
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                        {new Date(r.created_at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  );
                })}
                {runs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No runs yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="text-center text-[11px] text-muted-foreground">
        <Link to="/app/dashboard" className="hover:text-foreground">
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}

function AdminStat({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "primary" | "secondary";
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-card transition hover:border-foreground/15">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 font-display text-[1.5rem] font-semibold leading-none tracking-tight tabular-nums">
            {value}
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">{sub}</div>
        </div>
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md",
            accent === "primary" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
