# Auditoría Completa — FitGO

**Fecha:** 16/06/2026
**Auditoría realizada por:** opencode AI (5 agentes en paralelo)
**Líneas de código fuente:** ~43,069 (124 archivos .ts/.tsx)
**Archivos auditados:** 17 stores + 6 services + 30+ componentes + 9 hooks + 25+ screens/modals + configs

---

## Resumen Ejecutivo

| Categoría | Hallazgos | Prioridad |
|---|---|---|
| Seguridad Crítica | 3 vulnerabilidades (keystore expuesto, credenciales en git, .gitignore corrupto) | 🔴 **CRÍTICA** |
| Bugs en Producción | 3 bugs que causan crashes/silent failures | 🔴 **CRÍTICA** |
| Seguridad Alta | 4 hallazgos (RLS permisivo, Stripe placeholder, AdMob test IDs, DM expuestos) | 🟠 ALTA |
| Calidad de Código | 58 `as any` router casts, 32 `any` en stores, 34 `any` en services | 🟠 ALTA |
| Performance | 10+ archivos >700 líneas, 100+ inline styles, sin memo | 🟠 ALTA |
| Console en Producción | 85+ en stores, 43+ en services, 100+ total sin `__DEV__` | 🟡 MEDIA |
| Código Muerto | 4+ bloques, 1 backup file, 3 stubs vacíos | 🟡 MEDIA |
| Duplicación Masiva | 3 coach screens 60% duplicados, 8× JSON extraction pattern | 🟡 MEDIA |
| node_modules | ~14.5 GB (778 paquetes) | 🟡 MEDIA |

---

## 🔴 CRÍTICO — Seguridad: Acción Inmediata

### C-1: Android Keystore Credentials en Plaintext — COMMITTED A GIT

**Archivo:** `credentials.json` (10 líneas, en git)
**Evidencia:**
```json
{
  "android": {
    "keystore": {
      "keystorePath": "@deathtrooper__fitgo.jks",
      "keystorePassword": "73bd754289d2280f6aa3a36dbf4690ba",
      "keyAlias": "48a4676f292d7e7bff5d1d3d8db62d43",
      "keyPassword": "7f7ae2ac65f26622d6881d849e312a9f"
    }
  }
}
```

**Riesgo:** Cualquiera con acceso al repo puede firmar APKs como FitGO developer y distribuir actualizaciones maliciosas. **Pérdida total de integridad de firma de código.**

**Además:** `@deathtrooper__fitgo.jks` (el keystore binario) también está en el repo.

### C-2: `.gitignore` Corrupto con Null Bytes — `credentials.json` NO está ignorado

**Archivo:** `.gitignore` (archivo binario corrupto al final)
**Problema:** Las entradas tienen bytes nulos `\x00` entre caracteres:
```
c\x00r\x00e\x00d\x00e\x00n\x00t\x00i\x00a\x00l\x00s\x00.\x00j\x00s\x00o\x00n
```
Esto hace que git NO ignore `credentials.json`. `git check-ignore credentials.json` no devuelve nada.

### C-3: Supabase Keys Hardcodeadas en `eas.json`

**Archivo:** `eas.json` (líneas 15, 29, 40)
**Problema:** `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` hardcodeadas en los 3 perfiles (development, preview, production). Mismo proyecto Supabase para todos los entornos — sin aislamiento.

---

## 🔴 CRÍTICO — Bugs en Producción

### B-1: Missing Import — `useToastStore` NO importado en `bodyStore.ts:111`

**Archivo:** `store/bodyStore.ts:111`
```typescript
useToastStore.getState().addNotification({...});  // ReferenceError en runtime
```
`useToastStore` se usa pero **nunca se importó**. Cualquier llamada a `addMeasurement()` lanza `ReferenceError`.

### B-2: State Corruption — `grantPro`/`cancelPro` actualizan estado local aunque falle DB

