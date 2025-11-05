import { supabase } from '../supabaseClient';

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

      // Usar función RPC para bloqueo atómico
      console.log('🔒 [ATOMIC_LOCK] Llamando a lock_seat_atomically con:', lockData);
      const { data, error } = await supabase.rpc('lock_seat_atomically', lockData);
      
      if (error) {
        console.error('❌ [ATOMIC_LOCK] Error en bloqueo atómico:', error);
        console.error('❌ [ATOMIC_LOCK] Detalles del error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // Manejar errores específicos
        if (error.message?.includes('already_locked') || error.code === 'P0001') {
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

      console.log('✅ [ATOMIC_LOCK] Asiento bloqueado exitosamente:', data);
      return {
        success: true,
        lockData: data,
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
  async unlockSeatAtomically(seatId, funcionId, sessionId) {
    try {
      console.log('🔓 [ATOMIC_UNLOCK] Intentando desbloqueo atómico:', { seatId, funcionId, sessionId });

      // Validar parámetros requeridos
      const normalizedSeatId = this.normalizeSeatIdValue(seatId);
      const normalizedFuncionId = this.normalizeFuncionIdValue(funcionId);
      const normalizedSessionId = this.normalizeSessionIdValue(sessionId);

      if (!normalizedSeatId || !normalizedFuncionId || !normalizedSessionId) {
        throw new Error('Parámetros requeridos: seatId, funcionId, sessionId');
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

      console.log('✅ [ATOMIC_UNLOCK] Asiento desbloqueado exitosamente:', data);
      return {
        success: true,
        data: data
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
          console.log('🔄 [AVAILABILITY_CHECK] Intentando sin session_id...');
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
      console.log('🧹 [CLEANUP] Limpiando bloqueos expirados...');
      
      const { data, error } = await supabase.rpc('cleanup_expired_seat_locks');
      
      if (error) {
        console.error('❌ [CLEANUP] Error:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ [CLEANUP] Bloqueos expirados limpiados:', data);
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
      
      console.warn('⚠️ No se pudo obtener el tenant_id');
      return null;
    } catch (error) {
      console.warn('No se pudo obtener el tenant ID:', error);
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

  normalizeSessionIdValue(sessionId) {
    if (sessionId === undefined || sessionId === null) {
      return null;
    }

    let value = sessionId;

    if (typeof value !== 'string') {
      if (typeof value.toString === 'function') {
        value = value.toString();
      } else {
        return null;
      }
    }

    // Limpiar el valor: eliminar espacios, caracteres invisibles, comillas, etc.
    const cleaned = value
      .trim()
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Eliminar caracteres invisibles
      .replace(/^["']|["']$/g, '') // Eliminar comillas al inicio/fin
      .trim();

    if (!cleaned) {
      return null;
    }

    // Validar formato UUID (básico)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cleaned)) {
      console.warn('⚠️ [ATOMIC_LOCK] session_id no tiene formato UUID válido:', cleaned);
      // Si no es un UUID válido, generar uno nuevo
      const newUuid = crypto?.randomUUID?.() || this.generateUuidFallback();
      console.warn('⚠️ [ATOMIC_LOCK] Generando nuevo UUID:', newUuid);
      return newUuid;
    }

    return cleaned;
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
