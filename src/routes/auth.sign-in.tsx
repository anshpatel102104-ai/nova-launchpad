import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth/sign-in")({
  component: SignIn,
});

function SignIn() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your operating system.">
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); window.location.href = "/app/dashboard"; }}>
        <Field label="Email"><Input type="email" placeholder="you@company.com" defaultValue="alex@northwind.io" /></Field>
        <Field label="Password"><Input type="password" defaultValue="••••••••••" /></Field>
        <Button className="w-full" type="submit">Sign in</Button>
      </form>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <Link to="/auth/forgot-password" className="hover:text-foreground">Forgot password?</Link>
        <Link to="/auth/sign-up" className="hover:text-foreground">Create account →</Link>
      </div>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between border-r border-border bg-muted/30 p-10">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground"><Sparkles className="h-4 w-4" /></div>
          <span className="font-display text-sm font-semibold">LaunchpadNOVA</span>
        </div>
        <div>
          <div className="text-3xl font-display font-semibold tracking-tight max-w-md">Build. Launch. Operate.</div>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            One operating system for the full journey — from first idea to automated company. Launchpad handles the building. Nova handles the running.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
            <Stat n="10" l="AI tools" />
            <Stat n="6" l="Nova systems" />
            <Stat n="<90s" l="response time" />
          </div>
        </div>
        <div className="text-xs text-muted-foreground">© LaunchpadNOVA</div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-2.5">
      <div className="text-base font-semibold">{n}</div>
      <div className="text-[10px] text-muted-foreground">{l}</div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}
