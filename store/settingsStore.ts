import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { ThemeMode, AppLanguage, MassUnit, VolumeUnit, LengthUnit, EnergyUnit, TempUnit, Reminder } from './types';
import { useRecipesStore } from './recipesStore';


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

interface SettingsState {
  theme: ThemeMode;
  language: AppLanguage;
  massUnit: MassUnit;
  volumeUnit: VolumeUnit;
  lengthUnit: LengthUnit;
  energyUnit: EnergyUnit;
  tempUnit: TempUnit;
  reminders: Reminder[];
  premiumColor: string | null;
  setTheme: (theme: ThemeMode) => void;
  setPremiumColor: (color: string | null) => void;
  setLanguage: (lang: AppLanguage) => void;
  setMassUnit: (unit: MassUnit) => void;
  setVolumeUnit: (unit: VolumeUnit) => void;
  setLengthUnit: (unit: LengthUnit) => void;
  setEnergyUnit: (unit: EnergyUnit) => void;
  setTempUnit: (unit: TempUnit) => void;
  setReminders: (reminders: Reminder[]) => void;
}

const DEFAULT_REMINDERS: Reminder[] = [
  // MEAL
  { id: '1',  title: 'Desayuno',   body: '¡Hora de un desayuno saludable!',               time: '08:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'meal' },
  { id: '2',  title: 'Almuerzo',   body: '¡No olvides tu almuerzo nutritivo!',            time: '13:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'meal' },
  { id: '3',  title: 'Cena',       body: 'Hora de tu cena. ¡Que aproveche!',              time: '20:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'meal' },
  { id: '6',  title: 'Merienda',   body: '¡Hora de un snack saludable!',                  time: '16:30', enabled: false, days: [0,1,2,3,4,5,6], type: 'meal' },
  // WATER
  { id: '4',  title: 'Agua',       body: '¡Mantente hidratado! Bebe un vaso de agua.',   time: '10:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'water' },
  { id: '10', title: 'Agua tarde', body: '¡No olvides hidratarte por la tarde!',          time: '15:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'water' },
  // WORKOUT
  { id: '5',  title: 'Entreno',    body: '¡Hora de cumplir tu meta de movimiento!',      time: '18:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'workout' },
  { id: '8',  title: 'Caminata',   body: '¡Revisa tus pasos! Hora de una caminata.',     time: '12:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'workout' },
  { id: '11', title: 'Cardio',     body: '¡Activa tu cardio del día!',                   time: '07:00', enabled: false, days: [1,2,3,4,5],     type: 'workout' },
  // GENERAL
  { id: '7',  title: 'Vitaminas',  body: '¡Recuerda tomar tus vitaminas y suplementos!', time: '09:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'general' },
  { id: '9',  title: 'Dormir',     body: '¡Descansa bien para recuperarte!',             time: '22:30', enabled: false, days: [0,1,2,3,4,5,6], type: 'general' },
  { id: '12', title: 'Registro',   body: '¡Registra tus comidas de hoy en FitGo!',      time: '21:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'general' },
  // SOCIAL & COMPETITIVE
  { id: '13', title: 'Liga',        body: '¡La batalla de la liga no para! Revisa tu posición.', time: '09:30', enabled: false, days: [1,2,3,4,5], type: 'social' },
  { id: '14', title: 'Reto diario', body: '¡Completa el reto diario antes de que expire!',      time: '20:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'social' },
  { id: '15', title: 'Amigos',      body: '¡Mira qué están logrando tus amigos hoy!',          time: '18:30', enabled: false, days: [0,1,2,3,4,5,6], type: 'social' },
  { id: '16', title: 'Racha',       body: '¡No rompas tu racha! Registra tu progreso.',         time: '20:30', enabled: false, days: [0,1,2,3,4,5,6], type: 'social' },
  { id: '17', title: 'Logros',      body: '¡Tienes logros desbloqueados esperándote!',          time: '19:00', enabled: false, days: [0,6], type: 'social' },
  { id: '18', title: 'Leaderboard', body: '🔥 El ranking semanal termina pronto. ¡Sube posiciones!', time: '10:00', enabled: false, days: [5,6], type: 'social' },
  { id: '19', title: 'Mensajes',    body: '💬 ¡Tienes nuevos mensajes en FitGO Social!',       time: '14:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'social' },
];

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      language: 'en',
      massUnit: 'kg',
      volumeUnit: 'ml',
      lengthUnit: 'cm',
      energyUnit: 'kcal',
      tempUnit: 'c',
      reminders: DEFAULT_REMINDERS,
      premiumColor: null,
      setTheme: (theme) => set({ theme }),
      setPremiumColor: (premiumColor) => set({ premiumColor }),
      setLanguage: (language) => {
        // Clear cached search recipes so they regenerate in the new language
        useRecipesStore.getState().setRecipes([]);
        set({ language });
      },
      setMassUnit: (massUnit) => set({ massUnit }),
      setVolumeUnit: (volumeUnit) => set({ volumeUnit }),
      setLengthUnit: (lengthUnit) => set({ lengthUnit }),
      setEnergyUnit: (energyUnit) => set({ energyUnit }),
      setTempUnit: (tempUnit) => set({ tempUnit }),
      setReminders: (reminders) => set({ reminders }),
    }),
    {
      name: 'ff-settings',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);

