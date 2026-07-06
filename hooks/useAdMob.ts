import { useEffect, useState } from 'react';
import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';

let initialized = false;
// Promesa compartida para evitar inicializaciones paralelas si el hook
// se monta varias veces antes de que la primera finalice.
let initializingPromise: Promise<void> | null = null;

export function useAdMob() {
  const [isInitialized, setIsInitialized] = useState(initialized);

  useEffect(() => {
    if (initialized) return;

    if (!initializingPromise) {
      initializingPromise = (async () => {
        try {
          // 1️⃣ Configurar política de contenido primero
          await mobileAds().setRequestConfiguration({
            maxAdContentRating: MaxAdContentRating.T,
            tagForChildDirectedTreatment: false,
            tagForUnderAgeOfConsent: false,
          });

          // 2️⃣ Inicializar SDK — los ads solo se pre-cargan DESPUÉS de esto
          await mobileAds().initialize();

          initialized = true;
          console.log('[AdMob] Initialized successfully');
        } catch (err) {
          console.warn('[AdMob] Initialization error:', err);
          initializingPromise = null; // Permitir reintento
        }
      })();
    }

    initializingPromise.then(() => {
      if (initialized) setIsInitialized(true);
    });
  }, []);

  return { isInitialized };
}
