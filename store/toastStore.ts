import { create } from 'zustand';
import { AppNotification } from './types';

interface ToastState {
  toastQueue: AppNotification[];
  addToast: (achievement: AppNotification) => void;
  addNotification: (notification: Omit<AppNotification, 'id'>) => void;
  showNext: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toastQueue: [],
  addToast: (achievement) => set((state) => ({ toastQueue: [...state.toastQueue, achievement] })),
  addNotification: (notif) => set((state) => ({
    toastQueue: [...state.toastQueue, { ...notif, id: Date.now().toString() + Math.random() }]
  })),
  showNext: () => set((state) => ({ 
    toastQueue: state.toastQueue.slice(1)
  })),
}));
