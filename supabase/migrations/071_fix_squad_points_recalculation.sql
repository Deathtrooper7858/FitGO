-- 071_fix_squad_points_recalculation.sql
-- Fixes an issue introduced in migration 063 where squads.points was incorrectly 
-- updated using SUM(u.league_points) (lifetime points) instead of 
-- SUM(sm.contributed_points) (points earned while in the squad).

DO $$
DECLARE
  squad_row RECORD;
BEGIN
  -- Re-sync all squads with their true contributed points
  UPDATE public.squads s
  SET points = COALESCE((
    SELECT SUM(sm.contributed_points)
    FROM public.squad_members sm
    WHERE sm.squad_id = s.id
  ), 0);

  -- Recalculate league tier for all squads
  FOR squad_row IN SELECT id FROM public.squads
  LOOP
    PERFORM recalculate_league_tier(squad_row.id);
  END LOOP;
END $$;
