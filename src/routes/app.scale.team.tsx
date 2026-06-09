import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { organizationQuery } from "@/lib/queries";
import { Users, Crown, Mail, Shield, CheckCircle2, Lock } from "lucide-react";

export const Route = createFileRoute("/app/scale/team")({
  component: ScaleTeam,
});

const CAPABILITIES = [
  { key: "run_tools", label: "Run AI Tools", description: "Generate content, analyze, plan", access: "all" },
  { key: "view_reports", label: "View Reports", description: "Access analytics and ROI data", access: "all" },
  { key: "view_pipeline", label: "View Pipeline", description: "See leads and contacts", access: "all" },
  { key: "edit_automations", label: "Edit Automations", description: "Toggle and configure systems", access: "admin" },
  { key: "approve_spend", label: "Approve Spend", description: "Approve budget-spend requests", access: "admin" },
  { key: "invite_members", label: "Invite Members", description: "Add team members", access: "owner" },
  { key: "edit_settings", label: "Edit Settings", description: "Manage workspace settings", access: "owner" },
  { key: "manage_billing", label: "Manage Billing", description: "Subscription and payment", access: "owner" },
] as const;

type AccessLevel = "all" | "admin" | "owner";

const ACCESS_STYLES: Record<AccessLevel, { label: string; color: string; icon: typeof Crown }> = {
  all: { label: "All members", color: "#34D399", icon: Shield },
  admin: { label: "Admin +", color: "#A78BFA", icon: Shield },
  owner: { label: "Owner only", color: "#F5A623", icon: Crown },
};

function ScaleTeam() {
  const { currentOrgId, user, profile } = useAuth();
  const orgQ = useQuery({ ...organizationQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const org = orgQ.data as { name?: string; stage?: string } | null;

  const currentUserEntry = user
    ? {
        id: user.id,
        email: user.email ?? "",
        full_name: profile?.full_name ?? user.email ?? "You",
        role: "owner" as const,
      }
    : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div
            className="text-[10px] font-mono font-bold uppercase tracking-widest mb-0.5"
            style={{ color: "rgba(167,139,250,0.65)" }}
          >
            ● Scale Mode · Team
          </div>
          <h1
            className="font-display text-[20px] font-bold"
            style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}
          >
            Team & Permissions
          </h1>
        </div>
        <div
          className="text-[11px] px-3 py-1.5 rounded-xl font-mono"
          style={{
            background: "color-mix(in oklab, #A78BFA 10%, transparent)",
            border: "1px solid color-mix(in oklab, #A78BFA 25%, transparent)",
            color: "#A78BFA",
          }}
        >
          {org?.name ?? "Your Team"}
        </div>
      </div>

      {/* Team list */}
      <div className="rounded-xl p-5 nova-card">
        <div
          className="text-[10px] font-bold uppercase tracking-widest mb-4"
          style={{ color: "var(--muted-foreground)" }}
        >
          Members
        </div>

        {currentUserEntry && (
          <div
            className="flex items-center gap-3 rounded-xl p-3.5 mb-3"
            style={{
              background: "color-mix(in oklab, #A78BFA 8%, transparent)",
              border: "1px solid color-mix(in oklab, #A78BFA 20%, transparent)",
            }}
          >
            <div
              className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center font-bold text-[14px]"
              style={{
                background: "linear-gradient(135deg, #A78BFA, #FF6B1A)",
                color: "white",
              }}
            >
              {currentUserEntry.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>
                  {currentUserEntry.full_name}
                </span>
                <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                  (you)
                </span>
              </div>
              <div
                className="text-[11px] flex items-center gap-1 mt-0.5"
                style={{ color: "var(--muted-foreground)" }}
              >
                <Mail className="h-3 w-3 shrink-0" />
                {currentUserEntry.email}
              </div>
            </div>
            <div
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
              style={{
                background: "color-mix(in oklab, #F5A623 12%, transparent)",
                color: "#F5A623",
                border: "1px solid color-mix(in oklab, #F5A623 25%, transparent)",
              }}
            >
              <Crown className="h-3 w-3" />
              Owner
            </div>
          </div>
        )}

        {/* Invitation placeholder */}
        <div
          className="rounded-xl p-6 text-center"
          style={{
            background: "rgba(245,200,140,0.03)",
            border: "1px dashed rgba(245,200,140,0.12)",
          }}
        >
          <Users className="h-8 w-8 mx-auto mb-3" style={{ color: "#A78BFA", opacity: 0.5 }} />
          <div className="text-[13px] font-semibold mb-1" style={{ color: "var(--foreground)" }}>
            Team invitations coming soon
          </div>
          <p className="text-[12px] max-w-xs mx-auto" style={{ color: "var(--muted-foreground)" }}>
            Invite collaborators to your workspace. The permissions system below is already wired — roles and granular capability flags will apply automatically when you add members.
          </p>
        </div>
      </div>

      {/* Permission capabilities matrix */}
      <div className="rounded-xl p-5 nova-card">
        <div className="flex items-center justify-between mb-4">
          <div
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "var(--muted-foreground)" }}
          >
            Capability Matrix
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            {(["all", "admin", "owner"] as AccessLevel[]).map((lvl) => {
              const s = ACCESS_STYLES[lvl];
              return (
                <div key={lvl} className="flex items-center gap-1" style={{ color: s.color }}>
                  <s.icon className="h-2.5 w-2.5" />
                  <span>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="space-y-2">
          {CAPABILITIES.map((cap) => {
            const s = ACCESS_STYLES[cap.access];
            const isOwnerCapability = cap.access === "owner";
            const isAdminCapability = cap.access === "admin";
            return (
              <div
                key={cap.key}
                className="flex items-center gap-3 py-2.5 border-b last:border-0"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-medium">{cap.label}</div>
                  <div className="text-[10.5px]" style={{ color: "var(--muted-foreground)" }}>
                    {cap.description}
                  </div>
                </div>
                {/* Access indicator for each role column */}
                <div className="flex items-center gap-4 shrink-0">
                  {/* All members */}
                  <span title="Member" style={{ color: "#34D399" }}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  {/* Admin */}
                  <span title="Admin" style={{ color: isOwnerCapability ? "var(--muted-foreground)" : "#A78BFA", opacity: isOwnerCapability ? 0.3 : 1 }}>
                    {isOwnerCapability ? <Lock className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  </span>
                  {/* Owner */}
                  <span title="Owner" style={{ color: s.color }}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-[10.5px]" style={{ color: "var(--muted-foreground)" }}>
          Granular overrides are stored per member in the <code className="font-mono">permissions</code> field — admin and owner roles have all capabilities by default, with per-member flags available as a team grows.
        </p>
      </div>
    </div>
  );
}
