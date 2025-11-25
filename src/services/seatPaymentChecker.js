import { supabase } from '../supabaseClient';
import { isUuid } from '../utils/isUuid';

/**
 * Servicio optimizado para verificar si asientos ya fueron pagados
 * Verifica tanto en seat_locks como en payment_transactions
 * Incluye verificación batch para múltiples asientos
 */
const SEAT_IDENTIFIER_KEYS = ['id', 'seat_id', '_id', 'sillaId'];

class SeatPaymentChecker {
  constructor() {
    // Cache simple para evitar verificaciones duplicadas
    this.cache = new Map();
    this.cacheTimeout = 60000; // 60 segundos
    // Cache de asientos que NO están pagados (más común)
    this.notPaidCache = new Map();
    this.notPaidCacheTimeout = 30000; // 30 segundos para cache negativo
    // Cache para verificaciones batch
    this.batchCache = new Map();
    this.batchCacheTimeout = 30000; // 30 segundos para cache de batch

    // Bandera para evitar llamadas repetidas a un RPC ausente
    const rpcEnvFlag = process.env.NEXT_PUBLIC_ENABLE_SEAT_PAYMENT_RPC;
    const envDisablesRpc = typeof rpcEnvFlag === 'string' && ['false', '0', 'off'].includes(rpcEnvFlag.toLowerCase());
    this.rpcAvailable = !envDisablesRpc;
    this.rpcDisabledReason = envDisablesRpc ? 'disabled_by_env' : null;
  }

  disableRpc(reason) {
    if (!this.rpcAvailable) return;

    this.rpcAvailable = false;
    this.rpcDisabledReason = reason;
    console.warn(`[SEAT_PAYMENT_CHECKER] Deshabilitando RPC check_seats_payment_status (${reason}), usando verificación manual`);
  }

  buildDefaultResultMap(seatIds, source = 'rpc_disabled') {
    const map = new Map();
    seatIds.forEach(seatId => {
      map.set(seatId, {
        isPaid: false,
        status: 'disponible',
        source
      });
    });
    return map;
  }

  isRpcMissingError(error) {
    const message = error?.message?.toLowerCase?.() || '';
    return (
      error?.code === 'PGRST116' ||
      message.includes('does not exist') ||
      message.includes('not found')
    );
  }

  /**
   * Genera una clave de cache única
   */
  getCacheKey(seatId, funcionId, sessionId) {
    return `${seatId}-${funcionId}-${sessionId}`;
  }

  /**
   * Genera una clave de cache para batch
   */
  getBatchCacheKey(seatIds, funcionId, sessionId) {
    const sortedIds = [...seatIds].sort().join(',');
    return `batch_${sortedIds}-${funcionId}-${sessionId || 'all'}`;
  }

  /**
   * Verifica si hay un resultado en cache válido
   */
  getCachedResult(seatId, funcionId, sessionId) {
    const key = this.getCacheKey(seatId, funcionId, sessionId);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }
    
