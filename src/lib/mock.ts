// Static catalog for Launchpad tools and Nova OS modules (UI metadata only).
// Dynamic data (runs, outputs, usage, leads) lives in Supabase.

export type Stage = "Idea" | "Validate" | "Launch" | "Operate" | "Scale";
export type Plan = "Starter" | "Launch" | "Operate" | "Scale";

export const STAGES: Stage[] = ["Idea", "Validate", "Launch", "Operate", "Scale"];

export type LaunchpadTool = {
  key: string;
  toolKey: string;
  name: string;
  desc: string;
  wired: boolean;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  xp: number;
  requiredPlan?: "Scale";
};

export const launchpadCatalog: LaunchpadTool[] = [
  // 7 wired (have live edge functions)
  { key: "idea-validator",    toolKey: "validate-idea",              name: "Business Idea Validator",  desc: "Pressure-test your idea against market signal.",  wired: true, difficulty: "Beginner",     xp: 50 },
  { key: "pitch-generator",   toolKey: "generate-pitch",             name: "Pitch Generator",          desc: "Investor-ready pitch in minutes.",                wired: true, difficulty: "Intermediate", xp: 75 },
  { key: "gtm-strategy",      toolKey: "generate-gtm-strategy",      name: "GTM Strategy",             desc: "Channel plan, ICP, and messaging map.",           wired: true, difficulty: "Advanced",     xp: 100 },
  { key: "offer",             toolKey: "generate-offer",             name: "Offer Builder",            desc: "Irresistible offer with risk reversal.",          wired: true, difficulty: "Intermediate", xp: 75 },
  { key: "ops-plan",          toolKey: "generate-ops-plan",          name: "Ops Plan",                 desc: "Workflows, automations, KPIs.",                   wired: true, difficulty: "Advanced",     xp: 100 },
  { key: "followup",          toolKey: "generate-followup-sequence", name: "Follow-Up Sequence",       desc: "Multi-touch follow-ups that convert.",            wired: true, difficulty: "Beginner",     xp: 50 },
  { key: "website-audit",     toolKey: "analyze-website",            name: "Website Auditor",          desc: "AI audit of your live site.",                     wired: true, difficulty: "Intermediate", xp: 75 },
  // Coming soon — visible in catalog, gracefully gated until edge functions ship
  { key: "kill-my-idea",      toolKey: "kill-my-idea",               name: "Kill My Idea",             desc: "Stress-test your idea against the harshest objections.", wired: true, difficulty: "Intermediate", xp: 75 },
  { key: "funding-score",     toolKey: "",                            name: "Funding Score",            desc: "Score how investable your idea is right now.",    wired: false, difficulty: "Advanced",     xp: 100 },
  { key: "first-10-customers",toolKey: "",                            name: "First 10 Customers",       desc: "Tactical roadmap to your first 10 paying customers.", wired: false, difficulty: "Intermediate", xp: 75 },
  { key: "business-plan",     toolKey: "",                            name: "Business Plan",            desc: "Document-style operating plan ready to share.",   wired: false, difficulty: "Advanced",     xp: 100 },
  { key: "investor-emails",   toolKey: "",                            name: "Investor Emails",          desc: "Cold investor outreach that gets replies.",       wired: false, difficulty: "Intermediate", xp: 75 },
  { key: "idea-vs-idea",      toolKey: "",                            name: "Idea vs Idea",             desc: "Side-by-side comparison of two business ideas.",  wired: false, difficulty: "Beginner",     xp: 50 },
  { key: "landing-page",      toolKey: "",                            name: "Landing Page",             desc: "Generate hero, benefits, CTA, and offer copy.",   wired: false, difficulty: "Intermediate", xp: 75 },
  { key: "competitor",        toolKey: "",                            name: "Competitor Analyzer",      desc: "Map rivals, gaps, and angles to win.",            wired: false, difficulty: "Advanced",    xp: 120, requiredPlan: "Scale" },
  { key: "pricing",           toolKey: "",                            name: "Pricing Strategy Builder", desc: "Tiered pricing with anchor + value math.",        wired: false, difficulty: "Advanced",    xp: 120, requiredPlan: "Scale" },
  { key: "revenue-projector", toolKey: "",                            name: "Revenue Projector",        desc: "Forecast MRR, CAC, LTV with scenarios.",          wired: false, difficulty: "Advanced",    xp: 150, requiredPlan: "Scale" },
];

export type NovaModule = {
  key: string;
  name: string;
  desc: string;
};

export const novaSystemsCatalog: NovaModule[] = [
  { key: "lead-capture",  name: "Lead Capture System",       desc: "Capture, score, and route inbound leads automatically." },
  { key: "followup",      name: "Follow-Up Automator",       desc: "Multi-channel sequences that never let a lead go cold." },
  { key: "onboarding",    name: "Client Onboarding Flow",    desc: "Kickoff forms, contracts, welcome packets — automated." },
  { key: "invoice",       name: "Invoice + Payment Tracker", desc: "Track invoices, send reminders, log payments." },
  { key: "reputation",    name: "Reputation Manager",        desc: "Request reviews after wins, route negatives privately." },
  { key: "reporting",     name: "Reporting Dashboard",       desc: "Weekly executive summary across all systems." },
];

export type Lead = {
  id: string;
  name: string;
  company: string;
  email: string;
  source: string;
  stage: "New" | "Contacted" | "Qualified" | "Proposal" | "Won" | "Lost";
  value: number;
  lastTouch: string;
};
