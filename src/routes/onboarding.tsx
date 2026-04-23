import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowRight, ArrowLeft, Check, Lightbulb, Search, Rocket, Settings as SettingsIcon, TrendingUp,
  Workflow, Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/auth/sign-in" });
  },
  component: Onboarding,
});

type Stage = "Idea" | "Validate" | "Launch" | "Operate" | "Scale";
type Goal = "validate" | "launch" | "automate" | "scale";

const STAGE_OPTIONS: { id: Stage; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
  { id: "Idea",     icon: Lightbulb,   desc: "Just a concept. Need clarity." },
  { id: "Validate", icon: Search,      desc: "Testing demand and positioning." },
  { id: "Launch",   icon: Rocket,      desc: "Building, going to market." },
  { id: "Operate",  icon: SettingsIcon, desc: "Running, refining systems." },
  { id: "Scale",    icon: TrendingUp,  desc: "Growing revenue and team." },
];

const GOAL_OPTIONS: { id: Goal; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "validate", label: "Validate Idea",        desc: "Pressure-test demand before you build.", icon: Lightbulb },
  { id: "launch",   label: "Build & Launch",       desc: "Ship the offer, pitch, and GTM.",         icon: Rocket },
  { id: "automate", label: "Automate Operations",  desc: "Wire CRM, follow-ups, onboarding.",       icon: Workflow },
  { id: "scale",    label: "Scale Revenue",        desc: "Grow pipeline and reporting.",            icon: TrendingUp },
];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [stage, setStage] = useState<Stage | "">("");
  const [niche, setNiche] = useState("");
  const [offer, setOffer] = useState("");
  const [targetCustomer, setTargetCustomer] = useState("");
  const [location, setLocation] = useState("");
  const [goal, setGoal] = useState<Goal | "">("");

  const steps = [
    { key: "identity", title: "What's your name and company?",      valid: () => fullName.trim() && company.trim() },
    { key: "stage",    title: "What stage are you at?",              valid: () => !!stage },
    { key: "offer",    title: "What's your niche and offer?",        valid: () => niche.trim() && offer.trim() },
    { key: "customer", title: "Who's your target customer?",         valid: () => targetCustomer.trim() },
    { key: "goal",     title: "What's your primary goal right now?", valid: () => !!goal },
  ];

  const current = steps[step];

  const saveResponse = async (key: string, val: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("onboarding_responses").upsert(
      { user_id: user.id, question_key: key, answer: val },
      { onConflict: "user_id,question_key" },
    );
  };

  const finish = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Save responses
      await Promise.all([
        saveResponse("fullName", fullName),
        saveResponse("company", company),
        saveResponse("stage", stage),
        saveResponse("niche", niche),
        saveResponse("offer", offer),
        saveResponse("targetCustomer", targetCustomer),
        saveResponse("location", location),
        saveResponse("goal", goal),
      ]);

      await supabase.from("profiles").update({ onboarding_complete: true, full_name: fullName }).eq("id", user.id);

      const { data: member } = await supabase
        .from("organization_members").select("organization_id").eq("user_id", user.id)
        .order("created_at", { ascending: true }).limit(1).maybeSingle();

      if (member?.organization_id) {
        await supabase.from("organizations").update({
          name: company,
          niche, offer, target_customer: targetCustomer, location, goal,
          stage: (stage || "Idea") as Stage,
        }).eq("id", member.organization_id);
      }

      setCompleted(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Onboarding failed");
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    if (!current.valid()) return;
    if (step < steps.length - 1) setStep(step + 1);
    else void finish();
  };

  if (completed) {
    return <BuildingDashboard onDone={() => navigate({ to: "/app/dashboard" })} />;
  }

  return (
    <div className="boot-grid relative flex min-h-screen flex-col">
      {/* Header */}
      <header className="relative z-10 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-6 backdrop-blur">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-primary text-white font-bold text-[11px]">LN</div>
        <span className="font-display text-[14px] font-semibold tracking-tight">LaunchpadNOVA</span>
        <span className="ml-3 text-[11.5px] text-muted-foreground hidden sm:inline">Set up your workspace</span>
        <div className="ml-auto flex items-center gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i < step && "w-6 bg-primary",
                i === step && "w-8 bg-primary",
                i > step && "w-6 bg-surface-2",
              )}
            />
          ))}
          <span className="ml-2 text-[11px] text-muted-foreground tabular-nums">{step + 1} / {steps.length}</span>
        </div>
      </header>

      {/* Body */}
      <main className="relative z-10 flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="text-[11px] font-medium uppercase tracking-wider text-primary">Step {step + 1}</div>
          <h1 className="mt-2 font-display text-[1.85rem] font-semibold tracking-tight md:text-[2.1rem]">
            {current.title}
          </h1>

          <div className="mt-8">
            {step === 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your name"><Input autoFocus value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Alex Founder" className="h-11 bg-surface-2" /></Field>
                <Field label="Company"><Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Inc." className="h-11 bg-surface-2" /></Field>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                {STAGE_OPTIONS.map(({ id, icon: Icon, desc }) => {
                  const sel = stage === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setStage(id)}
                      className={cn(
                        "group flex flex-col items-start gap-2 rounded-md border p-3 text-left transition",
                        sel
                          ? "border-primary bg-primary/8 glow-primary"
                          : "border-border bg-surface hover:border-foreground/20 hover:bg-surface-2",
                      )}
                    >
                      <span className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md transition",
                        sel ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground group-hover:text-foreground",
                      )}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-[13px] font-semibold">{id}</div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground leading-snug">{desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <Field label="Niche or industry"><Input autoFocus value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="e.g. Sales enablement for fintech" className="h-11 bg-surface-2" /></Field>
                <Field label="What you sell (or plan to sell)"><Input value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="e.g. AI-powered sales playbooks" className="h-11 bg-surface-2" /></Field>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <Field label="Target customer"><Input autoFocus value={targetCustomer} onChange={(e) => setTargetCustomer(e.target.value)} placeholder="e.g. Series A founders, ops leaders" className="h-11 bg-surface-2" /></Field>
                <Field label="Where are you based? (optional)"><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Austin, TX" className="h-11 bg-surface-2" /></Field>
              </div>
            )}

            {step === 4 && (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {GOAL_OPTIONS.map(({ id, label, desc, icon: Icon }) => {
                  const sel = goal === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setGoal(id)}
                      className={cn(
                        "flex items-start gap-3 rounded-md border p-4 text-left transition",
                        sel
                          ? "border-primary bg-primary/8 glow-primary"
                          : "border-border bg-surface hover:border-foreground/20 hover:bg-surface-2",
                      )}
                    >
                      <span className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                        sel ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground",
                      )}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-semibold">{label}</div>
                        <div className="mt-0.5 text-[12px] text-muted-foreground leading-snug">{desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-10 flex items-center justify-between">
            <Button
              variant="ghost"
              disabled={step === 0 || submitting}
              onClick={() => setStep(step - 1)}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={next} disabled={submitting || !current.valid()} className="h-11 gap-1.5 px-6">
              {step === steps.length - 1 ? (
                <>{submitting ? "Setting up…" : "Complete setup"} <Sparkles className="h-4 w-4" /></>
              ) : (
                <>Continue <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[11.5px] font-medium text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}

const BUILD_STEPS = [
  "Analyzing your business",
  "Researching your industry",
  "Mapping your goals",
  "Building your command center",
  "Preparing your next actions",
];

function BuildingDashboard({ onDone }: { onDone: () => void }) {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const total = BUILD_STEPS.length;
    const stepMs = 850;
    const tickMs = 25;
    const totalMs = stepMs * total;
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / totalMs) * 100);
      setProgress(pct);
      const idx = Math.min(total - 1, Math.floor(elapsed / stepMs));
      setActive(idx);
      if (elapsed >= totalMs) {
        clearInterval(id);
        setTimeout(onDone, 450);
      }
    }, tickMs);
    return () => clearInterval(id);
  }, [onDone]);

  return (
    <div className="boot-grid relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-primary text-white shadow-card glow-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-primary">System boot</div>
            <div className="font-display text-[15px] font-semibold tracking-tight">Building your command center</div>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-border bg-surface/85 backdrop-blur p-5 shadow-card">
          <ul className="space-y-2.5 font-mono text-[12px]">
            {BUILD_STEPS.map((label, i) => {
              const done = i < active;
              const live = i === active;
              return (
                <li key={label} className="flex items-center gap-2.5">
                  <span className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border text-[9px]",
                    done && "border-success bg-success/15 text-success",
                    live && "border-primary bg-primary/15 text-primary",
                    !done && !live && "border-border bg-surface-2 text-muted-foreground/60",
                  )}>
                    {done ? <Check className="h-2.5 w-2.5" /> : live ? <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> : null}
                  </span>
                  <span className={cn(
                    "tabular-nums",
                    done && "text-muted-foreground",
                    live && "text-foreground",
                    !done && !live && "text-muted-foreground/50",
                  )}>
                    [{String(i + 1).padStart(2, "0")}] {label}
                    {live && <span className="text-primary animate-pulse">…</span>}
                    {done && <span className="text-success"> ok</span>}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary transition-[width] duration-100 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[10.5px] font-mono text-muted-foreground">
              <span>nova_os://provisioning</span>
              <span className="tabular-nums">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-[11px] text-muted-foreground">
          Personalizing your dashboard from your onboarding answers…
        </div>
      </div>
    </div>
  );
}
