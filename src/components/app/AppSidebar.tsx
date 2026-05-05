import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Rocket,
  Zap,
  Users,
  GitBranch,
  CheckSquare,
  BarChart2,
  Settings,
  CreditCard,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ArrowUpRight,
  Lightbulb,
  Megaphone,
  Target,
  Skull,
  Trophy,
  UserPlus,
  FileText,
  Mail,
  GitCompare,
  Globe,
  Inbox,
  Workflow,
  ListChecks,
  LineChart,
  Shield,
  Tags,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useGuest } from "@/lib/guest";
import { subscriptionQuery } from "@/lib/queries";
import { useIsAdmin } from "@/lib/admin";

type SubItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };
type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match?: (p: string) => boolean;
  children?: SubItem[];
  workspace?: "launchpad" | "nova";
};

const LAUNCHPAD_TOOLS: SubItem[] = [
  { to: "/app/launchpad/idea-validator", label: "Idea Validator", icon: Lightbulb },
  { to: "/app/launchpad/pitch-generator", label: "Pitch Generator", icon: Megaphone },
  { to: "/app/launchpad/gtm-strategy", label: "GTM Strategy", icon: Target },
  { to: "/app/launchpad/kill-my-idea", label: "Kill My Idea", icon: Skull },
  { to: "/app/launchpad/funding-score", label: "Funding Score", icon: Trophy },
  { to: "/app/launchpad/first-10-customers", label: "First 10 Customers", icon: UserPlus },
  { to: "/app/launchpad/business-plan", label: "Business Plan", icon: FileText },
  { to: "/app/launchpad/investor-emails", label: "Investor Emails", icon: Mail },
  { to: "/app/launchpad/idea-vs-idea", label: "Idea vs Idea", icon: GitCompare },
  { to: "/app/launchpad/landing-page", label: "Landing Page", icon: Globe },
  { to: "/app/launchpad/competitor", label: "Competitor", icon: Target },
  { to: "/app/launchpad/pricing", label: "Pricing Strategy", icon: Tags },
  { to: "/app/launchpad/revenue-projector", label: "Revenue Projector", icon: LineChart },
];

const NOVA_MODULES: SubItem[] = [
  { to: "/app/nova/crm", label: "CRM Pipeline", icon: Workflow },
  { to: "/app/nova/leads", label: "Lead Capture", icon: Inbox },
  { to: "/app/nova/workflows", label: "Automation", icon: GitBranch },
  { to: "/app/nova/clients", label: "Client Onboarding", icon: ListChecks },
  { to: "/app/nova/reports", label: "Reporting", icon: LineChart },
];

const NAV: NavItem[] = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    to: "/app/launchpad",
    label: "Launchpad",
    icon: Rocket,
    workspace: "launchpad",
    match: (p) => p.startsWith("/app/launchpad"),
    children: LAUNCHPAD_TOOLS,
  },
  {
    to: "/app/nova",
    label: "Nova OS",
    icon: Zap,
    workspace: "nova",
    match: (p) => p === "/app/nova" || p.startsWith("/app/nova/"),
    children: NOVA_MODULES,
  },
  { to: "/app/leads", label: "Leads", icon: Users, match: (p) => p.startsWith("/app/leads") },
  {
    to: "/app/nova/workflows",
    label: "Workflows",
    icon: GitBranch,
    match: (p) => p === "/app/nova/workflows",
  },
  {
    to: "/app/nova/clients",
    label: "Clients",
    icon: CheckSquare,
    match: (p) => p === "/app/nova/clients",
  },
  {
    to: "/app/nova/reports",
    label: "Reports",
    icon: BarChart2,
    match: (p) => p === "/app/nova/reports",
  },
];

const FOOTER_NAV: NavItem[] = [
  { to: "/app/settings", label: "Settings", icon: Settings },
  { to: "/app/billing", label: "Billing", icon: CreditCard },
];

