# Mission-Based Launchpad + Nova Memory Upgrade

Transforms Launchpad from a **toolbox of features** into a **mission-based, AI-guided
experience**: Nova runs a playbook for the founder, surfaces one decision at a time,
researches their actual business, and keeps their goal in front of every step.

## What changed

### 1. Launchpad is now a playbook runner (not a tool grid)

`src/routes/app.launchpad.index.tsx` was rewritten. Instead of leading with a
searchable grid of 20 tools, it now leads with:

- **North-star goal strip** — the founder's primary goal, pinned above everything.
- **Active mission** — the playbook for their lane (`selectPlaybook`), with progress.
- **Current step, framed as a decision** — Nova's question, why it matters, "you're
  done when…", and a single primary action that runs the underlying tool in the
  background. Other steps live in a quiet rail; you can focus any of them.
- **Nova research panel** — grounded, idea-specific research for the current step.
- **"Browse all tools"** — the old toolbox, preserved but collapsed/secondary.

The playbooks themselves are data: `src/lib/playbooks.ts` (one per lane —
Validate Your Idea / Build & Price Your Offer / Land Your First 10 Customers /
Build Your Growth System). Progress is derived live from `tool_runs` — no new
tables. Unit tests: `src/lib/__tests__/playbooks.test.ts`.

### 2. "Perplexity research" is real (with graceful fallback)

- **`supabase/functions/nova-research/index.ts`** — new edge function. Uses
  **Perplexity Sonar** (live web search + citations) when `PERPLEXITY_API_KEY`
  is set, and falls back to Claude otherwise. Returns a compact, normalized brief
  `{ summary, insights[], recommendation, sources[], grounded }`, grounded in the
  founder's verified context (`assembleContext`).
- **`src/lib/research.ts`** — `runNovaResearch()` never throws: it tries
  `nova-research`, then the deployed `operator` function, then a deterministic
  local brief — so the UI works before the new function is even deployed.
- **`src/components/app/playbook/NovaResearchPanel.tsx`** — on-demand panel
  (cached per step to avoid re-billing), with a "Web-grounded" badge and sources.

### 3. Nova memory & subagents keep the goal in front

The core memory bug: `nova-chat` injected the Business Context Graph, but the
**`operator` function and its mentor subagents did not** — they only saw lane +
mission title. And inside the graph, the founder's **goal was buried mid-block**.

- **`supabase/functions/_shared/context.ts`** — `assembleContext` now opens with a
  pinned **`## NORTH STAR`** block (primary goal · active mission + current step ·
  stage · biggest thing to fix) and an instruction to anchor every answer to it and
  end with the single highest-leverage next action. It also now pulls in the
  **active mission + current step** (previously ignored).
- **`supabase/functions/operator/index.ts`** — both the main operator flow **and**
  the mentor subagents now load `assembleContext`, so no Nova surface loses sight of
  the founder's goal and mission.

## Deploying

1. Set `PERPLEXITY_API_KEY` (already documented in `.env.example`) in the Supabase
   project secrets. Without it, research falls back to Claude automatically.
2. Deploy the new function: `supabase functions deploy nova-research`
   (registered in `supabase/config.toml` with `verify_jwt = true`).
3. Redeploy `operator` and any function sharing `_shared/context.ts`
   (`nova-chat`, `run-tool`) to pick up the memory changes.

Nothing breaks if you deploy nothing: the frontend degrades gracefully and the
context changes are additive.
