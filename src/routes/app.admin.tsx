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
  Zap,
  BarChart3,
  Circle,
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
  starter: "bg-muted text-muted-foreground",
  launch: "bg-primary/10 text-primary",
  operate: "bg-warning/10 text-warning",
  scale: "bg-destructive/10 text-destructive",
};

const PLAN_STRIPE: Record<string, string> = {
  starter: "bg-border",
  launch: "bg-orange-400",
  operate: "bg-amber-500",
  scale: "bg-red-500",
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

  const planCounts = subs.reduce<Record<string, number>>((acc, s) => {
    acc[s.plan] = (acc[s.plan] ?? 0) + 1;
    return acc;
  }, {});

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
    { key: "runs", label: "Tool Runs", icon: TrendingUp, count: runs.length },
  ];

  return (
    <div className="space-y-6">
      {/* ── Hero header ── */}
      <section className="relative overflow-hidden rounded-2xl bg-primary/50 px-6 py-8 text-white shadow-lg">
        {/* Decorative rings */}
        <span className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border-[32px] border-white/10" />
        <span className="pointer-events-none absolute -right-4 -bottom-20 h-48 w-48 rounded-full border-[20px] border-white/8" />
        <span className="pointer-events-none absolute right-48 -top-8 h-32 w-32 rounded-full border-[16px] border-white/6" />

        <div className="relative flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest backdrop-blur-sm">
                <Shield className="h-3 w-3" /> Admin
              </span>
              <span className="rounded-full bg-orange-600/60 px-2.5 py-1 text-[11px] font-medium">
                Platform-wide
              </span>
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Admin Hub
            </h1>
            <p className="mt-1 text-[13px] text-orange-100">
              Operate the platform — users, workspaces, billing, and live activity.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[12px] text-orange-100">
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              Live
            </span>
          </div>
        </div>
      </section>

      {/* ── Stat row ── */}
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={totalUsers}
          sub={`${onboardedUsers} onboarded`}
          icon={Users}
          variant="orange"
        />
        <StatCard
          label="Workspaces"
          value={totalOrgs}
          sub={`${paidSubs} on paid plans`}
          icon={Building2}
          variant="amber"
        />
        <StatCard
          label="Est. MRR"
          value={`$${mrr.toLocaleString()}`}
          sub={`${paidSubs} active paid`}
          icon={CreditCard}
          variant="orange"
        />
        <StatCard
          label="Tool Runs"
          value={succeededRuns}
          sub={`${last7d} in last 7d`}
          icon={Zap}
          variant="amber"
        />
      </section>

      {/* ── Tabs panel ── */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* Tab bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-primary/5 px-3 py-2.5">
          <div className="flex flex-wrap gap-1">
            {tabs.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-all",
                    active
                      ? "bg-primary/50 text-white shadow-sm"
                      : "text-muted-foreground text-muted-foreground hover:bg-primary/10 hover:text-primary",
                  )}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                  {typeof t.count === "number" && (
                    <span
                      className={cn(
                        "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                        active ? "bg-white/25 text-white" : "bg-primary/10 text-primary",
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
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="h-8 border-border bg-background pl-8 text-[12.5px] placeholder:text-muted-foreground focus-visible:ring-orange-400"
              />
            </div>
          )}
        </div>

        {/* ── Overview tab ── */}
        {tab === "overview" && (
          <div className="grid gap-4 p-4 lg:grid-cols-2">
            {/* Plan distribution */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-orange-500">
                <BarChart3 className="h-3.5 w-3.5" />
                Plan distribution
              </div>
              <div className="mt-4 space-y-3.5">
                {(["starter", "launch", "operate", "scale"] as const).map((p) => {
                  const count = planCounts[p] ?? 0;
                  const total = subs.length || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={p}>
                      <div className="flex items-center justify-between text-[12.5px]">
                        <span className="font-semibold capitalize text-foreground">{p}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {count} &middot; {pct}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-primary/5">
                        <div
                          className={cn("h-full rounded-full transition-all", PLAN_STRIPE[p])}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top tools */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-orange-500">
                <TrendingUp className="h-3.5 w-3.5" />
                Top tools
              </div>
              <div className="mt-4 space-y-2.5">
                {toolCounts.length === 0 && (
                  <div className="text-[12px] text-muted-foreground">No runs yet.</div>
                )}
                {toolCounts.map(([key, count]) => {
                  const max = toolCounts[0][1];
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className="w-36 truncate text-[12.5px] font-medium text-foreground">
                        {key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </div>
                      <div className="flex-1 h-2 overflow-hidden rounded-full bg-primary/5">
                        <div
                          className="h-full rounded-full bg-orange-400"
                          style={{ width: `${(count / max) * 100}%` }}
                        />
                      </div>
                      <div className="w-8 text-right text-[11.5px] tabular-nums font-semibold text-orange-500">
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live activity */}
            <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-orange-500">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary/50" />
                  </span>
                  Live activity
                </div>
                <button
                  onClick={() => setTab("runs")}
                  className="inline-flex items-center gap-1 text-[11.5px] font-medium text-orange-500 hover:text-orange-600"
                >
                  View all <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
              <ul className="mt-3 divide-y divide-orange-50">
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
                    <li key={r.id} className="flex items-center gap-3 py-2.5">
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          r.status === "succeeded" && "text-success",
                          r.status === "failed" && "text-destructive",
                          r.status === "running" && "animate-spin text-orange-500",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12.5px] font-semibold text-foreground">
                          {r.tool_key.replace(/-/g, " ")}
                        </div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {org?.name ?? "—"} &middot; {owner?.email ?? "—"}
                        </div>
                      </div>
                      <span className="shrink-0 text-[10.5px] text-muted-foreground tabular-nums">
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
                  <li className="py-6 text-center text-[12px] text-muted-foreground">
                    No activity yet.
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* ── Users tab ── */}
        {tab === "users" && (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-primary/50 text-white">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">
                    Onboarded
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.map((p, i) => (
                  <tr
                    key={p.id}
                    className={cn(
                      "border-b border-border transition-colors hover:bg-primary/5",
                      i % 2 === 0 ? "bg-card" : "bg-primary/3",
                    )}
                  >
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {p.full_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                    <td className="px-4 py-3">
                      {p.onboarding_complete ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10.5px] font-semibold text-success">
                          <CheckCircle2 className="h-3 w-3" /> Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
                          <Circle className="h-3 w-3" /> No
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {adminIds.has(p.id) ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10.5px] font-semibold text-orange-700">
                          <Crown className="h-3 w-3" /> Admin
                        </span>
                      ) : (
                        <span className="text-[11.5px] text-muted-foreground">User</span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {filteredProfiles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                      No users match.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Workspaces tab ── */}
        {tab === "orgs" && (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-primary/50 text-white">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">
                    Workspace
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">
                    Niche
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrgs.map((o, i) => {
                  const owner = profileById.get(o.owner_id);
                  return (
                    <tr
                      key={o.id}
                      className={cn(
                        "border-b border-border transition-colors hover:bg-primary/5",
                        i % 2 === 0 ? "bg-card" : "bg-primary/3",
                      )}
                    >
                      <td className="px-4 py-3 font-semibold text-foreground">{o.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{owner?.email ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10.5px] font-semibold text-orange-700">
                          {o.stage}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{o.niche || "—"}</td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
                {filteredOrgs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                      No workspaces match.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Subscriptions tab ── */}
        {tab === "subs" && (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-primary/50 text-white">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">
                    Workspace
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">
                    Renews
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">
                    Stripe
                  </th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s, i) => {
                  const org = orgById.get(s.organization_id);
                  if (search && org && !org.name.toLowerCase().includes(search.toLowerCase()))
                    return null;
                  return (
                    <tr
                      key={s.id}
                      className={cn(
                        "border-b border-border transition-colors hover:bg-primary/5",
                        i % 2 === 0 ? "bg-card" : "bg-primary/3",
                      )}
                    >
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {org?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10.5px] font-semibold capitalize",
                            PLAN_COLORS[s.plan] ?? "bg-muted text-muted-foreground",
                          )}
                        >
                          {s.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-[11.5px] font-medium",
                            s.status === "active" ? "text-success" : "text-muted-foreground",
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              s.status === "active" ? "bg-success" : "bg-border",
                            )}
                          />
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {s.current_period_end
                          ? new Date(s.current_period_end).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="max-w-[160px] truncate px-4 py-3 font-mono text-[11px] text-muted-foreground">
                        {s.stripe_customer_id ?? "—"}
                      </td>
                    </tr>
                  );
                })}
                {subs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                      No subscriptions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Tool runs tab ── */}
        {tab === "runs" && (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-primary/50 text-white">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">
                    Tool
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">
                    Workspace
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">
                    When
                  </th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r, i) => {
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
                    <tr
                      key={r.id}
                      className={cn(
                        "border-b border-border transition-colors hover:bg-primary/5",
                        i % 2 === 0 ? "bg-card" : "bg-primary/3",
                      )}
                    >
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {r.tool_key.replace(/-/g, " ")}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{org?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{owner?.email ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-[11.5px] font-medium",
                            r.status === "succeeded" && "text-success",
                            r.status === "failed" && "text-destructive",
                            r.status === "running" && "text-orange-500",
                          )}
                        >
                          <Icon
                            className={cn("h-3.5 w-3.5", r.status === "running" && "animate-spin")}
                          />
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
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
                    <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
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
        <Link to="/app/dashboard" className="hover:text-orange-500 transition-colors">
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  variant,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: "orange" | "amber";
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-border">
      {/* Subtle corner accent */}
      <span
        className={cn(
          "pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-10",
          variant === "orange" ? "bg-primary/50" : "bg-amber-400",
        )}
      />
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground">
            {label}
          </div>
          <div
            className={cn(
              "mt-2 font-display text-[2rem] font-bold leading-none tracking-tight tabular-nums",
              variant === "orange" ? "text-primary" : "text-accent",
            )}
          >
            {value}
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">{sub}</div>
        </div>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            variant === "orange"
              ? "bg-primary text-primary-foreground"
              : "bg-accent text-accent-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
