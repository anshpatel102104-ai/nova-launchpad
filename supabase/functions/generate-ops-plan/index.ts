import { runTool } from "../_shared/helpers.ts";

Deno.serve((req) =>
  runTool({
    req,
    toolKey: "generate-ops-plan",
    systemPrompt:
      "You are an operations consultant. Design practical workflow + automation systems for small companies.",
    buildUserPrompt: (i) =>
      `Build an ops plan for:\n\nBusiness: ${i.business || ""}\nTeam size: ${i.team_size || "small"}\nCurrent pains: ${i.pains || ""}`,
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
    assetTitle: (i) => `Ops Plan: ${String(i.business || "Untitled").slice(0, 60)}`,
  }),
);
