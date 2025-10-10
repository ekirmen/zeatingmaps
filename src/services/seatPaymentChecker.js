import { supabase } from '../config/supabase';

/**
 * Servicio para verificar si un asiento ya fue pagado
 * Verifica tanto en seat_locks como en payment_transactions
 */
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
      
      const { data: transactions, error: transactionsError } = await supabase
        .from('payment_transactions')
        .select('id, status, seats, user_id, locator')
        .eq('funcion_id', funcionId)
        .eq('status', 'completed')
        .eq('user_id', sessionId);

      if (transactionsError) {
        console.error('❌ [SEAT_PAYMENT_CHECKER] Error checking payment_transactions:', transactionsError);
      } else {
        console.log('📊 [SEAT_PAYMENT_CHECKER] Transacciones encontradas:', transactions?.length || 0);
        
        if (transactions && transactions.length > 0) {
          // Verificar si el asiento está en alguna de las transacciones
          for (const transaction of transactions) {
            console.log('🔍 [SEAT_PAYMENT_CHECKER] Verificando transacción:', { 
              id: transaction.id, 
              user_id: transaction.user_id,
              seats: transaction.seats 
            });
            
            const seats = this.parseSeatsFromPayment(transaction.seats);
            console.log('📋 [SEAT_PAYMENT_CHECKER] Asientos parseados:', seats);
            
            const seatExists = seats.some(seat => 
              (seat.id || seat._id || seat.sillaId || seat.seat_id) === seatId
            );
            
            console.log('🔍 [SEAT_PAYMENT_CHECKER] ¿Asiento encontrado?', seatExists);
            
            if (seatExists) {
              console.log('✅ [SEAT_PAYMENT_CHECKER] Asiento pagado detectado en payment_transactions');
              return {
                isPaid: true,
                status: 'completed',
                source: 'payment_transactions'
              };
            }
          }
        }
      }

      // 3. Verificar si el asiento fue pagado por CUALQUIER usuario (no solo el actual)
      console.log('🔍 [SEAT_PAYMENT_CHECKER] Verificando si el asiento fue pagado por cualquier usuario...');
      
      const { data: allTransactions, error: allTransactionsError } = await supabase
        .from('payment_transactions')
        .select('id, status, seats, user_id, locator')
        .eq('funcion_id', funcionId)
        .eq('status', 'completed');

      if (allTransactionsError) {
        console.error('❌ [SEAT_PAYMENT_CHECKER] Error checking all payment_transactions:', allTransactionsError);
      } else {
        console.log('📊 [SEAT_PAYMENT_CHECKER] Todas las transacciones encontradas:', allTransactions?.length || 0);
        
        if (allTransactions && allTransactions.length > 0) {
          for (const transaction of allTransactions) {
            const seats = this.parseSeatsFromPayment(transaction.seats);
            const seatExists = seats.some(seat => 
              (seat.id || seat._id || seat.sillaId || seat.seat_id) === seatId
            );
            
            if (seatExists) {
              console.log('✅ [SEAT_PAYMENT_CHECKER] Asiento pagado detectado por cualquier usuario en payment_transactions');
              return {
                isPaid: true,
                status: 'completed',
                source: 'payment_transactions_by_anyone'
              };
            }
          }
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
      const { data: transactions, error: transactionsError } = await supabase
        .from('payment_transactions')
        .select('id, status, seats, user_id, locator')
        .eq('funcion_id', funcionId)
        .eq('status', 'completed');

      if (transactionsError) {
        console.error('Error checking payment_transactions:', transactionsError);
      } else if (transactions && transactions.length > 0) {
        for (const transaction of transactions) {
          const seats = this.parseSeatsFromPayment(transaction.seats);
          const seatExists = seats.some(seat => 
            (seat.id || seat._id || seat.sillaId || seat.seat_id) === seatId
          );
          
          if (seatExists) {
            return {
              isPaid: true,
              status: 'completed',
              source: 'payment_transactions'
            };
          }
        }
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
}

export default new SeatPaymentChecker();
