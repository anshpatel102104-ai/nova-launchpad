import { runTool } from "../_shared/helpers.ts";

Deno.serve((req) =>
  runTool({
    req,
    toolKey: "generate-gtm-strategy",
    systemPrompt: "You are a GTM strategist. Build practical, channel-specific go-to-market plans.",
    buildUserPrompt: (i) =>
      `Build a GTM plan for:\n\nBusiness: ${i.business || ""}\nOffer: ${i.offer || ""}\nTarget: ${i.target || ""}\nGoal: ${i.goal || ""}`,
    schema: {
      name: "generate_gtm",
      description: "Return a structured GTM plan.",
      parameters: {
        type: "object",
        properties: {
          audience: { type: "string" },
          channels: { type: "array", items: { type: "string" } },
          messaging: { type: "string" },
          plan_30d: {
            type: "array",
            items: {
              type: "object",
              properties: {
                week: { type: "string" },
                focus: { type: "string" },
                actions: { type: "array", items: { type: "string" } },
              },
              required: ["week", "focus", "actions"],
              additionalProperties: false,
            },
          },
        },
        required: ["audience", "channels", "messaging", "plan_30d"],
        additionalProperties: false,
      },
    },
    assetCategory: "gtm",
    assetTitle: (i) => `GTM: ${String(i.business || "Plan").slice(0, 60)}`,
  }),
);
