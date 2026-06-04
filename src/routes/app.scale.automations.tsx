import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { subscriptionQuery, integrationsQuery, saveIntegration } from "@/lib/queries";
import { novaSystemsCatalog } from "@/lib/mock";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Zap, Settings2, Lock, ArrowRight } from "lucide-react";
import { blockIfGuest } from "@/lib/guest";
import { useOwnerMode } from "@/lib/ownerMode";

export const Route = createFileRoute("/app/scale/automations")({
  component: ScaleAutomations,
});

const KEY_PREFIX = "nova:webhook:";

function ScaleAutomations() {
  const { currentOrgId, user } = useAuth();
  const subQ = useQuery({ ...subscriptionQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const intQ = useQuery({ ...integrationsQuery(user?.id ?? ""), enabled: !!user });
  const qc = useQueryClient();
  const isOwner = useOwnerMode();

  const plan = subQ.data?.plan ?? "starter";
  const unlocked = isOwner || plan === "operate" || plan === "scale";

  const [active, setActive] = useState<(typeof novaSystemsCatalog)[number] | null>(null);

  const integrations = intQ.data ?? [];
  const moduleStatus = (key: string) =>
    integrations.find((i) => i.integration_key === KEY_PREFIX + key);

  const onlineCount = novaSystemsCatalog.filter((m) => {
    const s = moduleStatus(m.key);
    return s?.status === "connected" && !!s?.is_connected;
  }).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div
            className="text-[10px] font-mono font-bold uppercase tracking-widest mb-0.5"
            style={{ color: "rgba(245,166,35,0.65)" }}
          >
            ● Scale Mode · Automations
          </div>
          <h1
            className="font-display text-[20px] font-bold"
            style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}
          >
            Automation Modules
          </h1>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11.5px] font-medium"
          style={{
            background:
              onlineCount > 0
                ? "color-mix(in oklab, var(--success) 12%, transparent)"
                : "var(--surface)",
            border: `1px solid ${onlineCount > 0 ? "color-mix(in oklab, var(--success) 30%, transparent)" : "var(--border)"}`,
            color: onlineCount > 0 ? "var(--success)" : "var(--muted-foreground)",
          }}
        >
          {onlineCount > 0 && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
            </span>
          )}
          {onlineCount > 0 ? `${onlineCount} online` : "None active"}
        </div>
      </div>

      {!unlocked && (
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{
            background: "color-mix(in oklab, var(--accent) 8%, transparent)",
            border: "1px solid color-mix(in oklab, var(--accent) 20%, transparent)",
          }}
        >
          <Lock className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-semibold" style={{ color: "var(--foreground)" }}>
              Automations require the Operate plan
            </div>
            <div className="text-[11.5px]" style={{ color: "var(--muted-foreground)" }}>
              Upgrade to deploy automation modules and connect webhooks.
            </div>
          </div>
          <Link
            to="/app/billing"
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold btn-execute shrink-0"
          >
            Upgrade <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {novaSystemsCatalog.map((mod) => {
          const status = moduleStatus(mod.key);
          const online = status?.status === "connected" && !!status?.is_connected;

          return (
            <div
              key={mod.key}
              className="rounded-xl p-4 nova-card relative"
              style={{
                borderColor: online
                  ? "color-mix(in oklab, var(--success) 25%, transparent)"
                  : undefined,
              }}
            >
              {online && (
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl"
                  style={{
                    background: "linear-gradient(90deg, transparent, var(--success), transparent)",
                  }}
                />
              )}

              <div className="flex items-start justify-between mb-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{
                    background: unlocked
                      ? "linear-gradient(135deg, var(--primary), var(--accent))"
                      : "rgba(245,200,140,0.06)",
                  }}
                >
                  <Zap
                    className="h-4 w-4"
                    style={{ color: unlocked ? "white" : "var(--muted-foreground)" }}
                  />
                </div>
                <div
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: online
                      ? "color-mix(in oklab, var(--success) 12%, transparent)"
                      : "rgba(245,200,140,0.06)",
                    color: online ? "var(--success)" : "var(--muted-foreground)",
                  }}
                >
                  {online ? "Online" : "Standby"}
                </div>
              </div>

              <div
                className="text-[13px] font-semibold mb-1"
                style={{ color: "var(--foreground)" }}
              >
                {mod.name}
              </div>
              <p
                className="text-[11.5px] line-clamp-2 mb-4"
                style={{ color: "var(--muted-foreground)" }}
              >
                {mod.desc}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={online}
                    disabled={!unlocked}
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
                  />
                </div>
                <button
                  onClick={() => setActive(mod)}
                  disabled={!unlocked}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition nova-card nova-card-hover"
                  style={{
                    opacity: unlocked ? 1 : 0.4,
                    cursor: unlocked ? "pointer" : "not-allowed",
                    color: "var(--muted-foreground)",
                  }}
                >
                  <Settings2 className="h-3 w-3" /> Configure
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <ConfigureSheet open={!!active} onOpenChange={(o) => !o && setActive(null)} module={active} />
    </div>
  );
}

function ConfigureSheet({
  open,
  onOpenChange,
  module: mod,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  module: (typeof novaSystemsCatalog)[number] | null;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const intQ = useQuery({ ...integrationsQuery(user?.id ?? ""), enabled: !!user });
  const existing = mod && intQ.data?.find((i) => i.integration_key === KEY_PREFIX + mod.key);
  const [url, setUrl] = useState("");

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <div
            className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--muted-foreground)" }}
          >
            Configure Module
          </div>
          <SheetTitle className="font-display text-[18px]">{mod?.name}</SheetTitle>
          <SheetDescription>
            Wire this module to a webhook endpoint to trigger real-world actions.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4 px-4">
          <div>
            <div
              className="mb-1.5 text-[12.5px] font-medium"
              style={{ color: "var(--foreground)" }}
            >
              Webhook URL
            </div>
            <Input
              placeholder={
                existing?.value_last4
                  ? `Currently set · ending …${existing.value_last4}`
                  : "https://hooks.example.com/..."
              }
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="rounded-xl"
            />
            <p
              className="mt-2 text-[11.5px] leading-relaxed"
              style={{ color: "var(--muted-foreground)" }}
            >
              We'll POST events to this URL when the module fires.
            </p>
          </div>
          <Button onClick={save} className="w-full rounded-xl">
            Save module
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
