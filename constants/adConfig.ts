import { TestIds } from 'react-native-google-mobile-ads';

/**
 * ─────────────────────────────────────────────────────────────
 *  FitGO AdMob Configuration
 * ─────────────────────────────────────────────────────────────
 *
 *  En modo DEVELOPMENT (__DEV__ === true) se usan los IDs de
 *  prueba de Google automáticamente. No se requiere configuración.
 *
 *  Para PRODUCCIÓN (Play Store), reemplaza los valores de abajo
 *  con los IDs reales de tu cuenta de Google AdMob:
 *  https://apps.admob.com
 *
 *  Formato: ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
 * ─────────────────────────────────────────────────────────────
 */

// ══════════════════════════════════════════════════════════════
//  🚀 PRODUCCIÓN — Reemplaza aquí con tus IDs reales de AdMob
// ══════════════════════════════════════════════════════════════
const PROD_IDS = {
  /** ID del anuncio a pantalla completa (Interstitial) */
  interstitial: 'ca-app-pub-6675982933894700/4679709085',

  /** ID del video de recompensa (Rewarded) — para recargar créditos IA */
  rewarded: 'ca-app-pub-6675982933894700/5399939989',
};

// ══════════════════════════════════════════════════════════════
//  ✅ TEST — IDs automáticos de Google (no modificar)
// ══════════════════════════════════════════════════════════════
const TEST_IDS = {
  interstitial: TestIds.INTERSTITIAL,
  rewarded: TestIds.REWARDED,
};

/**
 * IDs activos según el entorno.
 * En desarrollo usa Test, en producción usa los reales.
 */
export const AD_UNIT_IDS = __DEV__ ? TEST_IDS : PROD_IDS;

// ══════════════════════════════════════════════════════════════
//  ⚙️ Configuración de frecuencia de anuncios
// ══════════════════════════════════════════════════════════════
export const AD_CONFIG = {
  /**
   * Tiempo mínimo (en ms) entre dos Interstitials.
   * Por defecto: 30 minutos. Evita saturar al usuario.
   */
  interstitialCooldownMs: 30 * 60 * 1000,

  /**
   * Créditos de IA que recibe un usuario Free por día (foto).
   */
  freeAICreditsPerDay: 3,

  /**
   * Créditos de IA que recibe un usuario Free por día (texto).
   */
  freeAITextCreditsPerDay: 5,

  /**
   * Créditos de IA que se ganan viendo un video Rewarded (foto).
   */
  rewardedAdCredits: 1,

  /**
   * Créditos de IA que se ganan viendo un video Rewarded (texto).
   */
  rewardedAdTextCredits: 1,

  /**
   * Máximo de créditos acumulables (para evitar stockpiling).
   */
  maxAICredits: 10,
};
