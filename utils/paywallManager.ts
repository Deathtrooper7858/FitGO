import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  HAS_SEEN_INITIAL: '@fitgo_paywall_has_seen_initial',
  LAST_SHOWN_AT: '@fitgo_paywall_last_shown_at',
  NEXT_INTERVAL_DAYS: '@fitgo_paywall_next_interval_days',
  FORCE_NEW_USER: '@fitgo_paywall_force_new_user',
  OPENS_SINCE_LAST_SHOWN: '@fitgo_paywall_opens_since_last_shown',
  TARGET_OPEN_INTERVAL: '@fitgo_paywall_target_open_interval',
};

// Intervalo por defecto: entre 4 y 6 aperturas de la app
const MIN_OPENS = 4;
const MAX_OPENS = 6;
// Cooldown mínimo de 4 horas entre apariciones automáticas para evitar intrusiones seguidas
const MIN_COOLDOWN_MS = 4 * 60 * 60 * 1000;

function getRandomIntervalOpens(minOpens = MIN_OPENS, maxOpens = MAX_OPENS): number {
  return Math.floor(Math.random() * (maxOpens - minOpens + 1)) + minOpens;
}

export const PaywallManager = {
  /**
   * Marca que el usuario completó el onboarding o es nuevo.
   * Inicializa el contador en 0 y programa que el paywall aparezca
   * tras unas cuantas aperturas (entre 4 y 6 aperturas).
   */
  async markAsNewUser(): Promise<void> {
    try {
      const initialInterval = getRandomIntervalOpens(MIN_OPENS, MAX_OPENS);
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.OPENS_SINCE_LAST_SHOWN, '0'),
        AsyncStorage.setItem(STORAGE_KEYS.TARGET_OPEN_INTERVAL, initialInterval.toString()),
        AsyncStorage.setItem(STORAGE_KEYS.HAS_SEEN_INITIAL, 'true'),
        AsyncStorage.removeItem(STORAGE_KEYS.FORCE_NEW_USER),
      ]);
    } catch (e) {
      console.warn('[PaywallManager] Error marking new user:', e);
    }
  },

  /**
   * Comprueba si se debe mostrar el paywall en la sesión actual al abrir la app.
   * Reglas:
   * 1. Si es Pro: NUNCA mostrar (false).
   * 2. Si se mostró recientemente (menos de 4 horas): NUNCA mostrar (false).
   * 3. Contador: Incrementa en 1 cada vez que se abre la app.
   * 4. Solo devuelve true cuando se alcanza el objetivo configurado (cada 4 a 6 aperturas).
   * 5. Al alcanzar el objetivo, reinicia atómicamente el contador a 0 de inmediato.
   */
  async shouldShowPaywall(isPro: boolean): Promise<boolean> {
    if (isPro) return false;

    try {
      const [opensStr, targetIntervalStr, lastShownAtStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.OPENS_SINCE_LAST_SHOWN),
        AsyncStorage.getItem(STORAGE_KEYS.TARGET_OPEN_INTERVAL),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_SHOWN_AT),
      ]);

      const now = Date.now();
      const lastShownAt = lastShownAtStr ? parseInt(lastShownAtStr, 10) : 0;
      const isCooldownActive = lastShownAt > 0 && (now - lastShownAt < MIN_COOLDOWN_MS);

      // Determinar objetivo de aperturas (entre 4 y 6 por defecto)
      let targetInterval = targetIntervalStr ? parseInt(targetIntervalStr, 10) : 0;
      if (!targetInterval || isNaN(targetInterval) || targetInterval < 3) {
        targetInterval = getRandomIntervalOpens(MIN_OPENS, MAX_OPENS);
        await AsyncStorage.setItem(STORAGE_KEYS.TARGET_OPEN_INTERVAL, targetInterval.toString());
      }

      // Incrementar contador de aperturas
      const currentOpens = parseInt(opensStr || '0', 10);
      const nextOpens = (isNaN(currentOpens) ? 0 : currentOpens) + 1;

      // Si aún no se alcanza el objetivo de aperturas o el cooldown sigue activo:
      if (nextOpens < targetInterval || isCooldownActive) {
        await AsyncStorage.setItem(STORAGE_KEYS.OPENS_SINCE_LAST_SHOWN, nextOpens.toString());
        return false;
      }

      // Se alcanzó el objetivo (cada unas cuantas aperturas):
      // Reiniciamos atómicamente el contador a 0 y fijamos el próximo intervalo
      const nextInterval = getRandomIntervalOpens(MIN_OPENS, MAX_OPENS);
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.OPENS_SINCE_LAST_SHOWN, '0'),
        AsyncStorage.setItem(STORAGE_KEYS.TARGET_OPEN_INTERVAL, nextInterval.toString()),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_SHOWN_AT, now.toString()),
        AsyncStorage.setItem(STORAGE_KEYS.HAS_SEEN_INITIAL, 'true'),
        AsyncStorage.removeItem(STORAGE_KEYS.FORCE_NEW_USER),
      ]);

      return true;
    } catch (e) {
      console.warn('[PaywallManager] Error checking paywall status:', e);
      return false;
    }
  },

  /**
   * Registra que el paywall fue mostrado en este momento y resetea el conteo de aperturas.
   */
  async recordPaywallShown(): Promise<void> {
    try {
      const nextInterval = getRandomIntervalOpens(MIN_OPENS, MAX_OPENS);
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.HAS_SEEN_INITIAL, 'true'),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_SHOWN_AT, Date.now().toString()),
        AsyncStorage.setItem(STORAGE_KEYS.OPENS_SINCE_LAST_SHOWN, '0'),
        AsyncStorage.setItem(STORAGE_KEYS.TARGET_OPEN_INTERVAL, nextInterval.toString()),
        AsyncStorage.removeItem(STORAGE_KEYS.FORCE_NEW_USER),
      ]);
    } catch (e) {
      console.warn('[PaywallManager] Error recording paywall shown:', e);
    }
  },

  /**
   * Obtiene el número de aperturas transcurridas desde la última vez que se mostró el paywall.
   */
  async getOpensSinceLastShown(): Promise<number> {
    try {
      const val = await AsyncStorage.getItem(STORAGE_KEYS.OPENS_SINCE_LAST_SHOWN);
      return val ? parseInt(val, 10) || 0 : 0;
    } catch {
      return 0;
    }
  },

  /**
   * Configura manualmente el objetivo de aperturas (útil para pruebas o configuraciones).
   */
  async setTargetOpenInterval(interval: number): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TARGET_OPEN_INTERVAL, interval.toString());
    } catch (e) {
      console.warn('[PaywallManager] Error setting target interval:', e);
    }
  },

  /**
   * Utilidad para reiniciar historial (pruebas / depuración).
   */
  async resetHistory(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.HAS_SEEN_INITIAL),
        AsyncStorage.removeItem(STORAGE_KEYS.LAST_SHOWN_AT),
        AsyncStorage.removeItem(STORAGE_KEYS.NEXT_INTERVAL_DAYS),
        AsyncStorage.removeItem(STORAGE_KEYS.FORCE_NEW_USER),
        AsyncStorage.removeItem(STORAGE_KEYS.OPENS_SINCE_LAST_SHOWN),
        AsyncStorage.removeItem(STORAGE_KEYS.TARGET_OPEN_INTERVAL),
      ]);
    } catch (e) {
      console.warn('[PaywallManager] Error resetting history:', e);
    }
  },
};
