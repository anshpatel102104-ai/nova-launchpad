import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/dashboard" });
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
            Welcome back.
          </div>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Sign in to your operating system.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">© Launchpad Nova</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Use your work email and password.</p>

          <form className="mt-6 space-y-3" onSubmit={onSubmit}>
            <label className="block">
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">Email</div>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="block">
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">Password</div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <Link to="/forgot-password" className="hover:text-foreground">
              Forgot password?
            </Link>
            <Link to="/signup" search={{ plan: undefined }} className="hover:text-foreground">
              Create account →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
