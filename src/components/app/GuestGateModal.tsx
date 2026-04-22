import { useNavigate } from "@tanstack/react-router";
import { useGuest } from "@/lib/guest";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, X } from "lucide-react";

export function GuestGateModal() {
  const { gateOpen, gateReason, closeGate } = useGuest();
  const navigate = useNavigate();

  return (
    <Dialog open={gateOpen} onOpenChange={(o) => !o && closeGate()}>
      <DialogContent className="overflow-hidden border-primary/40 bg-card p-0 sm:max-w-md">
        {/* Glow backdrop */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-launchpad/15" aria-hidden />
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/30 blur-3xl" aria-hidden />

        <button
          onClick={closeGate}
          className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative z-[2] p-7 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/40 bg-primary/15 text-primary glow-primary">
            <Lock className="h-6 w-6" />
          </div>

          <div className="mission-title mt-5 text-[10px] !text-warning">ACCESS RESTRICTED</div>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">UNLOCK FULL ACCESS</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {gateReason ?? "You're in demo mode. Create your free Nova OPS account to unlock this mission."}
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <Button
              onClick={() => { closeGate(); navigate({ to: "/signup", search: { plan: undefined } }); }}
              className="btn-execute w-full gap-2"
            >
              <Sparkles className="h-4 w-4" /> Sign Up Free
            </Button>
            <Button
              variant="ghost"
              onClick={closeGate}
              className="w-full text-muted-foreground hover:text-foreground"
            >
              Continue Exploring
            </Button>
          </div>

          <div className="mt-5 font-display text-[10px] tracking-[0.18em] text-muted-foreground">
            DEMO MODE · NO ACCOUNT NEEDED
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
