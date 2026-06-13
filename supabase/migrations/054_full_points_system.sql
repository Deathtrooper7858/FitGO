-- ═══════════════════════════════════════════════════════════════════════════════
-- 054: FULL POINTS SYSTEM MIGRATION (with exact per-achievement-tier points)
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- POINT VALUES (matches TIER_POINTS in useAchievements.ts and leagueStore.ts):
--   food_logs:           +10 per log
--   activity_logs:       +50 per log
--   challenge completed: +100 per challenge
--   achievements:
--     bronce:            +10 per achievement
--     plata:             +25 per achievement
--     oro:               +50 per achievement
--     diamante:          +100 per achievement
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── STEP 1: Achievement tier lookup table ────────────────────────────────────
-- Maps every achievement ID to its exact point value based on tier.
-- Matches exactly what is shown in the "Sistema de Logros" modal.

CREATE OR REPLACE FUNCTION get_achievement_points(achievement_id text)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE achievement_id
    -- ── BRONCE (+10 pts) ──────────────────────────────────────────────
    WHEN 'welcome'            THEN 10
    WHEN 'dark_mode_lover'    THEN 10
    WHEN 'streak_3'           THEN 10
    WHEN 'first_log'          THEN 10
    WHEN 'water_habit'        THEN 10
    WHEN 'photo_pioneer'      THEN 10
    WHEN 'rest_day_respect'   THEN 10
    WHEN 'social_star'        THEN 10
    WHEN 'ghost_mode'         THEN 10
    WHEN 'profile_stalker'    THEN 10
    WHEN 'fast_logger'        THEN 10
    WHEN 'first_like'         THEN 10
    WHEN 'smoothie_lover'     THEN 10
    WHEN 'sleep_master'       THEN 10
    WHEN 'chef_kiss'          THEN 10
    WHEN 'protein_pancake'    THEN 10
    WHEN 'first_comment'      THEN 10

    -- ── PLATA (+25 pts) ───────────────────────────────────────────────
    WHEN 'premium_club'           THEN 25
    WHEN 'profile_complete'       THEN 25
    WHEN 'streak_7'               THEN 25
    WHEN 'early_bird'             THEN 25
    WHEN 'protein_goal'           THEN 25
    WHEN 'healthy_eater'          THEN 25
    WHEN 'water_champion'         THEN 25
    WHEN 'hydration_streak_7'     THEN 25
    WHEN 'carnival_eater'         THEN 25
    WHEN 'late_snack'             THEN 25
    WHEN 'body_sculptor'          THEN 25
    WHEN 'step_master'            THEN 25
    WHEN 'sleep_champion'         THEN 25
    WHEN 'social_influence'       THEN 25
    WHEN 'bug_hunter'             THEN 25
    WHEN 'night_owl'              THEN 25
    WHEN 'iron_lungs'             THEN 25
    WHEN 'leg_day_survivor'       THEN 25
    WHEN 'bike_rider'             THEN 25
    WHEN 'weight_loss_5'          THEN 25
    WHEN 'scale_fearless'         THEN 25
    WHEN 'bmi_normal'             THEN 25
    WHEN 'biceps_pump'            THEN 25
    WHEN 'helper'                 THEN 25
    WHEN 'like_bomber'            THEN 25
    WHEN 'chatty'                 THEN 25
    WHEN 'time_traveler'          THEN 25
    WHEN 'five_meals'             THEN 25
    WHEN 'data_nerd'              THEN 25
    WHEN 'three_workouts_week'    THEN 25
    WHEN 'coffee_addict'          THEN 25

    -- ── ORO (+50 pts) ─────────────────────────────────────────────────
    WHEN 'streak_30'          THEN 50
    WHEN 'perfect_macros'     THEN 50
    WHEN 'water_god'          THEN 50
    WHEN 'diet_expert'        THEN 50
    WHEN 'goal_reached'       THEN 50
    WHEN 'workout_warrior'    THEN 50
    WHEN 'sleep_god'          THEN 50
    WHEN 'friend_magnet'      THEN 50
    WHEN 'beta_tester'        THEN 50
    WHEN 'zen_mode'           THEN 50
    WHEN 'mountain_climber'   THEN 50
    WHEN 'ten_workouts'       THEN 50
    WHEN 'balanced_day'       THEN 50
    WHEN 'vegan_day'          THEN 50
    WHEN 'fasting_monk'       THEN 50
    WHEN 'sweet_tooth'        THEN 50
    WHEN 'cardio_bunny'       THEN 50
    WHEN 'yoga_streak'        THEN 50
    WHEN 'early_lifter'       THEN 50
    WHEN 'waist_shredder'     THEN 50
    WHEN 'squad_creator'      THEN 50
    WHEN 'easter_egg_hunter'  THEN 50
    WHEN 'first_compliment'   THEN 50

    -- ── DIAMANTE (+100 pts) ───────────────────────────────────────────
    WHEN 'streak_100'           THEN 100
    WHEN 'streak_365'           THEN 100
    WHEN 'streak_500'           THEN 100
    WHEN 'streak_1000'          THEN 100
    WHEN 'water_ocean'          THEN 100
    WHEN 'perfect_week_macros'  THEN 100
    WHEN 'carnivore'            THEN 100
    WHEN 'weight_loss_10'       THEN 100
    WHEN 'muscle_gain_10'       THEN 100
    WHEN 'step_half_marathon'   THEN 100
    WHEN 'workout_machine'      THEN 100
    WHEN 'community_pillar'     THEN 100
    WHEN 'developer_god'        THEN 100
    WHEN 'the_owner'            THEN 100
    WHEN 'heavy_lifter'         THEN 100
    WHEN 'flash_speed'          THEN 100
    WHEN '100k_steps_week'      THEN 100
    WHEN 'body_fat_15'          THEN 100
    WHEN 'spartan_300'          THEN 100
    WHEN 'kryptonian'           THEN 100
    WHEN 'goggins_mode'         THEN 100
    WHEN 'body_alchemist'       THEN 100
    WHEN 'mr_olympia'           THEN 100
    WHEN 'the_one_percent'      THEN 100
    WHEN 'iron_monk'            THEN 100
    WHEN 'immortal'             THEN 100
    WHEN 'perfect_machine'      THEN 100
    WHEN 'triceratops'          THEN 100
    WHEN 'supernova'            THEN 100
    WHEN 'god_of_war'           THEN 100
    WHEN 'holy_grail'           THEN 100
    WHEN 'matrix_glitch'        THEN 100
    WHEN 'viral_post'           THEN 100
    WHEN 'squad_champion'       THEN 100
    WHEN 'trend_setter'         THEN 100
    WHEN 'fifty_workouts'       THEN 100
    WHEN 'fitgo_veteran'        THEN 100
    WHEN 'muscle_gai_10'        THEN 100
    WHEN 'weight_loss_5_extra'  THEN 100
    WHEN 'step_marathon'        THEN 50  -- oro
    ELSE 10  -- default: bronce for any unknown/new achievement
  END;
