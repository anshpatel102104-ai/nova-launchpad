import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type PlanKey = "starter" | "launch" | "operate" | "scale";
const PLANS: { key: PlanKey; label: string; price: string; tagline: string }[] = [
  { key: "starter", label: "Starter", price: "$0", tagline: "Free to begin" },
  { key: "launch", label: "Launch", price: "$49", tagline: "Validate + launch" },
  { key: "operate", label: "Operate", price: "$149", tagline: "Run the business" },
  { key: "scale", label: "Scale", price: "$299", tagline: "Full Nova OS" },
];

function normalizePlan(p?: string): PlanKey {
  const v = (p || "starter").toLowerCase();
  return PLANS.find((x) => x.key === v)?.key ?? "starter";
}

export const Route = createFileRoute("/signup")({
  validateSearch: (s: Record<string, unknown>) => ({
    plan: typeof s.plan === "string" ? s.plan : undefined,
  }),
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

      // If session exists immediately (auto-confirm), provision workspace.
      const {
        data: { session },
      } = await supabase.auth.getSession();
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

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between border-r border-border bg-muted/30 p-10">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-display text-sm font-semibold">Launchpad Nova</span>
        </div>
        <div>
          <div className="text-3xl font-display font-semibold tracking-tight max-w-md">
            Build. Launch. Operate.
          </div>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            One operating system for the full founder journey.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">© Launchpad Nova</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <h1 className="text-xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a plan — upgrade or downgrade anytime.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2">
            {PLANS.map((p) => (
              <button
                type="button"
                key={p.key}
                onClick={() => setPlan(p.key)}
                className={cn(
                  "rounded-md border p-3 text-left transition",
                  plan === p.key ? "border-primary bg-primary/5" : "border-border hover:bg-accent",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{p.label}</div>
                  {plan === p.key && <Check className="h-4 w-4 text-primary" />}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {p.price} · {p.tagline}
                </div>
              </button>
            ))}
          </div>

          <form className="mt-5 space-y-3" onSubmit={onSubmit}>
            <Field label="Full name" error={errors.fullName}>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
              />
            </Field>
            <Field label="Work email" error={errors.email}>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </Field>
            <Field label="Password" error={errors.password}>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Field label="Confirm password" error={errors.confirm}>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </Field>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Creating account…"
                : `Start with ${PLANS.find((p) => p.key === plan)?.label}`}
            </Button>
          </form>

          <p className="mt-4 text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-foreground hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</div>
      {children}
      {error && <div className="mt-1 text-xs text-destructive">{error}</div>}
    </label>
  );
}
