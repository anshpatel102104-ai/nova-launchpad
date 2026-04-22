// Centralized mock state for the LaunchpadNOVA shell.
// Replace with real Lovable Cloud queries when backend is wired.

export type Stage = "Idea" | "Validate" | "Launch" | "Operate" | "Scale";
export type Plan = "Starter" | "Launch" | "Operate" | "Scale";

export const STAGES: Stage[] = ["Idea", "Validate", "Launch", "Operate", "Scale"];

export const currentUser = {
  fullName: "Alex Morgan",
  email: "alex@northwind.io",
  initials: "AM",
};

export const currentCompany = {
  name: "Northwind Labs",
  businessType: "B2B SaaS",
  niche: "Sales enablement",
  location: "Austin, TX",
  targetCustomer: "Series A founders",
  offer: "AI-powered sales playbooks",
  goal: "Hit $20k MRR in 90 days",
  stage: "Launch" as Stage,
  plan: "Launch" as Plan,
};

export const recommendedNext = {
  title: "Generate your GTM strategy",
  description:
    "You validated the idea and drafted a pitch. A GTM plan unlocks your first 10 customers playbook.",
  cta: "Build GTM",
  href: "/app/launchpad/gtm-strategy",
};

export const launchpadTools = [
  { key: "idea-validator", name: "Idea Validator", desc: "Pressure-test your idea against market signal.", outputs: 3, lastUsed: "2h ago", wired: true },
  { key: "pitch-generator", name: "Pitch Generator", desc: "Investor-ready pitch in minutes.", outputs: 2, lastUsed: "1d ago", wired: true },
  { key: "gtm-strategy", name: "GTM Strategy", desc: "Channel plan, ICP, messaging map.", outputs: 1, lastUsed: "3d ago", wired: true },
  { key: "kill-my-idea", name: "Kill My Idea", desc: "Adversarial critique to find blind spots.", outputs: 0, lastUsed: "—", wired: false },
  { key: "funding-score", name: "Funding Score", desc: "VC-style scorecard with gaps to close.", outputs: 0, lastUsed: "—", wired: false },
  { key: "first-10-customers", name: "First 10 Customers", desc: "Named-account list + outreach plan.", outputs: 0, lastUsed: "—", wired: false },
  { key: "business-plan", name: "Business Plan", desc: "Lean plan with financials.", outputs: 0, lastUsed: "—", wired: false },
  { key: "investor-emails", name: "Investor Emails", desc: "Personalized outreach to target VCs.", outputs: 0, lastUsed: "—", wired: false },
  { key: "idea-vs-idea", name: "Idea vs Idea", desc: "Side-by-side scoring of two directions.", outputs: 0, lastUsed: "—", wired: false },
  { key: "landing-page", name: "Landing Page", desc: "Conversion-ready copy + hero.", outputs: 0, lastUsed: "—", wired: false },
];

export const novaSystems = [
  { key: "crm", name: "CRM Pipeline", setup: 80, enabled: true, href: "/app/nova/crm" },
  { key: "leads", name: "Lead Capture", setup: 60, enabled: true, href: "/app/nova/leads" },
  { key: "workflows", name: "Automation Workflows", setup: 40, enabled: false, href: "/app/nova/workflows" },
  { key: "followup", name: "Follow-Up & Booking", setup: 25, enabled: false, href: "/app/nova/workflows" },
  { key: "clients", name: "Client Onboarding", setup: 10, enabled: false, href: "/app/nova/clients" },
  { key: "reports", name: "Reporting Dashboard", setup: 100, enabled: true, href: "/app/nova/reports" },
];

