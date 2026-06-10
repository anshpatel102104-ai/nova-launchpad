import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Zap, Users, Activity, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  {
    to: "/app/dashboard",
    label: "Home",
    icon: LayoutDashboard,
    match: (p: string) => p === "/app/dashboard" || p === "/app/",
  },
  {
    to: "/app/launchpad/",
    label: "Workbench",
    icon: Zap,
    match: (p: string) => p.startsWith("/app/launchpad"),
  },
  {
    to: "/app/contacts",
    label: "Customers",
    icon: Users,
    match: (p: string) => p.startsWith("/app/contacts") || p.startsWith("/app/leads"),
  },
  {
    to: "/app/automations",
    label: "Automate",
    icon: Activity,
    match: (p: string) => p.startsWith("/app/automations") || p.startsWith("/app/scale"),
  },
  {
    to: "/app/settings",
    label: "Settings",
    icon: Settings,
    match: (p: string) => p.startsWith("/app/settings"),
  },
];

export function MobileTabBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)]"
      style={{ background: "var(--background)", borderColor: "var(--border)" }}
    >
      <ul className="grid grid-cols-5">
        {TABS.map((t) => {
          const active = t.match ? t.match(path) : path === t.to;
          return (
            <li key={t.to}>
              <Link
                to={t.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                )}
                style={{
                  color: active ? "var(--primary)" : "var(--muted-foreground)",
                }}
              >
                <t.icon className="h-5 w-5" />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
