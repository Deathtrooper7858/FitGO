-- Abre el SQL Editor en tu panel de Supabase y ejecuta esto para arreglar los roles y los puntos:

DROP TRIGGER IF EXISTS on_role_change ON public.users;

-- 1. Arregla el trigger de puntos para que se dispare con los cambios automáticos de logros
DROP TRIGGER IF EXISTS trg_achievement_unlock_points ON public.users;

CREATE TRIGGER trg_achievement_unlock_points
  AFTER UPDATE ON public.users
  FOR EACH ROW
  WHEN (NEW.unlocked_achievements IS DISTINCT FROM OLD.unlocked_achievements)
  EXECUTE FUNCTION trg_award_points_on_achievement_unlock();

-- 2. Elimina el trigger viejo de remoción de admin
DROP TRIGGER IF EXISTS on_admin_role_removed ON public.users;

-- 3. Crea el trigger completo de cambio de rol que asinga los logros y permisos automáticamente
CREATE OR REPLACE FUNCTION public.handle_role_change()
RETURNS trigger AS $$
BEGIN
  -- Solo proceder si el rol cambió
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    
    -- LÓGICA DE DOWNGRADE
    IF OLD.role IN ('admin', 'super_admin', 'owner') AND NEW.role NOT IN ('admin', 'super_admin', 'owner') THEN
      NEW.unlocked_achievements := '{}'::text[];
      NEW.pinned_achievements := '{}'::text[];
      NEW.badges := '{}'::text[];
      NEW.selected_badge := NULL;

      -- Verificar estado premium
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

    -- LÓGICA DE ASIGNACIÓN (UPGRADE)
    IF NEW.role IN ('super_admin', 'owner', 'admin', 'pro', 'pro_user') THEN
      
      -- Asegurar que los arrays no sean nulos
      IF NEW.unlocked_achievements IS NULL THEN NEW.unlocked_achievements := '{}'::text[]; END IF;
      IF NEW.badges IS NULL THEN NEW.badges := '{}'::text[]; END IF;

      -- Base Premium/Pro
      NEW.is_pro := true;
      IF NOT ('premium_club' = ANY(NEW.unlocked_achievements)) THEN
        NEW.unlocked_achievements := array_append(NEW.unlocked_achievements, 'premium_club');
      END IF;
      IF NOT ('pro' = ANY(NEW.badges)) THEN
        NEW.badges := array_append(NEW.badges, 'pro');
      END IF;

      -- Admin
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

      -- Super Admin
      IF NEW.role IN ('super_admin', 'owner') THEN
        IF NOT ('developer_god' = ANY(NEW.unlocked_achievements)) THEN
          NEW.unlocked_achievements := array_append(NEW.unlocked_achievements, 'developer_god');
        END IF;
        IF NOT ('super_admin' = ANY(NEW.badges)) THEN
          NEW.badges := array_append(NEW.badges, 'super_admin');
        END IF;
      END IF;

      -- Owner
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

-- Crea el trigger para ejecutarse antes del update
DROP TRIGGER IF EXISTS on_role_change ON public.users;
CREATE TRIGGER on_role_change
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_role_change();

-- 4. Actualizar a los usuarios existentes que ya tengan estos roles para que se les apliquen retroactivamente
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

    -- Pro
    IF NOT ('premium_club' = ANY(new_achievements)) THEN
      new_achievements := array_append(new_achievements, 'premium_club');
      modified := true;
    END IF;
    IF NOT ('pro' = ANY(new_badges)) THEN
      new_badges := array_append(new_badges, 'pro');
      modified := true;
    END IF;

    -- Admin
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

    -- Super Admin
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

    -- Owner
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