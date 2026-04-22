import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Sparkles, ArrowRight, Rocket, Zap, KanbanSquare, Inbox, Workflow,
  UserCheck, BarChart3, Settings as SettingsIcon, CreditCard, FileText,
  History, Lightbulb, Target, Mail, Megaphone, ScrollText, Globe,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toolRunsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  group: "Action" | "Tool" | "Page" | "Recent";
  label: string;
  hint?: string;
  to: string;
  // Optional contextual prefill via query string (?context= / ?title=)
  search?: Record<string, string>;
  icon: React.ComponentType<{ className?: string }>;
  match: RegExp;
};

const ITEMS: Item[] = [
  // Tools
  { id: "t-validate", group: "Tool", label: "Idea Validator", hint: "Pressure-test an idea", to: "/app/launchpad/$tool", icon: Lightbulb, match: /validat|idea|test/i },
  { id: "t-pitch",    group: "Tool", label: "Pitch Generator", hint: "Investor-ready pitch", to: "/app/launchpad/$tool", icon: ScrollText, match: /pitch|deck|investor/i },
  { id: "t-gtm",      group: "Tool", label: "GTM Strategy", hint: "Channels, ICP, messaging", to: "/app/launchpad/$tool", icon: Target, match: /gtm|go-?to-?market|strategy|channel/i },
  { id: "t-offer",    group: "Tool", label: "Offer Builder", hint: "Irresistible offer + risk reversal", to: "/app/launchpad/$tool", icon: Megaphone, match: /offer|pricing|package/i },
  { id: "t-ops",      group: "Tool", label: "Ops Plan", hint: "Workflows, automations, KPIs", to: "/app/launchpad/$tool", icon: Workflow, match: /ops|operations|plan|workflow/i },
  { id: "t-followup", group: "Tool", label: "Follow-Up Sequence", hint: "Multi-touch follow-ups", to: "/app/launchpad/$tool", icon: Mail, match: /follow|sequence|email/i },
  { id: "t-audit",    group: "Tool", label: "Website Auditor", hint: "Live site audit", to: "/app/launchpad/$tool", icon: Globe, match: /website|audit|seo/i },
  { id: "t-first10",  group: "Tool", label: "First 10 Customers", hint: "Tactical acquisition roadmap", to: "/app/launchpad/$tool", icon: Rocket, match: /first|10|customers|acquisition/i },

  // Pages — Nova
  { id: "p-pipeline", group: "Page", label: "Pipeline (CRM)", to: "/app/nova/crm", icon: KanbanSquare, match: /pipeline|crm|deals|kanban/i },
  { id: "p-leads",    group: "Page", label: "Lead Capture", to: "/app/nova/leads", icon: Inbox, match: /lead|capture|inbound/i },
  { id: "p-flows",    group: "Page", label: "Automation Workflows", to: "/app/nova/workflows", icon: Workflow, match: /automation|workflow|trigger/i },
  { id: "p-onboard",  group: "Page", label: "Client Onboarding", to: "/app/nova/clients", icon: UserCheck, match: /onboard|client|kickoff/i },
  { id: "p-reports",  group: "Page", label: "Reporting", to: "/app/nova/reports", icon: BarChart3, match: /report|analytics|metrics|kpi/i },

  // Pages — Account
  { id: "p-launchpad", group: "Page", label: "Launchpad", to: "/app/launchpad", icon: Rocket, match: /launchpad|tools/i },
  { id: "p-nova",      group: "Page", label: "Nova OS",   to: "/app/nova",      icon: Zap, match: /nova/i },
  { id: "p-history",   group: "Page", label: "Run history", to: "/app/launchpad/history", icon: History, match: /history|past|runs/i },
  { id: "p-assets",    group: "Page", label: "Assets",     to: "/app/assets",   icon: FileText, match: /asset|outputs|library/i },
  { id: "p-billing",   group: "Page", label: "Billing & plans", to: "/app/billing", icon: CreditCard, match: /billing|plan|upgrade|invoice/i },
  { id: "p-settings",  group: "Page", label: "Settings",  to: "/app/settings",  icon: SettingsIcon, match: /settings|account|integration/i },
];

// Maps natural-language tool hits to their Launchpad tool slug
const TOOL_SLUG: Record<string, string> = {
  "t-validate": "idea-validator",
  "t-pitch": "pitch-generator",
  "t-gtm": "gtm-strategy",
  "t-offer": "offer",
  "t-ops": "ops-plan",
  "t-followup": "followup",
  "t-audit": "website-audit",
  "t-first10": "first-10-customers",
};

