import { Link, useRouterState } from "@tanstack/react-router";
import { Crosshair, Rocket, Megaphone, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// Nova OS mobile nav — mirrors the outcome-first primary sidebar:
// Mission Control · Build · Launch · Grow · Nova
const TABS = [
  {
    to: "/app/mission-control",
    label: "Home",
    icon: Crosshair,
    match: (p: string) => p === "/app/mission-control" || p === "/app/dashboard" || p === "/app/",
  },
  {
    to: "/app/outcomes/build",
    label: "Build",
    icon: Rocket,
    match: (p: string) => p === "/app/outcomes/build" || p.startsWith("/app/launchpad"),
  },
  {
    to: "/app/outcomes/launch",
    label: "Launch",
    icon: Megaphone,
    match: (p: string) =>
      p === "/app/outcomes/launch" || p.startsWith("/app/contacts") || p.startsWith("/app/leads"),
  },
  {
    to: "/app/outcomes/grow",
    label: "Grow",
    icon: TrendingUp,
    match: (p: string) =>
      p === "/app/outcomes/grow" || p.startsWith("/app/automations") || p.startsWith("/app/scale"),
  },
  {
    to: "/app/mentor",
    label: "Nova",
    icon: Sparkles,
    match: (p: string) => p === "/app/mentor",
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
