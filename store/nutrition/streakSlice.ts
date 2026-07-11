import { getLocalDateString } from '../../utils/date';
import { useAuthStore } from '../authStore';
import { useLeagueStore } from '../leagueStore';
import { supabase } from '../../services/supabase';
import { memoRecalculateStreak } from './utils';

export interface StreakSlice {
  streakDays: number;
  activeDays: Record<string, boolean>;
  plannedDays: number;
  setStreak: (days: number) => void;
  updateActivity: (date: string) => void;
}

export const initialStreakState = {
  streakDays: 0,
  activeDays: {} as Record<string, boolean>,
  plannedDays: 0,
};

export function createStreakSlice(set: any, get: any): StreakSlice {
  return {
    ...initialStreakState,

    setStreak: (streakDays) => set({ streakDays }),

    updateActivity: (date) => {
      const { activeDays } = get();
      if (activeDays[date]) return;
      if (date !== getLocalDateString()) return;

      const newActiveDays = { ...activeDays, [date]: true };
      const newPlannedDays = Object.keys(newActiveDays).length;
      const streak = memoRecalculateStreak(newActiveDays);

      set({ activeDays: newActiveDays, plannedDays: newPlannedDays, streakDays: streak });

      const { profile } = useAuthStore.getState();
      if (profile?.id) {
        void supabase.from('users').update({ current_streak: streak }).eq('id', profile.id);
        useLeagueStore.setState({ myStreak: streak });
      }
    },
  };
}
