import { useEffect, useState } from "react";
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
    id: "playbook",
    label: "Playbook",
    icon: BookOpen,
    to: "/app/playbook",
    match: (p) => p === "/app/playbook",
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
      p === "/app/launch-control" ||
      p === "/app/templates" ||
      p === "/app/sop-library" ||
      p.startsWith("/app/mission"),
    children: [
      {
        label: "Launchpad",
        to: "/app/launchpad",
        icon: Sparkles,
        match: (p) => p.startsWith("/app/launchpad"),
      },
      {
        label: "Launch Control",
        to: "/app/launch-control",
        icon: Crosshair,
        match: (p) => p === "/app/launch-control",
      },
      {
        label: "First Customers",
        to: "/app/launchpad/first-customers",
        icon: Users,
        match: (p) => p === "/app/launchpad/first-customers",
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
      p === "/app/leads" ||
      p === "/app/command-center" ||
      p === "/app/nova-os" ||
      p.startsWith("/app/nova-os/") ||
      p === "/app/approvals",
    children: [
      {
        label: "Command Center",
        to: "/app/command-center",
        icon: LayoutDashboard,
        match: (p) => p === "/app/command-center",
      },
      {
        label: "Nova OS",
        to: "/app/nova-os",
        icon: Zap,
        match: (p) => p === "/app/nova-os" || p.startsWith("/app/nova-os/"),
      },
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
        label: "Approvals",
        to: "/app/approvals",
        icon: ClipboardList,
        match: (p) => p === "/app/approvals",
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
    id: "monitoring",
    label: "Monitoring",
    icon: Activity,
    to: "/app/monitoring",
    match: (p) => p === "/app/monitoring",
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
    icon: BarChart3,
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

/* Which group IDs begin a new named section */
const SECTION_STARTS: Record<string, string> = {
  build: "Build",
  operate: "Operate",
  automate: "Automate",
  monitoring: "Monitoring",
};

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

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-px">
        {NAV_GROUPS.map((group) => {
          const isActive = group.match(path);
          const isExpanded = expandedGroups.has(group.id);
          const hasChildren = !!group.children?.length;
          const sectionLabel = SECTION_STARTS[group.id];

          return (
            <div key={group.id}>
              {/* Section header */}
              {sectionLabel && !collapsed && (
                <div className="px-3 pt-4 pb-1">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: "var(--muted-foreground)", opacity: 0.55 }}
                  >
                    {sectionLabel}
                  </span>
                </div>
              )}
              {sectionLabel && collapsed && (
                <div className="mx-2 my-2 h-px" style={{ background: "var(--sidebar-border)" }} />
              )}

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
