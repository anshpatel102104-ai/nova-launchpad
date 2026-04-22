import { createFileRoute, Link } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthShell, Field } from "./auth.sign-in";

export const Route = createFileRoute("/auth/forgot-password")({
  component: Forgot,
});

function Forgot() {
  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a recovery link.">
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); }}>
        <Field label="Email"><Input type="email" placeholder="you@company.com" /></Field>
        <Button className="w-full" type="submit">Send reset link</Button>
      </form>
      <p className="mt-4 text-xs text-muted-foreground">
        Remembered it? <Link to="/auth/sign-in" className="text-foreground hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}
