import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  LogOut, Sun, Moon, Monitor, ChevronDown, Search, Bell, ChevronRight,
  User as UserIcon, Settings as SettingsIcon, Check, Rocket, Zap, Command,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useGuest } from "@/lib/guest";
import { useQuery } from "@tanstack/react-query";
import { subscriptionQuery } from "@/lib/queries";
import { AiOperator } from "@/components/app/AiOperator";
import { StagePill } from "@/components/app/StagePill";
import { cn } from "@/lib/utils";
import { useOwnerMode, useOwnerModeShortcut, toggleOwnerMode } from "@/lib/ownerMode";

const PAGE_TITLES: Record<string, string> = {
  "/app/dashboard": "Dashboard",
  "/app/launchpad": "Launchpad",
  "/app/launchpad/history": "Run history",
  "/app/nova": "Nova OS",
  "/app/nova/crm": "CRM Pipeline",
  "/app/nova/leads": "Lead Capture",
  "/app/nova/workflows": "Automation Workflows",
  "/app/nova/clients": "Client Onboarding",
  "/app/nova/reports": "Reporting",
  "/app/leads": "Leads",
  "/app/assets": "Assets",
  "/app/billing": "Billing",
  "/app/settings": "Settings",
};

function crumbsFor(path: string): { label: string; to?: string }[] {
  if (path.startsWith("/app/launchpad/") && path !== "/app/launchpad/history") {
    const slug = path.split("/").pop() ?? "";
    const tool = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return [{ label: "Launchpad", to: "/app/launchpad" }, { label: tool }];
  }
  if (path.startsWith("/app/nova/") && PAGE_TITLES[path]) {
    return [{ label: "Nova OS", to: "/app/nova" }, { label: PAGE_TITLES[path] }];
  }
  return [{ label: PAGE_TITLES[path] ?? "LaunchpadNOVA" }];
}

