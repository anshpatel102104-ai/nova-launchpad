import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Rocket,
  Settings,
  CreditCard,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpRight,
  BookOpen,
  Crosshair,
  TrendingUp,
  Map,
  Zap,
  Shield,
  ChevronRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useGuest } from "@/lib/guest";
import { subscriptionQuery } from "@/lib/queries";
import { useIsAdmin } from "@/lib/admin";
import { useFounderProgress } from "@/hooks/use-founder-progress";
import { FounderLevelBadge } from "@/components/app/gamification/FounderLevelBadge";
import { XPProgressBar } from "@/components/app/gamification/XPProgressBar";

type ProgressionMode = {
  to: string;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  match: (p: string) => boolean;
};

const PROGRESSION_MODES: ProgressionMode[] = [
  {
    to: "/app/mission-briefing",
    label: "Mission Briefing",
    sublabel: "Plan your strategy",
    icon: Crosshair,
    color: "#FF6B1A",
    match: (p) => p.startsWith("/app/mission-briefing"),
  },
  {
    to: "/app/academy",
    label: "Academy",
    sublabel: "Learn and execute",
    icon: BookOpen,
    color: "#7DD3FC",
    match: (p) => p.startsWith("/app/academy"),
  },
  {
    to: "/app/galaxy",
    label: "Galaxy Map",
    sublabel: "Your journey map",
    icon: Map,
    color: "#A78BFA",
    match: (p) => p === "/app/galaxy",
  },
  {
    to: "/app/mission-control",
    label: "Mission Control",
    sublabel: "Command center",
    icon: LayoutDashboard,
    color: "#34D399",
    match: (p) =>
      p.startsWith("/app/mission-control") || p === "/app/dashboard" || p === "/app/ai-dashboard",
  },
  {
    to: "/app/scale",
    label: "Scale Mode",
    sublabel: "CRM, automation, growth",
    icon: TrendingUp,
    color: "#F5A623",
    match: (p) =>
      p.startsWith("/app/scale") ||
      p.startsWith("/app/nova") ||
      p.startsWith("/app/automations") ||
      p.startsWith("/app/contacts") ||
      p.startsWith("/app/leads"),
  },
];

const STORAGE = "nova-sidebar-collapsed";

interface AppSidebarProps {
  onOpenRail?: () => void;
}

