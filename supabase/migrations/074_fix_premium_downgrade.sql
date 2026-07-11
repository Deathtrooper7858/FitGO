-- Migration 074: Fix premium downgrade to reset premium_color

-- Update downgrade_from_pro to also reset premium_color
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
      name_color        = NULL,
      premium_color     = NULL
    WHERE id = target_user_id;
  END IF;
END;
$$;

-- Revoke expired subscriptions to also reset premium_color
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
    premium_color     = NULL,
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
