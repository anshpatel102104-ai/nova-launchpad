# Nova Launchpad — Gap Analysis & Roadmap

_What's missing to operate like HubSpot on the CRM side, and to create & scale users — plus
the two-view (Launchpad / NOVA) restructure that ships alongside this document._

Last updated: 2026-06-15

---

## Context

Two questions drove this analysis:

1. **CRM:** what's missing for Nova to operate like HubSpot?
2. **Create & scale users:** what delivery/infrastructure details are missing to onboard and
   grow many users?

The platform is far more mature than an MVP — full Stripe billing, multi-tenant orgs with RLS,
resumable two-track onboarding, 28 edge functions, 8 Cloudflare Workers, 78 tables. The gaps
are specific, not foundational. This doc inventories them, ordered by impact, and lays out a
phased roadmap that **interleaves CRM depth and scaling work** so neither axis stalls.

It also documents the **two-view restructure** (Launchpad vs NOVA) built in this same change.

---

## What already works (do not rebuild)

- **CRM:** `leads` pipeline with Kanban/table/list/forecast (`src/routes/app.nova.crm.tsx`),
  scoring, win-probability, weighted forecast, tags/priority, `crm_activities` timeline,
  `contact_notes`, n8n automations.
- **SaaS plumbing:** Supabase Auth, multi-tenant `organizations` + `organization_members`
  (RLS), full Stripe billing (4 tiers, checkout, portal, webhooks, usage metering), resumable
  2-track onboarding, settings + encrypted integrations.
- **Guidance system:** a 5th-grade hand-holding layer already exists
  (`src/lib/step-execution-guidance.ts`, `StepExecutionGuide`, `ToolGuidePanel`,
  `NextStepHero`, mission seeds).

---

## A. CRM gaps vs HubSpot (priority-ordered)

| #   | Gap                                 | Evidence / Notes                                                                                                                                                          | Priority      |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| 1   | **No Contacts object**              | `contacts` table is absent from all 43 migrations, yet `src/routes/app.contacts.tsx` and `workers/nova-contacts-api/` query it. Contacts is **broken at the data layer**. | P0 (blocking) |
| 2   | **No Companies / Accounts object**  | No company records, no contact↔company link. HubSpot's core is Contacts + Companies + Deals + Tickets.                                                                    | P0            |
| 3   | **Objects not linked**              | No Deal↔Contact↔Company associations — the relationship graph HubSpot is built on.                                                                                        | P1            |
| 4   | **Email**                           | No 2-way sync, send-from-CRM, open/click tracking, or logging. `email` activity type is a stub.                                                                           | P1            |
| 5   | **Calls / meetings / tasks**        | Activity types defined; no real objects or integrations (no telephony, no calendar sync).                                                                                 | P2            |
| 6   | **Sequences / cadences**            | No object-aware multi-step outreach builder. n8n exists but isn't tied to CRM records.                                                                                    | P2            |
| 7   | **Lead-scoring engine**             | `score` is a stored number; no rules, decay, or automatic recompute.                                                                                                      | P2            |
| 8   | **Custom fields UI**                | `custom_fields` JSONB exists; no property manager / builder.                                                                                                              | P3            |
| 9   | **Lists & segmentation**            | Only ad-hoc filters; no saved smart lists.                                                                                                                                | P3            |
| 10  | **Import / export / dedupe**        | No CSV import, no bulk loader, no export, no merge.                                                                                                                       | P2            |
| 11  | **Reporting builder**               | Only fixed ROI/weekly reports; no custom dashboards.                                                                                                                      | P3            |
| 12  | **Forms / landing pages / capture** | No top-of-funnel lead ingestion into the CRM.                                                                                                                             | P3            |

---

## B. Create & scale-users gaps (priority-ordered)

