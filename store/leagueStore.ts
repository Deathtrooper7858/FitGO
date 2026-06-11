import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import { useAuthStore } from './authStore';
import { NotificationTriggers } from '../utils/notificationTriggers';
import { getLocalDateString } from '../utils/date';

// AsyncStorage adapter — SecureStore has a hard 2KB/key limit on Android which
// causes silent persist failures when leagueStore data grows (members list etc.)

// ─── Types ────────────────────────────────────────────────────────────────────

export type LeagueTier = 'bronce' | 'plata' | 'oro' | 'platino' | 'esmeralda' | 'diamante' | 'maestro' | 'leyenda' | 'titan' | 'celestial';

export interface SquadMember {
  user_id: string;
  name: string;
  avatar_url?: string;
  league_points: number;
  current_streak: number;
  name_color?: string;
}

export interface Squad {
  id: string;
  name: string;
  league_tier: LeagueTier;
  points: number;
  invite_code: string;
  created_by: string;
}

export interface PointLogEntry {
  id: string;
  points: number;
  reason: string;
  created_at: string;
}

interface LeagueStore {
  // State
  squad: Squad | null;
  members: SquadMember[];
  myPoints: number;
  myStreak: number;
  todayPointsEarned: number;
  lastPointsDate: string;
  rewardVisible: boolean;
  rewardPoints: number;
  loading: boolean;
  error: string | null;
  topSquads: Squad[];

