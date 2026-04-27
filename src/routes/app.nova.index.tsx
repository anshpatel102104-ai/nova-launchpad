import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { StatusBadge } from "@/components/app/MissionHeader";
import { WorkspaceHeader } from "@/components/app/WorkspaceHeader";
import { novaSystemsCatalog, type NovaModule } from "@/lib/mock";
import { useAuth } from "@/lib/auth";
import { subscriptionQuery, integrationsQuery, saveIntegration } from "@/lib/queries";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Lock, Settings2, Inbox, Mail, UserCheck, Receipt, Star, BarChart3, Zap, ArrowRight } from "lucide-react";
import { blockIfGuest } from "@/lib/guest";
import { useOwnerMode } from "@/lib/ownerMode";

export const Route = createFileRoute("/app/nova/")({ component: NovaOverview });

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "lead-capture": Inbox,
  "followup": Mail,
  "onboarding": UserCheck,
  "invoice": Receipt,
  "reputation": Star,
  "reporting": BarChart3,
};

const MODULE_COLORS: Record<string, string> = {
  "lead-capture": "linear-gradient(135deg, var(--accent), #c084fc)",
  "followup": "linear-gradient(135deg, var(--primary), var(--accent))",
  "onboarding": "linear-gradient(135deg, #10b981, var(--primary))",
  "invoice": "linear-gradient(135deg, #f59e0b, var(--orange))",
  "reputation": "linear-gradient(135deg, var(--orange), #ef4444)",
  "reporting": "linear-gradient(135deg, var(--primary), #38bdf8)",
};

const KEY_PREFIX = "nova:webhook:";

function NovaOverview() {
  const { currentOrgId, user } = useAuth();
  const subQ = useQuery({ ...subscriptionQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const intQ = useQuery({ ...integrationsQuery(user?.id ?? ""), enabled: !!user });
  const qc = useQueryClient();

  const plan = subQ.data?.plan ?? "starter";
  const isOwner = useOwnerMode();
  const unlocked = isOwner || plan === "operate" || plan === "scale";
  const [active, setActive] = useState<NovaModule | null>(null);

  const integrations = intQ.data ?? [];
  const moduleStatus = (key: string) => integrations.find((i) => i.integration_key === KEY_PREFIX + key);

  const onlineCount = novaSystemsCatalog.filter((m) => {
    const s = moduleStatus(m.key);
    return s?.status === "connected" && !!s?.is_connected;
  }).length;

  return (
    <div className="space-y-7">
      <WorkspaceHeader
        variant="nova"
        icon={Zap}
        eyebrow="Nova OS · operations control"
        title="Automation modules"
        description="Toggle modules on to put repetitive work on autopilot. Each one connects to your existing tools."
        actions={
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11.5px] font-medium"
              style={{
                background: onlineCount > 0
                  ? "color-mix(in oklab, var(--success) 12%, transparent)"
                  : "var(--surface-2)",
                border: `1px solid ${onlineCount > 0
                  ? "color-mix(in oklab, var(--success) 30%, transparent)"
                  : "var(--border)"}`,
                color: onlineCount > 0 ? "var(--success)" : "var(--muted-foreground)",
              }}
            >
              {onlineCount > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
                </span>
              )}
              {onlineCount > 0 ? `${onlineCount} module${onlineCount === 1 ? "" : "s"} online` : "No modules active"}
            </div>
            <span
              className="rounded-xl px-2.5 py-1.5 text-[11px]"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--muted-foreground)",
              }}
            >
              Plan: <span className="font-medium capitalize" style={{ color: "var(--foreground)" }}>{plan}</span>
            </span>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {novaSystemsCatalog.map((mod, idx) => {
          const Icon = ICONS[mod.key] ?? Settings2;
          const status = moduleStatus(mod.key);
          const online = status?.status === "connected" && !!status?.is_connected;
          const grad = MODULE_COLORS[mod.key] ?? "linear-gradient(135deg, var(--accent), var(--primary))";

          return (
            <div key={mod.key} className="relative" style={{ animationDelay: `${idx * 40}ms` }}>
              <div
                className="group relative h-full overflow-hidden rounded-2xl transition-all duration-300"
                style={{
                  background: "var(--surface)",
                  border: `1px solid ${online ? "color-mix(in oklab, var(--success) 25%, transparent)" : "var(--border)"}`,
                  boxShadow: online ? "var(--shadow-card), 0 0 20px color-mix(in oklab, var(--success) 8%, transparent)" : "var(--shadow-card)",
                }}
                onMouseEnter={(e) => {
                  if (unlocked) {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = "translateY(-2px)";
                    el.style.boxShadow = "var(--shadow-hover), 0 0 0 1px color-mix(in oklab, var(--accent) 20%, transparent)";
                    el.style.borderColor = "color-mix(in oklab, var(--accent) 30%, transparent)";
                  }
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "none";
                  el.style.boxShadow = online ? "var(--shadow-card), 0 0 20px color-mix(in oklab, var(--success) 8%, transparent)" : "var(--shadow-card)";
                  el.style.borderColor = online ? "color-mix(in oklab, var(--success) 25%, transparent)" : "var(--border)";
                }}
              >
                {/* Corner glow */}
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: `radial-gradient(circle, color-mix(in oklab, var(--accent) 12%, transparent), transparent 70%)` }}
                />

                {/* Online pulse strip */}
                {online && (
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
                    style={{ background: "linear-gradient(90deg, transparent, var(--success), transparent)" }}
                  />
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-card transition-transform duration-300 group-hover:scale-110"
                      style={{
                        background: unlocked ? grad : "var(--surface-2)",
                        boxShadow: unlocked ? "0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)" : "none",
                      }}
                    >
                      <Icon className={unlocked ? "h-5 w-5 text-white" : "h-5 w-5 text-muted-foreground"} />
                    </div>
                    <StatusBadge variant={online ? "online" : "standby"} live={online} />
                  </div>

                  <div className="mt-4">
                    <div className="font-display text-[15px] font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
                      {mod.name}
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                      {mod.desc}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={online}
                        onCheckedChange={async (v) => {
                          if (blockIfGuest("Sign up to deploy automation modules.")) return;
                          if (!unlocked || !user) return;
                          if (!v) {
                            try {
                              await saveIntegration(KEY_PREFIX + mod.key, "");
                              qc.invalidateQueries({ queryKey: ["user_integrations", user.id] });
                            } catch (e) {
                              toast.error(e instanceof Error ? e.message : "Failed to update");
                            }
                          } else {
                            setActive(mod);
                          }
                        }}
                        disabled={!unlocked}
                      />
                      <span className="text-[12px]" style={{ color: online ? "var(--success)" : "var(--muted-foreground)" }}>
                        {online ? "Online" : "Standby"}
                      </span>
                    </div>
                    <button
                      onClick={() => setActive(mod)}
                      disabled={!unlocked}
                      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11.5px] font-medium transition"
                      style={{
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        color: "var(--muted-foreground)",
                        opacity: unlocked ? 1 : 0.5,
                        cursor: unlocked ? "pointer" : "not-allowed",
                      }}
                      onMouseEnter={(e) => {
                        if (unlocked) {
                          (e.currentTarget as HTMLElement).style.borderColor = "color-mix(in oklab, var(--accent) 40%, transparent)";
                          (e.currentTarget as HTMLElement).style.color = "var(--accent)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                        (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
                      }}
                    >
                      <Settings2 className="h-3.5 w-3.5" /> Configure
                    </button>
                  </div>
                </div>
              </div>

              {!unlocked && <LockedOverlay />}
            </div>
          );
        })}
      </div>

      <ConfigureSheet open={!!active} onOpenChange={(o) => !o && setActive(null)} module={active} />
    </div>
  );
}

