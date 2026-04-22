import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Rocket, Cpu, Users, Inbox, Workflow, UserCheck,
  BarChart3, CreditCard, Settings, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

const launchpadItems = [
  { to: "/app/launchpad", label: "Overview" },
  { to: "/app/launchpad/idea-validator", label: "Idea Validator" },
  { to: "/app/launchpad/pitch-generator", label: "Pitch Generator" },
  { to: "/app/launchpad/gtm-strategy", label: "GTM Strategy" },
  { to: "/app/launchpad/offer", label: "Offer Builder" },
  { to: "/app/launchpad/ops-plan", label: "Ops Plan" },
  { to: "/app/launchpad/followup", label: "Follow-up Sequence" },
  { to: "/app/launchpad/website-audit", label: "Website Audit" },
  { to: "/app/launchpad/history", label: "History" },
];

const novaItems = [
  { to: "/app/nova", label: "Overview" },
  { to: "/app/nova/crm", label: "CRM Pipeline" },
  { to: "/app/nova/leads", label: "Leads" },
  { to: "/app/nova/workflows", label: "Workflows" },
  { to: "/app/nova/clients", label: "Clients" },
  { to: "/app/nova/reports", label: "Reports" },
];

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { currentOrg } = useAuth();
  const isActive = (to: string) => path === to;

  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 px-4 border-b border-sidebar-border">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="font-display text-sm font-semibold tracking-tight">Launchpad Nova</div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 text-sm">
        <SidebarLink to="/app/dashboard" icon={LayoutDashboard} active={isActive("/app/dashboard")}>Dashboard</SidebarLink>
        <SidebarSection icon={Rocket} label="Launchpad" color="text-launchpad" items={launchpadItems} activePath={path} />
        <SidebarSection icon={Cpu} label="Nova OS" color="text-nova" items={novaItems} activePath={path} />
        <div className="my-3 h-px bg-sidebar-border" />
        <SidebarLink to="/app/nova/crm" icon={Users} active={isActive("/app/nova/crm")}>CRM</SidebarLink>
        <SidebarLink to="/app/nova/leads" icon={Inbox} active={isActive("/app/nova/leads")}>Leads</SidebarLink>
        <SidebarLink to="/app/nova/workflows" icon={Workflow} active={isActive("/app/nova/workflows")}>Workflows</SidebarLink>
        <SidebarLink to="/app/nova/clients" icon={UserCheck} active={isActive("/app/nova/clients")}>Clients</SidebarLink>
        <SidebarLink to="/app/nova/reports" icon={BarChart3} active={isActive("/app/nova/reports")}>Reports</SidebarLink>
        <div className="my-3 h-px bg-sidebar-border" />
        <SidebarLink to="/app/billing" icon={CreditCard} active={isActive("/app/billing")}>Billing</SidebarLink>
        <SidebarLink to="/app/settings" icon={Settings} active={isActive("/app/settings")}>Settings</SidebarLink>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="rounded-md border border-sidebar-border bg-sidebar-accent/40 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Workspace</div>
          <div className="mt-0.5 text-sm font-medium truncate">{currentOrg?.name ?? "—"}</div>
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({ to, icon: Icon, active, children }: { to: string; icon: React.ComponentType<{ className?: string }>; active: boolean; children: React.ReactNode }) {
  return (
    <Link to={to} className={cn("flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors", active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground")}>
      <Icon className="h-4 w-4" />{children}
    </Link>
  );
}

function SidebarSection({ icon: Icon, label, color, items, activePath }: { icon: React.ComponentType<{ className?: string }>; label: string; color: string; items: { to: string; label: string }[]; activePath: string }) {
  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className={cn("h-3.5 w-3.5", color)} />{label}
      </div>
      <div className="mt-0.5 space-y-0.5">
        {items.map((item) => (
          <Link key={item.to} to={item.to} className={cn("block rounded-md px-2.5 py-1.5 text-[13px] transition-colors", activePath === item.to ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground")}>
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
