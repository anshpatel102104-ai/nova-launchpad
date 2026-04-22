import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sparkles, ArrowRight } from "lucide-react";

const COMMANDS: { match: RegExp; label: string; to: string }[] = [
  { match: /validate|idea/i, label: "Validate this idea", to: "/app/launchpad/idea-validator" },
  { match: /pitch/i, label: "Generate a pitch", to: "/app/launchpad/pitch-generator" },
  { match: /gtm|go-?to-?market|strategy/i, label: "Build my GTM", to: "/app/launchpad/gtm-strategy" },
  { match: /landing|page/i, label: "Generate my landing page", to: "/app/launchpad/landing-page" },
  { match: /first 10|customers/i, label: "Get my first 10 customers", to: "/app/launchpad/first-10-customers" },
  { match: /lead|capture/i, label: "Open lead capture", to: "/app/nova/leads" },
  { match: /follow|automation|workflow/i, label: "Start a follow-up automation", to: "/app/nova/workflows" },
  { match: /pipeline|crm|deals/i, label: "View pipeline", to: "/app/nova/crm" },
  { match: /onboard|client/i, label: "Launch client onboarding", to: "/app/nova/clients" },
  { match: /report|analytics|funnel/i, label: "Show reporting", to: "/app/nova/reports" },
];

export function AiOperator({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const matches = q.trim()
    ? COMMANDS.filter((c) => c.match.test(q)).slice(0, 6)
    : COMMANDS.slice(0, 6);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Sparkles className="h-4 w-4 text-launchpad" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ask the AI Operator… e.g. ‘build my GTM’"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <span className="text-[10px] text-muted-foreground">⌘K</span>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {matches.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              Try: “validate this idea”, “build GTM”, “view pipeline”, “start automation”
            </div>
          ) : (
            matches.map((c) => (
              <button
                key={c.to}
                onClick={() => {
                  navigate({ to: c.to });
                  onOpenChange(false);
                  setQ("");
                }}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <span>{c.label}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))
          )}
        </div>
        <div className="border-t border-border bg-muted/40 px-4 py-2 text-[11px] text-muted-foreground">
          Trigger → Action → Output. The Operator routes you to the right module and pre-fills context.
        </div>
      </DialogContent>
    </Dialog>
  );
}
