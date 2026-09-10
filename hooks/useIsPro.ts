import { useAuthStore } from '../store/authStore';
import { usePurchaseStore } from '../store/purchaseStore';

export function useIsPro(): boolean {
  const isPro = usePurchaseStore(s => s.isPro);
  const isTrialActive = usePurchaseStore(s => s.isTrialActive);
  const profileIsPro = useAuthStore(s => s.profile?.isPro);
  const trialExpiresAt = useAuthStore(s => s.profile?.trialExpiresAt);
  const proExpiresAt = useAuthStore(s => s.profile?.proExpiresAt);
  const role = useAuthStore(s => s.profile?.role);

  const now = new Date();
  const hasActiveTrial = isTrialActive || (
    !!trialExpiresAt && new Date(trialExpiresAt) > now
  );
  const hasActiveProSub = !!proExpiresAt && new Date(proExpiresAt) > now;

  return !!(
    isPro ||
    profileIsPro ||
    hasActiveTrial ||
    hasActiveProSub ||
    role === 'pro_user' ||
    role === 'admin' ||
    role === 'super_admin' ||
    role === 'owner'
  );
}
