-- users_dump.sql — Sample user data for development
-- Run in Supabase SQL Editor to populate test users
-- WARNING: Do not run in production

-- Insert sample user profile (requires auth.users entry first)
-- INSERT INTO public.users (id, name, email, sex, age, weight, height, activity_level, goal, tdee, target_calories, macros, onboarding_done, is_pro, role)
-- VALUES (
--   'REPLACE_WITH_AUTH_USER_ID',
--   'Test User',
--   'test@example.com',
--   'male', 30, 80, 180, 'moderate', 'lose',
--   2500, 2000,
--   '{"protein": 150, "carbs": 250, "fat": 55}',
--   true, false, 'user'
-- );

-- For development, create users via the app signup flow,
-- then use the Supabase Dashboard to inspect/manage records.
