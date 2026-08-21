-- ═══════════════════════════════════════════════════════════════════════════════
-- 058: FIX SQUAD POINTS PROPAGATION
-- Problem: food_logs and activity_logs DB triggers update league_points but NOT
-- squad_points, so the squad_members.contributed_points trigger never fires
-- for meal/activity events.
-- Fix: Update both triggers to also increment squad_points when inserting.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. Food log trigger: update league_points AND squad_points ──────────────
CREATE OR REPLACE FUNCTION trg_award_points_on_food_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_streak    integer;
  v_mult      numeric;
  v_pts       integer;
BEGIN
  SELECT COALESCE(current_streak, 0) INTO v_streak
  FROM public.users WHERE id = NEW.user_id;

  v_mult := get_streak_multiplier(v_streak);
  v_pts  := GREATEST(ROUND(10 * v_mult), 1);

  UPDATE public.users
  SET 
    league_points = COALESCE(league_points, 0) + v_pts,
    squad_points  = COALESCE(squad_points, 0)  + v_pts
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$;

-- ── 2. Activity log trigger: update league_points AND squad_points ──────────
CREATE OR REPLACE FUNCTION trg_award_points_on_activity_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_streak    integer;
  v_mult      numeric;
  v_pts       integer;
BEGIN
  SELECT COALESCE(current_streak, 0) INTO v_streak
  FROM public.users WHERE id = NEW.user_id;

  v_mult := get_streak_multiplier(v_streak);
  v_pts  := GREATEST(ROUND(50 * v_mult), 1);

  UPDATE public.users
  SET 
    league_points = COALESCE(league_points, 0) + v_pts,
    squad_points  = COALESCE(squad_points, 0)  + v_pts
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$;

-- Triggers already exist from migration 054 — no need to recreate them.
-- The OR REPLACE above is sufficient to update the function bodies.
