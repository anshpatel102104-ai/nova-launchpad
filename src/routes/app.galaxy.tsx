import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useAuth } from "@/lib/auth";
import { toolRunsQuery, organizationQuery } from "@/lib/queries";
import { useFounderProgress } from "@/hooks/use-founder-progress";
import { ACADEMY_MODULES, getModuleState, type ModuleState } from "@/lib/academy-modules";
import { FounderLevelBadge } from "@/components/app/gamification/FounderLevelBadge";
import { ArrowRight, Lock, CheckCircle2, Star, Zap, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/galaxy")({
  component: GalaxyMapPage,
});

// Planet orbital layout — radii in % of container, angle in degrees
const PLANET_LAYOUT = [
  { moduleIndex: 0, orbitRadiusX: 16, orbitRadiusY: 8, startAngle: 30 },
  { moduleIndex: 1, orbitRadiusX: 24, orbitRadiusY: 12, startAngle: 110 },
  { moduleIndex: 2, orbitRadiusX: 30, orbitRadiusY: 14, startAngle: 220 },
  { moduleIndex: 3, orbitRadiusX: 36, orbitRadiusY: 17, startAngle: 310 },
  { moduleIndex: 4, orbitRadiusX: 42, orbitRadiusY: 20, startAngle: 60 },
  { moduleIndex: 5, orbitRadiusX: 46, orbitRadiusY: 21, startAngle: 170 },
  { moduleIndex: 6, orbitRadiusX: 40, orbitRadiusY: 19, startAngle: 260 },
  { moduleIndex: 7, orbitRadiusX: 44, orbitRadiusY: 22, startAngle: 350 },
];

const STATE_COLORS: Record<ModuleState, string> = {
  locked: "#6B7280",
  available: "#9CA3AF",
  active: "#FF6B1A",
  complete: "#34D399",
  mastered: "#FBBF24",
};

function stateLabel(s: ModuleState): string {
  return {
    locked: "Locked",
    available: "Available",
    active: "In Progress",
    complete: "Complete",
    mastered: "Mastered",
  }[s];
}

