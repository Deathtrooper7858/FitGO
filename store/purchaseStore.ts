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
    // RevenueCat API Inactivada
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
      const { error } = await supabase.rpc('upgrade_to_pro_user', { target_user_id: profile.id });
      if (error) {
        console.error('Error upgrading to pro via RPC:', error);
      }
      
      set({ isPro: true, isLoading: false });
      // update local profile with new role
      useAuthStore.getState().setProfile({ ...profile, isPro: true, role: 'pro_user' });
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
      }
      
      set({ isPro: false, isLoading: false });
      // restore user role locally
      useAuthStore.getState().setProfile({ ...profile, isPro: false, role: 'user' });
    } catch (err) {
      console.error(err);
      set({ isLoading: false });
    }
  },

  verifyProStatus: async (): Promise<boolean> => {
    const profile = useAuthStore.getState().profile;
    if (!profile?.id) return false;

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
      console.error('Error verifying Pro status:', err);
      set({ isLoading: false });
      return false;
    }
  }
}));
