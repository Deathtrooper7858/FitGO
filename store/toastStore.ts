import { create } from 'zustand';
import { Achievement } from '../hooks/useAchievements';

interface ToastState {
  toastQueue: Achievement[];
  addToast: (achievement: Achievement) => void;
  showNext: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toastQueue: [],
  addToast: (achievement) => set((state) => ({ toastQueue: [...state.toastQueue, achievement] })),
  showNext: () => set((state) => ({ 
    toastQueue: state.toastQueue.slice(1)
  })),
}));
