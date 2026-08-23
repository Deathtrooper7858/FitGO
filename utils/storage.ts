import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CHUNK_SIZE = 1800; // Under 2048 bytes limit for Android Keystore

export const SecureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try { return localStorage.getItem(key); } catch { return null; }
    }
    try {
      // Check if a chunked manifest exists
      const manifestRaw = await SecureStore.getItemAsync(`__mf_${key}`);
      if (manifestRaw) {
        const count = parseInt(manifestRaw, 10);
        if (!isNaN(count) && count > 0) {
          const chunkPromises = Array.from({ length: count }, (_, i) =>
            SecureStore.getItemAsync(`__ck_${i}_${key}`)
          );
          const chunks = await Promise.all(chunkPromises);
          if (chunks.every(c => c !== null)) {
            return chunks.join('');
          }
        }
      }
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
      // Clean up previous chunks if existed
      const prevManifest = await SecureStore.getItemAsync(`__mf_${key}`);
      if (prevManifest) {
        const prevCount = parseInt(prevManifest, 10);
        if (!isNaN(prevCount)) {
          for (let i = 0; i < prevCount; i++) {
            await SecureStore.deleteItemAsync(`__ck_${i}_${key}`).catch(() => {});
          }
        }
        await SecureStore.deleteItemAsync(`__mf_${key}`).catch(() => {});
      }

      if (value.length <= CHUNK_SIZE) {
        await SecureStore.setItemAsync(key, value);
      } else {
        // Chunk value
        const totalChunks = Math.ceil(value.length / CHUNK_SIZE);
        for (let i = 0; i < totalChunks; i++) {
          const chunk = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          await SecureStore.setItemAsync(`__ck_${i}_${key}`, chunk);
        }
        await SecureStore.setItemAsync(`__mf_${key}`, totalChunks.toString());
        // Clean single key
        await SecureStore.deleteItemAsync(key).catch(() => {});
      }
    } catch (e) {
      console.warn('[SecureStorage] setItem error for key:', key, e);
      // Do NOT rethrow — a SecureStore failure must never crash the app.
    }
  },

  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try { localStorage.removeItem(key); } catch { /* noop */ }
      return;
    }
    try {
      const manifestRaw = await SecureStore.getItemAsync(`__mf_${key}`);
      if (manifestRaw) {
        const count = parseInt(manifestRaw, 10);
        if (!isNaN(count)) {
          for (let i = 0; i < count; i++) {
            await SecureStore.deleteItemAsync(`__ck_${i}_${key}`).catch(() => {});
          }
        }
        await SecureStore.deleteItemAsync(`__mf_${key}`).catch(() => {});
      }
      await SecureStore.deleteItemAsync(key).catch(() => {});
    } catch (e) {
      console.warn('[SecureStorage] removeItem error for key:', key, e);
    }
  },
};
