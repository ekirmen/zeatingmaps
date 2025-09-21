import { getSupabaseClient } from '../../config/supabase';

const supabase = getSupabaseClient();

/**
 * Obtiene todas las pasarelas de pago activas
 */
export const getActivePaymentGateways = async () => {
  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('enabled', true)
      .order('is_recommended', { ascending: false })
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching active payment gateways:', error);
    throw error;
  }
};

/**
 * Obtiene todas las pasarelas de pago (activas e inactivas)
 */
export const getAllPaymentGateways = async () => {
  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .order('is_recommended', { ascending: false })
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all payment gateways:', error);
    throw error;
  }
};

/**
 * Obtiene la configuración de una pasarela específica
 */
export const getGatewayConfig = async (gatewayId) => {
  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('config')
      .eq('id', gatewayId)
      .single();

    if (error) throw error;
    
    return data?.config || {};
  } catch (error) {
    console.error('Error fetching gateway config:', error);
    throw error;
  }
};

/**
 * Obtiene las tasas de una pasarela específica
 */
export const getGatewayFees = async (gatewayId) => {
  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('fee_structure')
      .eq('id', gatewayId)
      .single();

    if (error) throw error;
    
    const feeStructure = data?.fee_structure || { percentage: 0, fixed: 0 };
    return {
      tasa_fija: parseFloat(feeStructure.fixed) || 0,
      porcentaje: parseFloat(feeStructure.percentage) || 0
    };
  } catch (error) {
    console.error('Error fetching gateway fees:', error);
    return { tasa_fija: 0, porcentaje: 0 };
  }
};

/**
 * Calcula el precio con comisiones de una pasarela
 */
export const calculatePriceWithFees = (basePrice, gatewayId) => {
  return new Promise(async (resolve) => {
    try {
      const fees = await getGatewayFees(gatewayId);
      const comision = fees.tasa_fija + (basePrice * fees.porcentaje / 100);
      const totalPrice = basePrice + comision;
      
      resolve({
        precioBase: basePrice,
        comision: comision,
        precioTotal: totalPrice,
        tasa_fija: fees.tasa_fija,
        porcentaje: fees.porcentaje
      });
    } catch (error) {
      console.error('Error calculating price with fees:', error);
      resolve({
        precioBase: basePrice,
        comision: 0,
        precioTotal: basePrice,
        tasa_fija: 0,
        porcentaje: 0
      });
    }
  });
};

/**
 * Obtiene las tasas de todas las pasarelas activas
 */
export const getAllActiveGatewayFees = async () => {
  try {
    const gateways = await getActivePaymentGateways();
    const feesPromises = gateways.map(async (gateway) => {
      const fees = await getGatewayFees(gateway.id);
      return {
        ...gateway,
        fees
      };
    });
    
    return await Promise.all(feesPromises);
  } catch (error) {
    console.error('Error fetching all gateway fees:', error);
    return [];
  }
};

/**
 * Valida la configuración de una pasarela
 */
