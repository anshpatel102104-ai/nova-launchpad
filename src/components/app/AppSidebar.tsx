// Two products, two sidebars — never one shared dashboard.
//
//   LaunchpadSidebar — linear, staged, guided. "I am building my business."
//   NovaSidebar      — modular, operational.   "I am running my business."
//
// AppSidebar only chooses which product shell to render (workspaces.mode).
// The two navs share chrome (header, footer, collapse) but nothing about
// their information architecture: Launchpad is a mission progression,
// Nova is a command center. Crossing between them is an intentional
// handoff at the bottom of each rail, not a tab toggle.

import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Settings,
  CreditCard,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpRight,
  ArrowRight,
  Zap,
  Shield,
  Brain,
  Activity,
  Sparkles,
  Workflow,
  Users,
  Megaphone,
  Plug,
  BarChart3,
  FileText,
  ChevronDown,
  BookOpen,
  Crosshair,
  ClipboardList,
  MoreHorizontal,
  PlayCircle,
  Search,
  Inbox,
  Check,
  Lock,
  Gauge,
  Rocket,
  Home,
  Briefcase,
  Map,
  type LucideIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useGuest } from "@/lib/guest";
import { subscriptionQuery } from "@/lib/queries";
import { useIsAdmin } from "@/lib/admin";
import { useWorkspaceMode } from "@/hooks/use-workspace-mode";
import { useBusinessGraph } from "@/hooks/use-business-graph";
import {
  deriveLaunchpadProgress,
  LAUNCHPAD_SUPPORT_NAV,
  NOVA_PRIMARY_NAV,
  NOVA_SUPPORT_NAV,
  PRODUCT_HOME,
} from "@/lib/ecosystem";

const STORAGE = "nova-sidebar-collapsed";

/* ─── Chooser ──────────────────────────────────────────────── */

export function AppSidebar({ onOpenRail: _onOpenRail }: { onOpenRail?: () => void }) {
  const { isOperate } = useWorkspaceMode();
  return isOperate ? <NovaSidebar /> : <LaunchpadSidebar />;
}

/* ─── Icon maps (UI concern — the nav model in lib/ecosystem stays pure) ─── */

const LAUNCHPAD_SUPPORT_ICONS: Record<string, LucideIcon> = {
  missions: Crosshair,
  roadmap: Map,
  research: Search,
  assets: FileText,
  memory: Brain,
};

const NOVA_PRIMARY_ICONS: Record<string, LucideIcon> = {
  home: Home,
  crm: Users,
  pipeline: Workflow,
  automations: Zap,
  clients: Briefcase,
  tasks: ClipboardList,
  reporting: BarChart3,
};

const NOVA_SUPPORT_ICONS: Record<string, LucideIcon> = {
  roadmap: Map,
  inbox: Inbox,
  workflows: Workflow,
  campaigns: Megaphone,
  knowledge: BookOpen,
  activity: Activity,
  integrations: Plug,
};

/* ─── Launchpad — staged mission rail ──────────────────────── */

function LaunchpadSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const graph = useBusinessGraph();
  const progress = deriveLaunchpadProgress(graph);
  const { setMode } = useWorkspaceMode();
  const navigate = useNavigate();

  const openNova = () => {
    setMode("operate");
    navigate({ to: PRODUCT_HOME.nova });
  };

  return (
    <SidebarChrome brand="Launchpad" tagline="Build your business" brandIcon={Rocket}>
      {({ collapsed }) => (
        <>
          {/* Home */}
          <div className={cn("px-2", collapsed && "px-1.5")}>
            <NavRow
              to="/app/mission-control"
              label="Home"
              icon={Home}
              active={path === "/app/mission-control" || path === "/app/dashboard"}
              collapsed={collapsed}
            />
          </div>

          {/* Stage progression — the spine of Launchpad */}
          <SectionLabel collapsed={collapsed}>Your build</SectionLabel>
          <div className={cn("px-2 space-y-px", collapsed && "px-1.5")}>
            {progress.stages.map((stage, i) => {
              const active = path === stage.to;
              return (
                <Link
                  key={stage.id}
                  to={stage.to}
                  title={collapsed ? stage.label : stage.headline}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-[7px] transition-all duration-100",
                    collapsed && "justify-center px-0 w-8 mx-auto",
                    active ? "font-semibold" : "hover:bg-surface-2",
                    stage.upcoming && !active && "opacity-55",
                  )}
                  style={
                    active || stage.current
                      ? { background: "var(--primary-soft)", color: "var(--primary)" }
                      : { color: "var(--muted-foreground)" }
                  }
                >
                  <span
                    className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] text-[10px] font-bold"
                    style={
                      stage.done
                        ? { background: "var(--success)", color: "var(--success-foreground)" }
                        : stage.current
                          ? { background: "var(--primary)", color: "var(--primary-foreground)" }
                          : {
                              border: "1.5px solid var(--border)",
                              color: "var(--text-faint)",
                            }
                    }
                  >
                    {stage.done ? (
                      <Check className="h-3 w-3" />
                    ) : stage.upcoming ? (
                      <Lock className="h-2.5 w-2.5" />
                    ) : (
                      i + 1
                    )}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-[13px]">{stage.label}</span>
                      {stage.current && (
                        <span
                          className="text-[9px] font-bold uppercase tracking-wider"
                          style={{ color: "var(--primary)" }}
                        >
                          Now
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Casefiles — supporting depth, out of the way */}
          <SupportGroup
            label="Casefiles"
            items={LAUNCHPAD_SUPPORT_NAV.map((n) => ({
              ...n,
              icon: LAUNCHPAD_SUPPORT_ICONS[n.id] ?? FileText,
            }))}
            path={path}
            collapsed={collapsed}
            storageKey="lp-casefiles-open"
          />

          {/* Handoff — the only door into Nova from here */}
          <div className={cn("mt-auto px-2 pt-4", collapsed && "px-1.5")}>
            {progress.readyForNova ? (
              <button
                onClick={openNova}
                title="Open Nova"
                className={cn(
                  "w-full rounded-lg border p-2.5 text-left transition-colors hover:opacity-90",
                  collapsed && "flex justify-center p-2",
                )}
                style={{
                  borderColor: "color-mix(in oklab, var(--cyan) 40%, transparent)",
                  background: "color-mix(in oklab, var(--cyan) 9%, var(--surface))",
                }}
              >
                {collapsed ? (
                  <Gauge className="h-4 w-4" style={{ color: "var(--cyan)" }} />
                ) : (
                  <>
                    <div
                      className="flex items-center gap-1.5 text-[12px] font-bold"
                      style={{ color: "var(--cyan)" }}
                    >
                      <Gauge className="h-3.5 w-3.5" />
                      Ready to operate
                      <ArrowRight className="ml-auto h-3.5 w-3.5" />
                    </div>
                    <div
                      className="mt-0.5 text-[11px] leading-snug"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Nova built your operating system from your Launchpad decisions.
                    </div>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={openNova}
                title="Nova — runs your business"
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-[7px] text-left transition-colors hover:bg-surface-2",
                  collapsed && "justify-center px-0 w-8 mx-auto",
                )}
                style={{ color: "var(--muted-foreground)" }}
              >
                <Gauge className="h-4 w-4 shrink-0 opacity-70" />
                {!collapsed && (
                  <span className="flex-1">
                    <span className="block text-[12.5px] font-medium">Nova</span>
                    <span className="block text-[10.5px]" style={{ color: "var(--text-faint)" }}>
                      Runs your business — unlocks at Launch
                    </span>
                  </span>
                )}
              </button>
            )}
          </div>
        </>
      )}
    </SidebarChrome>
  );
}

/* ─── Nova — operational command rail ──────────────────────── */

function NovaSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { setMode } = useWorkspaceMode();
  const navigate = useNavigate();

  const openLaunchpad = () => {
    setMode("create");
    navigate({ to: PRODUCT_HOME.launchpad });
  };

  return (
    <SidebarChrome brand="Nova" tagline="Run your business" brandIcon={Gauge}>
      {({ collapsed }) => (
        <>
          <div className={cn("px-2 space-y-px", collapsed && "px-1.5")}>
            {NOVA_PRIMARY_NAV.map((item) => (
              <NavRow
                key={item.id}
                to={item.to}
                label={item.label}
                icon={NOVA_PRIMARY_ICONS[item.id] ?? Sparkles}
                active={item.match(path)}
                collapsed={collapsed}
              />
            ))}
          </div>

          {/* Operations — depth on demand */}
          <SupportGroup
            label="Operations"
            items={NOVA_SUPPORT_NAV.map((n) => ({
              ...n,
              icon: NOVA_SUPPORT_ICONS[n.id] ?? FileText,
            }))}
            path={path}
            collapsed={collapsed}
            storageKey="nova-operations-open"
          />

          {/* Quiet door back to the creation engine */}
          <div className={cn("mt-auto px-2 pt-4", collapsed && "px-1.5")}>
            <button
              onClick={openLaunchpad}
              title="Launchpad — build the next thing"
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2.5 py-[7px] text-left transition-colors hover:bg-surface-2",
                collapsed && "justify-center px-0 w-8 mx-auto",
              )}
              style={{ color: "var(--muted-foreground)" }}
            >
              <Rocket className="h-4 w-4 shrink-0 opacity-70" />
              {!collapsed && (
                <span className="flex-1">
                  <span className="block text-[12.5px] font-medium">Launchpad</span>
                  <span className="block text-[10.5px]" style={{ color: "var(--text-faint)" }}>
                    Build or validate the next thing
                  </span>
                </span>
              )}
            </button>
          </div>
        </>
      )}
    </SidebarChrome>
  );
}

