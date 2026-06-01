import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Recipe } from './types';

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

interface RecipesState {
  recipes:       Recipe[];
  pinnedRecipes: Recipe[];
  setRecipes:    (recipes: Recipe[]) => void;
  togglePin:     (recipe: Recipe) => void;
  reset:         () => void;
}

export const useRecipesStore = create<RecipesState>()(
  persist(
    (set) => ({
      recipes:       [],
      pinnedRecipes: [],
      setRecipes:    (recipes) => set({ recipes }),
      togglePin:     (recipe) => set((s) => {
        const isPinned = s.pinnedRecipes.some(r => r.id === recipe.id);
        return {
          pinnedRecipes: isPinned
            ? s.pinnedRecipes.filter(r => r.id !== recipe.id)
            : [...s.pinnedRecipes, recipe],
        };
      }),
      reset: () => set({ recipes: [], pinnedRecipes: [] }),
    }),
    {
      name: 'ff-recipes',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
