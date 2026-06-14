-- ==============================================================================
-- SCRIPT DE CORRECCIÓN DEFINITIVA DE PUNTOS
-- Ejecuta esto en el SQL Editor de Supabase
-- ==============================================================================
-- Qué hace este script:
--   1. Corrige compute_user_league_points para que aplique el multiplicador 
--      de racha sobre food_logs, activity_logs, challenges Y logros.
--   2. Corrige compute_user_squad_points igualmente.
--   3. Recalcula los league_points de TODOS los usuarios basándose en:
--        - Sus food_logs registrados (10 pts c/u * mult racha)
--        - Sus activity_logs registrados (50 pts c/u * mult racha)
--        - Sus challenges completados (100 pts c/u * mult racha)
--        - Sus logros desbloqueados (valor según tier * mult racha)
--   4. Recalcula squad_points (sin incluir logros, solo actividad real).
--   5. Sincroniza los puntos de cada squad.
-- ==============================================================================


-- ── PASO 1: Reescribir compute_user_league_points con multiplicador correcto ──

CREATE OR REPLACE FUNCTION compute_user_league_points(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  food_pts        integer := 0;
  activity_pts    integer := 0;
  challenge_pts   integer := 0;
  achievement_pts integer := 0;
  v_streak        integer := 0;
  v_mult          numeric := 1.0;
  u_row           RECORD;
  ach_id          text;
BEGIN
  -- Obtener racha del usuario para el multiplicador
  SELECT current_streak, unlocked_achievements
  INTO u_row
  FROM public.users WHERE id = p_user_id;

  v_streak := COALESCE(u_row.current_streak, 0);
  v_mult   := get_streak_multiplier(v_streak);

  -- Puntos de food_logs: 10 pts c/u * mult
  SELECT COALESCE(COUNT(*) * 10, 0) INTO food_pts
  FROM public.food_logs WHERE user_id = p_user_id;
  food_pts := ROUND(food_pts * v_mult);

  -- Puntos de activity_logs: 50 pts c/u * mult
  SELECT COALESCE(COUNT(*) * 50, 0) INTO activity_pts
  FROM public.activity_logs WHERE user_id = p_user_id;
  activity_pts := ROUND(activity_pts * v_mult);

  -- Puntos de challenges completados (como creador)
  SELECT COALESCE(COUNT(*) * 100, 0) INTO challenge_pts
  FROM public.challenges
  WHERE creator_id = p_user_id AND status = 'completed';

  -- Puntos de challenges completados (como participante)
  SELECT challenge_pts + COALESCE(COUNT(*) * 100, 0) INTO challenge_pts
  FROM public.challenge_participants cp
  JOIN public.challenges c ON c.id = cp.challenge_id
  WHERE cp.user_id = p_user_id
    AND cp.status IN ('completed', 'accepted')
    AND c.status = 'completed'
    AND c.creator_id != p_user_id;
  challenge_pts := ROUND(challenge_pts * v_mult);

  -- Puntos de logros desbloqueados: valor exacto por tier * mult
  IF u_row.unlocked_achievements IS NOT NULL THEN
    FOREACH ach_id IN ARRAY u_row.unlocked_achievements
    LOOP
      achievement_pts := achievement_pts + get_achievement_points(ach_id);
    END LOOP;
    achievement_pts := ROUND(achievement_pts * v_mult);
  END IF;

  RETURN GREATEST(food_pts + activity_pts + challenge_pts + achievement_pts, 0);
END;
$$;


-- ── PASO 2: Reescribir compute_user_squad_points con multiplicador correcto ──
-- (squad_points NO incluye logros, solo actividad real)

CREATE OR REPLACE FUNCTION compute_user_squad_points(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  food_pts      integer := 0;
  activity_pts  integer := 0;
  challenge_pts integer := 0;
  v_streak      integer := 0;
  v_mult        numeric := 1.0;
BEGIN
  SELECT COALESCE(current_streak, 0) INTO v_streak
  FROM public.users WHERE id = p_user_id;

  v_mult := get_streak_multiplier(v_streak);

  SELECT COALESCE(COUNT(*) * 10, 0) INTO food_pts
  FROM public.food_logs WHERE user_id = p_user_id;
  food_pts := ROUND(food_pts * v_mult);

  SELECT COALESCE(COUNT(*) * 50, 0) INTO activity_pts
  FROM public.activity_logs WHERE user_id = p_user_id;
  activity_pts := ROUND(activity_pts * v_mult);

  SELECT COALESCE(COUNT(*) * 100, 0) INTO challenge_pts
  FROM public.challenges
  WHERE creator_id = p_user_id AND status = 'completed';

  SELECT challenge_pts + COALESCE(COUNT(*) * 100, 0) INTO challenge_pts
  FROM public.challenge_participants cp
  JOIN public.challenges c ON c.id = cp.challenge_id
  WHERE cp.user_id = p_user_id
    AND cp.status IN ('completed', 'accepted')
    AND c.status = 'completed'
    AND c.creator_id != p_user_id;
  challenge_pts := ROUND(challenge_pts * v_mult);

  RETURN GREATEST(food_pts + activity_pts + challenge_pts, 0);
END;
$$;


-- ── PASO 3: Recalcular league_points para TODOS los usuarios ─────────────────

UPDATE public.users u
SET league_points = compute_user_league_points(u.id)
WHERE u.name IS NOT NULL;


-- ── PASO 4: Recalcular squad_points para TODOS los usuarios ─────────────────

UPDATE public.users u
SET squad_points = compute_user_squad_points(u.id)
WHERE u.name IS NOT NULL;


-- ── PASO 5: Sincronizar puntos de cada squad ─────────────────────────────────

UPDATE public.squads s
SET points = COALESCE((
  SELECT SUM(u.squad_points)
  FROM public.users u
  INNER JOIN public.squad_members sm ON sm.user_id = u.id
  WHERE sm.squad_id = s.id
), 0);


-- ── VERIFICACIÓN ─────────────────────────────────────────────────────────────
-- Descomenta las siguientes líneas para ver el resultado:
-- SELECT name, league_points, squad_points, current_streak,
--   array_length(unlocked_achievements, 1) AS total_logros
-- FROM public.users
-- WHERE name IS NOT NULL
-- ORDER BY league_points DESC
-- LIMIT 30;
