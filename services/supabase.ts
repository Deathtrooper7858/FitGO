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

const supabaseUrl     = process.env.EXPO_PUBLIC_SUPABASE_URL     ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  const msg =
    '[Supabase] ⚠️  Variables de entorno faltantes.\n' +
    'Crea un archivo .env en la raíz del proyecto con:\n' +
    '  EXPO_PUBLIC_SUPABASE_URL=...\n' +
    '  EXPO_PUBLIC_SUPABASE_ANON_KEY=...';
  // En producción solo loguear — no crashear el módulo de inicialización
  // (el error de auth se mostrará al intentar cualquier operación de DB).
  console.error(msg);
}

// ── Custom fetch with timeout and retries ───────────────────────────────────
// Prevents requests from hanging indefinitely and retries once on network failure.
const fetchWithTimeout: typeof fetch = async (input, init) => {
  const attemptFetch = async (retries: number): Promise<Response> => {
    const controller = new AbortController();
    const timeout = 10_000; // 10s per attempt to fail fast and retry
    const timer = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(input, { ...init, signal: controller.signal });
      clearTimeout(timer);
      return response;
    } catch (err: any) {
      clearTimeout(timer);
      // Retries on network or abort errors if we have attempts left
      const isNetworkOrAbortError = err.name === 'AbortError' || err.message?.includes('Network');
      if (retries > 0 && isNetworkOrAbortError) {
        // Simple backoff pause before retrying
        await new Promise(res => setTimeout(res, 500));
        return attemptFetch(retries - 1);
      }
      throw err;
    }
  };

  return attemptFetch(1); // 1 retry total (2 attempts)
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
      // Prevent aggressive reconnects on slow/weak networks.
      // 30s gives the OS time to restore connectivity before attempting a new WS.
      timeout: 30000,
      params: {
        // Reduce heartbeat frequency to save battery/bandwidth on mobile.
        heartbeatIntervalMs: 25000,
      },
    },
    global: {
      fetch: fetchWithTimeout,
      headers: {
        // Encourage HTTP/1.1 connection reuse — each Supabase query opens to the
        // same host so keep-alive eliminates repeated TCP handshakes.
        'Connection': 'keep-alive',
        // Hint CDN/proxy layers to cache read-only responses briefly.
        'Cache-Control': 'max-age=10',
      },
    },
  }
);


