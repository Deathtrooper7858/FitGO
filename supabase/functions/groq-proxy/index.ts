import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const ALLOWED_ORIGINS = new Set([
  "https://www.fitgo.app",
  "https://fitgo.app",
  "https://abvidinpswnfxijjfnic.supabase.co",
  "exp+com.fitgo.app://",
  "com.fitgo.app://",
  "exp+com.fitgo.app.dev://",
  "com.fitgo.app.dev://",
  "exp+com.fitgo.app.preview://",
  "com.fitgo.app.preview://",
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

function getCurrentApiKey(): string | null {
  for (let i = 0; i < API_KEY_ENV_VARS.length; i++) {
    const idx = (keyIndex + i) % API_KEY_ENV_VARS.length;
    const key = Deno.env.get(API_KEY_ENV_VARS[idx]);
    if (key) {
      keyIndex = idx; // Lock onto the valid key
      return key;
    }
  }
  return null;
}

function advanceApiKey() {
  keyIndex = (keyIndex + 1) % API_KEY_ENV_VARS.length;
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
    let isStreaming = false;
    let cacheKey: string | null = null;
    let parsed: any = null;
    let rawFormData: FormData | null = null;

    try {
      if (contentType.includes("multipart/form-data")) {
        url = "https://api.groq.com/openai/v1/audio/transcriptions";
        rawFormData = await req.formData();
        parsed = {}; // No parsed JSON for form-data
      } else {
        const rawBody = await req.text();
        parsed = JSON.parse(rawBody);
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
      }
    } catch (e) {
      return new Response(
        JSON.stringify({
          error: "Failed to parse request body",
        }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const modelsToTry = Array.isArray(parsed?.models) ? parsed.models : (parsed?.model ? [parsed.model] : [undefined]);
    const maxKeysToTry = API_KEY_ENV_VARS.length;
    let keysTried = 0;
    
    let finalResponse: Response | null = null;
    let finalGroqData: any = null;
    let finalStatus = 500;

    while (keysTried < maxKeysToTry) {
      const apiKey = getCurrentApiKey();
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "No Groq API keys configured." }),
          { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      let success = false;
      let shouldAdvanceKey = true;

      for (let i = 0; i < modelsToTry.length; i++) {
        const model = modelsToTry[i];
        
        let currentBody: FormData | string;
        if (rawFormData) {
           currentBody = rawFormData;
           if (model) currentBody.set('model', model);
        } else {
            // Some models (e.g. qwen) do not support response_format — strip it to prevent
            // "Failed to validate JSON / failed_generation" errors on those fallback models.
            const isQwen = typeof model === 'string' && model.toLowerCase().includes('qwen');
            const bodyPayload: Record<string, any> = { ...parsed, models: undefined, model };
            if (isQwen) delete bodyPayload.response_format;
            bodyPayload.reasoning_format = bodyPayload.reasoning_format || 'hidden';
            bodyPayload.reasoning_effort = bodyPayload.reasoning_effort || 'low';
            currentBody = JSON.stringify(bodyPayload);
        }

        const groqResponse = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            ...(contentType.includes("application/json") ? { "Content-Type": "application/json" } : {}),
          },
          body: currentBody,
        });

        const responseText = await groqResponse.text();
        let groqData: any;
        try {
          groqData = JSON.parse(responseText);
        } catch {
          groqData = { error: "Non-JSON response from Groq", raw: responseText };
        }

        finalStatus = groqResponse.status;
        finalGroqData = groqData;

        if (groqResponse.ok) {
          success = true;
          finalResponse = new Response(responseText, {
            headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
            status: 200,
          });
          
          if (cacheKey && !isStreaming) {
            responseCache.set(cacheKey, { data: responseText, expires: Date.now() + CACHE_TTL_MS });
          }
          break; // Exit model loop
        }

        // If Groq rejected strict JSON validation, retry on the same model without response_format constraint
        const errMsg = (typeof groqData?.error === 'string' ? groqData.error : (groqData?.error?.message || '')).toLowerCase();
        if (groqResponse.status === 400 && errMsg.includes('failed to validate json') && !rawFormData) {
          try {
            const parsedPayload = typeof currentBody === 'string' ? JSON.parse(currentBody) : null;
            if (parsedPayload?.response_format) {
              console.warn(`[Groq Proxy] JSON validation rejected on ${model}. Retrying without response_format constraint.`);
              delete parsedPayload.response_format;
              const retryResponse = await fetch(url, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${apiKey}`,
                  ...(contentType.includes("application/json") ? { "Content-Type": "application/json" } : {}),
                },
                body: JSON.stringify(parsedPayload),
              });
              const retryText = await retryResponse.text();
              if (retryResponse.ok) {
                success = true;
                finalResponse = new Response(retryText, {
                  headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
                  status: 200,
                });
                if (cacheKey && !isStreaming) {
                  responseCache.set(cacheKey, { data: retryText, expires: Date.now() + CACHE_TTL_MS });
                }
                break;
              }
            }
          } catch (retryErr) {
            console.warn(`[Groq Proxy] Retry without response_format failed:`, retryErr);
          }
        }

        // If rate limited, we continue to next model
        if (groqResponse.status === 429) {
          console.warn(`[Groq Proxy] Rate limited on key index ${keyIndex}, model ${model}.`);
          continue; 
        }

        // If other 5xx error, we can also try next model
        if (groqResponse.status >= 500) {
          console.warn(`[Groq Proxy] 5xx Error on key index ${keyIndex}, model ${model}.`);
          continue;
        }

        // If 400/404 error is model-specific (not found, decommissioned, or failed JSON validation on this model), try next fallback model
        if (
          groqResponse.status === 404 ||
          (groqResponse.status === 400 && (
            errMsg.includes('does not exist') ||
            errMsg.includes('decommissioned') ||
            errMsg.includes('model') ||
            errMsg.includes('failed to validate json')
          ))
        ) {
          console.warn(`[Groq Proxy] Model error for ${model} (${errMsg}). Retrying with next model fallback.`);
          continue;
        }

        // For other client 4xx errors, do not retry
        shouldAdvanceKey = false;
        finalResponse = new Response(JSON.stringify(groqData), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          status: groqResponse.status,
        });
        break;
      }

      if (success || !shouldAdvanceKey) {
        break; // Exit keys loop
      }

      // If we reach here, all models failed (likely 429) for the CURRENT key.
      console.warn(`[Groq Proxy] API Key index ${keyIndex} is drained or failed all models. Switching to next key.`);
      advanceApiKey();
      keysTried++;
    }

    const duration = ((performance.now() - startTime) / 1000).toFixed(2);

    if (!finalResponse) {
      console.error(`[Groq Proxy] All API keys and models exhausted for user ${user.id} (${duration}s)`);
      return new Response(JSON.stringify(finalGroqData || { error: "All API keys and models are rate limited." }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: finalStatus,
      });
    }

    if (finalStatus === 200) {
      console.log(`[Groq Proxy] Success for user ${user.id} (${duration}s)`);
    } else {
      console.error(`[Groq Proxy] Groq API error (${finalStatus}) for user ${user.id} (${duration}s):`, JSON.stringify(finalGroqData));
    }

    return finalResponse;
  } catch (error) {
    console.error("[Groq Proxy] Internal Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
