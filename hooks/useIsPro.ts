import { useAuthStore } from '../store/authStore';
import { usePurchaseStore } from '../store/purchaseStore';

export function useIsPro(): boolean {
  const { profile } = useAuthStore();
  const { isPro, isTrialActive } = usePurchaseStore();

  const now = new Date();
  const hasActiveTrial = isTrialActive || (
    !!profile?.trialExpiresAt && new Date(profile.trialExpiresAt) > now
  );
  const hasActiveProSub = !!profile?.proExpiresAt && new Date(profile.proExpiresAt) > now;

  return !!(
    isPro ||
    profile?.isPro ||
    hasActiveTrial ||
    hasActiveProSub ||
    profile?.role === 'pro_user' ||
    profile?.role === 'admin' ||
    profile?.role === 'super_admin' ||
    profile?.role === 'owner'
  );
}
