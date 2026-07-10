-- Migration: Secure Start Trial via RPC
-- Calculates exactly 3 days on the server to prevent device clock manipulation.

CREATE OR REPLACE FUNCTION start_free_trial()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_has_trial TIMESTAMP WITH TIME ZONE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT trial_used_at INTO v_has_trial FROM public.users WHERE id = v_user_id;
  
  IF v_has_trial IS NOT NULL THEN
    RAISE EXCEPTION 'TRIAL_ALREADY_USED';
  END IF;

  UPDATE public.users 
  SET 
    trial_used_at = NOW(),
    trial_expires_at = NOW() + INTERVAL '3 days'
  WHERE id = v_user_id;
  
  -- Grant temporary pro access
  PERFORM upgrade_to_pro_user(v_user_id);
END;
$$;
