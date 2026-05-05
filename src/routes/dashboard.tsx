import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { guestStore } from "@/lib/guest";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async ({ location }) => {
    if (guestStore.get().isGuest) throw redirect({ to: "/app/dashboard" });
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login", search: { redirect: location.href } as never });

    const { data: prof } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", session.user.id)
      .maybeSingle();
    if (!prof?.onboarding_complete) throw redirect({ to: "/onboarding" });

    throw redirect({ to: "/app/dashboard" });
  },
});
