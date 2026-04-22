import { createFileRoute, Link } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthShell, Field } from "./auth.sign-in";

export const Route = createFileRoute("/auth/reset-password")({
  component: Reset,
});

function Reset() {
  return (
    <AuthShell title="Set a new password" subtitle="Choose something you'll remember.">
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); window.location.href = "/auth/sign-in"; }}>
        <Field label="New password"><Input type="password" /></Field>
        <Field label="Confirm password"><Input type="password" /></Field>
        <Button className="w-full" type="submit">Update password</Button>
      </form>
      <p className="mt-4 text-xs text-muted-foreground">
        <Link to="/auth/sign-in" className="text-foreground hover:underline">Back to sign in</Link>
      </p>
    </AuthShell>
  );
}
