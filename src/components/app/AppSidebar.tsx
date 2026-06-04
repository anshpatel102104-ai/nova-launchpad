import { useEffect, useState, type MouseEvent } from "react";
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
  ChevronRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useGuest } from "@/lib/guest";
import { subscriptionQuery } from "@/lib/queries";
import { useIsAdmin } from "@/lib/admin";

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

/* ── Navigation Definition ── */
const NAV_GROUPS: NavGroup[] = [
  {
    id: "command",
    label: "Command",
    icon: LayoutDashboard,
    to: "/app/dashboard",
    match: (p) => p === "/app/dashboard",
  },
  {
    id: "build",
    label: "Build",
    icon: Rocket,
    to: "/app/launchpad",
    match: (p) =>
      p.startsWith("/app/launchpad") ||
      p === "/app/launchpad-path" ||
      p === "/app/assets" ||
      p.startsWith("/app/mission"),
    children: [
      {
        label: "Launchpad",
        to: "/app/launchpad",
        icon: Sparkles,
        match: (p) => p.startsWith("/app/launchpad"),
      },
      {
        label: "Mission Path",
        to: "/app/launchpad-path",
        icon: Map,
        match: (p) => p === "/app/launchpad-path",
      },
      {
        label: "Assets",
        to: "/app/assets",
        icon: FileText,
        match: (p) => p === "/app/assets",
      },
    ],
  },
  {
    id: "operate",
    label: "Operate",
    icon: TrendingUp,
    to: "/app/nova/crm",
    match: (p) =>
      p.startsWith("/app/nova") ||
      p.startsWith("/app/scale") ||
      p === "/app/contacts" ||
      p === "/app/leads",
    children: [
      {
        label: "Pipeline",
        to: "/app/nova/crm",
        icon: Workflow,
        match: (p) => p === "/app/nova/crm" || p === "/app/nova",
      },
      {
        label: "Contacts",
        to: "/app/contacts",
        icon: Users,
        match: (p) => p === "/app/contacts" || p === "/app/leads" || p === "/app/nova/leads",
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
    match: (p) => p === "/app/automations" || p === "/app/integrations",
    children: [
      {
        label: "Workflows",
        to: "/app/automations",
        icon: Workflow,
        match: (p) => p === "/app/automations",
      },
      {
        label: "Integrations",
        to: "/app/integrations",
        icon: Plug,
        match: (p) => p === "/app/integrations",
      },
    ],
  },
  {
    id: "memory",
    label: "Memory",
    icon: Brain,
    to: "/app/memory",
    match: (p) => p.startsWith("/app/memory"),
    badge: "new",
  },
  {
    id: "intelligence",
    label: "Intelligence",
    icon: Activity,
    to: "/app/ai-dashboard",
    match: (p) => p.startsWith("/app/ai-dashboard") || p === "/app/mentor",
    children: [
      {
        label: "AI Dashboard",
        to: "/app/ai-dashboard",
        icon: BarChart3,
        match: (p) => p.startsWith("/app/ai-dashboard"),
      },
      {
        label: "Mentor",
        to: "/app/mentor",
        icon: MessageSquare,
        match: (p) => p === "/app/mentor",
      },
    ],
  },
];

const STORAGE = "nova-sidebar-collapsed";

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

  // Auto-expand groups that contain the active route
  useEffect(() => {
    const active = NAV_GROUPS.filter((g) => g.children && g.match(path)).map((g) => g.id);
    if (active.length > 0) {
      setExpandedGroups((prev) => {
        const next = new Set(prev);
        active.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [path]);

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
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const exitDemo = () => {
    disable();
    navigate({ to: "/signup", search: { plan: undefined } });
  };

  const footerItems = [
    ...(isAdmin ? [{ to: "/app/admin", label: "Admin", icon: Shield }] : []),
    { to: "/app/settings", label: "Settings", icon: Settings },
    { to: "/app/billing", label: "Billing", icon: CreditCard },
  ];

  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);

  return (
    <aside
      className={cn(
        "hidden lg:flex shrink-0 flex-col relative",
        "transition-[width] duration-200 ease-in-out overflow-hidden",
        collapsed ? "w-[60px]" : "w-[220px]",
      )}
      style={{
        background: "var(--sidebar)",
        borderRight: "1px solid var(--sidebar-border)",
      }}
    >
      {/* Brand header */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center gap-2.5 px-3",
          collapsed && "justify-center px-0",
        )}
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white text-[10px] font-bold tracking-tight"
          style={{ background: "var(--primary)" }}
        >
          LN
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div
              className="font-display text-[13px] font-bold tracking-tight truncate"
              style={{ color: "var(--foreground)" }}
            >
              LaunchpadNova
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="inline-flex items-center rounded px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider"
                style={{
                  background: "var(--primary-soft)",
                  color: "var(--primary)",
                }}
              >
                {planLabel}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV_GROUPS.map((group, groupIdx) => {
          const isActive = group.match(path);
          const isExpanded = expandedGroups.has(group.id);
          const hasChildren = !!group.children?.length;

          return (
            <div key={group.id}>
              {/* Section divider before Automate and Memory */}
              {(group.id === "automate" || group.id === "memory") && (
                <div
                  className="my-2 mx-1"
                  style={{ height: "1px", background: "var(--sidebar-border)" }}
                />
              )}

              {/* Parent nav item */}
              <div className="relative">
                {/* Active left indicator */}
                {isActive && !hasChildren && (
                  <span
                    className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full"
                    style={{ background: "var(--primary)" }}
                  />
                )}

                <div className="flex items-center">
                  {hasChildren ? (
                    /* Expandable parent */
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className={cn(
                        "flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-100",
                        collapsed && "justify-center px-0",
                      )}
                      style={
                        isActive
                          ? {
                              background: "var(--primary-soft)",
                              color: "var(--foreground)",
                            }
                          : { color: "var(--muted-foreground)" }
                      }
                      title={collapsed ? group.label : undefined}
                    >
                      <group.icon className="h-[15px] w-[15px] shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-[12.5px] font-semibold">{group.label}</span>
                          <ChevronDown
                            className={cn(
                              "h-3 w-3 shrink-0 transition-transform duration-150",
                              isExpanded && "rotate-180",
                            )}
                          />
                        </>
                      )}
                    </button>
                  ) : (
                    /* Direct link */
                    <Link
                      to={group.to}
                      className={cn(
                        "flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 transition-colors duration-100",
                        collapsed && "justify-center px-0",
                      )}
                      style={
                        isActive
                          ? {
                              background: "var(--primary-soft)",
                              color: "var(--foreground)",
                            }
                          : { color: "var(--muted-foreground)" }
                      }
                      title={collapsed ? group.label : undefined}
                    >
                      <group.icon className="h-[15px] w-[15px] shrink-0" />
                      {!collapsed && (
                        <span className="flex-1 text-[12.5px] font-semibold">{group.label}</span>
                      )}
                      {!collapsed && group.badge && (
                        <span
                          className="rounded px-1.5 py-px text-[9px] font-bold uppercase tracking-wider"
                          style={{
                            background: "var(--primary-soft)",
                            color: "var(--primary)",
                          }}
                        >
                          {group.badge}
                        </span>
                      )}
                    </Link>
                  )}
                </div>
              </div>

              {/* Sub-items */}
              {!collapsed && hasChildren && isExpanded && (
                <div className="mt-0.5 ml-3 space-y-0.5 pl-3" style={{ borderLeft: "1px solid var(--sidebar-border)" }}>
                  {group.children!.map((child) => {
                    const childActive = child.match(path);
                    return (
                      <Link
                        key={child.to}
                        to={child.to}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors duration-100"
                        style={
                          childActive
                            ? {
                                background: "var(--primary-soft)",
                                color: "var(--foreground)",
                              }
                            : { color: "var(--muted-foreground)" }
                        }
                      >
                        <child.icon className="h-[13px] w-[13px] shrink-0" />
                        <span className="text-[12px] font-medium">{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="shrink-0 p-2 space-y-0.5"
        style={{ borderTop: "1px solid var(--sidebar-border)" }}
      >
        {isGuest && (
          <button
            onClick={exitDemo}
            className={cn(
              "mb-1.5 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] font-medium transition-colors",
              collapsed && "justify-center px-0",
            )}
            style={{
              background: "var(--primary-soft)",
              border: "1px solid var(--primary-soft)",
              color: "var(--primary)",
            }}
            title={collapsed ? "Exit demo" : undefined}
          >
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && <span className="truncate">Exit demo</span>}
          </button>
        )}

        {footerItems.map((item) => {
          const active = path === item.to || path.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors duration-100",
                collapsed && "justify-center px-0",
              )}
              style={
                active
                  ? { background: "var(--primary-soft)", color: "var(--foreground)" }
                  : { color: "var(--muted-foreground)" }
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-[14px] w-[14px] shrink-0" />
              {!collapsed && <span className="text-[12px] font-medium">{item.label}</span>}
            </Link>
          );
        })}

        {/* User card */}
        <Link
          to="/app/settings"
          className={cn(
            "mt-1 flex items-center gap-2 rounded-md p-2 transition-colors duration-150",
            collapsed && "justify-center p-1.5",
          )}
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--sidebar-border)",
          }}
          title={collapsed ? (profile?.full_name || "Account") : undefined}
        >
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9.5px] font-bold text-white"
            style={{ background: "var(--primary)" }}
          >
            {initials}
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div
                className="truncate text-[11.5px] font-medium leading-tight"
                style={{ color: "var(--foreground)" }}
              >
                {profile?.full_name || "Account"}
              </div>
              <div
                className="truncate text-[10px] leading-tight"
                style={{ color: "var(--muted-foreground)" }}
              >
                {currentOrg?.name ?? planLabel + " plan"}
              </div>
            </div>
          )}
        </Link>

        {/* Collapse toggle */}
        <button
          onClick={toggle}
          className={cn(
            "mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1 text-[11px] transition-colors duration-150",
            collapsed && "justify-center",
          )}
          style={{ color: "var(--muted-foreground)" }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
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
    </aside>
  );
}
