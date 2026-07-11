-- ============================================================
-- FitGO: Fix Planner Row-Level Security
-- Run this in your Supabase SQL editor to prevent any user
-- from ever seeing another user's meal or workout plans.
-- ============================================================

-- ─── Enable RLS on meal_plans ────────────────────────────────
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start clean
DROP POLICY IF EXISTS "Users can view own meal plans"    ON meal_plans;
DROP POLICY IF EXISTS "Users can insert own meal plans"  ON meal_plans;
DROP POLICY IF EXISTS "Users can update own meal plans"  ON meal_plans;
DROP POLICY IF EXISTS "Users can delete own meal plans"  ON meal_plans;

-- Create strict per-user policies
CREATE POLICY "Users can view own meal plans"
  ON meal_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plans"
  ON meal_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans"
  ON meal_plans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans"
  ON meal_plans FOR DELETE
  USING (auth.uid() = user_id);


-- ─── Enable RLS on meal_plan_items ───────────────────────────
ALTER TABLE meal_plan_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own meal plan items"   ON meal_plan_items;
DROP POLICY IF EXISTS "Users can insert own meal plan items" ON meal_plan_items;
DROP POLICY IF EXISTS "Users can update own meal plan items" ON meal_plan_items;
DROP POLICY IF EXISTS "Users can delete own meal plan items" ON meal_plan_items;

CREATE POLICY "Users can view own meal plan items"
  ON meal_plan_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = meal_plan_items.plan_id
        AND meal_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own meal plan items"
  ON meal_plan_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = meal_plan_items.plan_id
        AND meal_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own meal plan items"
  ON meal_plan_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = meal_plan_items.plan_id
        AND meal_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own meal plan items"
  ON meal_plan_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = meal_plan_items.plan_id
        AND meal_plans.user_id = auth.uid()
    )
  );


-- ─── Enable RLS on workout_plans ─────────────────────────────
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own workout plans"    ON workout_plans;
DROP POLICY IF EXISTS "Users can insert own workout plans"  ON workout_plans;
DROP POLICY IF EXISTS "Users can update own workout plans"  ON workout_plans;
DROP POLICY IF EXISTS "Users can delete own workout plans"  ON workout_plans;

CREATE POLICY "Users can view own workout plans"
  ON workout_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout plans"
  ON workout_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout plans"
  ON workout_plans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout plans"
  ON workout_plans FOR DELETE
  USING (auth.uid() = user_id);


-- ─── Enable RLS on workout_plan_items ────────────────────────
ALTER TABLE workout_plan_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own workout plan items"   ON workout_plan_items;
DROP POLICY IF EXISTS "Users can insert own workout plan items" ON workout_plan_items;
DROP POLICY IF EXISTS "Users can update own workout plan items" ON workout_plan_items;
DROP POLICY IF EXISTS "Users can delete own workout plan items" ON workout_plan_items;

CREATE POLICY "Users can view own workout plan items"
  ON workout_plan_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workout_plans
      WHERE workout_plans.id = workout_plan_items.plan_id
        AND workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own workout plan items"
  ON workout_plan_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_plans
      WHERE workout_plans.id = workout_plan_items.plan_id
        AND workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own workout plan items"
  ON workout_plan_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workout_plans
      WHERE workout_plans.id = workout_plan_items.plan_id
        AND workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own workout plan items"
  ON workout_plan_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workout_plans
      WHERE workout_plans.id = workout_plan_items.plan_id
        AND workout_plans.user_id = auth.uid()
    )
  );


-- ─── Verify ──────────────────────────────────────────────────
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('meal_plans', 'meal_plan_items', 'workout_plans', 'workout_plan_items')
  AND schemaname = 'public';
