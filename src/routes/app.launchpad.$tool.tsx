import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { launchpadTools } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Sparkles, ArrowRight, Loader2, Save, Download, Copy, Send, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/launchpad/$tool")({
  loader: ({ params }) => {
    const tool = launchpadTools.find((t) => t.key === params.tool);
    if (!tool) throw notFound();
    return { tool };
  },
  component: ToolPage,
  notFoundComponent: () => (
    <div className="p-6">
      <div className="text-sm">Unknown tool. <Link to="/app/launchpad" className="underline">Back to Launchpad</Link></div>
    </div>
  ),
});

type Section = { title: string; bullets: string[] };
type Output = { headline: string; sections: Section[] };

const SAMPLE_OUTPUT: Record<string, Output> = {
  "idea-validator": {
    headline: "Strong signal. Sharpen the wedge.",
    sections: [
      { title: "Market signal", bullets: ["TAM ~$4.2B in sales enablement", "AI-native incumbents are <2yr old", "Sales-led ICPs are paying for outcomes, not seats"] },
      { title: "Risks", bullets: ["Crowded with copy-paste tools", "Procurement cycles slow at Series A+", "AI commoditization risk"] },
      { title: "Recommended next steps", bullets: ["Run 10 founder interviews this week", "Generate Pitch and First 10 Customers list", "Build a 7-day landing page test"] },
    ],
  },
  "pitch-generator": {
    headline: "Series-A teaser, ready to send.",
    sections: [
      { title: "Hook", bullets: ["The first AI Sales OS purpose-built for founder-led sales."] },
      { title: "Problem", bullets: ["Founders waste 60% of their selling time on coordination, not closing."] },
      { title: "Solution", bullets: ["Playbooks that auto-execute follow-ups and book qualified demos in <90s."] },
      { title: "Traction", bullets: ["12 design partners · $14k MRR · 4.8/5 NPS"] },
    ],
  },
  "gtm-strategy": {
    headline: "Outbound + content split. 70/30.",
    sections: [
      { title: "ICP", bullets: ["Series A B2B SaaS, 10–50 employees, founder-led GTM"] },
      { title: "Channels", bullets: ["LinkedIn outbound (primary)", "Founder content on X/LinkedIn", "Partnerships with sales coaches"] },
      { title: "Messaging", bullets: ["Lead with outcomes, not features", "Anchor on <90s response time"] },
      { title: "90-day plan", bullets: ["Week 1–2: 100 outreach/wk", "Week 3–6: First 10 customers", "Week 7–12: Repeatable demo motion"] },
    ],
  },
};

const TEMPLATE_OUTPUT: Output = {
  headline: "Structured output ready.",
  sections: [
    { title: "Summary", bullets: ["This is a placeholder structured output. Wiring this tool to AI takes one prompt change."] },
    { title: "What you'd see here", bullets: ["Cards", "Bullet points", "Copyable blocks", "Export to PDF / Markdown"] },
  ],
};

