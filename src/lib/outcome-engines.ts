// Outcome Engines — the outcome-first layer that replaces tool-marketplace
// browsing. Users pick what they want to ACHIEVE; each engine sequences the
// existing Launchpad tools (plus manual steps) behind the scenes.
//
// NOVA_OS_REDESIGN.md · Part 2 — frontend-only; reuses existing tool routes.

import type { ComponentType, CSSProperties } from "react";
import {
  Lightbulb,
  Megaphone,
  Target,
  Users,
  Mail,
  Workflow,
  TrendingUp,
  Blocks,
  BookOpen,
  Plug,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────── */

export type OutcomeCategory = "build" | "launch" | "grow" | "automate" | "optimize" | "scale";

export interface OutcomeStep {
  title: string;
  /** What the user does, in plain language */
  description: string;
  /** Launchpad tool slug — null means manual step */
  toolSlug: string | null;
  /** Route to execute (tool page or relevant app page) */
  to: string;
  estimatedMinutes: number;
}

export interface OutcomeEngine {
  id: string;
  category: OutcomeCategory;
  name: string;
  /** One-line: what the user walks away with */
  outcome: string;
  /** Why this matters for the business */
  impact: string;
  estimatedMinutes: number;
  icon: ComponentType<{ className?: string; style?: CSSProperties }>;
  steps: OutcomeStep[];
  /** Outcome IDs that naturally follow this one */
  leadsTo: string[];
  /** Handwritten margin note — logbook flavor */
  marginNote?: string;
}

/* ─── Category metadata (drives nav + page headers) ─────────── */

export const OUTCOME_CATEGORIES: Record<
  OutcomeCategory,
  { label: string; tagline: string; modes: Array<"create" | "operate"> }
> = {
  build: {
    label: "Build",
    tagline: "Turn your idea into something sellable",
    modes: ["create"],
  },
  launch: {
    label: "Launch",
    tagline: "Get your first paying customers",
    modes: ["create"],
  },
  grow: {
    label: "Grow",
    tagline: "Scale revenue with repeatable systems",
    modes: ["create"],
  },
  automate: {
    label: "Automate",
    tagline: "Remove manual work from your business",
    modes: ["operate"],
  },
  optimize: {
    label: "Optimize",
    tagline: "Improve conversion, revenue, and efficiency",
    modes: ["operate"],
  },
  scale: {
    label: "Scale",
    tagline: "Build the team and playbook to grow without you",
    modes: ["operate"],
  },
};

/* ─── Engine definitions ────────────────────────────────────── */

export const OUTCOME_ENGINES: OutcomeEngine[] = [
  /* ── BUILD ── */
  {
    id: "validate-idea",
    category: "build",
    name: "Validate Your Idea",
    outcome: "A scored verdict: build it, fix it, or kill it",
    impact: "Saves you months of building the wrong thing",
    estimatedMinutes: 20,
    icon: Lightbulb,
    marginNote: "check before you build!",
    steps: [
      {
        title: "Score the idea",
        description: "Nova grades your idea across 8 investor dimensions and gives a verdict.",
        toolSlug: "idea-validator",
        to: "/app/launchpad/idea-validator",
        estimatedMinutes: 8,
      },
      {
        title: "Pressure-test it",
        description:
          "Nova argues against your idea like a skeptical investor — find the holes first.",
        toolSlug: "kill-my-idea",
        to: "/app/launchpad/kill-my-idea",
        estimatedMinutes: 6,
      },
      {
        title: "Write your one-liner",
        description:
          'Fill in: "I help [WHO] to [DO WHAT] so that [BENEFIT]." Simple enough for a 10-year-old.',
        toolSlug: null,
        to: "/app/mission-control",
        estimatedMinutes: 6,
      },
    ],
    leadsTo: ["build-offer"],
  },
  {
    id: "build-offer",
    category: "build",
    name: "Build Your Offer",
    outcome: "A clear offer with pricing, ready to sell",
    impact: "The foundation for all revenue — nothing sells without it",
    estimatedMinutes: 30,
    icon: Megaphone,
    marginNote: "this unlocks revenue ↓",
    steps: [
      {
        title: "Design the offer",
        description:
          "Tell Nova who it's for, what result you deliver, and the price. Get a professional offer architecture.",
        toolSlug: "offer",
        to: "/app/launchpad/offer",
        estimatedMinutes: 12,
      },
      {
        title: "Map your go-to-market",
        description:
          "Nova builds a 90-day plan: target segment, channels, messaging, weekly calendar.",
        toolSlug: "gtm-strategy",
        to: "/app/launchpad/gtm-strategy",
        estimatedMinutes: 10,
      },
      {
        title: "Write your positioning",
        description:
          'Fill in: "We help [WHO] achieve [RESULT] without [PAIN] in [TIMEFRAME]." Put it everywhere.',
        toolSlug: null,
        to: "/app/mission-control",
        estimatedMinutes: 8,
      },
    ],
    leadsTo: ["land-first-customers", "create-pitch"],
  },
  {
    id: "create-pitch",
    category: "build",
    name: "Create Your Pitch",
    outcome: "A 30-second pitch that makes people want more",
    impact: "Used in every email, meeting, and conversation from here on",
    estimatedMinutes: 15,
    icon: Target,
    steps: [
      {
        title: "Generate the pitch",
        description: "Nova writes a compelling pitch from your business details.",
        toolSlug: "pitch-generator",
        to: "/app/launchpad/pitch-generator",
        estimatedMinutes: 10,
      },
      {
        title: "Practice out loud",
        description:
          "Say it 5 times. Record yourself. If you sound clear and confident, you're ready.",
        toolSlug: null,
        to: "/app/mission-control",
        estimatedMinutes: 5,
      },
    ],
    leadsTo: ["land-first-customers"],
  },

  /* ── LAUNCH ── */
  {
    id: "land-first-customers",
    category: "launch",
    name: "Land First 10 Customers",
    outcome: "10 paying customers and proven product-market fit",
    impact: "The moment your idea becomes a business",
    estimatedMinutes: 45,
    icon: Users,
    marginNote: "the only metric that matters right now",
    steps: [
      {
        title: "Get your acquisition blueprint",
        description: "Nova builds a personalized plan to land 10 customers in 30 days.",
        toolSlug: "first-10-customers",
        to: "/app/launchpad/first-10-customers",
        estimatedMinutes: 15,
      },
      {
        title: "Build your follow-up sequence",
        description: "5 ready-to-send emails over 2 weeks — intro, value, objection, proof, ask.",
        toolSlug: "followup",
        to: "/app/launchpad/followup",
        estimatedMinutes: 15,
      },
      {
        title: "Send your first outreach today",
        description:
          "One real person. One message. Right now — then add them to your Contacts to track what happens.",
        toolSlug: null,
        to: "/app/contacts",
        estimatedMinutes: 15,
      },
    ],
    leadsTo: ["build-growth-system"],
  },
  {
    id: "automate-followup",
    category: "launch",
    name: "Automate Your Follow-Up",
    outcome: "Follow-ups that send themselves — no lead falls through",
    impact: "Most sales need 5–8 touches; automation makes that effortless",
    estimatedMinutes: 20,
    icon: Mail,
    steps: [
      {
        title: "Write the sequence",
        description: "Nova drafts the 5-email sequence tuned to your business and customer.",
        toolSlug: "followup",
        to: "/app/launchpad/followup",
        estimatedMinutes: 10,
      },
      {
        title: "Turn on the automation",
        description:
          "Enable the follow-up workflow so every new lead enters the sequence automatically.",
        toolSlug: null,
        to: "/app/automations",
        estimatedMinutes: 10,
      },
    ],
    leadsTo: ["build-growth-system"],
  },

  /* ── GROW ── */
  {
    id: "build-growth-system",
    category: "grow",
    name: "Build a Repeatable Growth System",
    outcome: "Customer acquisition that runs without your personal effort",
    impact: "Your business stops being capped by your hours",
    estimatedMinutes: 60,
    icon: TrendingUp,
    steps: [
      {
        title: "Document your GTM playbook",
        description: "A strategy a team member could execute — channels, scripts, weekly cadence.",
        toolSlug: "gtm-strategy",
        to: "/app/launchpad/gtm-strategy",
        estimatedMinutes: 15,
      },
      {
        title: "Map your operations",
        description: "Nova structures your processes, roles, and ranks what to automate first.",
        toolSlug: "generate-ops-plan",
        to: "/app/launchpad/ops-plan",
        estimatedMinutes: 20,
      },
      {
        title: "Design your referral loop",
        description:
          "Send the 3-sentence referral ask to your last 5 customers. Make referrals happen on purpose.",
        toolSlug: null,
        to: "/app/contacts",
        estimatedMinutes: 25,
      },
    ],
    leadsTo: ["automate-process"],
  },

  /* ── AUTOMATE (operator) ── */
  {
    id: "automate-process",
    category: "automate",
    name: "Automate a Key Process",
    outcome: "One recurring task running 100% without you",
    impact: "Every automated task is permanent reclaimed time",
    estimatedMinutes: 40,
    icon: Workflow,
    marginNote: "start with the most repeated task",
    steps: [
      {
        title: "Map the task",
        description:
          "Write the handoff doc: what triggers it, the exact steps, and what 'done' looks like.",
        toolSlug: "generate-ops-plan",
        to: "/app/launchpad/ops-plan",
        estimatedMinutes: 15,
      },
      {
        title: "Deploy the automation",
        description:
          "Pick a pre-built workflow that matches, or build a custom trigger → action chain.",
        toolSlug: null,
        to: "/app/automations",
        estimatedMinutes: 25,
      },
    ],
    leadsTo: ["connect-systems"],
  },
  {
    id: "connect-systems",
    category: "automate",
    name: "Connect Your Systems",
    outcome: "Your real data flowing into Nova automatically",
    impact: "No more manual reporting — your numbers fill themselves in",
    estimatedMinutes: 15,
    icon: Plug,
    steps: [
      {
        title: "Connect your most-used tool",
        description: "Link payments, CRM, or calendar. One integration unlocks live dashboards.",
        toolSlug: null,
        to: "/app/integrations",
        estimatedMinutes: 15,
      },
    ],
    leadsTo: ["automate-process"],
  },

  /* ── OPTIMIZE (operator) ── */
  {
    id: "optimize-growth",
    category: "optimize",
    name: "Improve Your Growth Engine",
    outcome: "A sharper GTM with better conversion at each stage",
    impact: "Same effort, more revenue",
    estimatedMinutes: 35,
    icon: TrendingUp,
    steps: [
      {
        title: "Rebuild your GTM with current data",
        description:
          "Feed Nova your real numbers — get an updated strategy that targets the leaks.",
        toolSlug: "gtm-strategy",
        to: "/app/launchpad/gtm-strategy",
        estimatedMinutes: 15,
      },
      {
        title: "Tighten your follow-up",
        description: "Refresh the sequence with what you've learned about objections.",
        toolSlug: "followup",
        to: "/app/launchpad/followup",
        estimatedMinutes: 10,
      },
      {
        title: "Review your pipeline",
        description: "Walk every open deal: what's the next action and when?",
        toolSlug: null,
        to: "/app/nova/crm",
        estimatedMinutes: 10,
      },
    ],
    leadsTo: ["build-playbook"],
  },

  /* ── SCALE (operator) ── */
  {
    id: "build-playbook",
    category: "scale",
    name: "Build Your Team Playbook",
    outcome: "SOPs that let someone else run your processes",
    impact: "Delegation becomes possible — you stop being the bottleneck",
    estimatedMinutes: 60,
    icon: BookOpen,
    steps: [
      {
        title: "Document your operations",
        description: "Nova structures how the business runs: processes, roles, tools.",
        toolSlug: "generate-ops-plan",
        to: "/app/launchpad/ops-plan",
        estimatedMinutes: 20,
      },
      {
        title: "Write your first 3 SOPs",
        description:
          "For your 3 most repeated tasks: when to do it, numbered steps like a recipe, what 'done' looks like.",
        toolSlug: null,
        to: "/app/sop-library",
        estimatedMinutes: 40,
      },
    ],
    leadsTo: ["automate-process"],
  },
  {
    id: "build-custom-workflow",
    category: "scale",
    name: "Build a Custom Workflow",
    outcome: "An automation built for a process unique to your business",
    impact: "Your edge, systematized",
    estimatedMinutes: 30,
    icon: Blocks,
    steps: [
      {
        title: "Sketch the trigger → action chain",
        description: "Use the visual builder to wire your custom automation.",
        toolSlug: null,
        to: "/app/builder",
        estimatedMinutes: 30,
      },
    ],
    leadsTo: [],
  },
];

/* ─── Lookups ───────────────────────────────────────────────── */

export function getOutcomesByCategory(category: OutcomeCategory): OutcomeEngine[] {
  return OUTCOME_ENGINES.filter((e) => e.category === category);
}

export function getOutcomeById(id: string): OutcomeEngine | undefined {
  return OUTCOME_ENGINES.find((e) => e.id === id);
}

export function isValidCategory(c: string): c is OutcomeCategory {
  return c in OUTCOME_CATEGORIES;
}
