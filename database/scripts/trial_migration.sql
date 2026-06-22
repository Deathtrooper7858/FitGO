-- ============================================================
-- FitGO: 3-Day Trial Plan Migration
-- Run this in your Supabase SQL editor
-- ============================================================

-- 1. Add trial tracking columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS trial_used_at   TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Index for efficient trial expiry checks
CREATE INDEX IF NOT EXISTS idx_users_trial_expires_at
  ON users (trial_expires_at)
  WHERE trial_expires_at IS NOT NULL;

-- 3. Function: revoke expired trials (called by cron)
CREATE OR REPLACE FUNCTION revoke_expired_trials()
RETURNS INTEGER AS $$
DECLARE
  revoked_count INTEGER;
BEGIN
  UPDATE users
  SET
    is_pro        = FALSE,
    role          = 'user',
    name_color    = NULL
  WHERE
    trial_used_at IS NOT NULL        -- user has used a trial
    AND trial_expires_at IS NOT NULL -- and has an expiry
    AND trial_expires_at < NOW()     -- and it has expired
    AND is_pro = TRUE;               -- and still has pro

  GET DIAGNOSTICS revoked_count = ROW_COUNT;
  
  RAISE LOG 'revoke_expired_trials: revoked % users', revoked_count;
  RETURN revoked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Enable pg_cron extension (requires pg_cron) and schedule cron job
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'revoke-expired-trials',   -- job name
  '0 * * * *',               -- every hour
  'SELECT revoke_expired_trials()'
);


-- NOTE: If pg_cron is not available, revocation happens client-side
-- via checkAndRevokeExpiredTrial() called on app launch.

-- 5. Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('trial_used_at', 'trial_expires_at');
