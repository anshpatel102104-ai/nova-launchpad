/**
 * Server-side AI tool runner — calls the run-tool Supabase edge function.
 * The Anthropic API key lives in the edge function environment only.
 * No API key is ever exposed to the browser.
 */

import { supabase } from "@/integrations/supabase/client";

export async function runTool(
  toolKey: string,
  input: Record<string, unknown>,
  context: { orgId: string | null; userId?: string | undefined },
  _onChunk?: (chunk: string) => void,
): Promise<{ output: Record<string, unknown>; run_id?: string }> {
  if (!context.orgId) throw new Error("Not signed in to an organization.");

  // analyze-website has a dedicated function with live URL fetching — route it directly.
  if (toolKey === "analyze-website") {
    const url = ((input.url || input.context || input.idea || "") as string).trim();
    const { data, error } = await supabase.functions.invoke("analyze-website", {
      body: { url },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    if (!data?.output) throw new Error("No output returned from AI. Please try again.");
    return { output: data.output as Record<string, unknown>, run_id: data.run_id as string | undefined };
  }

  const { data, error } = await supabase.functions.invoke("run-tool", {
    body: {
      toolKey,
      input,
      organizationId: context.orgId,
    },
  });

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  if (!data?.output) throw new Error("No output returned from AI. Please try again.");

  return {
    output: data.output as Record<string, unknown>,
    run_id: data.run_id as string | undefined,
  };
}

/**
 * Always returns true — tools are server-side, no local key needed.
 * Kept for interface compatibility with existing imports.
 */
export function hasLocalAiKey(): boolean {
  return true;
}
