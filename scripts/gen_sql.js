const f = require('fs');
const content = f.readFileSync('hooks/useAchievements.ts', 'utf-8');
const matches = [...content.matchAll(/id:\s*'([^']+)',.*?tier:\s*'([^']+)'/g)];
const tiers = {bronce:10, plata:25, oro:50, diamante:100};
let sql = `CREATE OR REPLACE FUNCTION get_achievement_points(achievement_id text)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE achievement_id\n`;
matches.forEach(m => {
  sql += `    WHEN '${m[1]}' THEN ${tiers[m[2]]}\n`;
});
sql += `    ELSE 10
  END;
END;
$$;

-- Recalculate points for all users
UPDATE public.users u
SET league_points = compute_user_league_points(u.id)
WHERE u.name IS NOT NULL;

UPDATE public.squads s
SET points = (
  SELECT COALESCE(SUM(u.league_points), 0)
  FROM public.squad_members sm
  JOIN public.users u ON u.id = sm.user_id
  WHERE sm.squad_id = s.id
);
`;
f.writeFileSync('fix_achievements_db.sql', sql);
