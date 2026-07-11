/**
 * Centralized URL constants for FitGO.
 * All external API URLs should be defined here for maintainability.
 */

// ── Connectivity Check ───────────────────────────────────────────────────────
export const CONNECTIVITY_CHECK_URL = 'https://clients3.google.com/generate_204';

// ── Geo/Exchange Rate APIs ───────────────────────────────────────────────────
export const IP_WHOIS_URL = 'https://ipwhois.app/json/';
export const EXCHANGE_RATE_URL = 'https://open.er-api.com/v6/latest/USD';

// ── Push Notifications ───────────────────────────────────────────────────────
export const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// ── Food Database APIs ───────────────────────────────────────────────────────
export const OPEN_FOOD_FACTS_URL = 'https://world.openfoodfacts.org';

// ── Supabase Edge Functions (relative paths) ─────────────────────────────────
export const GROQ_PROXY_PATH = '/functions/v1/groq-proxy';
export const EDAMAM_PROXY_PATH = '/functions/v1/edamam-proxy';
