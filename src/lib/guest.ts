// Client-side guest/demo mode. No Supabase calls. No persistence beyond sessionStorage.
import { useSyncExternalStore } from "react";

export const GUEST_USER = {
  id: "guest-commander",
  full_name: "Commander Demo",
  email: "demo@nova-ops.space",
  plan: "launch" as const,
  stage: "Validate" as const,
};

export const GUEST_ORG_ID = "guest-org";

const STORAGE_KEY = "nova-guest-mode";

type GuestState = {
  isGuest: boolean;
  gateOpen: boolean;
  gateReason: string | null;
};

let state: GuestState = {
  isGuest: (() => {
    if (typeof window === "undefined") return false;
    try { return sessionStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
  })(),
  gateOpen: false,
  gateReason: null,
};

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function setState(patch: Partial<GuestState>) {
  state = { ...state, ...patch };
  emit();
}

export const guestStore = {
  get: () => state,
  subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; },
  enable: () => {
    try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
    setState({ isGuest: true });
  },
  disable: () => {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setState({ isGuest: false, gateOpen: false });
  },
  openGate: (reason?: string) => setState({ gateOpen: true, gateReason: reason ?? null }),
  closeGate: () => setState({ gateOpen: false }),
};

export function useGuest() {
  const snap = useSyncExternalStore(guestStore.subscribe, guestStore.get, guestStore.get);
  return {
    ...snap,
    enable: guestStore.enable,
    disable: guestStore.disable,
    openGate: guestStore.openGate,
    closeGate: guestStore.closeGate,
  };
}

/** Helper for action handlers: returns true if blocked (caller should bail). */
export function blockIfGuest(reason?: string): boolean {
  if (state.isGuest) {
    guestStore.openGate(reason);
    return true;
  }
  return false;
}

// ─────────── Mock data ───────────
const now = Date.now();
const day = 86400000;
const period = new Date().toISOString().slice(0, 7);

export const GUEST_LEADS = [
  { id: "g-l1", organization_id: GUEST_ORG_ID, user_id: GUEST_USER.id, name: "Sarah Chen",   email: "sarah@northwind.io",   phone: "+1 415 555 0114", source: "LinkedIn",  stage: "Qualified", value: 4800, notes: null, created_at: new Date(now - 1*day).toISOString(),  updated_at: new Date(now - 1*day).toISOString() },
  { id: "g-l2", organization_id: GUEST_ORG_ID, user_id: GUEST_USER.id, name: "Marcus Webb",  email: "m.webb@vortexlabs.co", phone: "+44 20 7946 0091", source: "Referral",  stage: "Proposal",  value: 12000, notes: null, created_at: new Date(now - 3*day).toISOString(),  updated_at: new Date(now - 3*day).toISOString() },
  { id: "g-l3", organization_id: GUEST_ORG_ID, user_id: GUEST_USER.id, name: "Aisha Patel",  email: "aisha@brightpath.dev", phone: "+1 646 555 0177", source: "Website",   stage: "Contacted", value: 2200, notes: null, created_at: new Date(now - 5*day).toISOString(),  updated_at: new Date(now - 5*day).toISOString() },
  { id: "g-l4", organization_id: GUEST_ORG_ID, user_id: GUEST_USER.id, name: "Diego Romero", email: "diego@helio.studio",   phone: "+34 91 555 7820",  source: "Cold email",stage: "New",       value: 0,    notes: null, created_at: new Date(now - 6*day).toISOString(),  updated_at: new Date(now - 6*day).toISOString() },
  { id: "g-l5", organization_id: GUEST_ORG_ID, user_id: GUEST_USER.id, name: "Yuki Tanaka",  email: "yuki@orbitcraft.jp",   phone: "+81 3 5555 0190",  source: "Twitter",   stage: "Won",       value: 9500, notes: null, created_at: new Date(now - 9*day).toISOString(),  updated_at: new Date(now - 9*day).toISOString() },
];

