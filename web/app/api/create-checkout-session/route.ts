import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { billing } = await req.json();
    const cookieStore = await cookies();
    
    // Get current user session securely server-side
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set() {
            // Read-only on this route
          },
          remove() {
            // Read-only on this route
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // Determine Stripe price ID based on selected plan
    const priceId = 
      billing === "annual" 
        ? process.env.STRIPE_PRICE_ANNUAL 
        : process.env.STRIPE_PRICE_MONTHLY;

    if (!priceId) {
      throw new Error("Stripe price ID is not configured.");
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?canceled=true`,
      client_reference_id: user?.id || undefined, // Link to Supabase user if logged in
      customer_email: user?.email || undefined,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("Stripe Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
