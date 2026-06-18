// Playbooks — the missions Nova runs *for* the founder.
//
// This is the spine of the mission-based Launchpad. Instead of a browsable
// toolbox, Nova runs an ordered playbook for the founder's lane: each step is
// framed as a single decision/question, backed by research on THEIR business,
// and quietly powered by an underlying Launchpad tool in the background.
//
// Progress is derived from real tool_runs (no extra DB tables required), so a
// playbook stays in sync with what the founder has actually done.

import type { Lane, BusinessStage } from "@/lib/lane-classifier";

export interface PlaybookStep {
  id: string;
  /** Short step name shown in the rail. */
  title: string;
  /** The single decision/question Nova surfaces for this step. */
  novaQuestion: string;
  /** Why this matters right now — plain language. */
  why: string;
  /** Route slug for /app/launchpad/$tool. null = a manual, real-world step. */
  route: string | null;
  /** Candidate tool_runs.tool_key values that mark this step complete. */
  toolKeys: string[];
  /** What Nova researches for this step, grounded in the founder's idea. */
  researchFocus: string;
  /** "You're done when" markers. */
  doneWhen: string[];
  estimatedMinutes: number;
  /** Label for the primary action button. */
  ctaLabel: string;
}

export interface Playbook {
  id: string;
  lane: Lane;
  /** The mission name, as Nova says it: "Land Your First 10 Customers". */
  title: string;
  /** One line: what this mission is for. */
  objective: string;
  /** The tangible result the founder walks away with. */
  outcome: string;
  /** Emoji used as the mission glyph. */
  emoji: string;
  steps: PlaybookStep[];
}

// ── The four core playbooks, one per lane ────────────────────────────────────

const VALIDATE_IDEA: Playbook = {
  id: "validate-idea",
  lane: "Idea",
  title: "Validate Your Idea",
  objective: "Prove the idea is worth building before you spend months on it.",
  outcome: "A scored, stress-tested idea with a clear go / iterate / kill decision.",
  emoji: "🧪",
  steps: [
    {
      id: "score-idea",
      title: "Score the idea",
      novaQuestion: "Is this idea strong enough to build on — or does it need to change first?",
      why: "If the idea is weak, you want to know today, not after months of work.",
      route: "idea-validator",
      toolKeys: ["idea-validator", "validate-idea"],
      researchFocus: "real market demand, search trends, and how people solve this problem today",
      doneWhen: ["You have a viability score", "You wrote down the top 3 things to fix"],
      estimatedMinutes: 8,
      ctaLabel: "Score my idea",
    },
    {
      id: "stress-test",
      title: "Stress-test it",
      novaQuestion: "What is the most likely reason this fails — and can you answer it?",
      why: "It's better to hear the hard objections now than in a real sales call.",
      route: "kill-my-idea",
      toolKeys: ["kill-my-idea"],
      researchFocus: "common failure modes and objections for businesses like this",
      doneWhen: ["You read the top objections", "You have an answer for each one"],
      estimatedMinutes: 6,
      ctaLabel: "Stress-test it",
    },
    {
      id: "map-competitors",
      title: "Map the competition",
      novaQuestion: "Where is the gap competitors are leaving open for you?",
      why: "You don't need to be first — you need a position no one else owns.",
      route: "competitor-scanner",
      toolKeys: ["competitor-scanner", "competitor-analysis", "competitor"],
      researchFocus: "direct and indirect competitors, their positioning, pricing, and weak spots",
      doneWhen: ["You know your 3 closest competitors", "You found one gap to own"],
      estimatedMinutes: 7,
      ctaLabel: "Map competitors",
    },
    {
      id: "gtm-plan",
      title: "Turn it into a plan",
      novaQuestion: "What is the one channel you'll use to reach your first customers?",
      why: "A validated idea with no plan to sell it still goes nowhere.",
      route: "gtm-strategy-builder",
      toolKeys: ["gtm-strategy-builder", "generate-gtm-strategy", "gtm-strategy"],
      researchFocus: "the best acquisition channels for this audience and how to start on each",
      doneWhen: ["You picked one primary channel", "You have a 90-day outline"],
      estimatedMinutes: 10,
      ctaLabel: "Build my plan",
    },
  ],
};