export const GUEST_ASSETS = [
  { id: "g-a1", organization_id: GUEST_ORG_ID, user_id: GUEST_USER.id, category: "generate-pitch",             kind: "pitch-generator", title: "Northwind Labs — Series A Pitch",       content: { sections: [] }, metadata: {}, storage_path: null, tool_run_id: null, created_at: new Date(now - 2*day).toISOString() },
  { id: "g-a2", organization_id: GUEST_ORG_ID, user_id: GUEST_USER.id, category: "generate-offer",             kind: "offer",           title: "Founder Coaching — $2k/mo Offer",       content: { hook: "" },     metadata: {}, storage_path: null, tool_run_id: null, created_at: new Date(now - 4*day).toISOString() },
  { id: "g-a3", organization_id: GUEST_ORG_ID, user_id: GUEST_USER.id, category: "generate-followup-sequence", kind: "followup",        title: "5-Touch Reactivation Sequence",         content: { emails: [] },   metadata: {}, storage_path: null, tool_run_id: null, created_at: new Date(now - 7*day).toISOString() },
];

export const GUEST_TOOL_RUNS = [
  { id: "g-r1", organization_id: GUEST_ORG_ID, user_id: GUEST_USER.id, tool_key: "validate-idea",              status: "succeeded" as const, input: {}, output: {}, error: null, metadata: {}, created_at: new Date(now - 30*60*1000).toISOString(), updated_at: new Date(now - 30*60*1000).toISOString() },
  { id: "g-r2", organization_id: GUEST_ORG_ID, user_id: GUEST_USER.id, tool_key: "generate-pitch",             status: "succeeded" as const, input: {}, output: {}, error: null, metadata: {}, created_at: new Date(now - 2*day).toISOString(),    updated_at: new Date(now - 2*day).toISOString() },
  { id: "g-r3", organization_id: GUEST_ORG_ID, user_id: GUEST_USER.id, tool_key: "generate-offer",             status: "succeeded" as const, input: {}, output: {}, error: null, metadata: {}, created_at: new Date(now - 4*day).toISOString(),    updated_at: new Date(now - 4*day).toISOString() },
  { id: "g-r4", organization_id: GUEST_ORG_ID, user_id: GUEST_USER.id, tool_key: "generate-followup-sequence", status: "succeeded" as const, input: {}, output: {}, error: null, metadata: {}, created_at: new Date(now - 7*day).toISOString(),    updated_at: new Date(now - 7*day).toISOString() },
];

export const GUEST_ORG = {
  id: GUEST_ORG_ID,
  name: "Demo Operations Co.",
  business_type: "SaaS",
  niche: "AI productivity",
  stage: "Validate" as const,
  goal: "Hit $10k MRR",
  location: "San Francisco, CA",
  offer: "AI-powered ops automation",
  owner_id: GUEST_USER.id,
  target_customer: "Solo founders & small teams",
  website_url: "https://nova-ops.space",
  created_at: new Date(now - 30*day).toISOString(),
  updated_at: new Date().toISOString(),
};

export const GUEST_SUBSCRIPTION = {
  id: "guest-sub",
  organization_id: GUEST_ORG_ID,
  plan: GUEST_USER.plan,
  status: "active",
  current_period_end: new Date(now + 25*day).toISOString(),
  stripe_customer_id: null,
  stripe_subscription_id: null,
  created_at: new Date(now - 30*day).toISOString(),
  updated_at: new Date().toISOString(),
};

export const GUEST_USAGE = [
  { id: "gu1", organization_id: GUEST_ORG_ID, tool_key: "validate-idea",  count: 4, period, last_used_at: new Date().toISOString() },
  { id: "gu2", organization_id: GUEST_ORG_ID, tool_key: "generate-pitch", count: 3, period, last_used_at: new Date().toISOString() },
];

export const GUEST_INTEGRATIONS: { id: string; user_id: string; integration_key: string; value: string | null; status: string; created_at: string; updated_at: string }[] = [];