export function AiOperator({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [q, setQ] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const navigate = useNavigate();
  const listRef = useRef<HTMLDivElement | null>(null);

  const { currentOrgId } = useAuth();
  const recentQ = useQuery({
    ...toolRunsQuery(currentOrgId ?? "", 5),
    enabled: !!currentOrgId && open,
  });

  // Build dynamic action items (tool-specific actions inferred from query)
  const dynamicActions = useMemo<Item[]>(() => {
    if (!q.trim()) return [];
    const lower = q.toLowerCase();
    // "validate <X>" or "for <X>" → prefill Idea Validator with context
    const validateMatch = lower.match(/validat(?:e|ion)?\s+(.+)/i)
      || lower.match(/^idea\s+for\s+(.+)/i)
      || lower.match(/^for\s+(.+)/i);
    if (validateMatch) {
      const ctx = validateMatch[1].trim();
      return [{
        id: "act-validate",
        group: "Action",
        label: `Validate idea: ${ctx}`,
        hint: "Opens Idea Validator with this context prefilled",
        to: "/app/launchpad/$tool",
        search: { context: ctx, title: ctx.slice(0, 60) },
        icon: Sparkles,
        match: /.*/,
      }];
    }
    return [];
  }, [q]);

  // Build "recent" items (only when no query)
  const recentItems = useMemo<Item[]>(() => {
    if (q.trim()) return [];
    const runs = recentQ.data ?? [];
    const seen = new Set<string>();
    return runs
      .filter((r) => {
        if (seen.has(r.tool_key)) return false;
        seen.add(r.tool_key);
        return true;
      })
      .slice(0, 4)
      .map((r) => {
        // Map server tool_key (e.g. validate-idea) back to a Launchpad slug
        const slugMap: Record<string, string> = {
          "validate-idea": "idea-validator",
          "generate-pitch": "pitch-generator",
          "generate-gtm-strategy": "gtm-strategy",
          "generate-offer": "offer",
          "generate-ops-plan": "ops-plan",
          "generate-followup-sequence": "followup",
          "analyze-website": "website-audit",
        };
        const slug = slugMap[r.tool_key] ?? r.tool_key;
        return {
          id: `recent-${r.id}`,
          group: "Recent" as const,
          label: r.tool_key.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          hint: new Date(r.created_at).toLocaleDateString(),
          to: "/app/launchpad/$tool",
          icon: History,
          match: /.*/,
        };
      })
      // attach slug into a side map for navigation below
      .map((it, i) => Object.assign(it, { _slug: TOOL_SLUG[it.id] ?? Object.values(TOOL_SLUG)[i % Object.values(TOOL_SLUG).length] })) as unknown as Item[];
  }, [q, recentQ.data]);

  // Filter base items
  const filtered = useMemo(() => {
    const term = q.trim();
    if (!term) return [...recentItems, ...ITEMS];
    return [...dynamicActions, ...ITEMS.filter((i) => i.match.test(term) || i.label.toLowerCase().includes(term.toLowerCase()))];
  }, [q, dynamicActions, recentItems]);

  // Group results in stable order
  const grouped = useMemo(() => {
    const order: Item["group"][] = ["Action", "Recent", "Tool", "Page"];
    const out: { group: Item["group"]; items: Item[] }[] = [];
    for (const g of order) {
      const items = filtered.filter((i) => i.group === g);
      if (items.length) out.push({ group: g, items });
    }
    return out;
  }, [filtered]);

  // Flat list for keyboard nav
  const flat = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  useEffect(() => { setActiveIdx(0); }, [q]);
  useEffect(() => { if (!open) { setQ(""); setActiveIdx(0); } }, [open]);

  const execute = (it: Item) => {
    onOpenChange(false);
    setQ("");
    if (it.to === "/app/launchpad/$tool") {
      const slug = TOOL_SLUG[it.id] ?? (it as unknown as { _slug?: string })._slug ?? "idea-validator";
      const search = it.search ?? {};
      navigate({ to: "/app/launchpad/$tool", params: { tool: slug }, search });
    } else {
      navigate({ to: it.to });
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = flat[activeIdx];
      if (it) execute(it);
    }
  };

  // Scroll active into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-active="true"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  let renderIdx = -1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden gap-0">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask the Operator… e.g. ‘validate a SaaS for dentists’"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">ESC</kbd>
        </div>

        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-1.5">
          {grouped.length === 0 ? (
            <div className="px-3 py-8 text-center text-[12.5px] text-muted-foreground">
              <p>No matches.</p>
              <p className="mt-1 text-[11.5px]">Try “build my GTM”, “show pipeline”, or “validate a SaaS for dentists”.</p>
            </div>
          ) : (
            grouped.map(({ group, items }) => (
              <div key={group} className="mb-1">
                <div className="px-2 py-1.5 text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground/70">
                  {group}
                </div>
                {items.map((it) => {
                  renderIdx++;
                  const active = renderIdx === activeIdx;
                  const Icon = it.icon;
                  return (
                    <button
                      key={it.id}
                      data-active={active}
                      onMouseEnter={() => setActiveIdx(renderIdx)}
                      onClick={() => execute(it)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] transition",
                        active ? "bg-surface-2 text-foreground" : "text-foreground/85 hover:bg-surface-2/60",
                      )}
                    >
                      <span className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                        active ? "bg-primary/15 text-primary" : "bg-surface-2 text-muted-foreground",
                      )}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{it.label}</span>
                        {it.hint && (
                          <span className="block truncate text-[11px] text-muted-foreground">{it.hint}</span>
                        )}
                      </span>
                      <ArrowRight className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-opacity",
                        active ? "opacity-100 text-primary" : "opacity-0",
                      )} />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-surface-2/40 px-4 py-2 text-[10.5px] text-muted-foreground">
          <span className="flex items-center gap-2">
            <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono">↑↓</kbd> navigate
            <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono">↵</kbd> open
          </span>
          <span>Operator routes you to the right module — and prefills context.</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
