-- =============================================================================
-- FITGO PRODUCTION DATABASE MIGRATION & SECURITY AUDIT SCRIPT (IDEMPOTENT)
-- Version: 2.6.2 (Build Code 45)
-- Date: 2026-10-28
-- Description:
--   1. Role integrity & constraint update (master, maestro, owner, admin, pro).
--   2. Premium color persistence RPC (SECURITY DEFINER).
--   3. Safe Pro upgrading & downgrading with role privilege immunity.
--   4. Atomic challenge completion & points distribution with row-level locks.
--   5. League & squad point integrity, streak multipliers & tier recalculation.
--   6. Content moderation & reports infrastructure for social safety.
--   7. High-performance composite indexes for instant ranking & feed queries.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. USER ROLES & PRIVILEGE HIERARCHY
-- -----------------------------------------------------------------------------

-- Drop existing role constraints if they exist
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.users'::regclass 
          AND (conname LIKE '%role%' OR pg_get_constraintdef(oid) LIKE '%role%')
    ) LOOP
        EXECUTE 'ALTER TABLE public.users DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

ALTER TABLE public.users
ADD CONSTRAINT users_role_check 
CHECK (role IN ('user', 'pro_user', 'admin', 'super_admin', 'owner', 'master', 'maestro'));

-- Ensure essential columns exist with proper default values
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS premium_color TEXT,
ADD COLUMN IF NOT EXISTS name_color TEXT,
ADD COLUMN IF NOT EXISTS squad_points INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS league_points INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0;

-- -----------------------------------------------------------------------------
-- 2. PREMIUM COLOR RPC (Guarantees color persistence regardless of client RLS)
-- -----------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.set_user_premium_color(text) CASCADE;

