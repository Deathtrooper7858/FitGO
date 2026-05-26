-- Migration 042: Add pro_user role and RPCs to manage pro subscription

-- 1. Drop existing check constraints on 'role' column dynamically
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

-- 2. Add the new constraint with 'pro_user'
ALTER TABLE public.users 
  ADD CONSTRAINT users_role_check 
  CHECK (role IN ('user','pro','admin','super_admin','pro_user'));

-- 3. Create function to upgrade user to pro
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
    )
  WHERE id = target_user_id;
END;
$$;

-- 4. Create function to downgrade user from pro
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
    is_pro = false
  WHERE id = target_user_id;
END;
$$;
