import { useCallback, useEffect } from 'react';
import { RewardedAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';
import { router } from 'expo-router';
import { useAICreditsStore } from '../store/aiCreditsStore';
import { usePurchaseStore, useAuthStore } from '../store';
import { AD_UNIT_IDS, AD_CONFIG } from '../constants/adConfig';

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
  const { creditsLeft, consumeCredit, rechargeCredits, resetIfNewDay, isProUser, totalAdsWatched } = useAICreditsStore();
  const { isPro: baseIsPro } = usePurchaseStore();
  const { profile } = useAuthStore();
  
  const isPro = !!baseIsPro || !!profile?.isPro || profile?.role === 'pro_user' || profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'owner';

  // Sync Pro status into credits store
  useEffect(() => {
    useAICreditsStore.getState().setIsProUser(isPro);
  }, [isPro]);

  // Reset credits if it's a new day on mount
  useEffect(() => {
    resetIfNewDay();
  }, []);

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

      const earnedListener = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        rechargeCredits(AD_CONFIG.rewardedAdCredits);
        earnedListener();
        closeListener();
        // Reload ad for next use
        rewardedAd = null;
        resolve(true);
      });

      const closeListener = ad.addAdEventListener(AdEventType.CLOSED, () => {
        earnedListener();
        closeListener();
        rewardedAd = null;
        resolve(false);
      });

      if (ad.loaded) {
        ad.show();
      } else {
        // Try to load and show
        const loadListener = ad.addAdEventListener(AdEventType.LOADED, () => {
          loadListener();
          ad.show();
        });
        const errorListener = ad.addAdEventListener(AdEventType.ERROR, () => {
          errorListener();
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
