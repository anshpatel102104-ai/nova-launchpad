// CustomersNav — one customer system, three views. Renders the same pill
// strip on Contacts and Pipeline so they feel like tabs of a single
// "Customers" section instead of two unrelated CRMs.

import { Link, useRouterState } from "@tanstack/react-router";
import { Users, Workflow, Crosshair } from "lucide-react";

const TABS = [
  { to: "/app/contacts", label: "People", icon: Users },
  { to: "/app/nova/crm", label: "Pipeline", icon: Workflow },
  { to: "/app/launchpad/first-customers", label: "First Customers", icon: Crosshair },
] as const;

export function CustomersNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div
      className="inline-flex items-center gap-1 rounded-xl p-1"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
    >
      {TABS.map((t) => {
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
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
