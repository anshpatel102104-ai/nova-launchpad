import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Rocket, Cpu, Inbox, FolderOpen, Settings,
  ChevronsLeft, ChevronsRight, Sparkles, ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useGuest } from "@/lib/guest";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; match?: (p: string) => boolean };

const NAV: NavItem[] = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/launchpad", label: "Launchpad", icon: Rocket, match: (p) => p.startsWith("/app/launchpad") },
  { to: "/app/nova", label: "Nova OS", icon: Cpu, match: (p) => p === "/app/nova" || p.startsWith("/app/nova/workflows") || p.startsWith("/app/nova/clients") || p.startsWith("/app/nova/reports") || p.startsWith("/app/nova/crm") },
  { to: "/app/leads", label: "Leads", icon: Inbox, match: (p) => p.startsWith("/app/leads") || p === "/app/nova/leads" },
  { to: "/app/assets", label: "Assets", icon: FolderOpen, match: (p) => p.startsWith("/app/assets") },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

const STORAGE = "nova-sidebar-collapsed";

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { currentOrg } = useAuth();
  const { isGuest, disable } = useGuest();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

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

  const toggle = () => {
    setCollapsed((c) => {
      const n = !c;
      try { localStorage.setItem(STORAGE, n ? "1" : "0"); } catch { /* ignore */ }
      return n;
    });
  };

  return (
    <aside
      className={cn(
        "hidden lg:flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-[68px]" : "w-[244px]",
      )}
    >
      {/* Brand */}
      <div className={cn("flex h-16 items-center gap-2.5 border-b border-sidebar-border px-4", collapsed && "justify-center px-0")}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <div className="font-display text-[15px] font-semibold tracking-tight">Nova OPS</div>
            <div className="text-[10.5px] tracking-wide text-muted-foreground">AI Business OS</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 text-sm">
        <div className={cn("space-y-0.5", !collapsed && "px-1")}>
          {NAV.map((item) => {
            const active = item.match ? item.match(path) : path === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-[13.5px] transition-colors",
                  collapsed && "justify-center px-0",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={cn("h-[17px] w-[17px] shrink-0", active && "text-primary")} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        {isGuest && (
          <button
            onClick={exitDemo}
            className={cn(
              "mb-2 flex w-full items-center gap-2 rounded-md border border-border bg-background px-2.5 py-2 text-left text-[12.5px] font-medium text-foreground transition hover:border-primary/50 hover:bg-accent",
              collapsed && "justify-center px-0",
            )}
            title={collapsed ? "Exit demo" : undefined}
          >
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-primary" />
            {!collapsed && <span className="truncate">Exit demo · Sign up</span>}
          </button>
        )}
        {!collapsed && !isGuest && currentOrg && (
          <div className="mb-2 rounded-md border border-sidebar-border bg-sidebar-accent/40 px-2.5 py-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Workspace</div>
            <div className="mt-0.5 truncate text-[13px] font-medium">{currentOrg.name}</div>
          </div>
        )}
        <button
          onClick={toggle}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-foreground",
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
