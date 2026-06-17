# Plan de Ejecución — FitGO Audit Remediation

**Generado:** 16/06/2026
**Basado en:** Auditoría completa de 5 agentes paralelos

---

## Fase 0 — HOY (Día 0) ⚡
**Objetivo: Detener la hemorragia de seguridad y bugs críticos**

| # | Acción | Archivos | Esfuerzo | Riesgo | Dependencias |
|---|---|---|---|---|---|
| 0.1 | **Rotar keystore Android** — Generar nuevo keystore, revocar el actual, actualizar en Play Console | `credentials.json`, `.gitignore` | 2h | Alto (afecta actualizaciones) | — |
| 0.2 | **Purgar `credentials.json` y `@deathtrooper__fitgo.jks` de git history** con `git filter-branch` o BFG Repo-Cleaner | Todo el repo | 30min | Medio (rewrite history) | 0.1 |
| 0.3 | **Reparar `.gitignore`** — Reemplazar bytes nulos con texto plano: `credentials.json`, `*.jks`, `*.p8`, `*.p12` | `.gitignore` | 5min | Bajo | — |
| 0.4 | **Agregar `useToastStore` import en `bodyStore.ts`** (línea 111) | `store/bodyStore.ts` | 1min | Bajo | — |
| 0.5 | **Corregir `purchaseStore.ts`** — No actualizar estado local si RPC falla | `store/purchaseStore.ts` | 15min | Bajo | — |
| 0.6 | **Corregir `adStore.ts`** — Sincronizar `aiEnergy` en `consumeTextEnergy` | `store/adStore.ts` | 5min | Bajo | — |

---

## Fase 1 — Semana 1 🔴
**Objetivo: Eliminar vulnerabilidades de seguridad altas + bugs silenciosos**

| # | Acción | Archivos | Esfuerzo | Prioridad |
|---|---|---|---|---|
| 1.1 | **Separar proyectos Supabase** — Crear proyectos dev/staging/prod; rotar anon key del actual | Supabase Dashboard + `eas.json` | 4h | 🔴 |
| 1.2 | **Mover secrets de `eas.json` a EAS Secrets** | `eas.json` + `eas secret:create` | 1h | 🔴 |
| 1.3 | **Mover `EXPO_PUBLIC_*` vars de `.env` a EAS Secrets** (el `.env` real tiene keys vivas) | `.env` + EAS | 30min | 🔴 |
| 1.4 | **Corregir Stripe webhook** — Eliminar placeholder, agregar error throw si falta `SUPABASE_SERVICE_ROLE_KEY` | `web/app/api/stripe-webhook/route.ts` | 5min | 🔴 |
| 1.5 | **Agregar `__DEV__` guard a RevenueCat DEBUG log** | `services/revenuecat.ts:34` | 1min | 🟠 |
| 1.6 | **Eliminar `generateRecipes` silent return `[]`** — Agregar log y propagar error | `services/groq.ts:907-911` | 5min | 🟠 |
| 1.7 | **Eliminar `estimateActivityCalories` silent return `0`** — Agregar log y propagar | `services/groq.ts:997-998` | 5min | 🟠 |
| 1.8 | **Reemplazar IDs de test de AdMob con IDs reales de producción** O crear app.config.js que los diferencie por entorno | `app.json:90-92`, `AndroidManifest.xml:21` | 30min | 🟠 |
| 1.9 | **Corregir estado silencioso de `checkEntitlement`** — Retornar `null` en error para que caller distinga "no verificado" de "no premium" | `services/revenuecat.ts:80-83` | 10min | 🟠 |
| 1.10 | **Crear backup rules XML** para SecureStore (evitar backup de auth tokens) | `android/app/src/main/res/xml/secure_store_backup_rules.xml` | 15min | 🟠 |
| 1.11 | **Eliminar `FitGOSocial_backup.tsx`** | Archivo backup | 1min | 🟡 |
| 1.12 | **Stripe webhook: ocultar error.message** en response HTTP | `web/app/api/stripe-webhook/route.ts:42-47` | 5min | 🟠 |

---

## Fase 2 — Semana 2 🟠
**Objetivo: Reducir deuda técnica de types + eliminar console en producción**

