/**
 * Nova OPS · n8n proxy Worker
 * ────────────────────────────────────────────────────────────────────
 * Forwards /api/n8n/* → N8N_UPSTREAM, attaches a shared secret header,
 * and verifies the user's Supabase JWT before forwarding so n8n can
 * trust the user_id in the request body.
 *
 * Deploy:
 *   npx wrangler secret put N8N_PROXY_SECRET
 *   npx wrangler secret put SUPABASE_JWT_SECRET   # from Supabase project settings
 *   npx wrangler deploy
 */

export interface Env {
  N8N_UPSTREAM: string;
  N8N_PROXY_SECRET: string;
  SUPABASE_JWT_SECRET: string;
}

const ALLOWED_METHODS = ['POST', 'OPTIONS'];

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    // CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    if (!ALLOWED_METHODS.includes(req.method)) {
      return json({ error: 'Method not allowed' }, 405);
    }

    // Path: /api/n8n/webhook/<subagent-path>
    if (!url.pathname.startsWith('/api/n8n/')) {
      return json({ error: 'Not found' }, 404);
    }

    // Verify Supabase JWT
    const auth = req.headers.get('authorization') || '';
    const token = auth.replace(/^Bearer\s+/i, '');
    const userId = await verifySupabaseJwt(token, env.SUPABASE_JWT_SECRET);
    if (!userId) {
      return json({ error: 'Invalid or missing auth token' }, 401);
    }

    // Force user_id in body to match the verified JWT — defends against spoofing
    let body: Record<string, unknown> = {};
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }
    body.user_id = userId;

    // Forward
    const upstreamPath = url.pathname.replace(/^\/api\/n8n/, '');
    const upstreamUrl = `${env.N8N_UPSTREAM}${upstreamPath}${url.search}`;

    const upstreamRes = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Proxy-Secret': env.N8N_PROXY_SECRET,
        'X-Verified-User-Id': userId,
      },
      body: JSON.stringify(body),
    });

    const text = await upstreamRes.text();
    return new Response(text, {
      status: upstreamRes.status,
      headers: {
        'Content-Type': upstreamRes.headers.get('Content-Type') || 'application/json',
        ...corsHeaders(),
      },
    });
  },
};

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

// HS256 JWT verification using Web Crypto (no library)
async function verifySupabaseJwt(
  token: string,
  secret: string,
): Promise<string | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  const sigBytes = base64UrlDecode(signature);
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    sigBytes,
    new TextEncoder().encode(`${header}.${payload}`),
  );
  if (!valid) return null;

  try {
    const decoded = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload)));
    if (decoded.exp && decoded.exp * 1000 < Date.now()) return null;
    return typeof decoded.sub === 'string' ? decoded.sub : null;
  } catch {
    return null;
  }
}

function base64UrlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
