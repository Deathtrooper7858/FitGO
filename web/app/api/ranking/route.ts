import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import * as Sentry from "@sentry/nextjs";

interface UserRow {
  id: string;
  name: string | null;
  avatar_url: string | null;
  name_color: string | null;
  is_pro: boolean | null;
  league_points: number | null;
  current_streak: number | null;
  role: string | null;
}

export const revalidate = 30;

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey || serviceKey === "your_service_role_key_here") {
      return NextResponse.json(
        { ranking: [], total: 0, error: "API not configured" },
        { status: 200 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("users")
      .select("id, name, avatar_url, name_color, is_pro, league_points, current_streak, role")
      .not("name", "is", null)
      .order("league_points", { ascending: false, nullsFirst: false })
      .limit(100);

    if (error) throw error;

    const mapped = (data as UserRow[] || []).map((u) => {
      const hasPremiumAccess = u.is_pro || ["owner", "admin", "super_admin"].includes(u.role ?? "");
      let validNameColor = u.name_color;

      if (!hasPremiumAccess && validNameColor && ["#EAB308", "#FFD700", "#F59E0B"].includes(validNameColor.toUpperCase())) {
        validNameColor = null;
      }
      if (hasPremiumAccess && (!validNameColor || validNameColor === "")) {
        validNameColor = "#EAB308";
      }

      return {
        id: u.id,
        name: u.name,
        avatar_url: u.avatar_url,
        points: u.league_points || 0,
        current_streak: u.current_streak || 0,
        role: u.role || "user",
        name_color: validNameColor,
        is_pro: !!u.is_pro,
      };
    });

    return NextResponse.json({ ranking: mapped, total: mapped.length });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json(
      { ranking: [], total: 0, error: "Failed to fetch ranking" },
      { status: 500 }
    );
  }
}
