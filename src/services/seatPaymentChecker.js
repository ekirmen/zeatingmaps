import { supabase } from '../config/supabase';

/**
 * Servicio para verificar si un asiento ya fue pagado
 * Verifica tanto en seat_locks como en payment_transactions
 */
const SEAT_IDENTIFIER_KEYS = ['id', 'seat_id', '_id', 'sillaId'];

class SeatPaymentChecker {
  constructor() {
    // Cache simple para evitar verificaciones duplicadas
    this.cache = new Map();
    this.cacheTimeout = 60000; // 60 segundos (aumentado para mejor performance)
    // Cache de asientos que NO están pagados (más común)
    this.notPaidCache = new Map();
    this.notPaidCacheTimeout = 30000; // 30 segundos para cache negativo
  }

  /**
   * Genera una clave de cache única
   */
  getCacheKey(seatId, funcionId, sessionId) {
    return `${seatId}-${funcionId}-${sessionId}`;
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

      // Verificando pago para asiento con timeout
      const checkPromise = (async () => {
        // 1. Verificar en seat_locks si tiene status pagado/vendido/completed (más rápido)
        const { data: seatLocks, error: locksError } = await supabase
          .from('seat_locks')
          .select('status, locator, session_id')
          .eq('seat_id', seatId)
          .eq('funcion_id', funcionId)
          .eq('session_id', sessionId)
          .limit(1); // Limitar a 1 resultado para mejor performance

        if (locksError) {
          console.error('Error checking seat_locks:', locksError);
        } else if (seatLocks && seatLocks.length > 0) {
          const lock = seatLocks[0];
          if (['pagado', 'vendido', 'completed'].includes(lock.status)) {
            const result = {
              isPaid: true,
              status: lock.status,
              source: 'seat_locks'
            };
            this.setCachedResult(seatId, funcionId, sessionId, result);
            return result;
          }
        }

        // 2. Solo verificar payment_transactions si no encontramos nada en seat_locks
        // (optimización: evitar consulta costosa si no es necesario)
        const {
          data: transactions,
          error: transactionsError
        } = await this.fetchCompletedTransactionsBySeat({
          funcionId,
          seatId,
          userId: sessionId
        });

        if (transactionsError) {
          // Error checking payment_transactions
        } else if (transactions && transactions.length > 0) {
          // Asiento pagado detectado
          const result = {
            isPaid: true,
            status: 'completed',
            source: 'payment_transactions'
          };
          this.setCachedResult(seatId, funcionId, sessionId, result);
          return result;
        }

        // Si llegamos aquí, el asiento NO está pagado
        const result = {
          isPaid: false,
          status: 'disponible',
          source: 'database'
        };

        // Guardar en cache positivo y negativo
        this.setCachedResult(seatId, funcionId, sessionId, result);
        const cacheKey = this.getCacheKey(seatId, funcionId, sessionId);
        this.notPaidCache.set(cacheKey, {
          result,
          timestamp: Date.now()
        });
        
        return result;
      })();

      // Aplicar timeout si está configurado
      if (timeout > 0) {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        );
        
        try {
          const result = await Promise.race([checkPromise, timeoutPromise]);
          return result;
        } catch (err) {
          if (err.message === 'Timeout') {
            // Si hay timeout, asumir que NO está pagado (más seguro para UX)
            console.warn(`[SEAT_PAYMENT_CHECKER] Timeout verificando pago para asiento ${seatId}, asumiendo no pagado`);
            const timeoutResult = {
              isPaid: false,
              status: 'timeout',
              source: 'timeout'
            };
            // No guardar en cache negativo si fue timeout (para permitir reintento)
            return timeoutResult;
          }
          throw err;
        }
      } else {
        return await checkPromise;
      }
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
      // 1. Verificar en seat_locks
      const { data: seatLocks, error: locksError } = await supabase
        .from('seat_locks')
        .select('status, locator, session_id')
        .eq('seat_id', seatId)
        .eq('funcion_id', funcionId);

      if (locksError) {
        console.error('Error checking seat_locks:', locksError);
      } else if (seatLocks && seatLocks.length > 0) {
        const lock = seatLocks[0];
        if (['pagado', 'vendido', 'completed'].includes(lock.status)) {
          return {
            isPaid: true,
            status: lock.status,
            source: 'seat_locks'
          };
        }
      }

      // 2. Verificar en payment_transactions
      const {
        data: transactions,
        error: transactionsError
      } = await this.fetchCompletedTransactionsBySeat({ funcionId, seatId });

      if (transactionsError) {
        console.error('Error checking payment_transactions:', transactionsError);
      } else if (transactions && transactions.length > 0) {
        return {
          isPaid: true,
          status: 'completed',
          source: 'payment_transactions'
        };
      }

      return {
        isPaid: false,
        status: null,
        source: null
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
   * Busca transacciones completadas que incluyan el asiento indicado.
   * Utiliza filtros contains con múltiples variantes de identificadores para los asientos.
   * @param {Object} params
   * @param {number} params.funcionId
   * @param {string} params.seatId
   * @param {string} [params.userId]
   * @returns {Promise<{data: Array, error: import('@supabase/supabase-js').PostgrestError|null}>}
   */
  async fetchCompletedTransactionsBySeat({ funcionId, seatId, userId }) {
    let lastError = null;

    for (const key of SEAT_IDENTIFIER_KEYS) {
      const seatFilter = [{ [key]: seatId }];
      const seatFilterValue = JSON.stringify(seatFilter);

      let query = supabase
        .from('payment_transactions')
        .select('id, status, seats, user_id, locator')
        .eq('funcion_id', funcionId)
        .eq('status', 'completed')
        .filter('seats', 'cs', seatFilterValue);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        lastError = error;
        console.error('❌ [SEAT_PAYMENT_CHECKER] Error buscando asiento en payment_transactions:', {
          key,
          seatId,
          error
        });
        continue;
      }

      if (data && data.length > 0) {
        return { data, error: null };
      }
    }

    if (lastError) {
      return { data: [], error: lastError };
    }

    // Fallback: revisar transacciones sin contains para mantener compatibilidad con datos antiguos
    let fallbackQuery = supabase
      .from('payment_transactions')
      .select('id, status, seats, user_id, locator')
      .eq('funcion_id', funcionId)
      .eq('status', 'completed');

    if (userId) {
      fallbackQuery = fallbackQuery.eq('user_id', userId);
    }

    const { data: fallbackData, error: fallbackError } = await fallbackQuery;
    if (fallbackError) {
      console.error('❌ [SEAT_PAYMENT_CHECKER] Error en fallback de búsqueda de payment_transactions:', fallbackError);
    } else if (fallbackData?.length) {
      for (const transaction of fallbackData) {
        const seats = this.parseSeatsFromPayment(transaction.seats);
        const seatExists = seats.some(seat =>
          SEAT_IDENTIFIER_KEYS.some(identifierKey => seat?.[identifierKey] === seatId)
        );

        if (seatExists) {
          return { data: [transaction], error: null };
        }
      }
    }

    return { data: [], error: fallbackError || null };
  }
}

// Crear instancia singleton para mantener el cache
const seatPaymentChecker = new SeatPaymentChecker();

export default seatPaymentChecker;
