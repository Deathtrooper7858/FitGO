import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SecureStorage } from '../utils/storage';
import { Recipe } from './types';

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
      storage: createJSONStorage(() => SecureStorage),
    }
  )
);
