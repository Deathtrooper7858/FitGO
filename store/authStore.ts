import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { SecureStorage } from '../utils/storage';
import { useSettingsStore } from './settingsStore';
import { UserProfile, AppLanguage } from './types';

interface AuthState {
  session:     Session | null;
  profile:     UserProfile | null;
  isLoading:   boolean;
  setSession:  (session: Session | null) => void;
  setProfile:  (profile: UserProfile | null) => void;
  setLoading:  (v: boolean) => void;
  clearAuth:   () => void;
  fetchProfile: (userId: string) => Promise<void>;
  loadCachedProfile: () => Promise<UserProfile | null>;
}

// Sensitive health fields that MUST be stored in SecureStore, not AsyncStorage
const HEALTH_FIELDS = [
  'dietaryRestrictions', 'medicalConditions', 'medicationsSupplements',
  'sex', 'age', 'weight', 'height',
] as const;

function extractHealthData(profile: UserProfile): Record<string, any> {
  const health: Record<string, any> = {};
  for (const field of HEALTH_FIELDS) {
    if (profile[field] !== undefined) {
      health[field] = profile[field];
    }
  }
  return health;
}

function mergeHealthData(profile: UserProfile, healthData: Record<string, any>): UserProfile {
  return { ...profile, ...healthData };
}

async function persistProfile(profile: UserProfile | null): Promise<void> {
  if (!profile) {
    await Promise.all([
      SecureStorage.removeItem('ff-health-profile'),
      SecureStorage.removeItem('ff-user-profile'),
    ]);
    return;
  }
  // Store sensitive health data as well as the full user profile in SecureStore
  const healthData = extractHealthData(profile);
  await Promise.all([
    SecureStorage.setItem('ff-health-profile', JSON.stringify(healthData)),
    SecureStorage.setItem('ff-user-profile', JSON.stringify(profile)),
  ]);
}

