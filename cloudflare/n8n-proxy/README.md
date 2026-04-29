# Nova n8n Proxy Worker

Cloudflare Worker that fronts your n8n host. Verifies Supabase JWT, attaches a
shared secret, and rewrites `user_id` in the body to match the authenticated
user — defends against spoofing.

## Deploy

```bash
cd cloudflare/n8n-proxy
npm install

# Set secrets
npx wrangler secret put N8N_PROXY_SECRET    # any random string; also set on n8n side
npx wrangler secret put SUPABASE_JWT_SECRET # Supabase → Settings → API → JWT Secret

# Set upstream in wrangler.toml [vars] N8N_UPSTREAM
npx wrangler deploy
```

## Wire to your domain

In Cloudflare dashboard → your zone → **Workers Routes**:

- Pattern: `nova-ops.space/api/n8n/*`
- Worker: `nova-n8n-proxy`

The frontend keeps `VITE_N8N_BASE_URL=/api/n8n` (default) and just works.

## n8n verification (optional but recommended)

Add a `Set` node at the top of each subagent that checks
`X-Proxy-Secret === $env.N8N_PROXY_SECRET`. If you want to enforce this,
import `proxy-secret-guard.json` (not yet built).
