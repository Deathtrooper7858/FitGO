import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CompletedWorkout {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  routineName: string;
  exercises: { name: string; englishName?: string; sets: number; reps: string; weight?: string; rpe?: string }[];
  completedAt: number; // timestamp
  userId?: string;
}

interface WorkoutHistoryState {
  workouts: CompletedWorkout[];
  addWorkout: (workout: Omit<CompletedWorkout, 'id' | 'completedAt' | 'userId'>) => void;
  removeWorkout: (id: string) => void;
  hasCompletedWorkoutToday: (date: string) => boolean;
  clearHistory: () => void;
  getWorkoutsForUser: (userId: string | undefined) => CompletedWorkout[];
}

export const useWorkoutHistoryStore = create<WorkoutHistoryState>()(
  persist(
    (set, get) => ({
      workouts: [],
      addWorkout: (workoutData) => set((state) => {
        // We do a soft require of authStore to avoid circular deps, or we can just import it.
        // Actually since we cannot import it easily due to potential circular dependencies,
        // it's better to pass userId from outside. But since we didn't change addWorkout signature,
        // let's dynamically require it.
        const authStore = require('./authStore').useAuthStore;
        const userId = authStore.getState().profile?.id;
        
        const newWorkout: CompletedWorkout = {
          ...workoutData,
          id: Math.random().toString(36).substring(2, 9),
          completedAt: Date.now(),
          userId,
        };
        // Remove any existing workout for the same date for THIS user
        const filtered = state.workouts.filter(w => !(w.date === workoutData.date && (!w.userId || w.userId === userId)));
        return { workouts: [newWorkout, ...filtered] };
      }),
      removeWorkout: (id) => set((state) => ({
        workouts: state.workouts.filter(w => w.id !== id)
      })),
      hasCompletedWorkoutToday: (date) => {
        const authStore = require('./authStore').useAuthStore;
        const userId = authStore.getState().profile?.id;
        return get().workouts.some(w => w.date === date && (!w.userId || w.userId === userId));
      },
      getWorkoutsForUser: (userId) => {
        return get().workouts.filter(w => !w.userId || w.userId === userId);
      },
      clearHistory: () => set({ workouts: [] }),
    }),
    {
      name: 'ff-workout-history',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
