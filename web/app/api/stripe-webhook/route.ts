import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: unknown) {
    console.error("Webhook signature verification failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  const supabaseAdmin = getSupabaseAdmin();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;

        if (userId) {
          const { data: dbUser } = await supabaseAdmin
            .from("users")
            .select("role, is_pro")
            .eq("id", userId)
            .single();

          const currentRole = dbUser?.role ?? "user";
          const isPrivileged = ["admin", "super_admin", "owner"].includes(currentRole);

          await supabaseAdmin
            .from("users")
            .update({
              is_pro: true,
              role: isPrivileged ? currentRole : "pro_user",
              pro_purchased_at: new Date().toISOString(),
              pro_will_renew: true,
            })
            .eq("id", userId);

          console.log(`[Stripe Webhook] User ${userId} upgraded to PRO.`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;

        // Attempt to find user by metadata or customer email
        const customer = customerId ? await stripe.customers.retrieve(customerId) : null;
        const customerEmail = customer && !customer.deleted ? customer.email : null;

        if (customerEmail) {
          const { data: dbUser } = await supabaseAdmin
            .from("users")
            .select("id, role")
            .eq("email", customerEmail)
            .single();

          if (dbUser) {
            const isPrivileged = ["admin", "super_admin", "owner"].includes(dbUser.role ?? "");
            await supabaseAdmin
              .from("users")
              .update({
                is_pro: false,
                role: isPrivileged ? dbUser.role : "user",
                pro_will_renew: false,
                pro_expires_at: new Date().toISOString(),
              })
              .eq("id", dbUser.id);

            console.log(`[Stripe Webhook] User ${dbUser.id} downgraded from PRO (subscription deleted).`);
          }
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("Webhook processing error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
