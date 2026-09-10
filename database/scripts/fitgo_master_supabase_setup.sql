-- ==============================================================================
-- FITGO MASTER DATABASE SETUP — SUPABASE (TODO EN UNO / CONSOLIDADO)
-- ==============================================================================
-- Este archivo contiene la estructura completa, robusta y definitiva para FitGO:
--   1. Extensiones requeridas (UUID y Criptografía)
--   2. Tabla 'users' integral (autenticación, perfil nutricional, suscripciones y roles)
--   3. Tablas de Salud, Nutrición y Seguimiento (comidas, medidas, métricas diarias, etc.)
--   4. Tablas del Planificador Inteligente (Meal Plans & Workout Plans)
--   5. Tablas de Ayuno Intermitente y Evaluación Física con IA
--   6. Sistema Social y Comunidad (amigos, posts, likes, comentarios, chats directos, retos)
--   7. Sistema de Ligas y Squads (Guerra de Macros en 10 divisiones)
--   8. Configuración de Storage Buckets y Políticas de Almacenamiento
--   9. Procedimientos Almacenados (RPCs) y Operaciones Atómicas
--  10. Triggers de Automatización (Onboarding auth, Timestamps, Límite de miembros)
--  11. Políticas de Seguridad RLS (Row Level Security) 100% configuradas
--  12. Índices de Alto Rendimiento para producción
--
-- NOTA: Este script es 100% IDEMPOTENTE (se puede correr en una BD nueva o existente).
-- ==============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. EXTENSIONES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TABLA PRINCIPAL: USERS (PERFILES SINCRONIZADOS CON AUTH.USERS)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id                        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                     TEXT NOT NULL,
  name                      TEXT,
  avatar_url                TEXT,
  sex                       TEXT CHECK (sex IN ('male', 'female', 'other')),
  custom_gender             TEXT,
  age                       INTEGER,
  weight                    NUMERIC(5,2),         -- Peso actual (kg)
  starting_weight           NUMERIC(5,2),         -- Peso inicial (kg)
  target_weight             NUMERIC(5,2),         -- Peso objetivo (kg)
  height                    NUMERIC(5,1),         -- Altura (cm)
  activity_level            TEXT CHECK (activity_level IN ('sedentary','light','moderate','active','very_active')),
  lifestyle                 TEXT,
  lifestyle_level           TEXT,
  goal                      TEXT CHECK (goal IN ('lose','maintain','gain')),
  velocity                  TEXT DEFAULT 'moderate',
  tdee                      INTEGER,
  target_calories           INTEGER,
  macros                    JSONB DEFAULT '{"protein":0,"carbs":0,"fat":0}'::jsonb,
  restrictions              TEXT[] DEFAULT '{}',
  preferences               TEXT[] DEFAULT '{}',
  dietary_restrictions      TEXT[] DEFAULT '{}',
  medical_conditions        TEXT[] DEFAULT '{}',
  medications_supplements   TEXT[] DEFAULT '{}',
  diet_type                 TEXT DEFAULT 'recommended',
  available_foods           TEXT[] DEFAULT '{}',
  weight_unit               TEXT DEFAULT 'kg',
  height_unit               TEXT DEFAULT 'cm',
  
  -- Membresías, Roles y Pruebas
  role                      TEXT NOT NULL DEFAULT 'user',
  is_pro                    BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_type         TEXT DEFAULT 'none',
  pro_purchased_at          TIMESTAMPTZ,
  pro_expires_at            TIMESTAMPTZ,
  pro_will_renew            BOOLEAN DEFAULT FALSE,
  trial_used_at             TIMESTAMPTZ DEFAULT NULL,
  trial_expires_at          TIMESTAMPTZ DEFAULT NULL,
  
  -- Gamificación, Ligas y Rachas
  league_points             INTEGER NOT NULL DEFAULT 0,
  squad_points              INTEGER NOT NULL DEFAULT 0,
  current_streak            INTEGER NOT NULL DEFAULT 0,
  max_streak                INTEGER NOT NULL DEFAULT 0,
  last_log_date             DATE,
  extra_snacks              INTEGER DEFAULT 0,
  unlocked_achievements     TEXT[] DEFAULT '{}',
  pinned_achievements       TEXT[] DEFAULT '{}',
  name_color                TEXT DEFAULT NULL,
  premium_color             TEXT DEFAULT NULL,
  
  -- Ajustes de Usuario
  language                  TEXT DEFAULT 'en',
  expo_push_token           TEXT DEFAULT NULL,
  notification_preferences  JSONB DEFAULT '{"pushEnabled": true, "mealReminders": true, "social": true}'::jsonb,
  widgets_order             TEXT[] DEFAULT NULL,
  secondary_goals           TEXT[] DEFAULT '{}',
  onboarding_done           BOOLEAN DEFAULT FALSE,
  terms_accepted            BOOLEAN DEFAULT FALSE,
  
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar TODAS las columnas en bases de datos que ya tenían public.users creada
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS starting_weight NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS target_weight NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS custom_gender TEXT,
  ADD COLUMN IF NOT EXISTS lifestyle TEXT,
  ADD COLUMN IF NOT EXISTS lifestyle_level TEXT,
  ADD COLUMN IF NOT EXISTS velocity TEXT DEFAULT 'moderate',
  ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS medical_conditions TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS medications_supplements TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS diet_type TEXT DEFAULT 'recommended',
  ADD COLUMN IF NOT EXISTS available_foods TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS weight_unit TEXT DEFAULT 'kg',
  ADD COLUMN IF NOT EXISTS height_unit TEXT DEFAULT 'cm',
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS pro_purchased_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pro_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pro_will_renew BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trial_used_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS league_points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS squad_points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_log_date DATE,
  ADD COLUMN IF NOT EXISTS extra_snacks INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unlocked_achievements TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pinned_achievements TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS name_color TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS premium_color TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS expo_push_token TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"pushEnabled": true, "mealReminders": true, "social": true}'::jsonb,
  ADD COLUMN IF NOT EXISTS widgets_order TEXT[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS secondary_goals TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS onboarding_done BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE;

-- Asegurar constraints de roles
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
-- 3. TABLAS DE SALUD, ALIMENTACIÓN Y MÉTRICAS DIARIAS
-- ─────────────────────────────────────────────────────────────────────────────

-- 3.1 Catálogo y caché de Alimentos
CREATE TABLE IF NOT EXISTS public.foods (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  brand       TEXT,
  calories    NUMERIC(8,2),
  protein     NUMERIC(8,2),
  carbs       NUMERIC(8,2),
  fat         NUMERIC(8,2),
  fiber       NUMERIC(8,2),
  sugar       NUMERIC(8,2),
  sodium      NUMERIC(8,2),
  calcium     NUMERIC(8,2),
  image_url   TEXT,
  source      TEXT,
  verified    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.foods
  ADD COLUMN IF NOT EXISTS calcium NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- 3.2 Registro diario de Comidas
CREATE TABLE IF NOT EXISTS public.food_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  food_id     TEXT REFERENCES public.foods(id) ON DELETE SET NULL,
  food_name   TEXT NOT NULL,
  meal        TEXT CHECK (meal IN ('breakfast','lunch','dinner','snack')),
  grams       NUMERIC(8,2) NOT NULL,
  calories    NUMERIC(8,2) NOT NULL,
  protein     NUMERIC(8,2) NOT NULL,
  carbs       NUMERIC(8,2) NOT NULL,
  fat         NUMERIC(8,2) NOT NULL,
  image_url   TEXT,
  logged_at   DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3 Medidas Corporales
CREATE TABLE IF NOT EXISTS public.body_measurements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  weight          NUMERIC(5,2),
  body_fat_pct    NUMERIC(4,1),
  waist_cm        NUMERIC(5,1),
  hip_cm          NUMERIC(5,1),
  chest_cm        NUMERIC(5,1),
  arms_cm         NUMERIC(5,1),
  legs_cm         NUMERIC(5,1),
  neck_cm         NUMERIC(5,1),
  measured_at     DATE NOT NULL DEFAULT CURRENT_DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, measured_at)
);

