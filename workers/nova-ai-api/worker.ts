// nova-ai-api — POST /api/nova
// Streams Claude responses for Nova AI chat. Saves to nova_conversations.

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_JWT_SECRET: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_AI_GATEWAY_ID: string;
  ANTHROPIC_API_KEY: string;
  RATE_LIMITER?: KVNamespace; // set via: npx wrangler kv:namespace create nova-rate-limiter
}

const ALLOWED_ORIGIN = "https://app.launchpad.nova-ops.space";
const MODEL = "claude-sonnet-4-5";

const NOVA_SYSTEM_PROMPT = `You are Nova — the AI operating system powering Launchpad Nova.

Identity: Founder operating system + startup execution engine + automation operator + growth intelligence system.

Tone: Cinematic, operational, intelligent, minimal, futuristic. Calm under pressure, strategically obsessed, execution-focused. SpaceX mission control × Tesla internal ops × Vercel product clarity.

Never: Use motivational fluff, generic startup advice, long explanations, corporate language, or unnecessary disclaimers.

Always: Think in systems, workflows, pipelines, automations. Respond in short blocks with high signal and operational language.

Preferred vocabulary: Deploy / Initialize / Execute / Scale / Automate / Infrastructure / Growth engine / Revenue system / Workflow / Command layer / Signal / Pipeline / Optimization.

7-step framework (apply to every response):
1. Objective — What outcome are we optimizing for?
2. Strategy — What is the highest leverage path?
3. Execution — What exact steps should happen?
4. Automation — What should run automatically?
5. Scale — How does this compound long-term?
6. Bottlenecks — What will eventually break?
7. Optimization — How can this become faster, leaner, or more profitable?

Dynamic context will be injected at runtime with user business data.`;

async function validateJWT(token: string, env: Env): Promise<{ sub: string } | null> {
  try {
    // Validate by calling Supabase auth endpoint
    const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: env.SUPABASE_ANON_KEY },
    });
    if (!res.ok) return null;
    const user = (await res.json()) as { id: string };
    return { sub: user.id };
  } catch {
    return null;
  }
}

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

// ── Rate Limiter ──────────────────────────────────────────────────────────────
async function checkRateLimit(
  kv: KVNamespace | undefined,
  userId: string,
  endpoint: string,
  maxPerMinute: number,
): Promise<{ limited: boolean; retryAfter: number }> {
  if (!kv) return { limited: false, retryAfter: 0 };
  const window = Math.floor(Date.now() / 60_000);
  const key = `rl:${userId}:${endpoint}:${window}`;
  const raw = await kv.get(key);
  const count = raw ? parseInt(raw, 10) : 0;
  if (count >= maxPerMinute) {
    return { limited: true, retryAfter: 60 - (Date.now() % 60_000) / 1000 };
  }
  await kv.put(key, String(count + 1), { expirationTtl: 120 });
  return { limited: false, retryAfter: 0 };
}

function rateLimitedResponse(origin: string, retryAfter: number): Response {
  return new Response(
    JSON.stringify({ error: "Rate limit exceeded. Try again in a moment.", code: "RATE_LIMIT" }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil(retryAfter)),
        ...corsHeaders(origin),
      },
    },
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin") ?? "";
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }

    // Auth
    const authHeader = request.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const user = await validateJWT(token, env);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    // Rate limit: 20 AI chat requests/minute per user
    const rl = await checkRateLimit(env.RATE_LIMITER, user.sub, "nova-ai", 20);
    if (rl.limited) return rateLimitedResponse(origin, rl.retryAfter);

    const body = (await request.json()) as {
      message: string;
      conversation_history?: Array<{ role: string; content: string }>;
      user_context?: Record<string, string>;
      session_id?: string;
    };

    const { message, conversation_history = [], user_context = {}, session_id } = body;

    // Build system prompt with injected context
    let systemPrompt = NOVA_SYSTEM_PROMPT;
    if (Object.keys(user_context).length > 0) {
      systemPrompt += `\n\nUser business context:\n${Object.entries(user_context)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n")}`;
    }

    const messages = [...conversation_history, { role: "user", content: message }];

    // Stream from Cloudflare AI Gateway → Anthropic
    const gatewayUrl = `https://gateway.ai.cloudflare.com/v1/${env.CLOUDFLARE_ACCOUNT_ID}/${env.CLOUDFLARE_AI_GATEWAY_ID}/anthropic/v1/messages`;

    const aiRes = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        stream: true,
        system: systemPrompt,
        messages,
      }),
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      return new Response(JSON.stringify({ error: "AI error", detail: err }), {
        status: 502,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    // Collect full text while streaming
    let fullText = "";
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      const reader = aiRes.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const text = parsed.delta?.text ?? "";
            if (text) {
              fullText += text;
              await writer.write(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          } catch {
            // ignore malformed SSE chunks
          }
        }
      }
      await writer.close();

      // Save conversation to Supabase
      const sid = session_id ?? crypto.randomUUID();
      const updatedMessages = [
        ...conversation_history,
        { role: "user", content: message },
        { role: "assistant", content: fullText },
      ];
      await fetch(`${env.SUPABASE_URL}/rest/v1/nova_conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify({
          user_id: user.sub,
          session_id: sid,
          messages: updatedMessages,
          updated_at: new Date().toISOString(),
        }),
      });
    })();

    return new Response(readable, {
      headers: {
        ...corsHeaders(origin),
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Session-Id": session_id ?? "",
      },
    });
  },
};
