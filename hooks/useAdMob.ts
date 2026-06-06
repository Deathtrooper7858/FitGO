import { useEffect, useState, useRef } from 'react';
import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';

let initialized = false;

export function useAdMob() {
  const [isInitialized, setIsInitialized] = useState(initialized);

  useEffect(() => {
    if (!initialized) {
      mobileAds()
        .setRequestConfiguration({
          maxAdContentRating: MaxAdContentRating.T,
          tagForChildDirectedTreatment: false,
          tagForUnderAgeOfConsent: false,
        })
        .then(() => {
          mobileAds()
            .initialize()
            .then(() => {
              initialized = true;
              setIsInitialized(true);
              console.log('[AdMob] Initialized successfully');
            });
        });
    }
  }, []);

  return { isInitialized };
}
