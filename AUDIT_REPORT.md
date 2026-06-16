# Auditoría Completa — FitGO

**Fecha:** 16/06/2026  
**Líneas de código:** ~43,069 (124 archivos .ts/.tsx)  
**node_modules:** ~14.5 GB (778 paquetes)

---

## Resumen Ejecutivo

| Categoría | Hallazgos | Prioridad |
|---|---|---|
| Seguridad | 2 vulnerabilidades HIGH, 1 MODERATE, 1 LOW | 🔴 Crítica |
| Código Muerto | 6+ bloques de dead code, 1 backup file (994 líneas) | 🟠 Alta |
| Performance | 4 imports masivos de lucide-react-native, sin memo, barrel imports | 🟠 Alta |
| Bundle | ~10-13 MB en dependencias no usadas | 🟠 Alta |
| node_modules | 14.5 GB — paquetes no usados ocupan ~3-4 GB | 🟠 Alta |
| Calidad Código | 100+ console.log sin guarda, duplicación, hardcoded values | 🟡 Media |
| Build Config | Sin compresión, sin analizador, sin code-splitting explícito | 🟡 Media |
| Accesibilidad | No revisada | ⚪ Baja |

---

## 🔴 1. Seguridad — Acción Inmediata

### 1.1 `npm audit` — 4 vulnerabilidades

| Paquete | Severidad | Problema | Solución |
|---|---|---|---|
| `form-data` (transitivo) | **HIGH** | CRLF injection en nombres de campo multipart | `npm audit fix` |
| `ws` (transitivo, 7.x) | **HIGH** | DoS por memory exhaustion | `npm audit fix` |
| `js-yaml` (transitivo) | MODERATE | DoS quadratic-complexity en merge keys | `npm audit fix --force` (breaking) |
| `@babel/core` | LOW | Arbitrary File Read via sourceMappingURL | `npm audit fix` |

**Acción:** Ejecutar `npm audit fix` inmediatamente.

---

## 🟠 2. Código Muerto y Archivos Huérfanos

### 2.1 Backup file en producción
- **`components/social/FitGOSocial_backup.tsx`** — 994 líneas, backup dejado en el árbol de fuentes.

### 2.2 `cachedQuery` / `invalidateCache` en supabase.ts
- **`services/supabase.ts:88-114`** — Funciones exportadas pero **nunca importadas** en ningún archivo.

### 2.3 APIs deprecadas en adStore
- **`store/adStore.ts`** — `aiEnergy`, `consumeEnergy()`, `addEnergy()`, `addPhotoEnergy()`, `addTextEnergy()` — todas marcadas `@deprecated` y persistidas innecesariamente.

### 2.4 RevenueCat en desuso
- **`services/revenuecat.ts`** — Integración con RevenueCat inactiva ("API Inactivada").  
- **`store/purchaseStore.ts`** — Todos los métodos son stubs.  
- **`react-native-purchases-ui`** — Solo existe en un import comentado.

### 2.5 Dynamic require en workoutHistoryStore
- **`store/workoutHistoryStore.ts:32,48,50`** — Usa `require('./authStore')` en vez de import estático.

### 2.6 `lottie-react-native` — Solo en comentarios
- El paquete está instalado pero solo hay imports comentados (`// import LottieView from 'lottie-react-native'`).

---

## 🟠 3. Performance y Bundle

### 3.1 Import masivo de `lucide-react-native` (⭐ crítico)
**4 archivos** importan TODO el icon library:
- `app/modals/achievements.tsx:6`
- `app/(tabs)/profile/index.tsx:36`
- `app/modals/user-profile.tsx:8`
- `components/AppToast.tsx:8`

`lucide-react-native` pesa **20.72 MB** en node_modules. El `import *` impide tree-shaking.

**Acción:** Reemplazar con imports selectivos.

### 3.2 Dependencias no usadas (ahorro estimado: ~10-13 MB)

| Paquete | Tamaño en bundle | Razón |
|---|---|---|
| `openai` | ~2-4 MB | Nunca importado. Se usa Groq API. |
| `react-native-nitro-image` | ~1.5 GB (nativas) | Nunca importado. |
| `react-native-nitro-modules` | ~1.3 GB (nativas) | Nunca importado. |
| `react-native-url-polyfill` | ~200 KB | Nunca importado. |
| `xlsx` | ~5 MB | Solo usado en planner. Podría lazy-load. |
| `lottie-react-native` | ~1-2 MB | Solo en comentarios. |
| `react-native-purchases-ui` | ~500 KB | Solo en comentarios. |

### 3.3 Componentes sin memo
- `app/(tabs)/dashboard/index.tsx` — `ScoreRing` y `AchievementPreview` definidos como componentes internos, se recrean en cada render.
- `components/AIEnergyGate.tsx` — Lógica compleja de animación sin memo.
- `components/AICreditsBar.tsx` — Renderizado frecuente sin memo.

