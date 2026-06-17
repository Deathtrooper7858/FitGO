import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Max free AI photo scans per day (free users) */
export const MAX_AI_PHOTO_ENERGY = 3;
/** Max free AI text scans per day (free users) */
export const MAX_AI_TEXT_ENERGY = 5;
/** Legacy alias – kept for compatibility */
export const MAX_AI_ENERGY = MAX_AI_PHOTO_ENERGY;
/** Each rewarded ad gives exactly 1 credit */
export const REWARD_AMOUNT = 1;
/** Max ads a user can watch per day per type to earn credits */
export const MAX_ADS_PER_DAY = 3;

/** Duration in ms that a rewarded ad grants access to a premium feature */
export const AD_ACCESS_DURATION_MS = 10 * 60 * 1000; // 10 minutes

interface AdState {
  /** Remaining photo-AI uses today */
  aiPhotoEnergy: number;
  /** Remaining text-AI uses today */
  aiTextEnergy: number;
  /** Legacy alias pointing to aiPhotoEnergy for backward compat */
  aiEnergy: number;
  /** How many rewarded ads watched today for photo credits */
  photoAdsWatchedToday: number;
  /** How many rewarded ads watched today for text credits */
  textAdsWatchedToday: number;
  lastEnergyReset: string | null;
  /** Maps featureId to its Unix expiration timestamp (ms). */
  premiumAdAccess: Record<string, number>;

  checkAndResetEnergy: () => void;
  consumePhotoEnergy: () => boolean;
  consumeTextEnergy: () => boolean;
  /** @deprecated Use consumePhotoEnergy or consumeTextEnergy */
  consumeEnergy: (amount?: number) => boolean;
  addEnergy: (amount: number) => void;
  /** Adds 1 photo credit if under the ad watch limit. Returns true if added. */
  watchAdForPhotoCredit: () => boolean;
  /** Adds 1 text credit if under the ad watch limit. Returns true if added. */
  watchAdForTextCredit: () => boolean;
  /** Returns remaining ads the user can watch today for the given mode */
  remainingAdsToday: (mode: 'photo' | 'text') => number;
  /** @deprecated direct energy add, use watchAdForPhotoCredit/watchAdForTextCredit */
  addPhotoEnergy: (amount: number) => void;
  /** @deprecated direct energy add */
  addTextEnergy: (amount: number) => void;
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
      aiPhotoEnergy: MAX_AI_PHOTO_ENERGY,
      aiTextEnergy: MAX_AI_TEXT_ENERGY,
      aiEnergy: MAX_AI_PHOTO_ENERGY, // legacy
      photoAdsWatchedToday: 0,
      textAdsWatchedToday: 0,
      lastEnergyReset: new Date().toDateString(),
      premiumAdAccess: {},

      checkAndResetEnergy: () => {
        const today = new Date().toDateString();
        const { lastEnergyReset } = get();
        if (lastEnergyReset !== today) {
          set({
            aiPhotoEnergy: MAX_AI_PHOTO_ENERGY,
            aiTextEnergy: MAX_AI_TEXT_ENERGY,
            aiEnergy: MAX_AI_PHOTO_ENERGY,
            photoAdsWatchedToday: 0,
            textAdsWatchedToday: 0,
            lastEnergyReset: today,
          });
          console.log('[AdStore] New day — energy & ad counters reset');
        }
      },

      consumePhotoEnergy: () => {
        get().checkAndResetEnergy();
        const current = get().aiPhotoEnergy;
        if (current >= 1) {
          set({ aiPhotoEnergy: current - 1, aiEnergy: current - 1 });
          return true;
        }
        return false;
      },

      consumeTextEnergy: () => {
        get().checkAndResetEnergy();
        const current = get().aiTextEnergy;
        if (current >= 1) {
          set({ aiTextEnergy: current - 1, aiEnergy: current - 1 });
          return true;
        }
        return false;
      },

      consumeEnergy: () => {
        return get().consumePhotoEnergy();
      },

      /**
       * Called after a rewarded ad is successfully watched for photo credits.
       * Adds exactly 1 credit. Returns false if the daily ad limit is reached.
       */
      watchAdForPhotoCredit: () => {
        get().checkAndResetEnergy();
        const { photoAdsWatchedToday, aiPhotoEnergy } = get();
        if (photoAdsWatchedToday >= MAX_ADS_PER_DAY) {
          console.log('[AdStore] Photo ad limit reached for today');
          return false;
        }
        set({
          aiPhotoEnergy: aiPhotoEnergy + 1,
          aiEnergy: aiPhotoEnergy + 1,
          photoAdsWatchedToday: photoAdsWatchedToday + 1,
        });
        console.log(`[AdStore] Photo credit added. Watched: ${photoAdsWatchedToday + 1}/${MAX_ADS_PER_DAY}`);
        return true;
      },

      /**
       * Called after a rewarded ad is successfully watched for text credits.
       * Adds exactly 1 credit. Returns false if the daily ad limit is reached.
       */
      watchAdForTextCredit: () => {
        get().checkAndResetEnergy();
        const { textAdsWatchedToday, aiTextEnergy } = get();
        if (textAdsWatchedToday >= MAX_ADS_PER_DAY) {
          console.log('[AdStore] Text ad limit reached for today');
          return false;
        }
        set({
          aiTextEnergy: aiTextEnergy + 1,
          aiEnergy: aiTextEnergy + 1,
          textAdsWatchedToday: textAdsWatchedToday + 1,
        });
        console.log(`[AdStore] Text credit added. Watched: ${textAdsWatchedToday + 1}/${MAX_ADS_PER_DAY}`);
        return true;
      },

      remainingAdsToday: (mode) => {
        get().checkAndResetEnergy();
        const { photoAdsWatchedToday, textAdsWatchedToday } = get();
        const watched = mode === 'photo' ? photoAdsWatchedToday : textAdsWatchedToday;
        return Math.max(0, MAX_ADS_PER_DAY - watched);
      },

      // Legacy helpers kept for backward compat
      addEnergy: (amount) => {
        set((state) => ({
          aiPhotoEnergy: state.aiPhotoEnergy + amount,
          aiEnergy: state.aiPhotoEnergy + amount,
        }));
      },

      addPhotoEnergy: (amount) => {
        set((state) => ({
          aiPhotoEnergy: state.aiPhotoEnergy + amount,
          aiEnergy: state.aiPhotoEnergy + amount,
        }));
      },

      addTextEnergy: (amount) => {
        set((state) => ({
          aiTextEnergy: state.aiTextEnergy + amount,
          aiEnergy: state.aiTextEnergy + amount,
        }));
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
      name: 'fitgo-ad-storage-v2', // bumped to clear old data and start fresh
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
