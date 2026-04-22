import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthShell, Field } from "./auth.sign-in";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/sign-up")({ component: SignUp });

function SignUp() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/app/dashboard`, data: { full_name: fullName } },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created");
    navigate({ to: "/onboarding" });
  };

  return (
    <AuthShell title="Create your account" subtitle="Free Starter plan. Upgrade anytime.">
      <form className="space-y-3" onSubmit={onSubmit}>
        <Field label="Full name"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} required /></Field>
        <Field label="Work email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
        <Field label="Password"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required /></Field>
        <Button className="w-full" type="submit" disabled={loading}>{loading ? "Creating…" : "Create account"}</Button>
      </form>
      <p className="mt-4 text-xs text-muted-foreground">Already have one? <Link to="/auth/sign-in" className="text-foreground hover:underline">Sign in</Link></p>
    </AuthShell>
  );
}
