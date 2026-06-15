// ViewSwitcher — flips the whole shell between the two views:
//   Launchpad (create & launch, orange)  ↔  NOVA (operate & scale, cyan).
// Backed by useWorkspaceMode (writes workspaces.mode). Expanded shows a
// two-segment pill; collapsed shows one icon button that toggles.

import { Rocket, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceMode } from "@/hooks/use-workspace-mode";

const LAUNCHPAD_ACCENT = "#f97316"; // orange — create & launch
const NOVA_ACCENT = "#06b6d4"; // cyan — operate & scale

export function ViewSwitcher({ collapsed }: { collapsed?: boolean }) {
  const { isOperate, setMode, toggle, isPending } = useWorkspaceMode();
  const accent = isOperate ? NOVA_ACCENT : LAUNCHPAD_ACCENT;

  if (collapsed) {
    const Icon = isOperate ? Gauge : Rocket;
    return (
      <button
        onClick={toggle}
        disabled={isPending}
        title={isOperate ? "NOVA — switch to Launchpad" : "Launchpad — switch to NOVA"}
        aria-label="Switch view"
        className="mx-auto flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-surface-2"
        style={{ color: accent, border: `1px solid ${accent}33` }}
      >
        <Icon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg p-0.5"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
    >
      <Segment
        label="Launchpad"
        Icon={Rocket}
        accent={LAUNCHPAD_ACCENT}
        active={!isOperate}
        disabled={isPending}
        onClick={() => setMode("create")}
      />
      <Segment
        label="NOVA"
        Icon={Gauge}
        accent={NOVA_ACCENT}
        active={isOperate}
        disabled={isPending}
        onClick={() => setMode("operate")}
      />
    </div>
  );
}

function Segment({
  label,
  Icon,
  accent,
  active,
  disabled,
  onClick,
}: {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || active}
      title={active ? `${label} — current view` : `Switch to ${label}`}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-[6px] px-2 py-1.5 text-[12px] font-bold transition-all",
        !active && "hover:bg-surface-3",
      )}
      style={
        active
          ? { background: `${accent}1f`, color: accent, boxShadow: `inset 0 0 0 1px ${accent}55` }
          : { color: "var(--muted-foreground)" }
      }
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label}
    </button>
  );
}
