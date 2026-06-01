import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { ProgressPhoto, ProgressEvaluation } from './types';

// Secure storage adapter for Zustand
const secureStorage = {
  getItem: async (name: string) => {
    return (await SecureStore.getItemAsync(name)) || null;
  },
  setItem: async (name: string, value: string) => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string) => {
    await SecureStore.deleteItemAsync(name);
  },
};

interface ProgressState {
  photos:     ProgressPhoto[];
  evaluations: ProgressEvaluation[];
  addPhoto:   (p: ProgressPhoto) => void;
  setPhotos:  (ps: ProgressPhoto[]) => void;
  addEvaluation: (e: ProgressEvaluation) => void;
  setEvaluations: (es: ProgressEvaluation[]) => void;
  reset:      () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      photos:   [],
      evaluations: [],
      addPhoto: (p) => set((s) => ({ photos: [p, ...s.photos] })),
      setPhotos:(photos) => set({ photos }),
      addEvaluation: (e) => set((s) => ({ evaluations: [e, ...s.evaluations] })),
      setEvaluations: (evaluations) => set({ evaluations }),
      reset: () => set({ photos: [], evaluations: [] }),
    }),
    {
      name: 'ff-progress',
      storage: createJSONStorage(() => secureStorage),
      partialize: (s) => ({ photos: s.photos, evaluations: s.evaluations }),
    }
  )
);