export const validateGatewayConfig = (gateway) => {
  const validations = {
    stripe: ['publishable_key', 'secret_key'],
    paypal: ['client_id', 'client_secret', 'mode'],
    transfer: ['bank_name', 'account_number', 'account_holder'],
    mobile_payment: ['phone_number', 'provider', 'account_name'],
    zelle: ['email', 'account_name'],
    reservation: ['reservation_time', 'max_reservation_amount']
  };

  const requiredFields = validations[gateway.type] || [];
  const missingFields = [];

  // Verificar campos requeridos
  for (const field of requiredFields) {
    if (!gateway.config || !gateway.config[field]) {
      missingFields.push(field);
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
    message: missingFields.length > 0 
      ? `Campos faltantes: ${missingFields.join(', ')}`
      : 'Configuración válida'
  };
};

/**
 * Crea una nueva pasarela de pago
 */
export const createPaymentGateway = async (gatewayData) => {
  try {
    const { data, error } = await supabase
      .from('payment_gateways')
      .insert([gatewayData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating payment gateway:', error);
    throw error;
  }
};

/**
 * Actualiza una pasarela de pago existente
 */
export const updatePaymentGateway = async (gatewayId, updates) => {
  try {
    const { data, error } = await supabase
      .from('payment_gateways')
      .update(updates)
      .eq('id', gatewayId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating payment gateway:', error);
    throw error;
  }
};

/**
 * Elimina una pasarela de pago
 */
export const deletePaymentGateway = async (gatewayId) => {
  try {
    const { error } = await supabase
      .from('payment_gateways')
      .delete()
      .eq('id', gatewayId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting payment gateway:', error);
    throw error;
  }
};

/**
 * Obtiene una pasarela específica por tipo
 */
export const getPaymentGatewayByType = async (type) => {
  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('type', type)
      .eq('enabled', true)
      .single();

    if (error) throw error;

    if (data) {
      return {
        ...data,
        config: data.config || {}
      };
    }

    return null;
  } catch (error) {
    console.error('Error loading payment gateway:', error);
    return null;
  }
};

/**
 * Valida los datos de pago antes de crear la transacción
 */
export const validatePaymentData = (paymentData) => {
  const errors = [];
  
  if (!paymentData.orderId) {
    errors.push('orderId es requerido');
  }
  
  if (!paymentData.amount || paymentData.amount <= 0) {
    errors.push('amount debe ser mayor a 0');
  }
  
  if (!paymentData.tenantId) {
    errors.push('tenantId es requerido');
  }
  
  if (!paymentData.locator) {
    errors.push('locator es requerido');
  }
  
  // Validar que seats sea un array válido si se proporciona
  if (paymentData.seats && !Array.isArray(paymentData.seats)) {
    errors.push('seats debe ser un array');
  }
  
  // Validar que user sea un objeto válido si se proporciona
  if (paymentData.user && typeof paymentData.user !== 'object') {
    errors.push('user debe ser un objeto');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Crea una transacción de pago con validación
 */
export const createPaymentWithValidation = async (paymentData) => {
  // Validar datos
  const validation = validatePaymentData(paymentData);
  if (!validation.isValid) {
    throw new Error(`Datos de pago inválidos: ${validation.errors.join(', ')}`);
  }
  
  // Crear transacción
  return await createPaymentTransaction(paymentData);
};

/**
 * Crea una transacción de pago
 */
export const createPaymentTransaction = async (transactionData) => {
  try {
    console.log('[PaymentTransaction] Iniciando creación:', {
      orderId: transactionData.orderId,
      amount: transactionData.amount,
      userId: transactionData.userId,
      user: transactionData.user,
      eventoId: transactionData.eventoId,
      funcionId: transactionData.funcionId
    });

    // Validar datos requeridos
    if (!transactionData.orderId) {
      throw new Error('orderId es requerido');
    }
    if (!transactionData.amount || transactionData.amount <= 0) {
      throw new Error('amount debe ser mayor a 0');
    }
    if (!transactionData.tenantId) {
      throw new Error('tenantId es requerido');
    }

    // Get gateway name if gateway_id is provided
    let gatewayName = transactionData.gatewayName || 'unknown';
    if (transactionData.gatewayId && !transactionData.gatewayName) {
      try {
        const { data: gateway } = await supabase
          .from('payment_methods')
          .select('name')
          .eq('id', transactionData.gatewayId)
          .single();
        if (gateway) {
          gatewayName = gateway.name;
        }
      } catch (gatewayError) {
        console.warn('Could not fetch gateway name:', gatewayError);
      }
    }

    const extractUserId = (value) => {
      if (!value) return null;

      if (typeof value === 'string') {
        const trimmed = value.trim();

        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          try {
            const parsed = JSON.parse(trimmed);
            return extractUserId(parsed);
          } catch (parseError) {
            console.warn('[PaymentTransaction] No se pudo parsear userId JSON:', parseError);
            return null;
          }
        }

        return trimmed;
      }

      if (typeof value === 'object') {
        if (typeof value.id === 'string') return value.id;
        if (typeof value.user_id === 'string') return value.user_id;
        if (typeof value.userId === 'string') return value.userId;
        if (value.user) return extractUserId(value.user);
      }

      console.warn('[PaymentTransaction] Formato de userId no reconocido:', value);
      return null;
    };

    // Extraer user_id del objeto user o de diferentes estructuras
    let userId = extractUserId(transactionData.userId) || extractUserId(transactionData.user);

    // Asegurar que userId sea un UUID válido o null
    if (userId && typeof userId !== 'string') {
      console.warn('Invalid userId type:', typeof userId, userId);
      userId = null;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (userId && !uuidRegex.test(userId)) {
      console.warn('Invalid userId format, expected UUID. Received:', userId);
      userId = null;
    }

    // Preparar datos para inserción
    const insertData = {
      order_id: transactionData.orderId,
      gateway_id: transactionData.gatewayId,
      amount: transactionData.amount,
      currency: transactionData.currency || 'USD',
      status: transactionData.status || 'pending',
      gateway_transaction_id: transactionData.gatewayTransactionId,
      gateway_response: transactionData.gatewayResponse || null,
      locator: transactionData.locator,
      tenant_id: transactionData.tenantId,
      user_id: userId,
      evento_id: transactionData.eventoId,
      funcion_id: transactionData.funcionId,
      payment_method: transactionData.paymentMethod || transactionData.method || 'unknown',
      gateway_name: gatewayName,
      seats: transactionData.seats || transactionData.items || null,
      "user": transactionData.user || null, // Corregido: usar el objeto user completo
      usuario_id: userId,
      event: transactionData.eventoId
    };

    if (transactionData.payments) {
      insertData.payments = transactionData.payments;
    }

    console.log('[PaymentTransaction] Datos a insertar:', insertData);

    const { data, error } = await supabase
      .from('payment_transactions')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[PaymentTransaction] Error en inserción:', error);
      throw error;
    }

    console.log('[PaymentTransaction] Transacción creada exitosamente:', data);

    return {
      ...data,
      user: transactionData.user || null
    };
  } catch (error) {
    console.error('[PaymentTransaction] Error creando transacción:', error);
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
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading payment transactions:', error);
    return [];
  }
}; 