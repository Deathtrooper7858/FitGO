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
      // Prevent aggressive reconnects on slow/weak networks (default is 10s).
      // 30s gives the OS time to restore connectivity before attempting a new WS.
      timeout: 30000,
    },
    global: {
      headers: {
        // Encourage HTTP/1.1 connection reuse — each Supabase query opens to the
        // same host so keep-alive eliminates repeated TCP handshakes.
        'Connection': 'keep-alive',
      },
    },
  }
);

