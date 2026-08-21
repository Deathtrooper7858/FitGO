import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode, AppLanguage, MassUnit, VolumeUnit, LengthUnit, EnergyUnit, TempUnit, Reminder } from './types';
import { useRecipesStore } from './recipesStore';

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
  { id: '1',  title: 'Breakfast',   body: 'Time for a healthy breakfast!',               time: '08:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'meal' },
  { id: '2',  title: 'Lunch',       body: "Don't forget your nutritious lunch!",            time: '13:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'meal' },
  { id: '3',  title: 'Dinner',       body: 'Time for dinner. Enjoy!',              time: '20:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'meal' },
  { id: '6',  title: 'Snack',   body: 'Time for a healthy snack!',                  time: '16:30', enabled: false, days: [0,1,2,3,4,5,6], type: 'meal' },
  // WATER
  { id: '4',  title: 'Water',       body: 'Stay hydrated! Drink a glass of water.',   time: '10:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'water' },
  { id: '10', title: 'Afternoon Water', body: "Don't forget to hydrate in the afternoon!",          time: '15:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'water' },
  // WORKOUT
  { id: '5',  title: 'Workout',    body: 'Time to reach your movement goal!',      time: '18:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'workout' },
  { id: '8',  title: 'Walk',   body: 'Check your steps! Time for a walk.',     time: '12:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'workout' },
  { id: '11', title: 'Cardio',     body: 'Activate your cardio for the day!',                   time: '07:00', enabled: false, days: [1,2,3,4,5],     type: 'workout' },
  // GENERAL
  { id: '7',  title: 'Vitamins',  body: 'Remember to take your vitamins and supplements!', time: '09:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'general' },
  { id: '9',  title: 'Sleep',     body: 'Rest well to recover!',             time: '22:30', enabled: false, days: [0,1,2,3,4,5,6], type: 'general' },
  { id: '12', title: 'Log',   body: "Log your meals today in FitGo!",      time: '21:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'general' },
  // SOCIAL & COMPETITIVE
  { id: '13', title: 'League',        body: "The league battle never stops! Check your position.", time: '09:30', enabled: false, days: [1,2,3,4,5], type: 'social' },
  { id: '14', title: 'Daily challenge', body: "Complete the daily challenge before it expires!",      time: '20:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'social' },
  { id: '15', title: 'Friends',      body: "See what your friends are achieving today!",          time: '18:30', enabled: false, days: [0,1,2,3,4,5,6], type: 'social' },
  { id: '16', title: 'Streak',       body: "Don't break your streak! Log your progress.",         time: '20:30', enabled: false, days: [0,1,2,3,4,5,6], type: 'social' },
  { id: '17', title: 'Achievements',      body: 'You have unlocked achievements waiting for you!',          time: '19:00', enabled: false, days: [0,6], type: 'social' },
  { id: '18', title: 'Leaderboard', body: 'The weekly ranking ends soon. Climb the ladder!', time: '10:00', enabled: false, days: [5,6], type: 'social' },
  { id: '19', title: 'Messages',    body: 'You have new messages on FitGO Social!',       time: '14:00', enabled: false, days: [0,1,2,3,4,5,6], type: 'social' },
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
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

