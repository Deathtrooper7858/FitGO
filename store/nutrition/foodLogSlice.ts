import * as Crypto from 'expo-crypto';
import { FoodLog } from '../types';
import type { FoodItem } from '../../services/foodDatabase';
import { getLocalDateString } from '../../utils/date';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../authStore';
import { useToastStore } from '../toastStore';
import { useLeagueStore } from '../leagueStore';
import { NotificationTriggers } from '../../utils/notificationTriggers';
import i18n from '../../i18n';
import { memoRecalculateStreak } from './utils';
import { selectDailyTotals } from './selectors';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = (v: string | null | undefined): boolean =>
  !!v && UUID_REGEX.test(v);

function mapSupabaseRowToFoodLog(d: any): FoodLog {
  return {
    id: d.id,
    foodItem: {
      id: d.food_id ?? d.id, name: d.food_name,
      calories: d.grams > 0 ? Math.round((d.calories / d.grams) * 100) : d.calories,
      protein: d.grams > 0 ? Math.round((d.protein / d.grams) * 100) : d.protein,
      carbs: d.grams > 0 ? Math.round((d.carbs / d.grams) * 100) : d.carbs,
      fat: d.grams > 0 ? Math.round((d.fat / d.grams) * 100) : d.fat,
      fiber: d.grams > 0 ? Math.round((d.fiber / d.grams) * 100) : d.fiber,
      sugar: d.grams > 0 ? Math.round((d.sugar / d.grams) * 100) : d.sugar,
      sodium: d.grams > 0 ? Math.round((d.sodium / d.grams) * 100) : d.sodium,
      saturatedFat: d.grams > 0 ? Math.round((d.saturated_fat / d.grams) * 100) : d.saturated_fat,
      transFat: d.grams > 0 ? Math.round((d.trans_fat / d.grams) * 100) : d.trans_fat,
      cholesterol: d.grams > 0 ? Math.round((d.cholesterol / d.grams) * 100) : d.cholesterol,
      iron: d.grams > 0 ? Math.round((d.iron / d.grams) * 100) : d.iron,
      calcium: d.grams > 0 ? Math.round((d.calcium / d.grams) * 100) : d.calcium,
      source: 'custom',
    },
    grams: d.grams, meal: d.meal, loggedAt: d.logged_at,
    calories: d.calories, protein: d.protein, carbs: d.carbs, fat: d.fat,
    fiber: d.fiber, sugar: d.sugar, sodium: d.sodium, iron: d.iron, calcium: d.calcium,
    saturatedFat: d.saturated_fat, transFat: d.trans_fat, cholesterol: d.cholesterol,
    user_id: d.user_id, is_favorite: d.is_favorite,
  };
}

const _fetchLogsInProgress = new Set<string>();
const _fetchHistoryInProgress = new Set<string>();

export interface FoodLogSlice {
  todayLogs: FoodLog[];
  selectedDate: string;
  favoriteFoods: FoodItem[];
  addExtraSnack: () => Promise<void>;
  removeExtraSnack: () => Promise<void>;
  addLog: (log: FoodLog) => Promise<void>;
  removeLog: (id: string) => Promise<void>;
  updateLog: (id: string, updates: Partial<FoodLog>) => Promise<void>;
  setLogs: (logs: FoodLog[]) => void;
  addFavorite: (food: FoodItem) => void;
  removeFavorite: (id: string) => void;
  fetchLogs: (userId: string, date: string) => Promise<void>;
  fetchHistory: (userId: string) => Promise<void>;
}

export const initialFoodLogState = {
  todayLogs: [] as FoodLog[],
  selectedDate: new Date().toLocaleDateString('en-CA'),
  favoriteFoods: [] as FoodItem[],
};

