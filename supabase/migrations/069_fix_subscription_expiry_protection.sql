-- Migration 069: Fix subscription expiry protection for privileged roles

-- 1. Ensure 'owner' is in the role constraint (some older migrations may be missing it)
DO $$
DECLARE
  constraint_record record;
BEGIN
  FOR constraint_record IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.users'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%role%'
  ) LOOP
    EXECUTE 'ALTER TABLE public.users DROP CONSTRAINT ' || quote_ident(constraint_record.conname);
  END LOOP;
END
$$;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('user','pro','admin','super_admin','pro_user','owner'));

-- 2. Add subscription_type column to distinguish 'premium' vs 'trial' vs 'manual'
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT 'none'
    CHECK (subscription_type IN ('none', 'premium', 'trial', 'manual'));

-- 3. Update upgrade_to_pro_user: sets subscription_type = 'premium'
CREATE OR REPLACE FUNCTION public.upgrade_to_pro_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role FROM public.users WHERE id = target_user_id;

  IF v_role NOT IN ('admin', 'super_admin', 'owner') THEN
    UPDATE public.users
    SET
      role              = 'pro_user',
      is_pro            = true,
      subscription_type = 'premium',
      unlocked_achievements = array_append(
          array_remove(unlocked_achievements, 'pro_subscriber'),
          'pro_subscriber'
      ),
      pro_purchased_at  = NOW(),
      pro_expires_at    = NOW() + INTERVAL '30 days',
      pro_will_renew    = true
    WHERE id = target_user_id;
  ELSE
    -- Privileged users: update subscription dates, keep role, mark as manual
    UPDATE public.users
    SET
      is_pro            = true,
      subscription_type = 'manual',
      pro_purchased_at  = NOW(),
      pro_expires_at    = NULL,   -- No expiry for manual grants
      pro_will_renew    = false
    WHERE id = target_user_id;
  END IF;
END;
$$;

-- 4. Update downgrade_from_pro: never touch owner/admin/super_admin
CREATE OR REPLACE FUNCTION public.downgrade_from_pro(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role FROM public.users WHERE id = target_user_id;

  IF v_role NOT IN ('admin', 'super_admin', 'owner') THEN
    UPDATE public.users
    SET
      role              = 'user',
      is_pro            = false,
      subscription_type = 'none',
      pro_will_renew    = false,
      name_color        = NULL
    WHERE id = target_user_id;
  END IF;
END;
$$;

-- 5. start_trial: sets subscription_type = 'trial', duration = 3 days
CREATE OR REPLACE FUNCTION public.start_trial(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_trial_used_at timestamptz;
BEGIN
  SELECT role, trial_used_at INTO v_role, v_trial_used_at
  FROM public.users WHERE id = target_user_id;

  -- Prevent double usage
  IF v_trial_used_at IS NOT NULL THEN
    RAISE EXCEPTION 'TRIAL_ALREADY_USED';
  END IF;

  -- Don't change role of privileged users
  IF v_role IN ('admin', 'super_admin', 'owner') THEN
    RETURN;
  END IF;

  UPDATE public.users
  SET
    role              = 'pro_user',
    is_pro            = true,
    subscription_type = 'trial',
    trial_used_at     = NOW(),
    trial_expires_at  = NOW() + INTERVAL '3 days',
    pro_purchased_at  = NOW(),
    pro_expires_at    = NOW() + INTERVAL '3 days',
    pro_will_renew    = false
  WHERE id = target_user_id;
END;
$$;

-- 6. Revoke expired subscriptions (cron safe)
CREATE OR REPLACE FUNCTION public.revoke_expired_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  revoked_count INTEGER;
BEGIN
  UPDATE public.users
  SET
    is_pro            = FALSE,
    role              = 'user',
    name_color        = NULL,
    pro_will_renew    = FALSE,
    subscription_type = 'none'
  WHERE
    is_pro = TRUE
    AND pro_expires_at IS NOT NULL
    AND pro_expires_at < NOW()
    AND role NOT IN ('admin', 'super_admin', 'owner')
    AND subscription_type IN ('premium', 'trial');

  GET DIAGNOSTICS revoked_count = ROW_COUNT;
  RAISE LOG 'revoke_expired_subscriptions: revoked % users', revoked_count;
  RETURN revoked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Keep backward-compat alias
CREATE OR REPLACE FUNCTION public.revoke_expired_trials()
RETURNS INTEGER AS $$
BEGIN
  RETURN public.revoke_expired_subscriptions();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant owner full manual access RPC (for DB admin use)
CREATE OR REPLACE FUNCTION public.grant_owner_access(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET
    role              = 'owner',
    is_pro            = true,
    subscription_type = 'manual',
    pro_purchased_at  = NOW(),
    pro_expires_at    = NULL,
    pro_will_renew    = false
  WHERE id = target_user_id;
END;
$$;
