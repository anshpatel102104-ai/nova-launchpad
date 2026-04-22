import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, Rocket, Cpu, Inbox, FolderOpen, ArrowRight } from "lucide-react";
import { guestStore } from "@/lib/guest";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();

  // Authenticated users skip the landing entirely.
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled && session) navigate({ to: "/app/dashboard" });
    });
    return () => { cancelled = true; };
  }, [navigate]);

  const startDemo = () => {
    guestStore.enable();
    navigate({ to: "/app/dashboard" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Subtle ambient — no neon, no grid */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-60"
        style={{
          background:
            "radial-gradient(60rem 28rem at 50% -20%, color-mix(in oklab, var(--primary) 14%, transparent), transparent 70%)",
        }}
        aria-hidden
      />

      {/* nav */}
      <header className="relative z-10 mx-auto flex h-16 max-w-6xl items-center justify-between px-6 md:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-[15px] font-semibold tracking-tight">Nova OPS</div>
            <div className="text-[10.5px] tracking-wide text-muted-foreground">AI Business OS</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" search={{ redirect: undefined }}>
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link to="/signup" search={{ plan: undefined }}>
            <Button size="sm" className="gap-1.5">
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* hero */}
      <main className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 pb-24 pt-16 text-center md:pt-24">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          The AI operating system for business owners
        </span>

        <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight md:text-[3.25rem] md:leading-[1.05]">
          Run your entire business{" "}
          <span className="text-gradient">from one workspace.</span>
        </h1>
        <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-[17px]">
          Nova OPS combines AI tools, automations, and a lightweight CRM so founders
          can move from idea to revenue without juggling ten tabs.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button onClick={startDemo} size="lg" className="gap-2 px-7">
            Try the live demo
          </Button>
          <Link to="/signup" search={{ plan: undefined }}>
            <Button size="lg" variant="outline" className="gap-2 px-7">
              Sign up free
            </Button>
          </Link>
        </div>

        <div className="mt-3 text-[12px] text-muted-foreground">
          No credit card · Instant access · Cancel anytime
        </div>

        {/* preview tiles */}
        <div className="mt-16 grid w-full max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Rocket, label: "Launchpad", desc: "10 AI tools" },
            { icon: Cpu, label: "Nova OS", desc: "6 automations" },
            { icon: Inbox, label: "Leads", desc: "Pipeline tracker" },
            { icon: FolderOpen, label: "Assets", desc: "Generated outputs" },
          ].map((t) => (
            <div
              key={t.label}
              className="rounded-xl border border-border bg-card p-4 text-left shadow-soft transition hover:border-foreground/15 hover:shadow-elevated"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <t.icon className="h-4.5 w-4.5" />
              </div>
              <div className="mt-3 text-[14px] font-medium">{t.label}</div>
              <div className="text-[12px] text-muted-foreground">{t.desc}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
