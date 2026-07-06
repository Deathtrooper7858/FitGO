import { useEffect, useRef, useCallback } from 'react';
import {
  InterstitialAd,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { AD_UNIT_IDS } from '../constants/adConfig';

/**
 * Intervalo mínimo entre interstitials (en ms).
 * Por defecto: 10 minutos. Cambia este valor para ajustar la frecuencia.
 * ⚠️ No usar menos de 3 minutos para evitar saturar al usuario y violar políticas de AdMob.
 */
const INTERSTITIAL_INTERVAL_MS = 10 * 60 * 1000; // 10 minutos

let interstitialInstance: InterstitialAd | null = null;
let lastShownAt: number = 0;

function getOrCreateInterstitial(): InterstitialAd {
  if (!interstitialInstance) {
    interstitialInstance = InterstitialAd.createForAdRequest(AD_UNIT_IDS.interstitial, {
      requestNonPersonalizedAdsOnly: true,
    });
    interstitialInstance.load();
  }
  return interstitialInstance;
}

/**
 * Función standalone que intenta mostrar el intersticial si el cooldown ya pasó.
 * Úsala desde cualquier pantalla sin necesitar el hook completo.
 */
export function tryShowInterstitialAd(intervalMs: number = INTERSTITIAL_INTERVAL_MS): void {
  const now = Date.now();
  if (now - lastShownAt < intervalMs) return;

  const ad = getOrCreateInterstitial();

  const doShow = () => {
    const closedUnsub = ad.addAdEventListener(AdEventType.CLOSED, () => {
      closedUnsub();
      interstitialInstance = null;
      lastShownAt = Date.now();
      interstitialInstance = InterstitialAd.createForAdRequest(AD_UNIT_IDS.interstitial, {
        requestNonPersonalizedAdsOnly: true,
      });
      interstitialInstance.load();
    });
    const errUnsub = ad.addAdEventListener(AdEventType.ERROR, () => {
      errUnsub();
      interstitialInstance = null;
    });
    ad.show();
    console.log('[Interstitial] Mostrado (standalone)');
  };

  if (ad.loaded) {
    doShow();
  } else {
    const loadedUnsub = ad.addAdEventListener(AdEventType.LOADED, () => {
      loadedUnsub();
      doShow();
    });
    const errUnsub = ad.addAdEventListener(AdEventType.ERROR, () => {
      errUnsub();
      interstitialInstance = null;
    });
    ad.load();
  }
}

/**
 * Hook que muestra anuncios intersticiales de forma periódica.
 *
 * @param enabled  Si es false (ej. usuario Pro), nunca se muestran anuncios.
 * @param intervalMs  Intervalo mínimo entre anuncios en ms (por defecto 10 min).
 */
export function useInterstitialAd(
  enabled: boolean = true,
  intervalMs: number = INTERSTITIAL_INTERVAL_MS
) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Intenta mostrar el anuncio si ya pasó el intervalo mínimo y el ad está listo.
   */
  const tryShowAd = useCallback(() => {
    if (!enabled) return;

    const now = Date.now();
    const timeSinceLast = now - lastShownAt;

    if (timeSinceLast < intervalMs) {
      console.log(
        `[Interstitial] Cooldown activo. Faltan ${Math.round((intervalMs - timeSinceLast) / 1000)}s`
      );
      return;
    }

    const ad = getOrCreateInterstitial();

    const showIt = () => {
      const closedUnsub = ad.addAdEventListener(AdEventType.CLOSED, () => {
        closedUnsub();
        interstitialInstance = null;
        lastShownAt = Date.now();
        // Pre-cargar el siguiente
        interstitialInstance = InterstitialAd.createForAdRequest(AD_UNIT_IDS.interstitial, {
          requestNonPersonalizedAdsOnly: true,
        });
        interstitialInstance.load();
        console.log('[Interstitial] Cerrado. Precargando siguiente...');
      });

      const errUnsub = ad.addAdEventListener(AdEventType.ERROR, (err) => {
        errUnsub();
        console.warn('[Interstitial] Error al mostrar:', err);
        interstitialInstance = null;
      });

      ad.show();
      console.log('[Interstitial] Mostrado');
    };

    if (ad.loaded) {
      showIt();
    } else {
      const loadedUnsub = ad.addAdEventListener(AdEventType.LOADED, () => {
        loadedUnsub();
        showIt();
      });
      const errUnsub = ad.addAdEventListener(AdEventType.ERROR, (err) => {
        errUnsub();
        console.warn('[Interstitial] Error al cargar:', err);
        interstitialInstance = null;
      });
      ad.load();
    }
  }, [enabled, intervalMs]);

  useEffect(() => {
    if (!enabled) return;

    // Pre-cargar el primer anuncio al montar
    getOrCreateInterstitial();

    // Mostrar periódicamente según el intervalo
    timerRef.current = setInterval(() => {
      tryShowAd();
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enabled, intervalMs, tryShowAd]);

  return { tryShowAd };
}
