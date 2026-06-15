import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Rocket,
  Settings,
  CreditCard,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpRight,
  TrendingUp,
  Zap,
  Shield,
  Brain,
  Activity,
  Sparkles,
  Map,
  Workflow,
  Users,
  Megaphone,
  Plug,
  BarChart3,
  MessageSquare,
  FileText,
  ChevronDown,
  BookOpen,
  Crosshair,
  LayoutTemplate,
  ClipboardList,
  MoreHorizontal,
  PlayCircle,
  Blocks,
  Search,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useGuest } from "@/lib/guest";
import { subscriptionQuery } from "@/lib/queries";
import { useIsAdmin } from "@/lib/admin";
import { useWorkspaceMode } from "@/hooks/use-workspace-mode";
import { ViewSwitcher } from "./ViewSwitcher";

/* ── Types ── */
interface SubItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  match: (p: string) => boolean;
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  match: (p: string) => boolean;
  children?: SubItem[];
  badge?: string;
}

/* ── Navigation Definition — Nova OS model ──
 * Outcome-first primary nav (NOVA_OS_REDESIGN.md):
 *   Mission Control → Build → Launch → Grow → Ask Nova
 * Everything else lives in the Toolbox (progressive disclosure, collapsed
 * by default) so every legacy route stays reachable without nav overload.
 */
const PRIMARY_NAV: NavGroup[] = [
  {
    id: "mission-control",
    label: "Home",
    icon: Crosshair,
    to: "/app/mission-control",
    match: (p) =>
      p === "/app/mission-control" ||
      p === "/app/dashboard" ||
      p === "/app/mission-briefing" ||
      p === "/app/launchpad-path" ||
      p === "/app/galaxy",
  },
  {
    id: "build",
    label: "Build",
    icon: Rocket,
    to: "/app/outcomes/build",
    match: (p) => p === "/app/outcomes/build",
  },
  {
    id: "launch",
    label: "Launch",
    icon: Megaphone,
    to: "/app/outcomes/launch",
    match: (p) => p === "/app/outcomes/launch",
  },
  {
    id: "grow",
    label: "Grow",
    icon: TrendingUp,
    to: "/app/outcomes/grow",
    match: (p) => p === "/app/outcomes/grow",
  },
  {
    id: "nova",
    label: "Ask Nova",
    icon: Sparkles,
    to: "/app/mentor",
    match: (p) => p === "/app/mentor",
  },
];

/* Operator-mode swaps Build/Launch/Grow for Automate/Optimize/Scale */
const PRIMARY_NAV_OPERATE: NavGroup[] = [
  PRIMARY_NAV[0],
  {
    id: "automate-outcomes",
    label: "Automate",
    icon: Zap,
    to: "/app/outcomes/automate",
    match: (p) => p === "/app/outcomes/automate",
  },
  {
    id: "optimize",
    label: "Optimize",
    icon: TrendingUp,
    to: "/app/outcomes/optimize",
    match: (p) => p === "/app/outcomes/optimize",
  },
  {
    id: "scale-outcomes",
    label: "Scale",
    icon: Rocket,
    to: "/app/outcomes/scale",
    match: (p) => p === "/app/outcomes/scale",
  },
  PRIMARY_NAV[4],
];

