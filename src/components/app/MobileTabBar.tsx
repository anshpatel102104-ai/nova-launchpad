import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, BookOpen, Map, TrendingUp, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  {
    to: "/app/mission-control",
    label: "Mission",
    icon: LayoutDashboard,
    match: (p: string) =>
      p.startsWith("/app/mission-control") || p === "/app/dashboard",
  },
  {
    to: "/app/academy",
    label: "Academy",
    icon: BookOpen,
    match: (p: string) => p.startsWith("/app/academy"),
  },
  {
    to: "/app/galaxy",
    label: "Galaxy",
    icon: Map,
    match: (p: string) => p === "/app/galaxy",
  },
  {
    to: "/app/scale",
    label: "Scale",
    icon: TrendingUp,
    match: (p: string) =>
      p.startsWith("/app/scale") ||
      p.startsWith("/app/nova") ||
      p.startsWith("/app/automations"),
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
    <nav className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/85 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-5">
        {TABS.map((t) => {
          const active = t.match ? t.match(path) : path === t.to;
          return (
            <li key={t.to}>
              <Link
                to={t.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <t.icon
                  className={cn(
                    "h-5 w-5",
                    active &&
                      "drop-shadow-[0_0_6px_color-mix(in_oklab,var(--primary)_70%,transparent)]",
                  )}
                />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
