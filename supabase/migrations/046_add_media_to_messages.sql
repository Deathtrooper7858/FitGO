-- Add media URL columns to direct_messages table
ALTER TABLE public.direct_messages
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS audio_url text;