-- 3.4 Métricas Diarias (Pasos, Agua, Sueño)
CREATE TABLE IF NOT EXISTS public.daily_metrics (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  water_ml        INTEGER DEFAULT 0,
  steps           INTEGER DEFAULT 0,
  sleep_hours     NUMERIC(4,1),
  sleep_quality   INTEGER,
  neat_level      TEXT,
  exercise_level  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

ALTER TABLE public.daily_metrics
  ADD COLUMN IF NOT EXISTS sleep_hours NUMERIC(4,1),
  ADD COLUMN IF NOT EXISTS sleep_quality INTEGER,
  ADD COLUMN IF NOT EXISTS neat_level TEXT,
  ADD COLUMN IF NOT EXISTS exercise_level TEXT;

-- 3.5 Registro de Actividades y Ejercicios
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  icon        TEXT,
  calories    INTEGER NOT NULL DEFAULT 0,
  duration    INTEGER NOT NULL DEFAULT 0,
  intensity   TEXT DEFAULT 'moderate',
  logged_at   DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3.6 Coach de Inteligencia Artificial (Sesiones y Mensajes)
CREATE TABLE IF NOT EXISTS public.coach_sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  coach_type  TEXT CHECK (coach_type IN ('nutritionist', 'trainer')) DEFAULT 'nutritionist',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coach_conversations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id  UUID REFERENCES public.coach_sessions(id) ON DELETE CASCADE,
  sender      TEXT CHECK (sender IN ('user','coach')) NOT NULL,
  message     TEXT NOT NULL,
  image_url   TEXT,
  msg_date    DATE DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.coach_conversations
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.coach_sessions(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3.7 Suscripciones de Pagos Externos (RevenueCat / Stripe)
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status                 TEXT NOT NULL,
  plan                   TEXT NOT NULL,
  amount                 NUMERIC(8,2),
  currency               TEXT DEFAULT 'USD',
  provider               TEXT DEFAULT 'revenuecat',
  subscription_id        TEXT,
  start_date             TIMESTAMPTZ DEFAULT NOW(),
  end_date               TIMESTAMPTZ,
  cancel_at_period_end   BOOLEAN DEFAULT FALSE,
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

-- 3.8 Recetas Saludables
CREATE TABLE IF NOT EXISTS public.recipes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  prep_time_min   INTEGER,
  cook_time_min   INTEGER,
  servings        INTEGER DEFAULT 1,
  calories        INTEGER,
  protein         NUMERIC(6,1),
  carbs           NUMERIC(6,1),
  fat             NUMERIC(6,1),
  ingredients     JSONB DEFAULT '[]'::jsonb,
  instructions    TEXT[] DEFAULT '{}',
  image_url       TEXT,
  is_premium      BOOLEAN DEFAULT FALSE,
  is_system       BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar columnas en bases existentes de recipes
ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS prep_time_min INTEGER,
  ADD COLUMN IF NOT EXISTS cook_time_min INTEGER,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3.9 Fotos de Progreso
CREATE TABLE IF NOT EXISTS public.progress_photos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  photo_url   TEXT NOT NULL,
  photo_type  TEXT CHECK (photo_type IN ('front','side','back')) DEFAULT 'front',
  body_weight NUMERIC(5,2),
  notes       TEXT,
  taken_at    DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.progress_photos
  ADD COLUMN IF NOT EXISTS body_weight NUMERIC(5,2);

-- 3.10 Historial de Ayuno Intermitente
CREATE TABLE IF NOT EXISTS public.fasting_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  protocol     TEXT NOT NULL,
  start_time   BIGINT NOT NULL,
  end_time     BIGINT NOT NULL,
  target_hours NUMERIC(4, 1) NOT NULL,
  completed    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.11 Evaluaciones de Composición Corporal con IA
CREATE TABLE IF NOT EXISTS public.physique_evaluations (
  id          TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date        TEXT NOT NULL,
  photo_uri   TEXT,
  evaluation  JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. PLANIFICADOR INTELIGENTE (MEAL PLANS & WORKOUT PLANS)
-- ─────────────────────────────────────────────────────────────────────────────

-- 4.1 Planes de Comida Semanales
CREATE TABLE IF NOT EXISTS public.meal_plans (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  week_start    DATE NOT NULL,
  generated_by  TEXT DEFAULT 'ai',
  raw_ai_text   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.meal_plan_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id       UUID NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  day_of_week   TEXT CHECK (day_of_week IN ('Mon','Tue','Wed','Thu','Fri','Sat','Sun')),
  meal          TEXT CHECK (meal IN ('breakfast','lunch','dinner','snack')),
  name          TEXT NOT NULL,
  calories      INTEGER,
  protein       NUMERIC(6,1),
  carbs         NUMERIC(6,1),
  fat           NUMERIC(6,1),
  notes         TEXT,
  recipe_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 4.2 Planes de Entrenamiento Semanales
CREATE TABLE IF NOT EXISTS public.workout_plans (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  week_start    DATE NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workout_plan_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id       UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  day_of_week   TEXT CHECK (day_of_week IN ('Mon','Tue','Wed','Thu','Fri','Sat','Sun')),
  exercise_name TEXT NOT NULL,
  sets          INTEGER NOT NULL DEFAULT 3,
  reps          INTEGER NOT NULL DEFAULT 10,
  weight_kg     NUMERIC(5,2) DEFAULT 0,
  rest_seconds  INTEGER DEFAULT 60,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. COMUNIDAD Y RED SOCIAL
-- ─────────────────────────────────────────────────────────────────────────────

-- 5.1 Relaciones de Amistad
CREATE TABLE IF NOT EXISTS public.friends (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_id_2   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id_1, user_id_2)
);

-- 5.2 Retos Comunitarios
CREATE TABLE IF NOT EXISTS public.challenges (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  type          TEXT NOT NULL,
  target_value  NUMERIC NOT NULL,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id  UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  progress      NUMERIC NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(challenge_id, user_id)
);

-- 5.3 Publicaciones en el Muro (Feed Social)
CREATE TABLE IF NOT EXISTS public.posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  image_url       TEXT,
  audio_url       TEXT,
  likes_count     INTEGER NOT NULL DEFAULT 0,
  comments_count  INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS audio_url TEXT,
  ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- 5.4 Likes en Publicaciones
CREATE TABLE IF NOT EXISTS public.post_likes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(post_id, user_id)
);

-- 5.5 Comentarios en Publicaciones
CREATE TABLE IF NOT EXISTS public.post_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  is_edited   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.post_comments
  ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;

-- 5.6 Mensajería Directa entre Amigos (Chats)
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  media_url   TEXT DEFAULT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.direct_messages
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. SISTEMA DE LIGAS COMPETITIVAS Y SQUADS ("GUERRAS DE MACROS")
-- ─────────────────────────────────────────────────────────────────────────────

-- 6.1 Squads / Equipos (10 Divisiones)
CREATE TABLE IF NOT EXISTS public.squads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  league_tier TEXT NOT NULL DEFAULT 'bronce',
  points      INTEGER NOT NULL DEFAULT 0,
  invite_code TEXT UNIQUE NOT NULL DEFAULT substring(md5(random()::text), 1, 8),
  created_by  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.squads DROP CONSTRAINT IF EXISTS squads_league_tier_check;
ALTER TABLE public.squads ADD CONSTRAINT squads_league_tier_check 
  CHECK (league_tier IN ('bronce', 'plata', 'oro', 'platino', 'esmeralda', 'diamante', 'maestro', 'leyenda', 'titan', 'celestial'));

-- 6.2 Miembros de Squad (Límite de 5 usuarios enforced por trigger)
CREATE TABLE IF NOT EXISTS public.squad_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id    UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(squad_id, user_id)
);

-- 6.3 Registro de Auditoría de Puntos de Liga
CREATE TABLE IF NOT EXISTS public.league_point_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  squad_id    UUID REFERENCES public.squads(id) ON DELETE SET NULL,
  points      INTEGER NOT NULL,
  reason      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. STORAGE BUCKETS (ALMACENAMIENTO DE ARCHIVOS Y MULTIMEDIA)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('avatars', 'avatars', true),
  ('progress-photos', 'progress-photos', false),
  ('food-scans', 'food-scans', false),
  ('social', 'social', true),
  ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. REGLAS Y FUNCIONES AUXILIARES (PUNTOS, LOGROS, RACHAS)
-- ─────────────────────────────────────────────────────────────────────────────

-- 8.1 Multiplicador de Racha
CREATE OR REPLACE FUNCTION public.get_streak_multiplier(p_streak integer)
RETURNS numeric LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF p_streak >= 15 THEN RETURN 2.0;
  ELSIF p_streak >= 8 THEN RETURN 1.5;
  ELSIF p_streak >= 3 THEN RETURN 1.2;
  ELSE RETURN 1.0;
  END IF;
END;
$$;

-- 8.2 Puntos canónicos por Logro
CREATE OR REPLACE FUNCTION public.get_achievement_points(achievement_id text)
RETURNS integer LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  RETURN CASE achievement_id
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
-- 9. PROCEDIMIENTOS RPC CRÍTICOS (OPERACIONES ATÓMICAS Y SUSCRIPCIONES)
-- ─────────────────────────────────────────────────────────────────────────────

-- 9.1 Inicio del Free Trial (3 Días)
CREATE OR REPLACE FUNCTION public.start_free_trial()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id UUID;
  v_has_trial TIMESTAMPTZ;
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

-- 9.2 Upgrade a Pro
CREATE OR REPLACE FUNCTION public.upgrade_to_pro_user(target_user_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

-- 9.3 Downgrade de Pro a Usuario Estándar
CREATE OR REPLACE FUNCTION public.downgrade_from_pro(target_user_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

-- 9.4 Revocación de Suscripciones y Pruebas Vencidas
CREATE OR REPLACE FUNCTION public.revoke_expired_subscriptions()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
  RETURN revoked_count;
END;
$$;

-- 9.5 Suma Atómica de Puntos de Liga con Multiplicador
CREATE OR REPLACE FUNCTION public.award_league_points_atomic(
  p_user_id UUID,
  p_points  INT,
  p_reason  TEXT DEFAULT 'general'
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

  INSERT INTO public.league_point_logs (user_id, points, reason)
  VALUES (p_user_id, v_final_points, p_reason);

  RETURN jsonb_build_object(
    'points_awarded', v_final_points,
    'base_points',    p_points,
    'multiplier',     v_multiplier,
    'new_total',      v_new_total
  );
END;
$$;

-- 9.6 Cierre Atómico de Retos (Evita recompensas duplicadas)
CREATE OR REPLACE FUNCTION public.complete_challenge_atomic(
  p_challenge_id UUID,
  p_user_id      UUID
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_lock_key         BIGINT;
  v_active_count     INT;
  v_completed_count  INT;
  v_reward_points    INT;
  v_base_points      CONSTANT INT := 500;
BEGIN
  v_lock_key := hashtext(p_challenge_id::text);
  PERFORM pg_advisory_xact_lock(v_lock_key);

  UPDATE public.challenge_participants
  SET status = 'completed'
  WHERE challenge_id = p_challenge_id
    AND user_id      = p_user_id
    AND status       = 'accepted';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'ALREADY_COMPLETED_OR_NOT_ACCEPTED');
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE status = 'accepted'),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO v_active_count, v_completed_count
  FROM public.challenge_participants
  WHERE challenge_id = p_challenge_id;

  v_reward_points := v_base_points + GREATEST(0, (v_completed_count - 1) * 100);

  PERFORM public.award_league_points_atomic(
    p_user_id,
    v_reward_points,
    'challenge_completion'
  );

  IF v_active_count = 0 THEN
    UPDATE public.challenges
    SET status = 'completed'
    WHERE id = p_challenge_id AND status = 'active';
  END IF;

  RETURN jsonb_build_object(
    'success',         true,
    'points_awarded',  v_reward_points,
    'challenge_closed', (v_active_count = 0)
  );
END;
$$;

-- 9.7 Creación Atómica de Squads
CREATE OR REPLACE FUNCTION public.create_squad_atomic(
  p_name       TEXT,
  p_user_id    UUID
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_existing_squad UUID;
  v_new_squad_id   UUID;
  v_invite_code    TEXT;
BEGIN
  SELECT squad_id INTO v_existing_squad
  FROM public.squad_members
  WHERE user_id = p_user_id
  LIMIT 1;

  IF v_existing_squad IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'ALREADY_IN_SQUAD');
  END IF;

  v_invite_code := UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT) FROM 1 FOR 6));

  INSERT INTO public.squads (name, created_by, invite_code, points, league_tier)
  VALUES (TRIM(p_name), p_user_id, v_invite_code, 0, 'bronce')
  RETURNING id INTO v_new_squad_id;

  INSERT INTO public.squad_members (squad_id, user_id)
  VALUES (v_new_squad_id, p_user_id);

  UPDATE public.users SET squad_points = 0 WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success',     true,
    'squad_id',    v_new_squad_id,
    'invite_code', v_invite_code
  );
