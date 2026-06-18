import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const ALLOWED_ORIGINS = new Set([
  "https://www.fitgo.app",
  "https://fitgo.app",
  "https://abvidinpswnfxijjfnic.supabase.co",
  "exp+com.fitgo.app://",
  "com.fitgo.app://",
]);

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_CLEANUP_MS = 300_000;
const CACHE_TTL_MS = 3_600_000;

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
      console.warn(`[Edamam Proxy] Rate limit exceeded for user ${user.id}`);
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

    const EDAMAM_APP_ID = Deno.env.get("EDAMAM_APP_ID");
    const EDAMAM_APP_KEY = Deno.env.get("EDAMAM_APP_KEY");

    if (!EDAMAM_APP_ID || !EDAMAM_APP_KEY) {
      console.error("[Edamam Proxy] EDAMAM_APP_ID or EDAMAM_APP_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Edamam API credentials are not configured." }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    let requestBody: any;
    try {
      requestBody = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: e instanceof Error ? e.message : String(e),
        }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const query = requestBody?.query;
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'query' parameter" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const cacheKey = query.trim().toLowerCase();
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      console.log(`[Edamam Proxy] Cache hit for user ${user.id} query "${cacheKey}" (${duration}s)`);
      return new Response(cached.data, {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 200,
      });
    }

    const url = `https://api.edamam.com/api/food-database/v2/parser?app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}&ingr=${encodeURIComponent(query)}&nutrition-type=cooking`;

    console.log(`[Edamam Proxy] Forwarding request for user ${user.id}, query: "${query}"`);

    const edamamResponse = await fetch(url, {
      method: "GET",
      headers: { "Accept": "application/json" },
    });

    const responseText = await edamamResponse.text();
    let edamamData: any;
    try {
      edamamData = JSON.parse(responseText);
    } catch {
      edamamData = { error: "Non-JSON response from Edamam", raw: responseText };
    }

    const duration = ((performance.now() - startTime) / 1000).toFixed(2);

    if (!edamamResponse.ok) {
      console.error(
        `[Edamam Proxy] Edamam API error (${edamamResponse.status}) for user ${user.id} (${duration}s):`,
        JSON.stringify(edamamData)
      );
      return new Response(JSON.stringify(edamamData), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: edamamResponse.status,
      });
    }

    const bodyStr = JSON.stringify(edamamData);
    responseCache.set(cacheKey, { data: bodyStr, expires: Date.now() + CACHE_TTL_MS });

    console.log(`[Edamam Proxy] Success for user ${user.id} query "${query}" (${duration}s)`);
    return new Response(bodyStr, {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[Edamam Proxy] Internal Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
