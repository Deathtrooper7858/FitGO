-- ==============================================================================
-- 063: RECÁLCULO COMPLETO DE PUNTOS (Fix definitivo)
-- ==============================================================================
-- Problema: Varios usuarios tienen 0 o pocos puntos a pesar de tener:
--   - Registros de alimentos (food_logs)
--   - Registros de actividad (activity_logs)
--   - Logros desbloqueados (unlocked_achievements)
--   - Retos completados (challenges/challenge_participants)
--
-- Esta migración:
--   1. Recalcula correctamente los puntos por logros desbloqueados
--   2. Recalcula puntos por food_logs y activity_logs históricos
--   3. Aplica sin excepciones a TODOS los usuarios
--   4. Usa SET (no GREATEST) para corregir valores incorrectos en ambas
--      direcciones (usuarios con muy pocos Y con demasiados puntos fake)
-- ==============================================================================

-- ── PASO 1: Actualizar compute_user_league_points para ser más robusto ─────────
-- Asegura que el multiplicador de racha se aplique correctamente
-- y que se cuenten todos los food_logs y activity_logs históricos.

CREATE OR REPLACE FUNCTION compute_user_league_points(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pts             integer := 0;
  food_pts        integer := 0;
  activity_pts    integer := 0;
  challenge_pts   integer := 0;
  achievement_pts integer := 0;
  u_row           RECORD;
  ach_id          text;
  v_streak        integer := 0;
  v_mult          numeric := 1.0;
BEGIN
  -- Obtener info del usuario incluyendo racha actual y logros
  SELECT * INTO u_row
  FROM public.users WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  v_streak := COALESCE(u_row.current_streak, 0);
  v_mult   := get_streak_multiplier(v_streak);

  -- Puntos por food_logs: 10 pts cada uno × multiplicador de racha
  SELECT COALESCE(COUNT(*) * 10, 0) INTO food_pts
  FROM public.food_logs
  WHERE user_id = p_user_id;
  food_pts := ROUND(food_pts * v_mult);

  -- Puntos por activity_logs: 50 pts cada uno × multiplicador de racha
  SELECT COALESCE(COUNT(*) * 50, 0) INTO activity_pts
  FROM public.activity_logs
  WHERE user_id = p_user_id;
  activity_pts := ROUND(activity_pts * v_mult);

  -- Puntos por retos completados (como creador): 100 pts × multiplicador
  SELECT COALESCE(COUNT(*) * 100, 0) INTO challenge_pts
  FROM public.challenges
  WHERE creator_id = p_user_id AND status = 'completed';

  -- Puntos por retos completados (como participante, no creador): 100 pts × multiplicador
  SELECT challenge_pts + COALESCE(COUNT(*) * 100, 0) INTO challenge_pts
  FROM public.challenge_participants cp
  JOIN public.challenges c ON c.id = cp.challenge_id
  WHERE cp.user_id = p_user_id
    AND cp.status IN ('completed', 'accepted')
    AND c.status = 'completed'
    AND c.creator_id != p_user_id;

  challenge_pts := ROUND(challenge_pts * v_mult);

  -- Puntos por logros desbloqueados: valor exacto por tier × multiplicador
  IF u_row.unlocked_achievements IS NOT NULL AND array_length(u_row.unlocked_achievements, 1) > 0 THEN
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

-- ── PASO 2: Recalcular racha actual de todos los usuarios ─────────────────────
-- Primero actualizamos las rachas para que el multiplicador sea correcto
DO $$
DECLARE
  r_user     RECORD;
  v_streak   INTEGER;
  v_date     DATE;
  v_has_log  BOOLEAN;
  v_today    DATE := (NOW() AT TIME ZONE 'America/Bogota')::date;
BEGIN
  FOR r_user IN SELECT id FROM public.users LOOP
    v_streak := 0;

    -- ¿Activo hoy?
    SELECT EXISTS(
      SELECT 1 FROM public.food_logs
        WHERE user_id = r_user.id
          AND (logged_at AT TIME ZONE 'America/Bogota')::date = v_today
      UNION ALL
      SELECT 1 FROM public.activity_logs
        WHERE user_id = r_user.id
          AND (logged_at AT TIME ZONE 'America/Bogota')::date = v_today
    ) INTO v_has_log;

    IF v_has_log THEN
      v_date := v_today;
    ELSE
      -- ¿Activo ayer?
      SELECT EXISTS(
        SELECT 1 FROM public.food_logs
          WHERE user_id = r_user.id
            AND (logged_at AT TIME ZONE 'America/Bogota')::date = v_today - 1
        UNION ALL
        SELECT 1 FROM public.activity_logs
          WHERE user_id = r_user.id
            AND (logged_at AT TIME ZONE 'America/Bogota')::date = v_today - 1
      ) INTO v_has_log;

      IF v_has_log THEN
        v_date := v_today - 1;
      ELSE
        v_date := NULL;
      END IF;
    END IF;

    -- Contar días consecutivos
    IF v_date IS NOT NULL THEN
      WHILE true LOOP
        SELECT EXISTS(
          SELECT 1 FROM public.food_logs
            WHERE user_id = r_user.id
              AND (logged_at AT TIME ZONE 'America/Bogota')::date = v_date
          UNION ALL
          SELECT 1 FROM public.activity_logs
            WHERE user_id = r_user.id
              AND (logged_at AT TIME ZONE 'America/Bogota')::date = v_date
        ) INTO v_has_log;

        IF NOT v_has_log THEN EXIT; END IF;
        v_streak := v_streak + 1;
        v_date   := v_date - 1;
      END LOOP;
    END IF;

    UPDATE public.users SET current_streak = v_streak WHERE id = r_user.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ── PASO 3: Recalcular league_points de TODOS los usuarios ────────────────────
-- Se usa SET directo (no GREATEST) para corregir tanto valores muy bajos
-- como posibles puntos incorrectos, y asegurar que el total refleje
-- exactamente lo que el usuario ha hecho.
UPDATE public.users u
SET league_points = compute_user_league_points(u.id)
WHERE u.name IS NOT NULL;

-- ── PASO 4: Actualizar puntos de squads basados en la suma de sus miembros ─────
-- (Los puntos del squad son la suma de contribuciones individuales)
UPDATE public.squads s
SET points = (
  SELECT COALESCE(SUM(u.league_points), 0)
  FROM public.squad_members sm
  JOIN public.users u ON u.id = sm.user_id
  WHERE sm.squad_id = s.id
);

-- ── VERIFICACIÓN ──────────────────────────────────────────────────────────────
-- Ejecuta esto para confirmar:
-- SELECT name, league_points, current_streak, array_length(unlocked_achievements,1) as logros
-- FROM public.users WHERE name IS NOT NULL ORDER BY league_points DESC LIMIT 20;