**Archivo:** `store/purchaseStore.ts:48-85`
```typescript
// grantPro (línea 55): set({ isPro: true }) se ejecuta incluso si RPC falla
// cancelPro (línea 78): set({ isPro: false }) se ejecuta incluso si RPC falla
```
El estado local y la DB se desincronizan silenciosamente.

### B-3: Legacy Alias Stale — `aiEnergy` no se actualiza en `consumeTextEnergy`

**Archivo:** `store/adStore.ts:25,95-103`
`aiEnergy` (alias legacy de `aiPhotoEnergy`) no se actualiza cuando se consume energía de texto. Después de usar créditos de texto, `aiEnergy` muestra valores incorrectos.

---

## 🟠 ALTA — Seguridad

### H-1: RLS Policies Permisivas

| Policy | Archivo | Problema |
|---|---|---|
| `Profiles are readable by everyone` | `029_allow_public_profile_view.sql` | Cualquier usuario autenticado lee TODOS los perfiles (email, nombre, avatar, datos salud) |
| `Anyone can view posts/likes/comments` | `020_add_social_feed.sql` | Posts visibles a todos, sin restricción de amigos |
| `search_users_by_email_or_id` (SECURITY DEFINER) | `019_add_social_features.sql` | **Email enumeration** vía ILIKE. Cualquier usuario puede buscar emails parciales. |

### H-2: Stripe Webhook — Placeholder para Service Role Key

**Archivo:** `web/app/api/stripe-webhook/route.ts:6-9`
```typescript
process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key"
```
Si la env var falta en producción, usará `"placeholder-key"` silenciosamente.

### H-3: AdMob App IDs de Test en Producción

**Archivo:** `app.json:90-92` + `android/.../AndroidManifest.xml:21`
IDs de test de Google (`ca-app-pub-3940256099942544`) — sin IDs reales, la app no genera ingresos por anuncios.

### H-4: RevenueCat Debug Logging sin `__DEV__`

**Archivo:** `services/revenuecat.ts:34`
```typescript
Purchases.setLogLevel(LOG_LEVEL.DEBUG);  // Siempre debug, incluso en producción
```

### H-5: Stripe Webhook Expone Detalles Internos

**Archivo:** `web/app/api/stripe-webhook/route.ts:42-47`
Expone `err.message` completo en respuesta HTTP — filtra detalles internos.

### H-6: `allowBackup="true"` sin Restricción

**Archivo:** `android/.../AndroidManifest.xml:20`
Backup rules XML referenciados (`@xml/secure_store_backup_rules`) **no existen**. SecureStore (auth tokens) podría respaldarse a Google Drive.

### H-7: `xlsx` desde CDN Externo con Tag `latest`

**package.json:** `"xlsx": "https://cdn.sheetjs.com/xlsx-latest/xlsx-latest.tgz"`
Versión no determinística — diferentes builds pueden obtener diferentes versiones.

---

## 🟠 ALTA — Calidad de Código

### T-1: 58 `as any` Router Casts

Casi TODAS las llamadas a `router.push()`/`router.navigate()` usan `as any`:
```typescript
router.push({ pathname: '/modals/scan', params: { mealType } } as any);
```
**Esto anula TODO el type-checking de rutas.** Si un nombre de parámetro cambia, no hay error en compilación.

### T-2: `any` Types Generalizado

| Área | Cantidad | Peor Archivo |
|---|---|---|
| Stores | 32 `any` | `leagueStore.ts` (11), `nutritionStore.ts` (11) |
| Services | 34 `any` | `groq.ts` (25) |
| Components | 40+ `any` | `MuscleSymmetryCard.tsx` (10+) |
| **Total** | **~100+ `any`** | — |

### T-3: Duplicación Masiva — 3 Coach Screens

`DoctorScreen.tsx` (950), `NutritionistScreen.tsx` (940), `TrainerScreen.tsx` (954):
- `darkenHex()`, `getSuggestionDetails()`, `renderFormattedContent()` — **idénticos** en los 3
- Chat UI (~150 líneas) — **idéntico**
- `handleSend()`, `handleNewChat()`, `handlePickImage()` — **idénticos**
- Audio recording setup — **idéntico**
- **~60% del código duplicado**

