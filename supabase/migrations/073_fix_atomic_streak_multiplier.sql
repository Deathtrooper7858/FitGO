-- ============================================================================
-- Migration 073: Fix Streak Multiplier Consistency in award_league_points_atomic
-- ============================================================================
-- Problem: award_league_points_atomic (introduced in 072) used a different
-- streak-multiplier table than the canonical get_streak_multiplier() function
-- used by all triggers and the award_league_points RPC:
--
--   072 (WRONG):           Canonical (CORRECT — mig. 054 / leagueStore.ts):
--   streak >= 30 → ×2.0   streak >= 15 → ×2.0
--   streak >= 21 → ×1.75  streak >= 8  → ×1.5
--   streak >= 14 → ×1.5   streak >= 3  → ×1.2
--   streak >= 7  → ×1.25  otherwise    → ×1.0
--   streak >= 3  → ×1.1
--
-- Fix: replace the inline CASE with a call to get_streak_multiplier() so
-- award_league_points_atomic always stays in sync with the rest of the system.
-- ============================================================================

CREATE OR REPLACE FUNCTION award_league_points_atomic(
  p_user_id UUID,
  p_points  INT,
  p_reason  TEXT DEFAULT 'general'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_streak INT;
  v_multiplier     NUMERIC;
  v_final_points   INT;
  v_new_total      INT;
BEGIN
  -- Lock the user row to prevent concurrent modifications
  SELECT current_streak INTO v_current_streak
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  -- Use the canonical helper — mirrors getStreakMultiplier() in leagueStore.ts:
  --   streak >= 15 → ×2.0 | >= 8 → ×1.5 | >= 3 → ×1.2 | else → ×1.0
  v_current_streak := COALESCE(v_current_streak, 0);
  v_multiplier     := get_streak_multiplier(v_current_streak);

  v_final_points := ROUND(p_points * v_multiplier);

  -- Atomically update points
  UPDATE users SET
    league_points = COALESCE(league_points, 0) + v_final_points,
    squad_points  = COALESCE(squad_points,  0) + v_final_points
  WHERE id = p_user_id
  RETURNING league_points INTO v_new_total;

  RETURN jsonb_build_object(
    'points_awarded', v_final_points,
    'base_points',    p_points,
    'multiplier',     v_multiplier,
    'new_total',      v_new_total
  );
END;
$$;
