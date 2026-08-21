import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const SecureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      // Web fallback: localStorage (no SecureStore on web)
      try { return localStorage.getItem(key); } catch { return null; }
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.warn('[SecureStorage] getItem error for key:', key, e);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try { localStorage.setItem(key, value); } catch { /* noop */ }
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.error('[SecureStorage] setItem error for key:', key, e);
      // Do NOT fall back to insecure storage — fail loudly instead
      throw e;
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try { localStorage.removeItem(key); } catch { /* noop */ }
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.warn('[SecureStorage] removeItem error for key:', key, e);
    }
  },
};