  // Actions
  fetchMySquad: (userId: string) => Promise<void>;
  createSquad: (name: string, userId: string) => Promise<Squad | null>;
  joinSquadByCode: (code: string, userId: string) => Promise<boolean>;
  leaveSquad: (userId: string) => Promise<void>;
  awardPoints: (userId: string, points: number, reason: string) => Promise<void>;
  checkAndAwardMacroPoints: (
    userId: string,
    consumed: { calories: number; protein: number; carbs: number; fat: number },
    target: { calories: number; protein: number; carbs: number; fat: number }
  ) => Promise<void>;
  fetchTopSquads: () => Promise<void>;
  fetchSquadMembers: (squadId: string) => Promise<SquadMember[]>;
  removeMember: (squadId: string, userId: string) => Promise<boolean>;
  deleteSquad: (squadId: string) => Promise<boolean>;
  transferLeadership: (squadId: string, newOwnerId: string) => Promise<boolean>;
  showReward: (points: number) => void;
  hideReward: () => void;
  reset: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const POINTS = {
  MEAL_LOG: 10,
  MACRO_PERFECT: 100,
  SQUAD_SYNERGY: 50,
} as const;

const STREAK_MULTIPLIERS: Record<string, number> = {
  '3':  1.2,
  '8':  1.5,
  '15': 2.0,
};

function getStreakMultiplier(streak: number): number {
  if (streak >= 15) return 2.0;
  if (streak >= 8)  return 1.5;
  if (streak >= 3)  return 1.2;
  return 1.0;
}

function isWithinMargin(consumed: number, target: number, marginPct = 0.05): boolean {
  if (target === 0) return true;
  const ratio = consumed / target;
  return ratio >= (1 - marginPct) && ratio <= (1 + marginPct);
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useLeagueStore = create<LeagueStore>()(
  persist(
    (set, get) => ({
      squad: null,
      members: [],
      myPoints: 0,
      myStreak: 0,
      todayPointsEarned: 0,
      lastPointsDate: getLocalDateString(),
      rewardVisible: false,
      rewardPoints: 0,
      loading: false,
      error: null,
      topSquads: [],

  // ── Fetch the squad for the current user ────────────────────────────
  fetchMySquad: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      // Get squad membership
      const { data: membership, error: memberErr } = await supabase
        .from('squad_members')
        .select('squad_id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      // Network error: keep cached state, don't wipe
      if (memberErr) {
        console.warn('[League] fetchMySquad network error, keeping cache:', memberErr.message);
        set({ loading: false });
        return;
      }

      if (!membership) {
        // Definitively no squad in DB
        set({ squad: null, members: [], myPoints: 0, myStreak: 0, loading: false });
        return;
      }

      // Get squad info
      const { data: squadData, error: squadErr } = await supabase
        .from('squads')
        .select('*')
        .eq('id', membership.squad_id)
        .limit(1)
        .maybeSingle();

      if (squadErr) {
        console.warn('[League] Squad fetch error, keeping cache:', squadErr.message);
        set({ loading: false });
        return;
      }

      // Get leaderboard
      const { data: leaderboard, error: lbErr } = await supabase
        .rpc('get_squad_leaderboard', { p_squad_id: membership.squad_id });

      if (lbErr) console.warn('[League] Leaderboard error:', lbErr.message);

      // Get my own stats
      const { data: myStats } = await supabase
        .from('users')
        .select('league_points, current_streak')
        .eq('id', userId)
        .limit(1)
        .maybeSingle();

      set({
        squad: squadData as Squad,
        members: (leaderboard ?? []) as SquadMember[],
        myPoints: myStats?.league_points ?? 0,
        myStreak: myStats?.current_streak ?? 0,
        loading: false,
      });
    } catch (err: any) {
      // Never wipe squad on unknown error - keep cache
      console.warn('[League] fetchMySquad unexpected error, keeping cache:', err.message);
      set({ loading: false });
    }
  },

  // ── Fetch Top Squads via SECURITY DEFINER RPC (bypasses RLS) ────────────────
  fetchTopSquads: async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_top_squads_with_live_points', { p_limit: 10 });

      if (error) {
        // Fallback: direct table query with stored points
        console.warn('[League] fetchTopSquads RPC failed, falling back:', error.message);
        const { data: fallback, error: fbErr } = await supabase
          .from('squads')
          .select('*')
          .order('points', { ascending: false })
          .limit(10);
        if (!fbErr) set({ topSquads: (fallback ?? []) as Squad[] });
        return;
      }

      set({ topSquads: (data ?? []) as Squad[] });
    } catch (err) {
      console.warn('[League] fetchTopSquads unexpected error:', err);
    }
  },

  // ── Fetch arbitrary squad members ─────────────────────────────────────────
  fetchSquadMembers: async (squadId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_squad_leaderboard', { p_squad_id: squadId });
      if (error) {
        console.warn('[League] fetchSquadMembers error:', error.message);
        return [];
      }
      return (data || []) as SquadMember[];
    } catch (err: any) {
      console.warn('[League] fetchSquadMembers unexpected error:', err.message);
      return [];
    }
  },

  // ── Create a new squad ────────────────────────────────────────────────────
  createSquad: async (name: string, userId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('squads')
        .insert({ name, created_by: userId })
        .select()
        .single();

      if (error) throw error;

      // Auto-join the creator
      const { error: joinErr } = await supabase
        .from('squad_members')
        .insert({ squad_id: data.id, user_id: userId });
        
      if (joinErr) throw joinErr;

      // Reset points to 0 and add squad creator achievement
      const { profile } = useAuthStore.getState();
      const currentAchievements = profile?.unlockedAchievements || [];
      const newAchievements = currentAchievements.includes('squad_creator') 
        ? currentAchievements 
        : [...currentAchievements, 'squad_creator'];

      await supabase.from('users').update({ 
        league_points: 0,
        unlocked_achievements: newAchievements
      }).eq('id', userId);

      // Give 50 starting points
      set({ myPoints: 0, todayPointsEarned: 0 }); // reset locally
      
      await get().fetchMySquad(userId);
      await get().awardPoints(userId, 50, 'squad_created');
      
      return data as Squad;
    } catch (err: any) {
      console.error('[LeagueStore] Error creating squad:', err);
      set({ error: err.message, loading: false });
      return null;
    }
  },

