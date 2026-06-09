import React, { useState } from "react";
import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app/AppSidebar";
import { AppTopbar } from "@/components/app/AppTopbar";
import { MobileTabBar } from "@/components/app/MobileTabBar";
import { IntelligenceRail } from "@/components/app/IntelligenceRail";
import { GuestGateModal } from "@/components/app/GuestGateModal";
import { NovaBar } from "@/components/nova/NovaBar";
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
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <AppSidebar onOpenRail={() => setRailOpen(true)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppTopbar onToggleRail={toggleRail} railOpen={railOpen && !hideRail} />
        <NovaBar />

        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto pb-20 lg:pb-0">
            {isGalaxy ? (
              <div key={path} className="page-in h-full w-full">
                <Outlet />
              </div>
            ) : (
              <div
                key={path}
                className="page-in w-full px-5 py-5 md:px-7 md:py-6"
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
