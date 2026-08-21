import { useAuthStore } from '../store/authStore';
import { usePurchaseStore } from '../store/purchaseStore';

export function useIsPro(): boolean {
  const { profile } = useAuthStore();
  const { isPro } = usePurchaseStore();
  return !!(isPro || profile?.isPro || profile?.role === 'pro_user' || profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'owner');
}
