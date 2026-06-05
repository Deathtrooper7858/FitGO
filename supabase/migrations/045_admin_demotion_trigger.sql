-- Migration 045: Trigger to reset achievements/badges on admin role demotion

CREATE OR REPLACE FUNCTION public.handle_admin_role_removal()
RETURNS trigger AS $$
BEGIN
  -- Check if the role was downgraded from an admin role to a non-admin role
  IF OLD.role IN ('admin', 'super_admin', 'owner') AND NEW.role NOT IN ('admin', 'super_admin', 'owner') THEN
    
    -- Remove all achievements and badges
    NEW.unlocked_achievements := '{}'::text[];
    NEW.pinned_achievements := '{}'::text[];
    NEW.badges := '{}'::text[];
    NEW.selected_badge := NULL;

    -- Check premium status
    -- If they have pro_purchased_at and pro_expires_at > NOW(), they bought it.
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_admin_role_removed ON public.users;

-- Create trigger
CREATE TRIGGER on_admin_role_removed
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_admin_role_removal();