| # | Acción | Archivos | Esfuerzo | Prioridad |
|---|---|---|---|---|
| 2.1 | **Tipar router params** — Crear tipos para cada ruta y eliminar `as any` (58 ocurrencias). Estrategia: `export type AppRoutes = { '/modals/scan': { mealType: string } }` | `app/` (todos los screens) | 8h | 🟠 |
| 2.2 | **Eliminar `require()` en render** de `social.tsx:196` — Convertir a import estático | `app/modals/social.tsx` | 5min | 🟠 |
| 2.3 | **Reducer `any` types** — Target: 0 en stores y services. Priorizar `leagueStore.ts` (11) y `nutritionStore.ts` (11) | `store/`, `services/` | 6h | 🟠 |
| 2.4 | **Wrapper de console unificado** — Crear `utils/logger.ts` que respete `__DEV__` y reemplace todos los `console.*` directos | Global (100+ sitios) | 4h | 🟠 |
| 2.5 | **Guardar `console.error` con `__DEV__`** en 35 sitios sin guarda | Services + stores | 2h | 🟠 |
| 2.6 | **Eliminar empty catch blocks** — Agregar mínimo `console.warn` | `foodDatabase.ts:192`, `groq.ts:907,997`, `notifications.ts:128`, `leagueStore.ts:528` | 1h | 🟠 |
| 2.7 | **Extraer `isProActually` a hook compartido** `useIsPro()` | 5+ archivos | 1h | 🟡 |

---

## Fase 3 — Semana 3 🟠
**Objetivo: Performance + Refactor de archivos grandes**

| # | Acción | Archivos | Esfuerzo | Prioridad |
|---|---|---|---|---|
| 3.1 | **Refactor `groq.ts`** — Extraer a módulos: `groq/coach.ts`, `groq/vision.ts`, `groq/meal-plans.ts`, `groq/workout-plans.ts`, `groq/utils.ts` | `services/groq.ts` (1,166→~200 c/u) | 8h | 🟠 |
| 3.2 | **Extraer helper `extractJSON(text)`** — Reemplazar 8 copias de JSON extraction + markdown stripping | `groq.ts`, `foodDatabase.ts` | 1h | 🟡 |
| 3.3 | **Extraer proxy-chain navigation** — Función compartida en vez de 3 copias | `groq.ts` | 1h | 🟡 |
| 3.4 | **Refactor 3 coach screens** — Extraer lógica compartida a `hooks/useCoachChat.ts` + `components/CoachChatBubble.tsx` | `DoctorScreen.tsx`, `NutritionistScreen.tsx`, `TrainerScreen.tsx` | 12h | 🟠 |
| 3.5 | **Dividir archivos >1,500 líneas** — Prioridad: `FitGOCompetitive.tsx` → 3-4 componentes | `components/social/FitGOCompetitive.tsx` | 8h | 🟡 |
| 3.6 | **Agregar `React.memo`** a componentes grandes sin memo (FitGOSocial, FitGOCompetitive, MuscleSymmetryCard, coach screens) | 6+ componentes | 3h | 🟡 |
| 3.7 | **Resolver stale closures** — Agregar `isPro` a dependency arrays | `DoctorScreen.tsx:668`, `NutritionistScreen.tsx`, `TrainerScreen.tsx` | 1h | 🟡 |
| 3.8 | **Fix `setTimeout` cleanup** — Guardar timer ref, cleanup en useEffect return | `PremiumGate.tsx:63`, `AIEnergyGate.tsx:101,154` | 1h | 🟡 |

---

## Fase 4 — Semana 4 🟡
**Objetivo: Limpieza de código muerto + build config**

| # | Acción | Archivos | Esfuerzo | Prioridad |
|---|---|---|---|---|
| 4.1 | **Eliminar stubs de RevenueCat** — Remover `initialize`, `fetchOfferings`, `refreshStatus` vacíos | `store/purchaseStore.ts:27-42` | 15min | 🟡 |
| 4.2 | **Remover APIs deprecadas de `adStore`** — `aiEnergy`, `consumeEnergy`, `addEnergy`, etc. (o limpiar JSDoc si se mantienen) | `store/adStore.ts` | 30min | 🟡 |
| 4.3 | **Limpiar 10+ unused imports** | Ver tabla en reporte | 1h | 🟢 |
| 4.4 | **Remover `STREAK_MULTIPLIERS` y `LEAGUE_POINTS.SQUAD_SYNERGY`** no usados | `store/leagueStore.ts:83-90` | 10min | 🟢 |
| 4.5 | **Convertir inline styles a `StyleSheet.create`** — Priorizar coach screens y WidgetRenderer (~50 inline styles) | `components/DoctorScreen.tsx`, `NutritionistScreen.tsx`, `TrainerScreen.tsx`, `WidgetRenderer.tsx` | 4h | 🟡 |
| 4.6 | **Reemplazar `Dimensions.get('window')`** con `useWindowDimensions()` hook | `dashboard/index.tsx`, `GoalWizardModal.tsx`, `AppToast.tsx` | 30min | 🟡 |
| 4.7 | **`npm audit fix`** — Corregir vulnerabilidades de dependencias | `package-lock.json` | 10min | 🟠 |
| 4.8 | **Desactivar `legacy-peer-deps`** en `.npmrc` y resolver conflictos | `.npmrc` | 1h | 🟡 |
| 4.9 | **Configurar bundle analyzer** para Expo y Next.js | Config de build | 2h | 🟢 |
| 4.10 | **Purgar dependencias no usadas**: `openai`, `nitro-*`, `url-polyfill`, `purchases-ui`, `lottie-react-native` | `package.json` | 30min | 🟡 |

