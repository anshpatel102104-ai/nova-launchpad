import { createFileRoute, Link } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthShell, Field } from "./auth.sign-in";

export const Route = createFileRoute("/auth/sign-up")({
  component: SignUp,
});

function SignUp() {
  return (
    <AuthShell title="Create your account" subtitle="Free Starter plan. Upgrade anytime.">
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); window.location.href = "/onboarding"; }}>
        <Field label="Full name"><Input placeholder="Alex Morgan" /></Field>
        <Field label="Work email"><Input type="email" placeholder="you@company.com" /></Field>
        <Field label="Password"><Input type="password" placeholder="At least 8 characters" /></Field>
        <Button className="w-full" type="submit">Create account</Button>
      </form>
      <p className="mt-4 text-xs text-muted-foreground">
        Already have one? <Link to="/auth/sign-in" className="text-foreground hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}
