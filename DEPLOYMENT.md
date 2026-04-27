# Deployment Guide

Complete secrets reference for nova-launchpad across all environments.

## Environments

| Environment | Runtime | Config source |
|---|---|---|
| Local dev | Vite dev server | `.env` / `.env.development` |
| Cloudflare Worker | `wrangler dev` / `wrangler deploy` | Worker secrets |
| Supabase Edge Functions | `supabase functions deploy` | Supabase project secrets |

---

## 1. Cloudflare Worker secrets

Set via `wrangler secret put <NAME>`. Available as `import.meta.env.*` in the browser bundle and `process.env.*` in the SSR Worker layer.

| Secret | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL — Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon key (public) — Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key — Project Settings → API |
| `VITE_ANTHROPIC_API_KEY` | Yes | Anthropic API key — used by `runToolLocally.ts` for all 17 browser-side tools |
| `VITE_PAYMENTS_CLIENT_TOKEN` | Yes | Stripe publishable key (`pk_live_...` prod, `pk_test_...` sandbox) |

```bash
wrangler secret put VITE_SUPABASE_URL
wrangler secret put VITE_SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put VITE_ANTHROPIC_API_KEY
wrangler secret put VITE_PAYMENTS_CLIENT_TOKEN
```

---

## 2. Supabase Edge Function secrets

Set via `supabase secrets set KEY=value`. Available as `Deno.env.get(...)` inside edge functions.

| Secret | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for edge function AI calls (`claude-haiku-4-5-20251001`) |
| `SUPABASE_URL` | Auto | Injected automatically by Supabase runtime |
| `SUPABASE_ANON_KEY` | Auto | Injected automatically by Supabase runtime |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Required by `save-integration` and `create-checkout` |
| `INTEGRATIONS_ENCRYPTION_KEY` | Yes | Min 32-char random string — encrypts user API keys via pgcrypto |
| `STRIPE_SANDBOX_API_KEY` | Stripe | Stripe secret key for sandbox (`sk_test_...`) |
| `STRIPE_LIVE_API_KEY` | Stripe | Stripe secret key for production (`sk_live_...`) |
| `PAYMENTS_SANDBOX_WEBHOOK_SECRET` | Stripe | Webhook signing secret for sandbox (`whsec_...`) |
| `PAYMENTS_LIVE_WEBHOOK_SECRET` | Stripe | Webhook signing secret for production (`whsec_...`) |

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...
supabase secrets set INTEGRATIONS_ENCRYPTION_KEY=$(openssl rand -base64 32)
supabase secrets set STRIPE_SANDBOX_API_KEY=sk_test_...
supabase secrets set STRIPE_LIVE_API_KEY=sk_live_...
supabase secrets set PAYMENTS_SANDBOX_WEBHOOK_SECRET=whsec_...
supabase secrets set PAYMENTS_LIVE_WEBHOOK_SECRET=whsec_...
```

---

## 3. Local development (`.env`)

Create `.env` in the repo root — never commit real keys.

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_PAYMENTS_CLIENT_TOKEN=pk_test_...
```

Stripe sandbox publishable key can live in `.env.development` instead:

```env
VITE_PAYMENTS_CLIENT_TOKEN=pk_test_51TP7...
```

---

## 4. Deploy checklist

- [ ] All Cloudflare Worker secrets set via `wrangler secret put`
- [ ] All Supabase edge function secrets set via `supabase secrets set`
- [ ] Supabase migrations applied: `supabase db push`
- [ ] Edge functions deployed: `supabase functions deploy`
- [ ] Worker deployed: `npm run deploy`
- [ ] Stripe webhook endpoint set to `https://<project-ref>.supabase.co/functions/v1/payments-webhook`
- [ ] `INTEGRATIONS_ENCRYPTION_KEY` is at least 32 chars and backed up securely

---

## 5. Removed Lovable platform dependencies

These services were part of the original Lovable-hosted build and have been replaced:

| Removed | Replacement |
|---|---|
| `ai.gateway.lovable.dev` (Gemini Flash via `LOVABLE_API_KEY`) | Direct `api.anthropic.com/v1/messages` (`claude-haiku-4-5-20251001` via `ANTHROPIC_API_KEY`) |
| `connector-gateway.lovable.dev/stripe` (via `LOVABLE_API_KEY`) | Direct Stripe SDK `stripe@18.5.0` via `STRIPE_SANDBOX_API_KEY` / `STRIPE_LIVE_API_KEY` |

`LOVABLE_API_KEY` is no longer required anywhere in the codebase.
