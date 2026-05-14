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
 *   npx wrangler secret put ALLOWED_ORIGIN        # e.g. https://your-app.com
 *   npx wrangler deploy
 */

export interface Env {
  N8N_UPSTREAM: string;
  N8N_PROXY_SECRET: string;
  SUPABASE_JWT_SECRET: string;
  /** Allowed CORS origin, e.g. "https://nova-launchpad.com". Falls back to restrictive deny if unset. */
  ALLOWED_ORIGIN?: string;
}

const ALLOWED_METHODS = ["POST", "OPTIONS"];
const UPSTREAM_TIMEOUT_MS = 30_000;

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    // Validate required secrets at request time
    if (!env.N8N_UPSTREAM || !env.N8N_PROXY_SECRET || !env.SUPABASE_JWT_SECRET) {
      console.error("Worker misconfigured: missing required environment variables");
      return json({ error: "Service unavailable" }, 503);
    }

    const url = new URL(req.url);
    const origin = req.headers.get("origin") ?? "";
    const allowedOrigin = resolveAllowedOrigin(env.ALLOWED_ORIGIN, origin);

    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(allowedOrigin) });
    }

    if (!ALLOWED_METHODS.includes(req.method)) {
      return json({ error: "Method not allowed" }, 405, allowedOrigin);
    }

    // Path: /api/n8n/webhook/<subagent-path>
    if (!url.pathname.startsWith("/api/n8n/")) {
      return json({ error: "Not found" }, 404, allowedOrigin);
    }

    // Prevent path traversal
    const normalised = new URL(url.pathname, "https://x").pathname;
    if (normalised !== url.pathname || url.pathname.includes("..")) {
      return json({ error: "Invalid path" }, 400, allowedOrigin);
    }

    // Verify Supabase JWT
    const auth = req.headers.get("authorization") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "");
    const userId = await verifySupabaseJwt(token, env.SUPABASE_JWT_SECRET);
    if (!userId) {
      return json({ error: "Invalid or missing auth token" }, 401, allowedOrigin);
    }

    // Force user_id in body to match the verified JWT — defends against spoofing
    let body: Record<string, unknown> = {};
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return json({ error: "Invalid JSON body" }, 400, allowedOrigin);
    }
    body.user_id = userId;

    // Forward with timeout
    const upstreamPath = url.pathname.replace(/^\/api\/n8n/, "");
    const upstreamUrl = `${env.N8N_UPSTREAM}${upstreamPath}${url.search}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    let upstreamRes: Response;
    try {
      upstreamRes = await fetch(upstreamUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Proxy-Secret": env.N8N_PROXY_SECRET,
          "X-Verified-User-Id": userId,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      const isTimeout = err instanceof Error && err.name === "AbortError";
      console.error("Upstream fetch failed:", err);
      return json(
        { error: isTimeout ? "Upstream request timed out" : "Upstream unavailable" },
        isTimeout ? 504 : 502,
        allowedOrigin,
      );
    }
    clearTimeout(timeoutId);

    let text: string;
    try {
      text = await upstreamRes.text();
    } catch (err) {
      console.error("Failed to read upstream response:", err);
      return json({ error: "Failed to read upstream response" }, 502, allowedOrigin);
    }

    // Only forward safe content types to avoid content-type injection
    const upstreamContentType = upstreamRes.headers.get("Content-Type") ?? "";
    const safeContentType = upstreamContentType.startsWith("application/json")
      ? "application/json"
      : upstreamContentType.startsWith("text/")
        ? "text/plain; charset=utf-8"
        : "application/json";

    return new Response(text, {
      status: upstreamRes.status,
      headers: {
        "Content-Type": safeContentType,
        ...corsHeaders(allowedOrigin),
      },
    });
  },
};

/**
 * Return the allowed origin for CORS. If env.ALLOWED_ORIGIN is set, use it
 * (exact match only). Otherwise deny cross-origin access.
 */
function resolveAllowedOrigin(configured: string | undefined, requestOrigin: string): string {
  if (!configured) return "null"; // deny by default if not configured
  // Support comma-separated list of origins
  const allowed = configured.split(",").map((o) => o.trim());
  return allowed.includes(requestOrigin) ? requestOrigin : "null";
}

function corsHeaders(allowedOrigin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

function json(obj: unknown, status = 200, allowedOrigin = "null"): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(allowedOrigin) },
  });
}

// HS256 JWT verification using Web Crypto (no library)
async function verifySupabaseJwt(token: string, secret: string): Promise<string | null> {
  if (!token || !secret) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;

  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
  } catch {
    console.error("Failed to import JWT secret");
    return null;
  }

  const sigBytes = base64UrlDecode(signature);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes,
    new TextEncoder().encode(`${header}.${payload}`),
  );
  if (!valid) return null;

  try {
    const decoded = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload)));
    const now = Math.floor(Date.now() / 1000);
    // Check expiry
    if (decoded.exp && decoded.exp < now) return null;
    // Check not-before
    if (decoded.nbf && decoded.nbf > now) return null;
    // Require subject
    if (typeof decoded.sub !== "string" || !decoded.sub) return null;
    return decoded.sub;
  } catch {
    return null;
  }
}

function base64UrlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
