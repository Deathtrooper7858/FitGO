import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CompletedWorkout {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  routineName: string;
  exercises: { name: string; sets: number; reps: string }[];
  completedAt: number; // timestamp
}

interface WorkoutHistoryState {
  workouts: CompletedWorkout[];
  addWorkout: (workout: Omit<CompletedWorkout, 'id' | 'completedAt'>) => void;
  removeWorkout: (id: string) => void;
  hasCompletedWorkoutToday: (date: string) => boolean;
  clearHistory: () => void;
}

export const useWorkoutHistoryStore = create<WorkoutHistoryState>()(
  persist(
    (set, get) => ({
      workouts: [],
      addWorkout: (workoutData) => set((state) => {
        const newWorkout: CompletedWorkout = {
          ...workoutData,
          id: Math.random().toString(36).substring(2, 9),
          completedAt: Date.now(),
        };
        // Remove any existing workout for the same date to avoid duplicates if they press it again
        const filtered = state.workouts.filter(w => w.date !== workoutData.date);
        return { workouts: [newWorkout, ...filtered] };
      }),
      removeWorkout: (id) => set((state) => ({
        workouts: state.workouts.filter(w => w.id !== id)
      })),
      hasCompletedWorkoutToday: (date) => {
        return get().workouts.some(w => w.date === date);
      },
      clearHistory: () => set({ workouts: [] }),
    }),
    {
      name: 'ff-workout-history',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
