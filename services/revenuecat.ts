import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import Constants from 'expo-constants';

const API_KEYS = {
  apple: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || '',
  google: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || '',
};

export const ENTITLEMENT_ID = 'fitgo Pro';

export class RevenueCatService {
  private static instance: RevenueCatService;

  private constructor() {}

  static getInstance(): RevenueCatService {
    if (!RevenueCatService.instance) {
      RevenueCatService.instance = new RevenueCatService();
    }
    return RevenueCatService.instance;
  }

  async initialize(userId?: string) {
    // Detect Expo Go
    const isExpoGo = Constants.appOwnership === 'expo';
    
    if (isExpoGo) {
      if (__DEV__) console.log('[RevenueCat] Native SDK not supported in Expo Go. Please use a Development Build.');
      return;
    }

    try {
      Purchases.setLogLevel(LOG_LEVEL.WARN);

      const apiKey = Platform.OS === 'ios' ? API_KEYS.apple : API_KEYS.google;

      if (!apiKey) {
        if (__DEV__) console.log('[RevenueCat] No API key provided in environment.');
        return;
      }

      Purchases.configure({ apiKey, appUserID: userId });
      
      if (__DEV__) console.log('[RevenueCat] Initialized successfully');
    } catch (e: any) {
      if (__DEV__) console.log('[RevenueCat] Failed to initialize:', e?.message);
    }
  }

  async login(userId: string) {
    try {
      await Purchases.logIn(userId);
    } catch (e: any) {
      if (!e?.message?.includes('BILLING_UNAVAILABLE')) {
        console.warn('[RevenueCat] Login warning:', e?.message);
      }
    }
  }

  async logout() {
    try {
      await Purchases.logOut();
    } catch (e) {
      console.warn('[RevenueCat] Logout warning:', e);
    }
  }

  async getOfferings() {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (e: any) {
      if (!e?.message?.includes('BILLING_UNAVAILABLE')) {
        console.warn('[RevenueCat] Offerings warning:', e?.message);
      }
      return null;
    }
  }

  async checkEntitlement(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
    } catch (e: any) {
      if (!e?.message?.includes('BILLING_UNAVAILABLE')) {
        console.warn('[RevenueCat] Check entitlement warning:', e?.message);
      }
      return false;
    }
  }

  async restorePurchases() {
    try {
      return await Purchases.restorePurchases();
    } catch (e) {
      console.error('Error restoring purchases', e);
      throw e;
    }
  }
}

export const revenueCat = RevenueCatService.getInstance();
