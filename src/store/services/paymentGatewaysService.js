import { supabase } from '../../supabaseClient';

/**
 * Obtiene todas las pasarelas de pago activas
 */
export const getActivePaymentGateways = async () => {
  try {
    const { data, error } = await supabase
      .from('payment_gateways')
      .select(`
        *,
        payment_gateway_configs (*)
      `)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    // Procesar configuraciones
    const processedGateways = data.map(gateway => {
      const configs = {};
      gateway.payment_gateway_configs.forEach(config => {
        configs[config.key_name] = config.key_value;
      });
      return {
        ...gateway,
        config: configs
      };
    });

    return processedGateways;
  } catch (error) {
    console.error('Error loading payment gateways:', error);
    return [];
  }
};

/**
 * Obtiene una pasarela específica por tipo
 */
export const getPaymentGatewayByType = async (type) => {
  try {
    const { data, error } = await supabase
      .from('payment_gateways')
      .select(`
        *,
        payment_gateway_configs (*)
      `)
      .eq('type', type)
      .eq('is_active', true)
      .single();

    if (error) throw error;

    if (data) {
      const configs = {};
      data.payment_gateway_configs.forEach(config => {
        configs[config.key_name] = config.key_value;
      });
      return {
        ...data,
        config: configs
      };
    }

    return null;
  } catch (error) {
    console.error('Error loading payment gateway:', error);
    return null;
  }
};

/**
 * Crea una transacción de pago
 */
export const createPaymentTransaction = async (transactionData) => {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .insert({
        order_id: transactionData.orderId,
        gateway_id: transactionData.gatewayId,
        amount: transactionData.amount,
        currency: transactionData.currency || 'USD',
        status: 'pending',
        gateway_transaction_id: transactionData.gatewayTransactionId,
        gateway_response: transactionData.gatewayResponse
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
    const updateData = { status };
    if (gatewayResponse) {
      updateData.gateway_response = gatewayResponse;
    }

    const { data, error } = await supabase
      .from('payment_transactions')
      .update(updateData)
      .eq('id', transactionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating payment transaction:', error);
    throw error;
  }
};

/**
 * Obtiene las transacciones de un pedido
 */
export const getPaymentTransactionsByOrder = async (orderId) => {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select(`
        *,
        payment_gateways (name, type)
      `)
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading payment transactions:', error);
    return [];
  }
};

/**
 * Valida si una pasarela está configurada correctamente
 */
export const validateGatewayConfig = (gateway) => {
  if (!gateway || !gateway.is_active) {
    return { valid: false, message: 'Pasarela no activa' };
  }

  const requiredConfigs = {
    stripe: ['publishable_key', 'secret_key'],
    paypal: ['client_id', 'client_secret', 'mode'],
    transfer: ['bank_name', 'account_number', 'account_holder'],
    mobile_payment: ['phone_number', 'provider', 'account_name'],
    zelle: ['email', 'account_name'],
    reservation: ['reservation_time', 'max_reservation_amount']
  };

  const required = requiredConfigs[gateway.type] || [];
  const missing = required.filter(key => !gateway.config[key]);

  if (missing.length > 0) {
    return { 
      valid: false, 
      message: `Configuración incompleta: ${missing.join(', ')}` 
    };
  }

  return { valid: true };
}; 