import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import React, { useState, useEffect, useRef } from "react";
import {
  LogOut,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  Bell,
  User as UserIcon,
  Settings as SettingsIcon,
  Check,
  ArrowRight,
  Zap,
  Target,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useGuest } from "@/lib/guest";
import { NovaChatModal } from "@/components/app/NovaChatModal";
import { StagePill } from "@/components/app/StagePill";
import { MissionStatusPill } from "@/components/app/gamification/MissionStatusPill";
import { FounderLevelBadge } from "@/components/app/gamification/FounderLevelBadge";
import { cn } from "@/lib/utils";
import { useOwnerMode, useOwnerModeShortcut, toggleOwnerMode } from "@/lib/ownerMode";
import { useFounderProgress } from "@/hooks/use-founder-progress";

interface AppTopbarProps {
  onToggleRail?: () => void;
  railOpen?: boolean;
}

export function AppTopbar({ onToggleRail, railOpen }: AppTopbarProps) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, profile, currentOrgId, signOut } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { isGuest, disable } = useGuest();

  const isOwner = useOwnerMode();
  useOwnerModeShortcut();

  const progress = useFounderProgress();

  const [menuOpen, setMenuOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const themeRef = useRef<HTMLDivElement | null>(null);

  const initials = (profile?.full_name || user?.email || "U")
    .split(/[\s@]/)
    .filter(Boolean)
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

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
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setChatOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Derive next action destination based on mission progress
  const nextActionTo = progress.currentMissionTitle
    ? "/app/mission-control"
    : "/app/mission-briefing";
  const nextActionLabel = progress.currentMissionTitle ? "Continue Mission" : "Start Mission";

  return (
    <>
      <header
        className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 md:px-5"
        style={{
          background: "color-mix(in oklab, var(--background) 85%, transparent)",
          backdropFilter: "blur(20px) saturate(1.8)",
          WebkitBackdropFilter: "blur(20px) saturate(1.8)",
          borderColor: "color-mix(in oklab, var(--border) 80%, transparent)",
          boxShadow: "0 1px 0 0 color-mix(in oklab, var(--border) 50%, transparent)",
        }}
      >
        {/* Mobile brand */}
        <Link to="/app/mission-control" className="flex items-center gap-2 lg:hidden">
          <div
            className="relative flex h-7 w-7 items-center justify-center rounded-lg text-white text-[11px] font-bold tracking-tight"
            style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)" }}
          >
            LN
          </div>
          <span className="font-display text-[13px] font-semibold">LaunchpadNOVA</span>
        </Link>

        {/* LEFT: Current mission + stage */}
        <div className="hidden lg:flex items-center gap-3 min-w-0 flex-shrink-0 max-w-xs">
          <MissionStatusPill
            title={progress.currentMissionTitle}
            stepsCompleted={progress.currentMissionStepsCompleted}
            stepsTotal={progress.currentMissionStepsTotal}
            compact
          />
          <StagePill />
        </div>

        {/* CENTER: XP bar + level badge */}
        <div className="hidden md:flex flex-1 items-center justify-center gap-3 min-w-0">
          {/* XP progress */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <span
              className="text-[9px] font-mono font-bold uppercase tracking-widest shrink-0"
              style={{ color: "var(--muted-foreground)" }}
            >
              XP
            </span>
            <div
              className="relative overflow-hidden rounded-full shrink-0"
              style={{
                width: 100,
                height: 4,
                background: "rgba(245,200,140,0.08)",
              }}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700"
                style={{
                  width: `${progress.xpProgressInLevel}%`,
                  background: "linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)",
                  boxShadow: "0 0 8px rgba(249,115,22,0.55)",
                }}
              />
            </div>
            <span
              className="text-[9px] font-mono shrink-0"
              style={{ color: "var(--muted-foreground)" }}
            >
              {progress.totalXP.toLocaleString()}
            </span>
          </div>

          {!progress.isLoading && (
            <FounderLevelBadge level={progress.level} levelLabel={progress.levelLabel} size="sm" />
          )}

          {/* Next Action CTA */}
          <Link
            to={nextActionTo}
            className="hidden xl:inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-semibold transition-all btn-execute shrink-0"
            style={{ borderRadius: 8 }}
          >
            <Target className="h-3 w-3" />
            {nextActionLabel}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
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

          {/* Owner mode crown badge */}
          {isOwner && (
            <button
              onClick={toggleOwnerMode}
              title="Owner mode active — Ctrl+Shift+O to toggle"
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold transition"
              style={{
                background: "color-mix(in oklab, var(--warning) 15%, var(--surface))",
                border: "1px solid color-mix(in oklab, var(--warning) 40%, transparent)",
                color: "var(--warning)",
                boxShadow: "0 0 12px color-mix(in oklab, var(--warning) 35%, transparent)",
                animation: "breathGlow 3s ease-in-out infinite",
              }}
            >
              <span style={{ fontSize: "12px", lineHeight: 1 }}>👑</span>
              <span className="hidden sm:inline">Owner</span>
            </button>
          )}

          {/* Nova Operator rail toggle */}
          {onToggleRail && (
            <button
              onClick={onToggleRail}
              className="hidden xl:flex h-8 w-8 items-center justify-center rounded-lg transition"
              style={{
                color: railOpen ? "var(--mentor-accent)" : "var(--muted-foreground)",
                background: railOpen
                  ? "color-mix(in oklab, var(--mentor-accent) 10%, transparent)"
                  : "transparent",
              }}
              title="Nova Intelligence Rail"
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
                className="absolute right-0 mt-2 w-40 origin-top-right overflow-hidden rounded-xl border p-1 shadow-card"
                style={{
                  background: "var(--popover)",
                  borderColor: "var(--border)",
                  boxShadow:
                    "var(--shadow-card), 0 0 0 1px color-mix(in oklab, var(--border) 60%, transparent)",
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
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition",
                      theme === id ? "font-medium" : "opacity-70",
                    )}
                    style={{
                      color: theme === id ? "var(--foreground)" : "var(--muted-foreground)",
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
                      <Check className="h-3.5 w-3.5" style={{ color: "var(--primary)" }} />
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
              className="flex items-center gap-1 rounded-full p-0.5 pr-1.5 transition"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
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
                  boxShadow:
                    "var(--shadow-card), 0 0 0 1px color-mix(in oklab, var(--border) 60%, transparent)",
                }}
              >
                <div className="border-b p-3" style={{ borderColor: "var(--border)" }}>
                  <div className="truncate text-[13px] font-medium">
                    {profile?.full_name || "Account"}
                  </div>
                  <div
                    className="truncate text-[11.5px]"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {user?.email}
                  </div>
                  {!progress.isLoading && (
                    <div className="mt-1.5">
                      <FounderLevelBadge
                        level={progress.level}
                        levelLabel={progress.levelLabel}
                        size="sm"
                        showProgress
                        xpProgressInLevel={progress.xpProgressInLevel}
                      />
                    </div>
                  )}
                </div>
                <div className="p-1">
                  <MenuItem
                    onClick={() => {
                      setMenuOpen(false);
                      navigate({ to: "/app/settings" });
                    }}
                    icon={UserIcon}
                  >
                    Profile
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setMenuOpen(false);
                      navigate({ to: "/app/settings" });
                    }}
                    icon={SettingsIcon}
                  >
                    Settings
                  </MenuItem>
                  <div className="my-1 h-px" style={{ background: "var(--border)" }} />
                  <MenuItem onClick={handleSignOut} icon={LogOut} destructive>
                    {isGuest ? "Exit demo" : "Sign out"}
                  </MenuItem>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <NovaChatModal open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}

function MenuItem({
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
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition"
      style={{ color: destructive ? "var(--destructive)" : "var(--foreground)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = destructive
          ? "color-mix(in oklab, var(--destructive) 10%, transparent)"
          : "var(--surface-2)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}
