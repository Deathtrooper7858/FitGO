/**
 * Supabase client singleton para FitGO.
 * Lee credenciales de variables de entorno (definidas en .env o EAS secrets).
 *
 * ⚠️  SEGURIDAD: No añadir valores por defecto reales aquí.
 *    Las claves de producción deben venir SIEMPRE de variables de entorno.
 *    Para CI/CD usar EAS Secrets (eas secret:create).
 */
import { createClient } from '@supabase/supabase-js';
import { SecureStorage } from '../utils/storage';
import { logger } from '../utils/logger';

const supabaseUrl     = process.env.EXPO_PUBLIC_SUPABASE_URL     ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  const msg =
    '[Supabase] ⚠️  Variables de entorno faltantes.\n' +
    'Crea un archivo .env en la raíz del proyecto con:\n' +
    '  EXPO_PUBLIC_SUPABASE_URL=...\n' +
    '  EXPO_PUBLIC_SUPABASE_ANON_KEY=...';
  logger.warn(msg);
}

// ── Custom fetch with exponential backoff and circuit-breaker awareness ────
// Prevents requests from hanging indefinitely and retries with backoff on failure.
const MAX_RETRIES = 2;
const BASE_TIMEOUT = 10_000;

const fetchWithTimeout: typeof fetch = async (input, init) => {
  const attemptFetch = async (attempt: number): Promise<Response> => {
    const controller = new AbortController();
    const timeout = BASE_TIMEOUT * (attempt + 1);
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(input, { ...init, signal: controller.signal });
      clearTimeout(timer);
      if (!response.ok && response.status >= 429 && attempt < MAX_RETRIES) {
        const backoff = Math.min(1000 * Math.pow(2, attempt), 4000);
        await new Promise(res => setTimeout(res, backoff));
        return attemptFetch(attempt + 1);
      }
      return response;
    } catch (err: any) {
      clearTimeout(timer);
      const retryable = err.name === 'AbortError' || err.message?.includes('Network') || err.message?.includes('fetch');
      if (attempt < MAX_RETRIES && retryable) {
        const backoff = Math.min(500 * Math.pow(2, attempt), 3000);
        await new Promise(res => setTimeout(res, backoff));
        return attemptFetch(attempt + 1);
      }
      throw err;
    }
  };

  return attemptFetch(0);
};

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage:            SecureStorage,
      autoRefreshToken:   true,
      persistSession:     true,
      detectSessionInUrl: false,
      flowType:           'pkce',
    },
    realtime: {
      timeout: 30000,
      params: {
        heartbeatIntervalMs: 25000,
      },
    },
    global: {
      fetch: fetchWithTimeout,
      headers: {
        'Connection': 'keep-alive',
        'Cache-Control': 'max-age=10',
      },
    },
  }
);


