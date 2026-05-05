/**
 * Client-side AI tool runner — calls Anthropic API directly from the browser.
 * Supports both streaming (word-by-word) and standard modes.
 */

import { supabase } from "@/integrations/supabase/client";

const ANTHROPIC_BASE = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

type Schema = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
};

type ToolDef = {
  toolKey: string;
  systemPrompt: string;
  buildUserPrompt: (input: Record<string, unknown>) => string;
  schema: Schema;
  assetCategory: string;
  assetTitle: (input: Record<string, unknown>, output: Record<string, unknown>) => string;
};

// ─── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS: Record<string, ToolDef> = {
  "validate-idea": {
    toolKey: "validate-idea",
    systemPrompt: `You are a senior startup analyst with 15 years experience evaluating thousands of business ideas for top-tier accelerators. You combine the analytical rigor of a McKinsey consultant with the market intuition of a serial founder.

Your job is to pressure-test ideas with brutal honesty AND actionable insight. You:
- Reference real market dynamics, not generic platitudes
- Call out assumptions founders make without evidence
- Identify the one or two genuine strengths worth building on
- Give a score that reflects reality, not optimism
- Always end with concrete next steps the founder can execute this week

Never be sycophantic. A score of 40 is useful. A score of 95 is suspicious.`,
    buildUserPrompt: (i) =>
      `Validate this business idea with maximum depth and rigor:

Idea: ${i.idea || i.context}
Target customer: ${i.target_customer || i.target || "Not specified"}
Market/Niche: ${i.niche || "Not specified"}

Give me a complete, no-BS validation. I need to know if this is worth my next 5 years.`,
    schema: {
      name: "validate_idea",
      description: "Return a comprehensive, structured validation of a business idea.",
      input_schema: {
        type: "object",
        properties: {
          score: {
            type: "number",
            description: "0-100 overall viability score. Be accurate, not generous.",
          },
          verdict: {
            type: "string",
            description:
              "One punchy sentence verdict (e.g. 'Strong niche play with defensibility risk — worth validating in 90 days')",
          },
          summary: {
            type: "string",
            description: "2-3 sentence honest summary of the idea's potential",
          },
          strengths: {
            type: "array",
            items: { type: "string" },
            description: "2-4 genuine strengths with specific reasoning",
          },
          weaknesses: {
            type: "array",
            items: { type: "string" },
            description: "2-4 real weaknesses founders often underestimate",
          },
          risks: {
            type: "array",
            items: { type: "string" },
            description: "3-5 specific risks — market, execution, timing, competition",
          },
          market_size: {
            type: "string",
            description: "Honest estimate of addressable market with reasoning",
          },
          competition: {
            type: "string",
            description: "Who already does this and how saturated is the space",
          },
          differentiation_angle: {
            type: "string",
            description: "The one angle that could make this actually work",
          },
          recommendation: {
            type: "string",
            description: "What the founder should do in the next 30 days",
          },
          next_steps: {
            type: "array",
            items: { type: "string" },
            description: "5 specific, actionable next steps to validate before spending money",
          },
        },
        required: [
          "score",
          "verdict",
          "summary",
          "strengths",
          "weaknesses",
          "risks",
          "market_size",
          "competition",
          "differentiation_angle",
          "recommendation",
          "next_steps",
        ],
      },
    },
    assetCategory: "validation",
    assetTitle: (i) => `Validation: ${String(i.idea || i.context || "Untitled idea").slice(0, 60)}`,
  },

  "generate-pitch": {
    toolKey: "generate-pitch",
    systemPrompt: `You are a world-class pitch deck copywriter who has helped founders raise $500M+ across 200+ companies. You've written pitches for YC companies, Sequoia-backed startups, and bootstrapped SaaS businesses.

You understand that a great pitch is not about features — it's about the story of why now, why this team, why this market. Every sentence must either:
1. Establish a problem that creates urgency
2. Position the solution as inevitable
3. Build credibility
4. Drive the investor toward one clear next step

Your pitches are crisp, emotionally resonant, and backed by concrete numbers wherever possible.`,
    buildUserPrompt: (i) =>
      `Create a full investor-ready pitch for this business:

Business: ${i.business || i.context || ""}
Target customer: ${i.target || "Not specified"}
Core offer/product: ${i.offer || "Not specified"}
Traction/stage: ${i.traction || "Pre-traction"}

Write a pitch that makes an investor lean forward. Be specific. Use real language, not buzzwords.`,
    schema: {
      name: "generate_pitch",
      description: "Return a structured, investor-ready pitch.",
      input_schema: {
        type: "object",
        properties: {
          headline: { type: "string", description: "The one-liner that hooks them in 5 seconds" },
          the_hook: {
            type: "string",
            description: "Opening 2-3 sentences that establish the pain — should feel visceral",
          },
          problem: {
            type: "string",
            description: "The problem in full — why it matters, who it affects, what it costs",
          },
          solution: {
            type: "string",
            description: "How the product solves it — clear, jargon-free",
          },
          why_now: {
            type: "string",
            description: "The tailwind — why this moment is uniquely right for this idea",
          },
          traction: { type: "string", description: "What proof exists — or what to build toward" },
          market: {
            type: "string",
            description: "TAM/SAM/SOM with specific numbers and reasoning",
          },
          business_model: {
            type: "string",
            description: "How money is made, with unit economics if possible",
          },
          competitive_edge: {
            type: "string",
            description: "The moat — what makes this defensible over 3-5 years",
          },
          team: {
            type: "string",
            description: "Why this founder/team is uniquely positioned to win",
          },
          ask: {
            type: "string",
            description: "The raise amount, use of funds, and 18-month target",
          },
          cta: { type: "string", description: "The closing line that drives action" },
          elevator_pitch: {
            type: "string",
            description: "The 30-second version — for networking events and warm intros",
          },
        },
        required: [
          "headline",
          "the_hook",
          "problem",
          "solution",
          "why_now",
          "market",
          "business_model",
          "competitive_edge",
          "ask",
          "cta",
          "elevator_pitch",
        ],
      },
    },
    assetCategory: "pitch",
    assetTitle: (i) => `Pitch: ${String(i.business || i.context || "Untitled").slice(0, 60)}`,
  },

  "generate-gtm-strategy": {
    toolKey: "generate-gtm-strategy",
    systemPrompt: `You are a GTM (go-to-market) strategist who has launched 50+ B2B and B2C companies from zero to first revenue. You've led growth at Series A companies and consulted for YC W23 and S23 cohorts.

Your GTM plans are characterized by:
- Ruthless prioritization of 1-2 channels instead of spreading thin
- Specific ICPs with firmographic/psychographic detail
- Messaging that speaks to the buyer's real fears and ambitions
- Time-boxed phases with measurable outcomes
- Honest assessment of which channels take too long for early-stage

You avoid generic advice like "post on LinkedIn" without channel-specific tactics.`,
    buildUserPrompt: (i) =>
      `Build a comprehensive GTM strategy for:

Business: ${i.business || i.context || ""}
Core offer: ${i.offer || "Not specified"}
Target buyer: ${i.target || "Not specified"}
90-day goal: ${i.goal || "First 10 customers and $10K MRR"}
Budget stage: ${i.budget || "Bootstrapped/pre-seed"}

Give me a GTM plan I can execute starting Monday. Prioritize ruthlessly.`,
    schema: {
      name: "generate_gtm",
      description: "Return a structured, actionable GTM plan.",
      input_schema: {
        type: "object",
        properties: {
          icp: {
            type: "string",
            description:
              "Ideal Customer Profile — specific firmographics, psychographics, pain triggers, and buying signals",
          },
          positioning: {
            type: "string",
            description:
              "The positioning statement — for which [ICP], [product] is the [category] that [benefit] unlike [alternative]",
          },
          core_message: {
            type: "string",
            description: "The one sentence that captures why buyers should care",
          },
          channels: {
            type: "array",
            items: {
              type: "object",
              properties: {
                channel: { type: "string" },
                rationale: {
                  type: "string",
                  description: "Why this channel for this specific business",
                },
                tactics: {
                  type: "array",
                  items: { type: "string" },
                  description: "3-5 specific tactics for this channel",
                },
                expected_timeline: { type: "string" },
                estimated_cac: { type: "string" },
              },
              required: ["channel", "rationale", "tactics", "expected_timeline"],
            },
            description: "Top 2-3 prioritized channels with rationale",
          },
          phases: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                timeframe: { type: "string" },
                goal: { type: "string" },
                actions: { type: "array", items: { type: "string" } },
                success_metric: { type: "string" },
              },
              required: ["name", "timeframe", "goal", "actions", "success_metric"],
            },
            description: "3 phases: weeks 1-4, months 2-3, months 4-6",
          },
          messaging_angles: {
            type: "array",
            items: { type: "string" },
            description: "3-4 specific messaging angles to A/B test",
          },
          what_not_to_do: {
            type: "array",
            items: { type: "string" },
            description: "2-3 common GTM mistakes to avoid for this specific business",
          },
          week_one_actions: {
            type: "array",
            items: { type: "string" },
            description: "5 things to do in the first 7 days",
          },
        },
        required: [
          "icp",
          "positioning",
          "core_message",
          "channels",
          "phases",
          "messaging_angles",
          "what_not_to_do",
          "week_one_actions",
        ],
      },
    },
    assetCategory: "gtm",
    assetTitle: (i) => `GTM: ${String(i.business || i.context || "Plan").slice(0, 60)}`,
  },

  "generate-offer": {
    toolKey: "generate-offer",
    systemPrompt: `You are an offer architect trained in the Alex Hormozi $100M Offers methodology, with additional expertise in behavioral economics and B2B SaaS pricing.

You design offers that are impossible to say no to by:
- Stacking value until the price seems ridiculous
- Structuring guarantees that eliminate perceived risk
- Creating urgency and scarcity that isn't manufactured
- Naming the offer to signal transformation, not features
- Pricing based on outcomes delivered, not time spent

You know that a bad offer at any price won't sell, and a great offer at a premium price will.`,
    buildUserPrompt: (i) =>
      `Design an irresistible offer for:

Business/Service: ${i.business || i.context || ""}
Target customer: ${i.target || "Not specified"}
Desired transformation/outcome: ${i.outcome || i.goal || "Not specified"}
Current pricing (if any): ${i.current_price || "Not set"}

Build an offer architecture that makes saying no feel like leaving money on the table.`,
    schema: {
      name: "generate_offer",
      description: "Return a structured, psychology-driven offer.",
      input_schema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The offer name — transformation-focused, not feature-focused",
          },
          promise: {
            type: "string",
            description: "The bold, specific promise — what outcome is guaranteed",
          },
          dream_outcome: {
            type: "string",
            description: "Paint the vivid picture of life after the offer",
          },
          deliverables: {
            type: "array",
            items: { type: "string" },
            description: "Every specific thing included — use vivid language, not bullets",
          },
          bonuses: {
            type: "array",
            items: { type: "string" },
            description: "2-3 high-perceived-value bonuses that make the offer feel like a steal",
          },
          price_anchor: {
            type: "string",
            description: "What it would cost to get this outcome elsewhere — creates contrast",
          },
          price_recommendation: { type: "string", description: "Recommended price with reasoning" },
          guarantee: {
            type: "string",
            description: "The specific guarantee — remove all perceived risk",
          },
          urgency_scarcity: {
            type: "string",
            description: "Real reason to act now — not manufactured fake urgency",
          },
          positioning_line: {
            type: "string",
            description: "The one sentence that positions this vs every alternative",
          },
          objection_crushers: {
            type: "array",
            items: { type: "string" },
            description: "The top 3 objections and how the offer architecture handles each",
          },
        },
        required: [
          "name",
          "promise",
          "dream_outcome",
          "deliverables",
          "bonuses",
          "price_anchor",
          "price_recommendation",
          "guarantee",
          "urgency_scarcity",
          "positioning_line",
          "objection_crushers",
        ],
      },
    },
    assetCategory: "offer",
    assetTitle: (_i, o) => `Offer: ${String(o.name || "Untitled").slice(0, 60)}`,
  },

  "generate-ops-plan": {
    toolKey: "generate-ops-plan",
    systemPrompt: `You are an operations consultant with deep expertise in designing systems for sub-$10M companies. You've helped 100+ founders go from chaos to clarity by building the right workflows, automations, and hiring sequences.

You specialize in:
- No-code/low-code automation using Make, Zapier, n8n, and Airtable
- Systems that work without a COO
- KPIs that founders actually track weekly
- Delegation frameworks that work before you can afford a full team
- Ops that scale from 1 to 10 employees without rebuilding`,
    buildUserPrompt: (i) =>
      `Build an operations plan for:

Business: ${i.business || i.context || ""}
Team size: ${i.team_size || "Solo or very small"}
Biggest operational pain: ${i.pains || i.context || "Not specified"}
Revenue stage: ${i.revenue || "Pre-revenue or early"}

Give me a concrete ops system I can start implementing this week.`,
    schema: {
      name: "generate_ops",
      description: "Return a structured operational plan.",
      input_schema: {
        type: "object",
        properties: {
          north_star_kpi: {
            type: "string",
            description: "The single metric that drives everything else",
          },
          core_workflows: {
            type: "array",
            items: {
              type: "object",
              properties: {
                workflow: { type: "string" },
                trigger: { type: "string" },
                steps: { type: "array", items: { type: "string" } },
                owner: { type: "string" },
                tool: { type: "string" },
              },
              required: ["workflow", "trigger", "steps", "owner", "tool"],
            },
            description: "3-5 mission-critical workflows",
          },
          automations: {
            type: "array",
            items: { type: "string" },
            description: "Specific automations to build — include the tool and trigger",
          },
          weekly_rhythm: {
            type: "array",
            items: { type: "string" },
            description: "The recurring weekly operating cadence",
          },
          kpis: {
            type: "array",
            items: { type: "string" },
            description: "5-7 KPIs to track weekly — specific and measurable",
          },
          first_hire: { type: "string", description: "Who to hire first and what to hand off" },
          tools_stack: {
            type: "array",
            items: { type: "string" },
            description: "Recommended tech stack — lean and effective",
          },
          quick_wins: {
            type: "array",
            items: { type: "string" },
            description: "3 ops improvements you can implement in under a week",
          },
        },
        required: [
          "north_star_kpi",
          "core_workflows",
          "automations",
          "weekly_rhythm",
          "kpis",
          "first_hire",
          "tools_stack",
          "quick_wins",
        ],
      },
    },
    assetCategory: "ops",
    assetTitle: (i) => `Ops Plan: ${String(i.business || i.context || "Untitled").slice(0, 60)}`,
  },

  "generate-followup-sequence": {
    toolKey: "generate-followup-sequence",
    systemPrompt: `You are a sales enablement expert who has built multi-million dollar revenue machines using precisely engineered follow-up sequences. You've worked with B2B SaaS, service businesses, and e-commerce.

Your sequences are built on behavioral psychology principles:
- Pattern interrupts that break through inbox blindness
- Value-add touches before asks
- Social proof woven naturally into each message
- Clear and escalating calls to action
- The "breakup email" that paradoxically gets the highest reply rates

You write for busy buyers who delete most emails. Every word earns its place.`,
    buildUserPrompt: (i) =>
      `Build a high-converting follow-up sequence for:

Context: ${i.context || ""}
Prospect situation: ${i.goal || "Not specified"}
Channel preference: ${i.channels || "Email primarily"}
What they showed interest in: ${i.interest || i.context || ""}

Write real, deployable copy — not templates with [BRACKETS]. Use natural language.`,
    schema: {
      name: "generate_followup",
      description: "Return a structured, ready-to-deploy follow-up sequence.",
      input_schema: {
        type: "object",
        properties: {
          sequence_strategy: {
            type: "string",
            description: "The psychological approach and why it works for this situation",
          },
          sequence: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "number" },
                channel: { type: "string" },
                subject: { type: "string" },
                body: { type: "string" },
                goal: { type: "string", description: "What this touch is trying to achieve" },
                why_it_works: { type: "string" },
              },
              required: ["day", "channel", "subject", "body", "goal"],
            },
          },
          reply_handlers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                reply_type: { type: "string" },
                response: { type: "string" },
              },
              required: ["reply_type", "response"],
            },
            description: "How to handle different reply types",
          },
          success_metrics: { type: "array", items: { type: "string" } },
        },
        required: ["sequence_strategy", "sequence", "reply_handlers", "success_metrics"],
      },
    },
    assetCategory: "followup",
    assetTitle: (i) => `Follow-up: ${String(i.goal || i.context || "Sequence").slice(0, 60)}`,
  },

  "analyze-website": {
    toolKey: "analyze-website",
    systemPrompt: `You are a conversion rate optimization (CRO) expert with deep knowledge of UX, copywriting, SEO, and web analytics. You've audited 500+ websites and helped companies increase conversion rates by 40-300%.

Your audits go beyond generic advice. You:
- Identify the specific above-the-fold issues that kill 70% of conversions
- Call out copywriting that doesn't match what buyers actually search for
- Spot trust signal gaps that create subconscious doubt
- Find speed and technical issues that kill Google rankings
- Prioritize recommendations by impact vs. effort

You think like a buyer, not a designer.`,
    buildUserPrompt: (i) =>
      `Audit this website for conversion, UX, and SEO:

URL or description: ${i.url || i.context || ""}
Business: ${i.business || ""}
Target visitor: ${i.target || "Not specified"}
Primary conversion goal: ${i.goal || "Not specified"}

Give me an audit that tells me exactly what to fix first and why it's killing conversions.`,
    schema: {
      name: "analyze_website",
      description: "Return a structured, actionable website audit.",
      input_schema: {
        type: "object",
        properties: {
          overall_grade: {
            type: "string",
            description: "Letter grade: A/B/C/D/F with brief reasoning",
          },
          conversion_killers: {
            type: "array",
            items: { type: "string" },
            description: "Top issues that are actively losing conversions — brutal honesty",
          },
          above_the_fold: {
            type: "string",
            description: "Detailed analysis of what a visitor sees in the first 5 seconds",
          },
          copy_analysis: {
            type: "string",
            description: "Is the copy speaking to buyer desires or feature-bragging?",
          },
          trust_signals: {
            type: "array",
            items: { type: "string" },
            description: "Missing trust elements that create subconscious doubt",
          },
          ux_issues: {
            type: "string",
            description: "Navigation, friction points, and user confusion areas",
          },
          seo_notes: { type: "string", description: "Technical and content SEO opportunities" },
          opportunities: {
            type: "array",
            items: { type: "string" },
            description: "Quick wins and bigger opportunities in priority order",
          },
          priority_fixes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                fix: { type: "string" },
                impact: { type: "string", enum: ["High", "Medium", "Low"] },
                effort: { type: "string", enum: ["Quick win", "1-3 days", "1-2 weeks"] },
                why: { type: "string" },
              },
              required: ["fix", "impact", "effort", "why"],
            },
          },
          rewrite_suggestion: {
            type: "string",
            description: "A suggested rewrite of the main headline + subheadline",
          },
        },
        required: [
          "overall_grade",
          "conversion_killers",
          "above_the_fold",
          "copy_analysis",
          "trust_signals",
          "ux_issues",
          "seo_notes",
          "opportunities",
          "priority_fixes",
        ],
      },
    },
    assetCategory: "website-audit",
    assetTitle: (i) => `Website Audit: ${String(i.url || i.context || "Untitled").slice(0, 60)}`,
  },

  "kill-my-idea": {
    toolKey: "kill-my-idea",
    systemPrompt: `You are the most feared critic in the startup world — a seasoned VC partner who has seen 10,000 pitches and watched 9,700 fail. You've lived through every startup failure pattern: the product in search of a market, the technology looking for a problem, the "we'll figure out distribution later" graveyard.

Your job is NOT to encourage. Your job is to find every fatal flaw before the founder wastes 3 years of their life.

Your rules:
- Reference SPECIFIC failure patterns from real market history
- Challenge EVERY assumption the founder didn't explicitly validate
- Find the fatal flaw that kills 90% of ideas in this category
- Be direct and specific — "this market is competitive" is useless. "Salesforce has 3 products that do exactly this and they bundle it free with Enterprise contracts" is useful
- Always end with "the pivot that could save this" — because you're not heartless, just honest
- A survival_score below 40 is common and honest. Above 80 is extremely rare.`,
    buildUserPrompt: (i) =>
      `Destroy this startup idea with maximum rigor:

Idea: ${i.idea || i.context}
Business context: ${i.business || "n/a"}

Find every reason this fails. Be specific. Reference real market dynamics. Then tell me what would have to be true for this to actually work.`,
    schema: {
      name: "kill_idea",
      description: "Return a brutally honest critical analysis.",
      input_schema: {
        type: "object",
        properties: {
          survival_score: {
            type: "number",
            description: "0-100 survival probability. Be honest. Most ideas score 25-50.",
          },
          verdict: { type: "string", description: "The harsh verdict in 2-3 sentences" },
          the_kill_shot: {
            type: "string",
            description: "The single biggest reason this fails — the fatal flaw",
          },
          fatal_flaws: {
            type: "array",
            items: { type: "string" },
            description: "3-5 specific fatal flaws with real reasoning",
          },
          dangerous_assumptions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                assumption: { type: "string" },
                why_dangerous: { type: "string" },
                reality_check: { type: "string" },
              },
              required: ["assumption", "why_dangerous", "reality_check"],
            },
            description: "The hidden assumptions the founder hasn't validated",
          },
          market_risks: {
            type: "array",
            items: { type: "string" },
            description: "Market-specific risks — competition, timing, regulation, behavior change",
          },
          execution_risks: {
            type: "array",
            items: { type: "string" },
            description: "Operational and team risks",
          },
          the_pivot_that_saves_it: {
            type: "string",
            description:
              "The version of this idea that could actually work — the adjacent possible",
          },
          if_you_proceed: {
            type: "array",
            items: { type: "string" },
            description: "If you're ignoring all of this, at least do these 4 things first",
          },
        },
        required: [
          "survival_score",
          "verdict",
          "the_kill_shot",
          "fatal_flaws",
          "dangerous_assumptions",
          "market_risks",
          "execution_risks",
          "the_pivot_that_saves_it",
          "if_you_proceed",
        ],
      },
    },
    assetCategory: "kill-analysis",
    assetTitle: (i) =>
      `Kill Analysis: ${String(i.idea || i.context || "Untitled idea").slice(0, 60)}`,
  },

  "funding-score": {
    toolKey: "funding-score",
    systemPrompt: `You are a General Partner at a top-tier venture capital firm with $2B AUM. You've evaluated 5,000+ startups, led 40 investments, and sat on 15 boards. You understand exactly what makes a venture-backable business versus a great lifestyle business.

Your scoring is based on the actual criteria used in VC investment memos:
- Market size (TAM/SAM not just addressable, but winnable)
- Timing (what secular trends make this inevitable NOW)
- Team/founder-market fit
- Defensibility and moat building over time
- Traction signals and revenue quality
- Unit economics potential at scale

You are honest about whether a business should seek VC at all — many great businesses are not VC-appropriate.`,
    buildUserPrompt: (i) =>
      `Score the VC investability of this startup with full rigor:

Startup description: ${i.idea || i.context}
Current stage/traction: ${i.traction || "Early stage"}
Founder background: ${i.founder || "Not specified"}
Revenue model: ${i.business || "Not specified"}

Give me a complete investment memo-style assessment. Tell me if this is venture-scale or not, and why.`,
    schema: {
      name: "funding_score",
      description: "Return a comprehensive VC-style investability assessment.",
      input_schema: {
        type: "object",
        properties: {
          overall_score: {
            type: "number",
            description:
              "0-100 venture investability score. Average fundable startup: 60-70. Top 1%: 85+.",
          },
          verdict: {
            type: "string",
            description: "The investment thesis in 2-3 sentences — would you fund this?",
          },
          vc_appropriate: {
            type: "boolean",
            description: "Is this a venture-scale business or should it bootstrap?",
          },
          market_score: {
            type: "number",
            description: "0-100 — market size, growth rate, and win-ability",
          },
          timing_score: {
            type: "number",
            description: "0-100 — is this the right moment? What tailwinds exist?",
          },
          defensibility_score: {
            type: "number",
            description: "0-100 — moat, switching costs, network effects, data advantages",
          },
          founder_fit_score: {
            type: "number",
            description: "0-100 — founder-market fit, execution credibility",
          },
          traction_score: {
            type: "number",
            description: "0-100 — signals of market pull and product-market fit",
          },
          bull_case: {
            type: "string",
            description: "The scenario where this becomes a $1B company",
          },
          bear_case: {
            type: "string",
            description: "The realistic scenario where this fails or plateaus",
          },
          strengths: {
            type: "array",
            items: { type: "string" },
            description: "What makes investors lean forward",
          },
          red_flags: {
            type: "array",
            items: { type: "string" },
            description: "What makes investors pass immediately",
          },
          what_changes_the_verdict: {
            type: "array",
            items: { type: "string" },
            description: "What traction/milestones would dramatically improve fundability",
          },
          comparable_companies: {
            type: "array",
            items: { type: "string" },
            description: "Comparable funded companies and their outcomes",
          },
          funding_stage_fit: {
            type: "string",
            description: "What stage of funding is realistic right now and why",
          },
        },
        required: [
          "overall_score",
          "verdict",
          "vc_appropriate",
          "market_score",
          "timing_score",
          "defensibility_score",
          "founder_fit_score",
          "traction_score",
          "bull_case",
          "bear_case",
          "strengths",
          "red_flags",
          "what_changes_the_verdict",
          "comparable_companies",
          "funding_stage_fit",
        ],
      },
    },
    assetCategory: "funding-score",
    assetTitle: (i) => `Funding Score: ${String(i.idea || i.context || "Untitled").slice(0, 60)}`,
  },

  "first-10-customers": {
    toolKey: "first-10-customers",
    systemPrompt: `You are a legendary early-stage sales strategist who has helped 200+ startups land their first 10, 100, and 1000 customers. You've worked with B2B SaaS, professional services, marketplaces, and consumer companies.

You know that the first 10 customers are won completely differently from the next 1000:
- They're won through relationships, not funnels
- They're won by being in rooms, not by running ads
- They require founder-led selling, not SDRs
- They require a 10x personal touch, not automation
- They're won by solving one painful problem perfectly, not many problems adequately

Your roadmaps are specific, week-by-week, and include actual scripts and templates.`,
    buildUserPrompt: (i) =>
      `Build a complete first-10-customers acquisition plan for:

Business: ${i.business || i.context}
Target customer: ${i.target || "Not specified"}
Price point: ${i.price || "Not specified"}
Current network/advantages: ${i.advantages || "None specified"}

Give me a specific, executable plan. I want to know exactly where to go, what to say, and how to close each of the first 10.`,
    schema: {
      name: "first_ten_customers",
      description: "Return a tactical roadmap to the first 10 paying customers.",
      input_schema: {
        type: "object",
        properties: {
          target_profile: {
            type: "string",
            description:
              "Hyper-specific first customer profile — demographics, psychographics, situation, and buying trigger",
          },
          where_to_find_them: {
            type: "array",
            items: {
              type: "object",
              properties: {
                channel: { type: "string" },
                specific_places: { type: "array", items: { type: "string" } },
                how_to_approach: { type: "string" },
              },
              required: ["channel", "specific_places", "how_to_approach"],
            },
          },
          outreach_script: {
            type: "string",
            description:
              "Word-for-word cold outreach DM/email — natural language, not a template. Include subject line.",
          },
          discovery_call_guide: {
            type: "string",
            description: "The 5-question discovery script that reveals buying intent",
          },
          weekly_plan: {
            type: "array",
            items: {
              type: "object",
              properties: {
                week: { type: "string" },
                goal: { type: "string" },
                daily_actions: { type: "array", items: { type: "string" } },
                success_signal: { type: "string" },
              },
              required: ["week", "goal", "daily_actions", "success_signal"],
            },
            description: "4-week week-by-week plan",
          },
          conversion_tactics: {
            type: "array",
            items: { type: "string" },
            description: "Specific tactics to close the deal — founder-specific advantages",
          },
          common_objections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                objection: { type: "string" },
                reality: { type: "string" },
                reframe: { type: "string" },
              },
              required: ["objection", "reality", "reframe"],
            },
          },
          the_secret_channel: {
            type: "string",
            description: "The non-obvious channel most founders overlook for this specific market",
          },
        },
        required: [
          "target_profile",
          "where_to_find_them",
          "outreach_script",
          "discovery_call_guide",
          "weekly_plan",
          "conversion_tactics",
          "common_objections",
          "the_secret_channel",
        ],
      },
    },
    assetCategory: "customer-acquisition",
    assetTitle: (i) =>
      `First 10 Customers: ${String(i.business || i.context || "Untitled").slice(0, 60)}`,
  },

  "business-plan": {
    toolKey: "business-plan",
    systemPrompt: `You are a business plan expert and startup advisor who has helped founders raise $100M+ and written plans for SBA loans, angel rounds, accelerator applications, and board presentations.

You write business plans that are:
- Built for the reader — investors want to see market understanding, operators want to see execution clarity
- Honest about risks — unrealistic projections destroy credibility
- Concise but complete — no fluff, every section earns its place
- Forward-looking with concrete milestones that show you understand the journey

You know the difference between a business plan that gets funded and one that collects dust.`,
    buildUserPrompt: (i) =>
      `Write a comprehensive business plan for:

Business: ${i.business || i.context}
Target market: ${i.target || "Not specified"}
Revenue goal: ${i.goal || "Not specified"}
Stage: ${i.stage || "Early stage"}

Write a plan I could hand to an investor or bank tomorrow. Be realistic about the numbers.`,
    schema: {
      name: "business_plan",
      description: "Return a structured, comprehensive business plan.",
      input_schema: {
        type: "object",
        properties: {
          executive_summary: {
            type: "string",
            description: "The one-page summary — problem, solution, market, model, traction, ask",
          },
          problem: {
            type: "string",
            description: "The problem statement — specific, evidenced, and urgent",
          },
          solution: {
            type: "string",
            description: "How the product/service solves it — clear mechanism of value",
          },
          target_market: {
            type: "string",
            description: "Primary and secondary markets with TAM/SAM/SOM estimates",
          },
          business_model: {
            type: "string",
            description: "Revenue model with pricing tiers and unit economics",
          },
          competitive_landscape: {
            type: "string",
            description: "Who else is solving this and how you win",
          },
          competitive_advantage: {
            type: "string",
            description: "Your sustainable moat — why competitors can't easily copy",
          },
          go_to_market: {
            type: "string",
            description: "First 12 months of customer acquisition — channels, costs, expectations",
          },
          revenue_streams: {
            type: "array",
            items: { type: "string" },
            description: "All revenue streams with rough % contribution",
          },
          financial_projections: {
            type: "object",
            properties: {
              year_1_mrr_target: { type: "string" },
              year_2_arr_target: { type: "string" },
              year_3_arr_target: { type: "string" },
              key_assumptions: { type: "array", items: { type: "string" } },
              breakeven_timeline: { type: "string" },
            },
            required: ["year_1_mrr_target", "year_2_arr_target", "key_assumptions"],
          },
          key_milestones: {
            type: "array",
            items: {
              type: "object",
              properties: {
                milestone: { type: "string" },
                timeline: { type: "string" },
                how: { type: "string" },
              },
              required: ["milestone", "timeline", "how"],
            },
          },
          team: {
            type: "string",
            description: "Who is building this and why they're the right people",
          },
          risks_and_mitigations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                risk: { type: "string" },
                mitigation: { type: "string" },
              },
              required: ["risk", "mitigation"],
            },
          },
          ask: {
            type: "string",
            description: "What you need — funding, partnerships, advisors — and what it unlocks",
          },
        },
        required: [
          "executive_summary",
          "problem",
          "solution",
          "target_market",
          "business_model",
          "competitive_advantage",
          "go_to_market",
          "revenue_streams",
          "financial_projections",
          "key_milestones",
          "risks_and_mitigations",
          "ask",
        ],
      },
    },
    assetCategory: "business-plan",
    assetTitle: (i) =>
      `Business Plan: ${String(i.business || i.context || "Untitled").slice(0, 60)}`,
  },

  "investor-emails": {
    toolKey: "investor-emails",
    systemPrompt: `You are the most effective fundraising email writer in Silicon Valley. You've helped founders at YC, Techstars, and independent startups craft cold investor emails that achieved 35-50% reply rates (industry average: 3-5%).

Your emails succeed because:
- They lead with the most compelling metric or insight, not the pitch
- They demonstrate founder credibility without bragging
- They ask for something small (a call) not something big (investment)
- They're short — under 150 words for the cold email
- They feel personal even when scaled
- They create genuine curiosity, not hype

You know that the subject line determines 90% of open rate. You write 3-4 options per email.`,
    buildUserPrompt: (i) =>
      `Write a complete investor outreach sequence for:

Business: ${i.business || i.context}
Stage/round: ${i.target || i.goal || "Pre-seed or seed"}
Key metric/traction: ${i.traction || "Early stage"}
Ideal investor type: ${i.investor_type || "Generalist seed stage"}

Write emails I could send Monday morning. Make them feel personal and specific, not like a blast.`,
    schema: {
      name: "investor_emails",
      description: "Return a complete investor outreach email sequence.",
      input_schema: {
        type: "object",
        properties: {
          strategy_note: {
            type: "string",
            description: "The psychological approach — why these emails are structured this way",
          },
          subject_lines: {
            type: "array",
            items: { type: "string" },
            description: "4 subject line options with different hooks",
          },
          cold_email: {
            type: "object",
            properties: {
              subject: { type: "string" },
              body: {
                type: "string",
                description: "Under 150 words. Lead with the hook, not the pitch.",
              },
              ps_line: {
                type: "string",
                description: "Optional PS — often the most read part of an email",
              },
            },
            required: ["subject", "body"],
          },
          follow_up_1: {
            type: "object",
            properties: {
              subject: { type: "string" },
              body: { type: "string" },
              timing: { type: "string" },
              strategy: {
                type: "string",
                description: "Why this specific approach for follow-up 1",
              },
            },
            required: ["subject", "body", "timing", "strategy"],
          },
          follow_up_2: {
            type: "object",
            properties: {
              subject: { type: "string" },
              body: { type: "string" },
              timing: { type: "string" },
              strategy: { type: "string" },
            },
            required: ["subject", "body", "timing", "strategy"],
          },
          breakup_email: {
            type: "object",
            properties: {
              subject: { type: "string" },
              body: { type: "string" },
              timing: { type: "string" },
            },
            required: ["subject", "body", "timing"],
          },
          personalization_hooks: {
            type: "array",
            items: { type: "string" },
            description: "Specific things to research about each investor before sending",
          },
          dos_and_donts: { type: "array", items: { type: "string" } },
        },
        required: [
          "strategy_note",
          "subject_lines",
          "cold_email",
          "follow_up_1",
          "follow_up_2",
          "breakup_email",
          "personalization_hooks",
          "dos_and_donts",
        ],
      },
    },
    assetCategory: "investor-emails",
    assetTitle: (i) =>
      `Investor Emails: ${String(i.business || i.context || "Untitled").slice(0, 60)}`,
  },

  "idea-vs-idea": {
    toolKey: "idea-vs-idea",
    systemPrompt: `You are a startup strategist who specializes in comparative analysis and decision frameworks. You've helped 300+ founders choose between pivots, adjacent opportunities, and competing visions.

Your comparative analyses are definitive — you don't hedge. You make a clear recommendation based on:
- Which has better structural market dynamics
- Which requires fewer "impossible" things to be true simultaneously
- Which plays to common founder strengths vs. requires unusual skills
- Which has better timing given current market conditions
- Which scales more predictably

When two ideas are genuinely close, you say so — but you still pick one.`,
    buildUserPrompt: (i) => {
      const ctx = String(i.context || "");
      const parts = ctx.split(/vs\.?|versus|\n---\n/i);
      const idea1 = (parts[0] || ctx).trim();
      const idea2 = (parts[1] || "").trim();
      return `Compare these two startup ideas with maximum depth:

Idea A: ${idea1}

Idea B: ${idea2 || "(Please analyze Idea A from multiple angles and identify 2-3 potential variations or pivots to compare)"}

Give me a definitive verdict. Which path should I bet my next 3 years on, and exactly why?`;
    },
    schema: {
      name: "idea_vs_idea",
      description: "Return a structured side-by-side comparison with a definitive recommendation.",
      input_schema: {
        type: "object",
        properties: {
          winner: { type: "string", enum: ["Idea A", "Idea B", "Too close to call"] },
          confidence: { type: "string", enum: ["High", "Medium", "Low"] },
          verdict: {
            type: "string",
            description: "2-3 paragraphs — the definitive recommendation and the key reasoning",
          },
          idea_a: {
            type: "object",
            properties: {
              name: { type: "string" },
              one_liner: { type: "string" },
              score: { type: "number", description: "0-100 overall startup potential" },
              market_potential: { type: "string" },
              execution_difficulty: {
                type: "string",
                enum: ["Easy", "Medium", "Hard", "Extremely Hard"],
              },
              pros: { type: "array", items: { type: "string" } },
              cons: { type: "array", items: { type: "string" } },
              ideal_founder_profile: { type: "string" },
              best_case_outcome: { type: "string" },
            },
            required: ["name", "one_liner", "score", "pros", "cons", "ideal_founder_profile"],
          },
          idea_b: {
            type: "object",
            properties: {
              name: { type: "string" },
              one_liner: { type: "string" },
              score: { type: "number" },
              market_potential: { type: "string" },
              execution_difficulty: {
                type: "string",
                enum: ["Easy", "Medium", "Hard", "Extremely Hard"],
              },
              pros: { type: "array", items: { type: "string" } },
              cons: { type: "array", items: { type: "string" } },
              ideal_founder_profile: { type: "string" },
              best_case_outcome: { type: "string" },
            },
            required: ["name", "one_liner", "score", "pros", "cons", "ideal_founder_profile"],
          },
          key_differentiators: {
            type: "array",
            items: { type: "string" },
            description: "The critical dimensions where they diverge most",
          },
          the_twist: {
            type: "string",
            description: "The non-obvious insight most founders would miss",
          },
          hybrid_possibility: {
            type: "string",
            description: "Is there a way to combine the best of both?",
          },
        },
        required: [
          "winner",
          "confidence",
          "verdict",
          "idea_a",
          "idea_b",
          "key_differentiators",
          "the_twist",
        ],
      },
    },
    assetCategory: "idea-comparison",
    assetTitle: (i) =>
      `Idea vs Idea: ${String(i.business || i.context || "Comparison").slice(0, 60)}`,
  },

  "landing-page": {
    toolKey: "landing-page",
    systemPrompt: `You are one of the world's top landing page copywriters, responsible for pages that have generated $50M+ in revenue. You've written for SaaS, DTC, agencies, and courses.

Your pages convert because:
- Every headline speaks to the reader's desired identity, not just a feature
- The problem section creates pain before the solution relieves it
- Benefits are written as outcomes, not features or capabilities
- Social proof is specific (numbers, names, results) never generic
- The CTA speaks to desire, not obligation

You know that most landing pages bury the lead. You put the most compelling thing first.
You write for real humans who are skeptical, busy, and one click away from leaving.`,
    buildUserPrompt: (i) =>
      `Generate complete landing page copy for:

Business: ${i.business || i.context}
Target audience: ${i.target || "Not specified"}
Core transformation offered: ${i.offer || i.goal || "Not specified"}
Price point: ${i.price || "Not specified"}
Primary CTA: ${i.cta || "Start free trial / Get started"}

Write copy that makes the visitor feel like you read their mind. No clichés. No "unleash your potential."`,
    schema: {
      name: "landing_page_copy",
      description: "Return complete, conversion-optimized landing page copy.",
      input_schema: {
        type: "object",
        properties: {
          hero_headline: {
            type: "string",
            description: "Main H1 — specific, bold, outcome-focused. Not clever, CLEAR.",
          },
          hero_subheadline: {
            type: "string",
            description: "2 sentences that amplify the headline and explain the mechanism",
          },
          hero_cta: {
            type: "string",
            description: "Primary CTA button — speaks to desire, not obligation",
          },
          above_fold_hook: {
            type: "string",
            description: "The sentence that keeps them scrolling — create urgency or curiosity",
          },
          social_proof_bar: {
            type: "string",
            description: "The quick stat or logo bar that builds immediate credibility",
          },
          problem_section: {
            type: "object",
            properties: {
              headline: { type: "string" },
              opening: {
                type: "string",
                description: "The visceral opening that makes them feel the pain",
              },
              pain_points: { type: "array", items: { type: "string" } },
              agitation: {
                type: "string",
                description: "The consequence of NOT solving this — what it's costing them",
              },
            },
            required: ["headline", "opening", "pain_points", "agitation"],
          },
          solution_section: {
            type: "object",
            properties: {
              headline: { type: "string" },
              mechanism: {
                type: "string",
                description: "How it works — the unique mechanism that makes results inevitable",
              },
            },
            required: ["headline", "mechanism"],
          },
          benefits: {
            type: "array",
            items: {
              type: "object",
              properties: {
                headline: { type: "string" },
                description: { type: "string" },
                outcome: { type: "string", description: "The measurable or felt outcome" },
              },
              required: ["headline", "description", "outcome"],
            },
          },
          testimonial_templates: {
            type: "array",
            items: { type: "string" },
            description: "3 specific testimonial scripts to collect from customers",
          },
          faq_section: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                answer: { type: "string" },
              },
              required: ["question", "answer"],
            },
          },
          objection_busters: {
            type: "array",
            items: { type: "string" },
            description: "The top objections and how to handle them in copy",
          },
          closing_cta_headline: { type: "string" },
          closing_cta_body: { type: "string" },
          seo_meta_title: { type: "string" },
          seo_meta_description: { type: "string" },
        },
        required: [
          "hero_headline",
          "hero_subheadline",
          "hero_cta",
          "above_fold_hook",
          "problem_section",
          "solution_section",
          "benefits",
          "testimonial_templates",
          "faq_section",
          "objection_busters",
          "closing_cta_headline",
          "closing_cta_body",
          "seo_meta_description",
        ],
      },
    },
    assetCategory: "landing-page",
    assetTitle: (i) =>
      `Landing Page: ${String(i.business || i.context || "Untitled").slice(0, 60)}`,
  },

  "competitor-analysis": {
    toolKey: "competitor-analysis",
    systemPrompt: `You are a competitive intelligence expert who has mapped competitive landscapes for Fortune 500 companies, PE-backed rollups, and venture-funded startups. You've helped companies find and exploit competitive gaps worth $10M-$500M in revenue.

Your analyses go beyond listing who exists. You:
- Identify the structural weaknesses incumbents can't fix without hurting themselves (the innovator's dilemma moments)
- Find the underserved segments that competitors ignore
- Map the psychological switching costs that trap customers
- Identify acquisition channels competitors are neglecting
- Find the one angle that could leapfrog established players in 18 months

You write in the language of strategy, not observation.`,
    buildUserPrompt: (i) =>
      `Conduct a deep competitive analysis for:

Business: ${i.business || i.context}
Target market: ${i.target || "Not specified"}
My intended differentiation: ${i.differentiation || "Not specified"}

Map the competitive landscape completely. Find my unfair angle. Tell me where I can win.`,
    schema: {
      name: "competitor_analysis",
      description: "Return a comprehensive competitive intelligence report.",
      input_schema: {
        type: "object",
        properties: {
          market_summary: {
            type: "string",
            description: "State of the competitive landscape in 2-3 paragraphs",
          },
          competitors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                tier: { type: "string", enum: ["Direct", "Indirect", "Adjacent"] },
                strengths: { type: "array", items: { type: "string" } },
                weaknesses: { type: "array", items: { type: "string" } },
                pricing: { type: "string" },
                customer_complaints: {
                  type: "array",
                  items: { type: "string" },
                  description: "What customers complain about in reviews",
                },
                exploitable_weakness: { type: "string" },
              },
              required: ["name", "tier", "strengths", "weaknesses", "exploitable_weakness"],
            },
            description: "3-6 key competitors analyzed",
          },
          market_gaps: {
            type: "array",
            items: { type: "string" },
            description: "Specific underserved segments or unmet needs — with evidence",
          },
          winning_angles: {
            type: "array",
            items: {
              type: "object",
              properties: {
                angle: { type: "string" },
                why_it_works: { type: "string" },
                execution_path: { type: "string" },
              },
              required: ["angle", "why_it_works", "execution_path"],
            },
            description: "3-4 specific angles to win — ranked by opportunity",
          },
          positioning_recommendation: {
            type: "string",
            description: "The exact positioning statement that creates maximum differentiation",
          },
          channels_competitors_neglect: { type: "array", items: { type: "string" } },
          moat_building_strategy: {
            type: "string",
            description: "How to build a moat competitors can't easily copy",
          },
          watch_out_for: {
            type: "array",
            items: { type: "string" },
            description: "Competitive threats to monitor closely",
          },
        },
        required: [
          "market_summary",
          "competitors",
          "market_gaps",
          "winning_angles",
          "positioning_recommendation",
          "channels_competitors_neglect",
          "moat_building_strategy",
        ],
      },
    },
    assetCategory: "competitor-analysis",
    assetTitle: (i) =>
      `Competitor Analysis: ${String(i.business || i.context || "Untitled").slice(0, 60)}`,
  },

  "pricing-strategy": {
    toolKey: "pricing-strategy",
    systemPrompt: `You are a pricing strategy consultant who has designed pricing architectures for 150+ SaaS, services, marketplace, and physical product businesses. You've helped companies 3x revenue without adding customers purely through pricing optimization.

You are trained in:
- Value-based pricing (charge for outcomes, not time or seats)
- Price anchoring psychology (make the middle option irresistible)
- Tier architecture that maximizes both conversion and ARPU
- Packaging that bundles for maximum perceived value
- The psychology of price presentation that reduces friction
- Competitive positioning through pricing signals

You know that most founders underprice by 40-60% and leave millions on the table.`,
    buildUserPrompt: (i) =>
      `Design a complete pricing strategy for:

Business: ${i.business || i.context}
Target customer segments: ${i.target || "Not specified"}
Current pricing (if any): ${i.current_price || "No current pricing"}
Competitors' pricing: ${i.competitor_pricing || "Unknown"}
Value delivered: ${i.value || "Not specified"}

Build a pricing architecture that maximizes both growth and revenue. Don't be conservative.`,
    schema: {
      name: "pricing_strategy",
      description: "Return a comprehensive pricing strategy with tier architecture.",
      input_schema: {
        type: "object",
        properties: {
          pricing_philosophy: {
            type: "string",
            description:
              "The core pricing principle — value-based, competitive, cost-plus, etc. and why it fits",
          },
          pricing_model: {
            type: "string",
            description: "The fundamental model: subscription, usage, project, retainer, etc.",
          },
          tiers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                price: { type: "string" },
                billing: { type: "string", description: "Monthly/annual/one-time" },
                target_customer: { type: "string" },
                what_they_get: { type: "array", items: { type: "string" } },
                limitations: { type: "array", items: { type: "string" } },
                psychological_role: {
                  type: "string",
                  description: "Anchor, hero, upsell — what job this tier does",
                },
                conversion_mechanism: {
                  type: "string",
                  description: "What drives users to this tier",
                },
              },
              required: [
                "name",
                "price",
                "billing",
                "target_customer",
                "what_they_get",
                "psychological_role",
              ],
            },
          },
          anchor_strategy: {
            type: "string",
            description:
              "How the pricing tiers work together psychologically to drive toward the hero tier",
          },
          hero_tier: {
            type: "string",
            description: "Which tier will generate 70%+ of revenue and why",
          },
          annual_discount: {
            type: "string",
            description: "Recommended annual vs monthly discount and the rationale",
          },
          price_increase_path: {
            type: "string",
            description: "How to raise prices over 24 months without losing customers",
          },
          packaging_insights: {
            type: "array",
            items: { type: "string" },
            description: "Specific packaging moves that increase perceived value",
          },
          what_to_charge_for: {
            type: "array",
            items: { type: "string" },
            description: "Dimensions of value to monetize — seats, usage, outcomes, features",
          },
          pricing_page_copy: {
            type: "string",
            description: "The key copy elements for a high-converting pricing page",
          },
          common_pricing_mistakes: {
            type: "array",
            items: { type: "string" },
            description: "Mistakes to avoid in this specific market",
          },
        },
        required: [
          "pricing_philosophy",
          "pricing_model",
          "tiers",
          "anchor_strategy",
          "hero_tier",
          "annual_discount",
          "packaging_insights",
          "pricing_page_copy",
        ],
      },
    },
    assetCategory: "pricing-strategy",
    assetTitle: (i) =>
      `Pricing Strategy: ${String(i.business || i.context || "Untitled").slice(0, 60)}`,
  },

  "revenue-projector": {
    toolKey: "revenue-projector",
    systemPrompt: `You are a financial modeler and startup CFO consultant who has built revenue models for 200+ companies raising from $500K to $50M. You've helped founders understand unit economics, model growth scenarios, and build the financial story that gets investors excited.

Your models are built on:
- Bottom-up assumptions (not top-down market capture fantasies)
- Sensitivity analysis — what does a 20% miss in conversion rate mean for year 2?
- Unit economics that tell the real story: CAC, LTV, payback period, churn
- Three scenarios: conservative, base, optimistic
- The honest truth about when a business breaks even and what it takes to get there

You flag when assumptions are unrealistic and explain what would need to be true for the optimistic case.`,
    buildUserPrompt: (i) =>
      `Build a 12-month revenue projection model for:

Business: ${i.business || i.context}
Business model: ${i.model || "SaaS/recurring"}
Current MRR: ${i.current_mrr || "$0"}
Target customers: ${i.target || "Not specified"}
Pricing: ${i.pricing || "Not specified"}
Key growth lever: ${i.growth_lever || "Not specified"}

Build three scenarios. Be honest about the assumptions. Tell me what I need to believe for each scenario to be true.`,
    schema: {
      name: "revenue_projector",
      description: "Return a comprehensive 12-month revenue projection with multiple scenarios.",
      input_schema: {
        type: "object",
        properties: {
          model_assumptions: {
            type: "object",
            properties: {
              avg_contract_value: { type: "string" },
              churn_rate_monthly: { type: "string" },
              cac: { type: "string" },
              ltv: { type: "string" },
              ltv_cac_ratio: { type: "string" },
              payback_period: { type: "string" },
              conversion_rate: { type: "string" },
              growth_rate_monthly: { type: "string" },
            },
            required: ["avg_contract_value", "churn_rate_monthly", "ltv_cac_ratio"],
          },
          conservative_scenario: {
            type: "object",
            properties: {
              month_3_mrr: { type: "string" },
              month_6_mrr: { type: "string" },
              month_12_mrr: { type: "string" },
              customers_at_12m: { type: "string" },
              key_assumption: { type: "string" },
              probability: { type: "string" },
            },
            required: [
              "month_3_mrr",
              "month_6_mrr",
              "month_12_mrr",
              "customers_at_12m",
              "key_assumption",
            ],
          },
          base_scenario: {
            type: "object",
            properties: {
              month_3_mrr: { type: "string" },
              month_6_mrr: { type: "string" },
              month_12_mrr: { type: "string" },
              customers_at_12m: { type: "string" },
              arr_at_12m: { type: "string" },
              key_assumption: { type: "string" },
              probability: { type: "string" },
            },
            required: [
              "month_3_mrr",
              "month_6_mrr",
              "month_12_mrr",
              "customers_at_12m",
              "arr_at_12m",
              "key_assumption",
            ],
          },
          optimistic_scenario: {
            type: "object",
            properties: {
              month_3_mrr: { type: "string" },
              month_6_mrr: { type: "string" },
              month_12_mrr: { type: "string" },
              customers_at_12m: { type: "string" },
              arr_at_12m: { type: "string" },
              what_must_be_true: { type: "array", items: { type: "string" } },
              probability: { type: "string" },
            },
            required: [
              "month_3_mrr",
              "month_6_mrr",
              "month_12_mrr",
              "customers_at_12m",
              "arr_at_12m",
              "what_must_be_true",
            ],
          },
          growth_levers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                lever: { type: "string" },
                mrr_impact: { type: "string" },
                how_to_pull: { type: "string" },
              },
              required: ["lever", "mrr_impact", "how_to_pull"],
            },
            description: "Top 3-4 levers to accelerate to optimistic scenario",
          },
          breakeven_analysis: {
            type: "string",
            description: "When does the business break even and what does that require?",
          },
          unit_economics_verdict: {
            type: "string",
            description:
              "Are the unit economics good, acceptable, or concerning? What needs to improve?",
          },
          investor_story: {
            type: "string",
            description: "The 3-sentence financial narrative for investors",
          },
          risk_factors: {
            type: "array",
            items: { type: "string" },
            description: "The assumptions most likely to be wrong and by how much",
          },
        },
        required: [
          "model_assumptions",
          "conservative_scenario",
          "base_scenario",
          "optimistic_scenario",
          "growth_levers",
          "breakeven_analysis",
          "unit_economics_verdict",
          "investor_story",
        ],
      },
    },
    assetCategory: "revenue-projection",
    assetTitle: (i) =>
      `Revenue Projection: ${String(i.business || i.context || "Untitled").slice(0, 60)}`,
  },
};

