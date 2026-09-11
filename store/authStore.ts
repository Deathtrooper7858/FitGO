import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { SecureStorage } from '../utils/storage';
import { useSettingsStore } from './settingsStore';
import { UserProfile, AppLanguage, AppExperienceMode } from './types';

interface AuthState {
  session:     Session | null;
  profile:     UserProfile | null;
  isLoading:   boolean;
  setSession:  (session: Session | null) => void;
  setProfile:  (profile: UserProfile | null) => void;
  setLoading:  (v: boolean) => void;
  clearAuth:   () => Promise<void>;
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

async function persistSession(session: Session | null): Promise<void> {
  if (!session) {
    await SecureStorage.removeItem('ff-session');
    return;
  }
  await SecureStorage.setItem('ff-session', JSON.stringify(session));
}

async function loadCachedSession(): Promise<Session | null> {
  try {
    const raw = await SecureStorage.getItem('ff-session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
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

let inFlightFetchProfilePromise: Promise<void> | null = null;
let inFlightUserId: string | null = null;

export const useAuthStore = create<AuthState>()(
  (set, get) => ({
      session:    null,
      profile:    null,
      isLoading:  true,
      setSession: (session) => {
        set({ session });
        persistSession(session).catch(() => {});
      },
      setProfile: async (profile) => {
        set({ profile });
        // Persist profile and health data to SecureStore whenever profile changes
        await persistProfile(profile);
      },
      setLoading: (isLoading) => set({ isLoading }),
      loadCachedProfile: async () => {
        const [cached, cachedSession] = await Promise.all([
          loadCachedProfile(),
          loadCachedSession(),
        ]);
        if (cachedSession) {
          set({ session: cachedSession });
        }
        if (cached) {
          set({ profile: cached });
          if (cached.premiumColor) {
            if (useSettingsStore.getState().premiumColor !== cached.premiumColor) {
              useSettingsStore.getState().setPremiumColor(cached.premiumColor);
            }
          } else if (useSettingsStore.getState().premiumColor) {
            cached.premiumColor = useSettingsStore.getState().premiumColor || undefined;
          }
          if (cached.language) {
            if (useSettingsStore.getState().language !== cached.language) {
              useSettingsStore.getState().setLanguage(cached.language);
            }
          }
          if (cached.appMode) {
            if (useSettingsStore.getState().appMode !== cached.appMode) {
              useSettingsStore.getState().setAppMode(cached.appMode);
            }
          }
        }
        return cached;
      },
      clearAuth:  async () => {
        await Promise.all([
          SecureStorage.removeItem('ff-health-profile'),
          SecureStorage.removeItem('ff-user-profile'),
          SecureStorage.removeItem('ff-session'),
        ]);
        set({ session: null, profile: null, isLoading: false });
      },
      fetchProfile: async (userId: string) => {
        if (inFlightFetchProfilePromise && inFlightUserId === userId) {
          return inFlightFetchProfilePromise;
        }

        inFlightUserId = userId;
        inFlightFetchProfilePromise = (async () => {
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

                // Restore premium color: DB > locally chosen color > session user_metadata > cached profile
                const currentSession = get().session;
                const metaColor = currentSession?.user?.user_metadata?.premium_color;
                const localColor = useSettingsStore.getState().premiumColor;
                const cachedColor = get().profile?.premiumColor;

                const effectivePremiumColor: string | null =
                  data.premium_color || localColor || metaColor || cachedColor || null;

                if (effectivePremiumColor) {
                  if (useSettingsStore.getState().premiumColor !== effectivePremiumColor) {
                    useSettingsStore.getState().setPremiumColor(effectivePremiumColor);
                  }

                  // Backfill DB or metadata if one was missing
                  if (!data.premium_color) {
                    Promise.resolve(supabase.from('users').update({ premium_color: effectivePremiumColor }).eq('id', userId)).catch(() => {});
                  }
                  if (metaColor !== effectivePremiumColor) {
                    supabase.auth.updateUser({ data: { premium_color: effectivePremiumColor } }).catch(() => {});
                  }
                }

                // Restore language: account user_metadata > local setting
                const metaLang = currentSession?.user?.user_metadata?.language;
                const localLang = useSettingsStore.getState().language;
                const effectiveLang = (metaLang || localLang || 'en') as AppLanguage;
                if (useSettingsStore.getState().language !== effectiveLang) {
                  useSettingsStore.getState().setLanguage(effectiveLang);
                }

                if (!metaLang && localLang) {
                  supabase.auth.updateUser({ data: { language: localLang } }).catch(() => {});
                }

                // Restore appMode: DB > locally chosen mode > session user_metadata > cached profile > 'simple'
                const metaAppMode = currentSession?.user?.user_metadata?.app_mode;
                const localAppMode = useSettingsStore.getState().appMode;
                const cachedAppMode = get().profile?.appMode;
                const effectiveAppMode: AppExperienceMode =
                  ((data as any).app_mode || localAppMode || metaAppMode || cachedAppMode || 'simple') as AppExperienceMode;

                if (useSettingsStore.getState().appMode !== effectiveAppMode) {
                  useSettingsStore.getState().setAppMode(effectiveAppMode);
                }
                
                const freshProfile: UserProfile = {
                    id:             data.id,
                    email:          data.email,
                    name:           data.name,
                    avatarUrl:      data.avatar_url,
                    nameColor:      fetchedNameColor || undefined,
                    premiumColor:   effectivePremiumColor || undefined,
                    language:       effectiveLang,
                    appMode:        effectiveAppMode,
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
                    onboardingDone: Boolean(data.onboarding_done || data.goal || data.tdee || data.weight || get().profile?.onboardingDone),
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

                if (!data.onboarding_done && freshProfile.onboardingDone) {
                  Promise.resolve(supabase.from('users').update({ onboarding_done: true }).eq('id', userId)).catch(() => {});
                }
                
                // Persist health data to SecureStore
                await persistProfile(freshProfile);
                set({ profile: freshProfile });
                return;
              } else {
                if (error?.code === 'PGRST116') {
                  // User row does not exist yet -> brand new user requiring onboarding
                  const currentSession = get().session;
                  const newProfile: UserProfile = {
                    id:             userId,
                    email:          currentSession?.user?.email ?? '',
                    name:           currentSession?.user?.user_metadata?.full_name || currentSession?.user?.user_metadata?.name || '',
                    avatarUrl:      currentSession?.user?.user_metadata?.avatar_url || currentSession?.user?.user_metadata?.picture,
                    sex:            'other',
                    age:            25,
                    weight:         70,
                    height:         170,
                    activityLevel:  'moderate',
                    goal:           'maintain',
                    tdee:           2000,
                    targetCalories: 2000,
                    macros:         { protein: 150, carbs: 200, fat: 65 },
                    isPro:          false,
                    role:           'user',
                    onboardingDone: false,
                    appMode:        'advanced',
                  };
                  set({ profile: newProfile });
                  return;
                } else {
                  // General error (network/timeout): keep current cached profile if already present
                  const existing = get().profile;
                  if (!existing) {
                    set({ profile: null });
                  }
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
        })().finally(() => {
          if (inFlightUserId === userId) {
            inFlightFetchProfilePromise = null;
            inFlightUserId = null;
          }
        });

        return inFlightFetchProfilePromise;
      }
    })
);
