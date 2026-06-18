-- ==============================================================================
-- SCRIPT DE CORRECCIÓN DE LOGROS Y PUNTOS
-- ==============================================================================
-- Instrucciones:
-- Copia este código y ejecútalo en el SQL Editor de tu proyecto en Supabase.
-- Esto corregirá a los usuarios que recibieron todos los logros (110) por error
-- y recalculará sus puntos para que no aparezcan en el ranking sin merecerlo.
-- ==============================================================================

-- 1. Resetear logros, medallas, rol y estado 'pro' para todos los usuarios 
--    que tengan más de 100 logros desbloqueados (y que no sean el Dev).
UPDATE public.users
SET 
  unlocked_achievements = '{}',
  badges = '{}',
  role = 'user',
  is_pro = false
WHERE name NOT ILIKE '%Elubiz%Dev%' 
  AND array_length(unlocked_achievements, 1) > 100;

-- 2. Recalcular los puntos de liga para corregir a aquellos que tenían 
--    puntos erróneos debido a los logros que se les asignaron.
UPDATE public.users u
SET league_points = compute_user_league_points(u.id)
WHERE name NOT ILIKE '%Elubiz%Dev%';
