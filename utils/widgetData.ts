import AsyncStorage from '@react-native-async-storage/async-storage';

const STORE_KEYS = {
  NUTRITION: 'ff-nutrition-v2',
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
    const [nutritionStr, authStr] = await Promise.all([
      AsyncStorage.getItem(STORE_KEYS.NUTRITION),
      AsyncStorage.getItem(STORE_KEYS.AUTH),
    ]);

    if (authStr) {
      const auth = JSON.parse(authStr);
      const profile = auth?.state?.profile;
      if (profile) {
        defaults.userName = (profile.name || '').split(' ')[0] || 'Usuario';
        defaults.calsTarget = profile.targetCalories || 2000;
        defaults.proteinTarget = profile.macros?.protein || 150;
      }
    }

    if (nutritionStr) {
      const nutrition = JSON.parse(nutritionStr);
      const state = nutrition?.state;
      if (state) {
        defaults.streak = state.streakDays || 0;

        const dateStr = new Date().toLocaleDateString('en-CA');

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
  } catch (e) {
    // Fail silently — show defaults if no data yet
  }

  return defaults;
}

export function getWidgetStoreKeys() {
  return STORE_KEYS;
}
