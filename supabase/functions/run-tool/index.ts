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
