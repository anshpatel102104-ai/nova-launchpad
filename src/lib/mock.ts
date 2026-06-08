// Static catalog for Launchpad tools and Nova OS modules (UI metadata only).
// Dynamic data (runs, outputs, usage, leads) lives in Supabase.

export type Stage = "Idea" | "Validate" | "Launch" | "Operate" | "Scale";
export type Plan = "Starter" | "Launch" | "Operate" | "Scale";

export const STAGES: Stage[] = ["Idea", "Validate", "Launch", "Operate", "Scale"];

export type LaunchpadTool = {
  // `key` drives client-side routing (/app/launchpad/$key) and HANDOFFS lookup.
  // `toolKey` drives backend execution (webhook path, tool_runs.tool_key).
  // Keep both in sync — a mismatch silently breaks handoffs and run history.
  key: string;
  toolKey: string;
  name: string;
  desc: string;
  wired: boolean;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  xp: number;
  requiredPlan?: Plan;
  handoffKey?: string; // matches the key used in the HANDOFFS map (src/lib/handoffs.ts)
};

export const launchpadCatalog: LaunchpadTool[] = [
  {
    key: "idea-validator",
    toolKey: "validate-idea",
    name: "Business Idea Validator",
    desc: "Pressure-test your idea against real market signal.",
    wired: true,
    difficulty: "Beginner",
    xp: 50,
    handoffKey: "idea-validator",
  },
  {
    key: "pitch-generator",
    toolKey: "generate-pitch",
    name: "Pitch Generator",
    desc: "Investor-ready pitch deck copy in minutes.",
    wired: true,
    difficulty: "Intermediate",
    xp: 75,
    handoffKey: "pitch-generator",
  },
  {
    key: "gtm-strategy",
    toolKey: "generate-gtm-strategy",
    name: "GTM Strategy",
    desc: "Channel plan, ICP, and messaging map.",
    wired: true,
    difficulty: "Advanced",
    xp: 100,
    handoffKey: "gtm-strategy",
  },
  {
    key: "offer",
    toolKey: "generate-offer",
    name: "Offer Builder",
    desc: "Irresistible offer with risk reversal built in.",
    wired: true,
    difficulty: "Intermediate",
    xp: 75,
    requiredPlan: "Launch",
    handoffKey: "offer",
  },
  {
    key: "ops-plan",
    toolKey: "generate-ops-plan",
    name: "Ops Plan",
    desc: "Workflows, automations, and KPIs for your team.",
    wired: true,
    difficulty: "Advanced",
    xp: 100,
    requiredPlan: "Operate",
    handoffKey: "ops-plan",
  },
  {
    key: "followup",
    toolKey: "generate-followup-sequence",
    name: "Follow-Up Sequence",
    desc: "Multi-touch follow-ups that convert cold leads.",
    wired: true,
    difficulty: "Beginner",
    xp: 50,
    requiredPlan: "Launch",
    handoffKey: "followup",
  },
  {
    key: "website-audit",
    toolKey: "analyze-website",
    name: "Website Auditor",
    desc: "AI conversion + UX + SEO audit of your live site.",
    wired: true,
    difficulty: "Intermediate",
    xp: 75,
    requiredPlan: "Operate",
    handoffKey: "website-audit",
  },
  {
    key: "kill-my-idea",
    toolKey: "kill-my-idea",
    name: "Kill My Idea",
    desc: "Brutally stress-test your idea against the harshest objections.",
    wired: true,
    difficulty: "Intermediate",
    xp: 75,
    handoffKey: "kill-my-idea",
  },
  {
    key: "funding-score",
    toolKey: "funding-score",
    name: "Funding Score",
    desc: "Score how investable your startup is with a VC-lens breakdown.",
    wired: true,
    difficulty: "Advanced",
    xp: 100,
    handoffKey: "funding-score",
  },
  {
    key: "first-10-customers",
    toolKey: "first-10-customers",
    name: "First 10 Customers",
    desc: "Tactical week-by-week roadmap to your first 10 paying customers.",
    wired: true,
    difficulty: "Intermediate",
    xp: 75,
    requiredPlan: "Launch",
    handoffKey: "first-10-customers",
  },
  {
    key: "business-plan",
    toolKey: "business-plan",
    name: "Business Plan",
    desc: "Investor-ready operating plan with milestones and financials.",
    wired: true,
    difficulty: "Advanced",
    xp: 100,
    requiredPlan: "Operate",
    handoffKey: "business-plan",
  },
  {
    key: "investor-emails",
    toolKey: "investor-emails",
    name: "Investor Emails",
    desc: "Cold investor outreach sequences that actually get replies.",
    wired: true,
    difficulty: "Intermediate",
    xp: 75,
    requiredPlan: "Operate",
    handoffKey: "investor-emails",
  },
  {
    key: "idea-vs-idea",
    toolKey: "idea-vs-idea",
    name: "Idea vs Idea",
    desc: "Side-by-side scoring of two startup ideas to find your winner.",
    wired: true,
    difficulty: "Beginner",
    xp: 50,
    handoffKey: "idea-vs-idea",
  },
  {
    key: "landing-page",
    toolKey: "landing-page",
    name: "Landing Page Copy",
    desc: "Hero, problem, benefits, CTA — every word earns its place.",
    wired: true,
    difficulty: "Intermediate",
    xp: 75,
    requiredPlan: "Launch",
    handoffKey: "landing-page",
  },
  {
    key: "competitor",
    toolKey: "competitor-analysis",
    name: "Competitor Analyzer",
    desc: "Map rivals, identify gaps, and find your unfair angle to win.",
    wired: true,
    difficulty: "Advanced",
    xp: 120,
    requiredPlan: "Scale",
    // No handoffKey — no entry in HANDOFFS; terminal analysis tool
  },
  {
    key: "pricing",
    toolKey: "pricing-strategy",
    name: "Pricing Strategy",
    desc: "Tiered pricing architecture with anchor logic and value math.",
    wired: true,
    difficulty: "Advanced",
    xp: 120,
    requiredPlan: "Scale",
    // No handoffKey — no entry in HANDOFFS; terminal analysis tool
  },
  {
    key: "revenue-projector",
    toolKey: "revenue-projector",
    name: "Revenue Projector",
    desc: "12-month MRR forecast with CAC, LTV, and scenario modeling.",
    wired: true,
    difficulty: "Advanced",
    xp: 150,
    requiredPlan: "Scale",
    // No handoffKey — no entry in HANDOFFS; terminal analysis tool
  },
  {
    key: "blog",
    toolKey: "blog",
    name: "Blog Post Generator",
    desc: "SEO-optimized blog post from a topic or keyword.",
    wired: true,
    difficulty: "Beginner",
    xp: 50,
    requiredPlan: "Launch",
    handoffKey: "blog",
  },
  {
    key: "social",
    toolKey: "social",
    name: "Social Media Posts",
    desc: "Platform-native content for LinkedIn, Twitter, Instagram, and TikTok.",
    wired: true,
    difficulty: "Beginner",
    xp: 40,
    requiredPlan: "Launch",
    handoffKey: "social",
  },
  {
    key: "email-sequence",
    toolKey: "email_sequence",
    name: "Email Sequence Builder",
    desc: "Multi-email nurture or onboarding sequences that convert.",
    wired: true,
    difficulty: "Intermediate",
    xp: 75,
    requiredPlan: "Launch",
    handoffKey: "email-sequence",
  },
  {
    key: "sales-script",
    toolKey: "sales_script",
    name: "Sales Script Generator",
    desc: "Objection-handling call scripts for discovery, demo, and close.",
    wired: true,
    difficulty: "Intermediate",
    xp: 75,
    requiredPlan: "Launch",
    handoffKey: "sales-script",
  },
  {
    key: "ad-creative",
    toolKey: "ad_creative",
    name: "Ad Creative Writer",
    desc: "High-converting ad copy for Meta, Google, and LinkedIn.",
    wired: true,
    difficulty: "Intermediate",
    xp: 75,
    requiredPlan: "Operate",
    handoffKey: "ad-creative",
  },
  {
    key: "vsl",
    toolKey: "vsl",
    name: "VSL Script Generator",
    desc: "Video Sales Letter script with hook, story, and CTA.",
    wired: true,
    difficulty: "Advanced",
    xp: 100,
    requiredPlan: "Operate",
    handoffKey: "vsl",
  },
  {
    key: "cold-email",
    toolKey: "cold_email",
    name: "Cold Email Sequence",
    desc: "Personalized cold outreach sequence with follow-up cadence.",
    wired: true,
    difficulty: "Intermediate",
    xp: 75,
    requiredPlan: "Launch",
    handoffKey: "cold-email",
  },
  {
    key: "niche-validator",
    toolKey: "niche_validator",
    name: "Niche Validator",
    desc: "Validate a niche's demand, competition, and monetization potential.",
    wired: true,
    difficulty: "Beginner",
    xp: 50,
    handoffKey: "niche-validator",
  },
  {
    key: "icp",
    toolKey: "icp",
    name: "ICP Builder",
    desc: "Detailed ideal customer profile with psychographics and buying triggers.",
    wired: true,
    difficulty: "Intermediate",
    xp: 75,
    handoffKey: "icp",
  },
  {
    key: "pitch-deck",
    toolKey: "pitch_deck",
    name: "Pitch Deck Outline",
    desc: "Slide-by-slide pitch deck structure for investors or clients.",
    wired: true,
    difficulty: "Advanced",
    xp: 100,
    requiredPlan: "Launch",
    handoffKey: "pitch-deck",
  },
  {
    key: "lead-magnet",
    toolKey: "lead_magnet",
    name: "Lead Magnet Creator",
    desc: "High-value lead magnet concept and outline to grow your list.",
    wired: true,
    difficulty: "Intermediate",
    xp: 75,
    requiredPlan: "Launch",
    handoffKey: "lead-magnet",
  },
  {
    key: "automation",
    toolKey: "automation",
    name: "Automation Blueprint",
    desc: "Step-by-step workflow automation plan for any business process.",
    wired: true,
    difficulty: "Advanced",
    xp: 100,
    requiredPlan: "Operate",
    handoffKey: "automation",
  },
  {
    key: "client-report",
    toolKey: "client_report",
    name: "Client Report Generator",
    desc: "Professional client performance report with insights and next steps.",
    wired: true,
    difficulty: "Intermediate",
    xp: 75,
    requiredPlan: "Operate",
    handoffKey: "client-report",
  },
  {
    key: "positioning-engine",
    toolKey: "positioning-engine",
    name: "Positioning Engine",
    desc: "A defensible market position — statement, category frame, and proof points.",
    wired: true,
    difficulty: "Intermediate",
    xp: 75,
    handoffKey: "positioning-engine",
  },
  {
    key: "niche-scorer",
    toolKey: "niche-scorer",
    name: "Niche Scorer",
    desc: "Score any niche across audience, competition, and monetization out of 100.",
    wired: true,
    difficulty: "Beginner",
    xp: 50,
    handoffKey: "niche-scorer",
  },
  {
    key: "mvp-planner",
    toolKey: "mvp-planner",
    name: "MVP / Build Planner",
    desc: "Cut your idea down to a buildable MVP — scope, sequence, and milestones.",
    wired: true,
    difficulty: "Advanced",
    xp: 100,
    requiredPlan: "Launch",
    handoffKey: "mvp-planner",
  },
];

export type NovaModule = {
  key: string;
  name: string;
  desc: string;
};

export const novaSystemsCatalog: NovaModule[] = [
  {
    key: "lead-capture",
    name: "Lead Capture System",
    desc: "Capture, score, and route inbound leads automatically.",
  },
  {
    key: "followup",
    name: "Follow-Up Automator",
    desc: "Multi-channel sequences that never let a lead go cold.",
  },
  {
    key: "onboarding",
    name: "Client Onboarding Flow",
    desc: "Kickoff forms, contracts, welcome packets — automated.",
  },
  {
    key: "invoice",
    name: "Invoice + Payment Tracker",
    desc: "Track invoices, send reminders, log payments.",
  },
  {
    key: "reputation",
    name: "Reputation Manager",
    desc: "Request reviews after wins, route negatives privately.",
  },
  {
    key: "reporting",
    name: "Reporting Dashboard",
    desc: "Weekly executive summary across all systems.",
  },
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