function LockedOverlay() {
  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl"
      style={{
        background: "color-mix(in oklab, var(--background) 75%, transparent)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="rounded-2xl p-5 text-center"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div
          className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: "color-mix(in oklab, var(--accent) 12%, transparent)" }}
        >
          <Lock className="h-4 w-4" style={{ color: "var(--accent)" }} />
        </div>
        <div className="text-[12.5px] font-semibold" style={{ color: "var(--foreground)" }}>
          Available on Operate
        </div>
        <div className="mt-0.5 text-[11.5px]" style={{ color: "var(--muted-foreground)" }}>
          Upgrade to deploy this module.
        </div>
        <Link to="/app/billing">
          <button
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-semibold text-white transition"
            style={{
              background: "linear-gradient(135deg, var(--accent), var(--primary))",
              boxShadow: "0 4px 12px color-mix(in oklab, var(--accent) 30%, transparent)",
            }}
          >
            Upgrade plan <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </Link>
      </div>
    </div>
  );
}

function ConfigureSheet({
  open, onOpenChange, module: mod,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  module: NovaModule | null;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const intQ = useQuery({ ...integrationsQuery(user?.id ?? ""), enabled: !!user });
  const existing = mod && intQ.data?.find((i) => i.integration_key === KEY_PREFIX + mod.key);
  const [url, setUrl] = useState("");

  useEffect(() => { setUrl(""); }, [open]);

  const save = async () => {
    if (blockIfGuest("Sign up to wire automation webhooks.")) return;
    if (!user || !mod) return;
    try {
      await saveIntegration(KEY_PREFIX + mod.key, url);
      toast.success("Module saved");
      qc.invalidateQueries({ queryKey: ["user_integrations", user.id] });
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  };

  const placeholder = existing?.value_last4
    ? `Currently set · ending …${existing.value_last4}`
    : "https://hooks.example.com/...";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <div
            className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--muted-foreground)" }}
          >
            Module configuration
          </div>
          <SheetTitle className="font-display text-[18px]">{mod?.name}</SheetTitle>
          <SheetDescription>
            Wire this module to a webhook endpoint to trigger real-world actions.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4 px-4">
          <div>
            <div className="mb-1.5 text-[12.5px] font-medium" style={{ color: "var(--foreground)" }}>
              Webhook URL
            </div>
            <Input
              placeholder={placeholder}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="rounded-xl"
            />
            <p className="mt-2 text-[11.5px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              We'll POST events to this URL when the module fires. For security, the existing
              URL isn't shown — re-enter to update, or leave blank and save to disconnect.
            </p>
          </div>
          <Button onClick={save} className="w-full rounded-xl">Save module</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