const STORAGE = "nova-sidebar-collapsed";

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { currentOrg, currentOrgId, profile, user } = useAuth();
  const { isGuest, disable } = useGuest();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "/app/launchpad": path.startsWith("/app/launchpad"),
    "/app/nova": path.startsWith("/app/nova"),
  });

  const subQ = useQuery({ ...subscriptionQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const plan = subQ.data?.plan ?? "starter";

  const footerNav: NavItem[] = [
    ...(isAdmin ? [{ to: "/app/admin", label: "Admin", icon: Shield } as NavItem] : []),
    ...FOOTER_NAV,
  ];

  const exitDemo = () => {
    disable();
    navigate({ to: "/signup", search: { plan: undefined } });
  };

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE);
      if (v === "1") setCollapsed(true);
    } catch {
      /* */
    }
  }, []);

  useEffect(() => {
    setOpenGroups((g) => ({
      ...g,
      "/app/launchpad": g["/app/launchpad"] || path.startsWith("/app/launchpad"),
      "/app/nova": g["/app/nova"] || path.startsWith("/app/nova"),
    }));
  }, [path]);

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

  const initials = (profile?.full_name || user?.email || "U")
    .split(/[\s@]/)
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside
      className={cn(
        "hidden lg:flex shrink-0 flex-col relative",
        "transition-[width] duration-200 ease-in-out overflow-hidden",
        collapsed ? "w-[60px]" : "w-[232px]",
      )}
      style={{
        background: "var(--sidebar)",
        borderRight: "1px solid rgba(59,130,246,0.08)",
      }}
    >
      {/* Digital rain canvas — sits behind everything */}
      <DigitalRain />

      {/* Top neon edge line */}
      <div
        className="absolute top-0 left-0 right-0 h-px z-10"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent)",
        }}
      />

      {/* Brand */}
      <div
        className={cn(
          "relative z-10 flex h-14 items-center gap-2.5 px-3",
          collapsed && "justify-center px-0",
        )}
        style={{ borderBottom: "1px solid rgba(59,130,246,0.08)" }}
      >
        <div
          className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white text-[11px] font-bold tracking-tight"
          style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
            boxShadow: "0 0 16px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
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
              className="text-[9.5px] font-medium truncate"
              style={{ color: "rgba(59,130,246,0.7)", letterSpacing: "0.06em" }}
            >
              AI BUSINESS OS
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-0.5">
          {NAV.slice(0, 3).map((item) => (
            <NavRow
              key={item.to}
              item={item}
              path={path}
              collapsed={collapsed}
              open={!!openGroups[item.to]}
              onToggle={() => setOpenGroups((g) => ({ ...g, [item.to]: !g[item.to] }))}
            />
          ))}

          {!collapsed && (
            <div className="mt-5 mb-1 px-2">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1" style={{ background: "rgba(59,130,246,0.12)" }} />
                <span
                  className="text-[8.5px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: "rgba(59,130,246,0.4)" }}
                >
                  Ops
                </span>
                <div className="h-px flex-1" style={{ background: "rgba(59,130,246,0.12)" }} />
              </div>
            </div>
          )}
          {collapsed && (
            <div className="my-3 mx-2 h-px" style={{ background: "rgba(59,130,246,0.12)" }} />
          )}

          {NAV.slice(3).map((item) => (
            <NavRow
              key={item.to + item.label}
              item={item}
              path={path}
              collapsed={collapsed}
              open={false}
              onToggle={() => {}}
            />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="relative z-10 p-2" style={{ borderTop: "1px solid rgba(59,130,246,0.08)" }}>
        {isGuest && (
          <button
            onClick={exitDemo}
            className={cn(
              "mb-2 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12px] font-medium transition-all",
              collapsed && "justify-center px-0",
            )}
            style={{
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.2)",
              color: "var(--primary)",
            }}
            title={collapsed ? "Exit demo" : undefined}
          >
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && <span className="truncate">Exit demo</span>}
          </button>
        )}

        <div className="space-y-0.5">
          {footerNav.map((item) => (
            <NavRow
              key={item.to}
              item={item}
              path={path}
              collapsed={collapsed}
              open={false}
              onToggle={() => {}}
            />
          ))}
        </div>

        {/* User card */}
        <Link
          to="/app/settings"
          className={cn(
            "mt-2 flex items-center gap-2.5 rounded-xl p-2 transition-all duration-200",
            collapsed && "justify-center p-1.5",
          )}
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(59,130,246,0.1)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.3)";
            (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.06)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.1)";
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
          }}
        >
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9.5px] font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              boxShadow: "0 0 10px rgba(59,130,246,0.4)",
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
              <span
                className="rounded-full px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wide"
                style={{
                  background: "rgba(59,130,246,0.15)",
                  color: "var(--primary)",
                  border: "1px solid rgba(59,130,246,0.2)",
                }}
              >
                {plan}
              </span>
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
          style={{ color: "rgba(255,255,255,0.2)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "rgba(59,130,246,0.6)";
            (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.06)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.2)";
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

function NavRow({
  item,
  path,
  collapsed,
  open,
  onToggle,
}: {
  item: NavItem;
  path: string;
  collapsed: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const active = item.match ? item.match(path) : path === item.to;
  const exactActive = path === item.to;
  const hasChildren = !!item.children?.length && !collapsed;
  const isNova = item.workspace === "nova";

  const activeColor = isNova ? "#8b5cf6" : "#3b82f6";
  const activeGrad = isNova
    ? "linear-gradient(135deg, #8b5cf6, #f97316)"
    : "linear-gradient(135deg, #3b82f6, #8b5cf6)";

  return (
    <div>
      <div className="relative flex items-center">
        {/* Active neon rail */}
        {active && (
          <span
            key={item.to + "-rail"}
            className="rail-in absolute left-0 top-1 bottom-1 w-[2px] rounded-r-full"
            style={{
              background: activeGrad,
              boxShadow: `0 0 8px ${activeColor}80`,
            }}
          />
        )}

        <Link
          to={item.to}
          className={cn(
            "group relative flex flex-1 items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition-all duration-150",
            collapsed && "justify-center px-0",
          )}
          style={
            active
              ? {
                  background: `rgba(${isNova ? "139,92,246" : "59,130,246"},0.1)`,
                  color: "var(--foreground)",
                }
              : {
                  color: "rgba(240,244,255,0.4)",
                }
          }
          onMouseEnter={(e) => {
            if (!active) {
              (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.06)";
              (e.currentTarget as HTMLElement).style.color = "rgba(240,244,255,0.75)";
            }
          }}
          onMouseLeave={(e) => {
            if (!active) {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "rgba(240,244,255,0.4)";
            }
          }}
          title={collapsed ? item.label : undefined}
        >
          <span
            style={
              exactActive
                ? {
                    color: activeColor,
                    filter: `drop-shadow(0 0 4px ${activeColor}80)`,
                  }
                : undefined
            }
          >
            <item.icon className="h-[15px] w-[15px] shrink-0 transition-all" />
          </span>
          {!collapsed && (
            <span
              className="truncate text-[12.5px] font-medium"
              style={active ? { color: "var(--foreground)" } : undefined}
            >
              {item.label}
            </span>
          )}
        </Link>

        {hasChildren && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggle();
            }}
            className="mr-1 flex h-5 w-5 items-center justify-center rounded transition-all"
            style={{ color: "rgba(255,255,255,0.2)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "rgba(59,130,246,0.6)";
              (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.2)";
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
            aria-label={open ? "Collapse" : "Expand"}
          >
            <ChevronDown
              className={cn("h-3 w-3 transition-transform duration-200", open && "rotate-180")}
            />
          </button>
        )}
      </div>

      {/* Children */}
      {hasChildren && open && (
        <ul
          className="mt-0.5 ml-3 space-y-0.5 border-l pl-2"
          style={{ borderColor: "rgba(59,130,246,0.12)" }}
        >
          {item.children!.map((c, i) => {
            const cActive = path === c.to;
            const cColor = isNova ? "#8b5cf6" : "#3b82f6";
            return (
              <li
                key={c.to}
                className="slide-in-left"
                style={{ ["--i" as string]: i } as React.CSSProperties}
              >
                <Link
                  to={c.to}
                  className="flex items-center gap-2 rounded-md px-2 py-1 text-[11.5px] transition-all duration-150"
                  style={
                    cActive
                      ? {
                          background: `rgba(${isNova ? "139,92,246" : "59,130,246"},0.1)`,
                          color: cColor,
                        }
                      : { color: "rgba(240,244,255,0.35)" }
                  }
                  onMouseEnter={(e) => {
                    if (!cActive) {
                      (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.06)";
                      (e.currentTarget as HTMLElement).style.color = "rgba(240,244,255,0.7)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!cActive) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "rgba(240,244,255,0.35)";
                    }
                  }}
                >
                  <span
                    style={
                      cActive
                        ? { color: cColor, filter: `drop-shadow(0 0 3px ${cColor}60)` }
                        : undefined
                    }
                  >
                    <c.icon className="h-3 w-3 shrink-0" />
                  </span>
                  <span className="truncate">{c.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
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

      // Fade trail
      ctx.fillStyle = "rgba(6,6,15,0.05)";
      ctx.fillRect(0, 0, W, H);

      ctx.font = "10px 'JetBrains Mono', monospace";

      for (let i = 0; i < drops.length; i++) {
        const y = drops[i] * 14;
        if (y < 0 || y > H) {
          drops[i] += speeds[i];
          continue;
        }

        // Leading char — bright
        ctx.fillStyle = "rgba(59,130,246,0.7)";
        ctx.shadowBlur = 4;
        ctx.shadowColor = "#3b82f6";
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        ctx.fillText(char, i * 14, y);

        // Trail char
        if (drops[i] > 3) {
          ctx.fillStyle = "rgba(99,102,241,0.2)";
          ctx.shadowBlur = 0;
          const trailChar = CHARS[Math.floor(Math.random() * CHARS.length)];
          ctx.fillText(trailChar, i * 14, y - 14);
        }

        drops[i] += speeds[i];

        // Reset
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
