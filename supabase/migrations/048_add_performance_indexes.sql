-- Migration 048: Add missing indexes for performance optimization
-- These indexes drastically speed up queries that filter or sort by user_id, date, and timestamps

-- 1. Index on food_logs
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON public.food_logs(user_id, logged_at);

-- 2. Index on activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date ON public.activity_logs(user_id, logged_at);

-- 3. Index on daily_metrics
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON public.daily_metrics(user_id, date);

-- 4. Index on posts
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON public.posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created ON public.posts(created_at DESC);

-- 5. Index on post_comments
CREATE INDEX IF NOT EXISTS idx_post_comments_post_created ON public.post_comments(post_id, created_at ASC);

-- 6. Index on post_likes
CREATE INDEX IF NOT EXISTS idx_post_likes_post_user ON public.post_likes(post_id, user_id);

-- 7. Index on friends
CREATE INDEX IF NOT EXISTS idx_friends_users ON public.friends(user_id_1, user_id_2);
CREATE INDEX IF NOT EXISTS idx_friends_status ON public.friends(status);

-- 8. Index on direct_messages
CREATE INDEX IF NOT EXISTS idx_direct_messages_users ON public.direct_messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created ON public.direct_messages(created_at DESC);

-- 9. Index on squad members
CREATE INDEX IF NOT EXISTS idx_squad_members_squad_user ON public.squad_members(squad_id, user_id);

