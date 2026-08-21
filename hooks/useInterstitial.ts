import { useCallback, useEffect, useRef, useState } from 'react';
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { usePurchaseStore } from '../store';
import { AD_UNIT_IDS, AD_CONFIG } from '../constants/adConfig';

// Global cooldown tracker — shared across all screens
let lastInterstitialShownAt = 0;

export function useInterstitial() {
  const { isPro } = usePurchaseStore();
  const adRef = useRef<InterstitialAd | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Create and load interstitial ad
  useEffect(() => {
    if (isPro) return; // Pro users never see interstitials

    const ad = InterstitialAd.createForAdRequest(AD_UNIT_IDS.interstitial, {
      requestNonPersonalizedAdsOnly: true,
    });
    adRef.current = ad;

    const loadedListener = ad.addAdEventListener(AdEventType.LOADED, () => {
      setIsLoaded(true);
    });

    const closedListener = ad.addAdEventListener(AdEventType.CLOSED, () => {
      setIsLoaded(false);
      // Reload after being shown
      ad.load();
    });

    const errorListener = ad.addAdEventListener(AdEventType.ERROR, (error) => {
      console.log('[Interstitial] Load error:', error);
      setIsLoaded(false);
    });

    ad.load();

    return () => {
      loadedListener();
      closedListener();
      errorListener();
    };
  }, [isPro]);

  /**
   * Show the interstitial if:
   * 1. Ad is loaded
   * 2. User is not Pro
   * 3. Cooldown period has passed
   *
   * Call this at natural breakpoints (after completing an action).
   */
  const showInterstitialIfReady = useCallback(() => {
    if (isPro) return;

    const now = Date.now();
    const timeSinceLast = now - lastInterstitialShownAt;

    if (timeSinceLast < AD_CONFIG.interstitialCooldownMs) {
      const minutesLeft = Math.ceil((AD_CONFIG.interstitialCooldownMs - timeSinceLast) / 60000);
      console.log(`[Interstitial] On cooldown. ${minutesLeft} min remaining.`);
      return;
    }

    if (adRef.current?.loaded) {
      lastInterstitialShownAt = now;
      adRef.current.show();
      console.log('[Interstitial] Showing ad');
    } else {
      console.log('[Interstitial] Not loaded yet');
    }
  }, [isPro]);

  return { showInterstitialIfReady, isLoaded };
}
