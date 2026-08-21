-- Migration 065: Fix roles, subscriptions, and trial revocations

-- 1. Fix downgrade_from_pro so it doesn't affect admins/owners
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
      role          = 'user',
      is_pro        = false,
      pro_will_renew = false,
      name_color    = NULL
    WHERE id = target_user_id;
  END IF;
END;
$$;

-- 2. Fix upgrade_to_pro_user so it doesn't downgrade admins/owners to pro_user
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
      role = 'pro_user', 
      is_pro = true,
      unlocked_achievements = array_append(
          array_remove(unlocked_achievements, 'pro_subscriber'), 
          'pro_subscriber'
      ),
      pro_purchased_at = NOW(),
      pro_expires_at = NOW() + INTERVAL '30 days',
      pro_will_renew = true
    WHERE id = target_user_id;
  ELSE
    -- If they are admin/owner, just update the subscription dates but keep role
    UPDATE public.users 
    SET 
      is_pro = true,
      pro_purchased_at = NOW(),
      pro_expires_at = NOW() + INTERVAL '30 days',
      pro_will_renew = true
    WHERE id = target_user_id;
  END IF;
END;
$$;

-- 3. Fix revoke_expired_trials so it ignores admins/owners
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
    trial_used_at IS NOT NULL
    AND trial_expires_at IS NOT NULL
    AND trial_expires_at < NOW()
    AND is_pro = TRUE
    AND role NOT IN ('admin', 'super_admin', 'owner');

  GET DIAGNOSTICS revoked_count = ROW_COUNT;

  RAISE LOG 'revoke_expired_trials: revoked % users', revoked_count;
  RETURN revoked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update handle_role_change trigger to properly remove pro benefits when downgraded
CREATE OR REPLACE FUNCTION public.handle_role_change()
RETURNS trigger AS $$
BEGIN
  -- Only proceed if role actually changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    
    -- DOWNGRADE LOGIC for admin/owner
    IF OLD.role IN ('admin', 'super_admin', 'owner') AND NEW.role NOT IN ('admin', 'super_admin', 'owner') THEN
      NEW.unlocked_achievements := '{}'::text[];
      NEW.pinned_achievements := '{}'::text[];
      NEW.badges := '{}'::text[];
      NEW.selected_badge := NULL;

      -- Check premium status
      IF NEW.pro_purchased_at IS NOT NULL AND NEW.pro_expires_at IS NOT NULL AND NEW.pro_expires_at > NOW() THEN
        NEW.is_pro := true;
        NEW.role := 'pro_user';
      ELSE
        NEW.is_pro := false;
        IF NEW.role = 'pro_user' THEN
           NEW.role := 'user';
        END IF;
      END IF;
    END IF;

    -- DOWNGRADE LOGIC for pro users (remove pro perks if losing pro role)
    IF OLD.role IN ('pro_user', 'pro') AND NEW.role NOT IN ('pro_user', 'pro', 'admin', 'super_admin', 'owner') THEN
       IF NEW.unlocked_achievements IS NOT NULL THEN
         NEW.unlocked_achievements := array_remove(NEW.unlocked_achievements, 'premium_club');
         NEW.unlocked_achievements := array_remove(NEW.unlocked_achievements, 'pro_subscriber');
       END IF;
       IF NEW.pinned_achievements IS NOT NULL THEN
         NEW.pinned_achievements := array_remove(NEW.pinned_achievements, 'premium_club');
         NEW.pinned_achievements := array_remove(NEW.pinned_achievements, 'pro_subscriber');
       END IF;
       IF NEW.badges IS NOT NULL THEN
         NEW.badges := array_remove(NEW.badges, 'pro');
       END IF;
       IF NEW.selected_badge = 'pro' THEN
         NEW.selected_badge := NULL;
       END IF;
    END IF;

    -- UPGRADE / ASSIGNMENT LOGIC
    IF NEW.role IN ('super_admin', 'owner', 'admin', 'pro', 'pro_user') THEN
      
      -- Ensure arrays are not null
      IF NEW.unlocked_achievements IS NULL THEN NEW.unlocked_achievements := '{}'::text[]; END IF;
      IF NEW.badges IS NULL THEN NEW.badges := '{}'::text[]; END IF;

      -- Base Premium/Pro grants
      NEW.is_pro := true;
      IF NOT ('premium_club' = ANY(NEW.unlocked_achievements)) THEN
        NEW.unlocked_achievements := array_append(NEW.unlocked_achievements, 'premium_club');
      END IF;
      IF NOT ('pro' = ANY(NEW.badges)) THEN
        NEW.badges := array_append(NEW.badges, 'pro');
      END IF;

      -- Admin grants
      IF NEW.role IN ('admin', 'super_admin', 'owner') THEN
        IF NOT ('beta_tester' = ANY(NEW.unlocked_achievements)) THEN
          NEW.unlocked_achievements := array_append(NEW.unlocked_achievements, 'beta_tester');
        END IF;
        IF NOT ('verified' = ANY(NEW.badges)) THEN
          NEW.badges := array_append(NEW.badges, 'verified');
        END IF;
        IF NOT ('admin' = ANY(NEW.badges)) THEN
          NEW.badges := array_append(NEW.badges, 'admin');
        END IF;
      END IF;

      -- Super Admin grants
      IF NEW.role IN ('super_admin', 'owner') THEN
        IF NOT ('developer_god' = ANY(NEW.unlocked_achievements)) THEN
          NEW.unlocked_achievements := array_append(NEW.unlocked_achievements, 'developer_god');
        END IF;
        IF NOT ('super_admin' = ANY(NEW.badges)) THEN
          NEW.badges := array_append(NEW.badges, 'super_admin');
        END IF;
      END IF;

      -- Owner grants
      IF NEW.role = 'owner' THEN
        IF NOT ('the_owner' = ANY(NEW.unlocked_achievements)) THEN
          NEW.unlocked_achievements := array_append(NEW.unlocked_achievements, 'the_owner');
        END IF;
        IF NOT ('owner' = ANY(NEW.badges)) THEN
          NEW.badges := array_append(NEW.badges, 'owner');
        END IF;
      END IF;

    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
