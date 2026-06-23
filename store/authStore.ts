import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { useSettingsStore } from './settingsStore';
import { UserProfile } from './types';

interface AuthState {
  session:     Session | null;
  profile:     UserProfile | null;
  isLoading:   boolean;
  setSession:  (session: Session | null) => void;
  setProfile:  (profile: UserProfile | null) => void;
  setLoading:  (v: boolean) => void;
  clearAuth:   () => void;
  fetchProfile: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session:    null,
      profile:    null,
      isLoading:  true,
      setSession: (session) => set({ session }),
      setProfile: (profile) => set({ profile }),
      setLoading: (isLoading) => set({ isLoading }),
      clearAuth:  () => set({ session: null, profile: null, isLoading: false }),
      fetchProfile: async (userId: string) => {
        let retries = 3;
        while (retries > 0) {
          try {
            const { data, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', userId)
              .single();

            if (data && !error) {
              const fetchedNameColor = (data.is_pro && !data.name_color) ? '#EAB308' : data.name_color;
              const fetchedPremiumColor = data.premium_color || null;
              
              // Sincronizar con el store de configuraciones local
              if (fetchedPremiumColor) {
                useSettingsStore.getState().setPremiumColor(fetchedPremiumColor);
              }
              
              set({
                profile: {
                  id:             data.id,
                  email:          data.email,
                  name:           data.name,
                  avatarUrl:      data.avatar_url,
                  nameColor:      fetchedNameColor || undefined,
                  premiumColor:   fetchedPremiumColor || undefined,
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
                  isPro:          data.is_pro,
                  role:           data.role || 'user',
                  trialUsedAt:    data.trial_used_at,
                  trialExpiresAt: data.trial_expires_at,
                  onboardingDone: data.onboarding_done,
                  lifestyle:      data.lifestyle,
                  extraSnacks:    data.extra_snacks,
                  widgetsOrder:   data.widgets_order,
                  // ── Settings & Auth ──────────────────────────────────────
                  expoPushToken:          data.expo_push_token,
                  notificationPreferences: data.notification_preferences,
                  // ── Health Profile ────────────────────────────────────────
                  dietaryRestrictions:    data.dietary_restrictions    ?? [],
                  medicalConditions:      data.medical_conditions      ?? [],
                  medicationsSupplements: data.medications_supplements ?? [],
                  // ── Diet type (onboarding selection) ─────────────────────
                  dietType:       data.diet_type       ?? 'recommended',
                  // ── Gamification ─────────────────────────────────────────
                  badges:         data.badges          ?? [],
                  selectedBadge:  data.selected_badge  ?? null,
                  unlockedAchievements: data.unlocked_achievements ?? [],
                  pinnedAchievements: data.pinned_achievements ?? [],
                  achievementPoints:  data.achievement_points ?? 0,
                }
              });
              return; // Success, exit retry loop
            } else {
              if (error?.code === 'PGRST116') {
                // Row not found yet, likely due to DB trigger delay. Retry.
                retries -= 1;
                if (retries === 0) set({ profile: null });
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
              // Do NOT set profile to null here. Retain the cached profile for offline support.
            } else {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        }
      }
    }),
    {
      name: 'ff-auth-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ profile: s.profile }), // only persist profile, not session
    }
  )
);