### 3.4 `Dimensions.get('window')` a nivel de módulo
- `app/(tabs)/dashboard/index.tsx:36`
- `components/GoalWizardModal.tsx:18`
- `components/AppToast.tsx:12`

Nunca se actualizan en rotación de pantalla.

### 3.5 Barrel import de stores
- **`store/index.ts`** exporta todas las stores. Varios archivos importan desde el barrel, lo que carga stores no necesarias.

---

## 🟡 4. Calidad de Código

### 4.1 Duplicación de código

| Código duplicado | Archivos | Líneas |
|---|---|---|
| `secureStorage` adapter (Zustand persist) | 5 stores | ~10 c/u |
| Upload FormData (imagen/chat/audio) | `socialStore.ts:792-868` | ~70 |
| Food log mapping | `nutritionStore.ts:628-660` y `759-791` | ~60 |
| Streak multiplier | `leagueStore.ts:86-97` y `nutritionStore.ts:322` (inline) | ~10 |
| Ring colors (ScoreRing) | `dashboard/index.tsx` | ~5 (repetido) |

### 4.2 Console.log sin guarda `__DEV__`
Se encontraron **100+ console.log/warn/error** sin protección `__DEV__` en:
- `store/adStore.ts`, `store/aiCreditsStore.ts`, `store/nutritionStore.ts`
- `store/socialStore.ts` (~30 sin guarda), `store/leagueStore.ts` (~25)
- `services/groq.ts` (~25), `services/notifications.ts` (~15)
- `hooks/useAdMob.ts`, `hooks/useAICredits.ts`, `hooks/useInterstitial.ts`
- `app/_layout.tsx`

### 4.3 Hardcoded Values

| Ubicación | Valor | Problema |
|---|---|---|
| `services/groq.ts:37-39` | Model names (llama-3.3-70b, etc.) | Hardcoded + en comentarios en español |
| `services/groq.ts:53` | `45000` (timeout 45s) | Hardcoded |
| `services/groq.ts` | `targetLang === 'Spanish'` ternarios | Solo español/inglés, ignorando otros 5 idiomas |
| `dashboard/index.tsx:188` | `const streakDays = 5` | Placeholder que ignora el store real |
| `dashboard/index.tsx:186` | `profile?.targetCalories ?? 2000` | Fallback hardcoded |
| `constants/adConfig.ts:52` | `interstitialCooldownMs: 30 * 60 * 1000` | Hardcoded |
| `store/leagueStore.ts:80-84` | `LEAGUE_POINTS` | Hardcoded |
| `store/leagueStore.ts:318,328` | Mensajes de error en español | No traducidos vía i18n |

### 4.4 Error Handling débil

- **`authStore.ts:118-126`** — `fetchProfile` silencia errores después de reintentos
- **`bodyStore.ts:132-146`** — Optimistic updates sin rollback real
- **`nutritionStore.ts:483-502`** — Fire-and-forget, éxito toast aunque falle la DB
- **`notifications.ts:309-332`** — Envío push sin validar respuesta
- **`socialStore.ts:621-622`** — Error message expuesto en logs internos

---

## 🟡 5. Configuración de Build

### 5.1 Metro (React Native)
- Sin plugin de compresión
- Sin analizador de bundle
- Sin code-splitting explícito
- Sin tree-shaking configurado

### 5.2 Next.js (Web)
- Sin compression explícita
- Sin `images` configuration para Supabase Storage
- Sin CSP / security headers
- Sin PWA manifest (app fitness, ideal para offline)
- Sin bundle analyzer
- `turbopack.root: ".."` — apunta al root del monorepo (14 GB node_modules)

### 5.3 `.npmrc: legacy-peer-deps=true`
Bypass de validación de peer dependencies. Oculta conflictos reales.

### 5.4 React version mismatch
Root: `react@19.2.0` / `react-dom@19.2.0`  
Web: `react@19.2.4` / `react-dom@19.2.4`

### 5.5 Supabase version mismatch
Root: `@supabase/supabase-js@^2.105.0`  
Web: `@supabase/supabase-js@^2.106.2`

---

## 🟡 6. Bugs Detectados

### 6.1 Dashboard: weight sorting bug
**`app/(tabs)/dashboard/index.tsx:209`**  
```ts
const oldestWeight = measurements[measurements.length - 1].weight
```
Asume orden ascendente (oldest first), pero `bodyStore` usa `.order('measured_at', { ascending: false })` → **toma el segundo más reciente, no el más antiguo**.

### 6.2 RecalculateStreak ejecutado múltiples veces
En `nutritionStore.ts` se llama `recalculateStreak()` en `updateActivity` (231), `fetchLogs` (711) y `fetchHistory` (813) — hasta 3 veces en una misma operación.

---

## ⚪ 7. Oportunidades de Refactor

