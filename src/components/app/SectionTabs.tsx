// SectionTabs — one section, several views. The same pill strip on every page
// of a section (Customers, Path, Insights) so they read as tabs of a single
// destination instead of unrelated pages. Accent follows the domain token.

import { Link, useRouterState } from "@tanstack/react-router";
import {
  Users,
  Workflow,
  Crosshair,
  Map,
  BookOpen,
  BarChart3,
  TrendingUp,
  Activity,
  type LucideIcon,
} from "lucide-react";

interface SectionTab {
  to: string;
  label: string;
  icon: LucideIcon;
}

export interface SectionConfig {
  tabs: readonly SectionTab[];
  /** Domain accent token, e.g. "var(--domain-customers)" */
  accent: string;
}

export const SECTIONS = {
  customers: {
    accent: "var(--domain-customers)",
    tabs: [
      { to: "/app/contacts", label: "People", icon: Users },
      { to: "/app/nova/crm", label: "Pipeline", icon: Workflow },
      { to: "/app/launchpad/first-customers", label: "First Customers", icon: Crosshair },
    ],
  },
  path: {
    accent: "var(--domain-build)",
    tabs: [
      { to: "/app/launchpad-path", label: "Journey", icon: Map },
      { to: "/app/mission-control", label: "Missions", icon: Crosshair },
      { to: "/app/playbook", label: "Playbook", icon: BookOpen },
    ],
  },
  insights: {
    accent: "var(--domain-insights)",
    tabs: [
      { to: "/app/ai-dashboard", label: "AI Dashboard", icon: BarChart3 },
      { to: "/app/nova/reports", label: "Reports", icon: TrendingUp },
      { to: "/app/monitoring", label: "System Health", icon: Activity },
    ],
  },
} as const satisfies Record<string, SectionConfig>;

export function SectionTabs({ section }: { section: keyof typeof SECTIONS }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { tabs, accent } = SECTIONS[section];

  return (
    <div
      className="inline-flex items-center gap-1 rounded-xl p-1"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
    >
      {tabs.map((t) => {
        const active = path === t.to;
        return (
          <Link
            key={t.to}
            to={t.to}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition"
            style={{
              background: active ? "var(--surface)" : "transparent",
              color: active ? "var(--foreground)" : "var(--muted-foreground)",
              boxShadow: active ? "var(--shadow-card)" : "none",
            }}
          >
            <t.icon className="h-3.5 w-3.5" style={active ? { color: accent } : undefined} />
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
