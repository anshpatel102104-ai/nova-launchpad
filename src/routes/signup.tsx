import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Check, Zap, Rocket, Building2, BarChart3, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type PlanKey = "starter" | "launch" | "operate" | "scale";

const PLANS: {
  key: PlanKey;
  label: string;
  price: string;
  tagline: string;
  icon: React.ElementType;
  color: string;
  glow: string;
}[] = [
  { key: "starter", label: "Starter", price: "$0", tagline: "Free to begin", icon: Sparkles, color: "text-muted-foreground", glow: "" },
  { key: "launch", label: "Launch", price: "$49", tagline: "Validate + launch", icon: Rocket, color: "text-primary", glow: "shadow-glow-primary" },
  { key: "operate", label: "Operate", price: "$149", tagline: "Run the business", icon: Zap, color: "text-accent", glow: "shadow-glow-secondary" },
  { key: "scale", label: "Scale", price: "$299", tagline: "Full Nova OS", icon: BarChart3, color: "text-cyan", glow: "shadow-glow-cyan" },
];

function normalizePlan(p?: string): PlanKey {
  const v = (p || "starter").toLowerCase();
  return (PLANS.find((x) => x.key === v)?.key) ?? "starter";
}

export const Route = createFileRoute("/signup")({
  validateSearch: (s: Record<string, unknown>) => ({ plan: typeof s.plan === "string" ? s.plan : undefined }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/signup" });
  const [plan, setPlan] = useState<PlanKey>(normalizePlan(search.plan));
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = "Full name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email";
    if (password.length < 8) e.password = "Min 8 characters";
    if (password !== confirm) e.confirm = "Passwords don't match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { full_name: fullName },
        },
      });
      if (signUpErr) throw signUpErr;

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id ?? signUpData.user?.id;

      if (session && userId) {
        const orgName = `${fullName.trim()}'s Business`;
        const { data: org, error: orgErr } = await supabase
          .from("organizations")
          .insert({ owner_id: userId, name: orgName })
          .select("id")
          .single();
        if (orgErr) throw orgErr;

        await supabase.from("organization_members").insert({
          organization_id: org.id,
          user_id: userId,
          role: "owner",
        });

        await supabase.from("subscriptions").insert({
          organization_id: org.id,
          plan,
          status: "trialing",
        });

        toast.success("Account created");
        navigate({ to: "/onboarding" });
      } else {
        toast.success("Check your email to confirm your account");
        navigate({ to: "/login" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = PLANS.find((p) => p.key === plan)!;

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.15fr_1fr] bg-background relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute -top-48 -left-32 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[140px] orb-float" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-[500px] w-[500px] rounded-full bg-accent/8 blur-[140px] orb-float-2" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-cyan/5 blur-[120px]" />

      {/* ── Left panel ── */}
      <div className="relative hidden lg:flex flex-col justify-between border-r border-border p-12 bg-grid-faint overflow-hidden">
        {/* Logo */}
        <div className="flex items-center gap-3 rise-in" style={{ "--i": 0 } as React.CSSProperties}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-white font-display font-bold text-sm shadow-glow">
            LN
          </div>
          <span className="font-display text-[15px] font-semibold tracking-tight">LaunchpadNOVA</span>
        </div>

        {/* Hero copy */}
        <div className="max-w-lg space-y-6">
          <div className="rise-in" style={{ "--i": 1 } as React.CSSProperties}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/8 text-xs text-primary font-medium mb-5">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-primary" /></span>
              Now in early access
            </div>
            <h2 className="font-display text-[clamp(2.4rem,3.8vw,3.5rem)] font-bold leading-[1.04] tracking-tight">
              <span className="text-brand-cycle">Build.</span><br />
              <span className="text-brand-cycle" style={{ animationDelay: "0.4s" }}>Launch.</span><br />
              <span className="text-brand-cycle" style={{ animationDelay: "0.8s" }}>Operate.</span>
            </h2>
          </div>

          <p className="rise-in text-[15px] leading-relaxed text-muted-foreground max-w-md" style={{ "--i": 2 } as React.CSSProperties}>
            The AI operating system for founders — go from first idea to a running business without stitching ten tools together.
          </p>

          {/* Social proof stats */}
          <div className="rise-in flex items-center gap-8" style={{ "--i": 3 } as React.CSSProperties}>
            {[
              { n: "10+", label: "AI tools" },
              { n: "6", label: "OS modules" },
              { n: "1", label: "Source of truth" },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-display text-2xl font-bold text-gradient-brand leading-none">{s.n}</div>
                <div className="mt-1 text-[10.5px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="rise-in glass-card rounded-xl p-4 max-w-sm" style={{ "--i": 4 } as React.CSSProperties}>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              "Nova replaced six tools in one afternoon. My entire ops stack, unified."
            </p>
            <div className="mt-3 flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-gradient-primary flex items-center justify-center text-white text-[10px] font-bold">JK</div>
              <div>
                <div className="text-[11.5px] font-medium">Jordan K.</div>
                <div className="text-[10px] text-muted-foreground">Founder, Meridian</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-muted-foreground rise-in" style={{ "--i": 5 } as React.CSSProperties}>
          © LaunchpadNOVA · Built for founders
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="relative flex items-center justify-center p-6 sm:p-10 page-in">
        <div className="w-full max-w-[430px]">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-white font-bold text-xs shadow-glow">LN</div>
            <span className="font-display text-[14px] font-semibold">LaunchpadNOVA</span>
          </div>

          <div className="mb-7">
            <h1 className="font-display text-[28px] font-bold tracking-tight">
              Create your account
            </h1>
            <p className="mt-1.5 text-[13.5px] text-muted-foreground">
              Pick a plan — upgrade or downgrade anytime.
            </p>
          </div>

          {/* Plan picker */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {PLANS.map((p, i) => {
              const Icon = p.icon;
              const active = plan === p.key;
              return (
                <button
                  type="button"
                  key={p.key}
                  onClick={() => setPlan(p.key)}
                  style={{ "--i": i } as React.CSSProperties}
                  className={cn(
                    "rise-in relative rounded-xl border p-3.5 text-left transition-all duration-200",
                    active
                      ? "border-primary/50 bg-primary/8 shadow-glow"
                      : "border-border bg-surface hover:border-primary/25 hover:bg-surface-2"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={cn("h-4 w-4", active ? p.color : "text-muted-foreground")} />
                    {active && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </span>
                    )}
                  </div>
                  <div className={cn("text-[13px] font-semibold", active ? "text-foreground" : "text-foreground/80")}>{p.label}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    <span className={cn("font-medium", active && p.color)}>{p.price}</span>
                    <span className="mx-1 opacity-40">·</span>
                    {p.tagline}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Form */}
          <form className="space-y-3.5" onSubmit={onSubmit}>
            <Field label="Full name" error={errors.fullName}>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Founder"
                className="terminal-input h-11 w-full px-3"
              />
            </Field>
            <Field label="Work email" error={errors.email}>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="terminal-input h-11 w-full px-3"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Password" error={errors.password}>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars"
                  className="terminal-input h-11 w-full px-3"
                />
              </Field>
              <Field label="Confirm password" error={errors.confirm}>
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  className="terminal-input h-11 w-full px-3"
                />
              </Field>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-execute w-full h-11 rounded-lg flex items-center justify-center gap-2 text-[14px] font-semibold mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Creating account…
                </span>
              ) : (
                <>
                  Start with {selectedPlan.label}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 flex items-center gap-3 text-[11.5px] text-muted-foreground">
            <span>Already have an account?</span>
            <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Sign in
            </Link>
          </div>

          <p className="mt-3 text-[10.5px] text-muted-foreground/60">
            By signing up you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[11.5px] font-medium text-muted-foreground uppercase tracking-wider">{label}</div>
      {children}
      {error && <div className="mt-1 text-[11px] text-destructive">{error}</div>}
    </label>
  );
}
