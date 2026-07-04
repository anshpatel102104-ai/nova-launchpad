// ProductSwitcher — the dual-screen toggle between the two products.
//
//   Launchpad (build)  ⇄  Nova (run)
//
// The two products keep separate layouts, navs, and home screens; this
// switch is the one shared element that lets you flip between them from
// anywhere. Switching writes workspaces.mode and lands you on the other
// product's home. Active segment inherits the product accent for free
// (data-product remaps --primary).

import { useNavigate } from "@tanstack/react-router";
import { Rocket, Gauge, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceMode, type WorkspaceMode } from "@/hooks/use-workspace-mode";
import { PRODUCT_HOME, type ProductId } from "@/lib/ecosystem";

const OPTIONS: Array<{
  mode: WorkspaceMode;
  product: ProductId;
  label: string;
  hint: string;
  icon: LucideIcon;
}> = [
  {
    mode: "create",
    product: "launchpad",
    label: "Launchpad",
    hint: "Launchpad — build your business",
    icon: Rocket,
  },
  {
    mode: "operate",
    product: "nova",
    label: "Nova",
    hint: "Nova — run your business",
    icon: Gauge,
  },
];

function useSwitch() {
  const { mode, setMode } = useWorkspaceMode();
  const navigate = useNavigate();
  return {
    mode,
    go: (next: WorkspaceMode, product: ProductId) => {
      if (next === mode) return;
      setMode(next);
      navigate({ to: PRODUCT_HOME[product] });
    },
  };
}

/** Sidebar rail variant — full-width segmented control under the brand header. */
export function ProductSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const { mode, go } = useSwitch();

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1 px-1.5 pt-2">
        {OPTIONS.map((o) => {
          const active = o.mode === mode;
          return (
            <button
              key={o.product}
              onClick={() => go(o.mode, o.product)}
              title={o.hint}
              aria-pressed={active}
              className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
              style={
                active
                  ? {
                      background: "var(--primary-soft)",
                      color: "var(--primary)",
                      border: "1px solid var(--primary-border)",
                    }
                  : { color: "var(--muted-foreground)" }
              }
            >
              <o.icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="px-2 pt-2">
      <div
        className="grid grid-cols-2 gap-0.5 rounded-lg p-0.5"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        {OPTIONS.map((o) => {
          const active = o.mode === mode;
          return (
            <button
              key={o.product}
              onClick={() => go(o.mode, o.product)}
              title={o.hint}
              aria-pressed={active}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-[6px] px-2 py-[7px] text-[12px] transition-all duration-100",
                active ? "font-bold" : "font-medium hover:bg-surface",
              )}
              style={
                active
                  ? {
                      background: "var(--surface)",
                      color: "var(--primary)",
                      boxShadow: "var(--shadow-card)",
                    }
                  : { color: "var(--muted-foreground)" }
              }
            >
              <o.icon className="h-3.5 w-3.5 shrink-0" />
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Compact variant for the mobile topbar — two icon segments. */
export function ProductSwitcherCompact() {
  const { mode, go } = useSwitch();

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg p-0.5"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
    >
      {OPTIONS.map((o) => {
        const active = o.mode === mode;
        return (
          <button
            key={o.product}
            onClick={() => go(o.mode, o.product)}
            title={o.hint}
            aria-pressed={active}
            className="flex h-7 items-center gap-1 rounded-[6px] px-2 text-[11px] font-bold transition-all duration-100"
            style={
              active
                ? {
                    background: "var(--surface)",
                    color: "var(--primary)",
                    boxShadow: "var(--shadow-card)",
                  }
                : { color: "var(--muted-foreground)" }
            }
          >
            <o.icon className="h-3.5 w-3.5" />
            {active && o.label}
          </button>
        );
      })}
    </div>
  );
}
