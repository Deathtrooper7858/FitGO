-- Drop existing constraint
ALTER TABLE public.challenge_participants DROP CONSTRAINT IF EXISTS challenge_participants_status_check;

-- Add new constraint with 'completed' and 'surrendered' included
ALTER TABLE public.challenge_participants ADD CONSTRAINT challenge_participants_status_check CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'surrendered'));
