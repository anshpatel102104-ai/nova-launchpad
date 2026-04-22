import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { LogOut, Sun, Moon, ChevronDown, Sparkles, User as UserIcon, Settings as SettingsIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useGuest } from "@/lib/guest";
import { useQuery } from "@tanstack/react-query";
import { subscriptionQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/app/dashboard": "Dashboard",
  "/app/launchpad": "Launchpad",
  "/app/launchpad/history": "Run History",
  "/app/nova": "Nova OS",
  "/app/nova/crm": "CRM Pipeline",
  "/app/nova/leads": "Leads",
  "/app/nova/workflows": "Workflows",
  "/app/nova/clients": "Clients",
  "/app/nova/reports": "Reports",
  "/app/leads": "Leads",
  "/app/assets": "Assets",
  "/app/billing": "Billing",
  "/app/settings": "Settings",
};

function titleFor(path: string): string {
  if (PAGE_TITLES[path]) return PAGE_TITLES[path];
  if (path.startsWith("/app/launchpad/")) {
    const slug = path.split("/").pop() ?? "";
    return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return "Nova OPS";
}

export function AppTopbar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, profile, currentOrgId, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const subQ = useQuery({ ...subscriptionQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const plan = subQ.data?.plan ?? "starter";

  const initials = (profile?.full_name || user?.email || "U")
    .split(/[\s@]/).filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/auth/sign-in" });
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl md:px-6">
      {/* Mobile brand */}
      <Link to="/app/dashboard" className="flex items-center gap-2 lg:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-display text-sm font-semibold">Nova OPS</span>
      </Link>

      {/* Page title (desktop) */}
      <div className="hidden flex-1 items-center lg:flex">
        <h1 className="font-display text-base font-semibold tracking-tight">{titleFor(path)}</h1>
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {/* Plan badge */}
        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="capitalize">{plan} plan</span>
        </span>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
          aria-label="Toggle theme"
          title={theme === "dark" ? "Switch to light" : "Switch to dark"}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Avatar menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-full p-0.5 pr-1.5 transition hover:bg-accent"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-xs font-semibold text-primary-foreground">
              {initials}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-60 origin-top-right overflow-hidden rounded-xl border border-border bg-popover shadow-elevated animate-scale-in">
              <div className="border-b border-border p-3">
                <div className="truncate text-sm font-medium">{profile?.full_name || "Account"}</div>
                <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
              </div>
              <div className="p-1">
                <MenuItem onClick={() => { setMenuOpen(false); navigate({ to: "/app/settings" }); }} icon={UserIcon}>Profile</MenuItem>
                <MenuItem onClick={() => { setMenuOpen(false); navigate({ to: "/app/settings" }); }} icon={SettingsIcon}>Settings</MenuItem>
                <div className="my-1 h-px bg-border" />
                <MenuItem onClick={handleSignOut} icon={LogOut} destructive>Sign out</MenuItem>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuItem({ onClick, icon: Icon, children, destructive }: { onClick: () => void; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode; destructive?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition",
        destructive ? "text-destructive hover:bg-destructive/10" : "hover:bg-accent"
      )}
    >
      <Icon className="h-4 w-4" />{children}
    </button>
  );
}
