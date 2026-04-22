import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

const STEPS = [
  { key: "fullName", label: "Your name", placeholder: "Alex Morgan" },
  { key: "company", label: "Company name", placeholder: "Northwind Labs" },
  { key: "businessType", label: "Business type", placeholder: "B2B SaaS" },
  { key: "niche", label: "Niche", placeholder: "Sales enablement" },
  { key: "stage", label: "Current stage", choices: ["Idea", "Validate", "Launch", "Operate", "Scale"] },
  { key: "offer", label: "Your offer", placeholder: "AI-powered sales playbooks" },
  { key: "targetCustomer", label: "Target customer", placeholder: "Series A founders" },
  { key: "goal", label: "Primary goal", placeholder: "Hit $20k MRR in 90 days" },
  { key: "location", label: "Where are you based?", placeholder: "Austin, TX" },
] as const;

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, string>>({});
  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else {
      const stage = data.stage || "Launch";
      if (stage === "Operate" || stage === "Scale") navigate({ to: "/app/nova" });
      else navigate({ to: "/app/launchpad" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex h-14 items-center gap-2 border-b border-border px-6">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground"><Sparkles className="h-4 w-4" /></div>
        <span className="font-display text-sm font-semibold">LaunchpadNOVA</span>
        <div className="ml-auto text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</div>
      </header>
      <div className="h-1 bg-muted">
        <div className="h-full bg-launchpad transition-all" style={{ width: `${progress}%` }} />
      </div>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Set up your operating system</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{current.label}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We'll use this to route you to the right workspace and tailor your dashboard.
          </p>

          <div className="mt-6">
            {"choices" in current ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {current.choices.map((c) => (
                  <button
                    key={c}
                    onClick={() => setData({ ...data, [current.key]: c })}
                    className={cn(
                      "rounded-md border px-3 py-2.5 text-sm transition",
                      data[current.key] === c
                        ? "border-launchpad bg-launchpad/10 text-launchpad font-medium"
                        : "border-border bg-card hover:bg-accent",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            ) : (
              <Input
                autoFocus
                placeholder={current.placeholder}
                value={data[current.key] || ""}
                onChange={(e) => setData({ ...data, [current.key]: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") next(); }}
              />
            )}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={next}>
              {step === STEPS.length - 1 ? <>Finish <Check className="h-4 w-4" /></> : <>Continue <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
