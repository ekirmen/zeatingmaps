import { supabase } from '../supabaseClient';

/**
 * Crea una transacción de pago
 */
export const createPaymentTransaction = async (transactionData) => {
  try {
    const resolvedEventoId = transactionData.eventoId || transactionData.eventId || transactionData.event || null;
    const resolvedFuncionId = transactionData.funcionId || transactionData.functionId || transactionData.funcion || null;

    const { data, error } = await supabase
      .from('payment_transactions')
      .insert({
        order_id: transactionData.orderId,
        gateway_id: transactionData.gatewayId,
        amount: transactionData.amount,
        currency: transactionData.currency || 'USD',
        status: 'pending',
        gateway_transaction_id: transactionData.gatewayTransactionId,
        gateway_response: transactionData.gatewayResponse || null,
        locator: transactionData.locator,
        tenant_id: transactionData.tenantId,
        user_id: transactionData.userId,
        evento_id: resolvedEventoId,
        funcion_id: resolvedFuncionId,
        payment_method: transactionData.paymentMethod || 'unknown',
        gateway_name: transactionData.gatewayName,
        seats: transactionData.seats || null,
        monto: transactionData.amount,
        processed_by: transactionData.processedBy,
        payment_gateway_id: transactionData.gatewayId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating payment transaction:', error);
    throw error;
  }
};

/**
 * Actualiza el estado de una transacción
 */
export const updatePaymentTransactionStatus = async (transactionId, status, gatewayResponse = null) => {
  try {
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
    return data;
  } catch (error) {
    console.error('Error updating payment transaction status:', error);
    throw error;
  }
};

/**
 * Oculta una transacción de pago
 */
export const hidePaymentTransaction = async (transactionId) => {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .update({
        is_hidden: true,
        hidden_at: new Date().toISOString()
      })
      .eq('id', transactionId)
      .select()
      .single();

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
export const unhidePaymentTransaction = async (transactionId) => {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .update({
        is_hidden: false,
        hidden_at: null
      })
      .eq('id', transactionId)
      .select()
      .single();

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
export const deletePaymentTransaction = async (transactionId) => {
  try {
    const { error } = await supabase
      .from('payment_transactions')
      .delete()
      .eq('id', transactionId);

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
export const getPaymentTransactionByLocator = async (locator) => {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select(`
        *,
        event:eventos(*),
        funcion:funciones(
          id,
          fecha_celebracion,
          evento_id,
          sala_id,
          plantilla
        )
      `)
      .eq('locator', locator)
      .single();

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
export const getPaymentTransactionsByUser = async (userId, tenantId = null) => {
  try {
    let query = supabase
      .from('payment_transactions')
      .select(`
        *,
        event:eventos(*),
        funcion:funciones(
          id,
          fecha_celebracion,
          evento_id,
          sala_id
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

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
export const getPaymentTransactionStats = async (tenantId = null, dateRange = null) => {
  try {
    let query = supabase
      .from('payment_transactions')
      .select('status, amount, created_at');

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
