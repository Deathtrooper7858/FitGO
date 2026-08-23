export interface AiUsageSlice {
  aiPhotoUsageCount: number;
  aiTextUsageCount: number;
  lastAiUsageDate: string;
  checkAndResetAiLimit: () => void;
  incrementAiUsage: (mode: 'photo' | 'text') => void;
}

export const initialAiUsageState = {
  aiPhotoUsageCount: 0,
  aiTextUsageCount: 0,
  lastAiUsageDate: new Date().toLocaleDateString('en-CA'),
};

export function createAiUsageSlice(set: any, get: any): AiUsageSlice {
  return {
    ...initialAiUsageState,

    checkAndResetAiLimit: () => {
      const today = new Date().toLocaleDateString('en-CA');
      if (get().lastAiUsageDate !== today) {
        set({ aiPhotoUsageCount: 0, aiTextUsageCount: 0, lastAiUsageDate: today });
      }
    },

    incrementAiUsage: (mode) => {
      get().checkAndResetAiLimit();
      if (mode === 'photo') {
        set((s: any) => ({ aiPhotoUsageCount: s.aiPhotoUsageCount + 1 }));
      } else {
        set((s: any) => ({ aiTextUsageCount: s.aiTextUsageCount + 1 }));
      }
    },
  };
}
