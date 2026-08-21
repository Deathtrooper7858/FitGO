-- Migration 068: Add audio_url to posts

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS audio_url TEXT;
