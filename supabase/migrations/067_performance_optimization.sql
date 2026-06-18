-- 067: Performance Optimization & Schema Consolidation
-- Adds missing indexes, optimized query patterns, and fixes gaps

-- ─── Performance Indexes for high-traffic queries ────────────────────────

-- Composite index for food_logs date range + user lookups
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date
  ON public.food_logs (user_id, logged_at DESC);

-- Composite index for food_logs meal type filtering
CREATE INDEX IF NOT EXISTS idx_food_logs_meal
  ON public.food_logs (user_id, meal, logged_at DESC);

-- Covering index for daily totals aggregation
CREATE INDEX IF NOT EXISTS idx_food_logs_nutrients
  ON public.food_logs (user_id, logged_at)
  INCLUDE (calories, protein, carbs, fat);

-- Composite index for activity_logs date range queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date
  ON public.activity_logs (user_id, logged_at DESC);

-- Covering index for activity_logs aggregation
CREATE INDEX IF NOT EXISTS idx_activity_logs_calories
  ON public.activity_logs (user_id, logged_at)
  INCLUDE (calories, duration);

-- Index for daily_metrics per-user per-date lookups
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date
  ON public.daily_metrics (user_id, date DESC);

-- Index for body_measurements latest-per-user queries
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_date
  ON public.body_measurements (user_id, measured_at DESC);

-- Index for squad_members by squad_id for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_squad_members_squad
  ON public.squad_members (squad_id);

-- Index for squad_members by user_id for fast leave/join checks
CREATE INDEX IF NOT EXISTS idx_squad_members_user
  ON public.squad_members (user_id);

-- Index for coach_conversations by user + coach type
CREATE INDEX IF NOT EXISTS idx_coach_conversations_user_type
  ON public.coach_conversations (user_id, coach_type);

-- Index for coach_sessions by conversation
CREATE INDEX IF NOT EXISTS idx_coach_sessions_conversation
  ON public.coach_sessions (conversation_id, created_at DESC);

-- Index for posts feed ordering
CREATE INDEX IF NOT EXISTS idx_posts_feed
  ON public.posts (created_at DESC);

-- Index for direct_messages by conversation participants
CREATE INDEX IF NOT EXISTS idx_direct_messages_participants
  ON public.direct_messages (sender_id, receiver_id, created_at DESC);

-- Index for league_point_logs audit trail
CREATE INDEX IF NOT EXISTS idx_league_point_logs_user
  ON public.league_point_logs (user_id, created_at DESC);

-- Index for challenge_participants by challenge
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge
  ON public.challenge_participants (challenge_id);

-- Index for progress_photos by user
CREATE INDEX IF NOT EXISTS idx_progress_photos_user
  ON public.progress_photos (user_id, created_at DESC);

-- Index for post_comments by post
CREATE INDEX IF NOT EXISTS idx_post_comments_post
  ON public.post_comments (post_id, created_at ASC);

-- Index for post_likes by post (for count queries)
CREATE INDEX IF NOT EXISTS idx_post_likes_post
  ON public.post_likes (post_id);