export function AppTopbar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, profile, currentOrgId, signOut } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { isGuest, disable } = useGuest();

  const isOwner = useOwnerMode();
  useOwnerModeShortcut();

  const [menuOpen, setMenuOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [opOpen, setOpOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const themeRef = useRef<HTMLDivElement | null>(null);

  const subQ = useQuery({ ...subscriptionQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const plan = subQ.data?.plan ?? "starter";

  const initials = (profile?.full_name || user?.email || "U")
    .split(/[\s@]/).filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const handleSignOut = async () => {
    if (isGuest) { disable(); navigate({ to: "/" }); return; }
    await signOut();
    navigate({ to: "/auth/sign-in" });
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
      if (!themeRef.current?.contains(e.target as Node)) setThemeOpen(false);
    };
    if (menuOpen || themeOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen, themeOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const crumbs = crumbsFor(path);
  const workspace: "launchpad" | "nova" = path.startsWith("/app/nova") ? "nova" : "launchpad";

  return (
    <>
      <header
        className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 md:px-6"
        style={{
          background: "color-mix(in oklab, var(--background) 85%, transparent)",
          backdropFilter: "blur(20px) saturate(1.8)",
          WebkitBackdropFilter: "blur(20px) saturate(1.8)",
          borderColor: "color-mix(in oklab, var(--border) 80%, transparent)",
          boxShadow: "0 1px 0 0 color-mix(in oklab, var(--border) 50%, transparent)",
        }}
      >
        {/* Mobile brand */}
        <Link to="/app/dashboard" className="flex items-center gap-2 lg:hidden">
          <div
            className="relative flex h-7 w-7 items-center justify-center rounded-lg text-white text-[11px] font-bold tracking-tight"
            style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)" }}
          >
            LN
            <span className="absolute inset-0 rounded-lg" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)" }} />
          </div>
          <span className="font-display text-[13px] font-semibold">LaunchpadNOVA</span>
        </Link>

        {/* Breadcrumb */}
        <nav className="hidden lg:flex items-center gap-1.5 text-[13px] min-w-0">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--muted-foreground)", opacity: 0.5 }} />}
              {c.to ? (
                <Link
                  to={c.to}
                  className="transition-colors truncate"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {c.label}
                </Link>
              ) : (
                <span className="font-display font-semibold truncate" style={{ color: "var(--foreground)" }}>
                  {c.label}
                </span>
              )}
            </span>
          ))}
        </nav>

        {/* Center search pill */}
        <div className="flex flex-1 justify-center">
          <button
            onClick={() => setOpOpen(true)}
            className="hidden md:flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-[12.5px] transition w-full max-w-md"
            style={{
              background: "color-mix(in oklab, var(--surface-2) 90%, transparent)",
              border: "1px solid color-mix(in oklab, var(--border) 70%, transparent)",
              color: "var(--muted-foreground)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "color-mix(in oklab, var(--primary) 30%, transparent)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "color-mix(in oklab, var(--border) 70%, transparent)";
            }}
          >
            <Search className="h-3.5 w-3.5 shrink-0 opacity-60" />
            <span className="flex-1 text-left truncate opacity-60">Ask Nova or run a command…</span>
            <kbd
              className="hidden sm:inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[10px]"
              style={{
                background: "var(--surface-offset)",
                border: "1px solid var(--border)",
                color: "var(--muted-foreground)",
              }}
            >
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {isGuest && (
            <span
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
              style={{
                background: "color-mix(in oklab, var(--warning) 12%, transparent)",
                border: "1px solid color-mix(in oklab, var(--warning) 30%, transparent)",
                color: "var(--warning)",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
              Demo
            </span>
          )}

          {/* Workspace switcher */}
          <div
            className="hidden lg:flex items-center rounded-xl p-0.5"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
            }}
          >
            <Link
              to="/app/launchpad"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11.5px] font-medium transition"
              style={workspace === "launchpad" ? {
                background: "color-mix(in oklab, var(--primary) 12%, var(--surface))",
                color: "var(--primary)",
                boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
              } : {
                color: "var(--muted-foreground)",
              }}
            >
              <Rocket className="h-3 w-3" /> Launchpad
            </Link>
            <Link
              to="/app/nova"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11.5px] font-medium transition"
              style={workspace === "nova" ? {
                background: "color-mix(in oklab, var(--accent) 12%, var(--surface))",
                color: "var(--accent)",
                boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
              } : {
                color: "var(--muted-foreground)",
              }}
            >
              <Zap className="h-3 w-3" /> Nova OS
            </Link>
          </div>

          <StagePill />

          {/* Plan badge */}
          <Link
            to="/app/billing"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-medium transition"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
              opacity: 0.8,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "color-mix(in oklab, var(--primary) 40%, transparent)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--primary)" }}
            />
            <span className="capitalize">{plan}</span>
          </Link>

          {/* Owner mode crown badge */}
          {isOwner && (
            <button
              onClick={toggleOwnerMode}
              title="Owner mode active — Ctrl+Shift+O to toggle"
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold transition"
              style={{
                background: "linear-gradient(135deg, #78350f, #92400e, #78350f)",
                border: "1px solid #b45309",
                color: "#fde68a",
                boxShadow: "0 0 12px rgba(251,191,36,0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
                animation: "breathGlow 3s ease-in-out infinite",
              }}
            >
              <span style={{ fontSize: "12px", lineHeight: 1 }}>👑</span>
              <span className="hidden sm:inline">Owner</span>
            </button>
          )}

          {/* Notifications */}
          <button
            className="relative flex h-8 w-8 items-center justify-center rounded-lg transition"
            style={{ color: "var(--muted-foreground)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
              (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
            }}
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>

          {/* Theme picker */}
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => setThemeOpen((o) => !o)}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition"
              style={{ color: "var(--muted-foreground)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
              }}
              aria-label="Choose theme"
            >
              {theme === "system" ? <Monitor className="h-4 w-4" /> : resolvedTheme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            {themeOpen && (
              <div
                className="absolute right-0 mt-2 w-40 origin-top-right overflow-hidden rounded-xl border p-1 shadow-card"
                style={{
                  background: "var(--popover)",
                  borderColor: "var(--border)",
                  boxShadow: "var(--shadow-card), 0 0 0 1px color-mix(in oklab, var(--border) 60%, transparent)",
                }}
              >
                {([
                  { id: "light", label: "Light", Icon: Sun },
                  { id: "dark", label: "Dark", Icon: Moon },
                  { id: "system", label: "System", Icon: Monitor },
                ] as const).map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => { setTheme(id); setThemeOpen(false); }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition",
                      theme === id ? "font-medium" : "opacity-70",
                    )}
                    style={{
                      color: theme === id ? "var(--foreground)" : "var(--muted-foreground)",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="flex-1 text-left">{label}</span>
                    {theme === id && <Check className="h-3.5 w-3.5" style={{ color: "var(--primary)" }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Avatar menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-1 rounded-full p-0.5 pr-1.5 transition"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-[10.5px] font-bold text-white"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
              >
                {initials}
              </span>
              <ChevronDown className="h-3 w-3" style={{ color: "var(--muted-foreground)" }} />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-60 origin-top-right overflow-hidden rounded-xl border shadow-card"
                style={{
                  background: "var(--popover)",
                  borderColor: "var(--border)",
                  boxShadow: "var(--shadow-card), 0 0 0 1px color-mix(in oklab, var(--border) 60%, transparent)",
                }}
              >
                <div className="border-b p-3" style={{ borderColor: "var(--border)" }}>
                  <div className="truncate text-[13px] font-medium">{profile?.full_name || "Account"}</div>
                  <div className="truncate text-[11.5px]" style={{ color: "var(--muted-foreground)" }}>{user?.email}</div>
                </div>
                <div className="p-1">
                  <MenuItem onClick={() => { setMenuOpen(false); navigate({ to: "/app/settings" }); }} icon={UserIcon}>Profile</MenuItem>
                  <MenuItem onClick={() => { setMenuOpen(false); navigate({ to: "/app/settings" }); }} icon={SettingsIcon}>Settings</MenuItem>
                  <div className="my-1 h-px" style={{ background: "var(--border)" }} />
                  <MenuItem onClick={handleSignOut} icon={LogOut} destructive>{isGuest ? "Exit demo" : "Sign out"}</MenuItem>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <AiOperator open={opOpen} onOpenChange={setOpOpen} />
    </>
  );
}

function MenuItem({
  onClick, icon: Icon, children, destructive,
}: { onClick: () => void; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode; destructive?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition"
      style={{ color: destructive ? "var(--destructive)" : "var(--foreground)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = destructive
          ? "color-mix(in oklab, var(--destructive) 10%, transparent)"
          : "var(--surface-2)";
      }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <Icon className="h-3.5 w-3.5" />{children}
    </button>
  );
}
