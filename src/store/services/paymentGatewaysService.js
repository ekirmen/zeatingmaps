import { getSupabaseClient } from '../../config/supabase';
import determineSeatLockStatus from '../../services/ticketing/seatStatus';

const supabase = getSupabaseClient();

const UUID_CANONICAL_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const PAYMENT_TABLE_PREFERENCE = ['payment_methods', 'payment_gateways'];
const paymentTableCache = new Map();

const feeCache = new Map();
const FEE_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

const stripInvisibleCharacters = (value) =>
  typeof value === 'string' ? value.replace(/[\u200B-\u200D\uFEFF]/g, '') : value;

const resolvePaymentTable = async (client = supabase) => {

    return paymentTableCache.get(client);
  }

  for (const tableName of PAYMENT_TABLE_PREFERENCE) {
    try {
      const { error } = await client.from(tableName).select('id').limit(1);

      // Si no hay error o es "no rows", asumimos que la tabla existe
      if (!error || error?.code === 'PGRST116') {
        paymentTableCache.set(client, tableName);
        return tableName;
      }
    } catch (err) {
    }
  }

  const fallbackTable = PAYMENT_TABLE_PREFERENCE[0];
  paymentTableCache.set(client, fallbackTable);
  return fallbackTable;
};

const parseJsonSafe = (rawValue) => {
  if (typeof rawValue !== 'string') return rawValue;
  try {
    return JSON.parse(rawValue);
  } catch (error) {
    return rawValue;
  }
};

const normalizeFeeStructure = (feeStructure) => {
  if (!feeStructure) {
    return { percentage: 0, fixed: 0 };
  }

  const parsedStructure = typeof feeStructure === 'string' ? parseJsonSafe(feeStructure) : feeStructure;
  const percentage = parseFloat(parsedStructure?.percentage ?? parsedStructure?.porcentaje ?? 0) || 0;
  const fixed = parseFloat(parsedStructure?.fixed ?? parsedStructure?.tasa_fija ?? 0) || 0;

  return { percentage, fixed };
};

const normalizeGatewayConfig = (rawConfig) => {
  const parsedConfig = parseJsonSafe(rawConfig) || {};
  const configFeeStructure = parsedConfig?.fee_structure || parsedConfig?.fees;

  return {
    ...parsedConfig,
    fee_structure: normalizeFeeStructure(configFeeStructure),
  };
};

const normalizeGatewayRecord = (gateway) => {
  if (!gateway) return null;

  const config = normalizeGatewayConfig(gateway.config);
  const feeStructure = normalizeFeeStructure(gateway.fee_structure || config?.fee_structure);
  const supportedCurrencies = gateway.supported_currencies || config.supported_currencies || ['USD'];

  return {
    ...gateway,
    config,
    fee_structure: feeStructure,
    supported_currencies: supportedCurrencies.map((c) => (typeof c === 'string' ? c.toUpperCase() : c)).filter(Boolean),
  };
};

const getCachedFeeProfile = (gatewayId) => {
  const cached = feeCache.get(gatewayId);
  if (cached && Date.now() - cached.timestamp < FEE_CACHE_TTL) {
    return cached.profile;
  }

  if (cached) {
    feeCache.delete(gatewayId);
  }

  return null;
};

const setCachedFeeProfile = (gatewayId, profile) => {
  feeCache.set(gatewayId, { profile, timestamp: Date.now() });
};

export 
    return;
  }
  feeCache.clear();
};

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
  return null;
};

/**
 * Obtiene todas las pasarelas de pago activas
 */
export 
    const { data, error } = await supabase
      .from(paymentTable)
      .select('*')
      .eq('enabled', true)
      .order('is_recommended', { ascending: false })
      .order('name');

    if (error) throw error;
    return (data || []).map(normalizeGatewayRecord);
  } catch (error) {
    console.error('Error fetching active payment gateways:', error);
    throw error;
  }
};

