-- Migration: Add name_color to users table
-- Description: Allows premium users to select a custom color for their name in the social feed

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS name_color TEXT DEFAULT NULL;

-- Also add to profiles view if applicable, or ensure it's accessible
-- (Assuming profiles is either a view or the main table is users)
