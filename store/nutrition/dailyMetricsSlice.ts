import type { ActivityLog } from '../types';
import { useAuthStore } from '../authStore';
import { useToastStore } from '../toastStore';
import { supabase } from '../../services/supabase';
import i18n from '../../i18n';
import { scheduleSyncDailyMetrics } from './utils';

export interface DailyMetricsSlice {
  activityCals: number;
  activityLogs: ActivityLog[];
  dailyWater: Record<string, number>;
  dailySteps: Record<string, number>;
  dailySleep: Record<string, number>;
  dailyNeat: Record<string, string>;
  dailyExercise: Record<string, string>;
  setWater: (ml: number) => void;
  addWater: (ml: number) => void;
  setSteps: (steps: number) => void;
  addSteps: (steps: number) => void;
  setSleep: (hours: number) => void;
  setActivity: (cals: number) => void;
  addActivityLog: (activity: ActivityLog) => Promise<void>;
  removeActivityLog: (id: string) => Promise<void>;
  updateActivityLog: (id: string, updates: Partial<ActivityLog>) => Promise<void>;
  setActivityLogs: (activities: ActivityLog[]) => void;
  setNeat: (level: string) => void;
  setExerciseLevel: (level: string) => void;
  syncDailyMetrics: () => Promise<void>;
}

export const initialDailyMetricsState = {
  activityCals: 0,
  activityLogs: [] as ActivityLog[],
  dailyWater: {} as Record<string, number>,
  dailySteps: {} as Record<string, number>,
  dailySleep: {} as Record<string, number>,
  dailyNeat: {} as Record<string, string>,
  dailyExercise: {} as Record<string, string>,
};