export function createFoodLogSlice(set: any, get: any): FoodLogSlice {
  return {
    ...initialFoodLogState,

    addExtraSnack: async () => {
      const { profile, setProfile } = useAuthStore.getState();
      if (!profile) return;
      const newCount = (profile.extraSnacks || 0) + 1;
      setProfile({ ...profile, extraSnacks: newCount });
      if (profile.id) {
        try { await supabase.from('users').update({ extra_snacks: newCount }).eq('id', profile.id); }
        catch (err) { console.error('[NutritionStore] addExtraSnack sync error:', err); }
      }
    },

    removeExtraSnack: async () => {
      const { profile, setProfile } = useAuthStore.getState();
      if (!profile) return;
      const newCount = Math.max(0, (profile.extraSnacks || 0) - 1);
      setProfile({ ...profile, extraSnacks: newCount });
      if (profile.id) {
        try { await supabase.from('users').update({ extra_snacks: newCount }).eq('id', profile.id); }
        catch (err) { console.error('[NutritionStore] removeExtraSnack sync error:', err); }
      }
    },

    addLog: async (log) => {
      const safeLog = isValidUUID(log.id) ? log : { ...log, id: Crypto.randomUUID() };
      set((s: any) => ({ todayLogs: [...s.todayLogs, safeLog] }));
      get().updateActivity(safeLog.loggedAt.split('T')[0]);

      const mealNames: Record<string, string> = { breakfast: i18n.t('tracker.breakfast','Breakfast'), lunch: i18n.t('tracker.lunch','Lunch'), dinner: i18n.t('tracker.dinner','Dinner'), snack: i18n.t('tracker.snack','Snack') };
      const mealLabel = mealNames[safeLog.meal.toLowerCase()] || i18n.t('tracker.meal','Meal');
      useToastStore.getState().addNotification({
        title: `${mealLabel} ${i18n.t('tracker.registered','Registered')}`,
        description: i18n.t('tracker.kcalAdded','{{calories}} kcal have been added to your day.').replace('{{calories}}', String(safeLog.calories)),
        icon: '🍽️', iconType: 'emoji', tier: 'success', isAchievement: false,
      });

      const { profile } = useAuthStore.getState();
      if (profile?.id) {
        try {
          const { error } = await supabase.from('food_logs').insert({
            id: safeLog.id, user_id: profile.id, food_name: safeLog.foodItem.name,
            calories: safeLog.calories, protein: safeLog.protein, carbs: safeLog.carbs, fat: safeLog.fat,
            sugar: safeLog.sugar || 0, fiber: safeLog.fiber || 0, sodium: safeLog.sodium || 0,
            iron: safeLog.iron || 0, calcium: safeLog.calcium || 0,
            saturated_fat: safeLog.saturatedFat || 0, trans_fat: safeLog.transFat || 0,
            grams: safeLog.grams, meal: safeLog.meal, logged_at: safeLog.loggedAt,
          });
          if (error) {
            if (error.code === '23505') { console.log('[NutritionStore] Duplicate log prevented (23505).'); }
            else { console.warn('[NutritionStore] addLog Supabase error:', error); throw error; }
          }

          if (profile?.targetCalories) {
            const dateStr = safeLog.loggedAt.split('T')[0];
            const logsForDay = get().todayLogs.filter((l: FoodLog) => l.loggedAt.startsWith(dateStr));
            const totalCals = logsForDay.reduce((acc: number, l: FoodLog) => acc + l.calories, 0);
            const prevCals = totalCals - safeLog.calories;
            if (totalCals >= profile.targetCalories && prevCals < profile.targetCalories) NotificationTriggers.nutrition.calorieGoalReached();
            else if (totalCals >= profile.targetCalories * 0.9 && totalCals < profile.targetCalories && prevCals < profile.targetCalories * 0.9) NotificationTriggers.nutrition.calorieWarning();
          }

          void (async () => {
            try {
              const ls = useLeagueStore.getState();
              await ls.awardPoints(profile.id, 10, 'meal_log');
              const totals = selectDailyTotals(get());
              if (profile.targetCalories && profile.macros) {
                await ls.checkAndAwardMacroPoints(profile.id,
                  { calories: totals.calories, protein: totals.protein, carbs: totals.carbs, fat: totals.fat },
                  { calories: profile.targetCalories, protein: profile.macros.protein, carbs: profile.macros.carbs, fat: profile.macros.fat }
                );
              }
              await ls.fetchMySquad(profile.id);
            } catch (e) { __DEV__ && console.warn('[NutritionStore] Gamification error:', e); }
          })();
        } catch (err) { console.warn('[NutritionStore] addLog sync error:', err); throw err; }
      }
    },

    removeLog: async (id) => {
      set((s: any) => ({ todayLogs: s.todayLogs.filter((l: FoodLog) => l.id !== id) }));
      try {
        const { error } = await supabase.from('food_logs').delete().eq('id', id);
        if (error) { console.error('[NutritionStore] removeLog Supabase error:', error); throw error; }
      } catch (err) { console.error('[NutritionStore] removeLog sync error:', err); throw err; }
    },

    updateLog: async (id, updates) => {
      set((s: any) => ({
        todayLogs: s.todayLogs.map((l: FoodLog) => (l.id === id ? { ...l, ...updates, foodItem: updates.foodItem ? { ...l.foodItem, ...updates.foodItem } : l.foodItem } : l)),
      }));
      try {
        const dbUpdates: any = {};
        if (updates.meal) dbUpdates.meal = updates.meal;
        if (updates.grams !== undefined) dbUpdates.grams = updates.grams;
        if (updates.calories !== undefined) dbUpdates.calories = updates.calories;
        if (updates.protein !== undefined) dbUpdates.protein = updates.protein;
        if (updates.carbs !== undefined) dbUpdates.carbs = updates.carbs;
        if (updates.fat !== undefined) dbUpdates.fat = updates.fat;
        if (updates.foodItem?.name) dbUpdates.food_name = updates.foodItem.name;
        if (Object.keys(dbUpdates).length > 0) {
          const { error } = await supabase.from('food_logs').update(dbUpdates).eq('id', id);
          if (error) throw error;
        }
      } catch (err) { console.error('[NutritionStore] updateLog sync error:', err); throw err; }
    },

    setLogs: (logs) => set({ todayLogs: logs }),

    addFavorite: (food) => set((s: any) => ({
      favoriteFoods: s.favoriteFoods.find((f: FoodItem) => f.id === food.id) ? s.favoriteFoods : [...s.favoriteFoods, food],
    })),

    removeFavorite: (id) => set((s: any) => ({
      favoriteFoods: s.favoriteFoods.filter((f: FoodItem) => f.id !== id),
    })),

    fetchLogs: async (userId, date) => {
      const lockKey = `${userId}:${date}`;
      if (_fetchLogsInProgress.has(lockKey)) return;
      _fetchLogsInProgress.add(lockKey);

      try {
        const [foodResult, metricsResult, actResult] = await Promise.all([
          supabase.from('food_logs').select('*').eq('user_id', userId).eq('logged_at', date),
          supabase.from('daily_metrics').select('*').eq('user_id', userId).eq('date', date).maybeSingle(),
          supabase.from('activity_logs').select('*').eq('user_id', userId).eq('logged_at', date),
        ]);

        const { data, error } = foodResult;
        if (error) throw error;
        const metricsData = metricsResult.data;
        const actData = actResult.data;
        let hasActivityThisDay = false;

        if (metricsData) {
          if ((metricsData.water_ml ?? 0) > 0 || (metricsData.steps ?? 0) > 0 || (metricsData.sleep_hours ?? 0) > 0) hasActivityThisDay = true;
          set((s: any) => {
            const newWater = { ...s.dailyWater }; const newSteps = { ...s.dailySteps }; const newSleep = { ...s.dailySleep };
            const newNeat = { ...s.dailyNeat }; const newEx = { ...s.dailyExercise };
            if (metricsData.water_ml !== null) newWater[date] = metricsData.water_ml;
            if (metricsData.steps !== null) newSteps[date] = metricsData.steps;
            if (metricsData.sleep_hours !== null) newSleep[date] = Number(metricsData.sleep_hours);
            if (metricsData.neat_level) newNeat[date] = metricsData.neat_level;
            if (metricsData.exercise_level) newEx[date] = metricsData.exercise_level;
            return { dailyWater: newWater, dailySteps: newSteps, dailySleep: newSleep, dailyNeat: newNeat, dailyExercise: newEx };
          });
        }

        if (actData && actData.length > 0) {
          hasActivityThisDay = true;
          const formattedActs = actData.map((a: any) => ({ id: a.id, name: a.name, icon: a.icon, calories: a.calories, duration: a.duration, loggedAt: a.logged_at }));
          set((s: any) => {
            const otherActs = s.activityLogs.filter((act: any) => !act.loggedAt.startsWith(date));
            const mergedActs = new Map();
            s.activityLogs.filter((act: any) => act.loggedAt.startsWith(date)).forEach((a: any) => mergedActs.set(a.id, a));
            formattedActs.forEach((a: any) => mergedActs.set(a.id, a));
            return { activityLogs: [...otherActs, ...Array.from(mergedActs.values())] };
          });
        }

        if (data && data.length > 0) {
          hasActivityThisDay = true;
          const formattedLogs = data.map(mapSupabaseRowToFoodLog);
          set((s: any) => {
            const otherLogs = s.todayLogs.filter((log: FoodLog) => !log.loggedAt.startsWith(date));
            const mergedMap = new Map();
            s.todayLogs.filter((log: FoodLog) => log.loggedAt.startsWith(date)).forEach((l: FoodLog) => mergedMap.set(l.id, l));
            formattedLogs.forEach((l: any) => mergedMap.set(l.id, l));
            return { todayLogs: [...otherLogs, ...Array.from(mergedMap.values())] };
          });
        } else if (data && data.length === 0) {
          set((s: any) => {
            const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const otherLogs = s.todayLogs.filter((log: FoodLog) => !log.loggedAt.startsWith(date));
            const pendingLocal = s.todayLogs.filter((log: FoodLog) => log.loggedAt.startsWith(date) && UUID_RE.test(log.id));
            return { todayLogs: [...otherLogs, ...pendingLocal] };
          });
        }

        if (hasActivityThisDay) {
          const currentActiveDays = get().activeDays;
          if (!currentActiveDays[date]) {
            const rawDays = { ...currentActiveDays, [date]: true };
            const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 90);
            const cutoffStr = getLocalDateString(cutoff);
            const newActiveDays = Object.fromEntries(Object.entries(rawDays).filter(([d]) => d >= cutoffStr)) as Record<string, boolean>;
            set({ activeDays: newActiveDays, plannedDays: Object.keys(newActiveDays).length, streakDays: memoRecalculateStreak(newActiveDays) });
          }
        }

        const { activeDays } = get();
        const streak = memoRecalculateStreak(activeDays);
        if (get().streakDays !== streak) {
          set({ streakDays: streak });
          const { profile } = useAuthStore.getState();
          if (profile?.id) {
            void supabase.from('users').update({ current_streak: streak }).eq('id', profile.id);
            useLeagueStore.setState({ myStreak: streak });
          }
        }
      } catch (err: any) {
        if (err?.name === 'AbortError' || err?.message?.includes('AbortError')) return;
        console.error('[NutritionStore] fetchLogs error:', err); throw err;
      } finally { _fetchLogsInProgress.delete(lockKey); }
    },

    fetchHistory: async (userId) => {
      if (_fetchHistoryInProgress.has(userId)) return;
      _fetchHistoryInProgress.add(userId);
      try {
        const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const startDate = thirtyDaysAgo.toISOString().split('T')[0];
        
        const [foodRes, actRes] = await Promise.all([
          supabase.from('food_logs').select('*').eq('user_id', userId).gte('logged_at', startDate),
          supabase.from('activity_logs').select('*').eq('user_id', userId).gte('logged_at', startDate)
        ]);
        
        if (foodRes.error) throw foodRes.error;
        if (actRes.error) throw actRes.error;

        const data = foodRes.data || [];
        const actData = actRes.data || [];

        if (data || actData) {
          const formattedLogs = data.map(mapSupabaseRowToFoodLog);
          set((s: any) => {
            const remoteMap = new Map(formattedLogs.map((l: any) => [l.id, l]));
            const merged = new Map(s.todayLogs.map((l: FoodLog) => [l.id, l]));
            remoteMap.forEach((v, k) => merged.set(k, v));
            return { todayLogs: Array.from(merged.values()) };
          });
          const historyActiveDays: Record<string, boolean> = {};
          data.forEach((log: any) => { historyActiveDays[log.logged_at.split('T')[0]] = true; });
          actData.forEach((log: any) => { historyActiveDays[log.logged_at.split('T')[0]] = true; });
          set((s: any) => {
            const mergedDays = { ...s.activeDays, ...historyActiveDays };
            return { activeDays: mergedDays, plannedDays: Object.keys(mergedDays).length, streakDays: memoRecalculateStreak(mergedDays) };
          });
        }
      } catch (err) { console.error('[NutritionStore] fetchHistory error:', err); }
      finally { _fetchHistoryInProgress.delete(userId); }
    },
  };
}
