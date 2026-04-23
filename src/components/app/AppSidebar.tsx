import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Rocket, Zap, Users, GitBranch, CheckSquare, BarChart2,
  Settings, CreditCard, ChevronsLeft, ChevronsRight, ChevronDown, ArrowUpRight,
  Lightbulb, Megaphone, Target, Skull, Trophy, UserPlus, FileText, Mail,
  GitCompare, Globe, Inbox, Workflow, ListChecks, UserCheck, LineChart, Shield,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useGuest } from "@/lib/guest";
import { subscriptionQuery } from "@/lib/queries";
import { useIsAdmin } from "@/lib/admin";

type SubItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };
type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match?: (p: string) => boolean;
  children?: SubItem[];
  workspace?: "launchpad" | "nova";
};

const LAUNCHPAD_TOOLS: SubItem[] = [
  { to: "/app/launchpad/idea-validator",     label: "Idea Validator",   icon: Lightbulb },
  { to: "/app/launchpad/pitch-generator",    label: "Pitch Generator",  icon: Megaphone },
  { to: "/app/launchpad/gtm-strategy",       label: "GTM Strategy",     icon: Target },
  { to: "/app/launchpad/kill-my-idea",       label: "Kill My Idea",     icon: Skull },
  { to: "/app/launchpad/funding-score",      label: "Funding Score",    icon: Trophy },
  { to: "/app/launchpad/first-10-customers", label: "First 10 Customers", icon: UserPlus },
  { to: "/app/launchpad/business-plan",      label: "Business Plan",    icon: FileText },
  { to: "/app/launchpad/investor-emails",    label: "Investor Emails",  icon: Mail },
  { to: "/app/launchpad/idea-vs-idea",       label: "Idea vs Idea",     icon: GitCompare },
  { to: "/app/launchpad/landing-page",       label: "Landing Page",     icon: Globe },
];

const NOVA_MODULES: SubItem[] = [
  { to: "/app/nova/crm",       label: "CRM Pipeline",       icon: Workflow },
  { to: "/app/nova/leads",     label: "Lead Capture",       icon: Inbox },
  { to: "/app/nova/workflows", label: "Automation",         icon: GitBranch },
  { to: "/app/nova/clients",   label: "Client Onboarding",  icon: ListChecks },
  { to: "/app/nova/reports",   label: "Reporting",          icon: LineChart },
];

const NAV: NavItem[] = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    to: "/app/launchpad", label: "Launchpad", icon: Rocket, workspace: "launchpad",
    match: (p) => p.startsWith("/app/launchpad"), children: LAUNCHPAD_TOOLS,
  },
  {
    to: "/app/nova", label: "Nova OS", icon: Zap, workspace: "nova",
    match: (p) => p === "/app/nova" || p.startsWith("/app/nova/"), children: NOVA_MODULES,
  },
  { to: "/app/leads",    label: "Leads",    icon: Users,       match: (p) => p.startsWith("/app/leads") },
  { to: "/app/nova/workflows", label: "Workflows", icon: GitBranch, match: (p) => p === "/app/nova/workflows" },
  { to: "/app/nova/clients",   label: "Clients",   icon: CheckSquare, match: (p) => p === "/app/nova/clients" },
  { to: "/app/nova/reports",   label: "Reports",   icon: BarChart2, match: (p) => p === "/app/nova/reports" },
];

const FOOTER_NAV: NavItem[] = [
  { to: "/app/settings", label: "Settings", icon: Settings },
  { to: "/app/billing",  label: "Billing",  icon: CreditCard },
];