END;
$$;

-- 9.8 Recalcular División de Squad
CREATE OR REPLACE FUNCTION public.recalculate_league_tier(p_squad_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_points integer;
  v_tier   text;
BEGIN
  SELECT points INTO v_points FROM public.squads WHERE id = p_squad_id;
  IF    v_points >= 15000 THEN v_tier := 'celestial';
  ELSIF v_points >= 10000 THEN v_tier := 'titan';
  ELSIF v_points >= 7500  THEN v_tier := 'leyenda';
  ELSIF v_points >= 5000  THEN v_tier := 'maestro';
  ELSIF v_points >= 3500  THEN v_tier := 'diamante';
  ELSIF v_points >= 2000  THEN v_tier := 'esmeralda';
  ELSIF v_points >= 1000  THEN v_tier := 'platino';
  ELSIF v_points >= 500   THEN v_tier := 'oro';
  ELSIF v_points >= 200   THEN v_tier := 'plata';
  ELSE                         v_tier := 'bronce';
  END IF;
  UPDATE public.squads SET league_tier = v_tier WHERE id = p_squad_id;
END;
$$;

-- 9.9 Eliminación Segura de Cuenta de Usuario
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 10. TRIGGERS DE AUTOMATIZACIÓN
-- ─────────────────────────────────────────────────────────────────────────────

-- 10.1 Auto-crear perfil en public.users al registrarse en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url, role, language)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    'user',
    COALESCE(NEW.raw_user_meta_data->>'language', 'es')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(public.users.name, EXCLUDED.name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10.2 Actualización automática de updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN 
  NEW.updated_at = NOW(); 
  RETURN NEW; 
END;
$$;

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS daily_metrics_updated_at ON public.daily_metrics;
CREATE TRIGGER daily_metrics_updated_at
  BEFORE UPDATE ON public.daily_metrics
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 10.3 Límite estricto de máximo 5 miembros por Squad
CREATE OR REPLACE FUNCTION public.check_squad_max_members()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.squad_members WHERE squad_id = NEW.squad_id) >= 5 THEN
    RAISE EXCEPTION 'A squad cannot have more than 5 members.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_squad_max_members ON public.squad_members;
