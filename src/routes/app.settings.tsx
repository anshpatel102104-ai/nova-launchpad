import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { StatusBadge, XpBar } from "@/components/app/MissionHeader";
import { WorkspaceHeader } from "@/components/app/WorkspaceHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { organizationQuery, subscriptionQuery, planEntitlementsQuery, integrationsQuery, usageQuery, saveIntegration } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, Check, Lock, Trash2, ShieldCheck, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { blockIfGuest } from "@/lib/guest";

export const Route = createFileRoute("/app/settings")({ component: SettingsPage });

const INTEGRATIONS = [
  { key: "stripe",          name: "Stripe",          hint: "API key (sk_live_...)",                              type: "key", soon: false },
  { key: "gohighlevel",     name: "GoHighLevel",     hint: "API key",                                            type: "key", soon: false },
  { key: "airtable",        name: "Airtable",        hint: "Personal access token",                              type: "key", soon: false },
  { key: "n8n",             name: "n8n webhook",     hint: "https://n8n.example.com/webhook/...",                type: "url", soon: false },
  { key: "zapier",          name: "Zapier webhook",  hint: "https://hooks.zapier.com/hooks/catch/...",           type: "url", soon: false },
  { key: "slack",           name: "Slack webhook",   hint: "https://hooks.slack.com/services/...",               type: "url", soon: false },
  { key: "google_calendar", name: "Google Calendar", hint: "OAuth coming soon",                                  type: "url", soon: true },
  { key: "gmail",           name: "Gmail",           hint: "OAuth coming soon",                                  type: "url", soon: true },
] as const;

function SettingsPage() {
  return (
    <div className="space-y-6">
      <WorkspaceHeader
        variant="settings"
        icon={SettingsIcon}
        eyebrow="Account"
        title="Settings"
        description="Manage your profile, organization, plan, and integrations."
      />
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="flex w-full flex-wrap gap-1 bg-muted/40">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="connectors">Connectors</TabsTrigger>
          <TabsTrigger value="danger">Danger zone</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-5"><ProfileTab /></TabsContent>
        <TabsContent value="organization" className="mt-5"><OrgTab /></TabsContent>
        <TabsContent value="plan" className="mt-5"><PlanTab /></TabsContent>
        <TabsContent value="connectors" className="mt-5"><ConnectorsTab /></TabsContent>
        <TabsContent value="danger" className="mt-5"><DangerTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <div>
        <div className="font-display text-[15px] font-semibold tracking-tight">{title}</div>
        {description && <div className="mt-1 text-[12.5px] text-muted-foreground">{description}</div>}
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[12.5px] font-medium text-foreground">{label}</div>
      {children}
    </label>
  );
}

function ProfileTab() {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState("");
  useEffect(() => { if (profile?.full_name) setFullName(profile.full_name); }, [profile]);

  const save = async () => {
    if (blockIfGuest("Sign up to update your profile.")) return;
    if (!user) return;
    const { error } = await supabase.from("profiles").update({
      full_name: fullName,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    }).eq("id", user.id);
    if (error) toast.error(error.message);
    else { toast.success("Profile saved"); refreshProfile(); }
  };

  return (
    <Section title="Your profile" description="How your name and avatar appear across the workspace.">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
        <Field label="Email"><Input value={user?.email ?? ""} disabled /></Field>
        <Field label="Avatar URL"><Input placeholder="https://..." value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} /></Field>
      </div>
      <Button onClick={save} className="mt-4">Save profile</Button>
    </Section>
  );
}

