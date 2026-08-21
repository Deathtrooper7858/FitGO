-- Add premium_color to users table to separate it from name_color
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS premium_color TEXT;
