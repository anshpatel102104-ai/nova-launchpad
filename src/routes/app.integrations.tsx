import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusPill } from "@/components/app/StatusPill";
import { Button } from "@/components/ui/button";
import { Database, Mail, CreditCard, Table2, Workflow, Webhook, Code2 } from "lucide-react";

export const Route = createFileRoute("/app/integrations")({
  component: IntegrationsPage,
});

const INTEGRATIONS = [
  {
    id: "supabase",
    name: "Supabase",
    icon: Database,
    desc: "Database, auth, and storage for your workspace.",
    connected: true,
    notes: "Used for user data, workspaces, runs, assets.",
    settingsKey: null,
  },
  {
    id: "google",
    name: "Google Workspace",
    icon: Mail,
    desc: "Sync calendar and send emails on your behalf.",
    connected: false,
    notes: "Required for Appointment Booking System.",
    settingsKey: null,
    comingSoon: true,
  },
  {
    id: "stripe",
    name: "Stripe",
    icon: CreditCard,
    desc: "Billing, subscriptions, and customer payments.",
    connected: false,
    notes: "Powers plan upgrades and invoices.",
    settingsKey: "stripe",
  },
  {
    id: "airtable",
    name: "Airtable",
    icon: Table2,
    desc: "Read and write to your Airtable bases.",
    connected: false,
    notes: "Optional CRM source for Nova OS.",
    settingsKey: "airtable",
  },
  {
    id: "webhook",
    name: "Webhook",
    icon: Webhook,
    desc: "Receive events from any external service.",
    connected: false,
    notes: "Custom endpoint configurable per workspace.",
    settingsKey: "zapier",
  },
  {
    id: "api",
    name: "Custom API",
    icon: Code2,
    desc: "Connect to any REST API with bearer auth.",
    connected: false,
    notes: "Pro plan and above.",
    settingsKey: null,
    comingSoon: true,
  },
];

function IntegrationsPage() {
  const navigate = useNavigate();

  const handleConnect = (it: (typeof INTEGRATIONS)[number]) => {
    // Route to Settings → Connectors tab for integrations that have a key
    if (it.settingsKey) {
      navigate({ to: "/app/settings" });
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Integrations"
        title="Plug Nova OPS into your stack."
        description="Connect the services that power your tools and systems."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {INTEGRATIONS.map((it) => (
          <div key={it.id} className="nova-card p-5 flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div className="h-9 w-9 rounded-md border border-border bg-surface-elevated grid place-items-center">
                <it.icon className="h-4 w-4 text-primary" />
              </div>
              <StatusPill tone={it.connected ? "success" : "muted"}>
                {it.connected ? "Connected" : "Not connected"}
              </StatusPill>
            </div>
            <h3 className="text-sm font-semibold">{it.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground flex-1">{it.desc}</p>
            <p className="mt-3 text-[11px] text-muted-foreground border-t border-border pt-3">
              {it.notes}
            </p>
            <Button
              size="sm"
              variant={it.connected ? "outline" : "default"}
              className="mt-4 w-fit"
              disabled={"comingSoon" in it && it.comingSoon}
              onClick={() => handleConnect(it)}
            >
              {"comingSoon" in it && it.comingSoon
                ? "Coming soon"
                : it.connected
                  ? "Manage"
                  : "Connect"}
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}