/* ─── Shared pieces ────────────────────────────────────────── */

function NavRow({
  to,
  label,
  icon: Icon,
  active,
  collapsed,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      to={to}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-[8px] transition-all duration-100",
        collapsed && "justify-center px-0 w-8 mx-auto",
        active ? "font-semibold" : "hover:bg-surface-2",
      )}
      style={
        active
          ? { background: "var(--primary-soft)", color: "var(--primary)" }
          : { color: "var(--muted-foreground)" }
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="flex-1 text-[13px]">{label}</span>}
    </Link>
  );
}

function SectionLabel({ children, collapsed }: { children: React.ReactNode; collapsed: boolean }) {
  if (collapsed) return <div className="pt-3" />;
  return (
    <div
      className="px-4.5 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-widest opacity-55"
      style={{ color: "var(--muted-foreground)", paddingLeft: 18 }}
    >
      {children}
    </div>
  );
}

interface SupportItem {
  id: string;
  label: string;
  to: string;
  match: (p: string) => boolean;
  icon: LucideIcon;
}

/** Collapsible support area — progressive disclosure, closed by default,
 *  auto-opens when the active route lives inside it. */
function SupportGroup({
  label,
  items,
  path,
  collapsed,
  storageKey,
}: {
  label: string;
  items: SupportItem[];
  path: string;
  collapsed: boolean;
  storageKey: string;
}) {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === "1";
    } catch {
      return false;
    }
  });

  const hasActive = items.some((i) => i.match(path));
  useEffect(() => {
    if (hasActive) setOpen(true);
  }, [hasActive]);

  const toggle = () => {
    setOpen((o) => {
      const next = !o;
      try {
        localStorage.setItem(storageKey, next ? "1" : "0");
      } catch {
        /* */
      }
      return next;
    });
  };

  return (
    <div>
      <div className="px-2 pt-4">
        <button
          onClick={toggle}
          title={collapsed ? label : undefined}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2.5 py-1 text-left transition-colors hover:bg-surface-2",
            collapsed && "justify-center px-0",
          )}
          style={{ color: "var(--muted-foreground)" }}
        >
          {!collapsed ? (
            <>
              <span className="text-[10px] font-semibold uppercase tracking-widest opacity-55">
                {label}
              </span>
              <ChevronDown
                className={cn(
                  "h-3 w-3 opacity-40 transition-transform duration-150",
                  open && "rotate-180",
                )}
              />
            </>
          ) : (
            <MoreHorizontal className="h-3.5 w-3.5 opacity-50" />
          )}
        </button>
      </div>
      {(open || collapsed) && (
        <div className={cn("px-2 space-y-px pt-0.5", collapsed && "px-1.5")}>
          {items.map((item) => (
            <NavRow
              key={item.id}
              to={item.to}
              label={item.label}
              icon={item.icon}
              active={item.match(path)}
              collapsed={collapsed}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Shared chrome: header, footer, collapse. Product navs render inside. */
function SidebarChrome({
  brand,
  tagline,
  brandIcon: BrandIcon,
  children,
}: {
  brand: string;
  tagline: string;
  brandIcon: LucideIcon;
  children: (ctx: { collapsed: boolean }) => React.ReactNode;
}) {
  const { currentOrg, currentOrgId, profile, user } = useAuth();
  const { isGuest, disable } = useGuest();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);

  const subQ = useQuery({ ...subscriptionQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const plan = subQ.data?.plan ?? "starter";

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE) === "1") setCollapsed(true);
    } catch {
      /* */
    }
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      const n = !c;
      try {
        localStorage.setItem(STORAGE, n ? "1" : "0");
      } catch {
        /* */
      }
      return n;
    });
  };

  const exitDemo = () => {
    disable();
    navigate({ to: "/signup", search: { plan: undefined } });
  };

  const initials = (profile?.full_name || user?.email || "U")
    .split(/[\s@]/)
    .filter(Boolean)
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const footerItems = [
    ...(isAdmin ? [{ to: "/app/admin", label: "Admin", icon: Shield }] : []),
    { to: "/app/tutorials", label: "Help & Tutorials", icon: PlayCircle },
    { to: "/app/settings", label: "Settings", icon: Settings },
    { to: "/app/billing", label: "Billing", icon: CreditCard },
  ];

  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const orgName = currentOrg?.name ?? `${planLabel} plan`;
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Account";

  return (
    <aside
      className={cn(
        "hidden lg:flex shrink-0 flex-col relative select-none",
        "transition-[width] duration-200 ease-in-out overflow-hidden",
        collapsed ? "w-[56px]" : "w-[240px]",
      )}
      style={{
        background: "var(--sidebar)",
        borderRight: "1px solid var(--sidebar-border)",
      }}
    >
      {/* ── Product header ── */}
      <div
        className={cn(
          "flex h-[52px] shrink-0 items-center gap-2.5 px-3",
          collapsed && "justify-center px-0",
        )}
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: "var(--primary-soft)",
            color: "var(--primary)",
            border: "1px solid var(--primary-border)",
          }}
        >
          <BrandIcon className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div
              className="font-display text-[13px] font-bold leading-tight truncate"
              style={{ color: "var(--foreground)" }}
            >
              {brand}
            </div>
            <div
              className="text-[11px] leading-tight truncate mt-px"
              style={{ color: "var(--muted-foreground)" }}
            >
              {tagline} · {orgName}
            </div>
          </div>
        )}
      </div>

      {/* ── Product nav ── */}
      <nav className="flex flex-1 flex-col overflow-y-auto py-2">{children({ collapsed })}</nav>

      {/* ── Footer ── */}
      <div className="shrink-0" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
        <div className={cn("p-2 space-y-px", collapsed && "px-1.5")}>
          {isGuest && (
            <button
              onClick={exitDemo}
              title={collapsed ? "Exit demo" : undefined}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2.5 py-[7px] text-left text-[12.5px] font-medium transition-colors",
                collapsed && "justify-center px-0 w-8 mx-auto",
              )}
              style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
            >
              <ArrowUpRight className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Exit demo</span>}
            </button>
          )}

          {footerItems.map((item) => (
            <NavRow
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              active={path === item.to || path.startsWith(item.to + "/")}
              collapsed={collapsed}
            />
          ))}
        </div>

        {/* User card */}
        <div className={cn("px-2 pb-2", collapsed && "px-1.5")}>
          <button
            onClick={() => navigate({ to: "/app/settings" })}
            title={collapsed ? displayName : undefined}
            className={cn(
              "w-full flex items-center gap-2.5 rounded-lg p-2 transition-colors duration-150",
              collapsed && "justify-center p-1.5",
              "hover:bg-surface-2",
            )}
            style={{ border: "1px solid var(--border)" }}
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ background: "var(--primary)" }}
            >
              {initials}
            </span>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1 text-left">
                  <div
                    className="truncate text-[12px] font-semibold leading-tight"
                    style={{ color: "var(--foreground)" }}
                  >
                    {displayName}
                  </div>
                  <div
                    className="truncate text-[10.5px] leading-tight mt-px"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {planLabel} plan
                  </div>
                </div>
                <MoreHorizontal
                  className="h-3.5 w-3.5 shrink-0 opacity-40"
                  style={{ color: "var(--foreground)" }}
                />
              </>
            )}
          </button>

          <button
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "mt-1 flex w-full items-center gap-2 rounded-md px-2.5 py-1 text-[11px] transition-colors hover:bg-surface-2",
              collapsed && "justify-center",
            )}
            style={{ color: "var(--muted-foreground)" }}
          >
            {collapsed ? (
              <ChevronsRight className="h-3.5 w-3.5" />
            ) : (
              <>
                <ChevronsLeft className="h-3.5 w-3.5" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