function OrgTab() {
  const { currentOrgId } = useAuth();
  const qc = useQueryClient();
  const orgQ = useQuery({ ...organizationQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const [name, setName] = useState("");
  const [niche, setNiche] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [stage, setStage] = useState<string>("Idea");
  const [target, setTarget] = useState("");

  useEffect(() => {
    if (orgQ.data) {
      setName(orgQ.data.name ?? "");
      setNiche(orgQ.data.niche ?? "");
      setBusinessType(orgQ.data.business_type ?? "");
      setStage(orgQ.data.stage ?? "Idea");
      setTarget(orgQ.data.target_customer ?? "");
    }
  }, [orgQ.data]);

  const save = async () => {
    if (blockIfGuest("Sign up to manage your organization.")) return;
    if (!currentOrgId) return;
    const { error } = await supabase.from("organizations").update({
      name, niche, business_type: businessType, target_customer: target,
      stage: stage as "Idea" | "Validate" | "Launch" | "Operate" | "Scale",
    }).eq("id", currentOrgId);
    if (error) toast.error(error.message);
    else { toast.success("Organization saved"); qc.invalidateQueries({ queryKey: ["organization", currentOrgId] }); }
  };

  return (
    <Section title="Organization" description="Help Nova personalize tool outputs to your business.">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Business name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Business type"><Input value={businessType} onChange={(e) => setBusinessType(e.target.value)} /></Field>
        <Field label="Niche"><Input value={niche} onChange={(e) => setNiche(e.target.value)} /></Field>
        <Field label="Stage">
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            {["Idea", "Validate", "Launch", "Operate", "Scale"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Target customer"><Input value={target} onChange={(e) => setTarget(e.target.value)} /></Field>
      </div>
      <Button onClick={save} className="mt-4">Save organization</Button>
    </Section>
  );
}

function PlanTab() {
  const { currentOrgId } = useAuth();
  const subQ = useQuery({ ...subscriptionQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const plansQ = useQuery(planEntitlementsQuery());
  const usageQ = useQuery({ ...usageQuery(currentOrgId ?? ""), enabled: !!currentOrgId });

  const current = subQ.data?.plan ?? "starter";
  const plans = plansQ.data ?? [];
  const totalUsed = (usageQ.data ?? []).reduce((s, r) => s + (r.count as number), 0);
  const currentPlan = plans.find((p) => p.plan === current);
  const limit = currentPlan?.monthly_generation_limit ?? 0;
  const pct = limit ? (totalUsed / limit) * 100 : 0;

  return (
    <div className="space-y-5">
      <Section title="Current plan" description="Track your usage and upgrade when you need more headroom.">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-display text-[1.6rem] font-semibold capitalize tracking-tight leading-none">
              {current}
            </div>
            <div className="mt-1.5 text-sm text-muted-foreground">${currentPlan?.price_usd ?? 0}/mo</div>
          </div>
          <div className="w-full md:w-1/2">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Usage this month</span>
              <span className="font-mono text-foreground">{totalUsed} / {limit || "∞"}</span>
            </div>
            <XpBar value={pct} />
          </div>
        </div>
      </Section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((p) => {
          const isCurrent = p.plan === current;
          return (
            <div
              key={p.plan}
              className={cn(
                "relative rounded-xl border bg-card p-5 shadow-soft transition",
                isCurrent ? "border-primary" : "border-border hover:border-foreground/15",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="font-display text-[15px] font-semibold capitalize tracking-tight">
                  {p.plan}
                </div>
                {isCurrent && <StatusBadge variant="active" live label="Current" />}
              </div>
              <div className="mt-2 font-display text-[1.6rem] font-semibold leading-none">
                ${p.price_usd}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </div>
              <ul className="mt-4 space-y-1.5 text-[12.5px] text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-success" />
                  {p.monthly_generation_limit ?? "Unlimited"} generations / month
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-success" />
                  {p.allowed_tools.length} AI tools included
                </li>
              </ul>
              {!isCurrent && <Button size="sm" className="mt-4 w-full">Upgrade</Button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConnectorsTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const intQ = useQuery({ ...integrationsQuery(user?.id ?? ""), enabled: !!user });
  const integrations = intQ.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display text-[15px] font-semibold tracking-tight">Integrations</div>
          <div className="mt-0.5 text-[12.5px] text-muted-foreground">
            Connect Nova to the tools your business already uses.
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          {integrations.filter((i) => i.is_connected).length} connected
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {INTEGRATIONS.map((conn) => {
          const existing = integrations.find((i) => i.integration_key === conn.key);
          return (
            <ConnectorCard
              key={conn.key}
              conn={conn}
              existing={existing}
              onSaved={() => user && qc.invalidateQueries({ queryKey: ["user_integrations", user.id] })}
            />
          );
        })}
      </div>
    </div>
  );
}

function ConnectorCard({
  conn, existing, onSaved,
}: {
  conn: typeof INTEGRATIONS[number];
  existing?: { is_connected: boolean; value_last4: string | null; status: string };
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [val, setVal] = useState("");
  // For security, never prefill the secret. Show last-4 as placeholder.
  useEffect(() => { setVal(""); }, [existing?.value_last4]);

  const isConnected = !!existing?.is_connected && existing.status === "connected";

  const save = async () => {
    if (blockIfGuest("Sign up to connect real integrations.")) return;
    if (!user) return;
    try {
      await saveIntegration(conn.key, val);
      toast.success(`${conn.name} ${val ? "connected" : "cleared"}`);
      setVal("");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-soft transition",
        conn.soon ? "opacity-70" : "hover:border-foreground/15",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-display text-[14px] font-semibold tracking-tight">{conn.name}</div>
          <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{conn.hint}</div>
        </div>
        {conn.soon ? (
          <StatusBadge variant="soon" />
        ) : (
          <StatusBadge
            variant={isConnected ? "active" : "locked"}
            live={isConnected}
            label={isConnected ? "Connected" : "Not set"}
          />
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <Input
          placeholder={conn.soon ? "Coming soon" : conn.hint}
          value={val}
          disabled={conn.soon}
          onChange={(e) => setVal(e.target.value)}
          type={conn.type === "key" ? "password" : "text"}
        />
        <Button size="sm" onClick={save} disabled={conn.soon} className="shrink-0">
          {conn.soon ? <Lock className="h-3.5 w-3.5" /> : isConnected ? "Update" : "Connect"}
        </Button>
      </div>
    </div>
  );
}

function DangerTab() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");

  const remove = async () => {
    if (blockIfGuest("This is a demo — no account to delete.")) return;
    if (!user) return;
    if (confirm !== "DELETE") { toast.error('Type "DELETE" to confirm'); return; }
    await supabase.from("profiles").update({ full_name: "(deleted)" }).eq("id", user.id);
    await signOut();
    toast.success("Account deleted");
    navigate({ to: "/login" });
  };

  return (
    <div className="rounded-xl border border-destructive/30 bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="h-4 w-4" />
        <div className="text-[12.5px] font-medium">Danger zone</div>
      </div>
      <h3 className="mt-3 font-display text-[16px] font-semibold">Delete account</h3>
      <p className="mt-1 text-[13px] text-muted-foreground">
        This permanently signs you out and clears your profile. Your data on the server may be
        retained per policy.
      </p>
      <Button variant="destructive" onClick={() => setOpen(true)} className="mt-4 gap-2">
        <Trash2 className="h-4 w-4" /> Delete account
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Confirm deletion</DialogTitle>
            <DialogDescription>
              Type <span className="font-mono font-bold">DELETE</span> to confirm. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="DELETE" />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={remove}>Confirm delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