const BUILD_OFFER: Playbook = {
  id: "build-offer",
  lane: "Offer",
  title: "Build & Price Your Offer",
  objective: "Turn your idea into something specific, priced, and ready to sell.",
  outcome: "A clear offer, a price you can defend, and a page that converts.",
  emoji: "📦",
  steps: [
    {
      id: "position",
      title: "Lock your position",
      novaQuestion: "Who is this for, and why you instead of the alternatives?",
      why: "A muddy position makes everything downstream — pricing, copy, ads — harder.",
      route: "positioning-engine",
      toolKeys: ["positioning-engine"],
      researchFocus: "how similar companies position themselves and which angles are unclaimed",
      doneWhen: ["You have a one-sentence positioning statement", "It names a specific buyer"],
      estimatedMinutes: 9,
      ctaLabel: "Lock my position",
    },
    {
      id: "persona",
      title: "Know your buyer",
      novaQuestion: "What does your best-fit customer feel the day before they buy?",
      why: "You can't write a great offer until you know the exact person it's for.",
      route: "persona-builder",
      toolKeys: ["persona-builder", "icp"],
      researchFocus: "the demographics, pains, and buying triggers of this target customer",
      doneWhen: ["You have 1–2 sharp personas", "You captured their buy triggers"],
      estimatedMinutes: 8,
      ctaLabel: "Build my buyer",
    },
    {
      id: "price",
      title: "Set your price",
      novaQuestion: "What price captures the value without scaring buyers off?",
      why: "Pricing is the fastest lever on revenue — and the easiest to get wrong.",
      route: "pricing-calculator",
      toolKeys: ["pricing-calculator", "pricing-strategy", "pricing"],
      researchFocus: "what competitors charge and what this market will actually pay",
      doneWhen: ["You have a price and a reason for it", "You modeled revenue at 10/50/100 buyers"],
      estimatedMinutes: 6,
      ctaLabel: "Set my price",
    },
    {
      id: "landing",
      title: "Make it sellable",
      novaQuestion: "Does your page make a stranger understand and want this in 5 seconds?",
      why: "Your offer isn't real until someone can read it and say yes.",
      route: "landing-page-creator",
      toolKeys: ["landing-page-creator", "landing-page"],
      researchFocus: "high-converting landing page patterns for this kind of offer",
      doneWhen: ["You have hero, benefits, and CTA copy", "It states the price and the outcome"],
      estimatedMinutes: 12,
      ctaLabel: "Write my page",
    },
  ],
};

const FIRST_CUSTOMERS: Playbook = {
  id: "first-customers",
  lane: "Customer",
  title: "Land Your First 10 Customers",
  objective: "Get real, paying customers — the only true validation.",
  outcome: "A list of prospects, outreach that lands, and your first closes.",
  emoji: "🎯",
  steps: [
    {
      id: "find-10",
      title: "Find your first 10",
      novaQuestion: "Who are the 20 specific people most likely to say yes this month?",
      why: "Your first 10 customers prove the business is real — start with a named list.",
      route: "first-10-customers-finder",
      toolKeys: ["first-10-customers-finder", "first-10-customers"],
      researchFocus: "where this exact buyer hangs out and how to reach them directly",
      doneWhen: ["You have a list of 20+ prospects", "You sent your first message"],
      estimatedMinutes: 10,
      ctaLabel: "Find my first 10",
    },
    {
      id: "pitch",
      title: "Sharpen the pitch",
      novaQuestion: "Can you make someone want a call in 30 seconds?",
      why: "People decide fast — a sharp pitch turns a cold name into a conversation.",
      route: "pitch-generator",
      toolKeys: ["pitch-generator", "generate-pitch"],
      researchFocus: "the messaging and hooks that resonate with this audience",
      doneWhen: ["You have a 30-second pitch", "A friend hears it and gets it"],
      estimatedMinutes: 8,
      ctaLabel: "Write my pitch",
    },
    {
      id: "followup",
      title: "Automate follow-up",
      novaQuestion: "What happens to the 80% who don't reply the first time?",
      why: "Most sales happen after 5+ touches — the follow-up is where the money is.",
      route: "email-sequence",
      toolKeys: ["email-sequence"],
      researchFocus: "follow-up cadences and subject lines that get replies in this niche",
      doneWhen: ["You have a 5-email sequence", "You know which day each one sends"],
      estimatedMinutes: 8,
      ctaLabel: "Build my follow-up",
    },
    {
      id: "convert",
      title: "Give them somewhere to land",
      novaQuestion: "When a prospect says 'send me the link', what do they see?",
      why: "Outreach without a page to convert on leaks your hardest-won attention.",
      route: "landing-page-creator",
      toolKeys: ["landing-page-creator", "landing-page"],
      researchFocus: "what makes outbound prospects convert once they reach a page",
      doneWhen: ["You have a page to send", "It has one clear next step"],
      estimatedMinutes: 12,
      ctaLabel: "Build my page",
    },
  ],
};