const NAV_GROUPS: NavGroup[] = [
  {
    id: "path",
    label: "Journey",
    icon: Map,
    to: "/app/launchpad-path",
    match: (p) => p === "/app/launchpad-path" || p === "/app/playbook",
    children: [
      {
        label: "Journey",
        to: "/app/launchpad-path",
        icon: Map,
        match: (p) => p === "/app/launchpad-path" || p === "/app/galaxy",
      },
      {
        label: "Playbook",
        to: "/app/playbook",
        icon: BookOpen,
        match: (p) => p === "/app/playbook",
      },
    ],
  },
  {
    id: "workbench",
    label: "Workbench",
    icon: Rocket,
    to: "/app/launchpad",
    match: (p) =>
      (p.startsWith("/app/launchpad") &&
        p !== "/app/launchpad-path" &&
        p !== "/app/launchpad/first-customers") ||
      p === "/app/research",
    children: [
      {
        label: "Tools",
        to: "/app/launchpad",
        icon: Sparkles,
        match: (p) =>
          p.startsWith("/app/launchpad") &&
          p !== "/app/launchpad-path" &&
          p !== "/app/launchpad/history" &&
          p !== "/app/launchpad/first-customers",
      },
      {
        label: "Research",
        to: "/app/research",
        icon: Search,
        match: (p) => p === "/app/research",
      },
      {
        label: "History",
        to: "/app/launchpad/history",
        icon: Activity,
        match: (p) => p === "/app/launchpad/history",
      },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    icon: Users,
    to: "/app/contacts",
    match: (p) =>
      p === "/app/contacts" ||
      p === "/app/leads" ||
      p === "/app/nova" ||
      p === "/app/nova/crm" ||
      p === "/app/nova/leads" ||
      p === "/app/launchpad/first-customers" ||
      p.startsWith("/app/scale"),
    children: [
      {
        label: "Contacts",
        to: "/app/contacts",
        icon: Users,
        match: (p) => p === "/app/contacts" || p === "/app/leads" || p === "/app/nova/leads",
      },
      {
        label: "Pipeline",
        to: "/app/nova/crm",
        icon: Workflow,
        match: (p) => p === "/app/nova/crm" || p === "/app/nova",
      },
      {
        label: "First Customers",
        to: "/app/launchpad/first-customers",
        icon: Crosshair,
        match: (p) => p === "/app/launchpad/first-customers",
      },
      {
        label: "Campaigns",
        to: "/app/scale/campaigns",
        icon: Megaphone,
        match: (p) => p.startsWith("/app/scale/campaigns"),
      },
    ],
  },
  {
    id: "automate",
    label: "Automate",
    icon: Zap,
    to: "/app/automations",
    match: (p) =>
      p === "/app/automations" ||
      p === "/app/integrations" ||
      p === "/app/builder" ||
      p === "/app/approvals",
    children: [
      {
        label: "Automations",
        to: "/app/automations",
        icon: Workflow,
        match: (p) => p === "/app/automations",
      },
      {
        label: "Builder",
        to: "/app/builder",
        icon: Blocks,
        match: (p) => p === "/app/builder",
      },
      {
        label: "Integrations",
        to: "/app/integrations",
        icon: Plug,
        match: (p) => p === "/app/integrations",
      },
      {
        label: "Approvals",
        to: "/app/approvals",
        icon: ClipboardList,
        match: (p) => p === "/app/approvals",
      },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    icon: BarChart3,
    to: "/app/ai-dashboard",
    match: (p) =>
      p.startsWith("/app/ai-dashboard") ||
      p === "/app/mentor" ||
      p === "/app/monitoring" ||
      p === "/app/activity",
    children: [
      {
        label: "AI Dashboard",
        to: "/app/ai-dashboard",
        icon: BarChart3,
        match: (p) => p.startsWith("/app/ai-dashboard"),
      },
      {
        label: "Reports",
        to: "/app/nova/reports",
        icon: TrendingUp,
        match: (p) => p === "/app/nova/reports" || p === "/app/activity",
      },
      {
        label: "Mentor",
        to: "/app/mentor",
        icon: MessageSquare,
        match: (p) => p === "/app/mentor",
      },
      {
        label: "System Health",
        to: "/app/monitoring",
        icon: Activity,
        match: (p) => p === "/app/monitoring",
      },
    ],
  },
  {
    id: "library",
    label: "Library",
    icon: FileText,
    to: "/app/assets",
    match: (p) =>
      p === "/app/assets" ||
      p === "/app/templates" ||
      p === "/app/sop-library" ||
      p.startsWith("/app/memory"),
    children: [
      {
        label: "Assets",
        to: "/app/assets",
        icon: FileText,
        match: (p) => p === "/app/assets",
      },
      {
        label: "Templates",
        to: "/app/templates",
        icon: LayoutTemplate,
        match: (p) => p === "/app/templates",
      },
      {
        label: "SOP Library",
        to: "/app/sop-library",
        icon: BookOpen,
        match: (p) => p === "/app/sop-library",
      },
      {
        label: "Memory",
        to: "/app/memory",
        icon: Brain,
        match: (p) => p.startsWith("/app/memory"),
      },
    ],
  },
];

/* Each view shows only the Toolbox groups that fit it, so the layout stays
 * focused instead of dumping every feature on everyone:
 *   Launchpad (create) → Journey, Workbench, Customers, Library
 *   NOVA (operate)     → Customers, Automate, Insights, Library
 */
const LAUNCHPAD_GROUP_IDS = new Set(["path", "workbench", "customers", "library"]);
const NOVA_GROUP_IDS = new Set(["customers", "automate", "insights", "library"]);

const STORAGE = "nova-sidebar-collapsed";
const TOOLBOX_STORAGE = "nova-toolbox-open";

interface AppSidebarProps {
  onOpenRail?: () => void;
}

export function AppSidebar({ onOpenRail: _onOpenRail }: AppSidebarProps) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { currentOrg, currentOrgId, profile, user } = useAuth();
  const { isGuest, disable } = useGuest();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const subQ = useQuery({ ...subscriptionQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const plan = subQ.data?.plan ?? "starter";

  // Active view (Launchpad ↔ NOVA), backed by workspaces.mode.
  // Founders/Launchpad see Build/Launch/Grow; operators/NOVA see
  // Automate/Optimize/Scale — and the Toolbox is curated to match.
  const { isOperate } = useWorkspaceMode();
  const primaryNav = isOperate ? PRIMARY_NAV_OPERATE : PRIMARY_NAV;
  const navGroups = useMemo(
    () => NAV_GROUPS.filter((g) => (isOperate ? NOVA_GROUP_IDS : LAUNCHPAD_GROUP_IDS).has(g.id)),
    [isOperate],
  );

  // Toolbox (legacy full nav) — progressive disclosure, closed by default.
  const [toolboxOpen, setToolboxOpen] = useState(() => {
    try {
      return localStorage.getItem(TOOLBOX_STORAGE) === "1";
    } catch {
      return false;
    }
  });
  const toggleToolbox = () => {
    setToolboxOpen((o) => {
      const next = !o;
      try {
        localStorage.setItem(TOOLBOX_STORAGE, next ? "1" : "0");
      } catch {
        /* */
      }
      return next;
    });
  };

  const initials = (profile?.full_name || user?.email || "U")
    .split(/[\s@]/)
    .filter(Boolean)
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE);
      if (v === "1") setCollapsed(true);
    } catch {
      /* */
    }
  }, []);

  useEffect(() => {
    const active = navGroups.filter((g) => g.children && g.match(path)).map((g) => g.id);
    if (active.length > 0) {
      setExpandedGroups((prev) => {
        const next = new Set(prev);
        active.forEach((id) => next.add(id));
        return next;
      });
      // Reveal the Toolbox when the user is on a page that lives inside it,
      // so the active state is never hidden.
      setToolboxOpen(true);
    }
  }, [path, navGroups]);

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

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitDemo = () => {
    disable();
    navigate({ to: "/signup", search: { plan: undefined } });
  };

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
      {/* ── Workspace / brand header ── */}
      <div
        className={cn(
          "flex h-[52px] shrink-0 items-center gap-2.5 px-3",
          collapsed && "justify-center px-0",
        )}
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white text-[11px] font-bold tracking-tight"
          style={{
            background: "linear-gradient(135deg, var(--primary) 0%, var(--orbit-accent) 100%)",
          }}
        >
          LN
        </div>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <div
                className="font-display text-[13px] font-bold leading-tight truncate"
                style={{ color: "var(--foreground)" }}
              >
                LaunchpadNova
              </div>
              <div
                className="text-[11px] leading-tight truncate mt-px"
                style={{ color: "var(--muted-foreground)" }}
              >
                {orgName}
              </div>
            </div>
            <ChevronDown
              className="h-3.5 w-3.5 shrink-0 opacity-50"
              style={{ color: "var(--muted-foreground)" }}
            />
          </>
        )}
      </div>

      {/* ── View switcher: Launchpad (create) ↔ NOVA (operate) ── */}
      <div
        className={cn("px-2 pt-2 pb-1", collapsed && "px-1.5")}
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <ViewSwitcher collapsed={collapsed} />
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-px">
        {/* Primary nav — the OS layer: outcome-driven, 5 items */}
        {primaryNav.map((item) => {
          const isActive = item.match(path);
          const isNova = item.id === "nova";
          return (
            <div key={item.id} className={cn("px-2", collapsed && "px-1.5")}>
              <Link
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-[8px] transition-all duration-100",
                  collapsed && "justify-center px-0 w-8 mx-auto",
                  isActive ? "font-semibold" : "hover:bg-surface-2",
                )}
                style={
                  isActive
                    ? { background: "var(--primary-soft)", color: "var(--primary)" }
                    : isNova
                      ? { color: "var(--orbit-accent)" }
                      : { color: "var(--muted-foreground)" }
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="flex-1 text-[13px]">{item.label}</span>}
              </Link>
            </div>
          );
        })}

        {/* Toolbox — progressive disclosure of the full feature set */}
        <div className="px-2 pt-4">
          <button
            onClick={toggleToolbox}
            title={collapsed ? "Toolbox" : undefined}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2.5 py-1 text-left transition-colors hover:bg-surface-2",
              collapsed && "justify-center px-0",
            )}
            style={{ color: "var(--muted-foreground)" }}
          >
            {!collapsed ? (
              <>
                <span className="text-[10px] font-semibold uppercase tracking-widest opacity-55">
                  Toolbox
                </span>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 opacity-40 transition-transform duration-150",
                    toolboxOpen && "rotate-180",
                  )}
                />
              </>
            ) : (
              <MoreHorizontal className="h-3.5 w-3.5 opacity-50" />
            )}
          </button>
        </div>

        {(toolboxOpen || collapsed) &&
          navGroups.map((group) => {
            const isActive = group.match(path);
            const isExpanded = expandedGroups.has(group.id);
            const hasChildren = !!group.children?.length;

            return (
              <div key={group.id}>
                {/* Parent nav item */}
                <div className={cn("px-2", collapsed && "px-1.5")}>
                  {hasChildren ? (
                    <button
                      onClick={() => toggleGroup(group.id)}
                      title={collapsed ? group.label : undefined}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-md px-2.5 py-[7px] text-left transition-all duration-100",
                        collapsed && "justify-center px-0 w-8 mx-auto",
                        isActive ? "font-semibold" : "hover:bg-surface-2",
                      )}
                      style={
                        isActive
                          ? { background: "var(--primary-soft)", color: "var(--primary)" }
                          : { color: "var(--muted-foreground)" }
                      }
                    >
                      <group.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-[13px]">{group.label}</span>
                          <ChevronDown
                            className={cn(
                              "h-3.5 w-3.5 shrink-0 transition-transform duration-150 opacity-50",
                              isExpanded && "rotate-180",
                            )}
                          />
                        </>
                      )}
                    </button>
                  ) : (
                    <Link
                      to={group.to}
                      title={collapsed ? group.label : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-[7px] transition-all duration-100",
                        collapsed && "justify-center px-0 w-8 mx-auto",
                        isActive ? "font-semibold" : "hover:bg-surface-2",
                      )}
                      style={
                        isActive
                          ? { background: "var(--primary-soft)", color: "var(--primary)" }
                          : { color: "var(--muted-foreground)" }
                      }
                    >
                      <group.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-[13px]">{group.label}</span>
                          {group.badge && (
                            <span
                              className="rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wider"
                              style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
                            >
                              {group.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  )}
                </div>

                {/* Sub-items */}
                {!collapsed && hasChildren && isExpanded && (
                  <div className="px-2 mt-0.5 mb-1">
                    <div
                      className="ml-[18px] pl-3 space-y-px"
                      style={{ borderLeft: "1.5px solid var(--border)" }}
                    >
                      {group.children!.map((child) => {
                        const childActive = child.match(path);
                        return (
                          <Link
                            key={child.to}
                            to={child.to}
                            className={cn(
                              "flex items-center gap-2 rounded-md px-2.5 py-1.5 transition-all duration-100",
                              childActive ? "font-medium" : "hover:bg-surface-2",
                            )}
                            style={
                              childActive
                                ? { background: "var(--primary-soft)", color: "var(--primary)" }
                                : { color: "var(--muted-foreground)" }
                            }
                          >
                            <child.icon className="h-3.5 w-3.5 shrink-0" />
                            <span className="text-[12.5px]">{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </nav>

      {/* ── Footer ── */}
      <div className="shrink-0" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
        {/* Footer nav links */}
        <div className={cn("p-2 space-y-px", collapsed && "px-1.5")}>
          {isGuest && (
            <button
              onClick={exitDemo}
              title={collapsed ? "Exit demo" : undefined}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2.5 py-[7px] text-left text-[12.5px] font-medium transition-colors",
                collapsed && "justify-center px-0 w-8 mx-auto",
              )}
              style={{
                background: "var(--primary-soft)",
                color: "var(--primary)",
              }}
            >
              <ArrowUpRight className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Exit demo</span>}
            </button>
          )}

          {footerItems.map((item) => {
            const active = path === item.to || path.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-[7px] transition-all duration-100",
                  collapsed && "justify-center px-0 w-8 mx-auto",
                  !active && "hover:bg-surface-2",
                )}
                style={
                  active
                    ? { background: "var(--primary-soft)", color: "var(--primary)" }
                    : { color: "var(--muted-foreground)" }
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="text-[13px]">{item.label}</span>}
              </Link>
            );
          })}
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

          {/* Collapse toggle */}
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
