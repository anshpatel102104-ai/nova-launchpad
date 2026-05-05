import { runTool } from "../_shared/helpers.ts";

Deno.serve((req) =>
  runTool({
    req,
    toolKey: "generate-offer",
    systemPrompt:
      "You are an offer architect. Construct irresistible offers with clear value and risk reversal.",
    buildUserPrompt: (i) =>
      `Design an offer for:\n\nBusiness: ${i.business || ""}\nTarget: ${i.target || ""}\nDesired outcome: ${i.outcome || ""}`,
    schema: {
      name: "generate_offer",
      description: "Return a structured offer.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          promise: { type: "string" },
          deliverables: { type: "array", items: { type: "string" } },
          price_anchor: { type: "string" },
          guarantee: { type: "string" },
        },
        required: ["name", "promise", "deliverables", "price_anchor", "guarantee"],
        additionalProperties: false,
      },
    },
    assetCategory: "offer",
    assetTitle: (_, o) => `Offer: ${String(o.name || "Untitled").slice(0, 60)}`,
  }),
);