END;
$$;


-- ── STEP 2: Full point-calculation function ──────────────────────────────────
-- Calculates the total ground-truth points for a single user.

CREATE OR REPLACE FUNCTION compute_user_league_points(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pts           integer := 0;
  food_pts      integer := 0;
  activity_pts  integer := 0;
  challenge_pts integer := 0;
  achievement_pts integer := 0;
  u_row         RECORD;
  ach_id        text;
BEGIN
  -- Points from food logs: 10 pts each
  SELECT COALESCE(COUNT(*) * 10, 0) INTO food_pts
  FROM public.food_logs
  WHERE user_id = p_user_id;

  -- Points from activity logs: 50 pts each
  SELECT COALESCE(COUNT(*) * 50, 0) INTO activity_pts
  FROM public.activity_logs
  WHERE user_id = p_user_id;

  -- Points from completed challenges (as creator): 100 pts each
  SELECT COALESCE(COUNT(*) * 100, 0) INTO challenge_pts
  FROM public.challenges
  WHERE creator_id = p_user_id AND status = 'completed';

  -- Points from completed challenges (as participant, not creator): 100 pts each
  SELECT challenge_pts + COALESCE(COUNT(*) * 100, 0) INTO challenge_pts
  FROM public.challenge_participants cp
  JOIN public.challenges c ON c.id = cp.challenge_id
  WHERE cp.user_id = p_user_id
    AND cp.status IN ('completed', 'accepted')
    AND c.status = 'completed'
    AND c.creator_id != p_user_id;

  -- Points from achievements: exact value per tier using get_achievement_points()
  SELECT id, unlocked_achievements INTO u_row
  FROM public.users WHERE id = p_user_id;

  IF u_row.unlocked_achievements IS NOT NULL THEN
    FOREACH ach_id IN ARRAY u_row.unlocked_achievements
    LOOP
      achievement_pts := achievement_pts + get_achievement_points(ach_id);
    END LOOP;
  END IF;

  pts := food_pts + activity_pts + challenge_pts + achievement_pts;
  RETURN GREATEST(pts, 0);
END;
$$;


-- ── STEP 3: BACKFILL all existing users ─────────────────────────────────────
-- GREATEST ensures we never lower points (only raise them).

UPDATE public.users u
SET league_points = GREATEST(
  COALESCE(u.league_points, 0),
  compute_user_league_points(u.id)
)
WHERE u.name IS NOT NULL;


-- ── STEP 4: Trigger — food log insert → +10 pts ──────────────────────────────

CREATE OR REPLACE FUNCTION trg_award_points_on_food_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET league_points = COALESCE(league_points, 0) + 10
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_food_log_points ON public.food_logs;
CREATE TRIGGER trg_food_log_points
  AFTER INSERT ON public.food_logs
  FOR EACH ROW
  EXECUTE FUNCTION trg_award_points_on_food_log();


-- ── STEP 5: Trigger — activity log insert → +50 pts ──────────────────────────

CREATE OR REPLACE FUNCTION trg_award_points_on_activity_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET league_points = COALESCE(league_points, 0) + 50
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_activity_log_points ON public.activity_logs;
CREATE TRIGGER trg_activity_log_points
  AFTER INSERT ON public.activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION trg_award_points_on_activity_log();


-- ── STEP 6: Trigger — challenge completed → +100 pts ─────────────────────────

CREATE OR REPLACE FUNCTION trg_award_points_on_challenge_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    UPDATE public.users
    SET league_points = COALESCE(league_points, 0) + 100
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_challenge_complete_points ON public.challenge_participants;
CREATE TRIGGER trg_challenge_complete_points
  AFTER UPDATE ON public.challenge_participants
  FOR EACH ROW
  EXECUTE FUNCTION trg_award_points_on_challenge_complete();


-- ── STEP 7: Trigger — achievement unlocked → exact tier pts ──────────────────
-- Compares old vs new arrays, awards points for each new achievement using
-- its exact tier value (Bronce=10, Plata=25, Oro=50, Diamante=100).

CREATE OR REPLACE FUNCTION trg_award_points_on_achievement_unlock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ach_id        text;
  new_pts       integer := 0;
  new_achievements text[];
BEGIN
  -- Find achievements that are in NEW but not in OLD
  IF NEW.unlocked_achievements IS NOT NULL THEN
    IF OLD.unlocked_achievements IS NULL THEN
      new_achievements := NEW.unlocked_achievements;
    ELSE
      SELECT array_agg(x) INTO new_achievements
      FROM unnest(NEW.unlocked_achievements) x
      WHERE x <> ALL(OLD.unlocked_achievements);
    END IF;
  END IF;

  IF new_achievements IS NOT NULL THEN
    FOREACH ach_id IN ARRAY new_achievements
    LOOP
      new_pts := new_pts + get_achievement_points(ach_id);
    END LOOP;
  END IF;

  IF new_pts > 0 THEN
    UPDATE public.users
    SET league_points = COALESCE(league_points, 0) + new_pts
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_achievement_unlock_points ON public.users;
CREATE TRIGGER trg_achievement_unlock_points
  AFTER UPDATE OF unlocked_achievements ON public.users
  FOR EACH ROW
  WHEN (NEW.unlocked_achievements IS DISTINCT FROM OLD.unlocked_achievements)
  EXECUTE FUNCTION trg_award_points_on_achievement_unlock();


-- ── STEP 8: Update get_global_ranking to use stored league_points (fast O(1)) ──

CREATE OR REPLACE FUNCTION get_global_ranking(limit_val int DEFAULT 50)
RETURNS TABLE(id uuid, name text, avatar_url text, points numeric, name_color text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.name,
    u.avatar_url,
    u.league_points::numeric AS points,
    CASE
      WHEN u.is_pro AND (u.name_color IS NULL OR u.name_color = '') THEN '#EAB308'
      ELSE u.name_color
    END AS name_color
  FROM public.users u
  WHERE u.name IS NOT NULL
  ORDER BY u.league_points DESC NULLS LAST
  LIMIT limit_val;
END;
$$;

-- ── VERIFICATION (run after to confirm) ──────────────────────────────────────
-- SELECT name, league_points FROM public.users WHERE name IS NOT NULL ORDER BY league_points DESC LIMIT 20;