  // ── Join a squad with an invite code ──────────────────────────────────────
  joinSquadByCode: async (code: string, userId: string) => {
    set({ loading: true, error: null });
    try {
      const { data: squadData, error: findErr } = await supabase
        .from('squads')
        .select('*')
        .eq('invite_code', code.trim().toLowerCase())
        .limit(1)
        .maybeSingle();

      if (findErr || !squadData) {
        set({ error: 'Código de squad inválido.', loading: false });
        return false;
      }

      const { error: joinErr } = await supabase
        .from('squad_members')
        .insert({ squad_id: squadData.id, user_id: userId });

      if (joinErr) {
        if (joinErr.message.includes('more than 5')) {
          set({ error: 'Este squad ya tiene 5 miembros.', loading: false });
        } else {
          set({ error: joinErr.message, loading: false });
        }
        return false;
      }

      // Reset points so they start fresh in the new squad
      await supabase.from('users').update({ league_points: 0 }).eq('id', userId);
      set({ myPoints: 0, todayPointsEarned: 0 });

      // Fetch existing members' push tokens to notify them
      const { data: membersInfo } = await supabase
        .from('squad_members')
        .select('users(expo_push_token)')
        .eq('squad_id', squadData.id);
      
      if (membersInfo) {
        const tokens = membersInfo.map(m => (m.users as any)?.expo_push_token).filter(Boolean);
        const { profile } = useAuthStore.getState();
        if (tokens.length > 0 && profile) {
          NotificationTriggers.social.memberJoined(tokens, profile.name || 'Alguien', squadData.name);
        }
      }

      await get().fetchMySquad(userId);
      return true;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  // ── Leave current squad ───────────────────────────────────────────────────
  leaveSquad: async (userId: string) => {
    const { squad } = get();
    if (!squad) return;
    await supabase
      .from('squad_members')
      .delete()
      .match({ squad_id: squad.id, user_id: userId });
    
    // Reset points
    await supabase.from('users').update({ league_points: 0 }).eq('id', userId);
    
    await supabase.rpc('recalculate_league_tier', { p_squad_id: squad.id });
    
    set({ squad: null, members: [], myPoints: 0, todayPointsEarned: 0 });
  },

  // ── Remove a member (leader only) ─────────────────────────────────────────
  removeMember: async (squadId: string, memberId: string) => {
    const { profile } = useAuthStore.getState();
    const { squad } = get();
    if (squad?.id !== squadId || squad?.created_by !== profile?.id) return false;

    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('squad_members')
        .delete()
        .match({ squad_id: squadId, user_id: memberId });
      
      if (error) throw error;

      await supabase.rpc('recalculate_league_tier', { p_squad_id: squadId });
      await get().fetchMySquad(profile!.id);

      // Notify kicked member
      const { data: memberData } = await supabase.from('users').select('expo_push_token').eq('id', memberId).limit(1).maybeSingle();
      if (memberData?.expo_push_token) {
        NotificationTriggers.social.memberKicked(memberData.expo_push_token, squad?.name || 'el squad');
      }
      
      return true;
    } catch (err: any) {
      console.error('[LeagueStore] Error removing member:', err);
      set({ error: err.message, loading: false });
      return false;
    }
  },

  // ── Delete squad ──────────────────────────────────────────────────────────
  deleteSquad: async (squadId: string) => {
    const { profile } = useAuthStore.getState();
    const { members, squad } = get();
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('squads')
        .delete()
        .match({ id: squadId, created_by: profile?.id });
      if (error) throw error;

      // Reset points for all members and notify them
      if (members.length > 0) {
        const memberIds = members.map(m => m.user_id);
        await supabase.from('users').update({ league_points: 0 }).in('id', memberIds);

        // Fetch tokens to notify
        const { data: memberTokens } = await supabase.from('users').select('expo_push_token').in('id', memberIds);
        if (memberTokens) {
          const tokens = memberTokens.map(m => m.expo_push_token).filter(Boolean);
          if (tokens.length > 0) {
            NotificationTriggers.social.squadDeleted(tokens as string[], squad?.name || 'Squad');
          }
        }
      }

      set({ squad: null, members: [], myPoints: 0, todayPointsEarned: 0, loading: false });
      return true;
    } catch (err: any) {
      console.error('[LeagueStore] Error deleting squad:', err);
      set({ error: err.message, loading: false });
      return false;
    }
  },

