import { create } from 'zustand';
import { Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { supabase } from '../services/supabase';
import { reportError, reportEvent } from '../utils/errorReporter';
import { useAuthStore } from './authStore';
import { useSettingsStore } from './settingsStore';

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
  checkAndRevokeExpiredTrial: (useCache?: boolean) => Promise<void>;
  syncTrialState: (useCache?: boolean) => Promise<void>;
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
      reportError(err, { module: 'PurchaseStore', action: 'initialize', severity: 'error' });
    }
  },

  updateCustomerInfo: (info) => {
    const isProActive = typeof info.entitlements.active['pro'] !== 'undefined';
    set({ customerInfo: info, isPro: isProActive });

    // Sync state locally with authStore and database
    const profile = useAuthStore.getState().profile;
    if (!profile) return;

    // NEVER let RevenueCat downgrade privileged roles
    const isPrivileged = ['owner', 'super_admin', 'admin'].includes(profile.role ?? '');

    if (isProActive && !profile.isPro) {
      console.log('[PurchaseStore] RevenueCat entitlement active. Upgrading in database...');
      get().grantPro();
    } else if (!isProActive && profile.isPro && !isPrivileged) {
      // If we already know the trial is active in our store state, do not downgrade
      if (get().isTrialActive) {
        console.log('[PurchaseStore] RevenueCat inactive, but local trial is active. Skipping downgrade.');
        return;
      }

      // Fetch from database to ensure we aren't in a race condition during initialization
      (async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('trial_expires_at, role, pro_expires_at')
            .eq('id', profile.id)
            .single();

          if (error) throw error;

          // Re-check role from DB — may have been updated since profile loaded
          const dbRole = data?.role ?? 'user';
          if (['owner', 'super_admin', 'admin'].includes(dbRole)) {
            console.log('[PurchaseStore] DB role is privileged. Skipping downgrade.');
            return;
          }

          // Check if premium subscription is still valid in DB
          if (data?.pro_expires_at) {
            const expires = new Date(data.pro_expires_at);
            if (expires > new Date()) {
              console.log('[PurchaseStore] pro_expires_at is still in the future. Skipping downgrade.');
              return;
            }
          }

          if (data?.trial_expires_at) {
            const expires = new Date(data.trial_expires_at);
            if (expires > new Date()) {
              console.log('[PurchaseStore] Active trial until', expires, '. Skipping downgrade.');
              set({ isTrialActive: true, trialExpiresAt: data.trial_expires_at });
              return;
            }
          }

          console.log('[PurchaseStore] RevenueCat inactive, trial/sub expired. Downgrading...');
          await get().cancelPro();
        } catch (err) {
          reportError(err, { module: 'PurchaseStore', action: 'updateCustomerInfo.verifyTrial', severity: 'error' });
        }
      })().catch(err => {
        reportError(err, { module: 'PurchaseStore', action: 'updateCustomerInfo.verifyTrial.unhandled', severity: 'error' });
      });
    } else if (profile.isPro !== isProActive && !isPrivileged) {
      useAuthStore.getState().setProfile({
        ...profile,
        isPro: isProActive,
        role: isProActive ? 'pro_user' : 'user',
        nameColor: isProActive ? '#EAB308' : undefined,
      });
    }
  },

  fetchOfferings: async () => {
    if (Platform.OS === 'web' || !isConfigured) return;

    try {
      set({ isLoading: true });
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null) {
        set({ offering: offerings.current, isLoading: false });
      } else {
        set({ offering: null, isLoading: false });
      }
    } catch (err: any) {
      // Ignore ConfigurationError which happens when there are no products in RevenueCat yet
      if (err?.code === 'ConfigurationError' || err?.message?.includes('ConfigurationError')) {
        console.log('[PurchaseStore] RevenueCat offerings not configured yet. Skipping...');
      } else {
        reportError(err, { module: 'PurchaseStore', action: 'fetchOfferings' });
      }
      set({ isLoading: false });
    }
  },

  refreshStatus: async () => {
    if (Platform.OS === 'web' || !isConfigured) return;

    try {
      const info = await Purchases.getCustomerInfo();
      get().updateCustomerInfo(info);
    } catch (err) {
      reportError(err, { module: 'PurchaseStore', action: 'refreshStatus' });
    }
  },

  purchasePackage: async (pkg: PurchasesPackage) => {
    if (Platform.OS === 'web' || !isConfigured) return;

    try {
      set({ isLoading: true });
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      get().updateCustomerInfo(customerInfo);
      
      // Force grantPro in test environment ONLY with test API keys (NOT __DEV__ to prevent abuse)
      const isProActive = typeof customerInfo.entitlements.active['pro'] !== 'undefined';
      const apiKey = Platform.OS === 'ios'
        ? process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS
        : process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID;
      
      // ONLY grant Pro in sandbox/test environments (test_ prefix), NEVER based on __DEV__
      // __DEV__ can be true in development builds distributed to testers, which would be abuse
      if (!isProActive && apiKey?.startsWith('test_')) {
        console.log('[PurchaseStore] Test environment detected. Explicitly granting Pro status...');
        await get().grantPro();
      }
      
      set({ isLoading: false });
    } catch (err: any) {
      set({ isLoading: false });
      if (!err.userCancelled) {
        reportError(err, { module: 'PurchaseStore', action: 'purchasePackage', severity: 'fatal', tags: { flow: 'payment' } });
        throw err;
      }
    }
  },

  restorePurchases: async () => {
    if (Platform.OS === 'web' || !isConfigured) return;

    try {
      set({ isLoading: true });
      const info = await Purchases.restorePurchases();
      get().updateCustomerInfo(info);
      set({ isLoading: false });
    } catch (err) {
      reportError(err, { module: 'PurchaseStore', action: 'restorePurchases', tags: { flow: 'payment' } });
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
        reportError(error, { module: 'PurchaseStore', action: 'grantPro', severity: 'fatal', tags: { flow: 'payment' } });
        set({ isLoading: false });
        return;
      }
      
      set({ isPro: true, isLoading: false });

      // If user is owner/admin/super_admin, keep their role — just mark isPro
      const isPrivileged = ['owner', 'super_admin', 'admin'].includes(profile.role ?? '');
      if (isPrivileged) {
        useAuthStore.getState().setProfile({ ...profile, isPro: true });
      } else {
        useAuthStore.getState().setProfile({ ...profile, isPro: true, role: 'pro_user', nameColor: '#EAB308' });
        await supabase.auth.updateUser({ data: { name_color: '#EAB308' } });
      }
    } catch (err) {
      reportError(err, { module: 'PurchaseStore', action: 'grantPro.updateUser' });
      set({ isLoading: false });
    }
  },

  cancelPro: async () => {
    const profile = useAuthStore.getState().profile;
    if (!profile?.id) return;

    try {
      set({ isLoading: true });

      // Read current role from DB to be safe
      const { data: dbUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', profile.id)
        .single();

      const dbRole = dbUser?.role ?? profile.role ?? 'user';
      const isPrivileged = ['owner', 'super_admin', 'admin'].includes(dbRole);

      if (isPrivileged) {
        // Privileged roles: only clear Pro flag & dates, keep role
        await supabase
          .from('users')
          .update({ is_pro: false, pro_will_renew: false, pro_expires_at: null })
          .eq('id', profile.id);
        set({ isPro: false, isLoading: false });
        useAuthStore.getState().setProfile({ ...profile, isPro: false });
        useSettingsStore.getState().setPremiumColor(null);
        return;
      }

      const { error } = await supabase.rpc('downgrade_from_pro', { target_user_id: profile.id });
      if (error) {
        reportError(error, { module: 'PurchaseStore', action: 'cancelPro', severity: 'fatal', tags: { flow: 'payment' } });
        set({ isLoading: false });
        return;
      }
      
      set({ isPro: false, isLoading: false });
      // Clear nameColor so trial/pro perks are fully revoked locally
      useAuthStore.getState().setProfile({ ...profile, isPro: false, role: 'user', nameColor: undefined });
      useSettingsStore.getState().setPremiumColor(null);
      await supabase.auth.updateUser({ data: { name_color: null } });
    } catch (err) {
      reportError(err, { module: 'PurchaseStore', action: 'cancelPro.updateUser' });
      set({ isLoading: false });
    }
  },

  verifyProStatus: async (): Promise<boolean> => {
    const profile = useAuthStore.getState().profile;
    if (!profile?.id) return false;

    // Privileged roles are always considered Pro
    const isPrivileged = ['owner', 'super_admin', 'admin'].includes(profile.role ?? '');
    if (isPrivileged) {
      set({ isPro: true });
      return true;
    }

    // Check with RevenueCat first if on mobile device
    if (Platform.OS !== 'web' && isConfigured) {
      try {
        const info = await Purchases.getCustomerInfo();
        const isProActive = typeof info.entitlements.active['pro'] !== 'undefined';
        set({ customerInfo: info });

        if (isProActive) {
          set({ isPro: true });
          return true;
        }
      } catch (err) {
        reportError(err, { module: 'PurchaseStore', action: 'verifyProStatus.revenueCat' });
      }
    }

    // Fallback/Web check from Supabase database
    try {
      set({ isLoading: true });
      const { data, error } = await supabase
        .from('users')
        .select('is_pro, role, pro_expires_at, trial_expires_at')
        .eq('id', profile.id)
        .single();

      if (error) throw error;

      const dbRole = data.role ?? 'user';

      // Re-check privileged from DB (may differ from cached profile)
      if (['owner', 'super_admin', 'admin'].includes(dbRole)) {
        set({ isPro: true, isLoading: false });
        useAuthStore.getState().setProfile({ ...profile, isPro: true, role: dbRole as any });
        return true;
      }

      // Check premium subscription expiry
      let isProNow = false;
      if (data.is_pro) {
        if (data.pro_expires_at && new Date(data.pro_expires_at) < new Date()) {
          // Subscription expired — trigger downgrade
          console.log('[PurchaseStore] pro_expires_at has passed. Downgrading...');
          await get().cancelPro();
          isProNow = false;
        } else if (data.trial_expires_at && new Date(data.trial_expires_at) < new Date()) {
          // Trial expired — trigger downgrade
          console.log('[PurchaseStore] Trial expired. Downgrading...');
          await get().cancelPro();
          isProNow = false;
        } else {
          isProNow = true;
        }
      }

      set({ isPro: isProNow, isLoading: false });
      useAuthStore.getState().setProfile({ 
        ...profile, 
        isPro: isProNow, 
        role: isProNow ? (dbRole as any) : 'user',
      });
      
      return isProNow;
    } catch (err) {
      reportError(err, { module: 'PurchaseStore', action: 'verifyProStatus.database' });
      set({ isLoading: false });
      return false;
    }
  },

  // ── Trial ────────────────────────────────────────────────────────────────

  hasUsedTrial: () => {
    return !!get().trialUsedAt;
  },

  syncTrialState: async (useCache = false) => {
    const profile = useAuthStore.getState().profile;
    if (!profile?.id) return;

    if (useCache && (profile.trialUsedAt !== undefined || profile.trialExpiresAt !== undefined)) {
      const trialUsedAt = profile.trialUsedAt ?? null;
      const trialExpiresAt = profile.trialExpiresAt ?? null;
      const now = new Date();
      const isTrialActive =
        !!trialUsedAt &&
        !!trialExpiresAt &&
        new Date(trialExpiresAt) > now &&
        !!profile.isPro;

      set({ trialUsedAt, trialExpiresAt, isTrialActive });
      return;
    }

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

    try {
      set({ isLoading: true });
      
      // Llamar al RPC para que el backend asigne las fechas seguras
      const { error } = await supabase.rpc('start_free_trial');
      if (error) throw error;

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      // Sincronizamos el estado local (asumiendo que el server hizo exactamente lo mismo)
      set({
        trialUsedAt: now.toISOString(),
        trialExpiresAt: expiresAt.toISOString(),
        isTrialActive: true,
        isLoading: false,
      });
      
      // Refrescar el perfil completo para sincronizar
      await useAuthStore.getState().fetchProfile(profile.id);

    } catch (err: any) {
      set({ isLoading: false });
      if (err?.message?.includes('TRIAL_ALREADY_USED')) {
        throw new Error('TRIAL_ALREADY_USED');
      }
      throw err;
    }
  },

  checkAndRevokeExpiredTrial: async (useCache = false) => {
    const profile = useAuthStore.getState().profile;
    if (!profile?.id) return;

    try {
      let trialUsedAt: string | null = null;
      let trialExpiresAt: string | null = null;
      let isProInDb = false;

      if (useCache && (profile.trialUsedAt !== undefined || profile.trialExpiresAt !== undefined)) {
        trialUsedAt = profile.trialUsedAt ?? null;
        trialExpiresAt = profile.trialExpiresAt ?? null;
        isProInDb = !!profile.isPro;
      } else {
        const { data, error } = await supabase
          .from('users')
          .select('trial_used_at, trial_expires_at, is_pro')
          .eq('id', profile.id)
          .single();

        if (error || !data) return;
        trialUsedAt = data.trial_used_at ?? null;
        trialExpiresAt = data.trial_expires_at ?? null;
        isProInDb = !!data.is_pro;
      }

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
