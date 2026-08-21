-- 1. Add expo_push_token column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- 2. Add push notifications preferences column if desired (optional)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"push_enabled": true, "meal_reminders": true, "social": true}'::jsonb;
