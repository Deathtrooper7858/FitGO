import { useState, useRef, useCallback } from 'react';
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { AD_UNIT_IDS } from '../constants/adConfig';

/**
 * Hook reutilizable para mostrar anuncios recompensados.
 *
 * @param onRewarded  Callback que se llama cuando el usuario termina de ver el video y gana la recompensa.
 * @param onClosed    Callback opcional cuando el usuario cierra el ad sin ver completo.
 */
export function useRewardedAd(
  onRewarded: () => void,
  onClosed?: () => void
) {
  const [loading, setLoading] = useState(false);
  const adRef = useRef<RewardedAd | null>(null);

  // Pre-carga el siguiente ad después de usarlo
  const preloadNext = useCallback(() => {
    const next = RewardedAd.createForAdRequest(AD_UNIT_IDS.rewarded, {
      requestNonPersonalizedAdsOnly: true,
    });
    next.load();
    adRef.current = next;
  }, []);

  // Obtiene o crea una instancia lista
  const getAd = useCallback((): RewardedAd => {
    if (!adRef.current) {
      const ad = RewardedAd.createForAdRequest(AD_UNIT_IDS.rewarded, {
        requestNonPersonalizedAdsOnly: true,
      });
      adRef.current = ad;
    }
    return adRef.current;
  }, []);

  const showAd = useCallback(() => {
    if (loading) return;
    setLoading(true);

    const ad = getAd();

    const doShow = () => {
      const rewardUnsub = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        rewardUnsub();
        closedUnsub();
        adRef.current = null;
        setLoading(false);
        onRewarded();
        preloadNext();
      });

      const closedUnsub = ad.addAdEventListener(AdEventType.CLOSED, () => {
        rewardUnsub();
        closedUnsub();
        adRef.current = null;
        setLoading(false);
        onClosed?.();
        preloadNext();
      });

      ad.show();
    };

    if (ad.loaded) {
      doShow();
    } else {
      const loadedUnsub = ad.addAdEventListener(AdEventType.LOADED, () => {
        loadedUnsub();
        errUnsub();
        doShow();
      });
      const errUnsub = ad.addAdEventListener(AdEventType.ERROR, () => {
        loadedUnsub();
        errUnsub();
        adRef.current = null;
        setLoading(false);
        console.warn('[RewardedAd] Error cargando el anuncio');
      });
      ad.load();
    }
  }, [loading, getAd, onRewarded, onClosed, preloadNext]);

  return { showAd, loading };
}
