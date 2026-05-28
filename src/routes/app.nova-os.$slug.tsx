import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { PageHeader, SectionHeader } from "@/components/app/PageHeader";
import { StatusPill } from "@/components/app/StatusPill";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { NOVA_SYSTEMS } from "@/lib/catalog";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  FileQuestion,
  Plug,
  Power,
} from "lucide-react";

export const Route = createFileRoute("/app/nova-os/$slug")({
  component: SystemDetail,
});

const CHECKLIST = [
  { label: "Connect data source", done: false },
  { label: "Configure trigger", done: false },
  { label: "Set output destination", done: false },
  { label: "Test run", done: false },
];

function SystemDetail() {
  const { slug } = useParams({ from: "/app/nova-os/$slug" });
  const sys = NOVA_SYSTEMS.find((s) => s.slug === slug);

  if (!sys) {
    return (
      <>
        <PageHeader title="System not found" />
        <EmptyState
          icon={FileQuestion}
          title="That system doesn't exist"
          action={
            <Button asChild>
              <Link to="/app/nova-os">Back to Nova OS</Link>
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <Link
        to="/app/nova-os"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All systems
      </Link>
      <PageHeader
        eyebrow="Nova OS"
        title={sys.name}
        description={sys.description}
        actions={
          <>
            <StatusPill tone="warning">Setup needed</StatusPill>
            <Button>
              <Power className="h-4 w-4 mr-1.5" /> Activate
            </Button>
          </>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="nova-card p-5">
            <SectionHeader title="System flow" description="Trigger → Action → Output" />
            <div className="grid grid-cols-3 gap-2">
              <FlowCell label="Trigger" value={sys.trigger} />
              <FlowCell label="Action" value={sys.action} />
              <FlowCell label="Output" value={sys.output} />
            </div>
          </div>

          <div className="nova-card p-5">
            <SectionHeader
              title="Setup checklist"
              description="Complete each step to activate this system."
            />
            <ul className="divide-y divide-border">
              {CHECKLIST.map((c) => (
                <li key={c.label} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {c.done ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm">{c.label}</span>
                  </div>
                  <Button size="sm" variant="ghost">
                    Configure <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          <div className="nova-card p-5">
            <SectionHeader title="Activity log" />
            <EmptyState
              icon={Activity}
              title="No activity yet"
              description="Once activated, every run shows up here."
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="nova-card p-5">
            <SectionHeader title="Connected services" />
            <ul className="space-y-2 text-sm">
              {["Supabase", "Google Workspace", "Claude AI"].map((svc) => (
                <li key={svc} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plug className="h-3.5 w-3.5 text-muted-foreground" />
                    {svc}
                  </div>
                  <StatusPill tone={svc === "Supabase" ? "success" : "muted"}>
                    {svc === "Supabase" ? "Connected" : "Not connected"}
                  </StatusPill>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" size="sm" className="w-full mt-4">
              <Link to="/app/integrations">Manage integrations</Link>
            </Button>
          </div>

          <div className="nova-card p-5">
            <SectionHeader title="Status" />
            <ul className="space-y-2.5 text-sm">
              <li className="flex justify-between">
                <span className="text-muted-foreground">State</span>
                <StatusPill tone="warning">Inactive</StatusPill>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Last run</span>
                <span>—</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Errors (24h)</span>
                <span>0</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

function FlowCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-1">{value}</p>
    </div>
  );
}
