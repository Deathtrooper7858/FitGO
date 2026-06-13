-- Allow users to view all accepted friendships
-- This drops the old policy and creates a new one that allows viewing if status = 'accepted' OR it's your own friendship

DROP POLICY IF EXISTS "Users can view their own friends" ON public.friends;

CREATE POLICY "Users can view their own friends or accepted friends" ON public.friends 
FOR SELECT USING (
    status = 'accepted' OR 
    auth.uid() = user_id_1 OR 
    auth.uid() = user_id_2
);