const GROWTH_SYSTEM: Playbook = {
  id: "growth-system",
  lane: "Systems",
  title: "Build Your Growth System",
  objective: "Turn what's working into a repeatable engine that runs without you.",
  outcome: "Tracked numbers, a launch plan, and an automated channel.",
  emoji: "⚙️",
  steps: [
    {
      id: "kpis",
      title: "Pick your numbers",
      novaQuestion: "Which 5 numbers tell you if the business is healthy this week?",
      why: "You can't scale what you can't see — start by deciding what to measure.",
      route: "kpi-dashboard",
      toolKeys: ["kpi-dashboard"],
      researchFocus: "the KPIs that matter most for this business model and stage",
      doneWhen: ["You chose your top 5 metrics", "You know good vs bad for each"],
      estimatedMinutes: 10,
      ctaLabel: "Pick my numbers",
    },
    {
      id: "channel",
      title: "Systematize a channel",
      novaQuestion: "Which channel is worth doubling down on and making repeatable?",
      why: "One channel run well beats five run badly — make your best one a system.",
      route: "gtm-strategy-builder",
      toolKeys: ["gtm-strategy-builder", "generate-gtm-strategy", "gtm-strategy"],
      researchFocus: "how leaders in this space build a repeatable acquisition engine",
      doneWhen: ["You picked one channel to systematize", "You have a weekly cadence"],
      estimatedMinutes: 10,
      ctaLabel: "Systematize a channel",
    },
    {
      id: "automate",
      title: "Automate follow-up",
      novaQuestion: "What manual task could run on autopilot starting this week?",
      why: "Every task you automate is time back for the work only you can do.",
      route: "email-sequence",
      toolKeys: ["email-sequence"],
      researchFocus: "which parts of this funnel are most commonly automated and how",
      doneWhen: ["You automated one sequence", "It runs without you touching it"],
      estimatedMinutes: 8,
      ctaLabel: "Automate it",
    },
    {
      id: "compound",
      title: "Find the compounding channel",
      novaQuestion: "What investment today keeps paying off 6 months from now?",
      why: "Compounding channels (SEO, content) are slow to start and hard to stop.",
      route: "seo-audit",
      toolKeys: ["seo-audit"],
      researchFocus: "the long-term, compounding growth levers available to this business",
      doneWhen: ["You found your compounding lever", "You did the top 3 fixes"],
      estimatedMinutes: 8,
      ctaLabel: "Find my compounding lever",
    },
  ],
};

export const PLAYBOOKS: Record<Lane, Playbook> = {
  Idea: VALIDATE_IDEA,
  Offer: BUILD_OFFER,
  Customer: FIRST_CUSTOMERS,
  Systems: GROWTH_SYSTEM,
};

export const ALL_PLAYBOOKS: Playbook[] = [
  VALIDATE_IDEA,
  BUILD_OFFER,
  FIRST_CUSTOMERS,
  GROWTH_SYSTEM,
];

// Stage → lane fallback when a lane hasn't been assigned yet.
const STAGE_TO_LANE: Record<BusinessStage, Lane> = {
  Idea: "Idea",
  Validate: "Idea",
  Launch: "Customer",
  Operate: "Systems",
  Scale: "Systems",
};

/** Choose the playbook Nova should run, from lane (preferred) or stage. */
export function selectPlaybook(opts: { lane?: string | null; stage?: string | null }): Playbook {
  const lane = opts.lane as Lane | undefined;
  if (lane && PLAYBOOKS[lane]) return PLAYBOOKS[lane];
  const stage = opts.stage as BusinessStage | undefined;
  if (stage && STAGE_TO_LANE[stage]) return PLAYBOOKS[STAGE_TO_LANE[stage]];
  return PLAYBOOKS.Idea;
}

export interface PlaybookProgress {
  steps: Array<PlaybookStep & { done: boolean; current: boolean }>;
  currentStepIndex: number;
  currentStep: PlaybookStep | null;
  completedCount: number;
  totalCount: number;
  percent: number;
  isComplete: boolean;
}

/**
 * Derive live progress for a playbook from the set of tool_runs keys the org
 * has completed. The current step is the first one not yet done.
 */
export function computePlaybookProgress(
  playbook: Playbook,
  completedKeys: Set<string>,
): PlaybookProgress {
  const doneFlags = playbook.steps.map((s) => s.toolKeys.some((k) => completedKeys.has(k)));
  const firstIncomplete = doneFlags.findIndex((d) => !d);
  const currentStepIndex = firstIncomplete === -1 ? playbook.steps.length - 1 : firstIncomplete;
  const completedCount = doneFlags.filter(Boolean).length;
  const totalCount = playbook.steps.length;

  return {
    steps: playbook.steps.map((s, i) => ({
      ...s,
      done: doneFlags[i],
      current: i === currentStepIndex && firstIncomplete !== -1,
    })),
    currentStepIndex,
    currentStep: firstIncomplete === -1 ? null : playbook.steps[currentStepIndex],
    completedCount,
    totalCount,
    percent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
    isComplete: completedCount === totalCount,
  };
}