### 7.1 Archivos más grandes (>1000 líneas)
| Archivo | Líneas | Recomendación |
|---|---|---|
| `app/onboarding.tsx` | 2,164 | Dividir en componentes |
| `app/(tabs)/planner/index.tsx` | 2,153 | Extraer lógica a hooks |
| `app/(tabs)/profile/index.tsx` | 1,976 | Dividir en secciones |
| `components/social/FitGOCompetitive.tsx` | 1,705 | Refactor mayor |
| `app/modals/social.tsx` | 1,607 | Extraer lógica a hooks |
| `app/(tabs)/tracker/index.tsx` | 1,328 | Refactor |
| `app/modals/add-activity.tsx` | 1,321 | Extraer componentes |
| `components/social/FitGOSocial.tsx` | 1,230 | Refactor |
| `services/groq.ts` | 1,166 | Separar en módulos |
| `app/modals/scan.tsx` | 1,111 | Refactor |

**14 archivos >700 líneas** representan ~60% del código total.

### 7.2 `groq.ts` — i18n limitado a ES/EN
Todo el sistema de prompts asume solo `targetLang === 'Spanish'`. Los otros 5 idiomas (fr, pt, it, de, ru) caen siempre al branch inglés.

---

## Plan de Ejecución

### Fase 0 — Inmediata (30 min)
- [ ] `npm audit fix` — parchear vulnerabilidades HIGH
- [ ] Eliminar `components/social/FitGOSocial_backup.tsx`
- [ ] Eliminar `services/supabase.ts:88-114` (cachedQuery/cache muerto)

### Fase 1 — Semana 1 (Alta Prioridad)
- [ ] **Remover dependencias no usadas:**
  - `npm uninstall openai react-native-nitro-image react-native-nitro-modules react-native-url-polyfill`
  - `npm uninstall react-native-purchases-ui lottie-react-native` (si no hay plan de usarlos)
  - Evaluar lazy-loading para `xlsx`
- [ ] **Reemplazar `import * as LucideIcons`** en 4 archivos por imports selectivos
- [ ] **Agregar `__DEV__` guard** a todos los console.log/warn/error (o migrar a sistema de logging)
- [ ] **Extraer `secureStorage` adapter** a `utils/storage.ts` y reusar en las 5 stores

### Fase 2 — Semana 2 (Performance)
- [ ] **Wrapping con `React.memo`** en `ScoreRing`, `AchievementPreview`, `AIEnergyGate`, `AICreditsBar`
- [ ] **Reemplazar `Dimensions.get('window')`** con hook que escuche cambios de orientación
- [ ] **Eliminar barrel imports** de `store/index.ts` — importar stores directamente
- [ ] **Configurar bundle analyzer** (expo + next)
- [ ] **Resolver React version mismatch** root vs web

### Fase 3 — Semana 3 (Calidad)
- [ ] **Corregir weight sorting bug** en dashboard
- [ ] **Optimizar `recalculateStreak`** — evitar ejecuciones redundantes
- [ ] **Extraer función compartida de upload** (socialStore) a utils
- [ ] **Extraer food log mapping** compartido en nutritionStore
- [ ] **Usar `getStreakMultiplier`** de leagueStore en nutritionStore (eliminar inline)

### Fase 4 — Semana 4 (Refactor Mayor)
- [ ] **Dividir archivos >1000 líneas** (onboarding, planner, profile, etc.)
- [ ] **Refactor `services/groq.ts`** — soporte i18n completo, extraer constantes
- [ ] **Reemplazar `require('./authStore')`** dinámico con import estático
- [ ] **Eliminar código deprecado** en `adStore.ts`

### Fase 5 — Web App
- [ ] Agregar security headers (CSP) en Next.js
- [ ] Configurar image optimization domains
- [ ] Evaluar PWA para funcionalidad offline
- [ ] Agregar `@next/bundle-analyzer`
- [ ] Sincronizar versiones de Supabase con root

### Fase 6 — DevOps
- [ ] Eliminar `legacy-peer-deps=true` de `.npmrc` y resolver peer conflicts
- [ ] `npm dedupe` para reducir duplicación en node_modules
- [ ] Agregar `npm run audit` al CI
- [ ] Considerar trunk-based monorepo o workspace management
- [ ] Evaluar migración de Expo SDK 55 → 56 cuando esté estable

---

## Resumen de Impacto

| Métrica | Antes | Después (estimado) |
|---|---|---|
| Vulnerabilidades HIGH | 2 | 0 |
| Dependencias no usadas | 7 | 0 |
| node_modules | ~14.5 GB | ~10-11 GB |
| console.log sin guarda | 100+ | 0 |
| Archivos >1000 líneas | 10 | 0 |
| `import * as LucideIcons` | 4 | 0 |
| Código duplicado significativo | 5 bloques | 0 |
