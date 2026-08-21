-- 060_squad_leaderboard_total_points.sql
-- Modify get_squad_leaderboard to return total_league_points as well

DROP FUNCTION IF EXISTS get_squad_leaderboard(uuid);

CREATE OR REPLACE FUNCTION get_squad_leaderboard(p_squad_id uuid)
RETURNS TABLE(
  user_id        uuid,
  name           text,
  avatar_url     text,
  league_points  integer,
  current_streak integer,
  name_color     text,
  total_league_points integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.avatar_url, sm.contributed_points AS league_points, u.current_streak,
         CASE WHEN u.is_pro AND (u.name_color IS NULL OR u.name_color = '') THEN '#EAB308' ELSE u.name_color END as name_color,
         u.league_points as total_league_points
  FROM public.users u
  INNER JOIN public.squad_members sm ON sm.user_id = u.id
  WHERE sm.squad_id = p_squad_id
  ORDER BY sm.contributed_points DESC;
END;
$$;
