import { useState } from "react";
import type { PlanId } from "@/lib/plan";

// TODO: replace with real Supabase user/workspace/subscription query.
export interface Workspace {
  id: string;
  name: string;
  plan: PlanId;
  user: { name: string; email: string; avatarUrl?: string };
  onboarded: boolean;
}

const MOCK: Workspace = {
  id: "ws_demo",
  name: "Acme Studio",
  plan: "launch",
  user: { name: "Alex Founder", email: "alex@acme.co" },
  onboarded: false,
};

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace>(MOCK);
  return { workspace, setWorkspace };
}
