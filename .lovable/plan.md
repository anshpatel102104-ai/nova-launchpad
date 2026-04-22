

# LaunchpadNOVA — Platform Build Plan

A premium AI Business OS with two connected workspaces: **Launchpad** (build/launch) and **Nova OS** (operate/scale). Built on TanStack Start + Lovable Cloud (Supabase) + Lovable AI.

## V1 Scope (recommended)

Full platform shell with realistic UI for every screen, real auth + database + RLS, and **3 Launchpad tools wired to AI** (Idea Validator, Pitch Generator, GTM Strategy). Remaining tools render their full UI (form → loading → output → save → history) but use a shared AI handler that can be extended later. Nova OS modules get full CRUD on real tables. Billing is visual (badges, locked states, upgrade modals) — no real payment processing yet.

This gives a launch-ready feel without months of build time. Adding the remaining 7 tools = mostly prompt engineering once the pattern exists.

## 1. App Architecture

**Stack**: TanStack Start, Tailwind, shadcn/ui, Lovable Cloud (Supabase auth + Postgres + RLS), Lovable AI Gateway (`google/gemini-3-flash-preview`).

**Route map** (file-based in `src/routes/`):

```text
/                           Marketing redirect → /app or /auth/sign-in
/auth/sign-in
/auth/sign-up
/auth/forgot-password
/auth/reset-password
/onboarding                 9-step wizard
/app                        Authenticated layout (sidebar + topbar)
  /app/dashboard            Command center
  /app/launchpad            Workspace overview + module grid
  /app/launchpad/$tool      Idea Validator, Pitch, GTM, Kill My Idea, Funding Score,
                            First 10 Customers, Business Plan, Investor Emails,
                            Idea vs Idea, Landing Page
  /app/launchpad/history    All saved outputs
  /app/nova                 Nova OS overview
  /app/nova/crm             Pipeline (kanban + table toggle)
  /app/nova/leads           Lead capture + inbox
  /app/nova/workflows       Automation manager
  /app/nova/clients         Onboarding tracker
  /app/nova/reports         Analytics dashboard
  /app/billing              Plan, usage meters, upgrade
  /app/settings             Profile, company, integrations, team
```

**Layouts**: `app.tsx` is the auth-gated shell with sidebar + topbar + AI Operator command bar (⌘K). Onboarding and auth use bare layouts.

## 2. UI Breakdown

**Sidebar** (collapsible, icon mini-mode): Dashboard · Launchpad ▸ (10 tools) · Nova OS ▸ (CRM, Leads, Workflows, Clients, Reports) · Billing · Settings. Stage badge at bottom ("You're at: Launch").

**Topbar**: Workspace switcher (Launchpad ↔ Nova OS), global search, ⌘K AI Operator trigger, notifications bell, plan badge (Starter/Launch/Operate/Scale), profile menu.

**Dashboard widgets**:
- Stage tracker (Idea → Validate → Launch → Operate → Scale, current highlighted)
- "Next best action" hero card (context-aware)
- Launchpad progress (X of 10 tools used, last output)
- Nova readiness (6 systems with on/off + setup % per system)
- Recent outputs (last 5 from Launchpad)
- Pipeline snapshot (leads by stage)
- Follow-up status (response time avg, pending replies)
- Client onboarding progress
- Plan usage meters (AI generations, leads, workflows)
- Quick actions row (9 buttons matching brief)

**Launchpad workspace**: Overview header with stage + recommended sequence ("Idea → Validate → Pitch → GTM → First 10"). Module grid (10 cards with icon, name, last-used, output-count). Each tool screen: input form (left) → output panel (right) → top tabs for "New / History / Saved". Output state is structured (cards, sections, copyable blocks, export to PDF/MD), never a chat dump.

**Nova OS workspace**: Operational header (active workflows, leads today, response time SLA). 
- **CRM**: Kanban (New → Contacted → Qualified → Proposal → Won/Lost) + table view toggle, lead detail drawer.
- **Leads**: Capture forms manager, lead inbox, source breakdown.
- **Workflows**: List of automation recipes (Lead → Follow-up, Won → Onboarding kickoff), enable toggles, run history.
- **Clients**: Onboarding checklist per client, progress bars, task assignment.
- **Reports**: KPI cards + charts (Recharts) for funnel, response time, conversion, revenue.

**Billing**: Current plan card, 4-plan comparison table, usage meters, upgrade modal triggered by locked features.

**Settings**: Profile, Company (from onboarding, editable), Integrations (placeholders for Gmail/Calendar/Slack), Team (invite UI).

## 3. Feature Mapping (website → software)

| Website element | App module |
|---|---|
| 10 AI tools | `/app/launchpad/$tool` (10 routes via dynamic param + registry) |
| 6 Nova systems | CRM, Leads, Workflows, Clients (covers Follow-Up & Booking), Reports + Lead Capture sub-screen |
| "Launchpad feeds Nova" | Idea Validator output → "Send to GTM"; Landing Page → "Connect to Lead Capture"; First 10 Customers → "Import as leads to CRM" |
| 4 pricing tiers | Plan enum + feature gates + locked-state previews |
| "Setup in 14 days" | Nova readiness widget shows setup countdown |
| "<90s response time" | Workflows dashboard surfaces this metric |

