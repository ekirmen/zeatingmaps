// =====================================================
// Timeout Configuration for Serverless Functions
// Sistema de Boletería - Veneventos
// =====================================================

/**
 * Configuración de timeouts adaptada al plan de Vercel
 * - Vercel Free: 10 segundos máximo
 * - Vercel Pro: 60 segundos máximo
 */

// Detectar entorno y plan de Vercel
const VERCEL_ENV = process.env.VERCEL_ENV || 'development';
const IS_PRODUCTION = VERCEL_ENV === 'production';

// Timeout máximo de Vercel según plan
export const VERCEL_TIMEOUT = IS_PRODUCTION ? 10000 : 60000; // 10s Free, 60s local/Pro

// Margen de seguridad para evitar timeouts de Vercel
export const SAFETY_MARGIN = 2000; // 2 segundos

/**
 * Timeouts por tipo de operación
 * Todos los valores están en milisegundos
 */
export const TIMEOUTS = {
    // Operaciones de asientos (críticas, deben ser rápidas)
    SEAT_LOCK: Math.min(5000, VERCEL_TIMEOUT - SAFETY_MARGIN),
    SEAT_UNLOCK: Math.min(5000, VERCEL_TIMEOUT - SAFETY_MARGIN),
    SEAT_STATUS: Math.min(3000, VERCEL_TIMEOUT - SAFETY_MARGIN),
    SEAT_BATCH_UNLOCK: Math.min(8000, VERCEL_TIMEOUT - SAFETY_MARGIN),

    // Operaciones de pagos (pueden tardar más)
    PAYMENT_CREATE: Math.min(8000, VERCEL_TIMEOUT - SAFETY_MARGIN),
    PAYMENT_PROCESS_STRIPE: Math.min(8000, VERCEL_TIMEOUT - SAFETY_MARGIN),
    PAYMENT_PROCESS_PAYPAL: Math.min(8000, VERCEL_TIMEOUT - SAFETY_MARGIN),
    PAYMENT_REFUND: Math.min(8000, VERCEL_TIMEOUT - SAFETY_MARGIN),
    PAYMENT_SEARCH: Math.min(5000, VERCEL_TIMEOUT - SAFETY_MARGIN),

    // Operaciones de auditoría (rápidas)
    AUDIT_CREATE: Math.min(3000, VERCEL_TIMEOUT - SAFETY_MARGIN),
    AUDIT_QUERY: Math.min(5000, VERCEL_TIMEOUT - SAFETY_MARGIN),

    // Operaciones de mapas (pueden ser pesadas)
    MAP_LOAD: Math.min(5000, VERCEL_TIMEOUT - SAFETY_MARGIN),
    MAP_SAVE: Math.min(8000, VERCEL_TIMEOUT - SAFETY_MARGIN),

    // Operaciones de grid sale
    GRID_LOAD_ZONAS: Math.min(5000, VERCEL_TIMEOUT - SAFETY_MARGIN),
    GRID_VALIDATE_SALE: Math.min(5000, VERCEL_TIMEOUT - SAFETY_MARGIN),
    GRID_PROCESS_SALE: Math.min(8000, VERCEL_TIMEOUT - SAFETY_MARGIN),

    // Operaciones de eventos (normales)
    EVENT_CREATE: Math.min(5000, VERCEL_TIMEOUT - SAFETY_MARGIN),
    EVENT_UPDATE: Math.min(5000, VERCEL_TIMEOUT - SAFETY_MARGIN),
    EVENT_DELETE: Math.min(5000, VERCEL_TIMEOUT - SAFETY_MARGIN),
    EVENT_LIST: Math.min(5000, VERCEL_TIMEOUT - SAFETY_MARGIN),

    // Operaciones de notificaciones (pueden tardar)
    NOTIFICATION_EMAIL: Math.min(8000, VERCEL_TIMEOUT - SAFETY_MARGIN),
    NOTIFICATION_SMS: Math.min(8000, VERCEL_TIMEOUT - SAFETY_MARGIN),

    // Operaciones de reportes (pueden requerir polling)
    REPORT_GENERATE: Math.min(8000, VERCEL_TIMEOUT - SAFETY_MARGIN),
    REPORT_EXPORT: Math.min(8000, VERCEL_TIMEOUT - SAFETY_MARGIN),
};

