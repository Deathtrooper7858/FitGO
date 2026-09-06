import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import { calculateTDEE, calculateMacros } from '../services/foodDatabase';
import i18n from '../i18n';
import { reportError } from '../utils/errorReporter';
import { BodyMeasurement } from './types';
import { useAuthStore } from './authStore';
import { useToastStore } from './toastStore';

interface BodyState {
  measurements: BodyMeasurement[];
  isLoading: boolean;
  fetchMeasurements: (userId: string) => Promise<void>;
  addMeasurement: (measurement: BodyMeasurement) => Promise<void>;
  syncProfileWeight: (weight: number, date?: string) => Promise<void>;
  deleteMeasurement: (id: string) => Promise<void>;
  updateMeasurement: (id: string, updates: Partial<BodyMeasurement>) => Promise<void>;
  latest: () => BodyMeasurement | null;
  getForDate: (date: string) => BodyMeasurement | null;
  reset: () => void;
}

export const useBodyStore = create<BodyState>()(
  persist(
    (set, get) => ({
      measurements: [],
      isLoading: false,

      fetchMeasurements: async (userId: string) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase
            .from('body_measurements')
            .select('*')
            .eq('user_id', userId)
            .order('measured_at', { ascending: false });

          if (error) throw error;

          const parsed: BodyMeasurement[] = (data || []).map((m: any) => ({
            id: m.id,
            date: m.measured_at,
            weight: m.weight ?? undefined,
            bodyFat: m.body_fat_pct ?? undefined,
            chest: m.chest_cm ?? undefined,
            waist: m.waist_cm ?? undefined,
            hips: m.hip_cm ?? undefined,
            arms: m.arms_cm ?? undefined,
            legs: m.legs_cm ?? undefined,
            neck: m.neck_cm ?? undefined,
            notes: m.notes ?? undefined,
          }));

          set({ measurements: parsed });
        } catch (error: any) {
          if (error?.name === 'AbortError' || error?.message?.includes('AbortError')) {
            return; // Ignore normal request cancellations
          }
          reportError(error, { module: 'BodyStore', action: 'fetchMeasurements' });
        } finally {
          set({ isLoading: false });
        }
      },

      addMeasurement: async (measurement: BodyMeasurement) => {
        const { profile, setProfile } = useAuthStore.getState();
        if (!profile?.id) return;

        try {
          const existing = get().measurements.find(m => m.date === measurement.date);
          const mergedWeight = measurement.weight !== undefined ? measurement.weight : existing?.weight;
          const mergedBodyFat = measurement.bodyFat !== undefined ? measurement.bodyFat : existing?.bodyFat;
          const mergedChest = measurement.chest !== undefined ? measurement.chest : existing?.chest;
          const mergedWaist = measurement.waist !== undefined ? measurement.waist : existing?.waist;
          const mergedHips = measurement.hips !== undefined ? measurement.hips : existing?.hips;
          const mergedArms = measurement.arms !== undefined ? measurement.arms : existing?.arms;
          const mergedLegs = measurement.legs !== undefined ? measurement.legs : existing?.legs;
          const mergedNeck = measurement.neck !== undefined ? measurement.neck : existing?.neck;
          const mergedNotes = measurement.notes !== undefined ? measurement.notes : existing?.notes;

          const payload = {
            user_id: profile.id,
            measured_at: measurement.date,
            weight: mergedWeight,
            body_fat_pct: mergedBodyFat,
            chest_cm: mergedChest,
            waist_cm: mergedWaist,
            hip_cm: mergedHips,
            arms_cm: mergedArms,
            legs_cm: mergedLegs,
            neck_cm: mergedNeck,
            notes: mergedNotes,
          };

          const { data, error } = await supabase
            .from('body_measurements')
            .upsert(payload, { onConflict: 'user_id,measured_at' })
            .select()
            .single();

          if (error) throw error;

          const newM: BodyMeasurement = {
            id: data.id,
            date: data.measured_at,
            weight: data.weight ?? undefined,
            bodyFat: data.body_fat_pct ?? undefined,
            chest: data.chest_cm ?? undefined,
            waist: data.waist_cm ?? undefined,
            hips: data.hip_cm ?? undefined,
            arms: data.arms_cm ?? undefined,
            legs: data.legs_cm ?? undefined,
            neck: data.neck_cm ?? undefined,
            notes: data.notes ?? undefined,
          };

          set(state => {
            const filtered = state.measurements.filter(m => m.date !== newM.date);
            return {
              measurements: [newM, ...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            };
          });

          // Synchronize with user profile, recalculate TDEE & macros if weight changed and is latest
          if (newM.weight !== undefined && profile) {
            const currentLatest = get().measurements[0];
            const isLatest = !currentLatest || newM.date >= currentLatest.date;
            if (isLatest) {
              const { tdee } = calculateTDEE({
                weight: newM.weight,
                height: profile.height,
                age: profile.age,
                sex: profile.sex,
                activityLevel: profile.activityLevel,
                lifestyleLevel: profile.lifestyle,
              });
              const { targetCalories, protein, carbs, fat } = calculateMacros(tdee, profile.goal);
              const updatedProfile = {
                ...profile,
                weight: newM.weight,
                startingWeight: profile.startingWeight || newM.weight,
                tdee,
                targetCalories,
                macros: { protein, carbs, fat },
              };
              setProfile(updatedProfile);

              await supabase.from('users').update({
                weight: newM.weight,
                starting_weight: profile.startingWeight || newM.weight,
                tdee,
                target_calories: targetCalories,
                macros: { protein, carbs, fat },
                updated_at: new Date().toISOString(),
              }).eq('id', profile.id);
            }
          }

          useToastStore.getState().addNotification({
            title: i18n.t('body.measurementsUpdated', { defaultValue: 'Medidas Actualizadas' }),
            description: i18n.t('body.measurementsUpdatedDesc', { defaultValue: 'Tus medidas corporales se han guardado con éxito.' }),
            iconType: 'lucide',
            lucideIcon: 'Ruler',
            tier: 'plata',
            isAchievement: false
          });
        } catch (error) {
          reportError(error, { module: 'BodyStore', action: 'addMeasurement' });
        }
      },

      syncProfileWeight: async (weight: number, date?: string) => {
        const targetDate = date || new Date().toLocaleDateString('en-CA');
        await get().addMeasurement({
          id: `bm-${Date.now()}`,
          date: targetDate,
          weight,
        });
      },

      deleteMeasurement: async (id: string) => {
        set(state => ({
          measurements: state.measurements.filter(m => m.id !== id)
        }));
        try {
          const { error } = await supabase.from('body_measurements').delete().eq('id', id);
          if (error) throw error;
        } catch (error) {
          reportError(error, { module: 'BodyStore', action: 'deleteMeasurement', extra: { id } });
        }
      },

      updateMeasurement: async (id: string, updates: Partial<BodyMeasurement>) => {
        try {
          const payload: any = {};
          if (updates.weight !== undefined) payload.weight = updates.weight;
          if (updates.bodyFat !== undefined) payload.body_fat_pct = updates.bodyFat;
          if (updates.waist !== undefined) payload.waist_cm = updates.waist;
          if (updates.hips !== undefined) payload.hip_cm = updates.hips;
          if (updates.chest !== undefined) payload.chest_cm = updates.chest;
          if (updates.arms !== undefined) payload.arms_cm = updates.arms;
          if (updates.legs !== undefined) payload.legs_cm = updates.legs;
          if (updates.neck !== undefined) payload.neck_cm = updates.neck;
          if (updates.notes !== undefined) payload.notes = updates.notes;
          
          const { error } = await supabase.from('body_measurements').update(payload).eq('id', id);
          if (error) throw error;
          
          set(state => ({
            measurements: state.measurements.map(m => m.id === id ? { ...m, ...updates } : m)
          }));
        } catch (error) {
          reportError(error, { module: 'BodyStore', action: 'updateMeasurement', extra: { id } });
        }
      },
      
      latest: () => get().measurements[0] ?? null,
      getForDate: (date: string) => {
        return get().measurements.find(m => m.date <= date) ?? null;
      },
      reset: () => set({ measurements: [] }),
    }),
    {
      name: 'ff-body-measurements',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
