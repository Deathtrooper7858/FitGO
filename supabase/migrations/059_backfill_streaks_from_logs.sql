-- Backfill current_streak for all users based ONLY on food_logs and activity_logs.
-- This matches the local app's "fetchHistory" logic which reconstructs activeDays
-- based strictly on logged meals and exercises, rather than just water/steps in daily_metrics.

DO $$
DECLARE
  r_user RECORD;
  v_streak INTEGER;
  v_date DATE;
  v_has_log BOOLEAN;
  v_today DATE := (timezone('utc', now()) AT TIME ZONE 'America/Bogota')::date; -- Approximate local timezone
BEGIN
  -- Loop through all users
  FOR r_user IN SELECT id FROM public.users LOOP
    v_streak := 0;
    
    -- Check if active today
    SELECT EXISTS(
      SELECT 1 FROM public.food_logs WHERE user_id = r_user.id AND (logged_at AT TIME ZONE 'America/Bogota')::date = v_today
      UNION ALL
      SELECT 1 FROM public.activity_logs WHERE user_id = r_user.id AND (logged_at AT TIME ZONE 'America/Bogota')::date = v_today
    ) INTO v_has_log;
    
    IF v_has_log THEN
      v_date := v_today;
    ELSE
      -- Check if active yesterday
      SELECT EXISTS(
        SELECT 1 FROM public.food_logs WHERE user_id = r_user.id AND (logged_at AT TIME ZONE 'America/Bogota')::date = v_today - 1
        UNION ALL
        SELECT 1 FROM public.activity_logs WHERE user_id = r_user.id AND (logged_at AT TIME ZONE 'America/Bogota')::date = v_today - 1
      ) INTO v_has_log;
      
      IF v_has_log THEN
        v_date := v_today - 1;
      ELSE
        -- No streak
        v_date := NULL;
      END IF;
    END IF;

    -- Count consecutive days
    IF v_date IS NOT NULL THEN
      WHILE true LOOP
        SELECT EXISTS(
          SELECT 1 FROM public.food_logs WHERE user_id = r_user.id AND (logged_at AT TIME ZONE 'America/Bogota')::date = v_date
          UNION ALL
          SELECT 1 FROM public.activity_logs WHERE user_id = r_user.id AND (logged_at AT TIME ZONE 'America/Bogota')::date = v_date
        ) INTO v_has_log;
        
        IF NOT v_has_log THEN
          EXIT;
        END IF;
        
        v_streak := v_streak + 1;
        v_date := v_date - 1;
      END LOOP;
    END IF;

    -- Update user's current_streak
    UPDATE public.users SET current_streak = v_streak WHERE id = r_user.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