CREATE TRIGGER enforce_squad_max_members
  BEFORE INSERT ON public.squad_members
  FOR EACH ROW EXECUTE PROCEDURE public.check_squad_max_members();

-- 10.4 Auto-sincronización de puntos y divisiones de Squad
CREATE OR REPLACE FUNCTION public.sync_squad_points()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_squad_id UUID;
  v_total_points INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_squad_id := OLD.squad_id;
  ELSE
    v_squad_id := NEW.squad_id;
  END IF;

  IF v_squad_id IS NOT NULL THEN
    SELECT COALESCE(SUM(u.squad_points), 0)
    INTO v_total_points
    FROM public.squad_members sm
    JOIN public.users u ON u.id = sm.user_id
    WHERE sm.squad_id = v_squad_id;

    UPDATE public.squads
    SET points = v_total_points
    WHERE id = v_squad_id;

    PERFORM public.recalculate_league_tier(v_squad_id);
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_squad_member_change ON public.squad_members;
CREATE TRIGGER on_squad_member_change
  AFTER INSERT OR DELETE OR UPDATE ON public.squad_members
  FOR EACH ROW EXECUTE FUNCTION public.sync_squad_points();


-- ─────────────────────────────────────────────────────────────────────────────
-- 11. POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY - RLS)
-- ─────────────────────────────────────────────────────────────────────────────

