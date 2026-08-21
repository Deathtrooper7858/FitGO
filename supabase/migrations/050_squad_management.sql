-- 050_squad_management.sql
-- Allow squad deletion and ownership transfer

-- 1. Trigger to delete squad when the last member leaves
CREATE OR REPLACE FUNCTION trg_delete_empty_squad()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.squad_members WHERE squad_id = OLD.squad_id;
  IF v_count = 0 THEN
    DELETE FROM public.squads WHERE id = OLD.squad_id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS delete_empty_squad ON public.squad_members;
CREATE TRIGGER delete_empty_squad
  AFTER DELETE ON public.squad_members
  FOR EACH ROW EXECUTE PROCEDURE trg_delete_empty_squad();

-- 2. Function to transfer leadership
CREATE OR REPLACE FUNCTION transfer_squad_leadership(p_squad_id uuid, p_new_owner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_creator_id uuid;
  v_is_member boolean;
BEGIN
  -- Verify caller is the current creator
  SELECT created_by INTO v_creator_id FROM public.squads WHERE id = p_squad_id;
  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'Squad not found.';
  END IF;
  
  IF v_caller_id != v_creator_id THEN
    RAISE EXCEPTION 'Only the current creator can transfer leadership.';
  END IF;
  
  -- Verify new owner is a member
  SELECT EXISTS(
    SELECT 1 FROM public.squad_members 
    WHERE squad_id = p_squad_id AND user_id = p_new_owner_id
  ) INTO v_is_member;
  
  IF NOT v_is_member THEN
    RAISE EXCEPTION 'The new owner must be a member of the squad.';
  END IF;
  
  -- Transfer
  UPDATE public.squads SET created_by = p_new_owner_id WHERE id = p_squad_id;
END;
$$;
