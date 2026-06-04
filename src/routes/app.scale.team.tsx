import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { organizationQuery } from "@/lib/queries";
import { Users, Crown, Mail, Shield } from "lucide-react";

export const Route = createFileRoute("/app/scale/team")({
  component: ScaleTeam,
});

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
        avatar_url: profile?.avatar_url,
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
            {currentUserEntry.avatar_url ? (
              <img
                src={currentUserEntry.avatar_url}
                alt={currentUserEntry.full_name}
                className="h-9 w-9 rounded-full shrink-0 object-cover"
              />
            ) : (
              <div
                className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center font-bold text-[14px]"
                style={{
                  background: "linear-gradient(135deg, #A78BFA, #FF6B1A)",
                  color: "white",
                }}
              >
                {currentUserEntry.full_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-[13px] font-semibold"
                  style={{ color: "var(--foreground)" }}
                >
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

        {/* Placeholder for future team members */}
        <div
          className="rounded-xl p-6 text-center"
          style={{
            background: "rgba(245,200,140,0.03)",
            border: "1px dashed rgba(245,200,140,0.12)",
          }}
        >
          <Users
            className="h-8 w-8 mx-auto mb-3"
            style={{ color: "#A78BFA", opacity: 0.5 }}
          />
          <div
            className="text-[13px] font-semibold mb-1"
            style={{ color: "var(--foreground)" }}
          >
            Team invitations coming soon
          </div>
          <p
            className="text-[12px] max-w-xs mx-auto"
            style={{ color: "var(--muted-foreground)" }}
          >
            Invite collaborators to your workspace when team features launch.
          </p>
        </div>
      </div>

      {/* Permissions overview */}
      <div className="rounded-xl p-5 nova-card">
        <div
          className="text-[10px] font-bold uppercase tracking-widest mb-4"
          style={{ color: "var(--muted-foreground)" }}
        >
          Workspace Permissions
        </div>
        <div className="space-y-3">
          {[
            { label: "Run AI Tools", access: "All members", icon: Shield, color: "#34D399" },
            { label: "View Reports", access: "All members", icon: Shield, color: "#34D399" },
            { label: "Manage Automations", access: "Owner only", icon: Crown, color: "#F5A623" },
            { label: "Edit Settings", access: "Owner only", icon: Crown, color: "#F5A623" },
            { label: "Manage Billing", access: "Owner only", icon: Crown, color: "#FF6B1A" },
          ].map((perm) => (
            <div key={perm.label} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
              <span className="text-[12.5px]" style={{ color: "var(--foreground)" }}>
                {perm.label}
              </span>
              <div
                className="flex items-center gap-1.5 text-[11px] font-medium"
                style={{ color: perm.color }}
              >
                <perm.icon className="h-3 w-3" />
                {perm.access}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
