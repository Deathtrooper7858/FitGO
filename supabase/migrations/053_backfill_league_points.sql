-- Backfill league_points for all users based on the old global ranking formula
-- This ensures users don't lose their historical points.

UPDATE public.users u
SET league_points = COALESCE(
  (
    -- Points for food logs
    (SELECT COUNT(*) FROM public.food_logs fl WHERE fl.user_id = u.id) * 10 +
    
    -- Points for activity logs
    (SELECT COUNT(*) FROM public.activity_logs al WHERE al.user_id = u.id) * 50 +
    
    -- Points for completed challenges created by the user
    (SELECT COUNT(*) FROM public.challenges c WHERE c.creator_id = u.id AND c.status = 'completed') * 100 +
    
    -- Points for completed challenges where user is an accepted participant (excluding ones they created)
    (SELECT COUNT(*) FROM public.challenge_participants cp 
     JOIN public.challenges c ON c.id = cp.challenge_id 
     WHERE cp.user_id = u.id AND cp.status = 'accepted' AND c.status = 'completed' AND c.creator_id != u.id) * 100 +
     
    -- Points for unlocked achievements
    COALESCE(array_length(u.unlocked_achievements, 1), 0) * 100
  ),
  0
);
