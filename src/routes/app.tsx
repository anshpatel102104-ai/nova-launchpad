import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app/AppSidebar";
import { AppTopbar } from "@/components/app/AppTopbar";
import { MobileTabBar } from "@/components/app/MobileTabBar";
import { GuestGateModal } from "@/components/app/GuestGateModal";
import { supabase } from "@/integrations/supabase/client";
import { guestStore } from "@/lib/guest";

export const Route = createFileRoute("/app")({
  beforeLoad: async ({ location }) => {
    // Guest mode bypasses auth — purely client-side demo.
    if (guestStore.get().isGuest) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/auth/sign-in", search: { redirect: location.href } as never });
    }
    // Redirect to onboarding if not yet complete
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", session.user.id)
      .maybeSingle();
    if (!profile?.onboarding_complete) {
      throw redirect({ to: "/onboarding" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        <main className="flex-1 overflow-x-hidden pb-20 lg:pb-0">
          <div key={path} className="page-in mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileTabBar />
      <GuestGateModal />
    </div>
  );
}