    // Limpiar cache expirado
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  /**
   * Guarda un resultado en cache
   */
  setCachedResult(seatId, funcionId, sessionId, result) {
    const key = this.getCacheKey(seatId, funcionId, sessionId);
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  /**
   * Verifica múltiples asientos en una sola consulta (BATCH)
   * @param {string[]} seatIds - Array de IDs de asientos
   * @param {number} funcionId - ID de la función
   * @param {string} sessionId - ID de sesión del usuario (opcional)
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Map<string, {isPaid: boolean, status: string, source: string}>>}
   */
  async checkSeatsBatch(seatIds, funcionId, sessionId = null, options = {}) {
    const { useCache = true, timeout = 5000 } = options;

    if (!seatIds || seatIds.length === 0) {
      return new Map();
    }

    // Normalizar IDs a strings
    const normalizedSeatIds = seatIds.map(id => String(id));

    // Evitar llamadas RPC repetidas si ya sabemos que no existe o está deshabilitado
    if (!this.rpcAvailable && !options.forceRpc) {
      return this.buildDefaultResultMap(normalizedSeatIds, this.rpcDisabledReason || 'rpc_disabled');
    }

    // Verificar cache batch primero
    if (useCache) {
      const batchCacheKey = this.getBatchCacheKey(normalizedSeatIds, funcionId, sessionId);
      const cachedBatch = this.batchCache.get(batchCacheKey);
      
      if (cachedBatch && Date.now() - cachedBatch.timestamp < this.batchCacheTimeout) {
        return cachedBatch.data;
      }
    }

    try {
      const validUserId = isUuid(sessionId) ? sessionId : null;
      const parsedFuncionId = Number(funcionId);
      const normalizedFuncionId = Number.isFinite(parsedFuncionId) ? parsedFuncionId : null;

      // Llamar a la función RPC para verificar múltiples asientos
      const checkPromise = supabase.rpc('check_seats_payment_status', {
        p_seat_ids: normalizedSeatIds,
        p_funcion_id: normalizedFuncionId,
        p_session_id: validUserId,
        p_user_id: validUserId
      });

      // Aplicar timeout si está configurado
      let result;
      if (timeout > 0) {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        );
        
        try {
          const { data, error } = await Promise.race([checkPromise, timeoutPromise]);
          if (error) {
            // Si la función RPC no existe (404), silenciar el error y continuar
            if (this.isRpcMissingError(error)) {
              this.disableRpc('not_found');
              // Retornar resultados por defecto (no pagados) sin lanzar error
              result = normalizedSeatIds.map(seatId => ({
                seat_id: seatId,
                is_paid: false,
                status: 'disponible',
                source: 'rpc_not_available',
                locator: null
              }));
            } else {
              console.error('Error in checkSeatsBatch RPC:', error);
              this.disableRpc('rpc_error');
              result = normalizedSeatIds.map(seatId => ({
                seat_id: seatId,
                is_paid: false,
                status: 'error',
                source: 'rpc_error',
                locator: null
              }));
            }
          } else {
            result = data || [];
          }
        } catch (err) {
          if (err.message === 'Timeout') {
            console.warn(`[SEAT_PAYMENT_CHECKER] Timeout en verificación batch, asumiendo no pagados`);
            // Retornar resultados por defecto (no pagados)
            result = normalizedSeatIds.map(seatId => ({
              seat_id: seatId,
              is_paid: false,
              status: 'timeout',
              source: 'timeout',
              locator: null
            }));
          } else {
            throw err;
          }
        }
      } else {
        const { data, error } = await checkPromise;
        if (error) {
          // Si la función RPC no existe (404), silenciar el error y continuar
          if (this.isRpcMissingError(error)) {
            this.disableRpc('not_found');
            // Retornar resultados por defecto (no pagados) sin lanzar error
            result = normalizedSeatIds.map(seatId => ({
              seat_id: seatId,
              is_paid: false,
              status: 'disponible',
              source: 'rpc_not_available',
              locator: null
            }));
          } else {
            console.error('Error in checkSeatsBatch RPC:', error);
            this.disableRpc('rpc_error');
            result = normalizedSeatIds.map(seatId => ({
              seat_id: seatId,
              is_paid: false,
              status: 'error',
              source: 'rpc_error',
              locator: null
            }));
          }
        } else {
          result = data || [];
        }
      }

      // Convertir resultados a Map para acceso rápido
      const resultsMap = new Map();
      result.forEach(row => {
        resultsMap.set(row.seat_id, {
          isPaid: row.is_paid,
          status: row.status,
          source: row.source
        });
        
        // Actualizar cache individual para cada asiento
        if (useCache && sessionId) {
          this.setCachedResult(row.seat_id, funcionId, sessionId, {
            isPaid: row.is_paid,
            status: row.status,
            source: row.source
          });
        }
      });

      // Agregar asientos que no fueron encontrados (no pagados)
      normalizedSeatIds.forEach(seatId => {
        if (!resultsMap.has(seatId)) {
          resultsMap.set(seatId, {
            isPaid: false,
            status: 'disponible',
            source: 'not_found'
          });
        }
      });

      // Guardar en cache batch
      if (useCache) {
        const batchCacheKey = this.getBatchCacheKey(normalizedSeatIds, funcionId, sessionId);
        this.batchCache.set(batchCacheKey, {
          data: resultsMap,
          timestamp: Date.now()
        });
      }

      return resultsMap;
    } catch (error) {
      console.error('Error in checkSeatsBatch:', error);
      // En caso de error, retornar resultados por defecto (no pagados)
      const errorMap = new Map();
      normalizedSeatIds.forEach(seatId => {
        errorMap.set(seatId, {
          isPaid: false,
          status: 'error',
          source: 'error'
        });
      });
      return errorMap;
    }
  }