export const recentOutputs = [
  { tool: "Pitch Generator", title: "Series-A teaser deck v2", when: "2h ago" },
  { tool: "Idea Validator", title: "Sales enablement for Series A", when: "Yesterday" },
  { tool: "GTM Strategy", title: "Outbound + content split plan", when: "3d ago" },
  { tool: "First 10 Customers", title: "Top 10 named accounts", when: "5d ago" },
  { tool: "Landing Page", title: "Hero + pricing copy v1", when: "1w ago" },
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

export const leads: Lead[] = [
  { id: "L-1042", name: "Priya Shah", company: "Helix Logistics", email: "priya@helix.co", source: "Landing page", stage: "Qualified", value: 18000, lastTouch: "2h" },
  { id: "L-1041", name: "Marcus Chen", company: "Ledgerly", email: "m.chen@ledgerly.com", source: "Cold email", stage: "Contacted", value: 9000, lastTouch: "5h" },
  { id: "L-1040", name: "Sara Ortega", company: "Northwind Labs", email: "sara@northwind.io", source: "Referral", stage: "Proposal", value: 36000, lastTouch: "1d" },
  { id: "L-1039", name: "Ben Carter", company: "Quill & Co", email: "ben@quill.co", source: "Webinar", stage: "New", value: 6000, lastTouch: "1d" },
  { id: "L-1038", name: "Hana Suzuki", company: "Loom Studio", email: "hana@loomstudio.jp", source: "Landing page", stage: "Won", value: 24000, lastTouch: "3d" },
  { id: "L-1037", name: "Diego Alvarez", company: "Cargo Stack", email: "diego@cargostack.io", source: "LinkedIn", stage: "New", value: 12000, lastTouch: "4d" },
  { id: "L-1036", name: "Rita Kowalski", company: "Brightline AI", email: "rita@brightline.ai", source: "Referral", stage: "Lost", value: 0, lastTouch: "1w" },
];

export const workflows = [
  { id: "wf-1", name: "New lead → 90s auto-reply", trigger: "Lead created", actions: 3, enabled: true, runs: 142 },
  { id: "wf-2", name: "Qualified → Book demo sequence", trigger: "Stage = Qualified", actions: 5, enabled: true, runs: 38 },
  { id: "wf-3", name: "Won → Onboarding kickoff", trigger: "Stage = Won", actions: 7, enabled: false, runs: 0 },
  { id: "wf-4", name: "No-reply 3-day follow-up", trigger: "No reply 72h", actions: 2, enabled: true, runs: 211 },
  { id: "wf-5", name: "Proposal sent → reminder", trigger: "Stage = Proposal", actions: 2, enabled: false, runs: 0 },
];

export const clients = [
  { id: "c-1", name: "Loom Studio", started: "Apr 12", progress: 70, tasksDone: 7, tasksTotal: 10 },
  { id: "c-2", name: "Helix Logistics", started: "Apr 18", progress: 30, tasksDone: 3, tasksTotal: 10 },
  { id: "c-3", name: "Ledgerly", started: "Apr 20", progress: 10, tasksDone: 1, tasksTotal: 10 },
];

export const onboardingTasks = [
  { title: "Welcome call scheduled", done: true },
  { title: "Workspace provisioned", done: true },
  { title: "Data sources connected", done: true },
  { title: "Team members invited", done: false },
  { title: "First playbook configured", done: false },
  { title: "Go-live checklist signed", done: false },
];

export const usage = {
  aiGenerations: { used: 47, limit: 200 },
  leads: { used: 142, limit: 500 },
  workflows: { used: 5, limit: 10 },
};

export const plans: Array<{
  key: Plan;
  price: string;
  tagline: string;
  features: string[];
  highlight?: boolean;
}> = [
  {
    key: "Starter",
    price: "$0",
    tagline: "Validate your idea",
    features: ["Idea Validator", "1 saved output", "Community support"],
  },
  {
    key: "Launch",
    price: "$49",
    tagline: "Build and launch",
    features: ["All 10 Launchpad tools", "200 AI generations / mo", "Landing page export"],
    highlight: true,
  },
  {
    key: "Operate",
    price: "$149",
    tagline: "Run on autopilot",
    features: ["Everything in Launch", "Full Nova OS", "10 workflows + automations", "<90s response SLA"],
  },
  {
    key: "Scale",
    price: "$299",
    tagline: "Advanced and custom",
    features: ["Unlimited workflows", "Multi-seat team", "Custom integrations", "Priority support"],
  },
];

export const stageFunnel = [
  { stage: "New", count: 28 },
  { stage: "Contacted", count: 19 },
  { stage: "Qualified", count: 11 },
  { stage: "Proposal", count: 6 },
  { stage: "Won", count: 4 },
];

export const responseTimeSeries = [
  { day: "Mon", seconds: 78 },
  { day: "Tue", seconds: 64 },
  { day: "Wed", seconds: 91 },
  { day: "Thu", seconds: 55 },
  { day: "Fri", seconds: 47 },
  { day: "Sat", seconds: 88 },
  { day: "Sun", seconds: 72 },
];

export const revenueSeries = [
  { week: "W1", mrr: 4200 },
  { week: "W2", mrr: 5800 },
  { week: "W3", mrr: 7100 },
  { week: "W4", mrr: 9400 },
  { week: "W5", mrr: 11800 },
  { week: "W6", mrr: 14200 },
];