### T-4: Duplicación en `groq.ts` — 8× JSON Extraction + Markdown Stripping

```typescript
// Mismo patrón copiado 8 VECES
const startIndex = text.indexOf('{');
const endIndex = text.lastIndexOf('}');
if (startIndex !== -1 && endIndex !== -1) text = text.slice(startIndex, endIndex + 1);
```
Las funciones `transcribeAudio` y `fetchGroq` duplican la lógica de proxy-chain (5 proxies) en 3 sitios.

### T-5: `isProActually` Duplicado en 5+ Archivos

```typescript
isPro || profile?.isPro || profile?.role === 'pro_user' || ...
```
Copiado en `_layout.tsx`, `scan.tsx`, `add-activity.tsx`, `progress-evaluation.tsx`, `dashboard/index.tsx`.

### T-6: `require()` Dentro de Render

**Archivo:** `app/modals/social.tsx:196`
```typescript
require('../../hooks/useAchievements')  // ¡Causa recarga de módulo en cada render!
```

### T-7: Stale Closures en Dependency Arrays

**Archivo:** `components/DoctorScreen.tsx:668` (y NutritionistScreen, TrainerScreen)
`handleSend` usa `isPro` pero el array de dependencias no incluye `isPro`. Si el usuario se suscribe mientras el componente está montado, usa el valor obsoleto.

### T-8: `setTimeout` Sin Cleanup

- `components/PremiumGate.tsx:63` — `setTimeout` para router.push sin cleanup
- `components/AIEnergyGate.tsx:101,154` — Nested setTimeout sin cleanup

### T-9: Empty Catch Blocks (6+)

| Archivo | Línea | Problema |
|---|---|---|
| `foodDatabase.ts` | 192 | `catch {} // Silently ignore` |
| `groq.ts` | 907-911 | `catch { return []; }` — sin log |
| `groq.ts` | 997-998 | `catch { return 0; }` — sin log |
| `notifications.ts` | 128-130 | `catch { // Non-fatal }` |
| `leagueStore.ts` | 528-531 | `catch { // Non-fatal }` |

### T-10: Silent Error Returns (8+)

| Función | Retorno en error | Impacto |
|---|---|---|
| `groq.generateRecipes()` | `[]` | UI muestra "no recipes" |
| `groq.estimateActivityCalories()` | `0` | UI muestra 0 calorías |
| `revenuecat.checkEntitlement()` | `false` | **Premium se otorga gratis** en error de red |
| `groq.getFoodByBarcodeAI()` | `null` | Sin fallback visible |

---

## 🟡 MEDIA — Performance

### P-1: Archivos >700 Líneas (14 archivos, ~60% del código)

| Archivo | Líneas |
|---|---|
| `app/onboarding.tsx` | 2,164 |
| `app/(tabs)/planner/index.tsx` | 2,153 |
| `app/(tabs)/profile/index.tsx` | 1,976 |
| `components/social/FitGOCompetitive.tsx` | 1,705 |
| `app/modals/social.tsx` | 1,607 |
| `app/(tabs)/tracker/index.tsx` | 1,328 |
| `app/modals/add-activity.tsx` | 1,321 |
| `components/social/FitGOSocial.tsx` | 1,230 |
| `components/MuscleSymmetryCard.tsx` | 1,133 |
| `services/groq.ts` | 1,166 |
| `app/modals/scan.tsx` | 1,111 |
| `components/TrainerScreen.tsx` | 954 |
| `components/DoctorScreen.tsx` | 950 |
| `components/NutritionistScreen.tsx` | 940 |

### P-2: 100+ Inline Styles Recreados en Cada Render

Patrón ubicuo:
```typescript
<View style={{ backgroundColor: colors.primary + '18', borderRadius: 12 }} />
```
Esto crea nuevos objetos String en cada render, derrotando la memoización de React Native.

