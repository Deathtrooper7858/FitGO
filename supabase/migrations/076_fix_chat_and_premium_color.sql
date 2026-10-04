-- ==============================================================================
-- Migration 076: Solución Definitiva para Chats, Mensajes Directos y Color Premium
-- ==============================================================================

BEGIN;

-- 1. Asegurar tabla direct_messages con todas sus columnas y tipos requeridos
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

-- Asegurar que las columnas existen si la tabla fue creada previamente
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT '';
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;

-- 2. Índices de alto rendimiento para direct_messages
CREATE INDEX IF NOT EXISTS idx_direct_messages_participants 
ON public.direct_messages(sender_id, receiver_id);

CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver_read 
ON public.direct_messages(receiver_id, is_read);

CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at 
ON public.direct_messages(created_at DESC);

-- 3. Habilitar RLS en direct_messages
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para direct_messages (limpias y seguras)
DROP POLICY IF EXISTS "Users can view their own direct messages" ON public.direct_messages;
CREATE POLICY "Users can view their own direct messages" 
ON public.direct_messages 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send direct messages" ON public.direct_messages;
CREATE POLICY "Users can send direct messages" 
ON public.direct_messages 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can mark received messages as read" ON public.direct_messages;
CREATE POLICY "Users can mark received messages as read" 
ON public.direct_messages 
FOR UPDATE 
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can delete their own direct messages" ON public.direct_messages;
CREATE POLICY "Users can delete their own direct messages" 
ON public.direct_messages 
FOR DELETE 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 5. Configurar Realtime con Replica Identity Full para direct_messages
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

-- 6. Asegurar columnas de Color Premium en tabla users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS premium_color TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name_color TEXT;

CREATE INDEX IF NOT EXISTS idx_users_premium_color ON public.users(premium_color);
CREATE INDEX IF NOT EXISTS idx_users_name_color ON public.users(name_color);

-- 7. Funciones auxiliares para verificar rol y pro de forma segura (necesarias para la política RLS)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_current_user_is_pro()
RETURNS BOOLEAN AS $$
  SELECT is_pro FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 8. Corregir política RLS users_update_own para evitar bloqueos por valores NULL
-- (En Postgres, "col = func()" evalúa a UNKNOWN cuando col o func() es NULL, bloqueando updates legítimos)
DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (role IS NOT DISTINCT FROM public.get_current_user_role())
    AND (is_pro IS NOT DISTINCT FROM public.get_current_user_is_pro())
  );

-- 9. Función RPC para actualizar color premium de forma segura e inmediata (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.set_user_premium_color(p_color TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET 
    premium_color = p_color,
    name_color = p_color
  WHERE id = auth.uid();
END;
$$;

-- Permitir ejecutar la función a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.set_user_premium_color(TEXT) TO authenticated;

-- 10. Asegurar bucket de almacenamiento 'social' para fotos/videos de chat
INSERT INTO storage.buckets (id, name, public) 
VALUES ('social', 'social', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
  -- Política de lectura pública del bucket social
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Social Bucket Public Select') THEN
    CREATE POLICY "Social Bucket Public Select" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'social');
  END IF;

  -- Política de subida para usuarios autenticados
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Social Bucket Authenticated Insert') THEN
    CREATE POLICY "Social Bucket Authenticated Insert" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'social' AND auth.role() = 'authenticated');
  END IF;

  -- Política de actualización para dueños
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Social Bucket Authenticated Update') THEN
    CREATE POLICY "Social Bucket Authenticated Update" 
    ON storage.objects FOR UPDATE 
    USING (bucket_id = 'social' AND auth.uid() = owner);
  END IF;

  -- Política de eliminación para dueños
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Social Bucket Authenticated Delete') THEN
    CREATE POLICY "Social Bucket Authenticated Delete" 
    ON storage.objects FOR DELETE 
    USING (bucket_id = 'social' AND auth.uid() = owner);
  END IF;
END $$;

COMMIT;
