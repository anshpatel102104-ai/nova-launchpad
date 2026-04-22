import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Rocket, Cpu, Inbox, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/app/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/app/launchpad", label: "Tools", icon: Rocket, match: (p: string) => p.startsWith("/app/launchpad") },
  { to: "/app/nova", label: "Nova", icon: Cpu, match: (p: string) => p.startsWith("/app/nova") },
  { to: "/app/leads", label: "Leads", icon: Inbox },
  { to: "/app/assets", label: "Assets", icon: FolderOpen },
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
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <t.icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_6px_color-mix(in_oklab,var(--primary)_70%,transparent)]")} />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
