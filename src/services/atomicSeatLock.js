import { supabase } from '../supabaseClient';
import apiRateLimiter from '../utils/apiRateLimiter';
import auditService from './auditService';

/**
 * Servicio para bloqueo atómico de asientos que previene condiciones de carrera
 */
class AtomicSeatLockService {

  /**
   * Bloquea un asiento de forma atómica usando una función de base de datos
   * Esto previene condiciones de carrera entre múltiples usuarios
   */
  async lockSeatAtomically(seatId, funcionId, sessionId, status = 'seleccionado', options = {}) {
    try {
      // Rate limiting: Verificar si el request está permitido
      const endpoint = 'lock_seat_atomically';
      const requestKey = `lock_${seatId}_${funcionId}_${sessionId}`;

      if (!apiRateLimiter.canMakeRequest(endpoint, requestKey)) {
        const waitTime = apiRateLimiter.getWaitTime(endpoint);
        throw new Error(`Demasiadas solicitudes. Por favor, espera ${Math.ceil(waitTime / 1000)} segundos antes de intentar nuevamente.`);
      }

      // Registrar el request para rate limiting
      apiRateLimiter.registerRequest(endpoint, requestKey);

      // Intentando bloqueo atómico

      // Validar parámetros requeridos
      const normalizedSeatId = this.normalizeSeatIdValue(seatId);
      const normalizedFuncionId = this.normalizeFuncionIdValue(funcionId);
      const normalizedSessionId = this.normalizeSessionIdValue(sessionId);

      if (!normalizedSeatId || !normalizedFuncionId || !normalizedSessionId) {
        throw new Error('Parámetros requeridos: seatId, funcionId, sessionId');
      }

      // Obtener tenant_id si está disponible
      const tenantId = this.getCurrentTenantId();

      // Generar locator temporal
      const locator = this.generateTempLocator();

      // Preparar datos para la función de base de datos
      const lockData = {
        p_seat_id: normalizedSeatId,
        p_funcion_id: normalizedFuncionId,
        p_session_id: normalizedSessionId,
        p_status: status
      };

      const activePermanentLock = await this.getActivePermanentLock(normalizedSeatId, normalizedFuncionId);
      if (activePermanentLock) {
        throw new Error('Asiento bloqueado permanentemente. Solo puede desbloquearse desde boletería.');
      }

      // Usar función RPC para bloqueo atómico
      const { data, error } = await supabase.rpc('lock_seat_atomically', lockData);

      // Registrar acción de bloqueo en auditoría
      auditService.logSeatAction('locked', {
        seatId: normalizedSeatId,
        functionId: normalizedFuncionId,
        sessionId: normalizedSessionId,
        status: status,
        previousStatus: null,
        newStatus: status
      }, {
        tenantId: tenantId || null,
        severity: 'info'
      }).catch(err => console.error('Error logging seat lock:', err));

      if (error) {
        console.error('❌ [ATOMIC_LOCK] Error en bloqueo atómico:', error);
        console.error('❌ [ATOMIC_LOCK] Detalles del error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });

        // Manejar errores específicos
        // Error 23505 = violación de restricción única (duplicate key) - asiento ya bloqueado
        // Error 409 = Conflict (HTTP status code equivalente)
        if (error.code === '23505' || error.code === '409' || error.message?.includes('duplicate key') || error.message?.includes('already exists')) {
          // Si es un duplicate key, verificar consultando el lock existente
          console.warn('⚠️ [ATOMIC_LOCK] Asiento ya bloqueado (duplicate key), verificando si es del mismo usuario...');

          try {
            // Consultar el lock existente para verificar si es del mismo usuario
            const { data: existingLock, error: queryError } = await supabase
              .from('seat_locks')
              .select('*')
              .eq('seat_id', normalizedSeatId)
              .eq('funcion_id', normalizedFuncionId)
              .order('locked_at', { ascending: false })
              .limit(1)
              .single();

            if (queryError || !existingLock) {
              // No se pudo consultar el lock, asumir que es de otro usuario
              throw new Error('Asiento ya está seleccionado por otro usuario');
            }

            const currentSessionId = this.normalizeSessionIdValue(sessionId);
            const existingSessionId = existingLock.session_id?.toString() || '';
            const expiresAt = existingLock.expires_at ? new Date(existingLock.expires_at) : null;
            const isExpired = expiresAt ? expiresAt <= new Date() : false;
            const isPermanentLock = ['locked', 'bloqueado', 'vendido', 'pagado', 'reservado'].includes(existingLock.status);

            const permanentLock = isPermanentLock && !isExpired
              ? existingLock
              : await this.getActivePermanentLock(normalizedSeatId, normalizedFuncionId);

            if (permanentLock) {
              throw new Error('Asiento bloqueado permanentemente. Solo puede desbloquearse desde boletería.');
            }

            // Comparar session_ids normalizados
            if (currentSessionId === existingSessionId) {
              // Es del mismo usuario, devolver éxito
              return {
                success: true,
                lockData: existingLock,
                alreadyLocked: true,
                error: null
              };
            }

            if (isExpired) {
              throw new Error('El bloqueo existente ya expiró. Intenta seleccionar de nuevo.');
            }

            // Es de otro usuario y sigue vigente
            throw new Error('Asiento ya está seleccionado por otro usuario');
          } catch (verifyError) {
            // Si hay error verificando, asumir que es de otro usuario
            if (verifyError.message?.includes('otro usuario')) {
              throw verifyError;
            }
            throw new Error('Asiento ya está seleccionado por otro usuario');
          }
        } else if (error.message?.includes('already_locked') || error.code === 'P0001') {
          throw new Error('Asiento ya está seleccionado por otro usuario');
        } else if (error.message?.includes('not_available')) {
          throw new Error('Asiento no está disponible');
        } else if (error.message?.includes('invalid_seat')) {
          throw new Error('Asiento no válido');
        } else if (error.code === 'P0004' || error.message?.includes('session_id no puede ser NULL')) {
          throw new Error('Error de sesión: session_id inválido. Por favor, recarga la página.');
        } else if (error.code === 'P0006' || error.code === 'P0007' || error.message?.includes('UUID válido')) {
          throw new Error('Error de sesión: formato de session_id inválido. Por favor, recarga la página.');
        } else if (error.code === '42804' || error.message?.includes('is of type uuid but expression is of type text')) {
          throw new Error('Error de tipo de datos: session_id. Por favor, recarga la página.');
        } else {
          throw new Error(`Error al seleccionar asiento: ${error.message || error.code || 'Error desconocido'}`);
        }
      }

      const lockRow = Array.isArray(data) ? data[0] : data;

      if (!lockRow) {
        throw new Error('Lock atómico no devolvió datos válidos');
      }
      return {
        success: true,
        lockData: lockRow,
        locator: locator
      };

    } catch (error) {
      console.error('❌ [ATOMIC_LOCK] Error inesperado:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Desbloquea un asiento de forma atómica
   */
  async unlockSeatAtomically(seatId, funcionId, sessionId, options = {}) {
    try {
      const { allowPermanentOverride = false } = options || {};

      // Rate limiting: Verificar si el request está permitido
      const endpoint = 'unlock_seat_atomically';
      const requestKey = `unlock_${seatId}_${funcionId}_${sessionId}`;

      if (!apiRateLimiter.canMakeRequest(endpoint, requestKey)) {
        const waitTime = apiRateLimiter.getWaitTime(endpoint);
        throw new Error(`Demasiadas solicitudes. Por favor, espera ${Math.ceil(waitTime / 1000)} segundos antes de intentar nuevamente.`);
      }

      // Registrar el request para rate limiting
      apiRateLimiter.registerRequest(endpoint, requestKey);
      // Validar parámetros requeridos
      const normalizedSeatId = this.normalizeSeatIdValue(seatId);
      const normalizedFuncionId = this.normalizeFuncionIdValue(funcionId);
      const normalizedSessionId = this.normalizeSessionIdValue(sessionId);

      if (!normalizedSeatId || !normalizedFuncionId || !normalizedSessionId) {
        throw new Error('Parámetros requeridos: seatId, funcionId, sessionId');
      }

      const activePermanentLock = allowPermanentOverride
        ? null
        : await this.getActivePermanentLock(normalizedSeatId, normalizedFuncionId);

      if (activePermanentLock) {
        throw new Error('Asiento bloqueado permanentemente. Solo puede desbloquearse desde boletería.');
      }

      // Usar función RPC para desbloqueo atómico
      const { data, error } = await supabase.rpc('unlock_seat_atomically', {
        p_seat_id: normalizedSeatId,
        p_funcion_id: normalizedFuncionId,
        p_session_id: normalizedSessionId
      });

      if (error) {
        console.error('❌ [ATOMIC_UNLOCK] Error en desbloqueo atómico:', error);

        if (error.message?.includes('not_locked_by_user')) {
          throw new Error('No puedes desbloquear un asiento que no seleccionaste');
        } else if (error.message?.includes('already_paid')) {
          throw new Error('No se puede desbloquear un asiento ya pagado');
        } else {
          throw new Error(`Error al desbloquear asiento: ${error.message}`);
        }
      }

      const unlockedRow = Array.isArray(data) ? data[0] : data;
      // Obtener tenant_id para auditoría
      const tenantId = this.getCurrentTenantId();

      // Registrar acción de desbloqueo en auditoría
      auditService.logSeatAction('unlocked', {
        seatId: normalizedSeatId,
        functionId: normalizedFuncionId,
        sessionId: normalizedSessionId,
        previousStatus: 'locked',
        newStatus: 'available'
      }, {
        tenantId: tenantId || null,
        severity: 'info'
      }).catch(err => console.error('Error logging seat unlock:', err));

      return {
        success: true,
        data: unlockedRow
      };

    } catch (error) {
      console.error('❌ [ATOMIC_UNLOCK] Error inesperado:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verifica si un asiento está disponible para selección
   */
  async isSeatAvailable(seatId, funcionId, sessionId = null) {
    try {
      const params = {
        p_seat_id: seatId,
        p_funcion_id: parseInt(funcionId, 10)
      };

      // Si se proporciona sessionId, incluirlo para verificar solo locks de otros usuarios
      if (sessionId) {
        params.p_session_id = sessionId;
      }

      const { data, error } = await supabase.rpc('check_seat_availability', params);

      if (error) {
        console.error('❌ [AVAILABILITY_CHECK] Error:', error);

        // Si el error es porque la función no existe, intentar sin session_id
        if (error.code === '42883' && sessionId) {
          const { data: fallbackData, error: fallbackError } = await supabase.rpc('check_seat_availability', {
            p_seat_id: seatId,
            p_funcion_id: parseInt(funcionId, 10)
          });

          if (fallbackError) {
            console.error('❌ [AVAILABILITY_CHECK] Error en fallback:', fallbackError);
            return false;
          }

          return fallbackData === true;
        }

        return false;
      }

      return data === true;
    } catch (error) {
      console.error('❌ [AVAILABILITY_CHECK] Error inesperado:', error);
      return false;
    }
  }

  /**
   * Obtiene el estado actual de un asiento
   */
  async getSeatStatus(seatId, funcionId) {
    try {
      const normalizedSeatId = this.normalizeSeatIdValue(seatId);
      const normalizedFuncionId = this.normalizeFuncionIdValue(funcionId);

      if (!normalizedSeatId || !normalizedFuncionId) {
        console.error('❌ [SEAT_STATUS] Parámetros inválidos:', { seatId, funcionId });
        return null;
      }

      const { data, error } = await supabase
        .from('seat_locks')
        .select('status, session_id, locked_at, expires_at, user_id')
        .eq('seat_id', normalizedSeatId)
        .eq('funcion_id', normalizedFuncionId)
        .eq('lock_type', 'seat')
        .maybeSingle();

      if (error) {
        console.error('❌ [SEAT_STATUS] Error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ [SEAT_STATUS] Error inesperado:', error);
      return null;
    }
  }

  /**
   * Limpia bloqueos expirados de forma atómica
   */
  async cleanupExpiredLocks() {
    try {
      // Rate limiting: Verificar si el request está permitido
      const endpoint = 'cleanup_expired_seat_locks';

      if (!apiRateLimiter.canMakeRequest(endpoint)) {
        // Para cleanup, no lanzar error, solo retornar sin hacer nada
        return { success: false, error: 'Rate limit alcanzado', cleaned: 0 };
      }

      // Registrar el request para rate limiting
      apiRateLimiter.registerRequest(endpoint);
      const { data, error } = await supabase.rpc('cleanup_expired_seat_locks');

      if (error) {
        console.error('❌ [CLEANUP] Error:', error);
        return { success: false, error: error.message };
      }
      return { success: true, cleaned: data?.count || 0 };

    } catch (error) {
      console.error('❌ [CLEANUP] Error inesperado:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene el tenant_id actual
   */
  getCurrentTenantId() {
    try {
      const tenantId = localStorage.getItem('currentTenantId');
      if (tenantId) return tenantId;

      if (typeof window !== 'undefined' && window.__TENANT_CONTEXT__) {
        const globalTenantId = window.__TENANT_CONTEXT__.getTenantId?.();
        if (globalTenantId) return globalTenantId;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Genera un locator temporal
   */
  generateTempLocator() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 8 }, () =>
      alphabet[Math.floor(Math.random() * alphabet.length)]
    ).join('');
  }

  /**
   * Valida la integridad de los datos antes del bloqueo
   */
  validateLockData(seatId, funcionId, sessionId) {
    const errors = [];

    const normalizedSeatId = this.normalizeSeatIdValue(seatId);
    if (!normalizedSeatId) {
      errors.push('seatId debe ser un string válido');
    }

    const normalizedFuncionId = this.normalizeFuncionIdValue(funcionId);
    if (!normalizedFuncionId) {
      errors.push('funcionId debe ser un número válido mayor a 0');
    }

    const normalizedSessionId = this.normalizeSessionIdValue(sessionId);
    if (!normalizedSessionId) {
      errors.push('sessionId debe ser un string válido');
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      normalizedSeatId,
      normalizedFuncionId,
      normalizedSessionId
    };
  }

  normalizeSeatIdValue(seatId) {
    if (seatId === undefined || seatId === null) {
      return null;
    }

    let value = seatId;

    if (typeof value === 'object') {
      value =
        value.seat_id ||
        value.seatId ||
        value._id ||
        value.id ||
        value.sillaId ||
        null;
    }

    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value !== 'string') {
      if (typeof value.toString === 'function') {
        value = value.toString();
      } else {
        return null;
      }
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    if (trimmed.startsWith('silla_')) {
      return trimmed.slice(6);
    }

    return trimmed;
  }

  async getActivePermanentLock(normalizedSeatId, normalizedFuncionId) {
    try {
      const permanentStatuses = ['locked', 'bloqueado', 'vendido', 'pagado', 'reservado'];
      const now = new Date();

      const { data: locks, error } = await supabase
        .from('seat_locks')
        .select('*')
        .eq('seat_id', normalizedSeatId)
        .eq('funcion_id', normalizedFuncionId)
        .eq('lock_type', 'seat')
        .in('status', permanentStatuses);

      if (error) {
        return null;
      }

      if (!locks || locks.length === 0) {
        return null;
      }

      return locks.find(lock => {
        const expiresAt = lock.expires_at ? new Date(lock.expires_at) : null;
        return !expiresAt || expiresAt > now;
      }) || null;
    } catch (error) {
      return null;
    }
  }

  normalizeFuncionIdValue(funcionId) {
    if (funcionId === undefined || funcionId === null) {
      return null;
    }

    const parsed = parseInt(funcionId, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }

    return parsed;
  }

  /**
   * Normaliza y sanitiza un session_id a formato UUID válido
   * Maneja strings, objetos, y extrae UUIDs de diferentes formatos
   */
  normalizeSessionIdValue(sessionId) {
    if (!sessionId) return null;

    let value = sessionId;

    // Si es un objeto, intentar extraer el UUID de propiedades comunes
    if (typeof value === 'object' && value !== null) {
      const possibleKeys = ['id', 'session_id', 'sessionId', 'userId', 'uuid'];
      for (const key of possibleKeys) {
        if (typeof value[key] === 'string' && value[key].trim()) {
          value = value[key];
          break;
        }
      }
      // Si no se encontró, intentar toString
      if (typeof value === 'object') {
        if (typeof value.toString === 'function') {
          value = value.toString();
        } else {
          return null;
        }
      }
    }

    // Convertir a string si no lo es
    if (typeof value !== 'string') {
      if (typeof value?.toString === 'function') {
        value = value.toString();
      } else {
        return null;
      }
    }

    // Limpiar: eliminar espacios, caracteres invisibles, comillas, etc.
    const cleaned = value
      .trim()
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Eliminar caracteres invisibles
      .replace(/^["']|["']$/g, '') // Eliminar comillas al inicio/fin
      .trim();

    if (!cleaned) {
      return null;
    }

    // Extraer UUID usando regex (más flexible, acepta UUIDs dentro de texto)
    const uuidRegex = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
    const match = cleaned.match(uuidRegex);

    if (match && match[1]) {
      // Retornar UUID en formato canónico (lowercase)
      return match[1].toLowerCase();
    }

    // Si no se encontró un UUID válido, generar uno nuevo
    const newUuid = (typeof crypto !== 'undefined' && crypto?.randomUUID)
      ? crypto.randomUUID()
      : this.generateUuidFallback();
    return newUuid.toLowerCase();
  }

  /**
   * Genera un UUID si crypto.randomUUID no está disponible
   */
  generateUuidFallback() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// Crear instancia singleton
const atomicSeatLockService = new AtomicSeatLockService();
export default atomicSeatLockService;
