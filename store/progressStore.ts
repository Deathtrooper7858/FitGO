import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProgressPhoto, ProgressEvaluation } from './types';

interface ProgressState {
  photos:      ProgressPhoto[];
  evaluations: ProgressEvaluation[];
  _hydrated:   boolean;
  addPhoto:    (p: ProgressPhoto) => void;
  setPhotos:   (ps: ProgressPhoto[]) => void;
  addEvaluation:    (e: ProgressEvaluation) => void;
  deleteEvaluation: (id: string) => void;
  setEvaluations:   (es: ProgressEvaluation[]) => void;
  reset:       () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      photos:      [],
      evaluations: [],
      _hydrated:   false,
      addPhoto:  (p) => set((s) => ({ photos: [p, ...s.photos] })),
      setPhotos: (photos) => set({ photos }),
      addEvaluation: (e) =>
        set((s) => ({
          // Deduplicate by id in case of double-save during hydration
          evaluations: [e, ...s.evaluations.filter((x) => x.id !== e.id)],
        })),
      deleteEvaluation: (id) =>
        set((s) => ({ evaluations: s.evaluations.filter((e) => e.id !== id) })),
      setEvaluations: (evaluations) => set({ evaluations }),
      reset: () => set({ photos: [], evaluations: [] }),
    }),
    {
      name: 'ff-progress',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ photos: s.photos, evaluations: s.evaluations }),
      onRehydrateStorage: () => (_state, error) => {
        // Mark store as hydrated once AsyncStorage has finished loading
        if (!error) {
          useProgressStore.setState({ _hydrated: true });
        }
      },
    }
  )
);

/**
 * Waits until the progress store has been rehydrated from AsyncStorage before
 * performing a write. This prevents a race condition where a write happens
 * before hydration completes, causing the new data to be overwritten.
 */
export async function waitForProgressHydration(): Promise<void> {
  if (useProgressStore.getState()._hydrated) return;
  return new Promise<void>((resolve) => {
    const unsub = useProgressStore.subscribe((state) => {
      if (state._hydrated) {
        unsub();
        resolve();
      }
    });
    // Safety timeout: if hydration takes > 3 seconds, proceed anyway
    setTimeout(() => { unsub(); resolve(); }, 3000);
  });
}
