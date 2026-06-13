-- ═══════════════════════════════════════════════════════════════════════════════
-- 055: SEPARATE SQUAD POINTS FROM LEAGUE POINTS
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- The user requested that SQUAD points DO NOT include points given by achievements,
-- so that squad totals are not overly inflated.
-- However, individual `league_points` will still include achievements.
--
-- Solution:
-- 1. Add `squad_points` column to `users`.
-- 2. Backfill `squad_points` (food logs + activity logs + challenges ONLY).
-- 3. Update the insertion triggers to increment BOTH `league_points` and `squad_points`,
--    EXCEPT for the achievement trigger which will only increment `league_points`.
-- 4. Update squad synchronization logic to sum `squad_points` instead.

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS squad_points integer DEFAULT 0;

-- ── STEP 1: Backfill function for squad_points ───────────────────────────────
CREATE OR REPLACE FUNCTION compute_user_squad_points(p_user_id uuid)
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

    pts := food_pts + activity_pts + challenge_pts;
    RETURN GREATEST(pts, 0);
  END;
  $$;

-- Backfill all users
UPDATE public.users u
SET
    squad_points = compute_user_squad_points (u.id)
WHERE
    u.name IS NOT NULL;

-- ── STEP 2: Update Insertion Triggers ────────────────────────────────────────

-- Food logs (Update BOTH)
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
      squad_points = COALESCE(squad_points, 0) + v_pts
    WHERE id = NEW.user_id;
    RETURN NEW;
  END;
  $$;

-- Activity logs (Update BOTH)
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
      squad_points = COALESCE(squad_points, 0) + v_pts
    WHERE id = NEW.user_id;
    RETURN NEW;
  END;
  $$;

-- Challenges (Update BOTH)
CREATE OR REPLACE FUNCTION trg_award_points_on_challenge_complete()
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
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
      SELECT COALESCE(current_streak, 0) INTO v_streak
      FROM public.users WHERE id = NEW.user_id;

      v_mult := get_streak_multiplier(v_streak);
      v_pts  := GREATEST(ROUND(100 * v_mult), 1);

      UPDATE public.users
      SET 
        league_points = COALESCE(league_points, 0) + v_pts,
        squad_points = COALESCE(squad_points, 0) + v_pts
      WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
  END;
  $$;

-- Note: The achievement trigger (trg_award_points_on_achievement_unlock) in 054
-- is left AS IS. It will only update league_points, leaving squad_points untouched.

-- ── STEP 3: Update Squad Synchronization ─────────────────────────────────────

-- Modify sync_squad_points to sum squad_points instead of league_points
CREATE OR REPLACE FUNCTION sync_squad_points(p_squad_id uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
  BEGIN
    UPDATE public.squads
    SET points = COALESCE((
      SELECT SUM(u.squad_points)
      FROM public.users u
      INNER JOIN public.squad_members sm ON sm.user_id = u.id
      WHERE sm.squad_id = p_squad_id
    ), 0)
    WHERE id = p_squad_id;
  END;
  $$;

-- Update trigger to listen to squad_points changes
DROP TRIGGER IF EXISTS sync_squad_on_user_points ON public.users;

CREATE TRIGGER sync_squad_on_user_points
    AFTER INSERT OR UPDATE OF squad_points ON public.users
    FOR EACH ROW EXECUTE PROCEDURE trg_sync_squad_on_user_points();

-- Backfill squads
UPDATE public.squads s
SET
    points = COALESCE(
        (
            SELECT SUM(u.squad_points)
            FROM public.users u
                INNER JOIN public.squad_members sm ON sm.user_id = u.id
            WHERE
                sm.squad_id = s.id
        ),
        0
    );

-- Update get_top_squads_with_live_points
CREATE OR REPLACE FUNCTION get_top_squads_with_live_points(p_limit integer DEFAULT 10)
  RETURNS TABLE (
    id            uuid,
    name          text,
    league_tier   text,
    invite_code   text,
    created_by    uuid,
    points        bigint
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
  BEGIN
    RETURN QUERY
    SELECT
      s.id,
      s.name,
      s.league_tier::text,
      s.invite_code,
      s.created_by,
      COALESCE(SUM(u.squad_points), 0)::bigint AS points
    FROM public.squads s
    LEFT JOIN public.squad_members sm ON sm.squad_id = s.id
    LEFT JOIN public.users u ON u.id = sm.user_id
    GROUP BY s.id, s.name, s.league_tier, s.invite_code, s.created_by
    ORDER BY points DESC
    LIMIT p_limit;
  END;
  $$;