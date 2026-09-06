-- Migration 075: Add language column to users table for account preference persistence
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';