/**
 * Configuración de retry para operaciones fallidas
 */
export const RETRY_CONFIG = {
    MAX_ATTEMPTS: 3,
    BASE_DELAY: 1000, // 1 segundo
    MAX_DELAY: 5000,  // 5 segundos
    EXPONENTIAL_BASE: 2, // Delay = BASE_DELAY * (EXPONENTIAL_BASE ^ attempt)
};

/**
 * Operaciones que requieren polling asíncrono
 * (exceden el timeout de Vercel Free)
 */
export const ASYNC_OPERATIONS = {
    REPORT_GENERATE: {
        pollInterval: 2000, // Verificar cada 2 segundos
        maxPollTime: 60000, // Máximo 60 segundos de polling
    },
    REPORT_EXPORT: {
        pollInterval: 2000,
        maxPollTime: 60000,
    },
    BULK_EMAIL: {
        pollInterval: 3000,
        maxPollTime: 120000, // 2 minutos
    },
};

/**
 * Helper: Crear timeout promise
 */
export function createTimeoutPromise(ms, operation = 'Operation') {
    return new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error(`${operation} timeout after ${ms}ms`));
        }, ms);
    });
}

/**
 * Helper: Ejecutar con timeout
 */
export async function withTimeout(promise, timeout, operation = 'Operation') {
    return Promise.race([
        promise,
        createTimeoutPromise(timeout, operation)
    ]);
}

/**
 * Helper: Retry con exponential backoff
 */
export async function retryWithBackoff(fn, options = {}) {
    const {
        maxAttempts = RETRY_CONFIG.MAX_ATTEMPTS,
        baseDelay = RETRY_CONFIG.BASE_DELAY,
        maxDelay = RETRY_CONFIG.MAX_DELAY,
        exponentialBase = RETRY_CONFIG.EXPONENTIAL_BASE,
    } = options;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            // Si es el último intento, lanzar el error
            if (attempt === maxAttempts - 1) {
                throw error;
            }

            // Calcular delay con exponential backoff
            const delay = Math.min(
                baseDelay * Math.pow(exponentialBase, attempt),
                maxDelay
            );

            console.log(`Retry attempt ${attempt + 1}/${maxAttempts} after ${delay}ms`);

            // Esperar antes del siguiente intento
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * Helper: Ejecutar operación con timeout y retry
 */
export async function executeWithTimeoutAndRetry(fn, timeout, operation, retryOptions = {}) {
    return retryWithBackoff(
        () => withTimeout(fn(), timeout, operation),
        retryOptions
    );
}

/**
 * Ejemplo de uso en serverless function:
 * 
 * import { TIMEOUTS, executeWithTimeoutAndRetry } from '@/config/timeouts';
 * 
 * export default async function handler(req, res) {
 *   try {
 *     const result = await executeWithTimeoutAndRetry(
 *       () => lockSeat(seatId, userId),
 *       TIMEOUTS.SEAT_LOCK,
 *       'Lock Seat'
 *     );
 *     return res.status(200).json({ success: true, data: result });
 *   } catch (error) {
 *     if (error.message.includes('timeout')) {
 *       return res.status(408).json({ error: 'Request timeout' });
 *     }
 *     return res.status(500).json({ error: error.message });
 *   }
 * }
 */

export default {
    VERCEL_TIMEOUT,
    SAFETY_MARGIN,
    TIMEOUTS,
    RETRY_CONFIG,
    ASYNC_OPERATIONS,
    createTimeoutPromise,
    withTimeout,
    retryWithBackoff,
    executeWithTimeoutAndRetry,
};
