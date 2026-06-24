-- ==============================================================================
-- 065: FIX SQUAD POINTS — USE contributed_points INSTEAD OF league_points
-- ==============================================================================
-- Problem: Migration 063 set squads.points = SUM(u.league_points), which
-- includes ALL historical points of each member (achievements, full history
-- with streak multipliers). This creates a huge discrepancy between what each
-- member shows individually (contributed_points since joining) and the squad total.
--
-- Fix:
--   1. Restore sync_squad_points to sum sm.contributed_points (correct behavior).
--   2. Recalculate squad_members.contributed_points from activity SINCE joining.
--   3. Re-sync all squad totals using contributed_points.
--   4. Recalculate league tiers.
-- ==============================================================================

-- ── 1. Restore sync_squad_points to use contributed_points ───────────────────
CREATE OR REPLACE FUNCTION sync_squad_points(p_squad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.squads
  SET points = COALESCE((
    SELECT SUM(sm.contributed_points)
    FROM public.squad_members sm
    WHERE sm.squad_id = p_squad_id
  ), 0)
  WHERE id = p_squad_id;
END;
$$;

-- ── 2. Recalculate contributed_points for every squad member ─────────────────
-- contributed_points = points earned from food_logs + activity_logs +
--                      challenges SINCE the member joined the squad.
-- We apply NO streak multiplier here (it was not applied historically either
-- in the original backfill from migration 056).

CREATE OR REPLACE FUNCTION recalculate_member_contributions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  food_pts      integer;
  activity_pts  integer;
  challenge_pts integer;
  total_pts     integer;
BEGIN
  FOR r IN
    SELECT sm.user_id, sm.squad_id, sm.joined_at
    FROM public.squad_members sm
  LOOP
    -- Food logs since joining: 10 pts each
    SELECT COALESCE(COUNT(*) * 10, 0) INTO food_pts
    FROM public.food_logs
    WHERE user_id = r.user_id
      AND logged_at >= r.joined_at;

    -- Activity logs since joining: 50 pts each
    SELECT COALESCE(COUNT(*) * 50, 0) INTO activity_pts
    FROM public.activity_logs
    WHERE user_id = r.user_id
      AND logged_at >= r.joined_at;

    -- Challenges completed (as creator) since joining: 100 pts each
    SELECT COALESCE(COUNT(*) * 100, 0) INTO challenge_pts
    FROM public.challenges
    WHERE creator_id = r.user_id
      AND status = 'completed'
      AND created_at >= r.joined_at;

    -- Challenges completed (as participant, not creator) since joining: 100 pts each
    SELECT challenge_pts + COALESCE(COUNT(*) * 100, 0) INTO challenge_pts
    FROM public.challenge_participants cp
    JOIN public.challenges c ON c.id = cp.challenge_id
    WHERE cp.user_id = r.user_id
      AND cp.status IN ('completed', 'accepted')
      AND c.status = 'completed'
      AND c.creator_id != r.user_id
      AND c.created_at >= r.joined_at;

    total_pts := GREATEST(food_pts + activity_pts + challenge_pts, 0);

    UPDATE public.squad_members
    SET contributed_points = total_pts
    WHERE user_id = r.user_id
      AND squad_id = r.squad_id;
  END LOOP;
END;
$$;

-- Run the recalculation
SELECT recalculate_member_contributions();

-- Clean up helper function
DROP FUNCTION IF EXISTS recalculate_member_contributions();

-- ── 3. Re-sync all squad totals from contributed_points ──────────────────────
UPDATE public.squads s
SET points = COALESCE((
  SELECT SUM(sm.contributed_points)
  FROM public.squad_members sm
  WHERE sm.squad_id = s.id
), 0);

-- ── 4. Recalculate league tier for all squads ─────────────────────────────────
DO $$
DECLARE
  squad_row RECORD;
BEGIN
  FOR squad_row IN SELECT id FROM public.squads LOOP
    PERFORM recalculate_league_tier(squad_row.id);
  END LOOP;
END $$;

-- ── 5. Also fix get_top_squads_with_live_points to use stored points ──────────
-- (already uses s.points after migration 056, confirming it's correct)
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
    s.points::bigint AS points
  FROM public.squads s
  ORDER BY s.points DESC
  LIMIT p_limit;
END;
$$;
