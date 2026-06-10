import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../services/supabase';
import { BodyMeasurement } from './types';
import { useAuthStore } from './authStore';
import { useToastStore } from './toastStore';

// Secure storage adapter for Zustand
const secureStorage = {
  getItem: async (name: string) => {
    return (await SecureStore.getItemAsync(name)) || null;
  },
  setItem: async (name: string, value: string) => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string) => {
    await SecureStore.deleteItemAsync(name);
  },
};

interface BodyState {
  measurements: BodyMeasurement[];
  isLoading: boolean;
  fetchMeasurements: (userId: string) => Promise<void>;
  addMeasurement: (measurement: BodyMeasurement) => Promise<void>;
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
        } catch (error) {
          console.error('[BodyStore] Fetch error:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      addMeasurement: async (measurement: BodyMeasurement) => {
        const { profile } = useAuthStore.getState();
        if (!profile?.id) return;

        try {
          const payload = {
            user_id: profile.id,
            measured_at: measurement.date,
            weight: measurement.weight,
            body_fat_pct: measurement.bodyFat,
            chest_cm: measurement.chest,
            waist_cm: measurement.waist,
            hip_cm: measurement.hips,
            arms_cm: measurement.arms,
            legs_cm: measurement.legs,
            neck_cm: measurement.neck,
            notes: measurement.notes,
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

          useToastStore.getState().addNotification({
            title: 'Medidas Actualizadas',
            description: `Tus registros corporales han sido guardados.`,
            iconType: 'lucide',
            lucideIcon: 'Ruler',
            tier: 'plata',
            isAchievement: false
          });
        } catch (error) {
          console.error('[BodyStore] Add/Upsert error:', error);
        }
      },

      deleteMeasurement: async (id: string) => {
        set(state => ({
          measurements: state.measurements.filter(m => m.id !== id)
        }));
        try {
          const { error } = await supabase.from('body_measurements').delete().eq('id', id);
          if (error) throw error;
        } catch (error) {
          console.error('[BodyStore] Delete error:', error);
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
          console.error('[BodyStore] Update error:', error);
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
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
