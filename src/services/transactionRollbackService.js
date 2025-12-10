import { supabase } from '../supabaseClient';
import atomicSeatLockService from './atomicSeatLock';

/**
 * Servicio para manejo robusto de rollback de transacciones
 * Previene estados inconsistentes cuando fallan los pagos
 */
class TransactionRollbackService {

  /**
   * Ejecuta una transacción con rollback automático en caso de error
   */
  async executeWithRollback(transactionFunction, rollbackFunction, context = {}) {
    let transactionResult = null;
    let rollbackExecuted = false;

    try {
      // Ejecutar la transacción principal
      transactionResult = await transactionFunction();
      return {
        success: true,
        data: transactionResult,
        rollbackExecuted: false
      };

    } catch (error) {
      console.error('❌ [ROLLBACK_SERVICE] Error en transacción, ejecutando rollback:', error);

      try {
        // Ejecutar rollback
        await rollbackFunction(transactionResult, context);
        rollbackExecuted = true;
        return {
          success: false,
          error: error.message,
          rollbackExecuted: true,
          originalError: error
        };

      } catch (rollbackError) {
        console.error('❌ [ROLLBACK_SERVICE] Error crítico en rollback:', rollbackError);

        // Reportar error crítico
        await this.reportCriticalError({
          transactionError: error,
          rollbackError: rollbackError,
          context: context
        });

        return {
          success: false,
          error: 'Error crítico: No se pudo completar la transacción ni el rollback',
          rollbackExecuted: false,
          originalError: error,
          rollbackError: rollbackError
        };
      }
    }
  }

  /**
   * Rollback específico para liberar asientos bloqueados
   */
  async rollbackSeatLocks(seats, context = {}) {
    try {
      if (!Array.isArray(seats) || seats.length === 0) {
        return { success: true, released: 0 };
      }

      const releasePromises = seats.map(async (seat) => {
        try {
          const seatId = seat.id || seat._id || seat.sillaId || seat.seatId;
          const funcionId = seat.functionId || seat.funcionId || context.funcionId;
          const sessionId = context.sessionId;

          if (!seatId || !funcionId || !sessionId) {
            return false;
          }

          // Usar servicio atómico para liberar asiento
          const result = await atomicSeatLockService.unlockSeatAtomically(
            seatId,
            funcionId,
            sessionId
          );

          if (result.success) {
            return true;
          } else {
            console.error('❌ [ROLLBACK_SERVICE] Error liberando asiento:', seatId, result.error);
            return false;
          }
        } catch (error) {
          console.error('❌ [ROLLBACK_SERVICE] Error inesperado liberando asiento:', error);
          return false;
        }
      });

      const results = await Promise.allSettled(releasePromises);
      const released = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
      return {
        success: true,
        released: released,
        total: seats.length,
        results: results
      };

    } catch (error) {
      console.error('❌ [ROLLBACK_SERVICE] Error crítico en rollback de asientos:', error);
      throw error;
    }
  }

  /**
   * Rollback específico para transacciones de pago
   */
  async rollbackPaymentTransaction(transactionId, context = {}) {
    try {
      if (!transactionId) {
        return { success: true };
      }

      // Actualizar estado de la transacción a fallida
      const { error: updateError } = await supabase
        .from('payment_transactions')
        .update({
          status: 'failed',
          error_message: context.error || 'Transacción fallida y revertida',
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (updateError) {
        console.error('❌ [ROLLBACK_SERVICE] Error actualizando transacción:', updateError);
        throw updateError;
      }
      return {
        success: true,
        transactionId: transactionId
      };

    } catch (error) {
      console.error('❌ [ROLLBACK_SERVICE] Error en rollback de transacción de pago:', error);
      throw error;
    }
  }

  /**
   * Rollback completo para el proceso de venta
   */
  async rollbackCompleteSale(saleData, context = {}) {
    try {
      const rollbackResults = {
        seats: { success: false, released: 0 },
        payment: { success: false },
        notifications: { success: false }
      };

      // 1. Liberar asientos
      if (saleData.seats && Array.isArray(saleData.seats)) {
        try {
          rollbackResults.seats = await this.rollbackSeatLocks(saleData.seats, context);
        } catch (error) {
          console.error('❌ [ROLLBACK_SERVICE] Error en rollback de asientos:', error);
        }
      }

      // 2. Revertir transacción de pago
      if (saleData.transactionId) {
        try {
          rollbackResults.payment = await this.rollbackPaymentTransaction(saleData.transactionId, context);
        } catch (error) {
          console.error('❌ [ROLLBACK_SERVICE] Error en rollback de pago:', error);
        }
      }

      // 3. Limpiar notificaciones pendientes
      if (saleData.notificationId) {
        try {
          rollbackResults.notifications = await this.rollbackNotifications(saleData.notificationId);
        } catch (error) {
          console.error('❌ [ROLLBACK_SERVICE] Error en rollback de notificaciones:', error);
        }
      }
      return {
        success: true,
        results: rollbackResults
      };

    } catch (error) {
      console.error('❌ [ROLLBACK_SERVICE] Error crítico en rollback completo:', error);
      throw error;
    }
  }

  /**
   * Rollback de notificaciones
   */
  async rollbackNotifications(notificationId) {
    try {
      const { error } = await supabase
        .from('payment_notifications')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) {
        console.error('❌ [ROLLBACK_SERVICE] Error revirtiendo notificaciones:', error);
        throw error;
      }

      return { success: true };

    } catch (error) {
      console.error('❌ [ROLLBACK_SERVICE] Error en rollback de notificaciones:', error);
      throw error;
    }
  }

  /**
   * Reportar errores críticos para monitoreo
   */
  async reportCriticalError(errorData) {
    try {
      console.error('🚨 [ROLLBACK_SERVICE] Reportando error crítico:', errorData);

      // Aquí podrías enviar el error a un servicio de monitoreo
      // como Sentry, LogRocket, o un endpoint personalizado

      const errorReport = {
        type: 'critical_rollback_failure',
        timestamp: new Date().toISOString(),
        data: errorData,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
        url: typeof window !== 'undefined' ? window.location.href : null
      };

      // Log local para debugging
      console.error('🚨 [CRITICAL_ERROR]', errorReport);

      // Opcional: Enviar a servicio de monitoreo
      // await this.sendToMonitoringService(errorReport);

    } catch (error) {
      console.error('❌ [ROLLBACK_SERVICE] Error reportando error crítico:', error);
    }
  }

  /**
   * Validar integridad antes de ejecutar transacción
   */
  validateTransactionData(data) {
    const errors = [];

    if (!data) {
      errors.push('Datos de transacción requeridos');
      return { isValid: false, errors };
    }

    if (data.seats && !Array.isArray(data.seats)) {
      errors.push('Seats debe ser un array');
    }

    if (data.amount && (typeof data.amount !== 'number' || data.amount <= 0)) {
      errors.push('Amount debe ser un número mayor a 0');
    }

    if (data.userId && typeof data.userId !== 'string') {
      errors.push('userId debe ser un string válido');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Crear contexto de rollback desde datos de transacción
   */
  createRollbackContext(transactionData, sessionId) {
    return {
      sessionId: sessionId,
      funcionId: transactionData.funcionId || transactionData.funcion?.id,
      userId: transactionData.userId || transactionData.user?.id,
      tenantId: transactionData.tenantId || transactionData.tenant?.id,
      timestamp: new Date().toISOString(),
      originalData: transactionData
    };
  }
}

// Crear instancia singleton
const transactionRollbackService = new TransactionRollbackService();
export default transactionRollbackService;
