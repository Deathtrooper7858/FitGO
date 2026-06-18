DO $$
DECLARE
  u RECORD;
  new_ach text[];
  num_food_logs int;
BEGIN
  FOR u IN SELECT * FROM public.users LOOP
    new_ach := COALESCE(u.unlocked_achievements, '{}'::text[]);
    
    IF NOT ('welcome' = ANY(new_ach)) THEN
      new_ach := array_append(new_ach, 'welcome');
    END IF;
    
    IF (u.name IS NOT NULL AND u.goal IS NOT NULL AND u.height IS NOT NULL AND u.weight IS NOT NULL AND u.avatar_url IS NOT NULL) AND NOT ('profile_complete' = ANY(new_ach)) THEN
      new_ach := array_append(new_ach, 'profile_complete');
    END IF;
    
    SELECT count(*) INTO num_food_logs FROM public.food_logs WHERE user_id = u.id;
    IF num_food_logs > 0 AND NOT ('first_log' = ANY(new_ach)) THEN
      new_ach := array_append(new_ach, 'first_log');
    END IF;
    
    IF COALESCE(u.current_streak, 0) >= 3 AND NOT ('streak_3' = ANY(new_ach)) THEN new_ach := array_append(new_ach, 'streak_3'); END IF;
    IF COALESCE(u.current_streak, 0) >= 7 AND NOT ('streak_7' = ANY(new_ach)) THEN new_ach := array_append(new_ach, 'streak_7'); END IF;
    IF COALESCE(u.current_streak, 0) >= 30 AND NOT ('streak_30' = ANY(new_ach)) THEN new_ach := array_append(new_ach, 'streak_30'); END IF;
    IF COALESCE(u.current_streak, 0) >= 100 AND NOT ('streak_100' = ANY(new_ach)) THEN new_ach := array_append(new_ach, 'streak_100'); END IF;
    
    IF u.is_pro AND NOT ('premium_club' = ANY(new_ach)) THEN new_ach := array_append(new_ach, 'premium_club'); END IF;
    
    IF u.unlocked_achievements IS DISTINCT FROM new_ach THEN
      UPDATE public.users SET unlocked_achievements = new_ach WHERE id = u.id;
    END IF;
  END LOOP;
END;
$$;
UPDATE public.users u SET league_points = compute_user_league_points(u.id) WHERE u.name IS NOT NULL;
UPDATE public.squads s SET points = (SELECT COALESCE(SUM(u.league_points), 0) FROM public.squad_members sm JOIN public.users u ON u.id = sm.user_id WHERE sm.squad_id = s.id);
