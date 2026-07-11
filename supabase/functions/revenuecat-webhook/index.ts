import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";

const ALLOWED_ORIGINS = new Set([
  "https://www.fitgo.app",
  "https://fitgo.app",
]);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : "https://www.fitgo.app";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

/**
 * Verify RevenueCat webhook signature using HMAC-SHA256.
 * RevenueCat signs payloads with the webhook secret and sends the signature
 * in the X-RevenueCat-Signature header.
 */
async function verifyWebhookSignature(
  body: string,
  signatureHeader: string | null,
  secret: string
): Promise<boolean> {
  if (!signatureHeader) return false;
  
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    
    // RevenueCat may send multiple signatures separated by spaces
    const signatures = signatureHeader.split(" ");
    return signatures.some((sig) => sig === expectedSignature);
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  // CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  try {
    // 1. Verify webhook signature (HMAC-SHA256) — FAIL CLOSED if secret not set
    const webhookSecret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
    
    if (!webhookSecret) {
      console.error("[RevenueCat Webhook] REVENUECAT_WEBHOOK_SECRET not configured. Rejecting all requests.");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Read raw body for signature verification
    const rawBody = await req.text();
    const signatureHeader = req.headers.get("X-RevenueCat-Signature");
    
    const isValid = await verifyWebhookSignature(rawBody, signatureHeader, webhookSecret);
    if (!isValid) {
      console.warn("[RevenueCat Webhook] Invalid or missing webhook signature.");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // 2. Parse request body
    const body = JSON.parse(rawBody);
    console.log("[RevenueCat Webhook] Received event type:", body.event?.type);

    const event = body.event;
    if (!event) {
      return new Response(JSON.stringify({ error: "Missing event data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const {
      type: eventType,
      app_user_id: appUserId,
      entitlement_id: entitlementId,
      entitlement_ids: entitlementIds,
      purchased_at_ms: purchasedAtMs,
      expiration_at_ms: expirationAtMs,
    } = event;

    // 3. Check if this is related to the 'pro' entitlement
    const isProEvent = entitlementId === "pro" || (entitlementIds && entitlementIds.includes("pro"));
    if (!isProEvent) {
      console.log(`[RevenueCat Webhook] Event not related to 'pro' entitlement (Entitlement: ${entitlementId || entitlementIds}). Ignoring.`);
      return new Response(JSON.stringify({ message: "Ignored: Not a pro event" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!appUserId) {
      console.error("[RevenueCat Webhook] Missing app_user_id in event payload.");
      return new Response(JSON.stringify({ error: "Missing app_user_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Initialize Supabase Admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[RevenueCat Webhook] Supabase credentials not set in Deno environment variables.");
      return new Response(JSON.stringify({ error: "Internal server config error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user's current role first to avoid downgrading privileged accounts
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", appUserId)
      .single();

    if (dbError) {
      console.warn(`[RevenueCat Webhook] Could not fetch user role for ${appUserId}:`, dbError.message);
    }
    const currentRole = dbUser?.role ?? "user";
    const isPrivileged = ["admin", "super_admin", "owner"].includes(currentRole);

    const purchasedAt = purchasedAtMs ? new Date(purchasedAtMs).toISOString() : new Date().toISOString();
    const expiresAt = expirationAtMs ? new Date(expirationAtMs).toISOString() : null;
    const isExpired = expirationAtMs ? expirationAtMs < Date.now() : false;

    console.log(`[RevenueCat Webhook] Processing event '${eventType}' for user: ${appUserId}. Role: ${currentRole}, Privileged: ${isPrivileged}. Expires: ${expiresAt}, IsExpired: ${isExpired}`);

    let updateData: any = {};
    let actionTaken = "";

    // 5. Handle different RevenueCat event types
    if (
      eventType === "INITIAL_PURCHASE" ||
      eventType === "RENEWAL" ||
      eventType === "UNCANCELLATION" ||
      eventType === "NON_RENEWING_PURCHASE"
    ) {
      updateData = {
        is_pro: true,
        role: "pro_user",
        pro_purchased_at: purchasedAt,
        pro_expires_at: expiresAt,
        pro_will_renew: true,
      };
      actionTaken = "UPGRADE_PRO";
    } else if (eventType === "EXPIRATION") {
      updateData = {
        is_pro: false,
        role: "user",
        pro_expires_at: expiresAt,
        pro_will_renew: false,
      };
      actionTaken = "DOWNGRADE_PRO";
    } else if (eventType === "CANCELLATION") {
      if (isExpired) {
        // If the subscription has already expired or is revoked immediately (e.g. refund)
        updateData = {
          is_pro: false,
          role: "user",
          pro_expires_at: expiresAt,
          pro_will_renew: false,
        };
        actionTaken = "DOWNGRADE_PRO_REFUND";
      } else {
        // If it's a cancellation but still active (auto-renew turned off)
        updateData = {
          pro_will_renew: false,
          pro_expires_at: expiresAt,
        };
        actionTaken = "CANCEL_RENEWAL";
      }
    } else if (eventType === "TRANSFER") {
      console.log(`[RevenueCat Webhook] Transfer event received. Handled by client, checking/revoking user: ${appUserId}`);
      // Usually transfers revoke the entitlement on the old user
      updateData = {
        is_pro: false,
        role: "user",
        pro_will_renew: false,
      };
      actionTaken = "DOWNGRADE_PRO_TRANSFER";
    } else {
      console.log(`[RevenueCat Webhook] Event type '${eventType}' not explicitly handled. Sincronizing dates only.`);
      updateData = {
        pro_expires_at: expiresAt,
      };
      actionTaken = "SYNC_ONLY";
    }

    // 6. Update user record in Supabase
    if (Object.keys(updateData).length > 0) {
      if (isPrivileged) {
        console.log(`[RevenueCat Webhook] User ${appUserId} is privileged (${currentRole}). Stripping role and is_pro updates to protect roles.`);
        delete updateData.role;
        delete updateData.is_pro;
      }
      const { error } = await supabaseAdmin
        .from("users")
        .update(updateData)
        .eq("id", appUserId);

      if (error) {
        console.error(`[RevenueCat Webhook] Error updating user table in database:`, error.message);
        return new Response(JSON.stringify({ error: "Database update error" }), {
          status: 500,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      console.log(`[RevenueCat Webhook] Successfully performed action: ${actionTaken} for user: ${appUserId}`);
    }

    return new Response(JSON.stringify({ success: true, action: actionTaken }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[RevenueCat Webhook] Internal Server Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
