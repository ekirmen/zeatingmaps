// =====================================================
// CORREGIR PROBLEMAS EN LA CREACIÓN DE PAGOS
// =====================================================

// 1. PROBLEMAS IDENTIFICADOS:
// - La columna "user" estaba recibiendo userId en lugar del objeto user completo
// - Falta validación de datos requeridos
// - Falta manejo de errores específicos
// - Falta logging detallado para debugging

// 2. FUNCIÓN CORREGIDA PARA createPaymentTransaction:

const createPaymentTransactionFixed = `
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

    // Extraer user_id del objeto user si viene como objeto
    let userId = transactionData.userId;
    if (transactionData.user && typeof transactionData.user === 'object' && transactionData.user.id) {
      userId = transactionData.user.id;
    }

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
      status: 'pending',
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
      "user": transactionData.user || null, // CORREGIDO: usar el objeto user completo
      usuario_id: userId,
      event: transactionData.eventoId
    };

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
`;

// 3. FUNCIÓN PARA VALIDAR DATOS DE PAGO:

const validatePaymentData = `
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
`;

// 4. FUNCIÓN PARA CREAR PAGO CON VALIDACIÓN:

const createPaymentWithValidation = `
export const createPaymentWithValidation = async (paymentData) => {
  // Validar datos
  const validation = validatePaymentData(paymentData);
  if (!validation.isValid) {
    throw new Error(\`Datos de pago inválidos: \${validation.errors.join(', ')}\`);
  }
  
  // Crear transacción
  return await createPaymentTransaction(paymentData);
};
`;

console.log('=== CORRECCIONES PARA CREACIÓN DE PAGOS ===');
console.log('');
console.log('1. FUNCIÓN CORREGIDA:');
console.log(createPaymentTransactionFixed);
console.log('');
console.log('2. FUNCIÓN DE VALIDACIÓN:');
console.log(validatePaymentData);
console.log('');
console.log('3. FUNCIÓN CON VALIDACIÓN:');
console.log(createPaymentWithValidation);
console.log('');
console.log('=== CAMBIOS APLICADOS ===');
console.log('✅ Corregido: columna "user" ahora recibe el objeto user completo');
console.log('✅ Agregado: validación de datos requeridos');
console.log('✅ Agregado: logging detallado para debugging');
console.log('✅ Agregado: manejo de errores específicos');
console.log('✅ Agregado: función de validación de datos');
console.log('');
console.log('=== PRÓXIMOS PASOS ===');
console.log('1. Aplica estos cambios al archivo paymentGatewaysService.js');
console.log('2. Prueba la creación de pagos');
console.log('3. Verifica que los datos se guarden correctamente');
