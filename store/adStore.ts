import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const MAX_AI_ENERGY = 5;
export const REWARD_AMOUNT = 3;

interface AdState {
  aiEnergy: number;
  lastEnergyReset: string | null;
  checkAndResetEnergy: () => void;
  consumeEnergy: (amount?: number) => boolean;
  addEnergy: (amount: number) => void;
}

export const useAdStore = create<AdState>()(
  persist(
    (set, get) => ({
      aiEnergy: MAX_AI_ENERGY,
      lastEnergyReset: new Date().toDateString(),

      checkAndResetEnergy: () => {
        const today = new Date().toDateString();
        const { lastEnergyReset, aiEnergy } = get();
        if (lastEnergyReset !== today) {
          // It's a new day, reset to MAX_AI_ENERGY (but keep if they have more somehow)
          set({
            aiEnergy: Math.max(MAX_AI_ENERGY, aiEnergy),
            lastEnergyReset: today,
          });
        }
      },

      consumeEnergy: (amount = 1) => {
        get().checkAndResetEnergy();
        const currentEnergy = get().aiEnergy;
        if (currentEnergy >= amount) {
          set({ aiEnergy: currentEnergy - amount });
          return true;
        }
        return false;
      },

      addEnergy: (amount) => {
        set((state) => ({ aiEnergy: state.aiEnergy + amount }));
      },
    }),
    {
      name: 'fitgo-ad-storage',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);
