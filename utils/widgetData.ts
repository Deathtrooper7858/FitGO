import AsyncStorage from '@react-native-async-storage/async-storage';
import { SecureStorage } from './storage';
import { getLocalDateString } from './date';

const STORE_KEYS = {
  NUTRITION: 'ff-nutrition-v2',
  WIDGET_PROFILE: 'ff-widget-profile',
  AUTH: 'ff-auth',
};

export interface WidgetData {
  streak: number;
  calsConsumed: number;
  calsTarget: number;
  protein: number;
  proteinTarget: number;
  waterMl: number;
  waterTarget: number;
  userName: string;
}

export async function loadWidgetData(): Promise<WidgetData> {
  const defaults: WidgetData = {
    streak: 0,
    calsConsumed: 0,
    calsTarget: 2000,
    protein: 0,
    proteinTarget: 150,
    waterMl: 0,
    waterTarget: 2000,
    userName: 'Usuario',
  };

  try {
    const [nutritionStr, widgetProfileStr, authStr] = await Promise.all([
      AsyncStorage.getItem(STORE_KEYS.NUTRITION),
      AsyncStorage.getItem(STORE_KEYS.WIDGET_PROFILE),
      AsyncStorage.getItem(STORE_KEYS.AUTH),
    ]);

    // 1. Try dedicated widget profile first (fastest and non-sensitive)
    if (widgetProfileStr) {
      try {
        const wp = JSON.parse(widgetProfileStr);
        if (wp.userName) defaults.userName = wp.userName;
        if (wp.targetCalories) defaults.calsTarget = Number(wp.targetCalories);
        if (wp.proteinTarget) defaults.proteinTarget = Number(wp.proteinTarget);
      } catch {}
    } else if (authStr) {
      try {
        const auth = JSON.parse(authStr);
        const profile = auth?.state?.profile;
        if (profile) {
          defaults.userName = (profile.name || '').split(' ')[0] || 'Usuario';
          defaults.calsTarget = Number(profile.targetCalories) || 2000;
          defaults.proteinTarget = Number(profile.macros?.protein) || 150;
        }
      } catch {}
    } else {
      // Fallback: check SecureStorage if device is unlocked
      try {
        const cachedRaw = await SecureStorage.getItem('ff-user-profile');
        if (cachedRaw) {
          const profile = JSON.parse(cachedRaw);
          if (profile) {
            defaults.userName = (profile.name || '').split(' ')[0] || 'Usuario';
            defaults.calsTarget = Number(profile.targetCalories) || 2000;
            defaults.proteinTarget = Number(profile.macros?.protein) || 150;
          }
        }
      } catch {}
    }

    if (nutritionStr) {
      const nutrition = JSON.parse(nutritionStr);
      const state = nutrition?.state;
      if (state) {
        defaults.streak = state.streakDays || 0;

        const dateStr = getLocalDateString();

        const todayLogs = (state.todayLogs || []).filter(
          (l: any) => l.loggedAt && l.loggedAt.startsWith(dateStr)
        );
        todayLogs.forEach((l: any) => {
          defaults.calsConsumed += Number(l.calories || 0);
          defaults.protein += Number(l.protein || 0);
        });

        defaults.waterMl = state.dailyWater?.[dateStr] || 0;
      }
    }
  } catch {
    // Fail silently — show defaults if no data yet
  }

  return defaults;
}

export function getWidgetStoreKeys() {
  return STORE_KEYS;
}
