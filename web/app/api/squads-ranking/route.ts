import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import * as Sentry from "@sentry/nextjs";

export const revalidate = 30;

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey || serviceKey === "your_service_role_key_here") {
      return NextResponse.json(
        { squads: [], total: 0, error: "API not configured" },
        { status: 200 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .rpc("get_top_squads_with_live_points", { p_limit: 50 });

    let rawSquads = data || [];

    if (error) {
      const { data: fallback, error: fallbackErr } = await supabase
        .from("squads")
        .select("id, name, league_tier, points, invite_code, created_by, created_at")
        .order("points", { ascending: false })
        .limit(50);

      if (fallbackErr) throw fallbackErr;
      rawSquads = fallback || [];
    }

    const withMembers = await Promise.all(
      rawSquads.map(async (squad: Record<string, unknown> & { id: string, member_count?: number }) => {
        if (squad.member_count !== undefined) return squad;
        const { count } = await supabase
          .from("squad_members")
          .select("*", { count: "exact", head: true })
          .eq("squad_id", squad.id);
        return { ...squad, member_count: count || 0 };
      })
    );

    return NextResponse.json({ squads: withMembers, total: withMembers.length });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json(
      { squads: [], total: 0, error: "Failed to fetch squads ranking" },
      { status: 500 }
    );
  }
}