-- ─── Optimized RPC: Get user's daily totals (single query) ─────────────
CREATE OR REPLACE FUNCTION get_user_daily_totals(
  p_user_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_calories DOUBLE PRECISION,
  total_protein  DOUBLE PRECISION,
  total_carbs    DOUBLE PRECISION,
  total_fat      DOUBLE PRECISION,
  total_sugar    DOUBLE PRECISION,
  total_fiber    DOUBLE PRECISION,
  total_sodium   DOUBLE PRECISION,
  total_iron     DOUBLE PRECISION,
  total_calcium  DOUBLE PRECISION,
  log_count      BIGINT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    COALESCE(SUM(calories), 0),
    COALESCE(SUM(protein), 0),
    COALESCE(SUM(carbs), 0),
    COALESCE(SUM(fat), 0),
    COALESCE(SUM(sugar), 0),
    COALESCE(SUM(fiber), 0),
    COALESCE(SUM(sodium), 0),
    COALESCE(SUM(iron), 0),
    COALESCE(SUM(calcium), 0),
    COUNT(*)
  FROM food_logs
  WHERE user_id = p_user_id
    AND logged_at::date = p_date;
$$;

-- ─── Optimized RPC: Get squad leaderboard with live points (single query) ─
CREATE OR REPLACE FUNCTION get_squad_leaderboard_v2(
  limit_val INT DEFAULT 50
)
RETURNS TABLE (
  squad_id      UUID,
  squad_name    TEXT,
  total_points  BIGINT,
  member_count  BIGINT,
  leader_name   TEXT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    s.id,
    s.name,
    COALESCE(SUM(sm.contributed_points), 0),
    COUNT(sm.id),
    u.name
  FROM squads s
  LEFT JOIN squad_members sm ON sm.squad_id = s.id
  LEFT JOIN users u ON u.id = s.created_by
  GROUP BY s.id, s.name, u.name
  ORDER BY COALESCE(SUM(sm.contributed_points), 0) DESC
  LIMIT limit_val;
$$;

-- ─── Function: Get user's current league tier ──────────────────────────
CREATE OR REPLACE FUNCTION get_user_league_tier(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_points INT;
BEGIN
  SELECT league_points INTO v_points
  FROM users
  WHERE id = p_user_id;

  RETURN CASE
    WHEN v_points >= 10000 THEN 'celestial'
    WHEN v_points >= 7500  THEN 'diamante'
    WHEN v_points >= 5000  THEN 'platino'
    WHEN v_points >= 3000  THEN 'oro'
    WHEN v_points >= 2000  THEN 'plata'
    WHEN v_points >= 1000  THEN 'bronce_iii'
    WHEN v_points >= 500   THEN 'bronce_ii'
    WHEN v_points >= 200   THEN 'bronce_i'
    WHEN v_points >= 50    THEN 'hierro'
    ELSE 'madera'
  END;
END;
$$;

-- ─── Materialized view for global rankings (refreshed periodically) ─────
-- Improves leaderboard query performance by pre-computing ranks
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_global_ranking AS
SELECT
  u.id,
  u.name,
  u.avatar_url,
  u.name_color,
  u.league_points,
  u.current_streak,
  COALESCE(u.achievement_points, 0) AS achievement_points,
  ROW_NUMBER() OVER (ORDER BY u.league_points DESC) AS rank_position
FROM users u
WHERE u.league_points > 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_global_ranking_id
  ON mv_global_ranking (id);

CREATE INDEX IF NOT EXISTS idx_mv_global_ranking_rank
  ON mv_global_ranking (rank_position);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_global_ranking()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_global_ranking;
  RETURN NULL;
END;
$$;

-- Trigger to refresh ranking when league_points change
DROP TRIGGER IF EXISTS trg_refresh_ranking_on_point_change ON users;
CREATE TRIGGER trg_refresh_ranking_on_point_change
  AFTER UPDATE OF league_points ON users
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_global_ranking();

-- ─── Fix: Add ON DELETE CASCADE to foreign keys missing it ──────────────

-- squad_members: cascade delete when squad is deleted
ALTER TABLE public.squad_members
  DROP CONSTRAINT IF EXISTS squad_members_squad_id_fkey,
  ADD CONSTRAINT squad_members_squad_id_fkey
    FOREIGN KEY (squad_id) REFERENCES squads(id) ON DELETE CASCADE;

-- challenge_participants: cascade delete when challenge is deleted
ALTER TABLE public.challenge_participants
  DROP CONSTRAINT IF EXISTS challenge_participants_challenge_id_fkey,
  ADD CONSTRAINT challenge_participants_challenge_id_fkey
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE;

-- post_comments: cascade delete when post is deleted
ALTER TABLE public.post_comments
  DROP CONSTRAINT IF EXISTS post_comments_post_id_fkey,
  ADD CONSTRAINT post_comments_post_id_fkey
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

-- post_likes: cascade delete when post is deleted
ALTER TABLE public.post_likes
  DROP CONSTRAINT IF EXISTS post_likes_post_id_fkey,
  ADD CONSTRAINT post_likes_post_id_fkey
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

-- direct_messages: cascade delete when sender/receiver is deleted
ALTER TABLE public.direct_messages
  DROP CONSTRAINT IF EXISTS direct_messages_sender_id_fkey,
  ADD CONSTRAINT direct_messages_sender_id_fkey
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE public.direct_messages
  DROP CONSTRAINT IF EXISTS direct_messages_receiver_id_fkey,
  ADD CONSTRAINT direct_messages_receiver_id_fkey
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE;