function ToolPage() {
  const { tool } = Route.useLoaderData();
  const [tab, setTab] = useState<"new" | "history" | "saved">("new");
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<Output | null>(null);
  const [input, setInput] = useState("");
  const [saved, setSaved] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setOutput(null);
    setSaved(false);
    setTimeout(() => {
      setOutput(SAMPLE_OUTPUT[tool.key] ?? TEMPLATE_OUTPUT);
      setGenerating(false);
    }, 900);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Launchpad"
        title={tool.name}
        description={tool.desc}
        actions={
          <Link to="/app/launchpad" className="text-sm text-muted-foreground hover:text-foreground">← Back to Launchpad</Link>
        }
      />

      <div className="flex items-center gap-1 border-b border-border">
        {(["new", "history", "saved"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-3 py-2 text-sm capitalize border-b-2 -mb-px",
              tab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "new" && (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Input */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Input</div>
            <div className="mt-3 space-y-3">
              <div>
                <div className="mb-1.5 text-xs font-medium">Title</div>
                <Input placeholder={`e.g. ${tool.name} for sales enablement`} />
              </div>
              <div>
                <div className="mb-1.5 text-xs font-medium">Context</div>
                <Textarea
                  rows={6}
                  placeholder="Describe your idea, audience, and goal. The more specific, the sharper the output."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </div>
              <Button onClick={handleGenerate} disabled={generating} className="w-full">
                {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="h-4 w-4" /> Generate</>}
              </Button>
              {!tool.wired && (
                <p className="text-[11px] text-muted-foreground">
                  Preview output. Wire this tool to AI by extending the shared handler.
                </p>
              )}
            </div>
          </div>

          {/* Output */}
          <div className="rounded-xl border border-border bg-card p-5 min-h-[280px]">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Output</div>
              {output && (
                <div className="flex items-center gap-1">
                  <IconBtn label="Copy"><Copy className="h-3.5 w-3.5" /></IconBtn>
                  <IconBtn label="Export"><Download className="h-3.5 w-3.5" /></IconBtn>
                  <IconBtn label={saved ? "Saved" : "Save"} onClick={() => setSaved(true)}>
                    {saved ? <Check className="h-3.5 w-3.5 text-success" /> : <Save className="h-3.5 w-3.5" />}
                  </IconBtn>
                </div>
              )}
            </div>

            {generating && (
              <div className="mt-4 space-y-2 animate-pulse">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-5/6 rounded bg-muted" />
                <div className="h-3 w-2/3 rounded bg-muted" />
              </div>
            )}

            {!generating && !output && (
              <div className="mt-10 text-center text-sm text-muted-foreground">
                Your structured output will appear here.
              </div>
            )}

            {output && (
              <div className="mt-4 space-y-4">
                <h2 className="text-base font-semibold">{output.headline}</h2>
                {output.sections.map((s) => (
                  <div key={s.title}>
                    <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{s.title}</div>
                    <ul className="mt-1.5 space-y-1 text-sm">
                      {s.bullets.map((b) => (
                        <li key={b} className="flex gap-2">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {/* Cross-workspace handoff */}
                <div className="mt-4 rounded-md border border-dashed border-nova/30 bg-nova/5 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs">
                      <div className="font-medium text-foreground">Send to Nova</div>
                      <div className="text-muted-foreground">
                        {tool.key === "first-10-customers" && "Import as leads into your CRM."}
                        {tool.key === "landing-page" && "Connect this page to Lead Capture."}
                        {tool.key !== "first-10-customers" && tool.key !== "landing-page" && "Move this insight into your operating workflows."}
                      </div>
                    </div>
                    <Link to="/app/nova" className="inline-flex items-center gap-1 rounded-md bg-nova/10 px-2.5 py-1.5 text-xs font-medium text-nova hover:bg-nova/15">
                      <Send className="h-3 w-3" /> Send <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "history" && <HistoryList toolName={tool.name} />}
      {tab === "saved" && (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No saved outputs yet. Generate something, then hit Save to keep it here.
        </div>
      )}
    </div>
  );
}

function IconBtn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} title={label} className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
      {children}
    </button>
  );
}

function HistoryList({ toolName }: { toolName: string }) {
  const items = [
    { title: `${toolName} — v3`, when: "2h ago" },
    { title: `${toolName} — v2`, when: "Yesterday" },
    { title: `${toolName} — v1`, when: "3d ago" },
  ];
  return (
    <div className="rounded-xl border border-border bg-card divide-y divide-border">
      {items.map((it) => (
        <div key={it.title} className="flex items-center justify-between px-4 py-3 text-sm">
          <div>
            <div className="font-medium">{it.title}</div>
            <div className="text-xs text-muted-foreground">{it.when}</div>
          </div>
          <button className="text-xs text-muted-foreground hover:text-foreground">Open</button>
        </div>
      ))}
    </div>
  );
}