async function loadHealthData(): Promise<Record<string, any>> {
  try {
    const raw = await SecureStorage.getItem('ff-health-profile');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function loadCachedProfile(): Promise<UserProfile | null> {
  try {
    const raw = await SecureStorage.getItem('ff-user-profile');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserProfile;
    const cachedHealth = await loadHealthData();
    return mergeHealthData(parsed, cachedHealth);
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>()(
  (set, get) => ({
      session:    null,
      profile:    null,
      isLoading:  true,
      setSession: (session) => set({ session }),
      setProfile: async (profile) => {
        set({ profile });
        // Persist profile and health data to SecureStore whenever profile changes
        await persistProfile(profile);
      },
      setLoading: (isLoading) => set({ isLoading }),
      loadCachedProfile: async () => {
        const cached = await loadCachedProfile();
        if (cached) {
          set({ profile: cached });
          const now = new Date();
          const isCachedPro = !!(
            cached.isPro ||
            ['owner', 'super_admin', 'admin', 'pro_user'].includes(cached.role ?? '') ||
            (cached.trialExpiresAt && new Date(cached.trialExpiresAt) > now) ||
            (cached.proExpiresAt && new Date(cached.proExpiresAt) > now)
          );
          if (cached.premiumColor && isCachedPro) {
            useSettingsStore.getState().setPremiumColor(cached.premiumColor);
          }
          if (cached.language) {
            useSettingsStore.getState().setLanguage(cached.language);
          }
        }
        return cached;
      },
      clearAuth:  async () => {
        await Promise.all([
          SecureStorage.removeItem('ff-health-profile'),
          SecureStorage.removeItem('ff-user-profile'),
        ]);
        set({ session: null, profile: null, isLoading: false });
      },
      fetchProfile: async (userId: string) => {
        // Load cached health data from SecureStore first (for offline support)
        const cachedHealth = await loadHealthData();
        
        let retries = 3;
        while (retries > 0) {
          try {
            const { data, error } = await supabase
              .from('users')
              .select('id, email, name, avatar_url, name_color, premium_color, sex, age, weight, height, activity_level, goal, target_weight, starting_weight, tdee, target_calories, macros, available_foods, preferences, is_pro, role, trial_used_at, trial_expires_at, onboarding_done, lifestyle, extra_snacks, widgets_order, expo_push_token, notification_preferences, dietary_restrictions, medical_conditions, medications_supplements, diet_type, badges, selected_badge, unlocked_achievements, pinned_achievements, achievement_points, pro_expires_at, pro_will_renew')
              .eq('id', userId)
              .single();

            if (data && !error) {
              const now = new Date();
              const isProUser = !!(
                data.is_pro ||
                ['owner', 'super_admin', 'admin', 'pro_user'].includes(data.role ?? '') ||
                (data.trial_expires_at && new Date(data.trial_expires_at) > now) ||
                (data.pro_expires_at && new Date(data.pro_expires_at) > now)
              );

              const fetchedNameColor = (isProUser && !data.name_color) ? '#EAB308' : data.name_color;

              // Restore premium color: DB > session user_metadata > locally chosen color
              const currentSession = get().session;
              const metaColor = currentSession?.user?.user_metadata?.premium_color;
              const localColor = useSettingsStore.getState().premiumColor;

              let effectivePremiumColor: string | null = null;
              if (isProUser) {
                effectivePremiumColor = data.premium_color || metaColor || localColor || null;
                useSettingsStore.getState().setPremiumColor(effectivePremiumColor);

                // Backfill DB or metadata if one was missing
                if (effectivePremiumColor) {
                  if (!data.premium_color) {
                    Promise.resolve(supabase.from('users').update({ premium_color: effectivePremiumColor }).eq('id', userId)).catch(() => {});
                  }
                  if (metaColor !== effectivePremiumColor) {
                    supabase.auth.updateUser({ data: { premium_color: effectivePremiumColor } }).catch(() => {});
                  }
                }
              } else {
                // User is verified not pro
                useSettingsStore.getState().setPremiumColor(null);
              }

              // Restore language: account user_metadata > local setting
              const metaLang = currentSession?.user?.user_metadata?.language;
              const localLang = useSettingsStore.getState().language;
              const effectiveLang = (metaLang || localLang || 'en') as AppLanguage;
              useSettingsStore.getState().setLanguage(effectiveLang);

              if (!metaLang && localLang) {
                supabase.auth.updateUser({ data: { language: localLang } }).catch(() => {});
              }
              
              const freshProfile: UserProfile = {
                  id:             data.id,
                  email:          data.email,
                  name:           data.name,
                  avatarUrl:      data.avatar_url,
                  nameColor:      fetchedNameColor || undefined,
                  premiumColor:   isProUser ? (effectivePremiumColor || undefined) : undefined,
                  language:       effectiveLang,
                  sex:            data.sex,
                  age:            data.age,
                  weight:         data.weight,
                  height:         data.height,
                  activityLevel:  data.activity_level,
                  goal:           data.goal,
                  targetWeight:   data.target_weight,
                  startingWeight: data.starting_weight,
                  tdee:           data.tdee,
                  targetCalories: data.target_calories,
                  macros:         data.macros,
                  availableFoods: data.available_foods,
                  preferences:    data.preferences,
                  isPro:          isProUser,
                  role:           data.role || 'user',
                  trialUsedAt:    data.trial_used_at,
                  trialExpiresAt: data.trial_expires_at,
                  proExpiresAt:   data.pro_expires_at,
                  proWillRenew:   data.pro_will_renew,
                  onboardingDone: data.onboarding_done,
                  lifestyle:      data.lifestyle,
                  extraSnacks:    data.extra_snacks,
                  widgetsOrder:   data.widgets_order,
                  expoPushToken:          data.expo_push_token,
                  notificationPreferences: data.notification_preferences,
                  dietaryRestrictions:    data.dietary_restrictions    ?? [],
                  medicalConditions:      data.medical_conditions      ?? [],
                  medicationsSupplements: data.medications_supplements ?? [],
                  dietType:       data.diet_type       ?? 'recommended',
                  badges:         data.badges          ?? [],
                  selectedBadge:  data.selected_badge  ?? null,
                  unlockedAchievements: data.unlocked_achievements ?? [],
                  pinnedAchievements: data.pinned_achievements ?? [],
                  achievementPoints:  data.achievement_points ?? 0,
              };
              
              // Persist health data to SecureStore
              await persistProfile(freshProfile);
              set({ profile: freshProfile });
              return;
            } else {
              if (error?.code === 'PGRST116') {
                retries -= 1;
                if (retries === 0) {
                  // Use cached health data even if profile fetch fails
                  const profileWithCache = Object.keys(cachedHealth).length > 0
                    ? mergeHealthData({} as UserProfile, cachedHealth)
                    : null;
                  set({ profile: profileWithCache });
                }
                else await new Promise(resolve => setTimeout(resolve, 500));
              } else {
                set({ profile: null });
                return;
              }
            }
          } catch (err) {
            console.warn(`[AuthStore] Profile fetch error, retries left: ${retries - 1}`, err);
            retries -= 1;
            if (retries === 0) {
              // Retain cached health data for offline support
              if (Object.keys(cachedHealth).length > 0) {
                const currentProfile = get().profile;
                if (currentProfile) {
                  set({ profile: mergeHealthData(currentProfile, cachedHealth) });
                }
              }
            } else {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        }
      }
    })
);
