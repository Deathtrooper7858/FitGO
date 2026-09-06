-- ==============================================================================
-- FITGO: ACTUALIZACIÓN INTEGRAL Y CONSOLIDADA DE BASE DE DATOS (SUPABASE)
-- ==============================================================================
-- Este script es 100% IDEMPOTENTE (seguro para ejecutar múltiples veces sin error).
-- Aplica:
--   1. Columnas faltantes (Trial de 3 días, Push tokens, Audio en posts, Preferencias)
--   2. Verificación de constraints de Roles ('owner', 'super_admin', etc.)
--   3. Corrección de Políticas RLS Estrictas para el Planificador (Meal / Workout Plans)
--   4. Nuevas tablas para sincronización en la nube (Fasting / Ayuno y Evaluaciones IA)
--   5. Funciones RPC críticas:
--        - start_free_trial() (Inicio seguro de 3 días)
--        - complete_challenge_atomic() (Cierre atómico de retos)
--        - award_league_points_atomic() (Puntos con multiplicador de racha unificado)
--        - create_squad_atomic() (Creación atómica de squads)
--        - downgrade_from_pro() y revoke_expired_subscriptions() (Protección de admins/owner y reseteo de colores)
--        - compute_user_league_points() y compute_user_squad_points()
--        - get_streak_multiplier() y get_achievement_points()
--   6. Índices de alto rendimiento para acelerar consultas y ranking
--   7. Cron de pg_cron (opcional y tolerante a fallos) para revocar suscripciones vencidas
-- ==============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 1: COLUMNAS ESTRUCTURALES FALTANTES
-- ─────────────────────────────────────────────────────────────────────────────

-- 1.1 Columnas para el sistema de Prueba Gratuita (3-Day Free Trial)
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS trial_used_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT 'none';

-- 1.2 Push Notifications y logros fijados
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS expo_push_token TEXT,
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"pushEnabled": true, "mealReminders": true, "social": true}'::jsonb,
  ADD COLUMN IF NOT EXISTS pinned_achievements TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS name_color TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS premium_color TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- 1.3 Audio en publicaciones sociales
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- 1.4 Snapshot de peso en fotos de progreso
ALTER TABLE public.progress_photos
  ADD COLUMN IF NOT EXISTS body_weight NUMERIC(5,2);

-- 1.5 Corrección del check constraint de Roles de usuario
DO $$
DECLARE
  constraint_record record;
BEGIN
  FOR constraint_record IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.users'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%role%'
  ) LOOP
    EXECUTE 'ALTER TABLE public.users DROP CONSTRAINT ' || quote_ident(constraint_record.conname);
  END LOOP;
END $$;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('user', 'pro', 'admin', 'super_admin', 'pro_user', 'owner'));


-- ─────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 2: NUEVAS TABLAS PARA SINCRONIZACIÓN EN LA NUBE (OPCIONALES / RECOMENDADAS)
-- ─────────────────────────────────────────────────────────────────────────────

-- 2.1 Historial de Ayuno Intermitente (Fasting Tracker)
CREATE TABLE IF NOT EXISTS public.fasting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  protocol TEXT NOT NULL,
  start_time BIGINT NOT NULL,
  end_time BIGINT NOT NULL,
  target_hours NUMERIC(4, 1) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.fasting_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own fasting sessions"   ON public.fasting_sessions;
DROP POLICY IF EXISTS "Users can insert own fasting sessions" ON public.fasting_sessions;
DROP POLICY IF EXISTS "Users can update own fasting sessions" ON public.fasting_sessions;
DROP POLICY IF EXISTS "Users can delete own fasting sessions" ON public.fasting_sessions;

CREATE POLICY "Users can view own fasting sessions"
  ON public.fasting_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fasting sessions"
  ON public.fasting_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fasting sessions"
  ON public.fasting_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own fasting sessions"
  ON public.fasting_sessions FOR DELETE
  USING (auth.uid() = user_id);


