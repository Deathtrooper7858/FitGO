import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables for webhook");
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.client_reference_id;

      if (userId) {
        const supabaseAdmin = getSupabaseAdmin();
        const { data: existing } = await supabaseAdmin
          .from("profiles")
          .select("is_premium")
          .eq("id", userId)
          .single();

        if (!existing?.is_premium) {
          await supabaseAdmin
            .from("profiles")
            .update({ is_premium: true })
            .eq("id", userId);
          console.log(`User ${userId} upgraded to Premium via Stripe.`);
        } else {
          console.log(`User ${userId} already premium, skipping.`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("Webhook error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 400 }
    );
  }
}
