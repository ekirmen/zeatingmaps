import { supabase } from '../supabaseClient';
import { buildPaymentTransactionPayload } from '../utils/normalizeTransactionPayload';

/**
 * Crea una transacción de pago
 */
export 

    const { data, error } = await supabase
      .from('payment_transactions')
      .insert([payload])
      .select()
      .single();


    return data;
  } catch (error) {
    console.error('Error creating payment transaction:', error);
    throw error;
  }
};

/**
 * Actualiza el estado de una transacción
 */
export 

    if (fetchError) {
    }

    const { data, error } = await supabase
      .from('payment_transactions')
      .update({
        status: status,
        gateway_response: gatewayResponse,
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (error) throw error;

    // Si el status cambió a 'completed' y antes no lo estaba, enviar correo de pago completo
    const previousStatus = currentTransaction?.status;
    const newStatus = status;
    const statusChangedToCompleted = (previousStatus !== 'completed' && previousStatus !== 'pagado') &&
                                     (newStatus === 'completed' || newStatus === 'pagado');

    if (statusChangedToCompleted && data.locator && data.user_id) {
      try {
        // Importar dinámicamente para evitar problemas de ciclo
        const { sendPaymentEmailByStatus } = await import('../store/services/paymentEmailService');

        const emailResult = await sendPaymentEmailByStatus({
          locator: data.locator,
          user_id: data.user_id,
          status: 'completed',
          transactionId: data.id,
          amount: data.amount,
        });

        if (emailResult.success) {
        } else {
        }
      } catch (emailError) {
        console.error('❌ [UPDATE_STATUS] Error enviando correo de pago completo:', emailError);
        // No bloquear la actualización si falla el envío de correo
      }
    }

    return data;
  } catch (error) {
    console.error('Error updating payment transaction status:', error);
    throw error;
  }
};

/**
 * Oculta una transacción de pago
 */
export 

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error hiding payment transaction:', error);
    throw error;
  }
};

/**
 * Muestra una transacción previamente oculta
 */
export 

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error unhiding payment transaction:', error);
    throw error;
  }
};

/**
 * Elimina una transacción de pago
 */
export 

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting payment transaction:', error);
    throw error;
  }
};

/**
 * Busca una transacción por localizador
 */
export 

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching payment transaction by locator:', error);
    throw error;
  }
};

/**
 * Obtiene todas las transacciones de un usuario
 */
export 

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching payment transactions by user:', error);
    throw error;
  }
};

/**
 * Obtiene estadísticas de transacciones
 */
export 

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calcular estadísticas
    const stats = {
      total: data.length,
      completed: data.filter(t => t.status === 'completed').length,
      pending: data.filter(t => t.status === 'pending').length,
      failed: data.filter(t => t.status === 'failed').length,
      totalAmount: data.reduce((sum, t) => sum + (t.amount || 0), 0),
      completedAmount: data
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (t.amount || 0), 0)
    };

    return stats;
  } catch (error) {
    console.error('Error fetching payment transaction stats:', error);
    throw error;
  }
};