export function AppSidebar({ onOpenRail }: AppSidebarProps) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { currentOrg, currentOrgId, profile, user } = useAuth();
  const { isGuest, disable } = useGuest();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const subQ = useQuery({ ...subscriptionQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const plan = subQ.data?.plan ?? "starter";

  const progress = useFounderProgress();

  const initials = (profile?.full_name || user?.email || "U")
    .split(/[\s@]/)
    .filter(Boolean)
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE);
      if (v === "1") setCollapsed(true);
    } catch {
      /* */
    }
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      const n = !c;
      try {
        localStorage.setItem(STORAGE, n ? "1" : "0");
      } catch {
        /* */
      }
      return n;
    });
  };

  const exitDemo = () => {
    disable();
    navigate({ to: "/signup", search: { plan: undefined } });
  };

  const footerItems = [
    ...(isAdmin ? [{ to: "/app/admin", label: "Admin", icon: Shield }] : []),
    { to: "/app/settings", label: "Settings", icon: Settings },
    { to: "/app/billing", label: "Billing", icon: CreditCard },
  ];

  return (
    <aside
      className={cn(
        "hidden lg:flex shrink-0 flex-col relative",
        "transition-[width] duration-200 ease-in-out overflow-hidden",
        collapsed ? "w-[60px]" : "w-[232px]",
      )}
      style={{
        background: "var(--sidebar)",
        borderRight: "1px solid var(--sidebar-border)",
      }}
    >
      <DigitalRain />

      {/* Top edge accent */}
      <div
        className="absolute top-0 left-0 right-0 h-px z-10"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.35), transparent)",
        }}
      />

      {/* Brand */}
      <div
        className={cn(
          "relative z-10 flex h-14 items-center gap-2.5 px-3",
          collapsed && "justify-center px-0",
        )}
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <div
          className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white text-[11px] font-bold tracking-tight"
          style={{
            background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
            boxShadow:
              "0 0 14px color-mix(in oklab, var(--primary) 45%, transparent), inset 0 1px 0 color-mix(in oklab, var(--foreground) 25%, transparent)",
          }}
        >
          LN
        </div>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <div
              className="font-display text-[13.5px] font-bold tracking-tight truncate"
              style={{ color: "var(--foreground)" }}
            >
              LaunchpadNOVA
            </div>
            <div
              className="text-[9px] font-semibold truncate uppercase tracking-widest"
              style={{ color: "rgba(249,115,22,0.55)", letterSpacing: "0.14em" }}
            >
              Founder OS
            </div>
          </div>
        )}
      </div>

      {/* Progression Nav */}
      <nav className="relative z-10 flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {PROGRESSION_MODES.map((mode) => {
          const active = mode.match(path);
          return (
            <div key={mode.to} className="relative">
              {/* Active rail */}
              {active && (
                <span
                  className="rail-in absolute left-0 top-1 bottom-1 w-[2px] rounded-r-full z-10"
                  style={{
                    background: mode.color,
                    boxShadow: `0 0 8px ${mode.color}80`,
                  }}
                />
              )}

              <Link
                to={mode.to}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all duration-150",
                  collapsed && "justify-center px-0",
                )}
                style={
                  active
                    ? {
                        background: `color-mix(in oklab, ${mode.color} 9%, transparent)`,
                        color: "var(--foreground)",
                      }
                    : { color: "rgba(237,232,223,0.42)" }
                }
                onMouseEnter={(e: MouseEvent) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = "rgba(249,115,22,0.05)";
                    (e.currentTarget as HTMLElement).style.color = "rgba(237,232,223,0.75)";
                  }
                }}
                onMouseLeave={(e: MouseEvent) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "rgba(237,232,223,0.42)";
                  }
                }}
                title={collapsed ? mode.label : undefined}
              >
                <mode.icon
                  className="h-[16px] w-[16px] shrink-0 transition-all"
                  style={
                    active
                      ? { color: mode.color, filter: `drop-shadow(0 0 4px ${mode.color}80)` }
                      : undefined
                  }
                />
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[12.5px] font-semibold truncate leading-tight"
                      style={{ color: active ? "var(--foreground)" : undefined }}
                    >
                      {mode.label}
                    </div>
                    <div
                      className="text-[9.5px] truncate leading-tight mt-0.5"
                      style={{ color: "rgba(237,232,223,0.28)" }}
                    >
                      {mode.sublabel}
                    </div>
                  </div>
                )}
              </Link>
            </div>
          );
        })}

        {/* Nova Operator separator */}
        <div className="my-3 mx-1 h-px" style={{ background: "var(--sidebar-border)" }} />

        {/* Nova Operator button */}
        <button
          onClick={onOpenRail}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all duration-150",
            collapsed && "justify-center px-0",
          )}
          style={{ color: "rgba(237,232,223,0.42)" }}
          onMouseEnter={(e: MouseEvent) => {
            (e.currentTarget as HTMLElement).style.background =
              "color-mix(in oklab, var(--mentor-accent) 8%, transparent)";
            (e.currentTarget as HTMLElement).style.color = "var(--mentor-accent)";
          }}
          onMouseLeave={(e: MouseEvent) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "rgba(237,232,223,0.42)";
          }}
          title={collapsed ? "Nova Operator" : undefined}
        >
          <Zap className="h-[15px] w-[15px] shrink-0" />
          {!collapsed && (
            <div className="min-w-0 flex-1 text-left">
              <div className="text-[12.5px] font-semibold truncate leading-tight">
                Nova Operator
              </div>
              <div
                className="text-[9.5px] truncate leading-tight mt-0.5"
                style={{ color: "rgba(237,232,223,0.28)" }}
              >
                AI intelligence layer
              </div>
            </div>
          )}
          {!collapsed && <ChevronRight className="h-3 w-3 shrink-0 opacity-40" />}
        </button>

        {/* XP Progress strip (visible when expanded) */}
        {!collapsed && !progress.isLoading && (
          <div
            className="mt-3 rounded-xl p-3"
            style={{
              background: "rgba(245,200,140,0.04)",
              border: "1px solid var(--sidebar-border)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <FounderLevelBadge
                level={progress.level}
                levelLabel={progress.levelLabel}
                size="sm"
              />
              <span className="text-[9px] font-mono" style={{ color: "var(--muted-foreground)" }}>
                {progress.totalXP.toLocaleString()} XP
              </span>
            </div>
            <XPProgressBar
              percent={progress.xpProgressInLevel}
              currentXP={progress.totalXP}
              xpForNextLevel={progress.xpForNextLevel}
              animate={false}
              height={3}
            />
            <div className="mt-1.5 text-[9px] truncate" style={{ color: "rgba(237,232,223,0.22)" }}>
              Next: {progress.nextMilestone}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="relative z-10 p-2" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
        {isGuest && (
          <button
            onClick={exitDemo}
            className={cn(
              "mb-2 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12px] font-medium transition-all",
              collapsed && "justify-center px-0",
            )}
            style={{
              background: "rgba(249,115,22,0.08)",
              border: "1px solid rgba(249,115,22,0.22)",
              color: "var(--primary)",
            }}
            title={collapsed ? "Exit demo" : undefined}
          >
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && <span className="truncate">Exit demo</span>}
          </button>
        )}

        <div className="space-y-0.5">
          {footerItems.map((item) => {
            const active = path === item.to || path.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-all duration-150",
                  collapsed && "justify-center px-0",
                )}
                style={
                  active
                    ? {
                        background: "rgba(249,115,22,0.09)",
                        color: "var(--foreground)",
                      }
                    : { color: "rgba(237,232,223,0.38)" }
                }
                onMouseEnter={(e: MouseEvent) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = "rgba(249,115,22,0.05)";
                    (e.currentTarget as HTMLElement).style.color = "rgba(237,232,223,0.72)";
                  }
                }}
                onMouseLeave={(e: MouseEvent) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "rgba(237,232,223,0.38)";
                  }
                }}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-[14px] w-[14px] shrink-0" />
                {!collapsed && (
                  <span className="truncate text-[12px] font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </div>

        {/* User card */}
        <Link
          to="/app/settings"
          className={cn(
            "mt-2 flex items-center gap-2.5 rounded-xl p-2 transition-all duration-200",
            collapsed && "justify-center p-1.5",
          )}
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--sidebar-border)",
          }}
          onMouseEnter={(e: MouseEvent) => {
            (e.currentTarget as HTMLElement).style.borderColor =
              "color-mix(in oklab, var(--primary) 28%, transparent)";
            (e.currentTarget as HTMLElement).style.background =
              "color-mix(in oklab, var(--primary) 6%, transparent)";
          }}
          onMouseLeave={(e: MouseEvent) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--sidebar-border)";
            (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
          }}
        >
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9.5px] font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #F97316, #EA580C)",
              boxShadow: "0 0 10px rgba(249,115,22,0.40)",
            }}
          >
            {initials}
          </span>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[11.5px] font-medium leading-tight"
                  style={{ color: "var(--foreground)" }}
                >
                  {profile?.full_name || "Account"}
                </div>
                <div
                  className="truncate text-[9.5px] leading-tight"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {currentOrg?.name ?? plan}
                </div>
              </div>
              {!progress.isLoading && (
                <FounderLevelBadge
                  level={progress.level}
                  levelLabel={progress.levelLabel}
                  size="sm"
                />
              )}
            </>
          )}
        </Link>

        {/* Collapse toggle */}
        <button
          onClick={toggle}
          className={cn(
            "mt-1.5 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] transition-all duration-200",
            collapsed && "justify-center",
          )}
          style={{ color: "rgba(237,232,223,0.22)" }}
          onMouseEnter={(e: MouseEvent) => {
            (e.currentTarget as HTMLElement).style.color = "rgba(249,115,22,0.65)";
            (e.currentTarget as HTMLElement).style.background = "rgba(249,115,22,0.06)";
          }}
          onMouseLeave={(e: MouseEvent) => {
            (e.currentTarget as HTMLElement).style.color = "rgba(237,232,223,0.22)";
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronsRight className="h-3.5 w-3.5" />
          ) : (
            <>
              <ChevronsLeft className="h-3.5 w-3.5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

/* ── Digital Rain Canvas ── */
function DigitalRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const COLS = Math.floor(canvas.offsetWidth / 16);
    const drops: number[] = Array(COLS)
      .fill(0)
      .map(() => (Math.random() * -canvas.offsetHeight) / 14);
    const speeds: number[] = Array(COLS)
      .fill(0)
      .map(() => 0.3 + Math.random() * 0.5);

    const CHARS = "01アウイエオカキクケコサシスセソタチツテトナニヌネノ";
    let frame = 0;

    const tick = () => {
      frame++;
      const H = canvas.height;
      const W = canvas.width;

      ctx.fillStyle = "rgba(7,8,13,0.05)";
      ctx.fillRect(0, 0, W, H);
      ctx.font = "10px 'JetBrains Mono', monospace";

      for (let i = 0; i < drops.length; i++) {
        const y = drops[i] * 14;
        if (y < 0 || y > H) {
          drops[i] += speeds[i];
          continue;
        }

        ctx.fillStyle = "rgba(249,115,22,0.55)";
        ctx.shadowBlur = 4;
        ctx.shadowColor = "#F97316";
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        ctx.fillText(char, i * 14, y);

        if (drops[i] > 3) {
          ctx.fillStyle = "rgba(251,191,36,0.16)";
          ctx.shadowBlur = 0;
          const trailChar = CHARS[Math.floor(Math.random() * CHARS.length)];
          ctx.fillText(trailChar, i * 14, y - 14);
        }

        drops[i] += speeds[i];

        if (y > H && Math.random() > 0.97) {
          drops[i] = -Math.random() * 20;
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: "100%", height: "100%", opacity: 0.35, zIndex: 0 }}
    />
  );
}
