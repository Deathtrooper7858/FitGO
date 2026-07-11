-- Migration 062: Fix role upgrades granting achievements/badges and points trigger

-- 1. Fix the points trigger so it fires even if unlocked_achievements was modified by a BEFORE trigger
DROP TRIGGER IF EXISTS trg_achievement_unlock_points ON public.users;
CREATE TRIGGER trg_achievement_unlock_points
  AFTER UPDATE ON public.users
  FOR EACH ROW
  WHEN (NEW.unlocked_achievements IS DISTINCT FROM OLD.unlocked_achievements)
  EXECUTE FUNCTION trg_award_points_on_achievement_unlock();

-- 2. Drop the old admin removal trigger
DROP TRIGGER IF EXISTS on_admin_role_removed ON public.users;

-- 3. Create the comprehensive role change trigger
CREATE OR REPLACE FUNCTION public.handle_role_change()
RETURNS trigger AS $$
BEGIN
  -- Only proceed if role actually changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    
    -- DOWNGRADE LOGIC (from old trigger)
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

-- Create the new role change trigger
DROP TRIGGER IF EXISTS on_role_change ON public.users;
CREATE TRIGGER on_role_change
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_role_change();

-- 4. Backfill existing roles
DO $$
DECLARE
  u RECORD;
  new_achievements text[];
  new_badges text[];
  modified boolean;
BEGIN
  FOR u IN SELECT * FROM public.users WHERE role IN ('super_admin', 'owner', 'admin', 'pro', 'pro_user') LOOP
    modified := false;
    new_achievements := COALESCE(u.unlocked_achievements, '{}'::text[]);
    new_badges := COALESCE(u.badges, '{}'::text[]);

    -- Pro grants
    IF NOT ('premium_club' = ANY(new_achievements)) THEN
      new_achievements := array_append(new_achievements, 'premium_club');
      modified := true;
    END IF;
    IF NOT ('pro' = ANY(new_badges)) THEN
      new_badges := array_append(new_badges, 'pro');
      modified := true;
    END IF;

    -- Admin grants
    IF u.role IN ('admin', 'super_admin', 'owner') THEN
      IF NOT ('beta_tester' = ANY(new_achievements)) THEN
        new_achievements := array_append(new_achievements, 'beta_tester');
        modified := true;
      END IF;
      IF NOT ('verified' = ANY(new_badges)) THEN
        new_badges := array_append(new_badges, 'verified');
        modified := true;
      END IF;
      IF NOT ('admin' = ANY(new_badges)) THEN
        new_badges := array_append(new_badges, 'admin');
        modified := true;
      END IF;
    END IF;

    -- Super Admin grants
    IF u.role IN ('super_admin', 'owner') THEN
      IF NOT ('developer_god' = ANY(new_achievements)) THEN
        new_achievements := array_append(new_achievements, 'developer_god');
        modified := true;
      END IF;
      IF NOT ('super_admin' = ANY(new_badges)) THEN
        new_badges := array_append(new_badges, 'super_admin');
        modified := true;
      END IF;
    END IF;

    -- Owner grants
    IF u.role = 'owner' THEN
      IF NOT ('the_owner' = ANY(new_achievements)) THEN
        new_achievements := array_append(new_achievements, 'the_owner');
        modified := true;
      END IF;
      IF NOT ('owner' = ANY(new_badges)) THEN
        new_badges := array_append(new_badges, 'owner');
        modified := true;
      END IF;
    END IF;

    IF modified THEN
      UPDATE public.users 
      SET unlocked_achievements = new_achievements,
          badges = new_badges,
          is_pro = true
      WHERE id = u.id;
    END IF;
  END LOOP;
END;
$$;
