import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { subscriptionQuery } from "@/lib/queries";
import { guestStore, GUEST_USER, GUEST_ORG_ID } from "@/lib/guest";
import type { PlanId } from "@/lib/plan";

export interface Workspace {
  id: string;
  name: string;
  plan: PlanId;
  user: { name: string; email: string; avatarUrl?: string };
  onboarded: boolean;
}

const VALID_PLANS: PlanId[] = ["starter", "launch", "operate", "scale"];
function normalizePlan(raw: string | null | undefined): PlanId {
  return VALID_PLANS.includes(raw as PlanId) ? (raw as PlanId) : "starter";
}

export function useWorkspace(): { workspace: Workspace } {
  const { user, profile, currentOrgId, currentOrg } = useAuth();
  const isGuest = guestStore.get().isGuest;

  const { data: subscription } = useQuery({
    ...subscriptionQuery(currentOrgId ?? GUEST_ORG_ID),
    enabled: isGuest || !!currentOrgId,
  });

  if (isGuest) {
    return {
      workspace: {
        id: GUEST_ORG_ID,
        name: "Demo Workspace",
        plan: normalizePlan(GUEST_USER.plan),
        user: { name: GUEST_USER.full_name, email: GUEST_USER.email },
        onboarded: true,
      },
    };
  }

  return {
    workspace: {
      id: currentOrgId ?? "",
      name: currentOrg?.name ?? "My Workspace",
      plan: normalizePlan(subscription?.plan),
      user: {
        name: profile?.full_name ?? user?.email ?? "User",
        email: profile?.email ?? user?.email ?? "",
      },
      onboarded: profile?.onboarding_complete ?? false,
    },
  };
}
