import { create } from 'zustand';
import { Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { supabase } from '../services/supabase';
import { useAuthStore } from './authStore';

interface PurchaseState {
  isPro: boolean;
  offering: PurchasesOffering | null;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  // Trial
  trialUsedAt: string | null;     // ISO timestamp when trial started
  trialExpiresAt: string | null;  // ISO timestamp when trial expires
  isTrialActive: boolean;

  initialize: (userId?: string) => Promise<void>;
  updateCustomerInfo: (info: CustomerInfo) => void;
  fetchOfferings: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<void>;
  grantPro: () => Promise<void>;
  cancelPro: () => Promise<void>;
  verifyProStatus: () => Promise<boolean>;
  // Trial methods
  startTrial: () => Promise<void>;
  hasUsedTrial: () => boolean;
  checkAndRevokeExpiredTrial: () => Promise<void>;
  syncTrialState: () => Promise<void>;
}

let isConfigured = false;
let currentUserId: string | null = null;

export const usePurchaseStore = create<PurchaseState>((set, get) => ({
  isPro: false,
  offering: null,
  isLoading: false,
  customerInfo: null,
  trialUsedAt: null,
  trialExpiresAt: null,
  isTrialActive: false,

  initialize: async (userId?: string) => {
    if (Platform.OS === 'web') return;

    try {
      // Configure SDK only once
      if (!isConfigured) {
        const apiKey = Platform.OS === 'ios'
          ? process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS
          : process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID;

        if (!apiKey) {
          console.warn('RevenueCat API key not found in environment variables.');
          return;
        }

        await Purchases.configure({ apiKey });
        isConfigured = true;

        // Listen for updates (renewals, cancellations, etc.)
        Purchases.addCustomerInfoUpdateListener((info) => {
          get().updateCustomerInfo(info);
        });
      }

      // Identify user if logged in and it's a new user ID
      if (userId && userId !== currentUserId) {
        currentUserId = userId;
        const { customerInfo } = await Purchases.logIn(userId);
        get().updateCustomerInfo(customerInfo);
      } else if (!userId) {
        // If logged out
        currentUserId = null;
      }
    } catch (err) {
      console.error('Error initializing RevenueCat:', err);
    }
  },

  updateCustomerInfo: (info) => {
    const isProActive = typeof info.entitlements.active['pro'] !== 'undefined';
    set({ customerInfo: info, isPro: isProActive });

    // Sync state locally with authStore and database
    const profile = useAuthStore.getState().profile;
    if (profile) {
      if (isProActive && !profile.isPro) {
        console.log('RevenueCat entitlement is active but database says not Pro. Upgrading in database...');
        get().grantPro();
      } else if (!isProActive && profile.isPro) {
        // If we already know the trial is active in our store state, do not downgrade
        if (get().isTrialActive) {
          console.log('[PurchaseStore] RevenueCat is inactive, but local trial is active. Skipping downgrade.');
          return;
        }

        // Fetch from database to ensure we aren't in a race condition during initialization
        (async () => {
          try {
            const { data, error } = await supabase
              .from('users')
              .select('trial_expires_at')
              .eq('id', profile.id)
              .single();

            if (!error && data?.trial_expires_at) {
              const expires = new Date(data.trial_expires_at);
              if (expires > new Date()) {
                console.log('[PurchaseStore] RevenueCat is inactive, but user has an active database-backed trial until', expires);
                set({ isTrialActive: true, trialExpiresAt: data.trial_expires_at });
                return; // Do NOT downgrade
              }
            }

            console.log('RevenueCat entitlement is inactive but database says Pro. Downgrading in database...');
            await get().cancelPro();
          } catch (err) {
            console.error('Error verifying trial during updateCustomerInfo:', err);
            // Fallback: downgrade if check failed
            await get().cancelPro();
          }
        })();
      } else if (profile.isPro !== isProActive) {
        useAuthStore.getState().setProfile({
          ...profile,
          isPro: isProActive,
          role: isProActive ? 'pro_user' : 'user',
          nameColor: isProActive ? '#EAB308' : undefined,
        });
      }
    }
  },

  fetchOfferings: async () => {
    if (Platform.OS === 'web') return;

    try {
      set({ isLoading: true });
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null) {
        set({ offering: offerings.current, isLoading: false });
      } else {
        set({ offering: null, isLoading: false });
      }
    } catch (err) {
      console.error('Error fetching offerings:', err);
      set({ isLoading: false });
    }
  },

  refreshStatus: async () => {
    if (Platform.OS === 'web') return;

    try {
      const info = await Purchases.getCustomerInfo();
      get().updateCustomerInfo(info);
    } catch (err) {
      console.error('Error refreshing subscription status:', err);
    }
  },

  purchasePackage: async (pkg: PurchasesPackage) => {
    if (Platform.OS === 'web') return;

    try {
      set({ isLoading: true });
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      get().updateCustomerInfo(customerInfo);
      
      // Force grantPro in test environment or if entitlement synchronization fails in sandbox
      const isProActive = typeof customerInfo.entitlements.active['pro'] !== 'undefined';
      const apiKey = Platform.OS === 'ios'
        ? process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS
        : process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID;
      
      if (!isProActive && (apiKey?.startsWith('test_') || __DEV__)) {
        console.log('Test environment detected. Explicitly granting Pro status...');
        await get().grantPro();
      }
      
      set({ isLoading: false });
    } catch (err: any) {
      set({ isLoading: false });
      if (!err.userCancelled) {
        console.error('Purchase error:', err);
        throw err;
      }
    }
  },

  restorePurchases: async () => {
    if (Platform.OS === 'web') return;

    try {
      set({ isLoading: true });
      const info = await Purchases.restorePurchases();
      get().updateCustomerInfo(info);
      set({ isLoading: false });
    } catch (err) {
      console.error('Error restoring purchases:', err);
      set({ isLoading: false });
      throw err;
    }
  },

  grantPro: async () => {
    const profile = useAuthStore.getState().profile;
    if (!profile?.id) return;
    
    try {
      set({ isLoading: true });
      const { error } = await supabase.rpc('upgrade_to_pro_user', { target_user_id: profile.id });
      if (error) {
        console.error('Error upgrading to pro via RPC:', error);
        set({ isLoading: false });
        return;
      }
      
      set({ isPro: true, isLoading: false });
      useAuthStore.getState().setProfile({ ...profile, isPro: true, role: 'pro_user', nameColor: '#EAB308' });
      await supabase.auth.updateUser({ data: { name_color: '#EAB308' } });
    } catch (err) {
      console.error(err);
      set({ isLoading: false });
    }
  },

  cancelPro: async () => {
    const profile = useAuthStore.getState().profile;
    if (!profile?.id) return;

    try {
      set({ isLoading: true });
      const { error } = await supabase.rpc('downgrade_from_pro', { target_user_id: profile.id });
      if (error) {
        console.error('Error downgrading from pro via RPC:', error);
        set({ isLoading: false });
        return;
      }
      
      set({ isPro: false, isLoading: false });
      // Clear nameColor as well so trial/pro perks are fully revoked locally
      useAuthStore.getState().setProfile({ ...profile, isPro: false, role: 'user', nameColor: undefined });
      await supabase.auth.updateUser({ data: { name_color: null } });
    } catch (err) {
      console.error(err);
      set({ isLoading: false });
    }
  },

  verifyProStatus: async (): Promise<boolean> => {
    const profile = useAuthStore.getState().profile;
    if (!profile?.id) return false;

    // Check with RevenueCat first if on mobile device
    if (Platform.OS !== 'web') {
      try {
        const info = await Purchases.getCustomerInfo();
        const isProActive = typeof info.entitlements.active['pro'] !== 'undefined';
        set({ customerInfo: info, isPro: isProActive });
        return isProActive;
      } catch (err) {
        console.error('Error verifying Pro status via RevenueCat:', err);
      }
    }

    // Fallback/Web check from Supabase database
    try {
      set({ isLoading: true });
      const { data, error } = await supabase
        .from('users')
        .select('is_pro, role')
        .eq('id', profile.id)
        .single();

      if (error) throw error;

      const isProNow = !!data.is_pro;
      set({ isPro: isProNow, isLoading: false });
      useAuthStore.getState().setProfile({ 
        ...profile, 
        isPro: isProNow, 
        role: data.role as any || profile.role 
      });
      
      return isProNow;
    } catch (err) {
      console.error('Error verifying Pro status via Database:', err);
      set({ isLoading: false });
      return false;
    }
  },

  // ── Trial ────────────────────────────────────────────────────────────────

  hasUsedTrial: () => {
    return !!get().trialUsedAt;
  },

  syncTrialState: async () => {
    const profile = useAuthStore.getState().profile;
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('trial_used_at, trial_expires_at, is_pro')
        .eq('id', profile.id)
        .single();

      if (error || !data) return;

      const trialUsedAt = data.trial_used_at ?? null;
      const trialExpiresAt = data.trial_expires_at ?? null;
      const now = new Date();
      const isTrialActive =
        !!trialUsedAt &&
        !!trialExpiresAt &&
        new Date(trialExpiresAt) > now &&
        !!data.is_pro;

      set({ trialUsedAt, trialExpiresAt, isTrialActive });
    } catch (err) {
      console.warn('[PurchaseStore] syncTrialState error:', err);
    }
  },

  startTrial: async () => {
    const profile = useAuthStore.getState().profile;
    if (!profile?.id) throw new Error('Not authenticated');

    // Prevent double usage — check DB
    const { data: existing } = await supabase
      .from('users')
      .select('trial_used_at')
      .eq('id', profile.id)
      .single();

    if (existing?.trial_used_at) {
      throw new Error('TRIAL_ALREADY_USED');
    }

    try {
      set({ isLoading: true });
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 days

      // Set trial timestamps in DB
      const { error: updateError } = await supabase
        .from('users')
        .update({
          trial_used_at: now.toISOString(),
          trial_expires_at: expiresAt.toISOString(),
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      // Grant pro access temporarily
      await get().grantPro();

      set({
        trialUsedAt: now.toISOString(),
        trialExpiresAt: expiresAt.toISOString(),
        isTrialActive: true,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  checkAndRevokeExpiredTrial: async () => {
    const profile = useAuthStore.getState().profile;
    if (!profile?.id) return;

    // Always fetch fresh trial data from DB to avoid stale local state
    try {
      const { data, error } = await supabase
        .from('users')
        .select('trial_used_at, trial_expires_at, is_pro')
        .eq('id', profile.id)
        .single();

      if (error || !data) return;

      const trialUsedAt = data.trial_used_at ?? null;
      const trialExpiresAt = data.trial_expires_at ?? null;
      const isProInDb = !!data.is_pro;

      if (!trialUsedAt || !trialExpiresAt) return;

      const now = new Date();
      const expires = new Date(trialExpiresAt);

      if (now >= expires && isProInDb) {
        // Trial has expired — revoke Pro
        console.log('[PurchaseStore] Trial expired. Revoking Pro access...');
        await get().cancelPro();
        set({ isTrialActive: false, trialUsedAt, trialExpiresAt });
      } else if (now < expires && isProInDb) {
        set({ isTrialActive: true, trialUsedAt, trialExpiresAt });
      } else if (now >= expires && !isProInDb) {
        // Already revoked server-side (cron ran), just sync local state
        set({ isTrialActive: false, trialUsedAt, trialExpiresAt });
        const currentProfile = useAuthStore.getState().profile;
        if (currentProfile?.isPro) {
          useAuthStore.getState().setProfile({
            ...currentProfile,
            isPro: false,
            role: 'user',
            nameColor: undefined,
          });
        }
      }
    } catch (err) {
      console.warn('[PurchaseStore] checkAndRevokeExpiredTrial error:', err);
    }
  },
}));