## 4. User Flow

```text
Marketing site CTA
  → /auth/sign-up (email+password, optional Google later)
  → email confirm (auto)
  → /onboarding (9 steps, saves to onboarding_state + companies)
  → stage-based route:
       Idea/Validate → /app/launchpad (Idea Validator highlighted)
       Launch       → /app/launchpad (with Nova handoff banner)
       Operate/Scale → /app/nova (CRM highlighted)
  → /app/dashboard for recurring use
```

AI Operator (⌘K) parses intent → routes to module + pre-fills inputs.

## 5. Supabase Schema

```text
profiles(id→auth.users, full_name, avatar_url, created_at)
user_roles(id, user_id→auth.users, role app_role)   -- separate, security-definer has_role()
companies(id, owner_id, name, business_type, niche, location, target_customer, offer, goal, created_at)
company_members(company_id, user_id, role)           -- multi-user later
onboarding_state(user_id PK, company_id, current_stage, completed_at, raw_answers jsonb)

-- Launchpad
ideas(id, company_id, user_id, title, description, status, created_at)
generated_outputs(id, company_id, user_id, idea_id?, tool_key, input jsonb, output jsonb, model, tokens, created_at)
launch_assets(id, company_id, type, name, content jsonb, exported_formats[], created_at)

-- Nova
leads(id, company_id, name, email, phone, source, stage, score, notes, created_at, last_contacted_at)
pipeline_stages(id, company_id, name, position, color)
opportunities(id, company_id, lead_id, value, stage_id, expected_close, created_at)
workflows(id, company_id, name, trigger jsonb, actions jsonb, enabled, created_at)
workflow_runs(id, workflow_id, lead_id?, status, started_at, finished_at, log jsonb)
clients(id, company_id, lead_id?, name, started_at, status)
onboarding_tasks(id, client_id, title, status, due_date, position)
reports_snapshots(id, company_id, period, metrics jsonb, created_at)

-- Billing
subscriptions(user_id PK, plan starter|launch|operate|scale, status, current_period_end)
usage_counters(id, user_id, period_start, ai_generations, leads_count, workflows_count, ...)
```

**RLS**: every table scoped by `company_id` via membership check. `user_roles` uses security-definer `has_role()`.

## 6. MVP Build Order (single sprint)

1. Enable Lovable Cloud + Lovable AI; configure design system in `styles.css` (premium neutral palette, Inter, subtle borders, soft shadows, dark-mode ready).
2. Auth (sign-up, sign-in, forgot/reset password) + protected route guard.
3. DB migration: all tables above + RLS + `has_role` function + `handle_new_user` trigger creating profile + Starter subscription.
4. Onboarding wizard (9 steps, progress bar, saves to `companies` + `onboarding_state`).
5. App shell: sidebar, topbar, workspace switcher, ⌘K command bar, plan badge.
6. Dashboard with all widgets (real data where it exists, polished empty states elsewhere).
7. Launchpad: overview + module grid + dynamic `$tool` route with shared form/output/history pattern. AI edge function (`/api/launchpad-generate`) calling Lovable AI gateway with per-tool prompt + tool-calling for structured JSON output. Wire 3 tools end-to-end (Idea Validator, Pitch, GTM); remaining 7 use the same handler with placeholder prompts (output still saved/exportable).
8. Nova: CRM kanban + table, Leads inbox + capture form, Workflows list with enable toggle, Clients onboarding checklist, Reports with Recharts.
9. Cross-workspace handoffs: "Send to CRM" / "Generate Lead Capture from Landing Page" actions.
10. Billing screen (visual plans + usage meters + locked-feature modals on Operate/Scale features).
11. Settings (profile, company, integrations placeholders).
12. AI Operator (⌘K): natural-language → intent classification → navigate + pre-fill.

## 7. Coherence & Premium Feel

- One design system, one spacing scale, one type ramp. No marketing-style gradients inside the app.
- Every screen states **"Stage: X · Next: Y"** in the topbar so the journey is always visible.
- Every Launchpad output has a **"Send to Nova"** action where it makes sense (Landing Page → Lead Capture, First 10 Customers → CRM import). This is the "Launchpad feeds Nova" promise made literal.
- Empty states are instructional, not decorative ("No leads yet — connect a capture form or import from First 10 Customers").
- Locked features show a real preview behind a subtle blur with an inline "Upgrade to Operate" CTA — never a hard wall.
- Loading states are skeleton-based and quick; AI generations stream tokens.

## Technical Notes

- Auth: email + password only for V1 (Google can be added with one toggle later).
- AI: Lovable AI Gateway via TanStack server function, structured outputs through tool-calling for parseable JSON.
- Roles: separate `user_roles` table with security-definer `has_role()` (per security policy).
- Routing: file-based with `app.tsx` layout route, dynamic `$tool` for the 10 Launchpad modules.
- No real payments in V1; `subscriptions` table exists so wiring Stripe later is a swap, not a rewrite.

## Open Questions

I'll proceed with the scope above (full shell, 3 wired AI tools, real DB, visual billing, email+password auth) unless you tell me otherwise before I start building. If you'd rather wire all 10 tools to AI now, or add Google sign-in, or wire real payments — say so and I'll adjust before writing code.

