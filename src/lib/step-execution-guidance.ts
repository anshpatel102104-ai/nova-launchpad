// Step Execution Guidance Library
// Maps mission steps to clear, actionable execution guidance
// Written at a 5th-grade reading level with:
// - Clear WHY (why you're doing this)
// - Simple WHAT (what to do)
// - HOW (multiple ways to do it)
// - Success criteria (how you know you're done)

import type { StepGuidance, ExecutionOption } from "@/components/app/StepExecutionGuide";

// ── IDEA LANE GUIDANCE ──────────────────────────────────────────────

export const IDEA_VALIDATOR_GUIDANCE: StepGuidance = {
  stepId: "step-idea-validator",
  title: "Score Your Idea with the Idea Validator",
  whyDoThis:
    "Before you spend any time or money, you need to know if your idea is worth pursuing. This tool will tell you the honest truth about your idea's strengths and weaknesses.",
  simplifiedDescription:
    "Think of this like running your business idea through a quality check before launching it. The Idea Validator will score your idea, show you what's strong about it, and tell you exactly what needs to be fixed.",
  estimatedTime: 8,
  executionOptions: [
    {
      type: "tool",
      label: "Run the Tool in Nova",
      description:
        "The fastest way to validate your idea. Click the button to open the tool, paste your idea description, and let Nova score it immediately.",
      action: {
        text: "Open Idea Validator",
        href: "/app/launchpad/idea-validator",
      },
    },
    {
      type: "manual",
      label: "Manual Checklist Approach",
      description:
        "If you prefer not to use the tool, you can manually score your idea by answering key questions about market fit, competition, and your unique advantage.",
      action: {
        text: "Get Manual Checklist",
      },
    },
  ],
  successCriteria: [
    "You have a score from 0-100 for your idea",
    "You've read all the strengths (the good parts)",
    "You've read the weaknesses (things to improve)",
    "You've written down the top 3 things to fix before launching",
  ],
  commonMistakes: [
    "Being vague in your description — be specific about WHO your customer is and WHAT problem you solve",
    "Disagreeing with the feedback — take it as data, not a personal attack",
    "Trying to fix everything at once — focus on the top 3 issues first",
  ],
};

export const KILL_MY_IDEA_GUIDANCE: StepGuidance = {
  stepId: "step-kill-my-idea",
  title: "Pressure-Test It with Kill My Idea",
  whyDoThis:
    "Every business has weaknesses. This tool finds yours BEFORE a real customer (or investor) finds them. It's like a practice debate where you learn to defend your idea.",
  simplifiedDescription:
    "Nova will argue AGAINST your idea as hard as possible — like a skeptical investor who doesn't want to give you money. This is not to hurt you. It's to surface every possible objection before someone real brings them up.",
  estimatedTime: 6,
  executionOptions: [
    {
      type: "tool",
      label: "Run the Tool",
      description: "Open Kill My Idea, paste your idea, and let Nova be your toughest critic.",
      action: {
        text: "Open Kill My Idea",
        href: "/app/launchpad/kill-my-idea",
      },
    },
    {
      type: "manual",
      label: "Manual Devil's Advocate",
      description:
        "Have a friend or advisor play devil's advocate. Ask them: 'What's the biggest reason someone wouldn't buy this?'",
      action: {
        text: "Guide for Manual Debate",
      },
    },
  ],
  successCriteria: [
    "You've read Nova's top 5 objections to your idea",
    "You've written down your answer to each objection (even if your answer is 'you're right, that's a real risk')",
    "Your answers are strong enough that YOU would believe them",
  ],
  commonMistakes: [
    "Dismissing the objections — they represent real customer concerns",
    "Getting defensive — this is feedback, not failure",
    "Not writing down your answers — write them down so you're prepared if a real customer asks",
  ],
};

export const PITCH_GENERATOR_GUIDANCE: StepGuidance = {
  stepId: "step-pitch-generator",
  title: "Create a Pitch That Gets People Excited",
  whyDoThis:
    "A good pitch is the story you tell about your business that makes people want to buy it or invest in it. You'll use this pitch in emails, meetings, social media, and conversations.",
  simplifiedDescription:
    "Your pitch should be short enough to say in 30 seconds, clear enough that a 10-year-old understands it, and compelling enough that someone WANTS to learn more.",
  estimatedTime: 10,
  executionOptions: [
    {
      type: "tool",
      label: "Generate with Nova",
      description: "Let Nova write your pitch based on your business details. Then practice saying it out loud.",
      action: {
        text: "Open Pitch Generator",
        href: "/app/launchpad/pitch-generator",
      },
    },
    {
      type: "manual",
      label: "Write It Yourself",
      description:
        "Use the formula: 'I help [WHO] achieve [RESULT] without [PAIN POINT].' Example: 'I help freelancers get paid on time without chasing clients.'",
      action: {
        text: "See Pitch Formula",
      },
    },
  ],
  successCriteria: [
    "Your pitch is 2-3 sentences max",
    "You've practiced saying it out loud 5 times",
    "A friend heard it and immediately understood what you sell",
    "You feel confident and clear when you say it",
  ],
  commonMistakes: [
    "Making it too long — if it takes more than 30 seconds to say, it's too complicated",
    "Being too generic — 'We help businesses with their needs' is useless. Be specific.",
    "Not practicing — practice until you sound natural, not robotic",
  ],
};