-- Activar RLS en todas las tablas
ALTER TABLE public.users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_logs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measurements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_metrics          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_conversations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_photos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fasting_sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physique_evaluations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plan_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squads                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_members          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_point_logs      ENABLE ROW LEVEL SECURITY;

-- 11.1 Users: Propietario puede actualizar; lectura pública de datos de perfil para rankings y social
DROP POLICY IF EXISTS "users_own" ON public.users;
DROP POLICY IF EXISTS "users_public_read" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;

CREATE POLICY "users_public_read" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert_own"  ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own"  ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 11.2 Foods: Lectura para autenticados, inserción comunitaria / verificada
DROP POLICY IF EXISTS "foods_read" ON public.foods;
DROP POLICY IF EXISTS "foods_insert" ON public.foods;
CREATE POLICY "foods_read"   ON public.foods FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "foods_insert" ON public.foods FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 11.3 Food Logs
DROP POLICY IF EXISTS "food_logs_own" ON public.food_logs;
CREATE POLICY "food_logs_own" ON public.food_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 11.4 Body Measurements
DROP POLICY IF EXISTS "body_meas_own" ON public.body_measurements;
CREATE POLICY "body_meas_own" ON public.body_measurements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 11.5 Daily Metrics
DROP POLICY IF EXISTS "daily_metrics_own" ON public.daily_metrics;
CREATE POLICY "daily_metrics_own" ON public.daily_metrics FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 11.6 Activity Logs
DROP POLICY IF EXISTS "activity_logs_own" ON public.activity_logs;
CREATE POLICY "activity_logs_own" ON public.activity_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 11.7 Coach AI
DROP POLICY IF EXISTS "coach_sessions_own" ON public.coach_sessions;
CREATE POLICY "coach_sessions_own" ON public.coach_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "coach_conv_own" ON public.coach_conversations;
CREATE POLICY "coach_conv_own" ON public.coach_conversations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 11.8 Subscriptions
DROP POLICY IF EXISTS "subs_own" ON public.user_subscriptions;
CREATE POLICY "subs_own" ON public.user_subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 11.9 Recipes: Sistema legibles por todos (user_id IS NULL o is_system), personales por su creador
DROP POLICY IF EXISTS "recipes_read" ON public.recipes;
DROP POLICY IF EXISTS "recipes_write" ON public.recipes;
CREATE POLICY "recipes_read"  ON public.recipes FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id OR is_system = true);
CREATE POLICY "recipes_write" ON public.recipes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 11.10 Progress Photos
DROP POLICY IF EXISTS "photos_own" ON public.progress_photos;
CREATE POLICY "photos_own" ON public.progress_photos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 11.11 Fasting Sessions
DROP POLICY IF EXISTS "fasting_sessions_own" ON public.fasting_sessions;
CREATE POLICY "fasting_sessions_own" ON public.fasting_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 11.12 Physique Evaluations
DROP POLICY IF EXISTS "physique_evaluations_own" ON public.physique_evaluations;
CREATE POLICY "physique_evaluations_own" ON public.physique_evaluations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 11.13 Meal Plans & Items
DROP POLICY IF EXISTS "meal_plans_own" ON public.meal_plans;
CREATE POLICY "meal_plans_own" ON public.meal_plans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "meal_plan_items_own" ON public.meal_plan_items;
CREATE POLICY "meal_plan_items_own" ON public.meal_plan_items FOR ALL
USING (EXISTS (SELECT 1 FROM public.meal_plans WHERE meal_plans.id = meal_plan_items.plan_id AND meal_plans.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.meal_plans WHERE meal_plans.id = meal_plan_items.plan_id AND meal_plans.user_id = auth.uid()));