// ─── Core streaming runner ─────────────────────────────────────────────────────

export type RunResult = {
  output: Record<string, unknown>;
  run_id?: string;
};

export async function runToolLocally(
  toolKey: string,
  payload: Record<string, unknown>,
  ctx: { orgId: string | null; userId: string | undefined },
  onStream?: (chunk: string) => void,
): Promise<RunResult> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error("VITE_ANTHROPIC_API_KEY is not set in your .env file.");
  }

  const def = TOOLS[toolKey];
  if (!def) throw new Error(`No local definition for tool "${toolKey}"`);

  // Save running record (best-effort)
  let runId: string | undefined;
  if (ctx.orgId && ctx.userId) {
    try {
      const { data: run } = await supabase
        .from("tool_runs")
        .insert({
          organization_id: ctx.orgId,
          user_id: ctx.userId,
          tool_key: toolKey,
          status: "running",
          input: payload as never,
        })
        .select("id")
        .single();
      runId = run?.id as string | undefined;
    } catch {
      /* non-blocking */
    }
  }

  const useStreaming = typeof onStream === "function";
  let output: Record<string, unknown>;

  if (useStreaming) {
    output = await callStreamingAPI(def, payload, apiKey, onStream!);
  } else {
    output = await callDirectAPI(def, payload, apiKey);
  }

  // Update record + save asset (best-effort)
  if (ctx.orgId && ctx.userId) {
    try {
      if (runId) {
        await supabase
          .from("tool_runs")
          .update({ status: "succeeded", output: output as never })
          .eq("id", runId);
      }
      await supabase.from("generated_assets").insert({
        organization_id: ctx.orgId,
        user_id: ctx.userId,
        tool_run_id: runId ?? null,
        category: def.assetCategory,
        kind: toolKey,
        title: def.assetTitle(payload, output),
        content: output as never,
      });
      // Increment usage
      const period = new Date().toISOString().slice(0, 7);
      const { data: existing } = await supabase
        .from("usage_tracking")
        .select("id, count")
        .eq("organization_id", ctx.orgId)
        .eq("period", period)
        .eq("tool_key", toolKey)
        .maybeSingle();
      if (existing) {
        await supabase
          .from("usage_tracking")
          .update({ count: (existing.count as number) + 1, last_used_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase.from("usage_tracking").insert({
          organization_id: ctx.orgId,
          period,
          tool_key: toolKey,
          count: 1,
        });
      }
    } catch {
      if (runId) {
        try {
          await supabase
            .from("tool_runs")
            .update({ status: "succeeded", output: output as never })
            .eq("id", runId);
        } catch {
          /* truly non-blocking */
        }
      }
    }
  }

  return { output, run_id: runId };
}

async function callDirectAPI(
  def: ToolDef,
  payload: Record<string, unknown>,
  apiKey: string,
): Promise<Record<string, unknown>> {
  const resp = await fetch(ANTHROPIC_BASE, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8192,
      system: def.systemPrompt,
      messages: [{ role: "user", content: def.buildUserPrompt(payload) }],
      tools: [def.schema],
      tool_choice: { type: "tool", name: def.schema.name },
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(parseApiError(resp.status, body));
  }

  const data = await resp.json();
  const toolUse = data.content?.find((b: { type: string }) => b.type === "tool_use");
  if (!toolUse?.input) throw new Error("Anthropic returned no structured output. Try again.");
  return toolUse.input as Record<string, unknown>;
}

async function callStreamingAPI(
  def: ToolDef,
  payload: Record<string, unknown>,
  apiKey: string,
  onStream: (chunk: string) => void,
): Promise<Record<string, unknown>> {
  const resp = await fetch(ANTHROPIC_BASE, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8192,
      stream: true,
      system: def.systemPrompt,
      messages: [{ role: "user", content: def.buildUserPrompt(payload) }],
      tools: [def.schema],
      tool_choice: { type: "tool", name: def.schema.name },
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(parseApiError(resp.status, body));
  }

  const reader = resp.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let jsonAccum = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (raw === "[DONE]") continue;
      try {
        const event = JSON.parse(raw) as {
          type: string;
          delta?: { type: string; partial_json?: string };
        };
        if (
          event.type === "content_block_delta" &&
          event.delta?.type === "input_json_delta" &&
          event.delta.partial_json
        ) {
          const chunk = event.delta.partial_json;
          jsonAccum += chunk;
          onStream(chunk);
        }
      } catch {
        /* skip malformed SSE lines */
      }
    }
  }

  if (!jsonAccum) throw new Error("Stream ended with no output. Try again.");
  try {
    return JSON.parse(jsonAccum) as Record<string, unknown>;
  } catch {
    throw new Error("Failed to parse AI response. The model may have exceeded token limits.");
  }
}

function parseApiError(status: number, body: string): string {
  if (status === 429) return "Rate limit exceeded — please wait a moment and try again.";
  if (status === 401)
    return "Invalid Anthropic API key. Check VITE_ANTHROPIC_API_KEY in your .env file.";
  if (status === 400) return `Bad request: ${body.slice(0, 200)}`;
  return `Anthropic API error ${status}: ${body.slice(0, 200)}`;
}

/** Returns true if a local Anthropic key is configured. */
export function hasLocalAiKey(): boolean {
  const k = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
  return typeof k === "string" && k.trim().length > 0;
}
