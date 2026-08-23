-- schema_dump.sql — Full schema reference for FitGO
-- This file documents the complete database schema across all migrations.
-- Generated for reference. Apply migrations from supabase/migrations/ instead.

-- ─── Core Tables ─────────────────────────────────────────────────────────
-- users: Central user profiles with auth, health, and gamification fields
-- foods: Cached food items from OpenFoodFacts / Edamam APIs
-- food_logs: User food consumption records
-- body_measurements: Weight, body fat, and body part measurements
-- meal_plans: AI-generated meal plans
-- meal_plan_items: Individual meals within a plan
-- coach_conversations: AI chat sessions
-- user_subscriptions: Purchase/subscription records
-- progress_photos: User physique progress images
-- recipes: Food recipes (system + user-contributed)

-- ─── Activity & Metrics ──────────────────────────────────────────────────
-- activity_logs: Exercise/activity records
-- daily_metrics: Aggregated daily nutrition, water, steps, sleep
-- coach_sessions: AI coach conversation groupings

-- ─── Fitness Plans ───────────────────────────────────────────────────────
-- workout_plans: Weekly workout plans
-- workout_plan_items: Individual workout days/routines

-- ─── Social Features ────────────────────────────────────────────────────
-- posts: Social feed posts with text + images
-- post_likes: Post likes (user + post)
-- post_comments: Post comments
-- friends: Friend connections with status
-- challenges: User-created fitness challenges
-- challenge_participants: Challenge membership & progress
-- direct_messages: Private messaging between users

-- ─── Competitive / Gamification ──────────────────────────────────────────
-- squads: Teams of up to 5 users
-- squad_members: Squad membership with contribution tracking
-- league_point_logs: Audit trail for point changes

-- ─── Storage Buckets ────────────────────────────────────────────────────
-- social: Post images, chat media
-- progress-photos: User physique photos
-- avatars: Profile pictures

-- For full schema details, see supabase/migrations/001 through 067