  /**
   * Verifica si un asiento ya fue pagado por el usuario actual
   * @param {string} seatId - ID del asiento
   * @param {number} funcionId - ID de la función
   * @param {string} sessionId - ID de sesión del usuario
   * @returns {Promise<{isPaid: boolean, status: string, source: string}>}
   */
  async isSeatPaidByUser(seatId, funcionId, sessionId, options = {}) {
    try {
      const { timeout = 3000, useCache = true } = options;
      
      // Verificar cache primero (solo si useCache es true)
      if (useCache) {
        const cachedResult = this.getCachedResult(seatId, funcionId, sessionId);
        if (cachedResult) {
          return cachedResult;
        }
        
        // Verificar cache negativo (asientos que NO están pagados)
        const cacheKey = this.getCacheKey(seatId, funcionId, sessionId);
        const notPaidCached = this.notPaidCache.get(cacheKey);
        if (notPaidCached && Date.now() - notPaidCached.timestamp < this.notPaidCacheTimeout) {
          return { isPaid: false, status: 'disponible', source: 'cache' };
        }
      }

      // Usar verificación batch para un solo asiento (más eficiente que consulta individual)
      const batchResult = await this.checkSeatsBatch([seatId], funcionId, sessionId, {
        useCache,
        timeout
      });

      const result = batchResult.get(String(seatId)) || {
        isPaid: false,
        status: 'disponible',
        source: 'not_found'
      };

      return result;
    } catch (error) {
      console.error('Error in isSeatPaidByUser:', error);
      // En caso de error, asumir que NO está pagado (más seguro para UX)
      const errorResult = {
        isPaid: false,
        status: 'error',
        source: 'error'
      };
      
      // No guardar resultado de error en cache (para permitir reintento)
      return errorResult;
    }
  }

  /**
   * Verifica si un asiento fue pagado por cualquier usuario
   * @param {string} seatId - ID del asiento
   * @param {number} funcionId - ID de la función
   * @returns {Promise<{isPaid: boolean, status: string, source: string}>}
   */
  async isSeatPaidByAnyone(seatId, funcionId) {
    try {
      // Usar verificación batch sin sessionId para verificar por cualquier usuario
      const batchResult = await this.checkSeatsBatch([seatId], funcionId, null, {
        useCache: true,
        timeout: 3000
      });

      const result = batchResult.get(String(seatId)) || {
        isPaid: false,
        status: null,
        source: null
      };

      return {
        isPaid: result.isPaid,
        status: result.status,
        source: result.source
      };
    } catch (error) {
      console.error('Error in isSeatPaidByAnyone:', error);
      return {
        isPaid: false,
        status: null,
        source: null
      };
    }
  }

  /**
   * Parsea los asientos desde el campo seats de payment_transactions
   * @param {string|Array} seatsData - Datos de asientos
   * @returns {Array} Array de asientos parseados
   */
  parseSeatsFromPayment(seatsData) {
    if (!seatsData) return [];
    
    try {
      if (typeof seatsData === 'string') {
        return JSON.parse(seatsData);
      } else if (Array.isArray(seatsData)) {
        return seatsData;
      }
      return [];
    } catch (error) {
      console.error('Error parsing seats from payment:', error);
      return [];
    }
  }

  /**
   * Limpia el cache (útil para testing o cuando se necesita invalidar)
   */
  clearCache() {
    this.cache.clear();
    this.notPaidCache.clear();
    this.batchCache.clear();
  }
}

// Crear instancia singleton para mantener el cache
const seatPaymentChecker = new SeatPaymentChecker();

export default seatPaymentChecker;