/**
 * Obtiene todas las pasarelas de pago (activas e inactivas)
 */
export 
    const { data, error } = await supabase
      .from(paymentTable)
      .select('*')
      .order('is_recommended', { ascending: false })
      .order('name');

    if (error) throw error;
    return (data || []).map(normalizeGatewayRecord);
  } catch (error) {
    console.error('Error fetching all payment gateways:', error);
    throw error;
  }
};

/**
 * Obtiene la configuración de una pasarela específica
 */
export 
    const { data, error } = await supabase
      .from(paymentTable)
      .select('id, config, fee_structure, supported_currencies')
      .eq('id', gatewayId)
      .single();

    if (error) throw error;

    return normalizeGatewayRecord(data)?.config || {};
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
    const paymentTable = await resolvePaymentTable();
    const { data, error } = await supabase
      .from(paymentTable)
      .select('id, fee_structure, config, supported_currencies, name, method_id, type')
      .eq('id', gatewayId)
      .single();

    if (error) throw error;

    const normalizedGateway = normalizeGatewayRecord(data);
    const normalizedFees = normalizedGateway?.fee_structure || { percentage: 0, fixed: 0 };

    return {
      tasa_fija: normalizedFees.fixed,
      porcentaje: normalizedFees.percentage,
      supported_currencies: normalizedGateway?.supported_currencies || ['USD'],
      gateway: normalizedGateway,
    };
  } catch (error) {
    console.error('Error fetching gateway fees:', error);
    return { tasa_fija: 0, porcentaje: 0, supported_currencies: ['USD'] };
  }
};

const getGatewayFeeProfile = async (gatewayId, { forceRefresh = false } = {}) => {
  if (!gatewayId) {
    return {
      tasa_fija: 0,
      porcentaje: 0,
      supported_currencies: ['USD'],
      gateway: null,
    };
  }

  if (!forceRefresh) {
    const cached = getCachedFeeProfile(gatewayId);
    if (cached) {
      return cached;
    }
  }

  const feeProfile = await getGatewayFees(gatewayId);
  setCachedFeeProfile(gatewayId, feeProfile);
  return feeProfile;
};

/**
 * Calcula el precio con comisiones de una pasarela
 */
export 

  if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
    throw new Error('basePrice debe ser un número válido y no negativo');
  }

  const normalizedCurrency = typeof currency === 'string' ? currency.toUpperCase() : 'USD';

  try {
    const feeProfile = await getGatewayFeeProfile(gatewayId, { forceRefresh });
    const supportedCurrencies = (feeProfile.supported_currencies || ['USD']).map((c) =>
      typeof c === 'string' ? c.toUpperCase() : c
    );

    let resolvedCurrency = normalizedCurrency;
    if (supportedCurrencies.length > 0 && !supportedCurrencies.includes(normalizedCurrency)) {
      if (allowCurrencyFallback) {
        resolvedCurrency = supportedCurrencies[0];
      } else {
        throw new Error(
          `La pasarela no soporta la moneda ${normalizedCurrency}. Monedas permitidas: ${supportedCurrencies.join(', ')}`
        );
      }
    }

    const comision = feeProfile.tasa_fija + (normalizedPrice * feeProfile.porcentaje) / 100;
    const totalPrice = normalizedPrice + comision;

    return {
      precioBase: normalizedPrice,
      comision,
      precioTotal: totalPrice,
      tasa_fija: feeProfile.tasa_fija,
      porcentaje: feeProfile.porcentaje,
      currency: resolvedCurrency,
      gateway: feeProfile.gateway,
    };
  } catch (error) {
    console.error('Error calculating price with fees:', error);
    return {
      precioBase: normalizedPrice,
      comision: 0,
      precioTotal: normalizedPrice,
      tasa_fija: 0,
      porcentaje: 0,
      currency: normalizedCurrency,
      gateway: null,
    };
  }
};