CREATE OR REPLACE FUNCTION public.set_user_premium_color(p_color TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_is_pro BOOLEAN;
    v_role TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Verify user is Pro or has privileged role
    SELECT is_pro, role INTO v_is_pro, v_role
    FROM public.users
    WHERE id = v_user_id;

    IF v_is_pro OR v_role IN ('owner', 'master', 'maestro', 'super_admin', 'admin', 'pro_user') THEN
        UPDATE public.users
        SET 
            premium_color = p_color,
            name_color = COALESCE(p_color, name_color),
            updated_at = NOW()
        WHERE id = v_user_id;
    ELSE
        -- If non-pro tries to set a custom hex color, reset to null
        UPDATE public.users
        SET 
            premium_color = NULL,
            updated_at = NOW()
        WHERE id = v_user_id;
    END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- 3. SAFE PRO UPGRADE & DOWNGRADE (With Master / Owner Role Protection)
-- -----------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.upgrade_to_pro_user(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.upgrade_to_pro_user(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role FROM public.users WHERE id = target_user_id;

    IF v_role IN ('owner', 'master', 'maestro', 'super_admin', 'admin') THEN
        -- Never overwrite privileged staff roles
        UPDATE public.users
        SET is_pro = TRUE, updated_at = NOW()
        WHERE id = target_user_id;
    ELSE
        UPDATE public.users
        SET is_pro = TRUE, role = 'pro_user', updated_at = NOW()
        WHERE id = target_user_id;
    END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.downgrade_from_pro(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.downgrade_from_pro(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role FROM public.users WHERE id = target_user_id;

    -- Privileged roles can NEVER be downgraded to standard user
    IF v_role IN ('owner', 'master', 'maestro', 'super_admin', 'admin') THEN
        RETURN;
    END IF;

    UPDATE public.users
    SET 
        is_pro = FALSE,
        role = 'user',
        premium_color = NULL,
        name_color = NULL,
        pro_expires_at = NULL,
        pro_will_renew = FALSE,
        updated_at = NOW()
    WHERE id = target_user_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- 4. LEAGUE & SQUAD POINTS ENGINE (Streak Multipliers & Tier Recalculation)
-- -----------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.award_league_points(uuid, integer, text) CASCADE;
DROP FUNCTION IF EXISTS public.award_league_points(uuid, bigint, text) CASCADE;
DROP FUNCTION IF EXISTS public.award_league_points(uuid, integer) CASCADE;

CREATE OR REPLACE FUNCTION public.award_league_points(
    p_user_id UUID,
    p_points INT,
    p_reason TEXT DEFAULT 'general'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_streak INT := 0;
    v_multiplier NUMERIC := 1.0;
    v_final_points INT;
    v_squad_id UUID;
BEGIN
    IF p_points <= 0 THEN
        RETURN;
    END IF;

    SELECT current_streak INTO v_streak
    FROM public.users
    WHERE id = p_user_id;

    -- Calculate streak multiplier
    IF v_streak >= 15 THEN
        v_multiplier := 2.0;
    ELSIF v_streak >= 8 THEN
        v_multiplier := 1.5;
    ELSIF v_streak >= 3 THEN
        v_multiplier := 1.2;
    ELSE
        v_multiplier := 1.0;
    END IF;

    v_final_points := ROUND(p_points * v_multiplier);

    -- 1. Update user total league_points (never wiped)
    UPDATE public.users
    SET 
        league_points = COALESCE(league_points, 0) + v_final_points,
        squad_points = COALESCE(squad_points, 0) + v_final_points
    WHERE id = p_user_id;

    -- 2. If user is in a squad, update contributed points in squad_members
    SELECT squad_id INTO v_squad_id
    FROM public.squad_members
    WHERE user_id = p_user_id
    LIMIT 1;

    IF v_squad_id IS NOT NULL THEN
        UPDATE public.squad_members
        SET contributed_points = COALESCE(contributed_points, 0) + v_final_points
        WHERE squad_id = v_squad_id AND user_id = p_user_id;

        -- Recalculate squad tier
        PERFORM public.recalculate_league_tier(v_squad_id);
    END IF;

    -- 3. Log points entry for audit trail
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'point_logs') THEN
        INSERT INTO public.point_logs (user_id, points, reason, created_at)
        VALUES (p_user_id, v_final_points, p_reason, NOW());
    END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.recalculate_league_tier(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.recalculate_league_tier(p_squad_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_points INT := 0;
    v_tier TEXT := 'bronce';
BEGIN
    SELECT COALESCE(SUM(contributed_points), 0) INTO v_total_points
    FROM public.squad_members
    WHERE squad_id = p_squad_id;

    IF v_total_points >= 15000 THEN
        v_tier := 'celestial';
    ELSIF v_total_points >= 10000 THEN
        v_tier := 'titan';
    ELSIF v_total_points >= 6000 THEN
        v_tier := 'leyenda';
    ELSIF v_total_points >= 3500 THEN
        v_tier := 'maestro';
    ELSIF v_total_points >= 2000 THEN
        v_tier := 'diamante';
    ELSIF v_total_points >= 1000 THEN
        v_tier := 'esmeralda';
    ELSIF v_total_points >= 500 THEN
        v_tier := 'platino';
    ELSIF v_total_points >= 200 THEN
        v_tier := 'oro';
    ELSIF v_total_points >= 50 THEN
        v_tier := 'plata';
    ELSE
        v_tier := 'bronce';
    END IF;

    UPDATE public.squads
    SET 
        points = v_total_points,
        league_tier = v_tier,
        updated_at = NOW()
    WHERE id = p_squad_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- 5. ATOMIC CHALLENGE COMPLETION & REWARDS
-- -----------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.complete_challenge_atomic(uuid, uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.complete_challenge_atomic(
    p_challenge_id UUID,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_challenge RECORD;
    v_participant RECORD;
    v_reward INT := 50;
BEGIN
    -- Acquire exclusive row lock on challenge
    SELECT * INTO v_challenge
    FROM public.challenges
    WHERE id = p_challenge_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Challenge not found';
    END IF;

    -- Verify user participation
    SELECT * INTO v_participant
    FROM public.challenge_participants
    WHERE challenge_id = p_challenge_id AND user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User is not a participant in this challenge';
    END IF;

    -- If already completed by this user, return early
    IF v_participant.status = 'completed' THEN
        RETURN jsonb_build_object('completed', true, 'reward_points', 0, 'already_completed', true);
    END IF;

    -- Calculate reward points based on challenge definition
    v_reward := COALESCE(v_challenge.reward_points, 50);

    -- Mark user as completed
    UPDATE public.challenge_participants
    SET status = 'completed', completed_at = NOW()
    WHERE challenge_id = p_challenge_id AND user_id = p_user_id;

    -- Award league points to user
    PERFORM public.award_league_points(p_user_id, v_reward, 'challenge_completed');

    -- Check if all participants have completed to update global challenge status
    IF NOT EXISTS (
        SELECT 1 FROM public.challenge_participants
        WHERE challenge_id = p_challenge_id AND status != 'completed' AND status != 'surrendered'
    ) THEN
        UPDATE public.challenges
        SET status = 'completed', updated_at = NOW()
        WHERE id = p_challenge_id;
    END IF;

    RETURN jsonb_build_object('completed', true, 'reward_points', v_reward);
END;
$$;

-- -----------------------------------------------------------------------------
-- 6. ATOMIC SQUAD CREATION & LEADERBOARD
-- -----------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.create_squad_atomic(text, uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.create_squad_atomic(
    p_name TEXT,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_squad_id UUID;
    v_invite_code TEXT;
    v_squad RECORD;
BEGIN
    -- Generate unique invite code (6 chars)
    v_invite_code := LOWER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));

    -- Insert squad
    INSERT INTO public.squads (name, invite_code, created_by, points, league_tier)
    VALUES (p_name, v_invite_code, p_user_id, 0, 'bronce')
    RETURNING id INTO v_squad_id;

    -- Insert creator as first member
    INSERT INTO public.squad_members (squad_id, user_id, contributed_points)
    VALUES (v_squad_id, p_user_id, 0);

    SELECT * INTO v_squad FROM public.squads WHERE id = v_squad_id;
    RETURN to_jsonb(v_squad);
END;
$$;

-- Drop function explicitly before recreation to avoid 42P13 return type conflicts
DROP FUNCTION IF EXISTS public.get_top_squads_with_live_points(integer) CASCADE;
DROP FUNCTION IF EXISTS public.get_top_squads_with_live_points() CASCADE;

CREATE OR REPLACE FUNCTION public.get_top_squads_with_live_points(p_limit integer DEFAULT 10)
RETURNS TABLE (
    id            uuid,
    name          text,
    league_tier   text,
    invite_code   text,
    created_by    uuid,
    points        bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.name,
        s.league_tier::text,
        s.invite_code,
        s.created_by,
        s.points::bigint AS points
    FROM public.squads s
    ORDER BY s.points DESC, s.created_at ASC
    LIMIT p_limit;
END;
$$;

-- -----------------------------------------------------------------------------
-- 7. CONTENT MODERATION & REPORTS INFRASTRUCTURE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.content_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content_id TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'message', 'user')),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.users(id)
);

ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to submit reports
DROP POLICY IF EXISTS "Users can insert reports" ON public.content_reports;
CREATE POLICY "Users can insert reports"
ON public.content_reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

-- Allow staff to read and review reports
DROP POLICY IF EXISTS "Staff can view reports" ON public.content_reports;
CREATE POLICY "Staff can view reports"
ON public.content_reports FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() 
        AND role IN ('owner', 'master', 'maestro', 'super_admin', 'admin')
    )
);

-- -----------------------------------------------------------------------------
-- 8. HIGH-PERFORMANCE DATABASE INDEXES
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_users_league_points ON public.users (league_points DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);
CREATE INDEX IF NOT EXISTS idx_squad_members_squad_id ON public.squad_members (squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_members_user_id ON public.squad_members (user_id);
CREATE INDEX IF NOT EXISTS idx_squads_points_tier ON public.squads (points DESC, league_tier);
CREATE INDEX IF NOT EXISTS idx_challenges_status_end_date ON public.challenges (status, end_date);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON public.content_reports (status, created_at DESC);

COMMIT;
