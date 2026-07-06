import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import * as Sentry from "@sentry/nextjs";

export const revalidate = 60;

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const [
      { count: totalUsers },
      { count: totalSquads },
      { count: totalFoodLogs },
      { count: proUsers },
    ] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("squads").select("*", { count: "exact", head: true }),
      supabase.from("food_logs").select("*", { count: "exact", head: true }),
      supabase.from("users").select("*", { count: "exact", head: true }).eq("is_pro", true),
    ]);

    const { data: topUser } = await supabase
      .from("users")
      .select("name, league_points")
      .order("league_points", { ascending: false })
      .limit(1)
      .single();

    const { data: topSquad } = await supabase
      .from("squads")
      .select("name, points")
      .order("points", { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      status: "online",
      timestamp: new Date().toISOString(),
      stats: {
        total_users: totalUsers || 0,
        total_squads: totalSquads || 0,
        total_food_logs: totalFoodLogs || 0,
        pro_users: proUsers || 0,
        top_user: topUser?.name || null,
        top_user_points: topUser?.league_points || 0,
        top_squad: topSquad?.name || null,
        top_squad_points: topSquad?.points || 0,
      },
    });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ status: "error", error: "Failed to fetch server info" }, { status: 500 });
  }
}
