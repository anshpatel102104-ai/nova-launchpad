import { Link } from "@tanstack/react-router";
import { Search, Bell, Command, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { currentCompany, currentUser } from "@/lib/mock";
import { useState } from "react";
import { AiOperator } from "./AiOperator";
import { cn } from "@/lib/utils";

export function AppTopbar() {
  const [openOperator, setOpenOperator] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
      <button className="hidden md:flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs hover:bg-accent">
        <span className="font-medium">{currentCompany.name}</span>
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="rounded-sm bg-muted px-1.5 py-0.5 font-medium text-foreground">Stage: {currentCompany.stage}</span>
        <span>·</span>
        <span>Next: build GTM</span>
      </div>

      <button
        onClick={() => setOpenOperator(true)}
        className="ml-auto flex w-full max-w-md items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 truncate">Search or ask the AI Operator…</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium">
          <Command className="h-3 w-3" /> K
        </kbd>
      </button>

      <PlanBadge plan={currentCompany.plan} />

      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-4 w-4" />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-launchpad" />
      </Button>

      <Link to="/app/settings" className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
        {currentUser.initials}
      </Link>

      <AiOperator open={openOperator} onOpenChange={setOpenOperator} />
    </header>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const cls =
    plan === "Starter" ? "bg-muted text-foreground" :
    plan === "Launch" ? "bg-launchpad/10 text-launchpad border-launchpad/20" :
    plan === "Operate" ? "bg-nova/10 text-nova border-nova/20" :
    "bg-foreground/10 text-foreground";
  return (
    <Link to="/app/billing" className={cn("hidden md:inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide", cls)}>
      {plan}
    </Link>
  );
}
