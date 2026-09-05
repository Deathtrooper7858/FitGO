import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

export type FastingProtocol = '16:8' | '18:6' | '14:10' | '20:4' | 'custom';

export const FASTING_PRESETS: Record<FastingProtocol, number> = {
  '14:10': 14,
  '16:8': 16,
  '18:6': 18,
  '20:4': 20,
  'custom': 16,
};

export interface FastingSession {
  id: string;
  protocol: FastingProtocol;
  startTime: number; // epoch ms
  endTime: number;   // epoch ms
  targetHours: number;
  completed: boolean;
}

interface FastingState {
  isFasting: boolean;
  protocol: FastingProtocol;
  targetHours: number;
  startTime: number | null;
  history: FastingSession[];

  startFast: (protocol?: FastingProtocol, targetHours?: number) => void;
  endFast: () => void;
  cancelFast: () => void;
  setProtocol: (protocol: FastingProtocol, targetHours?: number) => void;
}

export const useFastingStore = create<FastingState>()(
  persist(
    (set, get) => ({
      isFasting: false,
      protocol: '16:8',
      targetHours: 16,
      startTime: null,
      history: [],

      startFast: (protocol = '16:8', targetHours) => {
        const hours = targetHours || FASTING_PRESETS[protocol] || 16;
        set({
          isFasting: true,
          protocol,
          targetHours: hours,
          startTime: Date.now(),
        });
      },

      endFast: () => {
        const { isFasting, protocol, startTime, targetHours, history } = get();
        if (!isFasting || !startTime) return;

        const now = Date.now();
        const durationHours = (now - startTime) / (1000 * 60 * 60);
        const session: FastingSession = {
          id: Crypto.randomUUID(),
          protocol,
          startTime,
          endTime: now,
          targetHours,
          completed: durationHours >= targetHours,
        };

        set({
          isFasting: false,
          startTime: null,
          history: [session, ...history].slice(0, 30), // keep last 30 sessions
        });
      },

      cancelFast: () => {
        set({ isFasting: false, startTime: null });
      },

      setProtocol: (protocol, targetHours) => {
        const hours = targetHours || FASTING_PRESETS[protocol] || 16;
        set({ protocol, targetHours: hours });
      },
    }),
    {
      name: 'fitgo-fasting-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
