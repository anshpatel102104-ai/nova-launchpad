

# Launchpad Bylda — Full Lovable Cloud Backend

Switching backend from external Supabase to **Lovable Cloud**. Existing 8-table naming kept; missing tables added; Claude wired through Edge Functions; new pricing seeded.

## Build order

1. Enable Lovable Cloud (auto-creates client + types + auth)
2. Migrate schema (existing 8 tables + new ones)
3. RLS policies + security definer helpers
4. Storage buckets
5. Edge Functions (Claude integration)
6. Wire frontend to live backend
7. List Secrets to add
8. List what to test

## 1. Schema (migrations)

**Kept (renamed in your spec → existing names):**
- `profiles`, `organizations` (= "businesses"), `organization_members`, `subscriptions`, `plan_entitlements`, `onboarding_responses` (= "onboarding_answers"), `tool_runs` (= "ai_generations"), `generated_assets` (= "saved_assets")

**Added:**
- `website_analyses` — url, snapshot_path, issues jsonb, opportunities jsonb, ux_notes, seo_notes, suggested_changes jsonb, organization_id
- `automation_settings` — organization_id, key, config jsonb, enabled bool
- `usage_tracking` — organization_id, period (month), tool_key, count, last_used_at
- `app_role` enum (`user`, `admin`) + `user_roles` table + `has_role()` security definer (per project standards — never store roles on profiles)

**Plan pricing reseed (`plan_entitlements`):**
| Plan | Price | Limits |
|---|---|---|
| starter | $0 | 5 generations/mo, validate_idea + generate_pitch only |
| launch | $49 | 50/mo, + gtm_strategy, generate_offer |
| operate | $149 | 200/mo, + ops_plan, followup_sequence, automations |
| scale | $299 | unlimited, + website_analysis, advanced ops |

## 2. RLS

Every table: enable RLS. Policies via `is_org_member(org_id)` and `has_role(uid, 'admin')` security definer functions (no recursive policies). Owners can update their org; members read-only on org-scoped tables.

## 3. Storage buckets

- `uploads` (private) — user docs
- `generated-assets` (private) — AI outputs
- `website-snapshots` (private) — analysis HTML/screenshots
- `brand-assets` (public read, owner write) — logos
- `exports` (private) — reports/PDFs

Path convention: `{organization_id}/{user_id}/{filename}`. RLS policies on `storage.objects` scoped to org membership.

## 4. Edge Functions (Claude via Lovable AI Gateway)

All functions: verify JWT → load org + subscription → check plan entitlement → check `usage_tracking` quota → validate input (Zod) → call Lovable AI Gateway with Claude model → insert `tool_runs` row (status `running` → `succeeded`/`failed`) → insert structured output to `generated_assets` (or `website_analyses`) → increment `usage_tracking` → return JSON.

Functions:
- `validate-idea` → `{ score, strengths[], weaknesses[], risks[], recommendation }`
- `generate-pitch` → `{ headline, problem, offer, outcome, cta }`
- `generate-gtm-strategy` → `{ audience, channels[], messaging, plan_30d[] }`
- `analyze-website` → fetches URL, snapshots to storage, returns `{ issues[], opportunities[], ux_notes, seo_notes, suggested_changes[] }`
- `generate-ops-plan` → `{ workflows[], automations[], staffing_notes, kpis[] }`
- `generate-offer` → `{ name, promise, deliverables[], price_anchor, guarantee }`
- `generate-followup-sequence` → `{ steps: [{ day, channel, subject, body }] }`

Shared `_helpers/` module: `requireUser()`, `requireEntitlement(toolKey)`, `incrementUsage()`, `callClaude(prompt, schema)`.

## 5. Auth + protected routes

- Lovable Cloud auth (email/password, autoconfirm on)
- `AuthProvider` in `src/lib/auth.tsx` (`onAuthStateChange` first, then `getSession`)
- `_authenticated.tsx` pathless layout — `beforeLoad` redirects to `/auth/sign-in`
- All `/app/*` routes moved under `_authenticated`
- Sign-up → onboarding → org create + owner membership + starter subscription
- Sign-in / forgot / reset / logout fully wired

## 6. Frontend wiring (no UI changes)

Build `src/lib/queries.ts` with TanStack Query options for every entity. Each `/app/*` route gets a `loader` calling `ensureQueryData`; components use `useSuspenseQuery`. Replaces all `src/lib/mock.ts` reads.

| Screen | Source |
|---|---|
| Dashboard | `profiles` + active `organizations` + recent `tool_runs` |
| Launchpad index/$tool | Static catalog + `tool_runs` + Edge Function invocations |
| Launchpad history | `tool_runs` desc |
| Bylda screens | `tool_runs` + `generated_assets` + `automation_settings` |
| Billing | `subscriptions` + `plan_entitlements` + `usage_tracking` |
| Settings | `profiles` + `organizations` mutations |
| Stage tracker | `organizations.stage` |
| Locked overlay | `subscriptions.plan` vs `plan_entitlements.required_plan` |

**Zero design system changes.** No edits to `styles.css`, `components/ui/*`, sidebar, topbar, or route JSX structure.

## 7. Secrets to add

Lovable Cloud auto-provisions `LOVABLE_API_KEY` (used for Claude via gateway — no separate Anthropic key needed).

You'll add later (placeholders, not blocking MVP):
- `STRIPE_SECRET_KEY` (when wiring real billing)
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY` (transactional email)

## 8. Test checklist (after build)

1. Sign up → confirm profile + org + starter subscription created
2. Complete onboarding → answers persisted, stage set
3. Run `validate-idea` from Launchpad → tool_run + generated_asset created, usage incremented
4. Run as starter user against `analyze-website` → 403 (plan gate works)
5. Refresh dashboard → recent runs persist
6. Sign out / sign back in → session restores, data still there

## Technical notes

- **Lovable AI Gateway** used instead of direct Anthropic SDK — same Claude models, no API key management, billed through Lovable
- **No `createServerFn`** — all server logic in Edge Functions (Deno) for portability
- **JWT verification** in every Edge Function via `supabase.auth.getUser(token)`
- **Type safety** — generated `Database` type flows through queries and function payloads
- **Roles** — `user_roles` table + `has_role()` definer (never on profiles)
- **`mock.ts`** kept only as static tool catalog (names/icons); all dynamic arrays removed

