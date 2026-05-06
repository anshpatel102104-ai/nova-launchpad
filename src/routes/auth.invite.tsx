import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth/invite")({
  component: InvitePage,
});

function InvitePage() {
  const navigate = useNavigate();
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-primary mb-2">Invitation</p>
      <h1 className="text-2xl font-semibold tracking-tight">Join your team on Nova OPS</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Set up your account to accept the invite.</p>

      <form
        className="mt-7 space-y-4"
        onSubmit={(e) => { e.preventDefault(); navigate({ to: "/app/dashboard" }); }}
      >
        <div className="space-y-1.5"><Label>Full name</Label><Input required /></div>
        <div className="space-y-1.5"><Label>Password</Label><Input type="password" required /></div>
        <Button type="submit" className="w-full">Accept invite</Button>
      </form>
      {/* TODO: validate invite token via Supabase */}
    </div>
  );
}
