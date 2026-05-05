import { runTool } from "../_shared/helpers.ts";

Deno.serve((req) =>
  runTool({
    req,
    toolKey: "generate-followup-sequence",
    systemPrompt:
      "You are a sales enablement expert writing high-converting multi-touch follow-up sequences.",
    buildUserPrompt: (i) =>
      `Build a follow-up sequence for:\n\nContext: ${i.context || ""}\nGoal: ${i.goal || ""}\nChannel mix: ${i.channels || "email"}`,
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
    assetTitle: (i) => `Follow-up: ${String(i.goal || "Sequence").slice(0, 60)}`,
  }),
);