-- 2.2 Evaluaciones de Composición Corporal con IA (Physique Evaluations)
CREATE TABLE IF NOT EXISTS public.physique_evaluations (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  photo_uri TEXT,
  evaluation JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.physique_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own physique evaluations"   ON public.physique_evaluations;
DROP POLICY IF EXISTS "Users can insert own physique evaluations" ON public.physique_evaluations;
DROP POLICY IF EXISTS "Users can delete own physique evaluations" ON public.physique_evaluations;

CREATE POLICY "Users can view own physique evaluations"
  ON public.physique_evaluations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own physique evaluations"
  ON public.physique_evaluations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own physique evaluations"
  ON public.physique_evaluations FOR DELETE
  USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 3: POLÍTICAS RLS ESTRICTAS PARA EL PLANIFICADOR (MEAL & WORKOUT PLANS)
-- ─────────────────────────────────────────────────────────────────────────────

-- 3.1 meal_plans
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own meal plans"   ON public.meal_plans;
DROP POLICY IF EXISTS "Users can insert own meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users can update own meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users can delete own meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "plans_own"                       ON public.meal_plans;

CREATE POLICY "Users can view own meal plans"
  ON public.meal_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plans"
  ON public.meal_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans"
  ON public.meal_plans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans"
  ON public.meal_plans FOR DELETE
  USING (auth.uid() = user_id);

-- 3.2 meal_plan_items
ALTER TABLE public.meal_plan_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own meal plan items"   ON public.meal_plan_items;
DROP POLICY IF EXISTS "Users can insert own meal plan items" ON public.meal_plan_items;
DROP POLICY IF EXISTS "Users can update own meal plan items" ON public.meal_plan_items;
DROP POLICY IF EXISTS "Users can delete own meal plan items" ON public.meal_plan_items;
DROP POLICY IF EXISTS "meal_plan_items_insert"               ON public.meal_plan_items;
DROP POLICY IF EXISTS "meal_plan_items_update"               ON public.meal_plan_items;
DROP POLICY IF EXISTS "meal_plan_items_delete"               ON public.meal_plan_items;

CREATE POLICY "Users can view own meal plan items"
  ON public.meal_plan_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_plans
      WHERE public.meal_plans.id = public.meal_plan_items.plan_id
        AND public.meal_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own meal plan items"
  ON public.meal_plan_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meal_plans
      WHERE public.meal_plans.id = public.meal_plan_items.plan_id
        AND public.meal_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own meal plan items"
  ON public.meal_plan_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_plans
      WHERE public.meal_plans.id = public.meal_plan_items.plan_id
        AND public.meal_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own meal plan items"
  ON public.meal_plan_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_plans
      WHERE public.meal_plans.id = public.meal_plan_items.plan_id
        AND public.meal_plans.user_id = auth.uid()
    )
  );

-- 3.3 workout_plans
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own workout plans"   ON public.workout_plans;
DROP POLICY IF EXISTS "Users can insert own workout plans" ON public.workout_plans;
DROP POLICY IF EXISTS "Users can update own workout plans" ON public.workout_plans;
DROP POLICY IF EXISTS "Users can delete own workout plans" ON public.workout_plans;

CREATE POLICY "Users can view own workout plans"
  ON public.workout_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout plans"
  ON public.workout_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout plans"
  ON public.workout_plans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout plans"
  ON public.workout_plans FOR DELETE
  USING (auth.uid() = user_id);

-- 3.4 workout_plan_items
ALTER TABLE public.workout_plan_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own workout plan items"   ON public.workout_plan_items;
DROP POLICY IF EXISTS "Users can insert own workout plan items" ON public.workout_plan_items;
DROP POLICY IF EXISTS "Users can update own workout plan items" ON public.workout_plan_items;
DROP POLICY IF EXISTS "Users can delete own workout plan items" ON public.workout_plan_items;
DROP POLICY IF EXISTS "workout_plan_items_insert"               ON public.workout_plan_items;

