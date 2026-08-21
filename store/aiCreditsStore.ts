import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AD_CONFIG } from '../constants/adConfig';

interface AICreditsState {
  creditsLeft: number;
  lastResetDate: string; // ISO date string "YYYY-MM-DD"
  totalAdsWatched: number;

  // Actions
  consumeCredit: () => boolean;
  rechargeCredits: (amount?: number) => boolean;
  resetIfNewDay: () => void;
  getCreditsLeft: () => number;
  isProUser: boolean;
  setIsProUser: (isPro: boolean) => void;
}

function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export const useAICreditsStore = create<AICreditsState>()(
  persist(
    (set, get) => ({
      creditsLeft: AD_CONFIG.freeAICreditsPerDay,
      lastResetDate: getTodayDateString(),
      totalAdsWatched: 0,
      isProUser: false,

      /**
       * Resets credits if it's a new day.
       * Call this on app start and before checking credits.
       */
      resetIfNewDay: () => {
        const today = getTodayDateString();
        const { lastResetDate } = get();
        if (lastResetDate !== today) {
          set({
            creditsLeft: AD_CONFIG.freeAICreditsPerDay,
            lastResetDate: today,
            totalAdsWatched: 0,
          });
          console.log('[AICredits] New day - credits reset to', AD_CONFIG.freeAICreditsPerDay);
        }
      },

      /**
       * Consumes one credit. Returns true if successful, false if no credits left.
       * Pro users always return true without consuming.
       */
      consumeCredit: () => {
        const { creditsLeft, isProUser, resetIfNewDay } = get();
        resetIfNewDay();

        if (isProUser) return true;

        if (creditsLeft <= 0) {
          console.log('[AICredits] No credits left');
          return false;
        }

        set({ creditsLeft: Math.max(0, creditsLeft - 1) });
        console.log('[AICredits] Credit consumed, remaining:', creditsLeft - 1);
        return true;
      },

      /**
       * Adds credits (after watching a rewarded ad).
       */
      rechargeCredits: (amount = AD_CONFIG.rewardedAdCredits) => {
        const { creditsLeft, totalAdsWatched } = get();
        if (totalAdsWatched >= 3) {
          console.log('[AICredits] Max daily ads reached.');
          return false;
        }
        const newCredits = Math.min(creditsLeft + amount, AD_CONFIG.maxAICredits);
        set({
          creditsLeft: newCredits,
          totalAdsWatched: totalAdsWatched + 1,
        });
        console.log('[AICredits] Recharged +', amount, '| Now:', newCredits);
        return true;
      },

      getCreditsLeft: () => {
        const { creditsLeft, isProUser } = get();
        return isProUser ? Infinity : creditsLeft;
      },

      setIsProUser: (isPro: boolean) => {
        set({ isProUser: isPro });
        if (isPro) {
          console.log('[AICredits] Pro unlocked — unlimited AI');
        }
      },
    }),
    {
      name: 'fitgo-ai-credits',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist credits/date fields - NOT isProUser (comes from DB via purchaseStore)
      partialize: (state) => ({
        creditsLeft: state.creditsLeft,
        lastResetDate: state.lastResetDate,
        totalAdsWatched: state.totalAdsWatched,
      }),
    }
  )
);
