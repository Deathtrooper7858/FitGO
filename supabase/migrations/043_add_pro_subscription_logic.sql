-- Migration 043: Add pro subscription logic

-- 1. Add subscription tracking columns
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS pro_purchased_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pro_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pro_will_renew BOOLEAN DEFAULT FALSE;

-- 2. Update upgrade function to set dates and renewal status
CREATE OR REPLACE FUNCTION public.upgrade_to_pro_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
END;
$$;

-- 3. Update downgrade function
CREATE OR REPLACE FUNCTION public.downgrade_from_pro(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users 
  SET 
    role = 'user', 
    is_pro = false,
    pro_will_renew = false
  WHERE id = target_user_id;
END;
$$;

-- 4. Create function to cancel subscription
CREATE OR REPLACE FUNCTION public.cancel_pro_subscription(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchased_at TIMESTAMPTZ;
BEGIN
  SELECT pro_purchased_at INTO v_purchased_at FROM public.users WHERE id = target_user_id;
  
  IF v_purchased_at IS NOT NULL AND NOW() < (v_purchased_at + INTERVAL '24 hours') THEN
    -- Cancel immediately if within 24 hours
    PERFORM public.downgrade_from_pro(target_user_id);
  ELSE
    -- Otherwise, just turn off auto-renew and keep access until expiration
    UPDATE public.users SET pro_will_renew = false WHERE id = target_user_id;
  END IF;
END;
$$;

-- 5. Create function to verify and update status
CREATE OR REPLACE FUNCTION public.verify_and_update_pro_status(target_user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_pro boolean;
  v_expires_at TIMESTAMPTZ;
  v_will_renew boolean;
BEGIN
  SELECT is_pro, pro_expires_at, pro_will_renew 
  INTO v_is_pro, v_expires_at, v_will_renew 
  FROM public.users WHERE id = target_user_id;

  IF v_is_pro = true THEN
    IF v_expires_at IS NOT NULL AND NOW() > v_expires_at THEN
      IF v_will_renew = true THEN
        -- Auto-renew! (Simulate payment)
        UPDATE public.users 
        SET pro_expires_at = pro_expires_at + INTERVAL '30 days'
        WHERE id = target_user_id;
        RETURN true;
      ELSE
        -- Expired and no renewal
        PERFORM public.downgrade_from_pro(target_user_id);
        RETURN false;
      END IF;
    ELSE
      -- Still valid
      RETURN true;
    END IF;
  END IF;
  
  RETURN false;
END;
$$;