CREATE POLICY "Users can view own workout plan items"
  ON public.workout_plan_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans
      WHERE public.workout_plans.id = public.workout_plan_items.plan_id
        AND public.workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own workout plan items"
  ON public.workout_plan_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_plans
      WHERE public.workout_plans.id = public.workout_plan_items.plan_id
        AND public.workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own workout plan items"
  ON public.workout_plan_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans
      WHERE public.workout_plans.id = public.workout_plan_items.plan_id
        AND public.workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own workout plan items"
  ON public.workout_plan_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans
      WHERE public.workout_plans.id = public.workout_plan_items.plan_id
        AND public.workout_plans.user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 4: REGLAS DE PUNTOS, RACHAS Y LOGROS
-- ─────────────────────────────────────────────────────────────────────────────

-- 4.1 Multiplicador canónico de racha
CREATE OR REPLACE FUNCTION public.get_streak_multiplier(p_streak integer)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_streak >= 15 THEN RETURN 2.0;
  ELSIF p_streak >= 8 THEN RETURN 1.5;
  ELSIF p_streak >= 3 THEN RETURN 1.2;
  ELSE RETURN 1.0;
  END IF;
END;
$$;

-- 4.2 Puntos canónicos por Logro
CREATE OR REPLACE FUNCTION public.get_achievement_points(achievement_id text)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE achievement_id
    -- Bronce (+10 pts)
    WHEN 'welcome'              THEN 10
    WHEN 'dark_mode_lover'      THEN 10
    WHEN 'streak_3'             THEN 10
    WHEN 'first_log'            THEN 10
    WHEN 'water_habit'          THEN 10
    WHEN 'photo_pioneer'        THEN 10
    WHEN 'rest_day_respect'     THEN 10
    WHEN 'social_star'          THEN 10
    WHEN 'ghost_mode'           THEN 10
    WHEN 'profile_stalker'      THEN 10
    WHEN 'fast_logger'          THEN 10
    WHEN 'first_like'           THEN 10
    WHEN 'smoothie_lover'       THEN 10
    WHEN 'sleep_master'         THEN 10
    WHEN 'chef_kiss'            THEN 10
    WHEN 'protein_pancake'      THEN 10
    WHEN 'first_comment'        THEN 10

    -- Plata (+25 pts)
    WHEN 'premium_club'         THEN 25
    WHEN 'profile_complete'     THEN 25
    WHEN 'streak_7'             THEN 25
    WHEN 'early_bird'           THEN 25
    WHEN 'protein_goal'         THEN 25
    WHEN 'healthy_eater'        THEN 25
    WHEN 'water_champion'       THEN 25
    WHEN 'hydration_streak_7'   THEN 25
    WHEN 'carnival_eater'       THEN 25
    WHEN 'late_snack'           THEN 25
    WHEN 'body_sculptor'        THEN 25
    WHEN 'step_master'          THEN 25
    WHEN 'sleep_champion'       THEN 25
    WHEN 'social_influence'     THEN 25
    WHEN 'post_creator'         THEN 25
    WHEN 'community_voice'      THEN 25
    WHEN 'squad_member'         THEN 25

    -- Oro (+50 pts)
    WHEN 'streak_30'            THEN 50
    WHEN 'perfect_macros'       THEN 50
    WHEN 'water_god'            THEN 50
    WHEN 'diet_expert'          THEN 50
    WHEN 'nutrition_scholar'    THEN 50
    WHEN 'century_club'         THEN 50
    WHEN 'iron_will'            THEN 50
    WHEN 'challenge_champion'   THEN 50
    WHEN 'squad_leader'         THEN 50
    WHEN 'fasting_monk'         THEN 50

    -- Diamante (+100 pts)
    WHEN 'streak_100'           THEN 100
    WHEN 'streak_365'           THEN 100
    WHEN 'streak_500'           THEN 100
    WHEN 'streak_1000'          THEN 100
    WHEN 'water_ocean'          THEN 100
    WHEN 'grandmaster'          THEN 100
    WHEN 'legendary_warrior'    THEN 100
    WHEN 'hall_of_fame'         THEN 100
    ELSE 10
  END;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 5: PROCEDIMIENTOS RPC CRÍTICOS Y OPERACIONES ATÓMICAS
