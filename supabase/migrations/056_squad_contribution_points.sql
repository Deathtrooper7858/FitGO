-- ═══════════════════════════════════════════════════════════════════════════════
-- 056: SQUAD CONTRIBUTION POINTS
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- This migration separates squad points so they accumulate ONLY from the moment 
-- a user joins a squad. If they leave, their contribution is lost to the squad.
--
-- Steps:
-- 1. Add `contributed_points` to `squad_members`.
-- 2. Modify `users.squad_points` trigger to compute delta and add it to `squad_members`.
-- 3. Modify `sync_squad_points` to sum `contributed_points` from `squad_members`.
-- 4. Add triggers on `squad_members` to auto-sync squad points on insert/update/delete.
-- 5. Backfill existing members based on `joined_at`.
-- 6. Update Leaderboard RPCs.

-- ── 1. Add column ────────────────────────────────────────────────────────────
ALTER TABLE public.squad_members
ADD COLUMN IF NOT EXISTS contributed_points integer DEFAULT 0;

-- ── 2. Trigger on users for delta ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION trg_update_squad_member_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_delta integer;
BEGIN
  v_delta := COALESCE(NEW.squad_points, 0) - COALESCE(OLD.squad_points, 0);
  IF v_delta > 0 THEN
    UPDATE public.squad_members
    SET contributed_points = contributed_points + v_delta
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_squad_member_points ON public.users;
CREATE TRIGGER update_squad_member_points
  AFTER UPDATE OF squad_points ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION trg_update_squad_member_points();

-- ── 3. Modify sync_squad_points to use contributed_points ────────────────────
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

-- ── 4. Trigger on squad_members to auto-sync ─────────────────────────────────
CREATE OR REPLACE FUNCTION trg_sync_squad_on_member_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM sync_squad_points(OLD.squad_id);
    PERFORM recalculate_league_tier(OLD.squad_id);
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM sync_squad_points(NEW.squad_id);
    PERFORM recalculate_league_tier(NEW.squad_id);
  ELSE
    PERFORM sync_squad_points(NEW.squad_id);
    PERFORM recalculate_league_tier(NEW.squad_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS sync_squad_on_member_change ON public.squad_members;
CREATE TRIGGER sync_squad_on_member_change
  AFTER INSERT OR UPDATE OF contributed_points OR DELETE
  ON public.squad_members
  FOR EACH ROW
  EXECUTE FUNCTION trg_sync_squad_on_member_change();

-- Note: In 055 we had sync_squad_on_user_points ON public.users. We MUST remove it.
DROP TRIGGER IF EXISTS sync_squad_on_user_points ON public.users;
DROP FUNCTION IF EXISTS trg_sync_squad_on_user_points();


-- ── 5. Backfill existing members ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION backfill_squad_member_points(p_user_id uuid, p_joined_at timestamp with time zone)
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
  SELECT COALESCE(COUNT(*) * 10, 0) INTO food_pts
  FROM public.food_logs
  WHERE user_id = p_user_id AND logged_at >= p_joined_at::date;

  SELECT COALESCE(COUNT(*) * 50, 0) INTO activity_pts
  FROM public.activity_logs
  WHERE user_id = p_user_id AND logged_at >= p_joined_at::date;

  SELECT COALESCE(COUNT(*) * 100, 0) INTO challenge_pts
  FROM public.challenges
  WHERE creator_id = p_user_id AND status = 'completed' AND created_at >= p_joined_at;

  SELECT challenge_pts + COALESCE(COUNT(*) * 100, 0) INTO challenge_pts
  FROM public.challenge_participants cp
  JOIN public.challenges c ON c.id = cp.challenge_id
  WHERE cp.user_id = p_user_id
    AND cp.status IN ('completed', 'accepted')
    AND c.status = 'completed'
    AND c.creator_id != p_user_id
    AND c.created_at >= p_joined_at;

  pts := food_pts + activity_pts + challenge_pts;
  RETURN GREATEST(pts, 0);
END;
$$;

-- Run backfill for squad_members
UPDATE public.squad_members sm
SET contributed_points = backfill_squad_member_points(sm.user_id, sm.joined_at);

-- Clean up helper function
DROP FUNCTION IF EXISTS backfill_squad_member_points;

-- Re-sync all squads with their new true points
UPDATE public.squads s
SET points = COALESCE((
  SELECT SUM(sm.contributed_points)
  FROM public.squad_members sm
  WHERE sm.squad_id = s.id
), 0);

-- Recalculate league tier for all squads
DO $$
DECLARE
  squad_row RECORD;
BEGIN
  FOR squad_row IN SELECT id FROM public.squads
  LOOP
    PERFORM recalculate_league_tier(squad_row.id);
  END LOOP;
END $$;


-- ── 6. Update RPCs ───────────────────────────────────────────────────────────

-- get_squad_leaderboard now returns contributed_points as league_points 
-- (to maintain frontend interface, but show actual squad contribution)
CREATE OR REPLACE FUNCTION get_squad_leaderboard(p_squad_id uuid)
RETURNS TABLE(
  user_id        uuid,
  name           text,
  avatar_url     text,
  league_points  integer,
  current_streak integer,
  name_color     text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.avatar_url, sm.contributed_points AS league_points, u.current_streak,
         CASE WHEN u.is_pro AND (u.name_color IS NULL OR u.name_color = '') THEN '#EAB308' ELSE u.name_color END as name_color
  FROM public.users u
  INNER JOIN public.squad_members sm ON sm.user_id = u.id
  WHERE sm.squad_id = p_squad_id
  ORDER BY sm.contributed_points DESC;
END;
$$;

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
    s.points::bigint AS points
  FROM public.squads s
  ORDER BY s.points DESC
  LIMIT p_limit;
END;
$$;
