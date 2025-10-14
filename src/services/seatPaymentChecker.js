import { supabase } from '../config/supabase';

/**
 * Servicio para verificar si un asiento ya fue pagado
 * Verifica tanto en seat_locks como en payment_transactions
 */
const SEAT_IDENTIFIER_KEYS = ['id', 'seat_id', '_id', 'sillaId'];

class SeatPaymentChecker {
  /**
   * Verifica si un asiento ya fue pagado por el usuario actual
   * @param {string} seatId - ID del asiento
   * @param {number} funcionId - ID de la función
   * @param {string} sessionId - ID de sesión del usuario
   * @returns {Promise<{isPaid: boolean, status: string, source: string}>}
   */
  async isSeatPaidByUser(seatId, funcionId, sessionId) {
    try {
      console.log('🔍 [SEAT_PAYMENT_CHECKER] Verificando pago para:', { seatId, funcionId, sessionId, funcionIdType: typeof funcionId });
      
      // 1. Verificar en seat_locks si tiene status pagado/vendido/completed
      const { data: seatLocks, error: locksError } = await supabase
        .from('seat_locks')
        .select('status, locator, session_id')
        .eq('seat_id', seatId)
        .eq('funcion_id', funcionId)
        .eq('session_id', sessionId);

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

      // 2. Verificar en payment_transactions si el asiento fue pagado por este usuario
      console.log('🔍 [SEAT_PAYMENT_CHECKER] Verificando payment_transactions para:', { seatId, funcionId, sessionId });
      
      const {
        data: transactions,
        error: transactionsError
      } = await this.fetchCompletedTransactionsBySeat({
        funcionId,
        seatId,
        userId: sessionId
      });

      if (transactionsError) {
        console.error('❌ [SEAT_PAYMENT_CHECKER] Error checking payment_transactions:', transactionsError);
      } else {
        console.log('📊 [SEAT_PAYMENT_CHECKER] Transacciones encontradas:', transactions?.length || 0);

        if (transactions && transactions.length > 0) {
          console.log('✅ [SEAT_PAYMENT_CHECKER] Asiento pagado detectado en payment_transactions');
          return {
            isPaid: true,
            status: 'completed',
            source: 'payment_transactions'
          };
        }
      }

      // 3. Verificar si el asiento fue pagado por CUALQUIER usuario (no solo el actual)
      console.log('🔍 [SEAT_PAYMENT_CHECKER] Verificando si el asiento fue pagado por cualquier usuario...');

      const {
        data: allTransactions,
        error: allTransactionsError
      } = await this.fetchCompletedTransactionsBySeat({ funcionId, seatId });

      if (allTransactionsError) {
        console.error('❌ [SEAT_PAYMENT_CHECKER] Error checking all payment_transactions:', allTransactionsError);
      } else {
        console.log('📊 [SEAT_PAYMENT_CHECKER] Todas las transacciones encontradas:', allTransactions?.length || 0);

        if (allTransactions && allTransactions.length > 0) {
          console.log('✅ [SEAT_PAYMENT_CHECKER] Asiento pagado detectado por cualquier usuario en payment_transactions');
          return {
            isPaid: true,
            status: 'completed',
            source: 'payment_transactions_by_anyone'
          };
        }
      }

      return {
        isPaid: false,
        status: null,
        source: null
      };

    } catch (error) {
      console.error('Error in isSeatPaidByUser:', error);
      return {
        isPaid: false,
        status: null,
        source: null
      };
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

export default new SeatPaymentChecker();
