// Central router for all 17 Launchpad AI tools.
// The frontend calls supabase.functions.invoke("run-tool", { toolKey, input, organizationId })
// and this function dispatches to the correct tool configuration.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, jsonResponse, runTool } from "../_shared/helpers.ts";

type ToolConfig = {
  systemPrompt: string;
  buildUserPrompt: (input: Record<string, unknown>) => string;
  schema: { name: string; description: string; parameters: Record<string, unknown> };
  assetCategory: string;
  assetTitle: (input: Record<string, unknown>, output: Record<string, unknown>) => string;
};

const TOOLS: Record<string, ToolConfig> = {
  "validate-idea": {
    systemPrompt:
      "You are an expert startup advisor. Analyse the given business idea and return a structured validation report covering market size, problem severity, competition, and an overall viability score.",
    buildUserPrompt: (i) =>
      `Business idea: ${i.idea}\nTarget market: ${i.targetMarket || "not specified"}\nProblem being solved: ${i.problem || "not specified"}`,
    schema: {
      name: "validate_idea",
      description: "Return a structured idea validation report",
      parameters: {
        type: "object",
        properties: {
          viabilityScore: { type: "number", description: "0-100 overall viability score" },
          marketSize: { type: "string" },
          problemSeverity: { type: "string", enum: ["low", "medium", "high", "critical"] },
          competitionLevel: { type: "string", enum: ["low", "medium", "high", "saturated"] },
          strengths: { type: "array", items: { type: "string" } },
          weaknesses: { type: "array", items: { type: "string" } },
          recommendation: { type: "string" },
        },
        required: [
          "viabilityScore",
          "marketSize",
          "problemSeverity",
          "competitionLevel",
          "strengths",
          "weaknesses",
          "recommendation",
        ],
      },
    },
    assetCategory: "validation",
    assetTitle: (i) => `Idea Validation: ${String(i.idea).slice(0, 60)}`,
  },

  "generate-pitch": {
    systemPrompt:
      "You are a world-class pitch writer. Create a compelling, concise pitch for the given startup idea following the Problem → Solution → Market → Traction → Ask framework.",
    buildUserPrompt: (i) =>
      `Startup: ${i.startupName || i.idea}\nIdea: ${i.idea}\nTarget market: ${i.targetMarket || "not specified"}\nTraction: ${i.traction || "pre-launch"}`,
    schema: {
      name: "generate_pitch",
      description: "Generate a structured startup pitch",
      parameters: {
        type: "object",
        properties: {
          headline: { type: "string" },
          problem: { type: "string" },
          solution: { type: "string" },
          marketOpportunity: { type: "string" },
          traction: { type: "string" },
          ask: { type: "string" },
          elevatorPitch: { type: "string" },
        },
        required: [
          "headline",
          "problem",
          "solution",
          "marketOpportunity",
          "traction",
          "ask",
          "elevatorPitch",
        ],
      },
    },
    assetCategory: "pitch",
    assetTitle: (i) => `Pitch: ${String(i.startupName || i.idea).slice(0, 60)}`,
  },

  "generate-gtm-strategy": {
    systemPrompt:
      "You are a go-to-market strategist. Build a detailed GTM plan for the given product including channels, messaging, sequencing, and metrics.",
    buildUserPrompt: (i) =>
      `Product: ${i.product}\nTarget customer: ${i.targetCustomer || "not specified"}\nBudget: ${i.budget || "bootstrap"}\nTimeline: ${i.timeline || "3 months"}`,
    schema: {
      name: "generate_gtm_strategy",
      description: "Generate a go-to-market strategy",
      parameters: {
        type: "object",
        properties: {
          positioning: { type: "string" },
          channels: { type: "array", items: { type: "string" } },
          messagingFramework: {
            type: "object",
            properties: {
              hook: { type: "string" },
              valueProps: { type: "array", items: { type: "string" } },
              cta: { type: "string" },
            },
            required: ["hook", "valueProps", "cta"],
          },
          launchSequence: { type: "array", items: { type: "string" } },
          kpis: { type: "array", items: { type: "string" } },
          budget: { type: "string" },
        },
        required: ["positioning", "channels", "messagingFramework", "launchSequence", "kpis"],
      },
    },
    assetCategory: "gtm",
    assetTitle: (i) => `GTM Strategy: ${String(i.product).slice(0, 60)}`,
  },

  "generate-offer": {
    systemPrompt:
      "You are an expert offer architect. Design an irresistible offer for the given product or service using value stacking, pricing psychology, and urgency mechanics.",
    buildUserPrompt: (i) =>
      `Product/service: ${i.product}\nTarget customer: ${i.targetCustomer || "not specified"}\nPrice point: ${i.pricePoint || "not specified"}`,
    schema: {
      name: "generate_offer",
      description: "Generate an irresistible offer",
      parameters: {
        type: "object",
        properties: {
          offerName: { type: "string" },
          coreDeliverable: { type: "string" },
          bonuses: { type: "array", items: { type: "string" } },
          guarantee: { type: "string" },
          price: { type: "string" },
          urgencyMechanic: { type: "string" },
          headline: { type: "string" },
        },
        required: [
          "offerName",
          "coreDeliverable",
          "bonuses",
          "guarantee",
          "price",
          "urgencyMechanic",
          "headline",
        ],
      },
    },
    assetCategory: "offer",
    assetTitle: (i) => `Offer: ${String(i.product).slice(0, 60)}`,
  },

  "kill-my-idea": {
    systemPrompt:
      "You are a brutally honest devil's advocate. Stress-test the given business idea by finding every fatal flaw, market assumption, and execution risk. Be constructive but ruthless.",
    buildUserPrompt: (i) =>
      `Business idea: ${i.idea}\nFounder's assumptions: ${i.assumptions || "none provided"}`,
    schema: {
      name: "kill_my_idea",
      description: "Stress-test a business idea",
      parameters: {
        type: "object",
        properties: {
          fatalFlaws: { type: "array", items: { type: "string" } },
          marketRisks: { type: "array", items: { type: "string" } },
          executionRisks: { type: "array", items: { type: "string" } },
          wrongAssumptions: { type: "array", items: { type: "string" } },
          killerQuestion: { type: "string" },
          survivalPath: { type: "string" },
        },
        required: [
          "fatalFlaws",
          "marketRisks",
          "executionRisks",
          "wrongAssumptions",
          "killerQuestion",
          "survivalPath",
        ],
      },
    },
    assetCategory: "validation",
    assetTitle: (i) => `Kill My Idea: ${String(i.idea).slice(0, 60)}`,
  },

  "idea-vs-idea": {
    systemPrompt:
      "You are a startup strategy expert. Compare two business ideas head-to-head across market potential, execution difficulty, monetisation speed, and competitive moat. Give a clear winner with reasoning.",
    buildUserPrompt: (i) =>
      `Idea A: ${i.ideaA}\nIdea B: ${i.ideaB}\nFounder context: ${i.founderContext || "not specified"}`,
    schema: {
      name: "idea_vs_idea",
      description: "Compare two startup ideas",
      parameters: {
        type: "object",
        properties: {
          winner: { type: "string", enum: ["A", "B", "tie"] },
          winnerReasoning: { type: "string" },
          ideaAScore: { type: "number" },
          ideaBScore: { type: "number" },
          comparison: {
            type: "object",
            properties: {
              marketPotential: {
                type: "object",
                properties: { a: { type: "string" }, b: { type: "string" } },
                required: ["a", "b"],
              },
              executionDifficulty: {
                type: "object",
                properties: { a: { type: "string" }, b: { type: "string" } },
                required: ["a", "b"],
              },
              monetisationSpeed: {
                type: "object",
                properties: { a: { type: "string" }, b: { type: "string" } },
                required: ["a", "b"],
              },
              competitiveMoat: {
                type: "object",
                properties: { a: { type: "string" }, b: { type: "string" } },
                required: ["a", "b"],
              },
            },
            required: [
              "marketPotential",
              "executionDifficulty",
              "monetisationSpeed",
              "competitiveMoat",
            ],
          },
        },
        required: ["winner", "winnerReasoning", "ideaAScore", "ideaBScore", "comparison"],
      },
    },
    assetCategory: "validation",
    assetTitle: (i) =>
      `Idea vs Idea: ${String(i.ideaA).slice(0, 30)} vs ${String(i.ideaB).slice(0, 30)}`,
  },

  "landing-page": {
    systemPrompt:
      "You are a conversion-focused copywriter. Write complete landing page copy for the given product including headline, subheadline, hero, features, social proof, FAQ, and CTA sections.",
    buildUserPrompt: (i) =>
      `Product: ${i.product}\nTarget customer: ${i.targetCustomer || "not specified"}\nMain benefit: ${i.mainBenefit || "not specified"}\nTone: ${i.tone || "professional"}`,
    schema: {
      name: "landing_page_copy",
      description: "Generate complete landing page copy",
      parameters: {
        type: "object",
        properties: {
          headline: { type: "string" },
          subheadline: { type: "string" },
          heroCopy: { type: "string" },
          features: {
            type: "array",
            items: {
              type: "object",
              properties: { title: { type: "string" }, description: { type: "string" } },
              required: ["title", "description"],
            },
          },
          socialProofSection: { type: "string" },
          faq: {
            type: "array",
            items: {
              type: "object",
              properties: { question: { type: "string" }, answer: { type: "string" } },
              required: ["question", "answer"],
            },
          },
          ctaCopy: { type: "string" },
        },
        required: [
          "headline",
          "subheadline",
          "heroCopy",
          "features",
          "socialProofSection",
          "faq",
          "ctaCopy",
        ],
      },
    },
    assetCategory: "copy",
    assetTitle: (i) => `Landing Page: ${String(i.product).slice(0, 60)}`,
  },

  "first-10-customers": {
    systemPrompt:
      "You are a growth hacker who specialises in early traction. Create a hyper-specific, actionable plan for the given startup to acquire their first 10 paying customers within 30 days.",
    buildUserPrompt: (i) =>
      `Product: ${i.product}\nTarget customer: ${i.targetCustomer || "not specified"}\nPrice: ${i.price || "not specified"}\nChannels available: ${i.channels || "any"}`,
    schema: {
      name: "first_10_customers",
      description: "Plan to acquire first 10 paying customers",
      parameters: {
        type: "object",
        properties: {
          strategy: { type: "string" },
          weekByWeekPlan: {
            type: "array",
            items: {
              type: "object",
              properties: {
                week: { type: "number" },
                actions: { type: "array", items: { type: "string" } },
              },
              required: ["week", "actions"],
            },
          },
          outreachTemplates: {
            type: "array",
            items: {
              type: "object",
              properties: { channel: { type: "string" }, template: { type: "string" } },
              required: ["channel", "template"],
            },
          },
          metrics: { type: "array", items: { type: "string" } },
        },
        required: ["strategy", "weekByWeekPlan", "outreachTemplates", "metrics"],
      },
    },
    assetCategory: "growth",
    assetTitle: (i) => `First 10 Customers: ${String(i.product).slice(0, 60)}`,
  },

  "funding-score": {
    systemPrompt:
      "You are a venture capital analyst. Score the given startup on investor readiness across team, market, product, traction, and financials. Provide actionable improvement steps.",
    buildUserPrompt: (i) =>
      `Startup: ${i.startupName || i.product}\nStage: ${i.stage || "pre-seed"}\nTraction: ${i.traction || "none"}\nTeam: ${i.team || "solo founder"}\nRevenue: ${i.revenue || "$0"}`,
    schema: {
      name: "funding_score",
      description: "Score startup on investor readiness",
      parameters: {
        type: "object",
        properties: {
          overallScore: { type: "number", description: "0-100" },
          scores: {
            type: "object",
            properties: {
              team: { type: "number" },
              market: { type: "number" },
              product: { type: "number" },
              traction: { type: "number" },
              financials: { type: "number" },
            },
            required: ["team", "market", "product", "traction", "financials"],
          },
          verdict: { type: "string", enum: ["not ready", "almost ready", "ready", "fundable now"] },
          topImprovements: { type: "array", items: { type: "string" } },
          investorPerspective: { type: "string" },
        },
        required: ["overallScore", "scores", "verdict", "topImprovements", "investorPerspective"],
      },
    },
    assetCategory: "funding",
    assetTitle: (i) => `Funding Score: ${String(i.startupName || i.product).slice(0, 60)}`,
  },

  "investor-emails": {
    systemPrompt:
      "You are an expert fundraiser. Write 3 personalised cold investor outreach emails for the given startup — each with a different angle (traction-led, market-led, team-led).",
    buildUserPrompt: (i) =>
      `Startup: ${i.startupName}\nPitch: ${i.pitch || i.idea}\nTraction: ${i.traction || "pre-launch"}\nAsk: ${i.ask || "$500k pre-seed"}`,
    schema: {
      name: "investor_emails",
      description: "Generate investor outreach emails",
      parameters: {
        type: "object",
        properties: {
          emails: {
            type: "array",
            items: {
              type: "object",
              properties: {
                angle: { type: "string" },
                subject: { type: "string" },
                body: { type: "string" },
              },
              required: ["angle", "subject", "body"],
            },
          },
          followUpTemplate: { type: "string" },
        },
        required: ["emails", "followUpTemplate"],
      },
    },
    assetCategory: "funding",
    assetTitle: (i) => `Investor Emails: ${String(i.startupName).slice(0, 60)}`,
  },

  "business-plan": {
    systemPrompt:
      "You are a strategic business consultant. Write a concise, investor-grade business plan for the given startup covering executive summary, problem, solution, market, business model, go-to-market, team, and financials.",
    buildUserPrompt: (i) =>
      `Startup: ${i.startupName || i.product}\nIdea: ${i.idea || i.product}\nRevenue model: ${i.revenueModel || "SaaS"}\nTarget market: ${i.targetMarket || "SMB"}`,
    schema: {
      name: "business_plan",
      description: "Generate a structured business plan",
      parameters: {
        type: "object",
        properties: {
          executiveSummary: { type: "string" },
          problemStatement: { type: "string" },
          solution: { type: "string" },
          marketAnalysis: { type: "string" },
          businessModel: { type: "string" },
          gtmStrategy: { type: "string" },
          teamSection: { type: "string" },
          financialProjections: { type: "string" },
          milestones: { type: "array", items: { type: "string" } },
        },
        required: [
          "executiveSummary",
          "problemStatement",
          "solution",
          "marketAnalysis",
          "businessModel",
          "gtmStrategy",
          "teamSection",
          "financialProjections",
          "milestones",
        ],
      },
    },
    assetCategory: "plan",
    assetTitle: (i) => `Business Plan: ${String(i.startupName || i.product).slice(0, 60)}`,
  },

  "competitor-analysis": {
    systemPrompt:
      "You are a competitive intelligence analyst. Provide a detailed competitor analysis for the given market/product including landscape overview, top competitors, feature comparison, pricing, positioning gaps, and strategic recommendations.",
    buildUserPrompt: (i) =>
      `Product/market: ${i.product}\nKnown competitors: ${i.competitors || "unknown"}\nYour differentiator: ${i.differentiator || "not specified"}`,
    schema: {
      name: "competitor_analysis",
      description: "Generate a competitor analysis",
      parameters: {
        type: "object",
        properties: {
          marketOverview: { type: "string" },
          competitors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                strengths: { type: "array", items: { type: "string" } },
                weaknesses: { type: "array", items: { type: "string" } },
                pricing: { type: "string" },
                positioning: { type: "string" },
              },
              required: ["name", "strengths", "weaknesses", "pricing", "positioning"],
            },
          },
          positioningGaps: { type: "array", items: { type: "string" } },
          strategicRecommendations: { type: "array", items: { type: "string" } },
        },
        required: ["marketOverview", "competitors", "positioningGaps", "strategicRecommendations"],
      },
    },
    assetCategory: "research",
    assetTitle: (i) => `Competitor Analysis: ${String(i.product).slice(0, 60)}`,
  },

  "pricing-strategy": {
    systemPrompt:
      "You are a pricing strategist. Design an optimal pricing strategy for the given product including model recommendation, tier structure, psychological pricing tactics, and expansion revenue levers.",
    buildUserPrompt: (i) =>
      `Product: ${i.product}\nTarget customer: ${i.targetCustomer || "SMB"}\nCurrent pricing: ${i.currentPricing || "none"}\nRevenue goal: ${i.revenueGoal || "not specified"}`,
    schema: {
      name: "pricing_strategy",
      description: "Generate a pricing strategy",
      parameters: {
        type: "object",
        properties: {
          recommendedModel: { type: "string" },
          tiers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                price: { type: "string" },
                features: { type: "array", items: { type: "string" } },
                targetCustomer: { type: "string" },
              },
              required: ["name", "price", "features", "targetCustomer"],
            },
          },
          psychologicalTactics: { type: "array", items: { type: "string" } },
          expansionLevers: { type: "array", items: { type: "string" } },
          rationale: { type: "string" },
        },
        required: [
          "recommendedModel",
          "tiers",
          "psychologicalTactics",
          "expansionLevers",
          "rationale",
        ],
      },
    },
    assetCategory: "strategy",
    assetTitle: (i) => `Pricing Strategy: ${String(i.product).slice(0, 60)}`,
  },

  "revenue-projector": {
    systemPrompt:
      "You are a financial modelling expert. Build a 12-month revenue projection for the given startup based on the provided assumptions, including MoM growth scenarios (conservative, base, aggressive) and key revenue drivers.",
    buildUserPrompt: (i) =>
      `Product: ${i.product}\nCurrent MRR: ${i.currentMrr || "$0"}\nAvg deal size: ${i.avgDealSize || "not specified"}\nGrowth lever: ${i.growthLever || "organic"}`,
    schema: {
      name: "revenue_projector",
      description: "Generate 12-month revenue projections",
      parameters: {
        type: "object",
        properties: {
          assumptions: { type: "array", items: { type: "string" } },
          scenarios: {
            type: "object",
            properties: {
              conservative: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    month: { type: "number" },
                    mrr: { type: "number" },
                    arr: { type: "number" },
                  },
                  required: ["month", "mrr", "arr"],
                },
              },
              base: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    month: { type: "number" },
                    mrr: { type: "number" },
                    arr: { type: "number" },
                  },
                  required: ["month", "mrr", "arr"],
                },
              },
              aggressive: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    month: { type: "number" },
                    mrr: { type: "number" },
                    arr: { type: "number" },
                  },
                  required: ["month", "mrr", "arr"],
                },
              },
            },
            required: ["conservative", "base", "aggressive"],
          },
          keyDrivers: { type: "array", items: { type: "string" } },
          milestone12Month: { type: "string" },
        },
        required: ["assumptions", "scenarios", "keyDrivers", "milestone12Month"],
      },
    },
    assetCategory: "finance",
    assetTitle: (i) => `Revenue Projector: ${String(i.product).slice(0, 60)}`,
  },

  // Nova OS automation tools
  "social-content-engine": {
    systemPrompt:
      "You are a social media content strategist. Generate a 30-day social media content calendar for the given brand across the requested platforms, with post copy, hashtags, and engagement hooks.",
    buildUserPrompt: (i) =>
      `Brand: ${i.brand}\nPlatforms: ${i.platforms || "LinkedIn, Twitter"}\nTone: ${i.tone || "professional"}\nNiche: ${i.niche || "startup"}`,
    schema: {
      name: "social_content_engine",
      description: "Generate a 30-day social content calendar",
      parameters: {
        type: "object",
        properties: {
          strategy: { type: "string" },
          posts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "number" },
                platform: { type: "string" },
                copy: { type: "string" },
                hashtags: { type: "array", items: { type: "string" } },
                engagementHook: { type: "string" },
              },
              required: ["day", "platform", "copy", "hashtags", "engagementHook"],
            },
          },
        },
        required: ["strategy", "posts"],
      },
    },
    assetCategory: "content",
    assetTitle: (i) => `Social Content: ${String(i.brand).slice(0, 60)}`,
  },

  "lead-outreach-system": {
    systemPrompt:
      "You are a B2B sales expert. Build a complete lead outreach sequence for the given product including ICP definition, channel strategy, 5-touch email sequence, LinkedIn messages, and follow-up cadence.",
    buildUserPrompt: (i) =>
      `Product: ${i.product}\nICP: ${i.icp || "not specified"}\nValue prop: ${i.valueProp || "not specified"}`,
    schema: {
      name: "lead_outreach_system",
      description: "Generate a B2B lead outreach system",
      parameters: {
        type: "object",
        properties: {
          icpDefinition: { type: "string" },
          channelStrategy: { type: "string" },
          emailSequence: {
            type: "array",
            items: {
              type: "object",
              properties: {
                touchNumber: { type: "number" },
                delay: { type: "string" },
                subject: { type: "string" },
                body: { type: "string" },
              },
              required: ["touchNumber", "delay", "subject", "body"],
            },
          },
          linkedinMessages: { type: "array", items: { type: "string" } },
          followUpCadence: { type: "string" },
        },
        required: [
          "icpDefinition",
          "channelStrategy",
          "emailSequence",
          "linkedinMessages",
          "followUpCadence",
        ],
      },
    },
    assetCategory: "sales",
    assetTitle: (i) => `Lead Outreach: ${String(i.product).slice(0, 60)}`,
  },

  "ops-sop-builder": {
    systemPrompt:
      "You are an operations expert. Create detailed Standard Operating Procedures (SOPs) for the given business process, with step-by-step instructions, roles, tools, KPIs, and exception handling.",
    buildUserPrompt: (i) =>
      `Process: ${i.process}\nTeam size: ${i.teamSize || "1-10"}\nTools used: ${i.tools || "not specified"}`,
    schema: {
      name: "ops_sop_builder",
      description: "Generate a Standard Operating Procedure",
      parameters: {
        type: "object",
        properties: {
          sopTitle: { type: "string" },
          objective: { type: "string" },
          scope: { type: "string" },
          steps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                stepNumber: { type: "number" },
                title: { type: "string" },
                description: { type: "string" },
                responsible: { type: "string" },
                tools: { type: "array", items: { type: "string" } },
              },
              required: ["stepNumber", "title", "description", "responsible", "tools"],
            },
          },
          kpis: { type: "array", items: { type: "string" } },
          exceptionHandling: { type: "string" },
        },
        required: ["sopTitle", "objective", "scope", "steps", "kpis", "exceptionHandling"],
      },
    },
    assetCategory: "ops",
    assetTitle: (i) => `SOP: ${String(i.process).slice(0, 60)}`,
  },

  "generate-ops-plan": {
    systemPrompt:
      "You are an operations consultant. Design practical workflow + automation systems for small companies.",
    buildUserPrompt: (i) =>
      `Build an ops plan for:\n\nBusiness: ${i.business || i.context || ""}\nTeam size: ${i.team_size || "small"}\nCurrent pains: ${i.pains || i.context || ""}`,
    schema: {
      name: "generate_ops",
      description: "Return a structured ops plan.",
      parameters: {
        type: "object",
        properties: {
          workflows: { type: "array", items: { type: "string" } },
          automations: { type: "array", items: { type: "string" } },
          staffing_notes: { type: "string" },
          kpis: { type: "array", items: { type: "string" } },
        },
        required: ["workflows", "automations", "staffing_notes", "kpis"],
        additionalProperties: false,
      },
    },
    assetCategory: "ops",
    assetTitle: (i) => `Ops Plan: ${String(i.business || i.context || "Untitled").slice(0, 60)}`,
  },

  "generate-followup-sequence": {
    systemPrompt:
      "You are a sales enablement expert writing high-converting multi-touch follow-up sequences.",
    buildUserPrompt: (i) =>
      `Build a follow-up sequence for:\n\nContext: ${i.context || i.goal || ""}\nGoal: ${i.goal || ""}\nChannel mix: ${i.channels || "email"}`,
    schema: {
      name: "generate_followup",
      description: "Return a structured follow-up sequence.",
      parameters: {
        type: "object",
        properties: {
          steps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "number" },
                channel: { type: "string" },
                subject: { type: "string" },
                body: { type: "string" },
              },
              required: ["day", "channel", "subject", "body"],
              additionalProperties: false,
            },
          },
        },
        required: ["steps"],
        additionalProperties: false,
      },
    },
    assetCategory: "followup",
    assetTitle: (i) => `Follow-up: ${String(i.goal || i.context || "Sequence").slice(0, 60)}`,
  },

  // ── Operator tool slugs ──────────────────────────────────────────────────────

  intake: {
    systemPrompt:
      "You are a business intake specialist. Extract and structure key business information from the raw input provided by the founder.",
    buildUserPrompt: (i) => `Raw intake from founder: ${i.raw_input || i.context || ""}`,
    schema: {
      name: "intake_result",
      description: "Structured business intake summary",
      parameters: {
        type: "object",
        properties: {
          business_name: { type: "string" },
          industry: { type: "string" },
          stage: { type: "string" },
          primary_goal: { type: "string" },
          key_challenges: { type: "array", items: { type: "string" } },
          icp_summary: { type: "string" },
          recommended_lane: {
            type: "string",
            enum: ["Idea", "Offer", "Customer", "Systems"],
          },
        },
        required: [
          "business_name",
          "industry",
          "stage",
          "primary_goal",
          "key_challenges",
          "icp_summary",
          "recommended_lane",
        ],
      },
    },
    assetCategory: "intake",
    assetTitle: (i) => `Intake: ${String(i.raw_input || "Business").slice(0, 60)}`,
  },

  strategy: {
    systemPrompt:
      "You are a startup strategist. Build a focused go-to-market and growth strategy covering ICP, offer, pricing, channels, and 90-day priorities.",
    buildUserPrompt: (i) => {
      const areas = Array.isArray(i.focus_areas) ? (i.focus_areas as string[]).join(", ") : "all";
      return `Build a strategy. Focus areas: ${areas}.\nContext: ${JSON.stringify(i)}`;
    },
    schema: {
      name: "strategy_result",
      description: "Comprehensive startup strategy",
      parameters: {
        type: "object",
        properties: {
          icp: { type: "string" },
          offer_recommendation: { type: "string" },
          pricing_recommendation: { type: "string" },
          top_channels: { type: "array", items: { type: "string" } },
          niche_recommendation: { type: "string" },
          ninety_day_priorities: { type: "array", items: { type: "string" } },
          key_risks: { type: "array", items: { type: "string" } },
        },
        required: [
          "icp",
          "offer_recommendation",
          "pricing_recommendation",
          "top_channels",
          "niche_recommendation",
          "ninety_day_priorities",
          "key_risks",
        ],
      },
    },
    assetCategory: "strategy",
    assetTitle: (_i) => `Strategy Plan`,
  },

  blog: {
    systemPrompt:
      "You are an expert content marketer and SEO copywriter. Write a comprehensive, well-structured blog post that ranks for the given keyword and provides genuine value to the reader.",
    buildUserPrompt: (i) =>
      `Write a blog post.\nTopic: ${i.topic}\nPrimary keyword: ${i.primary_keyword || "not specified"}\nTarget audience: ${i.audience || "startup founders"}`,
    schema: {
      name: "blog_post",
      description: "Generate a complete blog post",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          meta_description: { type: "string" },
          intro: { type: "string" },
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                heading: { type: "string" },
                body: { type: "string" },
              },
              required: ["heading", "body"],
            },
          },
          conclusion: { type: "string" },
          cta: { type: "string" },
        },
        required: ["title", "meta_description", "intro", "sections", "conclusion", "cta"],
      },
    },
    assetCategory: "content",
    assetTitle: (i) => `Blog: ${String(i.topic).slice(0, 60)}`,
  },

  social: {
    systemPrompt:
      "You are a social media expert. Write high-engagement social posts for the given platform, with hooks that stop the scroll and CTAs that drive action.",
    buildUserPrompt: (i) =>
      `Platform: ${i.platform || "LinkedIn"}\nTopic: ${i.topic}\nCTA goal: ${i.cta || "drive engagement"}\nTone: ${i.tone || "professional"}`,
    schema: {
      name: "social_post",
      description: "Generate social media posts",
      parameters: {
        type: "object",
        properties: {
          platform: { type: "string" },
          posts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                hook: { type: "string" },
                body: { type: "string" },
                cta: { type: "string" },
                hashtags: { type: "array", items: { type: "string" } },
              },
              required: ["hook", "body", "cta", "hashtags"],
            },
          },
        },
        required: ["platform", "posts"],
      },
    },
    assetCategory: "content",
    assetTitle: (i) => `Social Post: ${String(i.topic).slice(0, 60)}`,
  },

  email_sequence: {
    systemPrompt:
      "You are an email marketing expert. Write compelling email sequences that nurture leads, build trust, and drive conversions.",
    buildUserPrompt: (i) =>
      `Sequence type: ${i.sequence_type || "nurture"}\nTopic: ${i.topic}\nEmail count: ${i.email_count || 5}\nAudience: ${i.audience || "prospects"}`,
    schema: {
      name: "email_sequence",
      description: "Generate an email sequence",
      parameters: {
        type: "object",
        properties: {
          sequence_name: { type: "string" },
          emails: {
            type: "array",
            items: {
              type: "object",
              properties: {
                number: { type: "number" },
                send_day: { type: "number" },
                subject: { type: "string" },
                preview_text: { type: "string" },
                body: { type: "string" },
                cta: { type: "string" },
              },
              required: ["number", "send_day", "subject", "preview_text", "body", "cta"],
            },
          },
        },
        required: ["sequence_name", "emails"],
      },
    },
    assetCategory: "email",
    assetTitle: (i) => `Email Sequence: ${String(i.topic).slice(0, 60)}`,
  },

  sales_script: {
    systemPrompt:
      "You are a sales coach. Write a battle-tested sales script for the given call type, with strong openers, discovery questions, objection handling, and a clear close.",
    buildUserPrompt: (i) =>
      `Script type: ${i.script_type || "discovery"}\nScenario: ${i.scenario_notes || "B2B SaaS sales call"}`,
    schema: {
      name: "sales_script",
      description: "Generate a sales call script",
      parameters: {
        type: "object",
        properties: {
          script_type: { type: "string" },
          opener: { type: "string" },
          discovery_questions: { type: "array", items: { type: "string" } },
          pitch_section: { type: "string" },
          objection_handlers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                objection: { type: "string" },
                response: { type: "string" },
              },
              required: ["objection", "response"],
            },
          },
          close: { type: "string" },
          follow_up: { type: "string" },
        },
        required: [
          "script_type",
          "opener",
          "discovery_questions",
          "pitch_section",
          "objection_handlers",
          "close",
          "follow_up",
        ],
      },
    },
    assetCategory: "sales",
    assetTitle: (i) => `Sales Script: ${String(i.script_type || "Discovery").slice(0, 60)}`,
  },

  ad_creative: {
    systemPrompt:
      "You are a direct-response advertising expert. Write ad creative variants that stop the scroll, speak to pain, and drive clicks for the given offer and platform.",
    buildUserPrompt: (i) =>
      `Offer: ${i.offer}\nAudience pain: ${i.audience_pain}\nPlatform: ${i.platform || "meta"}`,
    schema: {
      name: "ad_creative",
      description: "Generate ad creative variants",
      parameters: {
        type: "object",
        properties: {
          platform: { type: "string" },
          variants: {
            type: "array",
            items: {
              type: "object",
              properties: {
                headline: { type: "string" },
                primary_text: { type: "string" },
                description: { type: "string" },
                cta: { type: "string" },
                angle: { type: "string" },
              },
              required: ["headline", "primary_text", "description", "cta", "angle"],
            },
          },
          targeting_notes: { type: "string" },
        },
        required: ["platform", "variants", "targeting_notes"],
      },
    },
    assetCategory: "ads",
    assetTitle: (i) => `Ad Creative: ${String(i.offer).slice(0, 60)}`,
  },

  vsl: {
    systemPrompt:
      "You are a VSL (Video Sales Letter) copywriter. Write a complete, high-converting VSL script using proven direct-response frameworks.",
    buildUserPrompt: (i) =>
      `Product: ${i.product_summary}\nLength target: ${i.length_minutes || 10} minutes`,
    schema: {
      name: "vsl_script",
      description: "Generate a VSL script",
      parameters: {
        type: "object",
        properties: {
          hook: { type: "string" },
          problem_agitation: { type: "string" },
          solution_reveal: { type: "string" },
          proof_section: { type: "string" },
          offer_stack: { type: "string" },
          guarantee: { type: "string" },
          close_and_cta: { type: "string" },
          full_script: { type: "string" },
          estimated_minutes: { type: "number" },
        },
        required: [
          "hook",
          "problem_agitation",
          "solution_reveal",
          "proof_section",
          "offer_stack",
          "guarantee",
          "close_and_cta",
          "full_script",
          "estimated_minutes",
        ],
      },
    },
    assetCategory: "copy",
    assetTitle: (i) => `VSL: ${String(i.product_summary).slice(0, 60)}`,
  },

  landing_page: {
    systemPrompt:
      "You are a conversion-focused copywriter. Write complete landing page copy for the given product including headline, subheadline, hero, features, social proof, FAQ, and CTA sections.",
    buildUserPrompt: (i) =>
      `Offer: ${i.offer}\nAudience awareness: ${i.audience_awareness || "solution_aware"}\nPrimary CTA: ${i.primary_cta || "Get Started"}`,
    schema: {
      name: "landing_page_copy",
      description: "Generate complete landing page copy",
      parameters: {
        type: "object",
        properties: {
          headline: { type: "string" },
          subheadline: { type: "string" },
          hero_copy: { type: "string" },
          features: {
            type: "array",
            items: {
              type: "object",
              properties: { title: { type: "string" }, description: { type: "string" } },
              required: ["title", "description"],
            },
          },
          social_proof: { type: "string" },
          faq: {
            type: "array",
            items: {
              type: "object",
              properties: { question: { type: "string" }, answer: { type: "string" } },
              required: ["question", "answer"],
            },
          },
          cta_copy: { type: "string" },
        },
        required: [
          "headline",
          "subheadline",
          "hero_copy",
          "features",
          "social_proof",
          "faq",
          "cta_copy",
        ],
      },
    },
    assetCategory: "copy",
    assetTitle: (i) => `Landing Page: ${String(i.offer).slice(0, 60)}`,
  },

  cold_email: {
    systemPrompt:
      "You are a cold email specialist. Write personalized cold outreach emails that feel human, lead with value, and get replies.",
    buildUserPrompt: (i) =>
      `ICP: ${i.icp}\nOffer: ${i.offer}\nSender: ${i.sender_name} at ${i.sender_company}`,
    schema: {
      name: "cold_email",
      description: "Generate cold email variants",
      parameters: {
        type: "object",
        properties: {
          subject_lines: { type: "array", items: { type: "string" } },
          emails: {
            type: "array",
            items: {
              type: "object",
              properties: {
                angle: { type: "string" },
                subject: { type: "string" },
                body: { type: "string" },
                ps_line: { type: "string" },
              },
              required: ["angle", "subject", "body", "ps_line"],
            },
          },
          follow_up_template: { type: "string" },
        },
        required: ["subject_lines", "emails", "follow_up_template"],
      },
    },
    assetCategory: "sales",
    assetTitle: (i) => `Cold Email: ${String(i.icp).slice(0, 60)}`,
  },

  niche_validator: {
    systemPrompt:
      "You are a market research expert. Validate the given niche for business viability — assess demand, competition, monetisation potential, and entry timing.",
    buildUserPrompt: (i) => `Niche: ${i.niche_idea}\nGeography: ${i.geography || "global"}`,
    schema: {
      name: "niche_validation",
      description: "Validate a niche for business viability",
      parameters: {
        type: "object",
        properties: {
          verdict: { type: "string", enum: ["strong", "viable", "risky", "avoid"] },
          demand_score: { type: "number" },
          competition_score: { type: "number" },
          monetisation_score: { type: "number" },
          overall_score: { type: "number" },
          strengths: { type: "array", items: { type: "string" } },
          risks: { type: "array", items: { type: "string" } },
          sub_niches: { type: "array", items: { type: "string" } },
          recommended_entry: { type: "string" },
        },
        required: [
          "verdict",
          "demand_score",
          "competition_score",
          "monetisation_score",
          "overall_score",
          "strengths",
          "risks",
          "sub_niches",
          "recommended_entry",
        ],
      },
    },
    assetCategory: "research",
    assetTitle: (i) => `Niche Validation: ${String(i.niche_idea).slice(0, 60)}`,
  },

  icp: {
    systemPrompt:
      "You are an ICP (Ideal Customer Profile) strategist. Define the most profitable, reachable, and conversion-ready customer profile for the given offer.",
    buildUserPrompt: (i) =>
      `Niche: ${i.niche}\nOffer: ${i.offer}\nExisting customers: ${i.current_customer_examples || "none yet"}`,
    schema: {
      name: "icp_profile",
      description: "Define the ideal customer profile",
      parameters: {
        type: "object",
        properties: {
          primary_icp: { type: "string" },
          demographics: { type: "string" },
          psychographics: { type: "string" },
          pain_points: { type: "array", items: { type: "string" } },
          goals: { type: "array", items: { type: "string" } },
          buying_triggers: { type: "array", items: { type: "string" } },
          objections: { type: "array", items: { type: "string" } },
          where_to_find_them: { type: "array", items: { type: "string" } },
          message_that_resonates: { type: "string" },
        },
        required: [
          "primary_icp",
          "demographics",
          "psychographics",
          "pain_points",
          "goals",
          "buying_triggers",
          "objections",
          "where_to_find_them",
          "message_that_resonates",
        ],
      },
    },
    assetCategory: "strategy",
    assetTitle: (i) => `ICP: ${String(i.niche).slice(0, 60)}`,
  },

  offer: {
    systemPrompt:
      "You are an expert offer architect. Design an irresistible offer for the given product or service using value stacking, pricing psychology, and urgency mechanics.",
    buildUserPrompt: (i) =>
      `Core product: ${i.core_product}\nTarget market: ${i.target_market}\nPrice target: ${i.price_target || "market rate"}`,
    schema: {
      name: "generate_offer",
      description: "Generate an irresistible offer",
      parameters: {
        type: "object",
        properties: {
          offer_name: { type: "string" },
          core_deliverable: { type: "string" },
          bonuses: { type: "array", items: { type: "string" } },
          guarantee: { type: "string" },
          price: { type: "string" },
          urgency_mechanic: { type: "string" },
          headline: { type: "string" },
          one_liner: { type: "string" },
        },
        required: [
          "offer_name",
          "core_deliverable",
          "bonuses",
          "guarantee",
          "price",
          "urgency_mechanic",
          "headline",
          "one_liner",
        ],
      },
    },
    assetCategory: "offer",
    assetTitle: (i) => `Offer: ${String(i.core_product).slice(0, 60)}`,
  },

  pricing: {
    systemPrompt:
      "You are a pricing strategist. Design an optimal pricing strategy for the given business model and market.",
    buildUserPrompt: (i) =>
      `Business model: ${i.business_model}\nValue estimate: ${i.offer_value_estimate}\nMarket avg: ${i.market_avg_price || "unknown"}`,
    schema: {
      name: "pricing_strategy",
      description: "Generate a pricing strategy",
      parameters: {
        type: "object",
        properties: {
          recommended_model: { type: "string" },
          recommended_price: { type: "string" },
          tiers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                price: { type: "string" },
                features: { type: "array", items: { type: "string" } },
              },
              required: ["name", "price", "features"],
            },
          },
          psychological_tactics: { type: "array", items: { type: "string" } },
          rationale: { type: "string" },
        },
        required: [
          "recommended_model",
          "recommended_price",
          "tiers",
          "psychological_tactics",
          "rationale",
        ],
      },
    },
    assetCategory: "strategy",
    assetTitle: (i) => `Pricing Strategy: ${String(i.business_model).slice(0, 60)}`,
  },

  pitch_deck: {
    systemPrompt:
      "You are a world-class pitch deck consultant. Create a compelling, investor-grade pitch deck outline and copy for the given startup.",
    buildUserPrompt: (i) =>
      `Company: ${i.company_name}\nProblem: ${i.problem}\nSolution: ${i.solution}\nTraction: ${i.traction || "pre-launch"}\nAsk: ${i.ask_amount || "$500k"}\nDeck type: ${i.deck_type || "seed"}`,
    schema: {
      name: "pitch_deck",
      description: "Generate pitch deck content",
      parameters: {
        type: "object",
        properties: {
          slides: {
            type: "array",
            items: {
              type: "object",
              properties: {
                slide_number: { type: "number" },
                title: { type: "string" },
                key_points: { type: "array", items: { type: "string" } },
                speaker_notes: { type: "string" },
              },
              required: ["slide_number", "title", "key_points", "speaker_notes"],
            },
          },
          elevator_pitch: { type: "string" },
          one_line_summary: { type: "string" },
        },
        required: ["slides", "elevator_pitch", "one_line_summary"],
      },
    },
    assetCategory: "funding",
    assetTitle: (i) => `Pitch Deck: ${String(i.company_name).slice(0, 60)}`,
  },

  lead_magnet: {
    systemPrompt:
      "You are a lead generation expert. Create a high-value lead magnet concept and complete content outline for the given niche and ICP pain point.",
    buildUserPrompt: (i) =>
      `Niche: ${i.niche}\nICP pain point: ${i.icp_pain_point}\nFormat: ${i.format || "pdf_guide"}`,
    schema: {
      name: "lead_magnet",
      description: "Generate a lead magnet",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          subtitle: { type: "string" },
          format: { type: "string" },
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                heading: { type: "string" },
                content: { type: "string" },
              },
              required: ["heading", "content"],
            },
          },
          opt_in_headline: { type: "string" },
          opt_in_subtext: { type: "string" },
          delivery_sequence: { type: "array", items: { type: "string" } },
        },
        required: [
          "title",
          "subtitle",
          "format",
          "sections",
          "opt_in_headline",
          "opt_in_subtext",
          "delivery_sequence",
        ],
      },
    },
    assetCategory: "growth",
    assetTitle: (i) => `Lead Magnet: ${String(i.niche).slice(0, 60)}`,
  },

  automation: {
    systemPrompt:
      "You are an automation architect. Design a practical, implementable automation workflow for the given business process using real tools.",
    buildUserPrompt: (i) =>
      `Process: ${i.process_description}\nIntegrations: ${Array.isArray(i.integrations) ? (i.integrations as string[]).join(", ") : "any"}`,
    schema: {
      name: "automation_plan",
      description: "Generate an automation workflow plan",
      parameters: {
        type: "object",
        properties: {
          workflow_name: { type: "string" },
          trigger: { type: "string" },
          steps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                step: { type: "number" },
                action: { type: "string" },
                tool: { type: "string" },
                notes: { type: "string" },
              },
              required: ["step", "action", "tool", "notes"],
            },
          },
          integrations_needed: { type: "array", items: { type: "string" } },
          time_saved_per_week: { type: "string" },
          implementation_effort: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: [
          "workflow_name",
          "trigger",
          "steps",
          "integrations_needed",
          "time_saved_per_week",
          "implementation_effort",
        ],
      },
    },
    assetCategory: "ops",
    assetTitle: (i) => `Automation: ${String(i.process_description).slice(0, 60)}`,
  },

  client_report: {
    systemPrompt:
      "You are a client success manager. Generate a comprehensive client performance report for the given period with key metrics, wins, areas for improvement, and next steps.",
    buildUserPrompt: (i) =>
      `Client ID: ${i.client_id}\nPeriod: ${i.period_label || `${i.period_start} to ${i.period_end}`}`,
    schema: {
      name: "client_report",
      description: "Generate a client performance report",
      parameters: {
        type: "object",
        properties: {
          report_title: { type: "string" },
          period: { type: "string" },
          executive_summary: { type: "string" },
          key_metrics: {
            type: "array",
            items: {
              type: "object",
              properties: {
                metric: { type: "string" },
                value: { type: "string" },
                trend: { type: "string", enum: ["up", "down", "flat"] },
                note: { type: "string" },
              },
              required: ["metric", "value", "trend", "note"],
            },
          },
          wins: { type: "array", items: { type: "string" } },
          improvements: { type: "array", items: { type: "string" } },
          next_steps: { type: "array", items: { type: "string" } },
        },
        required: [
          "report_title",
          "period",
          "executive_summary",
          "key_metrics",
          "wins",
          "improvements",
          "next_steps",
        ],
      },
    },
    assetCategory: "reports",
    assetTitle: (i) => `Client Report: ${String(i.client_id).slice(0, 60)}`,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const toolKey = body.toolKey as string | undefined;
  if (!toolKey) return jsonResponse({ error: "toolKey is required" }, 400);

  const config = TOOLS[toolKey];
  if (!config) return jsonResponse({ error: `Unknown tool: ${toolKey}` }, 400);

  // Pass the pre-parsed input so runTool doesn't try to re-read the consumed stream
  const input = (body.input as Record<string, unknown>) || {};

  return runTool({
    req,
    toolKey,
    systemPrompt: config.systemPrompt,
    buildUserPrompt: config.buildUserPrompt,
    schema: config.schema,
    assetCategory: config.assetCategory,
    assetTitle: config.assetTitle,
    preloadedInput: input,
  });
});