/**
 * Obtiene las tasas de todas las pasarelas activas
 */
export 
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
export 

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
export 
    const { data, error } = await supabase
      .from(paymentTable)
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
export 
    const { data, error } = await supabase
      .from(paymentTable)
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
export 
    const { error } = await supabase
      .from(paymentTable)
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
export 
    const { data, error } = await supabase
      .from(paymentTable)
      .select('*')
      .eq('type', type)
      .eq('enabled', true)
      .single();

    if (error) throw error;

    return normalizeGatewayRecord(data);
  } catch (error) {
    console.error('Error loading payment gateway:', error);
    return null;
  }
};

/**
 * Valida los datos de pago antes de crear la transacción
 */
export 

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
export 
  if (!validation.isValid) {
    throw new Error(`Datos de pago inválidos: ${validation.errors.join(', ')}`);
  }

  // Crear transacción
  return await createPaymentTransaction(paymentData);
};

/**
 * Crea una transacción de pago
 */
export const createPaymentTransaction = async (transactionData, options = {}) => {
  const client = options?.client || supabase;

  if (!client) {
    throw new Error('Supabase client not initialized for createPaymentTransaction');
  }

  try {
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

    const paymentTable = await resolvePaymentTable(client);

    // Get gateway name if gateway_id is provided
    let gatewayName = transactionData.gatewayName || 'unknown';
    if (gatewayId && !transactionData.gatewayName) {
      try {
        const { data: gateway } = await client
          .from(paymentTable)
          .select('name, method_id')
          .eq('id', gatewayId)
          .single();
        if (gateway) {
          gatewayName = gateway.name || gateway.method_id || gatewayName;
        }
      } catch (gatewayError) {
      }
    }

    const safeParseUserJson = (rawValue) => {
      if (typeof rawValue !== 'string') return null;
      try {
        return JSON.parse(rawValue);
      } catch (parseError) {
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

    const ensureUserExists = async (id) => {
      if (!id) return { exists: false, verified: false };

      try {
        const { data, error } = await client
          .from('profiles')
          .select('id')
          .eq('id', id)
          .single();

        if (error?.code === 'PGRST116') {
          // No rows returned
          return { exists: false, verified: true };
        }

        if (error) {
          
          // Si falló por permisos u otra razón inesperada, asumimos que la BD podrá validar el FK
          return { exists: true, verified: false };
        }

        return { exists: Boolean(data?.id), verified: true };
      } catch (verificationError) {
        return { exists: true, verified: false };
      }
    };

    const { exists: userExists, verified: userVerified } = await ensureUserExists(userId);
    if (userVerified && !userExists) {
      if (userId) {
      }
      userId = null;
      if (normalizedUser && typeof normalizedUser === 'object') {
        delete normalizedUser.id;
        delete normalizedUser.user_id;
        delete normalizedUser.userId;
        normalizedUser.providedId = sanitizedUserId;
      }
    }
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
        const { data: funcionData, error: funcionError } = await client
          .from('funciones')
          .select('evento_id')
          .eq('id', funcionId)
          .single();

        if (!funcionError && funcionData) {
          eventoId = sanitizeUuid(funcionData.evento_id, {
            fieldName: 'evento_id',
            required: false,
          });
        } else {
          if (funcionError) {
          }
        }
      } catch (error) {
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
      metadata: transactionData.metadata || null,
      processed_by: transactionData.processedBy || null,
      payment_gateway_id: paymentGatewayId,
      payments: computedPayments,
    };
    const { data, error } = await client
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
    return {
      ...data,
      user: normalizedUser,
    };
  } catch (error) {
    console.error('[PaymentTransaction] Error creando transacción:', error);
    throw error;
  }
};

const normalizeStatus = (status) => (typeof status === 'string' ? status.trim().toLowerCase() : '');

const mapSeatLockStatusFromTransaction = ({ transactionStatus, paymentMethod, seatStatusHint = null }) => {
  if (seatStatusHint) {
    return seatStatusHint;
  }

  const normalizedStatus = normalizeStatus(transactionStatus);

  if (
    [
      'cancelado',
      'cancelled',
      'canceled',
      'failed',
      'declined',
      'rejected',
      'expired',
      'refunded',
      'chargeback',
      'void',
      'voided',
      'error',
    ].includes(normalizedStatus)
  ) {
    return 'disponible';
  }

  return determineSeatLockStatus({
    methodId: paymentMethod,
    transactionStatus,
    seatStatusHint,
  });
};

const reconcileSeatLocksFromTransaction = async (transaction, { seatStatusHint = null } = {}) => {
  if (!transaction?.locator) {
    return { updated: 0, reason: 'no_locator' };
  }

  try {
    const { data: seatLocks, error } = await supabase
      .from('seat_locks')
      .select('id, seat_id, funcion_id, status')
      .eq('locator', transaction.locator);

    if (error) {
      throw error;
    }

    if (!seatLocks || seatLocks.length === 0) {
      return { updated: 0, reason: 'no_seat_locks' };
    }

    const targetStatus = mapSeatLockStatusFromTransaction({
      transactionStatus: transaction.status,
      paymentMethod: transaction.payment_method || transaction.gateway_name,
      seatStatusHint,
    });

    const locksToUpdate = seatLocks.filter((lock) => normalizeStatus(lock.status) !== normalizeStatus(targetStatus));
    if (locksToUpdate.length === 0) {
      return { updated: 0, targetStatus, reason: 'already_synced' };
    }

    const { data: updatedLocks, error: updateError } = await supabase
      .from('seat_locks')
      .update({ status: targetStatus, updated_at: new Date().toISOString() })
      .in('id', locksToUpdate.map((lock) => lock.id))
      .select('id, seat_id, funcion_id, status');

    if (updateError) {
      throw updateError;
    }

    return { updated: updatedLocks?.length || 0, targetStatus, locks: updatedLocks };
  } catch (error) {
    console.error('[PaymentTransaction] Error reconciliando seat locks:', error);
    return { updated: 0, error };
  }
};

/**
 * Actualiza el estado de una transacción
 */
export const updatePaymentTransactionStatus = async (
  transactionId,
  status,
  gatewayResponse = null,
  { seatStatusHint = null, skipSeatReconciliation = false } = {}
) => {
  try {
    // Obtener la transacción actual para verificar si el status cambió
    const { data: currentTransaction, error: fetchError } = await supabase
      .from('payment_transactions')
      .select('id, status, locator, user_id, payment_method, gateway_name')
      .eq('id', transactionId)
      .single();

    if (fetchError) {
    }

    const updateData = { status, updated_at: new Date().toISOString() };
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

    if (statusChangedToCompleted && data.locator && data.user_id) {
      try {
        // Importar dinámicamente para evitar problemas de ciclo
        const { sendPaymentEmailByStatus } = await import('../services/paymentEmailService');

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

    const seatReconciliation = skipSeatReconciliation
      ? null
      : await reconcileSeatLocksFromTransaction({ ...currentTransaction, ...data, status }, { seatStatusHint });

    return { ...data, seatLocks: seatReconciliation };
  } catch (error) {
    console.error('Error updating payment transaction:', error);
    throw error;
  }
};

export 
  }

  let transaction = null;

  if (transactionId) {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (error) throw error;
    transaction = data;
  } else {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('locator', locator)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    transaction = data?.[0] || null;
  }

  if (!transaction) {
    throw new Error('No se encontró una transacción para procesar la notificación');
  }

  return await updatePaymentTransactionStatus(transaction.id, status, gatewayResponse, { seatStatusHint });
};

/**
 * Obtiene las transacciones de un pedido
 */
export 

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading payment transactions:', error);
    return [];
  }
};
