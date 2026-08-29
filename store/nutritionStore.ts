import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocalDateString } from '../utils/date';
import type { FoodItem } from '../services/foodDatabase';
import { createFoodLogSlice, initialFoodLogState } from './nutrition/foodLogSlice';
import { createStreakSlice, initialStreakState } from './nutrition/streakSlice';
import { createDailyMetricsSlice, initialDailyMetricsState } from './nutrition/dailyMetricsSlice';
import { createAiUsageSlice, initialAiUsageState } from './nutrition/aiUsageSlice';
import { selectDailyTotals } from './nutrition/selectors';
import type { DailyTotals } from './nutrition/selectors';
import type { FoodLog, ActivityLog } from './types';

export type { DailyTotals };

interface NutritionState {
  todayLogs: FoodLog[];
  selectedDate: string;
  streakDays: number;
  activeDays: Record<string, boolean>;
  plannedDays: number;
  favoriteFoods: FoodItem[];
  dailyWater: Record<string, number>;
  dailySteps: Record<string, number>;
  dailySleep: Record<string, number>;
  dailyNeat: Record<string, string>;
  dailyExercise: Record<string, string>;
  activityCals: number;
  activityLogs: ActivityLog[];
  aiPhotoUsageCount: number;
  aiTextUsageCount: number;
  lastAiUsageDate: string;

  addExtraSnack: () => Promise<void>;
  removeExtraSnack: () => Promise<void>;
  addLog: (log: FoodLog) => Promise<void>;
  removeLog: (id: string) => Promise<void>;
  updateLog: (id: string, updates: Partial<FoodLog>) => Promise<void>;
  setLogs: (logs: FoodLog[]) => void;
  addFavorite: (food: FoodItem) => void;
  removeFavorite: (id: string) => void;
  fetchLogs: (userId: string, date: string) => Promise<void>;
  fetchHistory: (userId: string) => Promise<void>;
  copyDayMeals: (sourceDate: string, targetDate: string) => Promise<void>;

  setStreak: (days: number) => void;
  updateActivity: (date: string) => void;

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

  checkAndResetAiLimit: () => void;
  incrementAiUsage: (mode: 'photo' | 'text') => void;

  setDate: (date: string) => void;
  reset: () => void;
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set, get) => ({
      ...initialFoodLogState,
      ...initialStreakState,
      ...initialDailyMetricsState,
      ...initialAiUsageState,

      ...createFoodLogSlice(set, get),
      ...createStreakSlice(set, get),
      ...createDailyMetricsSlice(set, get),
      ...createAiUsageSlice(set, get),

      setDate: (date) => set({ selectedDate: date }),

      reset: () => set({
        ...initialFoodLogState,
        ...initialStreakState,
        ...initialDailyMetricsState,
        ...initialAiUsageState,
        selectedDate: new Date().toLocaleDateString('en-CA'),
        lastAiUsageDate: new Date().toLocaleDateString('en-CA'),
      }),
    }),
    {
      name: 'ff-nutrition-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        const cutoffStr = getLocalDateString(cutoff);
        return {
          todayLogs: s.todayLogs.filter(l => l.loggedAt >= cutoffStr),
          streakDays: s.streakDays,
          dailyWater: Object.fromEntries(Object.entries(s.dailyWater).filter(([d]) => d >= cutoffStr)),
          dailySteps: Object.fromEntries(Object.entries(s.dailySteps).filter(([d]) => d >= cutoffStr)),
          dailySleep: Object.fromEntries(Object.entries(s.dailySleep).filter(([d]) => d >= cutoffStr)),
          activityCals: s.activityCals,
          dailyNeat: Object.fromEntries(Object.entries(s.dailyNeat).filter(([d]) => d >= cutoffStr)),
          dailyExercise: Object.fromEntries(Object.entries(s.dailyExercise).filter(([d]) => d >= cutoffStr)),
          activityLogs: s.activityLogs.filter(a => a.loggedAt >= cutoffStr),
          favoriteFoods: s.favoriteFoods,
          activeDays: s.activeDays,
          plannedDays: s.plannedDays,
          aiPhotoUsageCount: s.aiPhotoUsageCount,
          aiTextUsageCount: s.aiTextUsageCount,
          lastAiUsageDate: s.lastAiUsageDate,
        };
      },
    }
  )
);

export { selectDailyTotals };
