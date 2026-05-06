import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusPill } from "@/components/app/StatusPill";
import { Activity as ActivityIcon, Zap, CheckCircle2, CreditCard, Plug, Download } from "lucide-react";

export const Route = createFileRoute("/app/activity")({
  component: ActivityPage,
});

const ITEMS = [
  { icon: Zap, type: "Tool run", title: "Offer Builder completed", time: "12 min ago", tone: "success" as const },
  { icon: CheckCircle2, type: "Onboarding", title: "Profile completed", time: "2 hr ago", tone: "primary" as const },
  { icon: ActivityIcon, type: "Automation", title: "Lead Capture System triggered", time: "Yesterday", tone: "default" as const },
  { icon: Download, type: "Export", title: "Exported proposal as PDF", time: "2d ago", tone: "muted" as const },
  { icon: Plug, type: "Integration", title: "Connected Google Workspace", time: "3d ago", tone: "primary" as const },
  { icon: CreditCard, type: "Billing", title: "Upgraded to Launch plan", time: "1w ago", tone: "success" as const },
];

function ActivityPage() {
  return (
    <>
      <PageHeader eyebrow="Activity" title="Everything happening in your workspace." />

      <div className="nova-card p-5">
        <ul className="relative space-y-5">
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
          {ITEMS.map((it, i) => (
            <li key={i} className="relative flex items-start gap-4">
              <div className="h-8 w-8 rounded-full border border-border bg-surface-elevated grid place-items-center shrink-0 z-10">
                <it.icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pt-1">
                <div>
                  <p className="text-sm font-medium">{it.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusPill tone={it.tone} dot={false}>{it.type}</StatusPill>
                    <span className="text-xs text-muted-foreground">{it.time}</span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {/* TODO: stream from Supabase activity_events */}
    </>
  );
}
