import { useCallback, useEffect } from 'react';
import { RewardedAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';
import { router } from 'expo-router';
import { useAICreditsStore } from '../store/aiCreditsStore';
import { AD_UNIT_IDS, AD_CONFIG } from '../constants/adConfig';
import { useIsPro } from './useIsPro';

// Pre-load rewarded ad singleton
let rewardedAd: RewardedAd | null = null;

function getRewardedAd(): RewardedAd {
  if (!rewardedAd) {
    rewardedAd = RewardedAd.createForAdRequest(AD_UNIT_IDS.rewarded, {
      requestNonPersonalizedAdsOnly: true,
    });
  }
  return rewardedAd;
}

export function useAICredits() {
  const { creditsLeft, consumeCredit, rechargeCredits, resetIfNewDay, totalAdsWatched } = useAICreditsStore();
  const isPro = useIsPro();

  // Sync Pro status into credits store
  useEffect(() => {
    useAICreditsStore.getState().setIsProUser(isPro);
  }, [isPro]);

  // Reset credits if it's a new day on mount
  useEffect(() => {
    resetIfNewDay();
  }, [resetIfNewDay]);

  // Pre-load rewarded ad
  useEffect(() => {
    const ad = getRewardedAd();
    ad.load();
  }, []);

  /**
   * Try to use an AI credit.
   * Returns true if the action can proceed, false if no credits.
   * If no credits, redirects to no-credits modal automatically.
   */
  const tryUseAI = useCallback((): boolean => {
    const ok = consumeCredit();
    if (!ok && !isPro) {
      router.push('/modals/no-credits' as any);
      return false;
    }
    return true;
  }, [consumeCredit, isPro]);

  /**
   * Show a rewarded ad and grant credits on completion.
   * Returns a promise that resolves to true if the user earned the reward.
   */
  const watchAdForCredits = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      const state = useAICreditsStore.getState();
      if (state.totalAdsWatched >= 3) {
        console.log('[AICredits] Ad limit reached for today.');
        resolve(false);
        return;
      }

      const ad = getRewardedAd();

      // Guard: prevent multiple resolutions and ensure all listeners get cleaned up.
      let resolved = false;
      let earnedUnsub: (() => void) | undefined;
      let closeUnsub: (() => void) | undefined;
      let loadUnsub: (() => void) | undefined;
      let errorUnsub: (() => void) | undefined;

      const cleanup = () => {
        earnedUnsub?.();
        closeUnsub?.();
        loadUnsub?.();
        errorUnsub?.();
      };

      earnedUnsub = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        if (resolved) return;
        resolved = true;
        rechargeCredits(AD_CONFIG.rewardedAdCredits);
        cleanup();
        rewardedAd = null;
        resolve(true);
      });

      closeUnsub = ad.addAdEventListener(AdEventType.CLOSED, () => {
        if (resolved) return;
        resolved = true;
        cleanup();
        rewardedAd = null;
        resolve(false);
      });

      if (ad.loaded) {
        ad.show();
      } else {
        // Not yet loaded — wait for LOADED or ERROR before showing
        loadUnsub = ad.addAdEventListener(AdEventType.LOADED, () => {
          loadUnsub?.();
          loadUnsub = undefined;
          ad.show();
        });
        errorUnsub = ad.addAdEventListener(AdEventType.ERROR, () => {
          if (resolved) return;
          resolved = true;
          cleanup();
          resolve(false);
        });
        ad.load();
      }
    });
  }, [rechargeCredits]);

  const displayCredits = isPro ? '∞' : String(creditsLeft);
  const hasCredits = isPro || creditsLeft > 0;
  const maxCredits = AD_CONFIG.freeAICreditsPerDay;

  return {
    creditsLeft,
    displayCredits,
    hasCredits,
    maxCredits,
    isPro,
    tryUseAI,
    watchAdForCredits,
    totalAdsWatched,
  };
}
