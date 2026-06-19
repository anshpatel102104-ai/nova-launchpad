# Automation Builder & Publishing — GoHighLevel / HubSpot parity

_Shipped: 2026-06-19. Branch: `claude/optimistic-ramanujan-ihqzmi`._

This change turns the visual workflow Builder into a GoHighLevel-style automation
system: a rich trigger/action library, prebuilt recipes, and — the headline ask —
the ability to **build an automation once and publish it, choosing who it's for**
(yourself, a specific client, all your clients, or a public marketplace).

---

## What shipped

### 1. Publish an automation & pick the audience

`PublishModal` in `src/routes/app.builder.tsx` lets an operator publish the current
canvas as a reusable **template**, choosing an audience scope:

| Scope          | Meaning                                                            |
| -------------- | ----------------------------------------------------------------- |
| `self`         | Private template only this workspace can install.                 |
| `client`       | Published for one specific CRM contact (searchable client picker). |
| `all_clients`  | Rolled out to every client the agency manages.                    |
| `marketplace`  | Public — any other operator can install it.                       |

Backed by two new tables (`supabase/migrations/20260619000001_automation_templates.sql`):

- **`automation_templates`** — the published snapshot (name, description, category,
  `blocks` JSONB, `trigger_summary`, `audience_scope`, `target_contact_id`, tags,
  `install_count`, status). RLS: org members manage their own; **marketplace** rows
  are readable by every authenticated user.
- **`automation_template_installs`** — install ledger.
- **`install_automation_template(...)`** — `SECURITY DEFINER` RPC that records an
  install and bumps `install_count` even for a marketplace template owned by
  another org (which RLS would otherwise block).

### 2. Workflow Templates library / marketplace

New route `src/routes/app.workflow-templates.tsx` (nav: **Automate → Workflow
Templates**):

- **My templates** — everything this org published, with audience badges, install
  counts, edit (re-open in Builder), and archive.
- **Marketplace** — public templates ranked by installs; one-click **Install**
  records the install and opens the workflow in the Builder ready to activate.
- **Quick-start recipes** strip that deep-links into the Builder (`?recipe=slug`).

### 3. Prebuilt recipes (GHL "recipes" / snapshots)

`src/lib/automation-recipes.ts` — 8 ready-to-edit workflows across Lead Nurture,
Booking, Sales, Retention, Reputation, and Onboarding (Speed-to-Lead, Appointment
Reminders & No-Show Rescue, Abandoned Checkout Recovery, Pipeline Auto-Mover,
5-Star Review Request, Win-Back, New Client Onboarding, Long-Term Nurture). Loaded
from the Builder's **Templates** picker or via `?recipe=` deep-link.

### 4. Builder upgrades

- The whole block catalog moved to a shared module
  `src/lib/automation-blocks.ts` (single source of truth for Builder, recipes, and
  marketplace previews).
- **Save** now writes to `workflow_builders` (the purpose-built table that
  `AdaptiveGuidance` already reads) instead of the orphaned `automation_drafts`.
- Deep-link loading (`?recipe=` / `?template=`), a "Start from a workflow" picker
  (recipes + your published templates), and a Publish flow.

---

## Gap-fill vs GoHighLevel & HubSpot

The trigger/action/logic palette went from ~20 blocks to **40+**, adding the
primitives those platforms are built on:

**New triggers** — Tag Added, Appointment Booked, Email Event (open/click/reply/
bounce/unsub), Pipeline Stage Changed, Customer Replied, Birthday/Date, Call
Status, Abandoned Checkout, Contact Created, Property Changed.

**New actions** — Add/Remove Tag, Move Pipeline Stage, Create Opportunity, Assign
Owner (round-robin), Ringless Voicemail, Add/Remove from Workflow (enroll/unenroll),
Set Field/Property value, Add Note, Request Review (reputation).

**New logic** — Wait Until (event/time), A/B Split test (plus existing If/Else,
Wait, Loop).

Together with publishing, audience targeting, the recipe library, and the
marketplace, this brings the platform to GHL-style **workflows + snapshots/recipes**
and HubSpot-style **workflows/sequences + enrollment** on the Nova (operate) side.

---

## Follow-ups / deferred

- **Apply the migration** (`20260619000001_automation_templates.sql`) to the live
  Supabase project so publish/install work at runtime. The UI degrades gracefully
  (a toast error) until then.
- **Execution engine** — blocks currently describe intent and run in a simulated
  test pass. Wiring triggers/actions to real delivery (email/SMS/telephony) is the
  same deferred infra called out in `GAP_ANALYSIS.md` §F.
- **Branch rendering** — If/Else and A/B Split show Yes/No paths visually but the
  canvas is still a linear list; true branching layout is a future enhancement.
