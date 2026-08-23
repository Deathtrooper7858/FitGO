import * as Sentry from '@sentry/react-native';

type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

interface ErrorContext {
  /** Módulo que lanza el error (ej: 'BodyStore', 'PurchaseStore') */
  module: string;
  /** Acción que se intentaba realizar (ej: 'addMeasurement', 'fetchOfferings') */
  action: string;
  /** Severidad del error */
  severity?: ErrorSeverity;
  /** Datos extra para contexto (NO incluir datos sensibles del usuario) */
  extra?: Record<string, any>;
  /** Tags para filtrar en Sentry */
  tags?: Record<string, string>;
}

/**
 * 🚨 Sistema centralizado de reportes de error para FitGO.
 * 
 * Envía errores a Sentry CON contexto útil para debuggear,
 * y también los imprime en consola para desarrollo local.
 * 
 * Uso:
 * ```ts
 * import { reportError } from '../utils/errorReporter';
 * 
 * try {
 *   await supabase.from('users').insert(data);
 * } catch (err) {
 *   reportError(err, { module: 'AuthStore', action: 'createUser' });
 * }
 * ```
 */
export function reportError(error: unknown, context: ErrorContext): void {
  const { module, action, severity = 'error', extra, tags } = context;
  const label = `[${module}] ${action}`;

  // 1. Siempre imprimir en consola (útil en desarrollo)
  if (severity === 'warning') {
    console.warn(label, error);
  } else {
    console.error(label, error);
  }

  // 2. Enviar a Sentry con contexto enriquecido
  Sentry.withScope((scope) => {
    scope.setLevel(severity);
    scope.setTag('module', module);
    scope.setTag('action', action);
    
    if (tags) {
      Object.entries(tags).forEach(([key, value]) => scope.setTag(key, value));
    }

    if (extra) {
      Object.entries(extra).forEach(([key, value]) => scope.setExtra(key, value));
    }

    // Añadir breadcrumb para trazar el camino
    Sentry.addBreadcrumb({
      category: module,
      message: `Error en ${action}`,
      level: severity,
      data: extra,
    });

    if (error instanceof Error) {
      scope.setTransactionName(`${module}.${action}`);
      Sentry.captureException(error);
    } else {
      Sentry.captureMessage(`${label}: ${String(error)}`, severity);
    }
  });
}

/**
 * 🔔 Registra un evento importante (no un error) en Sentry.
 * Útil para rastrear acciones críticas como pagos, upgrades, etc.
 */
export function reportEvent(eventName: string, data?: Record<string, any>): void {
  Sentry.addBreadcrumb({
    category: 'app.event',
    message: eventName,
    level: 'info',
    data,
  });
}
