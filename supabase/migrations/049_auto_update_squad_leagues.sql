-- 049_auto_update_squad_leagues.sql
-- Update sync_squad_points to also trigger league recalculation

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

  -- Also recalculate league tier based on new points
  PERFORM recalculate_league_tier(p_squad_id);
END;
$$;

-- Backfill all squads to correct league
DO $$
DECLARE
  s record;
BEGIN
  FOR s IN SELECT id FROM public.squads LOOP
    PERFORM recalculate_league_tier(s.id);
  END LOOP;
END;
$$;
