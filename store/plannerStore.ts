/**
 * plannerStore.ts
 *
 * Lightweight Zustand store that caches the generated meal and workout plans
 * in AsyncStorage so they persist across tab navigation, app backgrounds, and
 * restarts. The Supabase database remains the source of truth; this store acts
 * as a fast local cache.
 *
 * Cleared automatically when the user generates a new plan or when the week
 * rolls over (week_start mismatch).
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SecureStorage } from '../utils/storage';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PlanItem {
  meal: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface WorkoutRoutine {
  name: string;
  exercises: { name: string; englishName?: string; sets: number; reps: string; rest: string }[];
}

export interface ShoppingListGroup {
  category: string;
  items: { name: string; quantity: string; price: number }[];
}

interface PlannerState {
  /** Cached 7-day nutrition plan, keyed by day abbreviation (Mon, Tue, …) */
  mealPlans: Record<string, PlanItem[]>;
  /** Cached 7-day workout plan, keyed by day abbreviation */
  workoutPlans: Record<string, WorkoutRoutine>;
  /** ISO date (YYYY-MM-DD) of Monday for the week these plans belong to */
  weekStart: string | null;
  /** Cached AI-generated shopping list */
  shoppingList: ShoppingListGroup[] | null;
  /** AI-generated weekly nutrition analysis text */
  weeklyAnalysis: string | null;
  /** Optional warning for risky plans */
  warning: string | null;
  /** The user ID this cached plan belongs to */
  userId: string | null;

  setMealPlans: (plans: Record<string, PlanItem[]>, weekStart: string, warning?: string, userId?: string) => void;
  setWorkoutPlans: (plans: Record<string, WorkoutRoutine>, weekStart: string, warning?: string, userId?: string) => void;
  setWeeklyAnalysis: (text: string) => void;
  setShoppingList: (list: ShoppingListGroup[]) => void;
  clearPlans: () => void;
  clearMealPlans: () => void;
  clearWorkoutPlans: () => void;
  swapMeal: (day: string, mealIndex: number, newMeal: PlanItem) => void;
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set) => ({
      mealPlans:      {},
      workoutPlans:   {},
      weekStart:      null,
      shoppingList:   null,
      weeklyAnalysis: null,
      warning:        null,
      userId:         null,

      setMealPlans: (plans, weekStart, warning, userId) =>
        set({ mealPlans: plans, weekStart, warning: warning || null, userId: userId || null }),

      setWorkoutPlans: (plans, weekStart, warning, userId) =>
        set({ workoutPlans: plans, weekStart, warning: warning || null, userId: userId || null }),

      setWeeklyAnalysis: (text) =>
        set({ weeklyAnalysis: text }),

      setShoppingList: (list) =>
        set( {shoppingList: list }),

      /** Called when the user generates a fresh plan or when the week changes. */
      clearPlans: () =>
        set({ mealPlans: {}, workoutPlans: {}, weekStart: null, shoppingList: null, weeklyAnalysis: null, warning: null, userId: null }),
        
      clearMealPlans: () => set({ mealPlans: {}, shoppingList: null }),
      clearWorkoutPlans: () => set({ workoutPlans: {} }),
      swapMeal: (day, mealIndex, newMeal) => set((state) => {
        const dayMeals = [...(state.mealPlans[day] || [])];
        if (dayMeals[mealIndex]) {
          dayMeals[mealIndex] = newMeal;
        }
        return { mealPlans: { ...state.mealPlans, [day]: dayMeals }, shoppingList: null };
      }),
    }),
    {
      name: 'ff-planner',
      storage: createJSONStorage(() => SecureStorage),
    }
  )
);
