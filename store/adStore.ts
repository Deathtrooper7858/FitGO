import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const MAX_AI_ENERGY = 5;
export const REWARD_AMOUNT = 3;

/** Duration in ms that a rewarded ad grants access to a premium feature */
export const AD_ACCESS_DURATION_MS = 10 * 60 * 1000; // 10 minutes

interface AdState {
  aiEnergy: number;
  lastEnergyReset: string | null;
  /** Maps featureId to its Unix expiration timestamp (ms). */
  premiumAdAccess: Record<string, number>;
  checkAndResetEnergy: () => void;
  consumeEnergy: (amount?: number) => boolean;
  addEnergy: (amount: number) => void;
  /** Call this after a rewarded ad is earned to grant 10 min of premium access for a specific feature */
  grantPremiumAdAccess: (featureId: string) => void;
  /** Returns true if ad-granted premium access is still valid for the given feature */
  hasPremiumAdAccess: (featureId: string) => boolean;
  /** Remaining seconds of ad access for the feature, 0 if expired */
  premiumAdRemainingSeconds: (featureId: string) => number;
}

export const useAdStore = create<AdState>()(
  persist(
    (set, get) => ({
      aiEnergy: MAX_AI_ENERGY,
      lastEnergyReset: new Date().toDateString(),
      premiumAdAccess: {},

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

      grantPremiumAdAccess: (featureId: string) => {
        set((state) => ({
          premiumAdAccess: {
            ...state.premiumAdAccess,
            [featureId]: Date.now() + AD_ACCESS_DURATION_MS,
          },
        }));
      },

      hasPremiumAdAccess: (featureId: string) => {
        const { premiumAdAccess } = get();
        const expiresAt = premiumAdAccess[featureId];
        if (!expiresAt) return false;
        
        if (Date.now() < expiresAt) return true;
        
        // Expired — clean up
        set((state) => {
          const newAccess = { ...state.premiumAdAccess };
          delete newAccess[featureId];
          return { premiumAdAccess: newAccess };
        });
        return false;
      },

      premiumAdRemainingSeconds: (featureId: string) => {
        const { premiumAdAccess } = get();
        const expiresAt = premiumAdAccess[featureId];
        if (!expiresAt) return 0;
        return Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
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