| #   | Gap                              | Evidence / Notes                                                                                                                  | Priority |
| --- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1   | **Team / seat management UI**    | Roles exist in `organization_members`; `auth.invite.tsx` is accept-only. No invite/member/role screen. Blocks real team accounts. | P1       |
| 2   | **Zero automated tests**         | No Vitest/Jest/Playwright. CI only type-checks + lints. **Highest risk for scaling.**                                             | P1       |
| 3   | **No error tracking / alerting** | No Sentry; logs scattered; no centralized alerts.                                                                                 | P1       |
| 4   | **In-memory rate limiting**      | `_shared/security.ts` limits per-isolate — breaks across regions. Needs KV/Upstash.                                               | P2       |
| 5   | **No caching layer**             | No Redis/Cloudflare KV for sessions, queries, or rate limits.                                                                     | P2       |
| 6   | **No in-app notifications**      | No notification center, no real-time alerts.                                                                                      | P2       |
| 7   | **No real-time**                 | No Supabase Realtime / websockets; updates are polling-based.                                                                     | P3       |
| 8   | **No full-text search**          | Only embedding search on `context_sources`; CRM lists unindexed.                                                                  | P3       |
| 9   | **Auth depth**                   | No SSO/OAuth, no MFA, minimal password policy.                                                                                    | P3       |
| 10  | **Billing depth**                | No seat-based/usage billing, no annual plans, no trial enforcement.                                                               | P3       |
| 11  | **Ops / docs**                   | No root README, no API spec, no deploy/DR runbook; no Storage bucket configured.                                                  | P2       |

---

## C. Two-view architecture (Launchpad / NOVA) — shipped with this doc

**Problem:** one shell showed every feature to everyone — confusing for both new founders and
running operators.

**Solution:** the app now presents **two clear, switchable views**, backed by the existing
`workspaces.mode` column (`create` | `operate`):

- **Launchpad** (create & launch, orange) — Journey, Workbench, Customers, Library;
  primary nav = Build / Launch / Grow.
- **NOVA** (operate & scale, cyan) — Customers/CRM, Automate, Insights, Library;
  primary nav = Automate / Optimize / Scale.

**How it works:**

- `src/hooks/use-workspace-mode.ts` — reads/writes `workspaces.mode` (RLS:
  `workspaces_update_owner`), optimistic cache update; guests persist to `sessionStorage`.
- `src/components/app/ViewSwitcher.tsx` — two-segment toggle in the sidebar header.
- `src/components/app/AppSidebar.tsx` — filters the Toolbox to each view's groups
  (`LAUNCHPAD_GROUP_IDS` / `NOVA_GROUP_IDS`) and swaps the primary nav.

**NOVA = explained for a total beginner.** NOVA's operate mission (`buildOperatorBaseline`
in `supabase/functions/_shared/missionSeeds.ts`) was already seeded but its tools had **no
guidance entries**, so steps fell back to generic copy. We added 5th-grade guidance for the
operate/scale tools (`kpi-dashboard`, `seo-audit`, `launch-checklist`, `email-sequence`,
`ad-copy`) in `src/lib/step-execution-guidance.ts`, so NOVA now gets the same
"what / why / 3 small steps / done-when" hand-holding Launchpad has — in `StepExecutionGuide`,
`NextStepHero`, `MissionChecklist`, and `ToolGuidePanel`.

---

## D. Phased roadmap (balanced CRM + scale)

### Phase 0 — Unblock (days)

- Create `contacts` + `companies` tables (migration + RLS), wire to existing
  `workers/nova-contacts-api/`, fix the broken `app.contacts.tsx`. **[CRM A1, A2]**
- Two-view split + NOVA 5th-grade guidance. **[C — done in this change]**

### Phase 1 — CRM core + safety net (weeks 1–4)

- Deal↔Contact↔Company associations. **[A3]**
- Team / seat management UI on existing `organization_members` backend. **[B1]**
- Sentry + centralized alerting. **[B3]**
- Vitest + critical-path tests; root README. **[B2, B11]**

### Phase 2 — Engagement + scale hardening (weeks 5–8)

- Email send/log + sequences; real task/meeting/call logging. **[A4, A5, A6]**
- Lead-scoring engine. **[A7]**
- CSV import/export + dedupe. **[A10]**
- Distributed rate limiting (KV/Upstash) + caching; in-app notifications. **[B4, B5, B6]**

### Phase 3 — Power features (weeks 9–12)

- Reporting/dashboard builder, custom-fields/property UI, lists & segmentation. **[A8, A9, A11]**
- Full-text search; Supabase Realtime. **[B7, B8]**

### Phase 4 — Funnel + enterprise (weeks 13–16)

- Forms / landing pages / capture. **[A12]**
- SSO/MFA; seat/annual billing; load testing + DR runbook. **[B9, B10]**

---

## Verification (for the two-view change shipped here)

- `bun run dev`, sign in, use the ViewSwitcher → nav swaps Launchpad↔NOVA, accent changes,
  choice persists across reload (DB write under `workspaces_update_owner`).
- On an `operate` workspace, Home shows the seeded baseline mission and each step renders the
  rich `StepExecutionGuide` (not generic fallback) for `kpi-dashboard` etc.
- `bun run tsc --noEmit` and `bun run lint` pass (CI gates).
