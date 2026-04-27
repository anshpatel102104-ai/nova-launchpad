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
  { key: "idea-validator",     toolKey: "validate-idea",              name: "Business Idea Validator",   desc: "Pressure-test your idea against real market signal.",              wired: true, difficulty: "Beginner",     xp: 50  },
  { key: "pitch-generator",    toolKey: "generate-pitch",             name: "Pitch Generator",            desc: "Investor-ready pitch deck copy in minutes.",                      wired: true, difficulty: "Intermediate", xp: 75  },
  { key: "gtm-strategy",       toolKey: "generate-gtm-strategy",      name: "GTM Strategy",               desc: "Channel plan, ICP, and messaging map.",                           wired: true, difficulty: "Advanced",     xp: 100 },
  { key: "offer",              toolKey: "generate-offer",             name: "Offer Builder",              desc: "Irresistible offer with risk reversal built in.",                 wired: true, difficulty: "Intermediate", xp: 75  },
  { key: "ops-plan",           toolKey: "generate-ops-plan",          name: "Ops Plan",                   desc: "Workflows, automations, and KPIs for your team.",                 wired: true, difficulty: "Advanced",     xp: 100 },
  { key: "followup",           toolKey: "generate-followup-sequence", name: "Follow-Up Sequence",         desc: "Multi-touch follow-ups that convert cold leads.",                 wired: true, difficulty: "Beginner",     xp: 50  },
  { key: "website-audit",      toolKey: "analyze-website",            name: "Website Auditor",            desc: "AI conversion + UX + SEO audit of your live site.",               wired: true, difficulty: "Intermediate", xp: 75  },
  { key: "kill-my-idea",       toolKey: "kill-my-idea",               name: "Kill My Idea",               desc: "Brutally stress-test your idea against the harshest objections.",  wired: true, difficulty: "Intermediate", xp: 75  },
  { key: "funding-score",      toolKey: "funding-score",              name: "Funding Score",              desc: "Score how investable your startup is with a VC-lens breakdown.",  wired: true, difficulty: "Advanced",     xp: 100 },
  { key: "first-10-customers", toolKey: "first-10-customers",         name: "First 10 Customers",         desc: "Tactical week-by-week roadmap to your first 10 paying customers.", wired: true, difficulty: "Intermediate", xp: 75  },
  { key: "business-plan",      toolKey: "business-plan",              name: "Business Plan",              desc: "Investor-ready operating plan with milestones and financials.",    wired: true, difficulty: "Advanced",     xp: 100 },
  { key: "investor-emails",    toolKey: "investor-emails",            name: "Investor Emails",            desc: "Cold investor outreach sequences that actually get replies.",      wired: true, difficulty: "Intermediate", xp: 75  },
  { key: "idea-vs-idea",       toolKey: "idea-vs-idea",               name: "Idea vs Idea",               desc: "Side-by-side scoring of two startup ideas to find your winner.",  wired: true, difficulty: "Beginner",     xp: 50  },
  { key: "landing-page",       toolKey: "landing-page",               name: "Landing Page Copy",          desc: "Hero, problem, benefits, CTA — every word earns its place.",      wired: true, difficulty: "Intermediate", xp: 75  },
  { key: "competitor",         toolKey: "competitor-analysis",        name: "Competitor Analyzer",        desc: "Map rivals, identify gaps, and find your unfair angle to win.",   wired: true, difficulty: "Advanced",     xp: 120, requiredPlan: "Scale" },
  { key: "pricing",            toolKey: "pricing-strategy",           name: "Pricing Strategy",           desc: "Tiered pricing architecture with anchor logic and value math.",   wired: true, difficulty: "Advanced",     xp: 120, requiredPlan: "Scale" },
  { key: "revenue-projector",  toolKey: "revenue-projector",          name: "Revenue Projector",          desc: "12-month MRR forecast with CAC, LTV, and scenario modeling.",     wired: true, difficulty: "Advanced",     xp: 150, requiredPlan: "Scale" },
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