export const GTM_STRATEGY_GUIDANCE: StepGuidance = {
  stepId: "step-gtm-strategy",
  title: "Map Your Go-To-Market Strategy",
  whyDoThis:
    "Knowing WHAT you sell is different from knowing HOW to sell it. This strategy tells you exactly WHERE to find your customers and WHAT to say to them.",
  simplifiedDescription:
    "Nova will create a 90-day plan showing: (1) what type of customer to target first, (2) exactly where to find them (LinkedIn, cold email, local networking, etc), (3) what to say to get their attention, and (4) a week-by-week calendar.",
  estimatedTime: 10,
  executionOptions: [
    {
      type: "tool",
      label: "Generate Strategy",
      description: "Tell Nova about your business, target customer, and how you want to reach them. Get a complete GTM plan.",
      action: {
        text: "Open GTM Strategy",
        href: "/app/launchpad/gtm-strategy",
      },
    },
    {
      type: "manual",
      label: "Research Manually",
      description:
        "Research where your target customers hang out (forums, social media, industry groups, etc). Create a simple spreadsheet with channel + messaging approach.",
      action: {
        text: "See Research Template",
      },
    },
  ],
  successCriteria: [
    "You have a list of 3-5 possible channels to reach customers",
    "You've picked ONE channel to focus on for the next 30 days",
    "You have messaging ideas (what you'll say) for that channel",
    "You have a week-by-week action plan for the next 90 days",
  ],
  commonMistakes: [
    "Trying to do everything at once — pick ONE channel and master it before adding others",
    "Generic messaging — don't say 'We help businesses succeed.' Say exactly what problem you solve and for whom.",
    "No follow-up plan — most customers need 5-8 touchpoints before they buy. Plan for follow-up.",
  ],
};

export const OFFER_BUILDER_GUIDANCE: StepGuidance = {
  stepId: "step-offer-builder",
  title: "Design Your Offer with the Offer Builder",
  whyDoThis:
    "An 'offer' is the complete package of what you sell: the product, the price, who it's for, and why they should choose YOU. Without a clear offer, you can't sell anything.",
  simplifiedDescription:
    "Think of your offer like a restaurant menu item. It needs: a clear description of what you're serving, a fair price, and why someone would pick it over other options.",
  estimatedTime: 12,
  executionOptions: [
    {
      type: "tool",
      label: "Build with Nova",
      description:
        "Answer questions about your target customer, what result you deliver, your price, and what's included. Nova will write a professional offer description.",
      action: {
        text: "Open Offer Builder",
        href: "/app/launchpad/offer",
      },
    },
    {
      type: "manual",
      label: "Write It Manually",
      description:
        "Use a template: Product name, who it's for, what problem it solves, what's included, price, and why you're different from competitors.",
      action: {
        text: "See Offer Template",
      },
    },
  ],
  successCriteria: [
    "You have a clear product name or description",
    "You know exactly who your ideal customer is (be specific: 'freelance designers in the US with 2-10 clients')",
    "You have a price that feels fair to you",
    "You can clearly say what's included in your offer",
    "You have 2-3 reasons why someone would pick you over a competitor",
  ],
  commonMistakes: [
    "Trying to be everything to everyone — pick one ideal customer and speak to them",
    "Underpricing because you're nervous — price based on value delivered, not your time",
    "Listing features instead of benefits — don't say '5-page website.' Say 'a professional website that brings you 3-5 new clients per month.'",
  ],
};

export const FIRST_10_CUSTOMERS_GUIDANCE: StepGuidance = {
  stepId: "step-first-10-customers",
  title: "Get Your First 10 Customers Blueprint",
  whyDoThis:
    "Getting your first customers is the fastest way to validate that people actually want what you're selling. Each customer teaches you something.",
  simplifiedDescription:
    "Nova will give you a specific plan with strategies, scripts, and daily actions to get 10 paying customers within 30 days. The plan is customized to your type of business.",
  estimatedTime: 15,
  executionOptions: [
    {
      type: "tool",
      label: "Generate Blueprint",
      description: "Tell Nova your offer, target customer, and price. Get a personalized 30-day action plan.",
      action: {
        text: "Open First 10 Customers",
        href: "/app/launchpad/first-10-customers",
      },
    },
    {
      type: "manual",
      label: "Create Your Own Plan",
      description:
        "List 3-5 ways you could reach your target customer. For each way, plan: (1) how many people to reach, (2) what you'll say, (3) when to follow up.",
      action: {
        text: "See Planning Template",
      },
    },
  ],
  successCriteria: [
    "You have at least 2 channels or strategies to reach customers",
    "You have outreach messaging ready (what you'll say)",
    "You have a daily/weekly action plan for the next 30 days",
    "You've identified at least 20 specific people or businesses who could be your first customers",
  ],
  commonMistakes: [
    "Being too shy to reach out — successful founders are bold about asking for customers",
    "Bad targeting — if you reach the wrong people, they won't buy no matter how good your offer is",
    "Giving up too fast — most people need 5-8 touches before they buy. Persist.",
  ],
};