-- 11.14 Workout Plans & Items
DROP POLICY IF EXISTS "workout_plans_own" ON public.workout_plans;
CREATE POLICY "workout_plans_own" ON public.workout_plans FOR ALL
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "workout_plan_items_own" ON public.workout_plan_items;
CREATE POLICY "workout_plan_items_own" ON public.workout_plan_items FOR ALL
USING (EXISTS (SELECT 1 FROM public.workout_plans WHERE workout_plans.id = workout_plan_items.plan_id AND workout_plans.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.workout_plans WHERE workout_plans.id = workout_plan_items.plan_id AND workout_plans.user_id = auth.uid()));

-- 11.15 Friends
DROP POLICY IF EXISTS "friends_select" ON public.friends;
DROP POLICY IF EXISTS "friends_insert" ON public.friends;
DROP POLICY IF EXISTS "friends_update" ON public.friends;
DROP POLICY IF EXISTS "friends_delete" ON public.friends;
CREATE POLICY "friends_select" ON public.friends FOR SELECT USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);
CREATE POLICY "friends_insert" ON public.friends FOR INSERT WITH CHECK (auth.uid() = user_id_1);
CREATE POLICY "friends_update" ON public.friends FOR UPDATE USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);
CREATE POLICY "friends_delete" ON public.friends FOR DELETE USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- 11.16 Challenges
DROP POLICY IF EXISTS "challenges_select" ON public.challenges;
DROP POLICY IF EXISTS "challenges_all_creator" ON public.challenges;
CREATE POLICY "challenges_select" ON public.challenges FOR SELECT USING (true);
CREATE POLICY "challenges_all_creator" ON public.challenges FOR ALL USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "challenge_parts_select" ON public.challenge_participants;
DROP POLICY IF EXISTS "challenge_parts_manage" ON public.challenge_participants;
CREATE POLICY "challenge_parts_select" ON public.challenge_participants FOR SELECT USING (true);
CREATE POLICY "challenge_parts_manage" ON public.challenge_participants FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 11.17 Posts, Likes, Comments
DROP POLICY IF EXISTS "posts_select" ON public.posts;
DROP POLICY IF EXISTS "posts_manage" ON public.posts;
CREATE POLICY "posts_select" ON public.posts FOR SELECT USING (true);
CREATE POLICY "posts_manage" ON public.posts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "post_likes_select" ON public.post_likes;
DROP POLICY IF EXISTS "post_likes_manage" ON public.post_likes;
CREATE POLICY "post_likes_select" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "post_likes_manage" ON public.post_likes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "post_comments_select" ON public.post_comments;
DROP POLICY IF EXISTS "post_comments_manage" ON public.post_comments;
CREATE POLICY "post_comments_select" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "post_comments_manage" ON public.post_comments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 11.18 Direct Messages
DROP POLICY IF EXISTS "dm_select" ON public.direct_messages;
DROP POLICY IF EXISTS "dm_insert" ON public.direct_messages;
DROP POLICY IF EXISTS "dm_update" ON public.direct_messages;
CREATE POLICY "dm_select" ON public.direct_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "dm_insert" ON public.direct_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "dm_update" ON public.direct_messages FOR UPDATE USING (auth.uid() = receiver_id);

