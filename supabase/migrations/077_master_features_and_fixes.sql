-- ==============================================================================
-- Migration 077: Master Features and Fixes (Consolidado)
-- Direct messages, premium color, dynamic water, health metrics, and storage
-- ==============================================================================

BEGIN;

-- 1. Direct Messages
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL DEFAULT '',
    image_url TEXT,
    audio_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT '';
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;

CREATE INDEX IF NOT EXISTS idx_direct_messages_participants ON public.direct_messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver_read ON public.direct_messages(receiver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON public.direct_messages(created_at DESC);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own direct messages" ON public.direct_messages;
CREATE POLICY "Users can view their own direct messages" 
ON public.direct_messages FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send direct messages" ON public.direct_messages;
CREATE POLICY "Users can send direct messages" 
ON public.direct_messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can mark received messages as read" ON public.direct_messages;
CREATE POLICY "Users can mark received messages as read" 
ON public.direct_messages FOR UPDATE 
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can delete their own direct messages" ON public.direct_messages;
CREATE POLICY "Users can delete their own direct messages" 
ON public.direct_messages FOR DELETE 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'direct_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
  END IF;
END $$;

-- 2. Users & Premium Color
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS premium_color TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name_color TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS target_water_ml INTEGER DEFAULT 2500;

CREATE INDEX IF NOT EXISTS idx_users_premium_color ON public.users(premium_color);
CREATE INDEX IF NOT EXISTS idx_users_name_color ON public.users(name_color);

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_current_user_is_pro()
RETURNS BOOLEAN AS $$
  SELECT is_pro FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (role IS NOT DISTINCT FROM public.get_current_user_role())
    AND (is_pro IS NOT DISTINCT FROM public.get_current_user_is_pro())
  );

CREATE OR REPLACE FUNCTION public.set_user_premium_color(p_color TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET premium_color = p_color, name_color = p_color
  WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_user_premium_color(TEXT) TO authenticated;

-- 3. Daily Metrics
CREATE TABLE IF NOT EXISTS public.daily_metrics (
  id              UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID       NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date            DATE       NOT NULL,
  water_ml        INTEGER    DEFAULT 0,
  steps           INTEGER    DEFAULT 0,
  sleep_hours     NUMERIC(4,1),
  neat_level      TEXT,
  exercise_level  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

ALTER TABLE public.daily_metrics ADD COLUMN IF NOT EXISTS active_calories INTEGER DEFAULT 0;
ALTER TABLE public.daily_metrics ADD COLUMN IF NOT EXISTS suggested_water_ml INTEGER DEFAULT 2000;

CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON public.daily_metrics (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_active_cals ON public.daily_metrics (active_calories);

ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_metrics_own" ON public.daily_metrics;
DROP POLICY IF EXISTS "daily_metrics_own_all" ON public.daily_metrics;
CREATE POLICY "daily_metrics_own_all" ON public.daily_metrics FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.upsert_daily_metrics(
  p_date DATE,
  p_water_ml INTEGER DEFAULT 0,
  p_steps INTEGER DEFAULT 0,
  p_sleep_hours NUMERIC DEFAULT 0,
  p_neat_level TEXT DEFAULT NULL,
  p_exercise_level TEXT DEFAULT NULL,
  p_active_calories INTEGER DEFAULT 0,
  p_suggested_water_ml INTEGER DEFAULT 2500
)
RETURNS public.daily_metrics
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result public.daily_metrics;
BEGIN
  INSERT INTO public.daily_metrics (
    user_id, date, water_ml, steps, sleep_hours, neat_level, exercise_level, active_calories, suggested_water_ml, updated_at
  )
  VALUES (
    auth.uid(), p_date, COALESCE(p_water_ml, 0), COALESCE(p_steps, 0), p_sleep_hours, p_neat_level, p_exercise_level,
    COALESCE(p_active_calories, 0), COALESCE(p_suggested_water_ml, 2500), NOW()
  )
  ON CONFLICT (user_id, date) DO UPDATE
  SET
    water_ml = EXCLUDED.water_ml,
    steps = EXCLUDED.steps,
    sleep_hours = EXCLUDED.sleep_hours,
    neat_level = EXCLUDED.neat_level,
    exercise_level = EXCLUDED.exercise_level,
    active_calories = EXCLUDED.active_calories,
    suggested_water_ml = EXCLUDED.suggested_water_ml,
    updated_at = NOW()
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_daily_metrics(DATE, INTEGER, INTEGER, NUMERIC, TEXT, TEXT, INTEGER, INTEGER) TO authenticated;

-- 4. Storage Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('social', 'social', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Social Bucket Public Select') THEN
    CREATE POLICY "Social Bucket Public Select" ON storage.objects FOR SELECT USING (bucket_id = 'social');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Social Bucket Authenticated Insert') THEN
    CREATE POLICY "Social Bucket Authenticated Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'social' AND auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Social Bucket Authenticated Update') THEN
    CREATE POLICY "Social Bucket Authenticated Update" ON storage.objects FOR UPDATE USING (bucket_id = 'social' AND auth.uid() = owner);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Social Bucket Authenticated Delete') THEN
    CREATE POLICY "Social Bucket Authenticated Delete" ON storage.objects FOR DELETE USING (bucket_id = 'social' AND auth.uid() = owner);
  END IF;
END $$;

COMMIT;
