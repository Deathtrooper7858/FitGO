import "@supabase/functions-js/edge-runtime.d.ts";

const ALLOWED_ORIGINS = new Set([
  "https://www.fitgo.app",
  "https://fitgo.app",
  "https://abvidinpswnfxijjfnic.supabase.co",
  "exp+com.fitgo.app://",
  "com.fitgo.app://",
]);

const API_KEY_ENV_VARS = [
  "GROQ_API_KEY",
  "GROQ_API_KEY_2",
  "GROQ_API_KEY_3",
  "GROQ_API_KEY_4",
  "GROQ_API_KEY_5",
];

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_CLEANUP_MS = 300_000;
const CACHE_TTL_MS = 300_000;

let keyIndex = 0;

interface RateEntry {
  count: number;
  windowStart: number;
}

const rateMap = new Map<string, RateEntry>();

const responseCache = new Map<string, { data: string; expires: number }>();

let lastCleanup = Date.now();

function cleanupStale() {
  const now = Date.now();
  if (now - lastCleanup < RATE_LIMIT_CLEANUP_MS) return;
  lastCleanup = now;
  for (const [key, entry] of rateMap) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) rateMap.delete(key);
  }
  for (const [key, entry] of responseCache) {
    if (now > entry.expires) responseCache.delete(key);
  }
}

function checkRateLimit(userId: string): { allowed: boolean; retryAfter: number } {
  cleanupStale();
  const now = Date.now();
  let entry = rateMap.get(userId);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry = { count: 1, windowStart: now };
    rateMap.set(userId, entry);
    return { allowed: true, retryAfter: 0 };
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((entry.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfter };
  }
  return { allowed: true, retryAfter: 0 };
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

function getNextApiKey(): string | null {
  const start = keyIndex;
  for (let i = 0; i < API_KEY_ENV_VARS.length; i++) {
    const idx = (start + i) % API_KEY_ENV_VARS.length;
    const key = Deno.env.get(API_KEY_ENV_VARS[idx]);
    if (key) {
      keyIndex = (idx + 1) % API_KEY_ENV_VARS.length;
      return key;
    }
  }
  return null;
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : "https://www.fitgo.app";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

Deno.serve(async (req) => {
  const startTime = performance.now();

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { allowed, retryAfter } = checkRateLimit(user.id);
    if (!allowed) {
      console.warn(`[Groq Proxy] Rate limit exceeded for user ${user.id}`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please wait before trying again." }),
        {
          status: 429,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
          },
        }
      );
    }

    const contentType = req.headers.get("content-type") || "";

    if (!contentType) {
      return new Response(
        JSON.stringify({ error: "Missing Content-Type header" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    let url = "https://api.groq.com/openai/v1/chat/completions";
    let body: any;
    let isStreaming = false;
    let cacheKey: string | null = null;

    try {
      if (contentType.includes("multipart/form-data")) {
        url = "https://api.groq.com/openai/v1/audio/transcriptions";
        body = await req.formData();
      } else {
        const rawBody = await req.text();
        const parsed = JSON.parse(rawBody);
        isStreaming = parsed.stream === true;
        if (!isStreaming) {
          cacheKey = simpleHash(rawBody);
          const cached = responseCache.get(cacheKey);
          if (cached && Date.now() < cached.expires) {
            const duration = ((performance.now() - startTime) / 1000).toFixed(2);
            console.log(`[Groq Proxy] Cache hit for user ${user.id} (${duration}s)`);
            return new Response(cached.data, {
              headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
              status: 200,
            });
          }
        }
        body = rawBody;
      }
    } catch (e) {
      return new Response(
        JSON.stringify({
          error: "Failed to parse request body",
          details: e instanceof Error ? e.message : String(e),
        }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const apiKey = getNextApiKey();
    if (!apiKey) {
      console.error(`[Groq Proxy] No API keys configured (user: ${user.id})`);
      return new Response(
        JSON.stringify({ error: "No Groq API keys configured." }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const groqResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        ...(contentType.includes("application/json") ? { "Content-Type": "application/json" } : {}),
      },
      body,
    });

    const responseText = await groqResponse.text();
    let groqData: any;
    try {
      groqData = JSON.parse(responseText);
    } catch {
      groqData = { error: "Non-JSON response from Groq", raw: responseText };
    }

    const duration = ((performance.now() - startTime) / 1000).toFixed(2);

    if (!groqResponse.ok) {
      console.error(
        `[Groq Proxy] Groq API error (${groqResponse.status}) for user ${user.id} (${duration}s):`,
        JSON.stringify(groqData)
      );
      return new Response(JSON.stringify(groqData), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: groqResponse.status,
      });
    }

    const bodyStr = JSON.stringify(groqData);
    if (cacheKey) {
      responseCache.set(cacheKey, { data: bodyStr, expires: Date.now() + CACHE_TTL_MS });
    }

    console.log(`[Groq Proxy] Success for user ${user.id} (${duration}s)`);
    return new Response(bodyStr, {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[Groq Proxy] Internal Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
