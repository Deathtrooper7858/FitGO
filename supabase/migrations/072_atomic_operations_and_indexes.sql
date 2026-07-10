-- ============================================================================
-- Migration 072: Atomic Operations, Indexes & Security Hardening
-- ============================================================================

-- ── 1. Atomic Challenge Completion (prevents double point awarding) ─────────
-- Uses pg_advisory_xact_lock to serialize concurrent completions for the same challenge.
CREATE OR REPLACE FUNCTION complete_challenge_atomic(
  p_challenge_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lock_key BIGINT;
  v_active_count INT;
  v_completed_count INT;
  v_reward_points INT;
  v_base_points CONSTANT INT := 500;
  v_participant RECORD;
  v_result JSONB;
BEGIN
  -- Advisory lock scoped to this challenge (prevents concurrent completions)
  v_lock_key := hashtext(p_challenge_id::text);
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- 1. Mark this user as completed (idempotent)
  UPDATE challenge_participants
  SET status = 'completed'
  WHERE challenge_id = p_challenge_id
    AND user_id = p_user_id
    AND status != 'surrendered';

  -- 2. Count active (non-surrendered) and completed participants
  SELECT
    COUNT(*) FILTER (WHERE status != 'surrendered'),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO v_active_count, v_completed_count
  FROM challenge_participants
  WHERE challenge_id = p_challenge_id;

  -- 3. If all active participants completed, award points and close challenge
  IF v_active_count > 0 AND v_active_count = v_completed_count THEN
    -- Close the challenge
    UPDATE challenges SET status = 'completed' WHERE id = p_challenge_id AND status = 'active';

    -- Calculate reward
    v_reward_points := v_base_points / GREATEST(v_active_count, 1);

    -- Award points to each participant atomically
    FOR v_participant IN
      SELECT user_id FROM challenge_participants
      WHERE challenge_id = p_challenge_id AND status = 'completed'
    LOOP
      PERFORM award_league_points_atomic(v_participant.user_id, v_reward_points, 'challenge_completed');
    END LOOP;

    v_result := jsonb_build_object(
      'completed', true,
      'reward_points', v_reward_points,
      'participants_count', v_active_count
    );
  ELSE
    v_result := jsonb_build_object(
      'completed', false,
      'reward_points', 0,
      'participants_count', v_active_count,
      'still_pending', v_active_count - v_completed_count
    );
  END IF;

  RETURN v_result;
END;
$$;


-- ── 2. Atomic Award Points (prevents race conditions in point accumulation) ─
-- Replaces the fire-and-forget RPC with an atomic version that also applies streak multiplier.
CREATE OR REPLACE FUNCTION award_league_points_atomic(
  p_user_id UUID,
  p_points INT,
  p_reason TEXT DEFAULT 'general'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_streak INT;
  v_multiplier NUMERIC;
  v_final_points INT;
  v_new_total INT;
BEGIN
  -- Lock the user row to prevent concurrent modifications
  SELECT current_streak INTO v_current_streak
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  -- Calculate streak multiplier
  v_current_streak := COALESCE(v_current_streak, 0);
  v_multiplier := CASE
    WHEN v_current_streak >= 30 THEN 2.0
    WHEN v_current_streak >= 21 THEN 1.75
    WHEN v_current_streak >= 14 THEN 1.5
    WHEN v_current_streak >= 7 THEN 1.25
    WHEN v_current_streak >= 3 THEN 1.1
    ELSE 1.0
  END;

  v_final_points := ROUND(p_points * v_multiplier);

  -- Atomically update points
  UPDATE users SET
    league_points = COALESCE(league_points, 0) + v_final_points,
    squad_points = COALESCE(squad_points, 0) + v_final_points
  WHERE id = p_user_id
  RETURNING league_points INTO v_new_total;

  RETURN jsonb_build_object(
    'points_awarded', v_final_points,
    'base_points', p_points,
    'multiplier', v_multiplier,
    'new_total', v_new_total
  );
END;
$$;


-- ── 3. Atomic Squad Creation (prevents orphaned squads) ─────────────────────
-- Creates squad and adds creator in a single transaction.
CREATE OR REPLACE FUNCTION create_squad_atomic(
  p_name TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_squad_id UUID;
  v_invite_code TEXT;
BEGIN
  -- Generate unique invite code
  v_invite_code := lower(substr(md5(random()::text), 1, 8));

  -- Create squad
  INSERT INTO squads (name, created_by, invite_code)
  VALUES (p_name, p_user_id, v_invite_code)
  RETURNING id INTO v_squad_id;

  -- Add creator as member
  INSERT INTO squad_members (squad_id, user_id, role)
  VALUES (v_squad_id, p_user_id, 'leader');

  -- Award squad creator achievement
  UPDATE users SET
    unlocked_achievements = CASE
      WHEN unlocked_achievements @> '["squad_creator"]'::jsonb
      THEN unlocked_achievements
      ELSE unlocked_achievements || '"squad_creator"'::jsonb
    END
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'id', v_squad_id,
    'invite_code', v_invite_code,
    'name', p_name,
    'created_by', p_user_id
  );
END;
$$;


-- ── 4. Performance Indexes ──────────────────────────────────────────────────

-- squads.invite_code: unique index for lookup-by-code pattern
CREATE UNIQUE INDEX IF NOT EXISTS idx_squads_invite_code
  ON squads (invite_code)
  WHERE invite_code IS NOT NULL;

-- users.email: index for search_users_by_email_or_id RPC
CREATE INDEX IF NOT EXISTS idx_users_email
  ON users (email)
  WHERE email IS NOT NULL;

-- direct_messages: composite index for unread count queries
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver_read
  ON direct_messages (receiver_id, is_read)
  WHERE is_read = false;

-- direct_messages: index for DM conversation queries
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation
  ON direct_messages (sender_id, receiver_id, created_at DESC);

-- challenge_participants: index for challenge completion checks
CREATE INDEX IF NOT EXISTS idx_challenge_participants_status
  ON challenge_participants (challenge_id, status);

-- food_logs: index for daily food log queries
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date
  ON food_logs (user_id, logged_at DESC);

-- activity_logs: index for daily activity queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date
  ON activity_logs (user_id, logged_at DESC);

-- post_likes: composite index for like checks
CREATE INDEX IF NOT EXISTS idx_post_likes_post_user
  ON post_likes (post_id, user_id);


-- ── 5. Security: Validate role changes server-side ──────────────────────────
-- Prevents client-side role escalation by ensuring only legitimate role transitions.
CREATE OR REPLACE FUNCTION validate_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow role changes through authorized functions
  -- Block direct updates to role column from client
  IF (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'anon' THEN
    RAISE EXCEPTION 'Direct role modification not allowed';
  END IF;

  -- Allow service_role (webhook, admin functions)
  IF (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- For authenticated users: only allow if they are owner/super_admin
  IF (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'authenticated' THEN
    IF EXISTS (
      SELECT 1 FROM users
      WHERE id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid
        AND role IN ('owner', 'super_admin')
    ) THEN
      RETURN NEW;
    END IF;
  END IF;

  RETURN OLD;
END;
$$;

-- Only apply to direct updates (not RPC functions which use SECURITY DEFINER)
-- Note: This trigger should be created on the users table but needs careful testing
-- CREATE TRIGGER prevent_direct_role_change
--   BEFORE UPDATE OF role ON users
--   FOR EACH ROW
--   WHEN (OLD.role IS DISTINCT FROM NEW.role)
--   EXECUTE FUNCTION validate_role_change();

-- Commented out by default — enable after testing with your auth setup