  // ── Transfer leadership ───────────────────────────────────────────────────
  transferLeadership: async (squadId: string, newOwnerId: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.rpc('transfer_squad_leadership', {
        p_squad_id: squadId,
        p_new_owner_id: newOwnerId,
      });
      if (error) throw error;
      const { profile } = useAuthStore.getState();
      if (profile?.id) await get().fetchMySquad(profile.id);
      return true;
    } catch (err: any) {
      console.error('[LeagueStore] Error transferring leadership:', err);
      set({ error: err.message, loading: false });
      return false;
    }
  },

  // ── Award generic points via RPC ──────────────────────────────────────────
  awardPoints: async (userId: string, points: number, reason: string) => {
    // Reset daily counter if date changed
    const today = getLocalDateString();
    if (get().lastPointsDate !== today) {
      set({ todayPointsEarned: 0, lastPointsDate: today });
    }

    const { myStreak, squad } = get();
    
    // GUARD: Only award points if the user is in a squad
    if (!squad) {
      __DEV__ && console.log(`[LeagueStore] 🚫 Skipping award of ${points} pts (reason: ${reason}) - user is not in a squad.`);
      return;
    }

    const multiplier = getStreakMultiplier(myStreak);
    const finalPoints = Math.round(points * multiplier);

    __DEV__ && console.log(`[LeagueStore] ⭐ Awarding ${finalPoints} pts (base: ${points}, streak: ${myStreak}, multiplier: ${multiplier}x, reason: ${reason})`);

    // Update local state immediately — UI reflects intent without waiting for network
    set(state => ({
      myPoints: state.myPoints + finalPoints,
      todayPointsEarned: state.todayPointsEarned + finalPoints,
    }));

    // Fire-and-forget: DB sync + tier recalculation + leaderboard refresh run in
    // background so they NEVER block the caller (e.g. addLog returning to the UI).
    void (async () => {
      try {
        const { error: rpcError } = await supabase.rpc('award_league_points', {
          p_user_id: userId,
          p_points: finalPoints,
          p_reason: reason,
        });

        if (rpcError) {
          console.warn('[LeagueStore] award_league_points RPC failed:', rpcError.message);
        }
      } catch (err: any) {
        console.warn('[LeagueStore] award_league_points exception:', err.message);
      }

      // Tier recalculation — also background, non-blocking
      if (squad?.id) {
        try {
          await supabase.rpc('recalculate_league_tier', { p_squad_id: squad.id });
        } catch (err: any) {
          // Non-fatal: tier will be corrected on next fetchMySquad
        }
      }

      // Refresh leaderboard in background — does NOT block the original call
      await get().fetchMySquad(userId);
    })();
  },

  // ── Award points after checking if macros are within 5% margin ───────────
  checkAndAwardMacroPoints: async (userId, consumed, target) => {
    const proteinOk  = isWithinMargin(consumed.protein,  target.protein);
    const carbsOk    = isWithinMargin(consumed.carbs,    target.carbs);
    const fatOk      = isWithinMargin(consumed.fat,      target.fat);
    const caloriesOk = isWithinMargin(consumed.calories, target.calories);

    if (proteinOk && carbsOk && fatOk && caloriesOk) {
      await get().awardPoints(userId, POINTS.MACRO_PERFECT, 'macro_perfect');
      get().showReward(POINTS.MACRO_PERFECT);
    }
  },



  // ── UI Reward animation control ────────────────────────────────────────────
  showReward: (points: number) => set({ rewardVisible: true, rewardPoints: points }),
  hideReward: () => set({ rewardVisible: false, rewardPoints: 0 }),

  reset: () => set({
    squad: null, members: [], myPoints: 0, myStreak: 0,
    todayPointsEarned: 0, lastPointsDate: getLocalDateString(),
    rewardVisible: false, rewardPoints: 0,
    loading: false, error: null,
  }),
    }),
    {
      name: 'ff-league-store-v2', // bumped to clear old SecureStore key
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        squad: state.squad,
        members: state.members,
        myPoints: state.myPoints,
        myStreak: state.myStreak,
      }),
    }
  )
);

export { POINTS, getStreakMultiplier };
