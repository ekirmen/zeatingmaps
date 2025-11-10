import { getSupabaseClient } from '../../config/supabase';

const supabase = getSupabaseClient();

const UUID_CANONICAL_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const stripInvisibleCharacters = (value) =>
  typeof value === 'string' ? value.replace(/[\u200B-\u200D\uFEFF]/g, '') : value;

const sanitizeUuid = (rawValue, { fieldName, required = false } = {}) => {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    if (required) {
      throw new Error(`${fieldName} es requerido y debe ser un UUID válido`);
    }
    return null;
  }

  let candidate = rawValue;

  if (typeof candidate !== 'string') {
    candidate = String(candidate);
  }

  candidate = stripInvisibleCharacters(candidate).trim().toLowerCase();

  const directMatch = candidate.match(UUID_CANONICAL_REGEX);
  if (directMatch) {
    return directMatch[0];
  }

  if (required) {
    throw new Error(`${fieldName} debe ser un UUID válido. Valor recibido: ${rawValue}`);
  }

  console.warn(`[PaymentTransaction] ${fieldName} inválido, omitiendo valor:`, rawValue);
  return null;
};

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

    let gatewayId = sanitizeUuid(transactionData.gatewayId, {
      fieldName: 'gateway_id',
      required: false,
    });

    // Get gateway name if gateway_id is provided
    let gatewayName = transactionData.gatewayName || 'unknown';
    if (gatewayId && !transactionData.gatewayName) {
      try {
        const { data: gateway } = await supabase
          .from('payment_methods')
          .select('name')
          .eq('id', gatewayId)
          .single();
        if (gateway) {
          gatewayName = gateway.name;
        }
      } catch (gatewayError) {
        console.warn('Could not fetch gateway name:', gatewayError);
      }
    }

    const safeParseUserJson = (rawValue) => {
      if (typeof rawValue !== 'string') return null;
      try {
        return JSON.parse(rawValue);
      } catch (parseError) {
        console.warn('[PaymentTransaction] No se pudo parsear JSON de usuario:', parseError);
        return null;
      }
    };

    const extractUuidFromValue = (value) => {
      if (!value) return null;

      if (typeof value === 'string') {
        const trimmed = stripInvisibleCharacters(value).trim();
        const directMatch = trimmed.match(UUID_CANONICAL_REGEX);
        if (directMatch) {
          return directMatch[0];
        }

        const parsed = safeParseUserJson(trimmed);
        if (parsed && typeof parsed === 'object') {
          return extractUuidFromValue(parsed);
        }

        return null;
      }

      if (typeof value === 'object') {
        if (Array.isArray(value)) {
          for (const item of value) {
            const extracted = extractUuidFromValue(item);
            if (extracted) {
              return extracted;
            }
          }
          return null;
        }

        for (const key of ['id', 'user_id', 'userId', 'uuid']) {
          if (typeof value[key] === 'string') {
            const match = stripInvisibleCharacters(value[key]).trim().match(UUID_CANONICAL_REGEX);
            if (match) {
              return match[0];
            }
          }
        }

        if (value.user) {
          const nestedUser = extractUuidFromValue(value.user);
          if (nestedUser) {
            return nestedUser;
          }
        }

        for (const key of Object.keys(value)) {
          if (['id', 'user_id', 'userId', 'uuid', 'user'].includes(key)) {
            continue;
          }
          const extracted = extractUuidFromValue(value[key]);
          if (extracted) {
            return extracted;
          }
        }
      }

      return null;
    };

    const buildNormalizedUser = (value, fallbackId = null) => {
      if (!value && !fallbackId) {
        return null;
      }

      if (typeof value === 'string') {
        const parsed = safeParseUserJson(stripInvisibleCharacters(value).trim());
        if (parsed && typeof parsed === 'object') {
          return buildNormalizedUser(parsed, fallbackId);
        }

        const extractedId = extractUuidFromValue(value) || fallbackId;
        if (extractedId) {
          return {
            id: extractedId,
            user_id: extractedId,
            userId: extractedId,
            raw: value,
          };
        }

        return fallbackId
          ? {
              id: fallbackId,
              user_id: fallbackId,
              userId: fallbackId,
              raw: value,
            }
          : { raw: value };
      }

      if (value && typeof value === 'object') {
        const normalized = { ...value };
        const resolvedId =
          extractUuidFromValue(value) ||
          extractUuidFromValue(value?.user) ||
          fallbackId;

        if (resolvedId) {
          normalized.id = normalized.id || resolvedId;
          normalized.user_id = normalized.user_id || resolvedId;
          normalized.userId = normalized.userId || resolvedId;
        }

        return normalized;
      }

      if (fallbackId) {
        return {
          id: fallbackId,
          user_id: fallbackId,
          userId: fallbackId,
        };
      }

      return null;
    };

    const finalUserIdCandidate =
      extractUuidFromValue(transactionData.userId) ||
      extractUuidFromValue(transactionData.user) ||
      extractUuidFromValue(transactionData.metadata?.user);

    const finalUserId = finalUserIdCandidate ? stripInvisibleCharacters(finalUserIdCandidate).trim() : null;
    const sanitizedUserId = finalUserId ? sanitizeUuid(finalUserId, { fieldName: 'user_id' }) : null;

    let userId = sanitizedUserId;
    let normalizedUser = buildNormalizedUser(transactionData.user, userId);
    if (!normalizedUser && userId) {
      normalizedUser = {
        id: userId,
        user_id: userId,
        userId,
      };
    }

    const canonicalizeUserObject = (value, fallbackUserId = null) => {
      if (!value) {
        return null;
      }

      const cloned = { ...value };

      ['id', 'user_id', 'userId'].forEach((key) => {
        if (cloned[key]) {
          const sanitized = sanitizeUuid(cloned[key], { fieldName: `user.${key}` });
          if (sanitized) {
            cloned[key] = sanitized;
          } else {
            delete cloned[key];
          }
        }
      });

      if (fallbackUserId) {
        cloned.id = cloned.id || fallbackUserId;
        cloned.user_id = cloned.user_id || fallbackUserId;
        cloned.userId = cloned.userId || fallbackUserId;
      }

      return cloned;
    };

    normalizedUser = canonicalizeUserObject(normalizedUser, userId);

    // Preparar datos para inserción (normalizado)
    const tenantId = sanitizeUuid(transactionData.tenantId, {
      fieldName: 'tenant_id',
      required: true,
    });

    const paymentGatewayId = sanitizeUuid(
      transactionData.paymentGatewayId || gatewayId,
      {
        fieldName: 'payment_gateway_id',
        required: false,
      }
    );

    const orderId = typeof transactionData.orderId === 'string'
      ? stripInvisibleCharacters(transactionData.orderId).trim()
      : transactionData.orderId;

    const amount = Number(transactionData.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('amount debe ser un número válido mayor a 0');
    }

    const funcionId =
      transactionData.funcionId !== undefined && transactionData.funcionId !== null
        ? Number(transactionData.funcionId)
        : null;

    // Obtener evento_id: primero del transactionData, si no está, obtenerlo desde la función
    let eventoId = sanitizeUuid(transactionData.eventoId || transactionData.eventId || transactionData.evento?.id || transactionData.event?.id, {
      fieldName: 'evento_id',
      required: false,
    });

    // Si no hay evento_id pero sí hay funcion_id, obtenerlo desde la función
    if (!eventoId && funcionId) {
      try {
        console.log('[PaymentTransaction] Obteniendo evento_id desde función:', funcionId);
        const { data: funcionData, error: funcionError } = await supabase
          .from('funciones')
          .select('evento_id')
          .eq('id', funcionId)
          .single();

        if (!funcionError && funcionData) {
          eventoId = sanitizeUuid(funcionData.evento_id, {
            fieldName: 'evento_id',
            required: false,
          });
          console.log('[PaymentTransaction] Evento_id obtenido desde función:', eventoId);
        } else {
          console.warn('[PaymentTransaction] No se pudo obtener evento_id desde función:', funcionError);
          if (funcionError) {
            console.warn('[PaymentTransaction] Detalles del error:', {
              message: funcionError.message,
              code: funcionError.code,
              details: funcionError.details,
              hint: funcionError.hint
            });
          }
        }
      } catch (error) {
        console.warn('[PaymentTransaction] Error al obtener evento_id desde función:', error);
      }
    }

    if (funcionId !== null && Number.isNaN(funcionId)) {
      throw new Error('funcionId debe ser un valor numérico');
    }

    const locator = typeof transactionData.locator === 'string'
      ? stripInvisibleCharacters(transactionData.locator).trim()
      : transactionData.locator || null;

    // Normalizar seats a un arreglo de objetos con { id, name, price, zona, mesa }
    const rawSeats = transactionData.seats || transactionData.items || [];
    const normalizedSeats = Array.isArray(rawSeats)
      ? rawSeats
          .map((s) => {
            const seatIdRaw =
              s.seat_id ||
              s.id ||
              s._id ||
              s.sillaId ||
              s.seatId ||
              s.seat ||
              s.tableSeatId ||
              s.table_seat_id;

            const seatId = typeof seatIdRaw === 'number' ? seatIdRaw.toString() : seatIdRaw?.toString().trim();

            if (!seatId) {
              console.warn('[PaymentTransaction] Ignorando asiento sin identificador válido:', s);
              return null;
            }

            return {
              id: seatId,
              _id: s._id || seatId,
              seat_id: seatId,
              seatId: s.seatId || seatId,
              name: s.name || s.nombre || `Asiento ${seatId}`,
              price: Number(s.price ?? s.precio ?? 0),
              zona: s.zona || s.zonaId || s.nombreZona || null,
              mesa: s.mesa || s.mesaId || null,
            };
          })
          .filter(Boolean)
      : [];

    const computedPayments = transactionData.payments && Array.isArray(transactionData.payments)
      ? transactionData.payments.map((payment) => {
          const normalizedAmount = Number(payment.amount);
          const amountValue = Number.isFinite(normalizedAmount) ? normalizedAmount : 0;
          const referenceValue =
            typeof payment.reference === 'string'
              ? stripInvisibleCharacters(payment.reference).trim()
              : payment.reference || null;

          return {
            method: payment.method || transactionData.paymentMethod || transactionData.method || gatewayName || 'manual',
            amount: amountValue,
            metadata: payment.metadata || null,
            reference: referenceValue,
            status: payment.status || transactionData.status || 'completed',
          };
        })
      : [
          {
            method: transactionData.paymentMethod || transactionData.method || gatewayName || 'manual',
            amount,
            metadata: transactionData.metadata || null,
            reference: orderId || null,
            status: transactionData.status || 'completed',
          },
        ];

    const insertData = {
      order_id: orderId,
      gateway_id: gatewayId,
      amount,
      currency: transactionData.currency || 'USD',
      status: transactionData.status || 'completed',
      gateway_transaction_id: transactionData.gatewayTransactionId,
      gateway_response: transactionData.gatewayResponse || null,
      locator,
      tenant_id: tenantId,
      user_id: userId,
      evento_id: eventoId,
      funcion_id: funcionId,
      payment_method: transactionData.paymentMethod || transactionData.method || 'unknown',
      gateway_name: gatewayName,
      seats: normalizedSeats,
      user: userId, // Campo user debe ser UUID, no objeto
      metadata: transactionData.metadata || null,
      // Campos adicionales para compatibilidad/reportes
      fecha: new Date().toISOString(),
      event: eventoId || null,
      funcion: funcionId || null,
      processed_by: transactionData.processedBy || null,
      payment_gateway_id: paymentGatewayId,
      payments: computedPayments,
    };
    if (userId) {
      insertData.usuario_id = userId;
    }

    console.log('[PaymentTransaction] Datos a insertar:', insertData);

    const { data, error } = await supabase
      .from('payment_transactions')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[PaymentTransaction] Error en inserción:', error);
      // Mejorar el mensaje de error para debugging
      const errorMessage = error.message || error.details || JSON.stringify(error);
      const enhancedError = new Error(`Error al guardar la transacción de pago: ${errorMessage}`);
      enhancedError.originalError = error;
      enhancedError.code = error.code;
      enhancedError.details = error.details;
      throw enhancedError;
    }

    console.log('[PaymentTransaction] Transacción creada exitosamente:', data);

    return {
      ...data,
      user: normalizedUser,
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
    // Obtener la transacción actual para verificar si el status cambió
    const { data: currentTransaction, error: fetchError } = await supabase
      .from('payment_transactions')
      .select('id, status, locator, user_id, usuario_id')
      .eq('id', transactionId)
      .single();

    if (fetchError) {
      console.warn('⚠️ [UPDATE_STATUS] Error obteniendo transacción actual:', fetchError);
    }

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

    // Si el status cambió a 'completed' y antes no lo estaba, enviar correo de pago completo
    const previousStatus = currentTransaction?.status;
    const newStatus = status;
    const statusChangedToCompleted = (previousStatus !== 'completed' && previousStatus !== 'pagado') && 
                                     (newStatus === 'completed' || newStatus === 'pagado');
    
    if (statusChangedToCompleted && data.locator && (data.user_id || data.usuario_id)) {
      try {
        // Importar dinámicamente para evitar problemas de ciclo
        const { sendPaymentEmailByStatus } = await import('../services/paymentEmailService');
        
        const emailResult = await sendPaymentEmailByStatus({
          locator: data.locator,
          user_id: data.user_id || data.usuario_id,
          status: 'completed',
          transactionId: data.id,
          amount: data.amount || data.monto,
        });
        
        if (emailResult.success) {
          console.log('✅ [UPDATE_STATUS] Correo de pago completo enviado exitosamente');
        } else {
          console.warn('⚠️ [UPDATE_STATUS] Error enviando correo de pago completo:', emailResult.error);
        }
      } catch (emailError) {
        console.error('❌ [UPDATE_STATUS] Error enviando correo de pago completo:', emailError);
        // No bloquear la actualización si falla el envío de correo
      }
    }

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