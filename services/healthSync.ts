import { AppState, AppStateStatus } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { getLocalDateString } from '../utils/date';
import { useSyncStore } from '../store/syncStore';
import { supabase } from './supabase';

export interface HealthSyncStatus {
  isAvailable: boolean;
  hasPermission: boolean;
  todaySteps: number;
  estimatedActiveCalories: number;
  suggestedWaterMl: number;
}

/**
 * Checks if pedometer / step sensor hardware is available on the current device.
 */
export async function isPedometerAvailable(): Promise<boolean> {
  try {
    return await Pedometer.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Requests pedometer / motion activity permissions from the operating system.
 */
export async function requestPedometerPermission(): Promise<boolean> {
  try {
    const isAvail = await Pedometer.isAvailableAsync();
    if (!isAvail) return false;
    const { granted } = await Pedometer.requestPermissionsAsync();
    return granted;
  } catch {
    return false;
  }
}

/**
 * Fetches step count for today (00:00 to now) from device pedometer sensors.
 */
export async function fetchTodayPedometerSteps(): Promise<number> {
  try {
    const isAvail = await Pedometer.isAvailableAsync();
    if (!isAvail) return 0;

    const { granted } = await Pedometer.getPermissionsAsync();
    if (!granted) {
      const req = await Pedometer.requestPermissionsAsync();
      if (!req.granted) return 0;
    }

    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const result = await Pedometer.getStepCountAsync(start, end);
    return Math.max(0, result?.steps || 0);
  } catch (err) {
    console.warn('[HealthSync] Error fetching pedometer steps:', err);
    return 0;
  }
}

/**
 * Estimates active calories burned strictly from steps using user's weight or general average.
 * Standard metabolic guideline: ~0.00057 kcal per kg per step (~0.045 kcal/step for a 75kg person).
 */
export function estimateCaloriesFromSteps(steps: number, weightKg?: number): number {
  if (!steps || steps <= 0) return 0;
  const multiplier = weightKg && weightKg > 30 && weightKg < 250 ? 0.00057 * weightKg : 0.045;
  return Math.round(steps * multiplier);
}

/**
 * Calculates dynamic hydration recommendation based on baseline target,
 * logged cardio/workout calories, and daily step count.
 */
export function calculateDynamicWaterRecommendation(
  baseTargetMl: number = 2500,
  activityCalories: number = 0,
  steps: number = 0
): { baseMl: number; extraMl: number; totalMl: number } {
  const base = Math.max(1500, baseTargetMl || 2500);
  let extra = 0;

  if (activityCalories >= 450 || steps >= 11000) {
    extra = 600;
  } else if (activityCalories >= 300 || steps >= 8500) {
    extra = 450;
  } else if (activityCalories >= 150 || steps >= 6000) {
    extra = 300;
  } else if (activityCalories > 50 || steps >= 4000) {
    extra = 150;
  }

  return {
    baseMl: base,
    extraMl: extra,
    totalMl: base + extra,
  };
}

export interface SyncDailyHealthPayload {
  userId: string;
  date?: string;
  steps: number;
  waterMl?: number;
  sleepHours?: number;
  neatLevel?: string | null;
  exerciseLevel?: string | null;
  activeCalories?: number;
  suggestedWaterMl?: number;
}

/**
 * Synchronizes daily health metrics to Supabase (daily_metrics table).
 * Enqueues into syncStore if offline or when request fails.
 */
export async function syncHealthMetricsToCloud(payload: SyncDailyHealthPayload): Promise<boolean> {
  const date = payload.date || getLocalDateString(new Date());
  const body = {
    user_id: payload.userId,
    date,
    steps: Math.max(0, payload.steps || 0),
    water_ml: Math.max(0, payload.waterMl ?? 0),
    sleep_hours: payload.sleepHours ?? 0,
    neat_level: payload.neatLevel ?? null,
    exercise_level: payload.exerciseLevel ?? null,
    active_calories: Math.max(0, payload.activeCalories ?? 0),
    suggested_water_ml: Math.max(1500, payload.suggestedWaterMl ?? 2500),
  };

  try {
    const { error } = await supabase.from('daily_metrics').upsert(body, { onConflict: 'user_id,date' });
    if (error) throw error;
    return true;
  } catch (err: any) {
    console.warn('[HealthSync] Cloud sync failed, queueing offline task:', err?.message || err);
    try {
      useSyncStore.getState().enqueueTask({
        table: 'daily_metrics',
        method: 'RPC',
        rpcName: 'upsert_daily_metrics',
        payload: {
          p_date: date,
          p_water_ml: body.water_ml,
          p_steps: body.steps,
          p_sleep_hours: body.sleep_hours,
          p_neat_level: body.neat_level,
          p_exercise_level: body.exercise_level,
          p_active_calories: body.active_calories,
          p_suggested_water_ml: body.suggested_water_ml,
        },
      });
    } catch (qErr) {
      console.error('[HealthSync] Failed to enqueue offline task:', qErr);
    }
    return false;
  }
}

/**
 * Subscribes to AppState changes so when the app comes back to the foreground,
 * steps are refreshed from the device sensors and provided to the caller.
 */
export function setupForegroundHealthSync(onForegroundSteps: (steps: number) => void): () => void {
  let appState = AppState.currentState;

  const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      try {
        const steps = await fetchTodayPedometerSteps();
        if (steps > 0) {
          onForegroundSteps(steps);
        }
      } catch (e) {
        console.warn('[HealthSync] Foreground sync error:', e);
      }
    }
    appState = nextAppState;
  });

  return () => {
    subscription.remove();
  };
}
