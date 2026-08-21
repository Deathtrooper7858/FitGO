-- ==============================================================================
-- 070: FULL POINTS OPTIMIZATION & SOCIAL REWARDS
-- ==============================================================================
-- 1. Updates compute_user_league_points to include social actions (posts, comments, likes)
-- 2. Calculates a fair baseline of points for all users without unfairly applying 
--    the current streak multiplier to all historical actions.
-- 3. Adds triggers for social actions to award points going forward.
-- 4. Recalculates all users' points correctly to establish a perfectly fair global ranking.
-- ==============================================================================

-- ── PASO 1: Update compute_user_league_points ─────────────────────────────────
-- Calculates the exact total base points a user deserves for all their historical actions.
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
  social_pts      integer := 0;
  achievement_pts integer := 0;
  u_row           RECORD;
  ach_id          text;
  v_streak        integer := 0;
  v_mult          numeric := 1.0;
BEGIN
  -- Obtener racha actual para dar un pequeño bonus a los usuarios con racha activa
  -- en sus cálculos de puntos base (compensando rachas pasadas perdidas).
  SELECT * INTO u_row FROM public.users WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  v_streak := COALESCE(u_row.current_streak, 0);
  v_mult   := get_streak_multiplier(v_streak);

  -- Puntos por food_logs: 10 pts cada uno
  SELECT COALESCE(COUNT(*) * 10, 0) INTO food_pts
  FROM public.food_logs
  WHERE user_id = p_user_id;

  -- Puntos por activity_logs: 50 pts cada uno
  SELECT COALESCE(COUNT(*) * 50, 0) INTO activity_pts
  FROM public.activity_logs
  WHERE user_id = p_user_id;

  -- Puntos por retos completados (como creador): 100 pts
  SELECT COALESCE(COUNT(*) * 100, 0) INTO challenge_pts
  FROM public.challenges
  WHERE creator_id = p_user_id AND status = 'completed';

  -- Puntos por retos completados (como participante): 100 pts
  SELECT challenge_pts + COALESCE(COUNT(*) * 100, 0) INTO challenge_pts
  FROM public.challenge_participants cp
  JOIN public.challenges c ON c.id = cp.challenge_id
  WHERE cp.user_id = p_user_id
    AND cp.status IN ('completed', 'accepted')
    AND c.status = 'completed'
    AND c.creator_id != p_user_id;

  -- Puntos por posts en la comunidad: 15 pts cada uno
  SELECT COALESCE(COUNT(*) * 15, 0) INTO social_pts
  FROM public.posts
  WHERE user_id = p_user_id;

  -- Puntos por comentarios: 5 pts cada uno
  SELECT social_pts + COALESCE(COUNT(*) * 5, 0) INTO social_pts
  FROM public.post_comments
  WHERE user_id = p_user_id;

  -- Puntos por likes dados: 2 pts cada uno
  SELECT social_pts + COALESCE(COUNT(*) * 2, 0) INTO social_pts
  FROM public.post_likes
  WHERE user_id = p_user_id;

  -- Puntos por logros desbloqueados: valor exacto por tier
  IF u_row.unlocked_achievements IS NOT NULL AND array_length(u_row.unlocked_achievements, 1) > 0 THEN
    FOREACH ach_id IN ARRAY u_row.unlocked_achievements
    LOOP
      achievement_pts := achievement_pts + get_achievement_points(ach_id);
    END LOOP;
  END IF;

  -- Cálculo de puntos totales
  -- Aplicamos el multiplicador solo al total para dar una ventaja a los que tienen racha actualmente
  pts := ROUND((food_pts + activity_pts + challenge_pts + social_pts + achievement_pts) * (1.0 + ((v_mult - 1.0) * 0.5)));

  RETURN GREATEST(pts, 0);
END;
$$;


-- ── PASO 2: Triggers para otorgar puntos en acciones sociales ─────────────────

-- Trigger para Posts (+15 pts)
CREATE OR REPLACE FUNCTION trg_award_points_on_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_streak integer;
  v_mult   numeric;
  v_pts    integer;
BEGIN
  SELECT COALESCE(current_streak, 0) INTO v_streak FROM public.users WHERE id = NEW.user_id;
  v_mult := get_streak_multiplier(v_streak);
  v_pts  := GREATEST(ROUND(15 * v_mult), 1);

  UPDATE public.users SET league_points = COALESCE(league_points, 0) + v_pts WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_post_points ON public.posts;
CREATE TRIGGER trg_post_points
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION trg_award_points_on_post();

-- Trigger para Comments (+5 pts)
CREATE OR REPLACE FUNCTION trg_award_points_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_streak integer;
  v_mult   numeric;
  v_pts    integer;
BEGIN
  SELECT COALESCE(current_streak, 0) INTO v_streak FROM public.users WHERE id = NEW.user_id;
  v_mult := get_streak_multiplier(v_streak);
  v_pts  := GREATEST(ROUND(5 * v_mult), 1);

  UPDATE public.users SET league_points = COALESCE(league_points, 0) + v_pts WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_comment_points ON public.post_comments;
CREATE TRIGGER trg_comment_points
  AFTER INSERT ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION trg_award_points_on_comment();

-- Trigger para Likes (+2 pts)
CREATE OR REPLACE FUNCTION trg_award_points_on_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_streak integer;
  v_mult   numeric;
  v_pts    integer;
BEGIN
  SELECT COALESCE(current_streak, 0) INTO v_streak FROM public.users WHERE id = NEW.user_id;
  v_mult := get_streak_multiplier(v_streak);
  v_pts  := GREATEST(ROUND(2 * v_mult), 1);

  UPDATE public.users SET league_points = COALESCE(league_points, 0) + v_pts WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_like_points ON public.post_likes;
CREATE TRIGGER trg_like_points
  AFTER INSERT ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION trg_award_points_on_like();


-- ── PASO 3: Recalcular puntos de TODOS los usuarios justamente ────────────────
-- Calculamos los puntos exactos base sin inflaciones previas y los asignamos.
-- Esto asegura una tabla de clasificación 100% justa donde cada usuario tiene
-- exactamente los puntos que corresponden a sus acciones reales.

UPDATE public.users u
SET league_points = compute_user_league_points(u.id)
WHERE u.name IS NOT NULL;

-- ── PASO 4: Actualizar puntos de squads (squad_points) ────────────────────────
-- Sincronizar los puntos del squad con los nuevos league_points
UPDATE public.squads s
SET points = (
  SELECT COALESCE(SUM(u.league_points), 0)
  FROM public.squad_members sm
  JOIN public.users u ON u.id = sm.user_id
  WHERE sm.squad_id = s.id
);
