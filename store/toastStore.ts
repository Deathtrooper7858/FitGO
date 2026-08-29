import { create } from 'zustand';
import { AppNotification } from './types';

interface ToastState {
  toastQueue: AppNotification[];
  addToast: (achievement: AppNotification) => void;
  addNotification: (notification: Omit<AppNotification, 'id'>) => void;
  showToast: (opts: { text: string; title?: string; type?: 'success' | 'info' | 'warning' }) => void;
  showNext: () => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toastQueue: [],
  addToast: (achievement) => set((state) => ({ toastQueue: [...state.toastQueue, achievement] })),
  addNotification: (notif) => set((state) => ({
    toastQueue: [...state.toastQueue, { ...notif, id: Date.now().toString() + Math.random() }]
  })),
  showToast: (opts) => {
    const tier = opts.type || 'info';
    get().addNotification({
      title: opts.title || (tier === 'success' ? 'Éxito' : 'FitGO'),
      description: opts.text,
      icon: tier === 'success' ? '✓' : 'ℹ️',
      iconType: 'emoji',
      tier,
    });
  },
  showNext: () => set((state) => ({ 
    toastQueue: state.toastQueue.slice(1)
  })),
}));