-- ─────────────────────────────────────────────────────────────────────────────

-- 5.1 Función para activar el Free Trial de 3 días de forma segura
CREATE OR REPLACE FUNCTION public.start_free_trial()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_has_trial TIMESTAMP WITH TIME ZONE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT trial_used_at INTO v_has_trial FROM public.users WHERE id = v_user_id;
  
  IF v_has_trial IS NOT NULL THEN
    RAISE EXCEPTION 'TRIAL_ALREADY_USED';
  END IF;

  UPDATE public.users 
  SET 
    trial_used_at     = NOW(),
    trial_expires_at  = NOW() + INTERVAL '3 days',
    is_pro            = true,
    role              = CASE WHEN role IN ('admin', 'super_admin', 'owner') THEN role ELSE 'pro_user' END,
    subscription_type = 'trial',
    pro_purchased_at  = NOW(),
    pro_expires_at    = NOW() + INTERVAL '3 days',
    pro_will_renew    = false
  WHERE id = v_user_id;
END;
$$;

-- 5.2 Upgrade a usuario PRO (Suscripción paga o manual)
CREATE OR REPLACE FUNCTION public.upgrade_to_pro_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role FROM public.users WHERE id = target_user_id;

  IF v_role NOT IN ('admin', 'super_admin', 'owner') THEN
    UPDATE public.users
    SET
      role              = 'pro_user',
      is_pro            = true,
      subscription_type = 'premium',
      unlocked_achievements = array_append(
          array_remove(unlocked_achievements, 'pro_subscriber'),
          'pro_subscriber'
      ),
      pro_purchased_at  = NOW(),
      pro_expires_at    = NOW() + INTERVAL '30 days',
      pro_will_renew    = true
    WHERE id = target_user_id;
  ELSE
    UPDATE public.users
    SET
      is_pro            = true,
      subscription_type = 'manual',
      pro_purchased_at  = NOW(),
      pro_expires_at    = NULL,
      pro_will_renew    = false
    WHERE id = target_user_id;
  END IF;
END;
$$;

