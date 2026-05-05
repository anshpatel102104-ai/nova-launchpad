import { runTool } from "../_shared/helpers.ts";

Deno.serve((req) =>
  runTool({
    req,
    toolKey: "generate-pitch",
    systemPrompt: "You are a world-class copywriter crafting investor-ready pitches.",
    buildUserPrompt: (i) =>
      `Create a pitch for:\n\nBusiness: ${i.business || ""}\nOffer: ${i.offer || ""}\nTarget: ${i.target || ""}`,
    schema: {
      name: "generate_pitch",
      description: "Return a structured pitch.",
      parameters: {
        type: "object",
        properties: {
          headline: { type: "string" },
          problem: { type: "string" },
          offer: { type: "string" },
          outcome: { type: "string" },
          cta: { type: "string" },
        },
        required: ["headline", "problem", "offer", "outcome", "cta"],
        additionalProperties: false,
      },
    },
    assetCategory: "pitch",
    assetTitle: (i) => `Pitch: ${String(i.business || "Untitled").slice(0, 60)}`,
  }),
);
