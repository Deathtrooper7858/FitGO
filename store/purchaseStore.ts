import { create } from 'zustand';
import { CustomerInfo, PurchasesOffering } from 'react-native-purchases';
import { supabase } from '../services/supabase';
import { useAuthStore } from './authStore';

interface PurchaseState {
  isPro: boolean;
  offering: PurchasesOffering | null;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  
  initialize: (userId?: string) => Promise<void>;
  updateCustomerInfo: (info: CustomerInfo) => void;
  fetchOfferings: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  grantPro: () => Promise<void>;
  cancelPro: () => Promise<void>;
  verifyProStatus: () => Promise<boolean>;
}

export const usePurchaseStore = create<PurchaseState>((set, get) => ({
  isPro: false,
  offering: null,
  isLoading: false,
  customerInfo: null,

  initialize: async (userId) => {
    // Check local/DB status since RevenueCat is inactive
    if (userId) {
      await get().verifyProStatus();
    }
    set({ isLoading: false });
  },

  updateCustomerInfo: (info) => {
    set({ customerInfo: info });
  },

  fetchOfferings: async () => {
    // API Inactivada
  },

  refreshStatus: async () => {
    // API Inactivada
  },

  grantPro: async () => {
    const profile = useAuthStore.getState().profile;
    if (!profile?.id) return;

    try {
      set({ isLoading: true });
      
      // Call RPC to update role, is_pro, and grant achievements
      const { error } = await supabase
        .rpc('upgrade_to_pro_user', { target_user_id: profile.id });

      if (error) throw error;

      set({ isPro: true, isLoading: false });
      useAuthStore.getState().setProfile({ ...profile, isPro: true });
    } catch (err: any) {
      console.error('❌ Error final en grantPro:', err.message || err);
      // Fallback local por si acaso falla la conexión
      set({ isPro: true, isLoading: false });
      useAuthStore.getState().setProfile({ ...profile, isPro: true });
    }
  },

  cancelPro: async () => {
    const profile = useAuthStore.getState().profile;
    if (!profile?.id) return;

    try {
      set({ isLoading: true });
      
      // Call RPC to cancel subscription
      const { error } = await supabase
        .rpc('cancel_pro_subscription', { target_user_id: profile.id });

      if (error) throw error;

      // Re-verify to see if they lost access immediately (within 24h)
      await get().verifyProStatus();
    } catch (err: any) {
      console.error('Error cancelling Pro:', err.message || err);
      set({ isLoading: false });
    }
  },

  verifyProStatus: async (): Promise<boolean> => {
    const profile = useAuthStore.getState().profile;
    if (!profile?.id) return false;

    try {
      set({ isLoading: true });
      const { data, error } = await supabase
        .rpc('verify_and_update_pro_status', { target_user_id: profile.id });

      if (error) throw error;

      const isProNow = !!data;
      set({ isPro: isProNow, isLoading: false });
      useAuthStore.getState().setProfile({ ...profile, isPro: isProNow });
      
      return isProNow;
    } catch (err) {
      console.error('Error verifying Pro status:', err);
      set({ isLoading: false });
      return false;
    }
  }
}));