export const FOLLOWUP_GUIDANCE: StepGuidance = {
  stepId: "step-followup",
  title: "Build Your Follow-Up Email Sequence",
  whyDoThis:
    "Most people say 'no' the first time, not because they don't want your product, but because they're busy. Following up (without being annoying) is the key to closing sales.",
  simplifiedDescription:
    "You'll create 5 emails that go out over 2 weeks. Each email has a different job: Email 1 introduces you, Email 2 gives free value, Email 3 handles objections, Email 4 shares proof, Email 5 asks for the sale.",
  estimatedTime: 15,
  executionOptions: [
    {
      type: "tool",
      label: "Generate Sequence",
      description: "Tell Nova about your business and target customer. Get 5 ready-to-send follow-up emails.",
      action: {
        text: "Open Follow-Up Sequence",
        href: "/app/launchpad/followup",
      },
    },
    {
      type: "manual",
      label: "Write Emails Yourself",
      description:
        "Email 1: Intro (who you are, why you're reaching out). Email 2: Value (free tip relevant to them). Email 3: Objection (address their top concern). Email 4: Proof (testimonial or case study). Email 5: Ask (clear ask for sale).",
      action: {
        text: "See Email Sequence Template",
      },
    },
  ],
  successCriteria: [
    "You have 5 emails written and ready to send",
    "You've set up these emails as templates in your email tool",
    "Each email has a clear purpose (intro, value, objection, proof, ask)",
    "You have a schedule for when each email goes out (usually every 3 days)",
  ],
  commonMistakes: [
    "Making emails too long — each email should be 3-4 sentences max",
    "Not personalizing — change the person's name and at least one specific detail in each email",
    "Too many sales pitches — only the last email should be a hard sell. Earlier emails build trust.",
  ],
};

export const OPERATIONS_PLAN_GUIDANCE: StepGuidance = {
  stepId: "step-operations-plan",
  title: "Design Your Operations Plan",
  whyDoThis:
    "An operations plan is like the instruction manual for your business. It shows how everything actually works, who does what, and where you can save time.",
  simplifiedDescription:
    "You'll document: (1) how you get customers, (2) how you deliver your product/service, (3) how you get paid, (4) your team roles, and (5) what you can automate.",
  estimatedTime: 20,
  executionOptions: [
    {
      type: "tool",
      label: "Generate with Nova",
      description:
        "Describe how your business currently works. Nova will create a structured plan with processes, roles, tools, and automation ideas.",
      action: {
        text: "Open Operations Plan",
        href: "/app/launchpad/ops-plan",
      },
    },
    {
      type: "manual",
      label: "Map Manually",
      description:
        "Create a simple flowchart: Customer → (sales process) → Delivery → Payment → Support. Write down every step and who does it.",
      action: {
        text: "See Flowchart Template",
      },
    },
  ],
  successCriteria: [
    "You have documented your core business process (how you get customers and deliver)",
    "You know exactly what you do every week (and how long each task takes)",
    "You've identified at least 3 tasks you could automate or delegate",
    "You have a clear list of tools you're using and why",
  ],
  commonMistakes: [
    "Only documenting what SHOULD happen, not what ACTUALLY happens — be honest about the messy parts",
    "Forgetting hidden tasks — track everything you do for one week and write it down",
    "Not identifying delegation opportunities — this plan is how you eventually get other people to do your work",
  ],
};

// ── GUIDANCE LOOKUP ────────────────────────────────────────────────

const GUIDANCE_MAP: Record<string, StepGuidance> = {
  "idea-validator": IDEA_VALIDATOR_GUIDANCE,
  "kill-my-idea": KILL_MY_IDEA_GUIDANCE,
  "pitch-generator": PITCH_GENERATOR_GUIDANCE,
  "gtm-strategy": GTM_STRATEGY_GUIDANCE,
  offer: OFFER_BUILDER_GUIDANCE,
  "first-10-customers": FIRST_10_CUSTOMERS_GUIDANCE,
  followup: FOLLOWUP_GUIDANCE,
  "generate-ops-plan": OPERATIONS_PLAN_GUIDANCE,
};

export function getStepGuidance(toolKey: string | null): StepGuidance | null {
  if (!toolKey) return null;
  return GUIDANCE_MAP[toolKey] ?? null;
}

export function getGuidanceForStep(stepTitle: string, toolKey: string | null): StepGuidance | null {
  if (toolKey) {
    return getStepGuidance(toolKey);
  }
  // For manual steps, we could add guidance based on title patterns
  return null;
}
