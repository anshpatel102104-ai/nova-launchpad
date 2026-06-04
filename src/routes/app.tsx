import React, { useState } from "react";
import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app/AppSidebar";
import { AppTopbar } from "@/components/app/AppTopbar";
import { MobileTabBar } from "@/components/app/MobileTabBar";
import { IntelligenceRail } from "@/components/app/IntelligenceRail";
import { GuestGateModal } from "@/components/app/GuestGateModal";
import { supabase } from "@/integrations/supabase/client";
import { guestStore } from "@/lib/guest";
import { saveLastAppPath } from "@/lib/session-restore";

const onboardedUsers = new Set<string>();

export const Route = createFileRoute("/app")({
  beforeLoad: async ({ location }) => {
    if (guestStore.get().isGuest) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/auth/sign-in", search: { redirect: location.href } as never });
    }
    if (onboardedUsers.has(session.user.id)) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", session.user.id)
      .maybeSingle();
    if (!profile?.onboarding_complete) {
      throw redirect({ to: "/onboarding" });
    }
    onboardedUsers.add(session.user.id);
  },
  component: AppLayout,
});

// Pages that opt out of the intelligence rail (need full canvas)
const FULL_CANVAS_PATHS = ["/app/galaxy", "/app/mission-briefing"];

function AppLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  const [railOpen, setRailOpen] = useState(() => {
    try {
      return localStorage.getItem("nova-rail-open") !== "0";
    } catch {
      return false;
    }
  });

  React.useEffect(() => {
    saveLastAppPath(path);
  }, [path]);

  const toggleRail = () => {
    setRailOpen((o) => {
      const next = !o;
      try {
        localStorage.setItem("nova-rail-open", next ? "1" : "0");
      } catch {
        /* */
      }
      return next;
    });
  };

  const hideRail = FULL_CANVAS_PATHS.some((p) => path.startsWith(p));
  const isGalaxy = path === "/app/galaxy";

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar onOpenRail={() => setRailOpen(true)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar onToggleRail={toggleRail} railOpen={railOpen && !hideRail} />

        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto pb-20 lg:pb-0">
            {isGalaxy ? (
              // Galaxy map gets full canvas — no padding/max-width wrapper
              <div key={path} className="page-in h-full w-full">
                <Outlet />
              </div>
            ) : (
              <div
                key={path}
                className="page-in mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8"
              >
                <Outlet />
              </div>
            )}
          </main>

          {!hideRail && <IntelligenceRail open={railOpen} onClose={() => setRailOpen(false)} />}
        </div>
      </div>

      <MobileTabBar />
      <GuestGateModal />
    </div>
  );
}