export function createDailyMetricsSlice(set: any, get: any): DailyMetricsSlice {
  return {
    ...initialDailyMetricsState,

    syncDailyMetrics: async () => {
      const date = get().selectedDate;
      const { profile } = useAuthStore.getState();
      if (!profile?.id) return;
      try {
        await supabase.from('daily_metrics').upsert({
          user_id: profile.id,
          date,
          water_ml: get().dailyWater[date] || 0,
          steps: get().dailySteps[date] || 0,
          sleep_hours: get().dailySleep[date] || 0,
          neat_level: get().dailyNeat[date] || null,
          exercise_level: get().dailyExercise[date] || null,
        }, { onConflict: 'user_id,date' });
      } catch (err) {
        console.error('[NutritionStore] syncDailyMetrics error:', err);
      }
    },

    setWater: (ml) => {
      const safeml = Math.max(0, ml);
      set((s: any) => ({ dailyWater: { ...s.dailyWater, [s.selectedDate]: safeml } }));
      if (safeml > 0) get().updateActivity(get().selectedDate);
      useToastStore.getState().addNotification({
        title: i18n.t('tracker.waterUpdated'), description: i18n.t('tracker.waterTodayTotal', { ml: safeml }),
        iconType: 'lucide', lucideIcon: 'Droplets', tier: 'info', isAchievement: false,
      });
      scheduleSyncDailyMetrics(() => get().syncDailyMetrics());
    },

    addWater: (ml) => {
      const date = get().selectedDate;
      set((s: any) => ({ dailyWater: { ...s.dailyWater, [date]: Math.max(0, (s.dailyWater[date] || 0) + ml) } }));
      const newVal = get().dailyWater[date] || 0;
      if (newVal > 0) get().updateActivity(date);
      useToastStore.getState().addNotification({
        title: i18n.t('tracker.waterAdded'), description: i18n.t('tracker.waterAddedDesc', { ml, total: newVal }),
        iconType: 'lucide', lucideIcon: 'GlassWater', tier: 'info', isAchievement: false,
      });
      scheduleSyncDailyMetrics(() => get().syncDailyMetrics());
    },

    setSteps: (steps) => {
      const safeSteps = Math.max(0, steps);
      set((s: any) => ({ dailySteps: { ...s.dailySteps, [s.selectedDate]: safeSteps } }));
      if (safeSteps > 0) get().updateActivity(get().selectedDate);
      scheduleSyncDailyMetrics(() => get().syncDailyMetrics());
    },

    addSteps: (steps) => {
      const date = get().selectedDate;
      set((s: any) => ({ dailySteps: { ...s.dailySteps, [date]: Math.max(0, (s.dailySteps[date] || 0) + steps) } }));
      const newVal = get().dailySteps[date] || 0;
      if (newVal > 0) get().updateActivity(date);
      useToastStore.getState().addNotification({
        title: i18n.t('tracker.stepsAdded'), description: i18n.t('tracker.stepsAddedDesc', { steps, total: newVal }),
        iconType: 'lucide', lucideIcon: 'Footprints', tier: 'success', isAchievement: false,
      });
      scheduleSyncDailyMetrics(() => get().syncDailyMetrics());
    },

    setSleep: (hours) => {
      const date = get().selectedDate;
      set((s: any) => ({ dailySleep: { ...s.dailySleep, [date]: hours } }));
      if (hours > 0) get().updateActivity(date);
      useToastStore.getState().addNotification({
        title: i18n.t('tracker.sleepRegistered'), description: i18n.t('tracker.sleepRegisteredDesc', { hours }),
        iconType: 'lucide', lucideIcon: 'Moon', tier: 'plata', isAchievement: false,
      });
      scheduleSyncDailyMetrics(() => get().syncDailyMetrics());
    },

    setActivity: (activityCals) => set({ activityCals }),

    addActivityLog: async (activity) => {
      set((s: any) => ({ activityLogs: [...s.activityLogs, activity] }));
      get().updateActivity(activity.loggedAt.split('T')[0]);
      useToastStore.getState().addNotification({
        title: i18n.t('tracker.exerciseAdded'), description: i18n.t('tracker.exerciseAddedDesc', { name: activity.name, duration: activity.duration, calories: activity.calories }),
        icon: activity.icon || '🔥', iconType: 'emoji', tier: 'success', isAchievement: false,
      });
      const { profile } = useAuthStore.getState();
      if (profile?.id) {
        void (async () => {
          try {
            const { error } = await supabase.from('activity_logs').insert({
              id: activity.id, user_id: profile.id, name: activity.name, icon: activity.icon,
              calories: activity.calories, duration: activity.duration, logged_at: activity.loggedAt.split('T')[0],
            });
            if (error) console.warn('[NutritionStore] addActivityLog Supabase sync error (offline?):', error.message);
          } catch (err: any) {
            console.warn('[NutritionStore] addActivityLog network error (offline?):', err?.message);
          }
        })();
      }
    },

    removeActivityLog: async (id) => {
      set((s: any) => ({ activityLogs: s.activityLogs.filter((a: ActivityLog) => a.id !== id) }));
      void (async () => {
        try {
          const { error } = await supabase.from('activity_logs').delete().eq('id', id);
          if (error) console.warn('[NutritionStore] removeActivityLog Supabase sync error (offline?):', error.message);
        } catch (err: any) {
          console.warn('[NutritionStore] removeActivityLog network error (offline?):', err?.message);
        }
      })();
    },

    updateActivityLog: async (id, updates) => {
      set((s: any) => ({ activityLogs: s.activityLogs.map((a: ActivityLog) => a.id === id ? { ...a, ...updates } : a) }));
      try {
        await supabase.from('activity_logs').update({
          name: updates.name, icon: updates.icon, calories: updates.calories, duration: updates.duration,
        }).eq('id', id);
      } catch (err) {
        console.error('[NutritionStore] updateActivityLog sync error:', err);
      }
    },

    setActivityLogs: (activityLogs) => set({ activityLogs }),

    setNeat: (level) => {
      set((s: any) => ({ dailyNeat: { ...s.dailyNeat, [s.selectedDate]: level } }));
      scheduleSyncDailyMetrics(() => get().syncDailyMetrics());
    },

    setExerciseLevel: (level) => {
      set((s: any) => ({ dailyExercise: { ...s.dailyExercise, [s.selectedDate]: level } }));
      scheduleSyncDailyMetrics(() => get().syncDailyMetrics());
    },
  };
}