-- 5.3 Downgrade de usuario PRO (Limpia roles ordinarios, name_color y premium_color)
CREATE OR REPLACE FUNCTION public.downgrade_from_pro(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role FROM public.users WHERE id = target_user_id;

  IF v_role NOT IN ('admin', 'super_admin', 'owner') THEN
    UPDATE public.users
    SET
      role              = 'user',
      is_pro            = false,
      subscription_type = 'none',
      pro_will_renew    = false,
      name_color        = NULL,
      premium_color     = NULL
    WHERE id = target_user_id;
  END IF;
END;
$$;

-- 5.4 Revocación de suscripciones y pruebas vencidas
CREATE OR REPLACE FUNCTION public.revoke_expired_subscriptions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  revoked_count INTEGER;
BEGIN
  UPDATE public.users
  SET
    is_pro            = FALSE,
    role              = 'user',
    name_color        = NULL,
    premium_color     = NULL,
    pro_will_renew    = FALSE,
    subscription_type = 'none'
  WHERE
    is_pro = TRUE
    AND (
      (pro_expires_at IS NOT NULL AND pro_expires_at < NOW())
      OR (trial_expires_at IS NOT NULL AND trial_expires_at < NOW())
    )
    AND role NOT IN ('admin', 'super_admin', 'owner')
    AND subscription_type IN ('premium', 'trial');

  GET DIAGNOSTICS revoked_count = ROW_COUNT;
  RAISE LOG 'revoke_expired_subscriptions: revoked % users', revoked_count;
  RETURN revoked_count;
END;
$$;

-- Alias para compatibilidad con tareas previas
CREATE OR REPLACE FUNCTION public.revoke_expired_trials()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.revoke_expired_subscriptions();
END;
$$;

-- 5.5 award_league_points_atomic (Atómico con Lock transaccional y multiplicador canónico)
CREATE OR REPLACE FUNCTION public.award_league_points_atomic(
  p_user_id UUID,
  p_points  INT,
  p_reason  TEXT DEFAULT 'general'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_streak INT;
  v_multiplier     NUMERIC;
  v_final_points   INT;
  v_new_total      INT;
BEGIN
  SELECT current_streak INTO v_current_streak
  FROM public.users
  WHERE id = p_user_id
  FOR UPDATE;

  v_current_streak := COALESCE(v_current_streak, 0);
  v_multiplier     := public.get_streak_multiplier(v_current_streak);
  v_final_points   := ROUND(p_points * v_multiplier);

  UPDATE public.users SET
    league_points = COALESCE(league_points, 0) + v_final_points,
    squad_points  = COALESCE(squad_points,  0) + v_final_points
  WHERE id = p_user_id
  RETURNING league_points INTO v_new_total;

  RETURN jsonb_build_object(
    'points_awarded', v_final_points,
    'base_points',    p_points,
    'multiplier',     v_multiplier,
    'new_total',      v_new_total
  );
END;
$$;

-- 5.6 complete_challenge_atomic (Evita doble adjudicación con lock por hash)
CREATE OR REPLACE FUNCTION public.complete_challenge_atomic(
  p_challenge_id UUID,
  p_user_id      UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lock_key         BIGINT;
  v_active_count     INT;
  v_completed_count  INT;
  v_reward_points    INT;
  v_base_points      CONSTANT INT := 500;
  v_participant      RECORD;
  v_result           JSONB;
BEGIN
  v_lock_key := hashtext(p_challenge_id::text);
  PERFORM pg_advisory_xact_lock(v_lock_key);

  UPDATE public.challenge_participants
  SET status = 'completed'
  WHERE challenge_id = p_challenge_id
    AND user_id = p_user_id
    AND status != 'surrendered';

  SELECT
    COUNT(*) FILTER (WHERE status != 'surrendered'),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO v_active_count, v_completed_count
  FROM public.challenge_participants
  WHERE challenge_id = p_challenge_id;

  IF v_active_count > 0 AND v_active_count = v_completed_count THEN
    UPDATE public.challenges 
    SET status = 'completed' 
    WHERE id = p_challenge_id AND status = 'active';
    
    IF FOUND THEN
      v_reward_points := v_base_points / GREATEST(v_active_count, 1);

      FOR v_participant IN
        SELECT user_id FROM public.challenge_participants
        WHERE challenge_id = p_challenge_id AND status = 'completed'
      LOOP
        PERFORM public.award_league_points_atomic(v_participant.user_id, v_reward_points, 'challenge_completed');
      END LOOP;

      v_result := jsonb_build_object(
        'completed', true,
        'reward_points', v_reward_points,
        'participants_count', v_active_count
      );
    ELSE
      v_result := jsonb_build_object(
        'completed', true,
        'reward_points', 0,
        'participants_count', v_active_count,
        'already_closed', true
      );
    END IF;
  ELSE
    v_result := jsonb_build_object(
      'completed', false,
      'reward_points', 0,
      'participants_count', v_active_count,
      'still_pending', v_active_count - v_completed_count
    );
  END IF;

  RETURN v_result;
END;
$$;

-- 5.7 create_squad_atomic
CREATE OR REPLACE FUNCTION public.create_squad_atomic(
  p_name    TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_squad_id    UUID;
  v_invite_code TEXT;
BEGIN
  v_invite_code := lower(substr(md5(random()::text), 1, 8));

  INSERT INTO public.squads (name, created_by, invite_code)
  VALUES (p_name, p_user_id, v_invite_code)
  RETURNING id INTO v_squad_id;

  INSERT INTO public.squad_members (squad_id, user_id, role)
  VALUES (v_squad_id, p_user_id, 'leader');

  RETURN jsonb_build_object(
    'id',          v_squad_id,
    'invite_code', v_invite_code,
    'name',        p_name,
    'created_by',  p_user_id
  );
END;
$$;

-- 5.8 compute_user_league_points (Cálculo histórico balanceado)
CREATE OR REPLACE FUNCTION public.compute_user_league_points(p_user_id uuid)
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
  SELECT * INTO u_row FROM public.users WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  v_streak := COALESCE(u_row.current_streak, 0);
  v_mult   := public.get_streak_multiplier(v_streak);

  SELECT COALESCE(COUNT(*) * 10, 0) INTO food_pts
  FROM public.food_logs WHERE user_id = p_user_id;

  SELECT COALESCE(COUNT(*) * 50, 0) INTO activity_pts
  FROM public.activity_logs WHERE user_id = p_user_id;

  SELECT COALESCE(COUNT(*) * 100, 0) INTO challenge_pts
  FROM public.challenges WHERE creator_id = p_user_id AND status = 'completed';

  SELECT challenge_pts + COALESCE(COUNT(*) * 100, 0) INTO challenge_pts
  FROM public.challenge_participants cp
  JOIN public.challenges c ON c.id = cp.challenge_id
  WHERE cp.user_id = p_user_id
    AND cp.status IN ('completed', 'accepted')
    AND c.status = 'completed'
    AND c.creator_id != p_user_id;

  SELECT COALESCE(COUNT(*) * 15, 0) INTO social_pts
  FROM public.posts WHERE user_id = p_user_id;

  SELECT social_pts + COALESCE(COUNT(*) * 5, 0) INTO social_pts
  FROM public.post_comments WHERE user_id = p_user_id;

  SELECT social_pts + COALESCE(COUNT(*) * 2, 0) INTO social_pts
  FROM public.post_likes WHERE user_id = p_user_id;

  IF u_row.unlocked_achievements IS NOT NULL AND array_length(u_row.unlocked_achievements, 1) > 0 THEN
    FOREACH ach_id IN ARRAY u_row.unlocked_achievements
    LOOP
      achievement_pts := achievement_pts + public.get_achievement_points(ach_id);
    END LOOP;
  END IF;

  pts := ROUND((food_pts + activity_pts + challenge_pts + social_pts + achievement_pts) * (1.0 + ((v_mult - 1.0) * 0.5)));
  RETURN GREATEST(pts, 0);
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 6: ÍNDICES DE RENDIMIENTO Y CONCURRENCIA
-- ─────────────────────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS idx_squads_invite_code
  ON public.squads (invite_code)
  WHERE invite_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_trial_expires_at
  ON public.users (trial_expires_at)
  WHERE trial_expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_email
  ON public.users (email)
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver_read
  ON public.direct_messages (receiver_id, is_read)
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation
  ON public.direct_messages (sender_id, receiver_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_challenge_participants_status
  ON public.challenge_participants (challenge_id, status);

CREATE INDEX IF NOT EXISTS idx_food_logs_user_date
  ON public.food_logs (user_id, logged_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date
  ON public.activity_logs (user_id, logged_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_user
  ON public.post_likes (post_id, user_id);

CREATE INDEX IF NOT EXISTS idx_progress_photos_user_date
  ON public.progress_photos (user_id, taken_at DESC);

CREATE INDEX IF NOT EXISTS idx_fasting_sessions_user
  ON public.fasting_sessions (user_id, start_time DESC);

CREATE INDEX IF NOT EXISTS idx_physique_evaluations_user
  ON public.physique_evaluations (user_id, created_at DESC);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 7: CRON DE REVOCACIÓN AUTOMÁTICA (PG_CRON)
-- ─────────────────────────────────────────────────────────────────────────────
-- Si tu proyecto Supabase tiene habilitada la extensión pg_cron, se programará
-- la revocación de trials y suscripciones cada hora de forma desatendida.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
    
    -- Eliminar job previo si existiera
    PERFORM cron.unschedule('revoke-expired-subscriptions');
    
    -- Programar ejecución horaria
    PERFORM cron.schedule(
      'revoke-expired-subscriptions',
      '0 * * * *',
      'SELECT public.revoke_expired_subscriptions()'
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron no disponible o sin permisos para programar cron automático. Las revocaciones se manejarán desde el ciclo de vida de la app.';
END $$;

COMMIT;
