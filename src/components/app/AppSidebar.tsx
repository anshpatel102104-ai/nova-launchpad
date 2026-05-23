import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
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
  LineChart,
  Shield,
  Sparkles,
  TrendingUp,
  Crosshair,
  Tags,
  ClipboardList,
  Users,
  Zap,
  CheckCircle2,
  DollarSign,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useGuest } from "@/lib/guest";
import { subscriptionQuery } from "@/lib/queries";
import { useIsAdmin } from "@/lib/admin";

type BootcampTool = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  toolKey?: string;
};

type BootcampPhase = {
  id: string;
  label: string;
  color: string;
  tools: BootcampTool[];
};

const BOOTCAMP_PHASES: BootcampPhase[] = [
  {
    id: "validate",
    label: "Validate",
    color: "#f97316",
    tools: [
      { to: "/app/launchpad/idea-validator", label: "Idea Validator", icon: Lightbulb, toolKey: "validate-idea" },
      { to: "/app/launchpad/kill-my-idea", label: "Kill My Idea", icon: Skull, toolKey: "kill-my-idea" },
      { to: "/app/launchpad/idea-vs-idea", label: "Idea vs Idea", icon: GitCompare, toolKey: "idea-vs-idea" },
    ],
  },
  {
    id: "position",
    label: "Position",
    color: "#ea580c",
    tools: [
      { to: "/app/launchpad/gtm-strategy", label: "GTM Strategy", icon: Target, toolKey: "generate-gtm-strategy" },
      { to: "/app/launchpad/competitor", label: "Competitor Analysis", icon: Crosshair, toolKey: "competitor-analysis" },
      { to: "/app/launchpad/pricing", label: "Pricing Strategy", icon: Tags, toolKey: "pricing-strategy" },
    ],
  },
  {
    id: "build",
    label: "Build",
    color: "#c2410c",
    tools: [
      { to: "/app/launchpad/offer", label: "Offer Builder", icon: Sparkles, toolKey: "generate-offer" },
      { to: "/app/launchpad/landing-page", label: "Landing Page", icon: Globe, toolKey: "landing-page" },
      { to: "/app/launchpad/website-audit", label: "Website Auditor", icon: TrendingUp, toolKey: "analyze-website" },
    ],
  },
  {
    id: "launch",
    label: "Launch",
    color: "#9a3412",
    tools: [
      { to: "/app/launchpad/first-10-customers", label: "First 10 Customers", icon: UserPlus, toolKey: "first-10-customers" },
      { to: "/app/launchpad/followup", label: "Follow-Up Sequence", icon: Mail, toolKey: "generate-followup-sequence" },
      { to: "/app/launchpad/pitch-generator", label: "Pitch Generator", icon: Megaphone, toolKey: "generate-pitch" },
    ],
  },
  {
    id: "scale",
    label: "Scale",
    color: "#7c2d12",
    tools: [
      { to: "/app/launchpad/business-plan", label: "Business Plan", icon: FileText, toolKey: "business-plan" },
      { to: "/app/launchpad/ops-plan", label: "Ops Plan", icon: ClipboardList, toolKey: "generate-ops-plan" },
      { to: "/app/launchpad/funding-score", label: "Funding Score", icon: Trophy, toolKey: "funding-score" },
      { to: "/app/launchpad/investor-emails", label: "Investor Emails", icon: DollarSign, toolKey: "investor-emails" },
      { to: "/app/launchpad/revenue-projector", label: "Revenue Projector", icon: LineChart, toolKey: "revenue-projector" },
    ],
  },
];

type FooterItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

