import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { currentCompany, currentUser } from "@/lib/mock";
import { Mail, Calendar, MessageSquare, Plus } from "lucide-react";

export const Route = createFileRoute("/app/settings")({
  component: Settings,
});

function Settings() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Profile, company, integrations, and team."
      />

      <Section title="Profile">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name"><Input defaultValue={currentUser.fullName} /></Field>
          <Field label="Email"><Input defaultValue={currentUser.email} /></Field>
        </div>
        <div className="mt-3"><Button size="sm">Save changes</Button></div>
      </Section>

      <Section title="Company">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name"><Input defaultValue={currentCompany.name} /></Field>
          <Field label="Business type"><Input defaultValue={currentCompany.businessType} /></Field>
          <Field label="Niche"><Input defaultValue={currentCompany.niche} /></Field>
          <Field label="Location"><Input defaultValue={currentCompany.location} /></Field>
          <Field label="Target customer"><Input defaultValue={currentCompany.targetCustomer} /></Field>
          <Field label="Offer"><Input defaultValue={currentCompany.offer} /></Field>
        </div>
      </Section>

      <Section title="Integrations">
        <div className="grid gap-3 sm:grid-cols-3">
          <Integration icon={Mail} name="Gmail" status="Connect" />
          <Integration icon={Calendar} name="Google Calendar" status="Connect" />
          <Integration icon={MessageSquare} name="Slack" status="Connect" />
        </div>
      </Section>

      <Section title="Team">
        <div className="rounded-md border border-border divide-y divide-border">
          <Member name={currentUser.fullName} email={currentUser.email} role="Owner" />
        </div>
        <div className="mt-3"><Button size="sm" variant="outline"><Plus className="h-4 w-4" /> Invite teammate</Button></div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 text-sm font-semibold">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}

function Integration({ icon: Icon, name, status }: { icon: React.ComponentType<{ className?: string }>; name: string; status: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{name}</span>
      </div>
      <Button size="sm" variant="outline">{status}</Button>
    </div>
  );
}

function Member({ name, email, role }: { name: string; email: string; role: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <div>
        <div className="font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">{email}</div>
      </div>
      <span className="text-xs text-muted-foreground">{role}</span>
    </div>
  );
}