-- 11.19 Squads & Members
DROP POLICY IF EXISTS "squads_select" ON public.squads;
DROP POLICY IF EXISTS "squads_insert" ON public.squads;
DROP POLICY IF EXISTS "squads_manage" ON public.squads;
CREATE POLICY "squads_select" ON public.squads FOR SELECT USING (true);
CREATE POLICY "squads_insert" ON public.squads FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "squads_manage" ON public.squads FOR ALL USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "squad_members_select" ON public.squad_members;
DROP POLICY IF EXISTS "squad_members_manage" ON public.squad_members;
CREATE POLICY "squad_members_select" ON public.squad_members FOR SELECT USING (true);
CREATE POLICY "squad_members_manage" ON public.squad_members FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 11.20 League Point Logs
DROP POLICY IF EXISTS "point_logs_select" ON public.league_point_logs;
CREATE POLICY "point_logs_select" ON public.league_point_logs FOR SELECT USING (auth.uid() = user_id);

-- 11.21 Políticas de Storage (storage.objects)
DROP POLICY IF EXISTS "storage_public_read" ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_delete" ON storage.objects;

CREATE POLICY "storage_public_read" ON storage.objects FOR SELECT
USING (bucket_id IN ('avatars', 'social', 'chat-media') OR auth.uid() = owner);

