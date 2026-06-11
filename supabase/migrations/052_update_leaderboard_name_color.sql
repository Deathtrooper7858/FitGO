CREATE OR REPLACE FUNCTION get_squad_leaderboard(p_squad_id uuid)
RETURNS TABLE(
  user_id        uuid,
  name           text,
  avatar_url     text,
  league_points  integer,
  current_streak integer,
  name_color     text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.avatar_url, u.league_points, u.current_streak, u.name_color
  FROM public.users u
  INNER JOIN public.squad_members sm ON sm.user_id = u.id
  WHERE sm.squad_id = p_squad_id
  ORDER BY u.league_points DESC;
END;
$$;

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
    COALESCE(
      -- Points for food logs
      (SELECT COUNT(*) FROM public.food_logs fl WHERE fl.user_id = u.id) * 10 +
      -- Points for activity logs
      (SELECT COUNT(*) FROM public.activity_logs al WHERE al.user_id = u.id) * 50 +
      -- Points for completed challenges created by the user
      (SELECT COUNT(*) FROM public.challenges c WHERE c.creator_id = u.id AND c.status = 'completed') * 100 +
      -- Points for completed challenges where user is an accepted participant (excluding ones they created to avoid double counting)
      (SELECT COUNT(*) FROM public.challenge_participants cp 
       JOIN public.challenges c ON c.id = cp.challenge_id 
       WHERE cp.user_id = u.id AND cp.status = 'accepted' AND c.status = 'completed' AND c.creator_id != u.id) * 100 +
      -- Points for unlocked achievements
      COALESCE(array_length(u.unlocked_achievements, 1), 0) * 100,
      0
    )::numeric as points,
    u.name_color
  FROM public.users u
  WHERE u.name IS NOT NULL
  ORDER BY points DESC
  LIMIT limit_val;
END;
$$;
