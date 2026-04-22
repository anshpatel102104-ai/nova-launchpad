import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Rocket, Cpu, Inbox, FolderOpen, Settings,
  ChevronsLeft, ChevronsRight, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

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
  const [collapsed, setCollapsed] = useState(false);

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
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Brand */}
      <div className={cn("flex h-16 items-center gap-2.5 border-b border-sidebar-border px-4", collapsed && "justify-center px-0")}>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary glow-primary">
          <Sparkles className="h-4.5 w-4.5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <div className="font-display text-sm font-semibold tracking-tight">Nova OPS</div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">AI Business OS</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 text-sm">
        <div className="space-y-0.5">
          {NAV.map((item) => {
            const active = item.match ? item.match(path) : path === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                  collapsed && "justify-center px-0",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                )}
                title={collapsed ? item.label : undefined}
              >
                {active && !collapsed && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                )}
                <item.icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-primary")} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        {!collapsed && currentOrg && (
          <div className="mb-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Workspace</div>
            <div className="mt-0.5 truncate text-sm font-medium">{currentOrg.name}</div>
          </div>
        )}
        <button
          onClick={toggle}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-foreground",
            collapsed && "justify-center"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <><ChevronsLeft className="h-4 w-4" /> Collapse</>}
        </button>
      </div>
    </aside>
  );
}
