-- ─── 047: Auto-sync squad points from member league_points ────────────────────
--
-- PROBLEM:
--   squads.points is a static column that gets stale when members earn points,
--   join, or leave a squad. The podium ranking reads this stale value.
--
-- SOLUTION:
--   1. A SECURITY DEFINER function recalculates squad points as the SUM
--      of all current members' league_points.
--   2. Three triggers fire this function automatically:
--        • When a user's league_points changes (INSERT/UPDATE on users).
--        • When a user joins a squad (INSERT on squad_members).
--        • When a user leaves a squad (DELETE on squad_members).
--   3. The function is idempotent and safe to call manually.

-- ── Helper: recalculate and update a single squad's point total ───────────────
CREATE OR REPLACE FUNCTION sync_squad_points(p_squad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.squads
  SET points = COALESCE((
    SELECT SUM(u.league_points)
    FROM public.users u
    INNER JOIN public.squad_members sm ON sm.user_id = u.id
    WHERE sm.squad_id = p_squad_id
  ), 0)
  WHERE id = p_squad_id;
END;
$$;

-- ── Trigger fn: fires when a user's league_points changes ─────────────────────
CREATE OR REPLACE FUNCTION trg_sync_squad_on_user_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_squad_id uuid;
BEGIN
  -- Find which squad this user belongs to (if any)
  SELECT squad_id INTO v_squad_id
  FROM public.squad_members
  WHERE user_id = NEW.id
  LIMIT 1;

  IF v_squad_id IS NOT NULL THEN
    PERFORM sync_squad_points(v_squad_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_squad_on_user_points ON public.users;
CREATE TRIGGER sync_squad_on_user_points
  AFTER INSERT OR UPDATE OF league_points ON public.users
  FOR EACH ROW EXECUTE PROCEDURE trg_sync_squad_on_user_points();

-- ── Trigger fn: fires when a member joins a squad ─────────────────────────────
CREATE OR REPLACE FUNCTION trg_sync_squad_on_member_join()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM sync_squad_points(NEW.squad_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_squad_on_member_join ON public.squad_members;
CREATE TRIGGER sync_squad_on_member_join
  AFTER INSERT ON public.squad_members
  FOR EACH ROW EXECUTE PROCEDURE trg_sync_squad_on_member_join();

-- ── Trigger fn: fires when a member leaves a squad ────────────────────────────
CREATE OR REPLACE FUNCTION trg_sync_squad_on_member_leave()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM sync_squad_points(OLD.squad_id);
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS sync_squad_on_member_leave ON public.squad_members;
CREATE TRIGGER sync_squad_on_member_leave
  AFTER DELETE ON public.squad_members
  FOR EACH ROW EXECUTE PROCEDURE trg_sync_squad_on_member_leave();

-- ── One-time backfill: fix all existing squads ────────────────────────────────
UPDATE public.squads s
SET points = COALESCE((
  SELECT SUM(u.league_points)
  FROM public.users u
  INNER JOIN public.squad_members sm ON sm.user_id = u.id
  WHERE sm.squad_id = s.id
), 0);

-- ── RPC: return top squads with live-calculated points (bypasses RLS) ─────────
-- This is called from the app instead of a direct table query, to avoid the
-- squad_members RLS restriction that only shows your own rows.
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
    COALESCE(SUM(u.league_points), 0)::bigint AS points
  FROM public.squads s
  LEFT JOIN public.squad_members sm ON sm.squad_id = s.id
  LEFT JOIN public.users u ON u.id = sm.user_id
  GROUP BY s.id, s.name, s.league_tier, s.invite_code, s.created_by
  ORDER BY points DESC
  LIMIT p_limit;
END;
$$;

-- ── Done ─────────────────────────────────────────────────────────────────────
-- After this migration:
--   • squads.points is always the SUM of current members' league_points
--   • get_top_squads_with_live_points() returns accurate podium data
--   • Removing a member instantly deducts their points from the squad total
