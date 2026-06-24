-- ─── 050: Upgrade Ligas to 10-Tier System ────────────────────────────────────
-- Migrates old 5-tier system to new 10-tier system.

-- 1. Drop the existing constraint so we can modify the data without errors
ALTER TABLE public.squads DROP CONSTRAINT IF EXISTS squads_league_tier_check;

-- 2. Change the default value to 'bronce' (formerly 'carbono')
ALTER TABLE public.squads ALTER COLUMN league_tier SET DEFAULT 'bronce';

-- 3. Migrate existing squads from old tiers to new tiers
UPDATE public.squads SET league_tier = 'bronce'    WHERE league_tier = 'carbono';
UPDATE public.squads SET league_tier = 'oro'       WHERE league_tier = 'neon';
UPDATE public.squads SET league_tier = 'platino'   WHERE league_tier = 'titanio';
UPDATE public.squads SET league_tier = 'diamante'  WHERE league_tier = 'cuarzo';
UPDATE public.squads SET league_tier = 'maestro'   WHERE league_tier = 'zenit';

-- 4. Now that data is clean, add the new constraint
ALTER TABLE public.squads ADD CONSTRAINT squads_league_tier_check 
  CHECK (league_tier IN ('bronce', 'plata', 'oro', 'platino', 'esmeralda', 'diamante', 'maestro', 'leyenda', 'titan', 'celestial'));

-- 5. Update the recalculate_league_tier function with the new 10 tiers
CREATE OR REPLACE FUNCTION recalculate_league_tier(p_squad_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_points integer;
  v_tier   text;
BEGIN
  SELECT points INTO v_points FROM public.squads WHERE id = p_squad_id;
  IF    v_points >= 15000 THEN v_tier := 'celestial';
  ELSIF v_points >= 10000 THEN v_tier := 'titan';
  ELSIF v_points >= 7500  THEN v_tier := 'leyenda';
  ELSIF v_points >= 5000  THEN v_tier := 'maestro';
  ELSIF v_points >= 3500  THEN v_tier := 'diamante';
  ELSIF v_points >= 2000  THEN v_tier := 'esmeralda';
  ELSIF v_points >= 1000  THEN v_tier := 'platino';
  ELSIF v_points >= 500   THEN v_tier := 'oro';
  ELSIF v_points >= 200   THEN v_tier := 'plata';
  ELSE                         v_tier := 'bronce';
  END IF;
  UPDATE public.squads SET league_tier = v_tier WHERE id = p_squad_id;
END;
$$;

-- 6. Recalculate all existing squads to their new correct tier
DO $$
DECLARE
  squad_row RECORD;
BEGIN
  FOR squad_row IN SELECT id FROM public.squads LOOP
    PERFORM recalculate_league_tier(squad_row.id);
  END LOOP;
END;
$$;
