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
import { Lock, Settings2, Inbox, Mail, UserCheck, Receipt, Star, BarChart3, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { blockIfGuest } from "@/lib/guest";

export const Route = createFileRoute("/app/nova/")({ component: NovaOverview });

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "lead-capture": Inbox,
  "followup": Mail,
  "onboarding": UserCheck,
  "invoice": Receipt,
  "reputation": Star,
  "reporting": BarChart3,
};

const KEY_PREFIX = "nova:webhook:";

function NovaOverview() {
  const { currentOrgId, user } = useAuth();
  const subQ = useQuery({ ...subscriptionQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const intQ = useQuery({ ...integrationsQuery(user?.id ?? ""), enabled: !!user });
  const qc = useQueryClient();

  const plan = subQ.data?.plan ?? "starter";
  const unlocked = plan === "operate" || plan === "scale";
  const [active, setActive] = useState<NovaModule | null>(null);

  const integrations = intQ.data ?? [];
  const moduleStatus = (key: string) => integrations.find((i) => i.integration_key === KEY_PREFIX + key);

  return (
    <div className="space-y-7">
      <WorkspaceHeader
        variant="nova"
        icon={Zap}
        eyebrow="Nova OS · operations control"
        title="Automation modules"
        description="Toggle modules on to put repetitive work on autopilot. Each one connects to your existing tools."
        actions={
          <span className="rounded-full border border-border bg-surface/80 backdrop-blur px-2.5 py-1 text-[11px] text-muted-foreground">
            Plan: <span className="font-medium capitalize text-foreground">{plan}</span>
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {novaSystemsCatalog.map((mod) => {
          const Icon = ICONS[mod.key] ?? Settings2;
          const status = moduleStatus(mod.key);
          const online = status?.status === "connected" && !!status?.is_connected;

          return (
            <div key={mod.key} className="relative">
              <div
                className={cn(
                  "tactical-card relative h-full overflow-hidden rounded-xl border border-border bg-card p-5 shadow-soft",
                  !unlocked && "opacity-95",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <StatusBadge variant={online ? "online" : "standby"} live={online} />
                </div>

                <div className="mt-4">
                  <div className="font-display text-[15px] font-semibold tracking-tight">{mod.name}</div>
                  <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">{mod.desc}</p>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch
                      checked={online}
                      onCheckedChange={async (v) => {
                        if (blockIfGuest("Sign up to deploy automation modules.")) return;
                        if (!unlocked || !user) return;
                        // Toggle without overwriting the encrypted webhook value:
                        // if turning off and a webhook is configured, just clear it.
                        if (!v) {
                          try {
                            await saveIntegration(KEY_PREFIX + mod.key, "");
                            qc.invalidateQueries({ queryKey: ["user_integrations", user.id] });
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Failed to update");
                          }
                        } else {
                          // Need a webhook URL to enable — open the configure sheet.
                          setActive(mod);
                        }
                      }}
                      disabled={!unlocked}
                    />
                    <span>{online ? "Online" : "Standby"}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => setActive(mod)}
                    disabled={!unlocked}
                  >
                    <Settings2 className="h-3.5 w-3.5" /> Configure
                  </Button>
                </div>
              </div>

              {!unlocked && <LockedModule />}
            </div>
          );
        })}
      </div>

      <ConfigureSheet open={!!active} onOpenChange={(o) => !o && setActive(null)} module={active} />
    </div>
  );
}

function LockedModule() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/85 backdrop-blur-[2px]">
      <div className="rounded-lg border border-border bg-card p-4 text-center shadow-elevated">
        <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="h-4 w-4" />
        </div>
        <div className="text-[12.5px] font-medium text-foreground">Available on Operate</div>
        <div className="mt-0.5 text-[11.5px] text-muted-foreground">Upgrade to deploy this module.</div>
        <Link to="/app/billing">
          <Button size="sm" className="mt-3">Upgrade plan</Button>
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

  // Sync when sheet opens — for security, the previous webhook URL is never
  // returned to the client. Show the last-4 hint as placeholder instead.
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
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Module configuration
          </div>
          <SheetTitle className="font-display text-[18px]">{mod?.name}</SheetTitle>
          <SheetDescription>
            Wire this module to a webhook endpoint to trigger real-world actions.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4 px-4">
          <div>
            <div className="mb-1.5 text-[12.5px] font-medium text-foreground">Webhook URL</div>
            <Input
              placeholder={placeholder}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              We'll POST events to this URL when the module fires. For security, the existing
              URL isn't shown — re-enter to update, or leave blank and save to disconnect.
            </p>
          </div>
          <Button onClick={save} className="w-full">Save module</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
