-- ============================================================
-- FitGO: Fix Trial Revocation
-- Run this in your Supabase SQL editor to patch the RPCs
-- so that trial expiry properly clears ALL pro perks.
-- ============================================================

-- 1. Patch downgrade_from_pro to also clear name_color
--    (Previously it did NOT clear name_color, so pro colors
--     would persist after the trial expired)
CREATE OR REPLACE FUNCTION public.downgrade_from_pro(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET
    role          = 'user',
    is_pro        = false,
    pro_will_renew = false,
    name_color    = NULL       -- clear premium color on revocation
  WHERE id = target_user_id;
END;
$$;


-- 2. Patch revoke_expired_trials (cron job function) to be
--    consistent with downgrade_from_pro and also clear name_color
CREATE OR REPLACE FUNCTION revoke_expired_trials()
RETURNS INTEGER AS $$
DECLARE
  revoked_count INTEGER;
BEGIN
  UPDATE users
  SET
    is_pro        = FALSE,
    role          = 'user',
    name_color    = NULL,
    pro_will_renew = false
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


-- 3. Ensure the cron job exists (safe to run multiple times)
--    This schedules revoke_expired_trials every hour.
SELECT cron.schedule(
  'revoke-expired-trials',   -- job name (idempotent)
  '0 * * * *',               -- every hour on the hour
  'SELECT revoke_expired_trials()'
);


-- 4. Manual revocation test — run this to immediately revoke
--    any trials that have already expired (useful after deploying):
SELECT revoke_expired_trials();


-- 5. Verify: list users with active trials and their expiry
SELECT
  id,
  email,
  is_pro,
  role,
  trial_used_at,
  trial_expires_at,
  CASE
    WHEN trial_expires_at > NOW() THEN 'ACTIVE'
    WHEN trial_expires_at <= NOW() AND is_pro THEN 'EXPIRED_NOT_REVOKED'
    WHEN trial_expires_at <= NOW() AND NOT is_pro THEN 'EXPIRED_REVOKED'
    ELSE 'NO_TRIAL'
  END AS trial_status
FROM users
WHERE trial_used_at IS NOT NULL
ORDER BY trial_expires_at DESC;