### P-3: Under-Optimized Renders

- Solo 2 componentes usan `React.memo` (`AICreditsBar`, `AIEnergyGate`)
- Componentes masivos (FitGOCompetitive 1,705 líneas) sin memo
- `Dimensions.get('window')` a nivel de módulo en 3 archivos — no se actualiza en rotación

### P-4: Console Log Masivo en Producción

| Store | Total | Sin `__DEV__` |
|---|---|---|
| `socialStore.ts` | 27 | 27 |
| `nutritionStore.ts` | 20 | 18 |
| `leagueStore.ts` | 17 | 16 |
| `adStore.ts` | 5 | 5 |
| `aiCreditsStore.ts` | 6 | 6 |
| `purchaseStore.ts` | 5 | 5 |
| **Total stores** | **85** | **81** |

| Services | Total | Sin `__DEV__` |
|---|---|---|
| `groq.ts` | 17 | 13 |
| `notifications.ts` | 14 | 14 |
| `revenuecat.ts` | 9 | 5 |
| **Total services** | **43** | **35** |

---

## 🟡 MEDIA — Código Muerto

### D-1: Backup File en Producción
- `components/social/FitGOSocial_backup.tsx` — 994 líneas

### D-2: RevenueCat Inactivo con Stubs
- `services/revenuecat.ts` — API desactivada ("API Inactivada")
- `store/purchaseStore.ts:27-42` — 3 métodos son stubs vacíos (`initialize`, `fetchOfferings`, `refreshStatus`)

### D-3: APIs Deprecadas en `adStore`
- `aiEnergy`, `consumeEnergy()`, `addEnergy()`, `addPhotoEnergy()`, `addTextEnergy()` — marcadas `@deprecated` pero aún parte de la interfaz pública

### D-4: Unused Imports (10+)

| Archivo | Import no usado |
|---|---|
| `app/_layout.tsx:50` | `registerForPushNotificationsAsync` |
| `app/(tabs)/_layout.tsx:5` | `Trophy` de lucide-react |
| `app/(tabs)/tracker/index.tsx:28-29` | `withRepeat, withSequence, interpolate, Extrapolation` |
| `app/(tabs)/dashboard/index.tsx:10,22,27` | `Shadow, FadeIn, FadeInUp, ChevronRight, Scale` |
| `app/modals/scan.tsx:24` | `AudioModule` de expo-audio |
| `app/modals/chat.tsx:4` | `Alert` de react-native |
| `services/revenuecat.ts:2` | `PurchasesOffering` |
| `store/nutritionStore.ts:17` | `LEAGUE_POINTS` |

### D-5: `STREAK_MULTIPLIERS` y `LEAGUE_POINTS.SQUAD_SYNERGY` Definidos pero Nunca Usados
- `store/leagueStore.ts:83-90`

---

## ⚪ BAJA — Configuración de Build

### Build Config Gaps
- Metro (React Native): Sin compresión, sin analizador de bundle, sin code-splitting
- Next.js (Web): Sin bundle analyzer configurado, sin PWA completo
- `.npmrc`: `legacy-peer-deps=true` — oculta conflictos reales de dependencias
- React version mismatch: Root `19.2.0` vs Web `19.2.4`
- Supabase version mismatch: Root `2.105.0` vs Web `2.106.2`

---

## Resumen de Impacto Estimado

| Métrica | Actual | Potencial |
|---|---|---|
| Vulnerabilidades CRÍTICAS | 3 | 0 |
| Bugs en producción | 3 | 0 |
| `as any` router casts | 58 | 0 |
| `any` types | ~100+ | 0 |
| Console sin `__DEV__` | ~120+ | 0 |
| Archivos >700 líneas | 14 | 5-8 |
| Código duplicado | ~60% (coach screens) | ~10% |
| node_modules | ~14.5 GB | ~10 GB |