CREATE POLICY "storage_auth_upload" ON storage.objects FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "storage_auth_update" ON storage.objects FOR UPDATE
USING (auth.uid() = owner) WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "storage_auth_delete" ON storage.objects FOR DELETE
USING (auth.uid() = owner);


-- ─────────────────────────────────────────────────────────────────────────────
-- 12. ÍNDICES DE ALTO RENDIMIENTO
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_league_points        ON public.users (league_points DESC);
CREATE INDEX IF NOT EXISTS idx_users_squad_points         ON public.users (squad_points DESC);
CREATE INDEX IF NOT EXISTS idx_users_role                 ON public.users (role);
CREATE INDEX IF NOT EXISTS idx_users_subscription_type    ON public.users (subscription_type);
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date       ON public.food_logs (user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_body_meas_user_date       ON public.body_measurements (user_id, measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date    ON public.daily_metrics (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date    ON public.activity_logs (user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_coach_conv_user_date       ON public.coach_conversations (user_id, msg_date DESC);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user            ON public.meal_plans (user_id, week_start DESC);
CREATE INDEX IF NOT EXISTS idx_workout_plans_user         ON public.workout_plans (user_id, week_start DESC);
CREATE INDEX IF NOT EXISTS idx_friends_user_1             ON public.friends (user_id_1, status);
CREATE INDEX IF NOT EXISTS idx_friends_user_2             ON public.friends (user_id_2, status);
CREATE INDEX IF NOT EXISTS idx_posts_user_created         ON public.posts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created_at           ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_user       ON public.post_likes (post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post         ON public.post_comments (post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_chat       ON public.direct_messages (sender_id, receiver_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_squads_tier_points         ON public.squads (league_tier, points DESC);
CREATE INDEX IF NOT EXISTS idx_squad_members_squad        ON public.squad_members (squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_members_user         ON public.squad_members (user_id);
CREATE INDEX IF NOT EXISTS idx_league_point_logs_user     ON public.league_point_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fasting_sessions_user      ON public.fasting_sessions (user_id, start_time DESC);

COMMIT;
-- ==============================================================================
-- FIN DEL SCRIPT MAESTRO DE FITGO
-- ==============================================================================