---

## Fase 5 — Semana 5 🟢
**Objetivo: Mejoras de mantenibilidad a largo plazo**

| # | Acción | Archivos | Esfuerzo | Prioridad |
|---|---|---|---|---|
| 5.1 | **Refactor nutritionStore.ts (909 líneas)** — Extraer a módulos: `nutrition/logs.ts`, `nutrition/activities.ts`, `nutrition/sync.ts` | `store/nutritionStore.ts` | 6h | 🟡 |
| 5.2 | **Refactor socialStore.ts (896 líneas)** — Misma estrategia | `store/socialStore.ts` | 6h | 🟡 |
| 5.3 | **Agregar Error Boundary** global en `_layout.tsx` | `app/_layout.tsx` | 2h | 🟡 |
| 5.4 | **Configurar testing** — Jest + React Native Testing Library. Escribir tests para stores (lógica pura) | Config + `__tests__/` | 12h | 🟢 |
| 5.5 | **Evaluar migración Expo SDK 55 → 56** | `package.json`, config | 4h | 🟢 |
| 5.6 | **Sincronizar versiones React y Supabase** entre root y web | `package.json` root + web | 30min | 🟢 |
| 5.7 | **Implementar i18n completo en groq.ts** — Actualmente solo ES/EN, hay 5 idiomas más ignorados | `services/groq.ts` (20+ funciones) | 4h | 🟢 |
| 5.8 | **Implementar certificate pinning** para Supabase y Stripe endpoints | `react-native-ssl-pinning` + config | 4h | 🟢 |

---

## Resumen de Esfuerzo

| Fase | Horas | Items | Impacto |
|---|---|---|---|
| Fase 0 — Hoy | ~3h | 6 | 🔴 Bugs + seguridad crítica |
| Fase 1 — Semana 1 | ~7h | 12 | 🟠 Seguridad alta |
| Fase 2 — Semana 2 | ~21h | 7 | 🟠 Type safety + console |
| Fase 3 — Semana 3 | ~35h | 8 | 🟠 Refactor + performance |
| Fase 4 — Semana 4 | ~10.5h | 10 | 🟡 Dead code + build |
| Fase 5 — Semana 5 | ~34.5h | 8 | 🟢 Mantenibilidad |
| **Total** | **~111h** | **51** | |

---

## Quick Wins (se hacen en <15min c/u)

1. ✅ Agregar import de `useToastStore` en `bodyStore.ts` → corrige crash
2. ✅ Guardar `console.error` con `__DEV__` en cada store
3. ✅ Eliminar `FitGOSocial_backup.tsx`
4. ✅ Eliminar `STREAK_MULTIPLIERS` no usado
5. ✅ Eliminar unused imports obvios
6. ✅ Stripe webhook: ocultar error.message
7. ✅ RevenueCat debug log guard con `__DEV__`
8. ✅ Empty catch blocks → agregar `console.warn`

---

## Notas Técnicas

### Para Fase 2.1 — Tipar Router Params

```typescript
// types/navigation.ts
export type AppRouteParams = {
  '/modals/scan': { mealType?: string; barcode?: string };
  '/modals/food-detail': { food: string; mealType: string };
  // ... etc
};

// Uso:
router.push({ pathname: '/modals/scan', params: { mealType: 'breakfast' } } as AppRoutes['/modals/scan']);
```

### Para Fase 2.4 — Logger Unificado

```typescript
// utils/logger.ts
const isDev = __DEV__;
export const logger = {
  log: (...args: any[]) => isDev && console.log(...args),
  warn: (...args: any[]) => isDev && console.warn(...args),
  error: (...args: any[]) => console.error(...args), // Siempre en producción
};
```

### Para Fase 5.4 — Testing Stack Recomendado

```bash
npm install -D jest @testing-library/react-native @testing-library/jest-native
```
Priorizar tests de stores (lógica pura, sin dependencias de NativeModules).

### Para Fase 2.1 — Estrategia de Tipado de Rutas

Dado que hay 58 sitios con `as any`, recomiendo enfoque incremental:
1. Crear `types/navigation.ts` con tipos por ruta
2. Reemplazar en los modales más críticos (`scan.tsx`, `chat.tsx`, `paywall.tsx`) primero
3. Extender progresivamente al resto

---

## Checklist de Progreso

- [ ] **Fase 0** — 0/6 completado
- [ ] **Fase 1** — 0/12 completado
- [ ] **Fase 2** — 0/7 completado
- [ ] **Fase 3** — 0/8 completado
- [ ] **Fase 4** — 0/10 completado
- [ ] **Fase 5** — 0/8 completado
