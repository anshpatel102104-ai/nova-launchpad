import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, Rocket, Cpu, Inbox, FolderOpen, ArrowRight, Zap } from "lucide-react";
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
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-[380px] w-[380px] rounded-full bg-launchpad/15 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)", backgroundSize: "48px 48px" }} aria-hidden />

      {/* nav */}
      <header className="relative z-10 flex h-16 items-center justify-between px-6 md:px-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary glow-primary">
            <Sparkles className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-sm font-semibold tracking-tight">Nova OPS</div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">AI Business OS</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" search={{ redirect: undefined }}>
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link to="/signup" search={{ plan: undefined }}>
            <Button size="sm" className="btn-execute gap-1.5">Get started <ArrowRight className="h-3.5 w-3.5" /></Button>
          </Link>
        </div>
      </header>

      {/* hero */}
      <main className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pb-20 pt-16 text-center md:pt-24">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Mission Control for Solo Founders
        </span>

        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight md:text-6xl">
          Run your business like a <span className="text-gradient">mission control</span>.
        </h1>
        <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
          Experience Nova OPS before you commit. AI specialists, lead pipelines, and automation modules — all in one tactical command center.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button onClick={startDemo} size="lg" className="btn-execute gap-2 px-8 text-sm">
            <Zap className="h-4 w-4" /> TRY DEMO — No account needed
          </Button>
          <Link to="/signup" search={{ plan: undefined }}>
            <Button size="lg" variant="outline" className="gap-2 px-8 text-sm">
              <Sparkles className="h-4 w-4" /> Sign Up Free
            </Button>
          </Link>
        </div>

        <div className="mt-3 font-display text-[10px] tracking-[0.18em] text-muted-foreground">
          NO CREDIT CARD · INSTANT ACCESS · CANCEL ANYTIME
        </div>

        {/* preview tiles */}
        <div className="mt-16 grid w-full max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Rocket, label: "Launchpad", desc: "10 AI tools" },
            { icon: Cpu, label: "Nova OS", desc: "6 automations" },
            { icon: Inbox, label: "Leads", desc: "Pipeline tracker" },
            { icon: FolderOpen, label: "Vault", desc: "Generated assets" },
          ].map((t) => (
            <div key={t.label} className="tactical-card scanlines relative overflow-hidden rounded-xl border border-border bg-card/60 p-4 text-left">
              <div className="relative z-[2]">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                  <t.icon className="h-4.5 w-4.5" />
                </div>
                <div className="mt-3 font-display text-sm font-semibold">{t.label}</div>
                <div className="text-[11px] text-muted-foreground">{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
