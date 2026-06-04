import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import React, { useState, useEffect, useRef } from "react";
import {
  LogOut,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  User as UserIcon,
  Settings as SettingsIcon,
  Check,
  Search,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useGuest } from "@/lib/guest";
import { cn } from "@/lib/utils";
import { CommandPalette } from "./CommandPalette";

const PAGE_TITLES: Record<string, string> = {
  "/app/dashboard": "Command Center",
  "/app/launchpad": "Launchpad",
  "/app/memory": "Company Memory",
  "/app/automations": "Automations",
  "/app/contacts": "Contacts",
  "/app/leads": "Leads",
  "/app/integrations": "Integrations",
  "/app/settings": "Settings",
  "/app/billing": "Billing",
  "/app/activity": "Activity",
  "/app/ai-dashboard": "AI Dashboard",
  "/app/assets": "Assets",
  "/app/galaxy": "Galaxy Map",
  "/app/academy": "Academy",
  "/app/mentor": "Mentors",
  "/app/admin": "Admin",
};

interface AppTopbarProps {
  onToggleRail?: () => void;
  railOpen?: boolean;
}

export function AppTopbar({ onToggleRail, railOpen }: AppTopbarProps) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { isGuest, disable } = useGuest();

  const [menuOpen, setMenuOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  const initials = (profile?.full_name || user?.email || "U")
    .split(/[\s@]/)
    .filter(Boolean)
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const pageTitle =
    Object.entries(PAGE_TITLES).find(([p]) => path.startsWith(p))?.[1] ?? "";

  const handleSignOut = async () => {
    if (isGuest) {
      disable();
      navigate({ to: "/" });
      return;
    }
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
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header
        className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b px-4 shrink-0"
        style={{
          background: "var(--background)",
          borderColor: "var(--border)",
        }}
      >
        {/* Mobile: brand logo */}
        <Link to="/app/dashboard" className="flex items-center gap-2 lg:hidden shrink-0">
          <div
            className="h-6 w-6 rounded flex items-center justify-center text-white text-[10px] font-bold"
            style={{ background: "var(--primary)" }}
          >
            LN
          </div>
        </Link>

        {/* Desktop: page title */}
        {pageTitle && (
          <span
            className="hidden lg:block text-[13px] font-semibold shrink-0"
            style={{ color: "var(--foreground)" }}
          >
            {pageTitle}
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right controls */}
        <div className="flex items-center gap-1">
          {/* Search / Command Palette trigger */}
          <button
            onClick={() => setCmdOpen(true)}
            className="hidden sm:flex items-center gap-2 rounded-lg px-3 h-8 text-[12px] transition-colors"
            style={{
              background: "var(--surface-2)",
              color: "var(--muted-foreground)",
              border: "1px solid var(--border)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "color-mix(in oklab, var(--border) 180%, transparent)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            }}
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Search...</span>
            <kbd
              className="hidden md:inline text-[10px] font-mono opacity-60 ml-1"
            >
              ⌘K
            </kbd>
          </button>

          {/* Nova AI toggle */}
          {onToggleRail && (
            <button
              onClick={onToggleRail}
              title={railOpen ? "Close Nova" : "Open Nova AI"}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
              )}
              style={{
                background: railOpen ? "rgba(255,107,26,0.08)" : "transparent",
                color: railOpen ? "var(--primary)" : "var(--muted-foreground)",
                border: railOpen
                  ? "1px solid rgba(255,107,26,0.18)"
                  : "1px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!railOpen) {
                  (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                  (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
                }
              }}
              onMouseLeave={(e) => {
                if (!railOpen) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
                }
              }}
            >
              <Zap className="h-4 w-4" />
            </button>
          )}

          {/* Theme picker */}
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => setThemeOpen((o) => !o)}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
              style={{ color: "var(--muted-foreground)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
              }}
              aria-label="Theme"
            >
              {theme === "system" ? (
                <Monitor className="h-4 w-4" />
              ) : resolvedTheme === "dark" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </button>

            {themeOpen && (
              <div
                className="absolute right-0 mt-1.5 w-36 rounded-xl border p-1 overflow-hidden"
                style={{
                  background: "var(--popover)",
                  borderColor: "var(--border)",
                  boxShadow: "var(--shadow-card)",
                  zIndex: 50,
                }}
              >
                {(
                  [
                    { id: "light", label: "Light", Icon: Sun },
                    { id: "dark", label: "Dark", Icon: Moon },
                    { id: "system", label: "System", Icon: Monitor },
                  ] as const
                ).map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => {
                      setTheme(id);
                      setThemeOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] transition-colors"
                    style={{
                      color:
                        theme === id ? "var(--foreground)" : "var(--muted-foreground)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="flex-1 text-left">{label}</span>
                    {theme === id && (
                      <Check
                        className="h-3.5 w-3.5"
                        style={{ color: "var(--primary)" }}
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Avatar menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 transition-colors"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white shrink-0"
                style={{ background: "var(--primary)" }}
              >
                {initials}
              </span>
              <ChevronDown
                className="h-3 w-3 shrink-0"
                style={{ color: "var(--muted-foreground)" }}
              />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-1.5 w-52 rounded-xl border overflow-hidden"
                style={{
                  background: "var(--popover)",
                  borderColor: "var(--border)",
                  boxShadow: "var(--shadow-card)",
                  zIndex: 50,
                }}
              >
                <div
                  className="border-b p-3"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div
                    className="text-[13px] font-medium truncate"
                    style={{ color: "var(--foreground)" }}
                  >
                    {profile?.full_name || "Account"}
                  </div>
                  <div
                    className="text-[11px] truncate mt-0.5"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {user?.email}
                  </div>
                  {isGuest && (
                    <div
                      className="mt-1.5 text-[10px] font-semibold"
                      style={{ color: "var(--primary)" }}
                    >
                      Demo Mode
                    </div>
                  )}
                </div>
                <div className="p-1">
                  <TopbarMenuItem
                    onClick={() => {
                      setMenuOpen(false);
                      navigate({ to: "/app/settings" });
                    }}
                    icon={UserIcon}
                  >
                    Profile
                  </TopbarMenuItem>
                  <TopbarMenuItem
                    onClick={() => {
                      setMenuOpen(false);
                      navigate({ to: "/app/settings" });
                    }}
                    icon={SettingsIcon}
                  >
                    Settings
                  </TopbarMenuItem>
                  <div
                    className="my-1 h-px"
                    style={{ background: "var(--border)" }}
                  />
                  <TopbarMenuItem
                    onClick={handleSignOut}
                    icon={LogOut}
                    destructive
                  >
                    {isGuest ? "Exit demo" : "Sign out"}
                  </TopbarMenuItem>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  );
}

function TopbarMenuItem({
  onClick,
  icon: Icon,
  children,
  destructive,
}: {
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12.5px] transition-colors"
      style={{
        color: destructive ? "var(--destructive)" : "var(--foreground)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = destructive
          ? "color-mix(in oklab, var(--destructive) 8%, transparent)"
          : "var(--surface-2)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {children}
    </button>
  );
}
