CREATE OR REPLACE FUNCTION get_global_ranking(limit_val int DEFAULT 50)
RETURNS TABLE(id uuid, name text, avatar_url text, points numeric, name_color text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.name,
    u.avatar_url,
    u.league_points::numeric AS points,
    CASE
      WHEN u.is_pro AND (u.name_color IS NULL OR u.name_color = '') THEN '#EAB308'
      ELSE u.name_color
    END AS name_color
  FROM public.users u
  WHERE u.name IS NOT NULL 
    AND u.onboarding_done = true
    AND u.league_points > 10
  ORDER BY u.league_points DESC NULLS LAST
  LIMIT limit_val;
END;
$$;
