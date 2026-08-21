-- ==============================================================================
-- 062: RESTORE POINTS MULTIPLIER (Fix for missing points)
-- ==============================================================================
-- This script fixes compute_user_league_points so that it correctly
-- applies the user's current streak multiplier to their past logs
-- and achievements, giving them back the points they lost during the
-- previous achievement reset.
-- ==============================================================================

CREATE OR REPLACE FUNCTION compute_user_league_points(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pts           integer := 0;
  food_pts      integer := 0;
  activity_pts  integer := 0;
  challenge_pts integer := 0;
  achievement_pts integer := 0;
  u_row         RECORD;
  ach_id        text;
  v_streak      integer := 0;
  v_mult        numeric := 1.0;
BEGIN
  -- Get user info including current streak and achievements
  SELECT * INTO u_row
  FROM public.users WHERE id = p_user_id;

  v_streak := COALESCE(u_row.current_streak, 0);
  v_mult := get_streak_multiplier(v_streak);

  -- Points from food logs: 10 pts each * multiplier
  SELECT COALESCE(COUNT(*) * 10, 0) INTO food_pts
  FROM public.food_logs
  WHERE user_id = p_user_id;
  
  food_pts := ROUND(food_pts * v_mult);

  -- Points from activity logs: 50 pts each * multiplier
  SELECT COALESCE(COUNT(*) * 50, 0) INTO activity_pts
  FROM public.activity_logs
  WHERE user_id = p_user_id;
  
  activity_pts := ROUND(activity_pts * v_mult);

  -- Points from completed challenges (as creator): 100 pts each * multiplier
  SELECT COALESCE(COUNT(*) * 100, 0) INTO challenge_pts
  FROM public.challenges
  WHERE creator_id = p_user_id AND status = 'completed';

  -- Points from completed challenges (as participant, not creator): 100 pts each * multiplier
  SELECT challenge_pts + COALESCE(COUNT(*) * 100, 0) INTO challenge_pts
  FROM public.challenge_participants cp
  JOIN public.challenges c ON c.id = cp.challenge_id
  WHERE cp.user_id = p_user_id
    AND cp.status IN ('completed', 'accepted')
    AND c.status = 'completed'
    AND c.creator_id != p_user_id;
    
  challenge_pts := ROUND(challenge_pts * v_mult);

  -- Points from achievements: exact value per tier using get_achievement_points() * multiplier
  IF u_row.unlocked_achievements IS NOT NULL THEN
    FOREACH ach_id IN ARRAY u_row.unlocked_achievements
    LOOP
      achievement_pts := achievement_pts + get_achievement_points(ach_id);
    END LOOP;
    achievement_pts := ROUND(achievement_pts * v_mult);
  END IF;

  pts := food_pts + activity_pts + challenge_pts + achievement_pts;
  RETURN GREATEST(pts, 0);
END;
$$;

-- Recalcular los puntos de liga para todos los usuarios, ahora con el multiplicador restaurado
UPDATE public.users u
SET league_points = compute_user_league_points(u.id)
WHERE name NOT ILIKE '%Elubiz%Dev%';