const STORAGE = "nova-sidebar-collapsed";

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { currentOrg, currentOrgId, profile, user } = useAuth();
  const { isGuest, disable } = useGuest();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [openPhases, setOpenPhases] = useState<Record<string, boolean>>({
    validate: path.startsWith("/app/launchpad/idea-validator") || path.startsWith("/app/launchpad/kill") || path.startsWith("/app/launchpad/idea-vs"),
    position: path.startsWith("/app/launchpad/gtm") || path.startsWith("/app/launchpad/competitor") || path.startsWith("/app/launchpad/pricing"),
    build: path.startsWith("/app/launchpad/offer") || path.startsWith("/app/launchpad/landing") || path.startsWith("/app/launchpad/website-audit"),
    launch: path.startsWith("/app/launchpad/first") || path === "/app/launchpad/followup" || path.startsWith("/app/launchpad/pitch"),
    scale: path.startsWith("/app/launchpad/business") || path.startsWith("/app/launchpad/ops") || path.startsWith("/app/launchpad/funding") || path.startsWith("/app/launchpad/investor") || path.startsWith("/app/launchpad/revenue"),
  });

  const subQ = useQuery({ ...subscriptionQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const plan = subQ.data?.plan ?? "starter";

  const footerItems: FooterItem[] = [
    ...(isAdmin ? [{ to: "/app/admin", label: "Admin", icon: Shield }] : []),
    { to: "/app/settings", label: "Settings", icon: Settings },
    { to: "/app/billing", label: "Billing", icon: CreditCard },
  ];

  const exitDemo = () => {
    disable();
    navigate({ to: "/signup", search: { plan: undefined } });
  };

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE);
      if (v === "1") setCollapsed(true);
    } catch { /* */ }
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      const n = !c;
      try { localStorage.setItem(STORAGE, n ? "1" : "0"); } catch { /* */ }
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

  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);

  return (
    <aside
      className={cn(
        "hidden lg:flex shrink-0 flex-col relative",
        "transition-[width] duration-200 ease-in-out overflow-hidden",
        collapsed ? "w-[60px]" : "w-[236px]",
      )}
      style={{
        background: "#ffffff",
        borderRight: "1px solid #fed7aa",
      }}
    >
      {/* Brand */}
      <div
        className={cn(
          "flex h-14 items-center gap-2.5 px-3",
          collapsed && "justify-center px-0",
        )}
        style={{ borderBottom: "1px solid #fed7aa" }}
      >
        <div
          className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white text-[11px] font-bold tracking-tight"
          style={{
            background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
            boxShadow: "0 2px 8px rgba(249,115,22,0.35)",
          }}
        >
          N
        </div>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <div className="font-display text-[13.5px] font-bold tracking-tight truncate text-gray-900">
              Nova Launchpad
            </div>
            <div className="text-[9.5px] font-semibold truncate text-orange-500 uppercase tracking-widest">
              AI Mentor Bootcamp
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-0.5">
          {/* Dashboard */}
          <SidebarLink
            to="/app/dashboard"
            label="Dashboard"
            icon={LayoutDashboard}
            active={path === "/app/dashboard" || path === "/app/ai-dashboard"}
            collapsed={collapsed}
          />
          <SidebarLink
            to="/app/leads"
            label="Leads & CRM"
            icon={Users}
            active={path.startsWith("/app/leads") || path.startsWith("/app/nova")}
            collapsed={collapsed}
          />

          {/* Bootcamp phases */}
          {!collapsed && (
            <div className="mt-4 mb-1.5 px-2">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-orange-100" />
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-orange-400">
                  Bootcamp
                </span>
                <div className="h-px flex-1 bg-orange-100" />
              </div>
            </div>
          )}
          {collapsed && <div className="my-3 mx-2 h-px bg-orange-100" />}

          {BOOTCAMP_PHASES.map((phase, phaseIdx) => (
            <PhaseGroup
              key={phase.id}
              phase={phase}
              phaseNumber={phaseIdx + 1}
              path={path}
              collapsed={collapsed}
              open={!!openPhases[phase.id]}
              onToggle={() => setOpenPhases((g) => ({ ...g, [phase.id]: !g[phase.id] }))}
            />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-2" style={{ borderTop: "1px solid #fed7aa" }}>
        {isGuest && (
          <button
            onClick={exitDemo}
            className={cn(
              "mb-2 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12px] font-medium transition-all",
              collapsed && "justify-center px-0",
            )}
            style={{
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              color: "#f97316",
            }}
            title={collapsed ? "Exit demo" : undefined}
          >
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && <span className="truncate">Exit demo</span>}
          </button>
        )}

        <div className="space-y-0.5">
          {footerItems.map((item) => (
            <SidebarLink
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              active={path === item.to}
              collapsed={collapsed}
            />
          ))}
        </div>

        {/* User card */}
        <Link
          to="/app/settings"
          className={cn(
            "mt-2 flex items-center gap-2.5 rounded-xl p-2 transition-all duration-200 hover:bg-orange-50",
            collapsed && "justify-center p-1.5",
          )}
          style={{ border: "1px solid #fed7aa" }}
        >
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}
          >
            {initials}
          </span>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-semibold leading-tight text-gray-900">
                  {profile?.full_name || "Account"}
                </div>
                <div className="truncate text-[10px] leading-tight text-gray-500">
                  {currentOrg?.name ?? planLabel + " plan"}
                </div>
              </div>
              <span
                className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                style={{
                  background: "#fff7ed",
                  color: "#f97316",
                  border: "1px solid #fed7aa",
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
            "mt-1.5 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-gray-400 transition-all duration-200 hover:bg-orange-50 hover:text-orange-500",
            collapsed && "justify-center",
          )}
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

function SidebarLink({
  to,
  label,
  icon: Icon,
  active,
  collapsed,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-all duration-150",
        collapsed && "justify-center px-0 py-2",
        active
          ? "bg-orange-50 text-orange-600"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
      )}
      title={collapsed ? label : undefined}
    >
      <Icon
        className={cn("h-[15px] w-[15px] shrink-0", active && "text-orange-500")}
      />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

function PhaseGroup({
  phase,
  phaseNumber,
  path,
  collapsed,
  open,
  onToggle,
}: {
  phase: BootcampPhase;
  phaseNumber: number;
  path: string;
  collapsed: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const phaseActive = phase.tools.some((t) => path === t.to);

  if (collapsed) {
    return (
      <div>
        {phase.tools.map((tool) => {
          const active = path === tool.to;
          return (
            <Link
              key={tool.to}
              to={tool.to}
              title={`[${phase.label}] ${tool.label}`}
              className={cn(
                "flex justify-center items-center py-1.5 rounded-lg transition-all duration-150",
                active ? "bg-orange-50" : "hover:bg-gray-50",
              )}
            >
              <tool.icon
                className={cn(
                  "h-[15px] w-[15px] shrink-0",
                  active ? "text-orange-500" : "text-gray-400",
                )}
              />
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      {/* Phase header */}
      <button
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-all duration-150",
          phaseActive
            ? "text-orange-600"
            : "text-gray-500 hover:text-gray-800 hover:bg-gray-50",
        )}
      >
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[9px] font-bold text-white"
          style={{ background: phase.color }}
        >
          {phaseNumber}
        </span>
        <span className="flex-1 text-left uppercase tracking-wide text-[10px]">
          Phase {phaseNumber}: {phase.label}
        </span>
        {phaseActive && (
          <CheckCircle2 className="h-3 w-3 text-orange-500 shrink-0" />
        )}
        <ChevronDown
          className={cn(
            "h-3 w-3 shrink-0 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Phase tools */}
      {open && (
        <ul className="ml-3 mt-0.5 space-y-0.5 border-l-2 pl-2" style={{ borderColor: "#fed7aa" }}>
          {phase.tools.map((tool, i) => {
            const active = path === tool.to;
            return (
              <li key={tool.to} className="slide-in-left" style={{ ["--i" as string]: i } as React.CSSProperties}>
                <Link
                  to={tool.to}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1 text-[12px] transition-all duration-150",
                    active
                      ? "bg-orange-50 text-orange-600 font-medium"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-800",
                  )}
                >
                  <tool.icon className={cn("h-3.5 w-3.5 shrink-0", active && "text-orange-500")} />
                  <span className="truncate">{tool.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
