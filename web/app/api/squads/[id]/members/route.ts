import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import * as Sentry from "@sentry/nextjs";

export const revalidate = 60; // Cache for 60 seconds

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const squadId = params.id;
    if (!squadId) {
      return NextResponse.json({ members: [], error: "Missing squad ID" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey || serviceKey === "your_service_role_key_here") {
      return NextResponse.json(
        { members: [], error: "API not configured" },
        { status: 503 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .rpc("get_squad_leaderboard", { p_squad_id: squadId });

    if (error) {
      console.error("Error fetching squad members:", error);
      return NextResponse.json({ members: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ members: data || [] });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json(
      { members: [], error: "Failed to fetch squad members" },
      { status: 500 }
    );
  }
}