const STORAGE = "nova-sidebar-collapsed";

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { currentOrg, currentOrgId, profile, user } = useAuth();
  const { isGuest, disable } = useGuest();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "/app/launchpad": path.startsWith("/app/launchpad"),
    "/app/nova": path.startsWith("/app/nova"),
  });

  const subQ = useQuery({ ...subscriptionQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const plan = subQ.data?.plan ?? "starter";

  const footerNav: NavItem[] = [
    ...(isAdmin ? [{ to: "/app/admin", label: "Admin", icon: Shield } as NavItem] : []),
    ...FOOTER_NAV,
  ];

  const exitDemo = () => {
    disable();
    navigate({ to: "/signup", search: { plan: undefined } });
  };

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE);
      if (v === "1") setCollapsed(true);
    } catch { /* ignore */ }
  }, []);

  // Auto-open the active group
  useEffect(() => {
    setOpenGroups((g) => ({
      ...g,
      "/app/launchpad": g["/app/launchpad"] || path.startsWith("/app/launchpad"),
      "/app/nova": g["/app/nova"] || path.startsWith("/app/nova"),
    }));
  }, [path]);

  const toggle = () => {
    setCollapsed((c) => {
      const n = !c;
      try { localStorage.setItem(STORAGE, n ? "1" : "0"); } catch { /* ignore */ }
      return n;
    });
  };

  const initials = (profile?.full_name || user?.email || "U")
    .split(/[\s@]/).filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <aside
      className={cn(
        "hidden lg:flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-[64px]" : "w-[240px]",
      )}
    >
      {/* Brand */}
      <div className={cn("flex h-14 items-center gap-2.5 border-b border-sidebar-border px-3", collapsed && "justify-center px-0")}>
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-primary text-white font-display font-bold text-[13px] tracking-tight glow-primary">
          LN
        </div>
        {!collapsed && (
          <div className="leading-tight overflow-hidden">
            <div className="font-display text-[14px] font-semibold tracking-tight truncate">LaunchpadNOVA</div>
            <div className="text-[10px] text-muted-foreground truncate">AI Business OS</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 text-sm">
        <div className="space-y-0.5">
          {NAV.slice(0, 3).map((item) => (
            <NavRow
              key={item.to}
              item={item}
              path={path}
              collapsed={collapsed}
              open={!!openGroups[item.to]}
              onToggle={() => setOpenGroups((g) => ({ ...g, [item.to]: !g[item.to] }))}
            />
          ))}

          {!collapsed && (
            <div className="mt-5 mb-1.5 px-2.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
              Operations
            </div>
          )}
          {!collapsed && <div className="my-2 mx-2.5 h-px bg-sidebar-border" />}

          {NAV.slice(3).map((item) => (
            <NavRow
              key={item.to + item.label}
              item={item}
              path={path}
              collapsed={collapsed}
              open={false}
              onToggle={() => {}}
            />
          ))}
        </div>
      </nav>

      {/* Footer cluster */}
      <div className="border-t border-sidebar-border p-2">
        {isGuest && (
          <button
            onClick={exitDemo}
            className={cn(
              "mb-2 flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-surface-2 px-2.5 py-1.5 text-left text-[12px] font-medium transition hover:border-primary/50",
              collapsed && "justify-center px-0",
            )}
            title={collapsed ? "Exit demo" : undefined}
          >
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-primary" />
            {!collapsed && <span className="truncate">Exit demo</span>}
          </button>
        )}

        <div className="space-y-0.5">
          {footerNav.map((item) => (
            <NavRow key={item.to} item={item} path={path} collapsed={collapsed} open={false} onToggle={() => {}} />
          ))}
        </div>

        {/* User card */}
        <Link
          to="/app/settings"
          className={cn(
            "mt-2 flex items-center gap-2.5 rounded-md border border-sidebar-border bg-surface-2 p-2 transition hover:border-foreground/15",
            collapsed && "justify-center border-transparent bg-transparent p-1.5",
          )}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10.5px] font-semibold text-primary">
            {initials}
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-medium">{profile?.full_name || "Account"}</div>
              <div className="truncate text-[10.5px] text-muted-foreground capitalize">{currentOrg?.name ?? plan + " plan"}</div>
            </div>
          )}
          {!collapsed && (
            <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
              {plan}
            </span>
          )}
        </Link>

        <button
          onClick={toggle}
          className={cn(
            "mt-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[11px] text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-foreground",
            collapsed && "justify-center",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <><ChevronsLeft className="h-4 w-4" /> Collapse</>}
        </button>
      </div>
    </aside>
  );
}

function NavRow({
  item, path, collapsed, open, onToggle,
}: { item: NavItem; path: string; collapsed: boolean; open: boolean; onToggle: () => void }) {
  const active = item.match ? item.match(path) : path === item.to;
  const exactActive = path === item.to;
  const hasChildren = !!item.children?.length && !collapsed;
  const accentClass = item.workspace === "nova" ? "text-accent" : "text-primary";

  return (
    <div>
      <div className="relative flex items-center">
        {/* Active rail */}
        {active && (
          <span
            className={cn(
              "absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r",
              item.workspace === "nova" ? "bg-accent" : "bg-primary",
            )}
          />
        )}
        <Link
          to={item.to}
          className={cn(
            "group relative flex flex-1 items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
            collapsed && "justify-center px-0",
            active
              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
          )}
          title={collapsed ? item.label : undefined}
        >
          <item.icon className={cn("h-[16px] w-[16px] shrink-0", exactActive && accentClass)} />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </Link>
        {hasChildren && (
          <button
            onClick={(e) => { e.preventDefault(); onToggle(); }}
            className="mr-1 flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground"
            aria-label={open ? "Collapse" : "Expand"}
          >
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
          </button>
        )}
      </div>

      {hasChildren && open && (
        <ul className="mt-0.5 ml-3 space-y-0.5 border-l border-sidebar-border pl-2">
          {item.children!.map((c) => {
            const cActive = path === c.to;
            return (
              <li key={c.to}>
                <Link
                  to={c.to}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2 py-1 text-[12.5px] transition-colors",
                    cActive
                      ? "bg-sidebar-accent text-foreground font-medium"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                  )}
                >
                  <c.icon className={cn("h-3.5 w-3.5 shrink-0", cActive && accentClass)} />
                  <span className="truncate">{c.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
