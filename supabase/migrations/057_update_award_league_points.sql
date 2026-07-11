-- ═══════════════════════════════════════════════════════════════════════════════
-- 057: UPDATE AWARD_LEAGUE_POINTS RPC
-- Updates the manual point award RPC to also increment squad_points so that 
-- squad_members.contributed_points can be updated via trigger.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.award_league_points(
  p_user_id uuid,
  p_points integer,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_streak integer;
  v_multiplier numeric := 1.0;
  v_final_points integer;
BEGIN
  -- 1. Get user's current streak
  SELECT current_streak INTO v_streak
  FROM public.users
  WHERE id = p_user_id;

  v_streak := COALESCE(v_streak, 0);

  -- 2. Determine multiplier based on streak
  IF v_streak >= 15 THEN
    v_multiplier := 2.0;
  ELSIF v_streak >= 8 THEN
    v_multiplier := 1.5;
  ELSIF v_streak >= 3 THEN
    v_multiplier := 1.2;
  END IF;

  -- 3. Calculate final points
  v_final_points := ROUND(p_points * v_multiplier);

  -- 4. Update the user's league_points AND squad_points
  UPDATE public.users
  SET 
    league_points = COALESCE(league_points, 0) + v_final_points,
    squad_points = COALESCE(squad_points, 0) + v_final_points
  WHERE id = p_user_id;
END;
$$;