function GalaxyMapPage() {
  const { currentOrgId, user } = useAuth();
  const progress = useFounderProgress();
  const navigate = useNavigate();

  const runsQ = useQuery({ ...toolRunsQuery(currentOrgId ?? "", 500), enabled: !!currentOrgId });
  const orgQ = useQuery({ ...organizationQuery(currentOrgId ?? ""), enabled: !!currentOrgId });

  const containerRef = useRef<HTMLDivElement>(null);
  const sunRef = useRef<HTMLDivElement>(null);
  const planetRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  // Derive completed tool slugs from runs
  const completedSlugs = new Set(
    (runsQ.data ?? [])
      .filter((r: { status: string }) => r.status === "succeeded")
      .map((r: { tool_key?: string }) => r.tool_key ?? ""),
  );
  const orgStage = (orgQ.data as { stage?: string } | null)?.stage ?? "Idea";

  // Module states
  const moduleStates = ACADEMY_MODULES.map((m) => ({
    module: m,
    state: getModuleState(m, completedSlugs, orgStage),
  }));

  // GSAP entrance animations
  useEffect(() => {
    const planets = planetRefs.current.filter(Boolean);
    if (planets.length === 0) return;

    // Sun pulse
    if (sunRef.current) {
      gsap.to(sunRef.current, {
        scale: 1.06,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }

    // Planet entrance stagger
    gsap.from(planets, {
      scale: 0,
      opacity: 0,
      duration: 0.6,
      stagger: 0.08,
      ease: "back.out(1.7)",
      delay: 0.3,
    });
  }, [runsQ.isLoading]);

  const selectedModuleData = selectedModule
    ? moduleStates.find((ms) => ms.module.id === selectedModule)
    : null;

  return (
    <div
      className="relative flex flex-col"
      style={{
        height: "calc(100vh - 56px)",
        background: "var(--background)",
        overflow: "hidden",
      }}
    >
      {/* Starfield background */}
      <StarField />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-5 pb-0">
        <div>
          <div
            className="text-[10px] font-mono font-bold uppercase tracking-widest mb-0.5"
            style={{ color: "rgba(167,139,250,0.65)" }}
          >
            ● Galaxy Map
          </div>
          <h1
            className="font-display text-[20px] font-bold leading-tight"
            style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}
          >
            Your Founder Journey
          </h1>
        </div>
        {!progress.isLoading && (
          <FounderLevelBadge
            level={progress.level}
            levelLabel={progress.levelLabel}
            size="md"
            showProgress
            xpProgressInLevel={progress.xpProgressInLevel}
          />
        )}
      </div>

      {/* Mobile: grid layout */}
      <div className="relative z-10 md:hidden flex-1 overflow-y-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          {moduleStates.map(({ module, state }) => (
            <button
              key={module.id}
              onClick={() => setSelectedModule(module.id === selectedModule ? null : module.id)}
              className="rounded-xl p-3 text-left transition-all nova-card"
              style={
                state !== "locked"
                  ? {
                      borderColor: `color-mix(in oklab, ${STATE_COLORS[state]} 30%, transparent)`,
                    }
                  : {}
              }
            >
              <div className="text-[20px] mb-2">{module.emoji}</div>
              <div
                className="text-[11.5px] font-semibold truncate"
                style={{ color: "var(--foreground)" }}
              >
                {module.title}
              </div>
              <div
                className="text-[9.5px] mt-1 font-bold uppercase tracking-wide"
                style={{ color: STATE_COLORS[state] }}
              >
                {stateLabel(state)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: orbital canvas */}
      <div
        ref={containerRef}
        className="relative hidden md:flex flex-1 items-center justify-center"
        style={{ overflow: "hidden" }}
      >
        {/* Orbit rings (decorative) */}
        {PLANET_LAYOUT.map((layout, i) => (
          <div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: `${layout.orbitRadiusX * 2}%`,
              height: `${layout.orbitRadiusY * 2}%`,
              border: "1px solid rgba(245,200,140,0.04)",
              transform: "translate(-50%, -50%)",
              left: "50%",
              top: "50%",
            }}
          />
        ))}

        {/* Central Star (Business Vision) */}
        <div
          ref={sunRef}
          className="absolute nova-glow z-20"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 80,
            height: 80,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 35% 35%, #FFF7ED 0%, #FF6B1A 40%, #EA580C 80%, #9A3412 100%)",
            boxShadow:
              "0 0 40px rgba(249,115,22,0.55), 0 0 80px rgba(249,115,22,0.22), 0 0 120px rgba(249,115,22,0.08)",
            cursor: "pointer",
            zIndex: 20,
          }}
          onClick={() => navigate({ to: "/app/mission-briefing" })}
          title="Business Vision — Click to update"
        >
          <div
            className="absolute inset-0 flex flex-col items-center justify-center text-center"
            style={{ color: "white" }}
          >
            <span className="text-[8px] font-bold uppercase tracking-widest opacity-80">
              Vision
            </span>
            <span className="text-[20px]">⭐</span>
          </div>
        </div>

        {/* Planets */}
        {moduleStates.map(({ module, state }, i) => {
          const layout = PLANET_LAYOUT[i];
          if (!layout) return null;

          const angleRad = (layout.startAngle * Math.PI) / 180;
          const leftPct = 50 + layout.orbitRadiusX * Math.cos(angleRad);
          const topPct = 50 + layout.orbitRadiusY * Math.sin(angleRad);

          const color = STATE_COLORS[state];
          const isActive = state === "active";
          const isComplete = state === "complete" || state === "mastered";
          const isLocked = state === "locked";

          return (
            <div
              key={module.id}
              ref={(el) => {
                planetRefs.current[i] = el;
              }}
              className={cn(
                "absolute z-10 cursor-pointer transition-transform duration-200",
                isLocked
                  ? "planet-locked"
                  : isActive
                    ? "planet-active"
                    : isComplete
                      ? "planet-completed"
                      : "planet-completed",
                !isLocked && "hover:scale-110",
                isActive && "planet-active-pulse",
              )}
              style={{
                left: `${leftPct}%`,
                top: `${topPct}%`,
                transform: "translate(-50%, -50%)",
                width: selectedModule === module.id ? 64 : 52,
                height: selectedModule === module.id ? 64 : 52,
                borderRadius: "50%",
                background: isLocked
                  ? "radial-gradient(circle at 35% 35%, rgba(107,114,128,0.3) 0%, rgba(55,65,81,0.4) 100%)"
                  : `radial-gradient(circle at 35% 35%, ${color}40 0%, ${color}80 50%, ${color} 100%)`,
                border: `2px solid ${isLocked ? "rgba(107,114,128,0.3)" : color}`,
                boxShadow: isLocked ? "none" : `0 0 16px ${color}50, 0 0 32px ${color}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
              }}
              onClick={() =>
                !isLocked && setSelectedModule(module.id === selectedModule ? null : module.id)
              }
              title={isLocked ? `Locked — reach ${module.requiredStage} stage` : module.title}
            >
              <span className="text-[18px]">{module.emoji}</span>
              {isComplete && (
                <CheckCircle2
                  className="absolute -top-1 -right-1 h-4 w-4"
                  style={{ color: "#34D399", background: "var(--background)", borderRadius: "50%" }}
                />
              )}
              {isLocked && (
                <Lock className="absolute -top-1 -right-1 h-3 w-3" style={{ color: "#6B7280" }} />
              )}

              {/* Label */}
              <div
                className="absolute top-full mt-1.5 text-center pointer-events-none"
                style={{ width: 80, left: "50%", transform: "translateX(-50%)" }}
              >
                <div
                  className="text-[9px] font-semibold leading-tight"
                  style={{ color: isLocked ? "rgba(237,232,223,0.25)" : "rgba(237,232,223,0.75)" }}
                >
                  {module.title}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected module detail panel */}
      {selectedModuleData && (
        <div
          className="absolute right-4 top-20 z-30 w-72 rounded-2xl p-5 slide-in-right"
          style={{
            background: "var(--surface)",
            border: `1px solid color-mix(in oklab, ${STATE_COLORS[selectedModuleData.state]} 30%, var(--border))`,
            boxShadow: "var(--shadow-lifted)",
          }}
        >
          <button
            onClick={() => setSelectedModule(null)}
            className="absolute top-3 right-3 h-6 w-6 flex items-center justify-center rounded-lg"
            style={{ color: "var(--muted-foreground)" }}
          >
            <X className="h-3.5 w-3.5" />
          </button>

          <div className="text-[24px] mb-2">{selectedModuleData.module.emoji}</div>

          <div
            className="text-[9px] font-bold uppercase tracking-widest mb-1"
            style={{ color: STATE_COLORS[selectedModuleData.state] }}
          >
            {stateLabel(selectedModuleData.state)}
          </div>

          <h3
            className="font-display text-[15px] font-bold mb-2"
            style={{ color: "var(--foreground)" }}
          >
            {selectedModuleData.module.title}
          </h3>

          <p className="text-[11.5px] mb-3" style={{ color: "var(--muted-foreground)" }}>
            {selectedModuleData.module.description}
          </p>

          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-3 w-3" style={{ color: "var(--primary)" }} />
            <span className="text-[11px] font-mono font-bold" style={{ color: "var(--primary)" }}>
              {selectedModuleData.module.xpReward} XP
            </span>
            <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
              · {selectedModuleData.module.tools.length} tools
            </span>
          </div>

          {selectedModuleData.state !== "locked" ? (
            <Link
              to="/app/academy/$module"
              params={{ module: selectedModuleData.module.id }}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[12.5px] font-semibold btn-execute"
            >
              {selectedModuleData.state === "complete" ? "Review Module" : "Start Module"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <div
              className="rounded-xl py-2.5 text-center text-[12px]"
              style={{
                background: "rgba(107,114,128,0.10)",
                color: "var(--muted-foreground)",
              }}
            >
              Reach {selectedModuleData.module.requiredStage} stage to unlock
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div
        className="absolute left-4 bottom-4 z-10 hidden md:flex items-center gap-3 rounded-xl px-3 py-2"
        style={{
          background: "rgba(26,18,8,0.75)",
          border: "1px solid var(--border)",
          backdropFilter: "blur(12px)",
        }}
      >
        {(["available", "active", "complete", "locked"] as ModuleState[]).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ background: STATE_COLORS[s] }} />
            <span
              className="text-[9px] font-medium capitalize"
              style={{ color: "rgba(237,232,223,0.45)" }}
            >
              {stateLabel(s)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StarField() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "radial-gradient(ellipse at 50% 50%, rgba(167,139,250,0.04) 0%, transparent 70%), radial-gradient(ellipse at 20% 80%, rgba(249,115,22,0.05) 0%, transparent 60%)",
      }}
    >
      {/* Static star dots generated deterministically */}
      {Array.from({ length: 80 }, (_, i) => {
        const x = ((i * 137.508) % 100).toFixed(2);
        const y = ((i * 97.611 + 13) % 100).toFixed(2);
        const size = i % 5 === 0 ? 1.5 : 1;
        const opacity = 0.1 + (i % 4) * 0.1;
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              background: "white",
              opacity,
            }}
          />
        );
      })}
    </div>
  );
}
