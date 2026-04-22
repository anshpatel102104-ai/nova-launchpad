import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MissionHeader, StatusBadge } from "@/components/app/MissionHeader";
import { novaSystemsCatalog, type NovaModule } from "@/lib/mock";
import { useAuth } from "@/lib/auth";
import { subscriptionQuery, integrationsQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Lock, Settings2, Inbox, Mail, UserCheck, Receipt, Star, BarChart3 } from "lucide-react";
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
      <MissionHeader
        label="NOVA OS — AUTOMATION COMMAND"
        title="Deployable Modules"
        description="Toggle systems online to put your operation on autopilot. Each module is a force multiplier."
        actions={
          <span className="font-display text-[10px] tracking-[0.18em] text-muted-foreground">
            PLAN: <span className="text-primary-glow">{plan.toUpperCase()}</span>
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {novaSystemsCatalog.map((mod) => {
          const Icon = ICONS[mod.key] ?? Settings2;
          const status = moduleStatus(mod.key);
          const online = status?.status === "connected" && !!status?.value;

          return (
            <div key={mod.key} className="relative">
              <div
                className={cn(
                  "tactical-card scanlines relative h-full overflow-hidden rounded-xl border border-border bg-card p-5",
                  !unlocked && "opacity-90"
                )}
              >
                <div className="relative z-[2] flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <StatusBadge variant={online ? "online" : "standby"} live={online} />
                </div>

                <div className="relative z-[2] mt-4">
                  <div className="font-display text-base font-semibold tracking-tight">{mod.name}</div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{mod.desc}</p>
                </div>

                <div className="relative z-[2] mt-5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch
                      checked={online}
                      onCheckedChange={async (v) => {
                        if (blockIfGuest("Sign up to deploy automation modules.")) return;
                        if (!unlocked || !user) return;
                        const { error } = await supabase.from("user_integrations").upsert(
                          {
                            user_id: user.id,
                            integration_key: KEY_PREFIX + mod.key,
                            value: status?.value ?? "",
                            status: v ? "connected" : "disabled",
                          },
                          { onConflict: "user_id,integration_key" }
                        );
                        if (error) toast.error(error.message);
                        else qc.invalidateQueries({ queryKey: ["user_integrations", user.id] });
                      }}
                      disabled={!unlocked}
                    />
                    <span>{online ? "ONLINE" : "STANDBY"}</span>
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
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/70 backdrop-blur-[3px]">
      <div className="rounded-lg border border-primary/30 bg-card/90 p-4 text-center shadow-elevated">
        <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
          <Lock className="h-4 w-4" />
        </div>
        <div className="font-display text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">SECURITY CLEARANCE REQUIRED</div>
        <Link to="/app/billing">
          <Button size="sm" className="btn-execute mt-3">UPGRADE TO OPERATE</Button>
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

  // Sync when sheet opens
  useState(() => { setUrl(existing?.value ?? ""); });

  const save = async () => {
    if (blockIfGuest("Sign up to wire automation webhooks.")) return;
    if (!user || !mod) return;
    const { error } = await supabase.from("user_integrations").upsert(
      {
        user_id: user.id,
        integration_key: KEY_PREFIX + mod.key,
        value: url,
        status: url ? "connected" : "disabled",
      },
      { onConflict: "user_id,integration_key" }
    );
    if (error) toast.error(error.message);
    else {
      toast.success("Module configured");
      qc.invalidateQueries({ queryKey: ["user_integrations", user.id] });
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <div className="mission-title text-[10px]">MODULE CONFIG</div>
          <SheetTitle className="font-display text-xl">{mod?.name}</SheetTitle>
          <SheetDescription>Wire this module to a webhook endpoint to trigger real-world actions.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-3 px-4">
          <div>
            <div className="mb-1.5 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Webhook URL
            </div>
            <Input
              className="terminal-input"
              placeholder="https://hooks.example.com/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              defaultValue={existing?.value ?? ""}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              We'll POST events to this URL when the module fires.
            </p>
          </div>
          <Button onClick={save} className="btn-execute w-full">SAVE MODULE</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
