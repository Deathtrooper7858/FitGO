import { useEffect, useState } from 'react';
import mobileAds, { MaxAdContentRating, TestIds } from 'react-native-google-mobile-ads';

export const adUnitIds = {
  banner: __DEV__ ? TestIds.BANNER : 'ca-app-pub-3940256099942544~3347511713', // Replace with real ID later
  interstitial: __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-3940256099942544~3347511713',
  rewarded: __DEV__ ? TestIds.REWARDED : 'ca-app-pub-3940256099942544~3347511713',
};

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
            .then(adapterStatuses => {
              initialized = true;
              setIsInitialized(true);
              console.log('[AdMob] Initialized successfully', adapterStatuses);
            });
        });
    }
  }, []);

  return { isInitialized };
}
