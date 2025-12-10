import { createPaymentTransaction as createSupabaseTransaction } from './paymentGatewaysService';
import seatLocatorService from './seatLocatorService';
import transactionRollbackService from '../../services/transactionRollbackService';
import determineSeatLockStatus from '../../services/ticketing/seatStatus';
import { createCasheaOrder } from '../../services/casheaService';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const generateUUID = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

const isUuid = (value) => typeof value === 'string' && UUID_REGEX.test(value);

const isPermissionOrRlsError = (error) => {
  if (!error) return false;

  const codesToCheck = new Set(
    [error.code, error.status, error?.originalError?.code, error?.originalError?.status]
      .filter(Boolean)
      .map((code) => String(code).toLowerCase())
  );

  if (codesToCheck.has('42501') || codesToCheck.has('permission_denied') || codesToCheck.has('403')) {
    return true;
  }

  const message = [
    error.message,
    error.details,
    error.hint,
    error?.originalError?.message,
    error?.originalError?.details,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    message.includes('row-level security') ||
    message.includes('permission denied') ||
    message.includes('rls') ||
    message.includes('not authorized') ||
    message.includes('401')
  );
};

const canUseApiTransactionFallback = () => typeof window !== 'undefined' && typeof fetch === 'function';

const createTransactionViaApi = async (payload) => {
  if (!canUseApiTransactionFallback()) {
    throw new Error('API fallback is not available in this environment');
  }

  const response = await fetch('/api/payments/create-transaction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  let result = null;
  try {
    result = await response.json();
  } catch (parseError) {
    console.error('❌ [PAYMENT_PROCESSOR] Error parsing API fallback response:', parseError);
  }

  if (!response.ok || !result?.success || !result?.data) {
    const errorMessage =
      result?.error ||
      result?.message ||
      response.statusText ||
      'API fallback failed creating transaction';
    const fallbackError = new Error(errorMessage);
    fallbackError.response = response;
    fallbackError.result = result;
    throw fallbackError;
  }

  return result.data;
};

const tryParseUserValue = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

const resolveExplicitUserId = (paymentData = {}, fallbackId = null) => {
  const candidates = [
    paymentData?.user?.id,
    paymentData?.user?.user_id,
    paymentData?.user?.userId,
    paymentData?.userId,
    paymentData?.user_id,
    fallbackId,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && isUuid(candidate.trim())) {
      return candidate.trim();
    }
  }

  if (typeof paymentData?.user === 'string') {
    const parsed = tryParseUserValue(paymentData.user);
    if (parsed) {
      return resolveExplicitUserId({ user: parsed }, fallbackId);
    }
  }

  return null;
};

const normalizeUserPayload = (user, fallbackId = null) => {
  const resolvedId = resolveExplicitUserId({ user }, fallbackId);

  if (!user && !resolvedId) {
    return null;
  }

  if (user && typeof user === 'object') {
    return {
      ...user,
      id: typeof user.id === 'string' ? user.id : resolvedId || user.id || null,
      user_id:
        typeof user.user_id === 'string'
          ? user.user_id
          : resolvedId || user.user_id || null,
      userId:
        typeof user.userId === 'string'
          ? user.userId
          : resolvedId || user.userId || null,
    };
  }

  if (typeof user === 'string') {
    const parsed = tryParseUserValue(user);
    if (parsed) {
      return normalizeUserPayload(parsed, resolvedId);
    }
  }

  if (resolvedId) {
    return {
      id: resolvedId,
      user_id: resolvedId,
      userId: resolvedId,
      raw: user ?? null,
    };
  }

  return user ?? null;
};

const resolveSessionId = (explicitSessionId = null) => {
  if (explicitSessionId) return explicitSessionId;
  if (typeof window === 'undefined') return null;
  try {
    return (
      window.localStorage?.getItem('anonSessionId') ||
      window.sessionStorage?.getItem('anonSessionId') ||
      null
    );
  } catch (err) {
    return null;
  }
};

const ensureGatewayId = (method, providedGatewayId) => {
  if (isUuid(providedGatewayId)) return providedGatewayId;
  if (isUuid(method?.id)) return method.id;
  return generateUUID();
};

const buildTransactionPayload = (method, paymentData, options = {}) => {
  const paymentMethodName = method.method_name || method.name || method.method_id || 'manual';

  const resolvedUserId = resolveExplicitUserId(paymentData, options.userId);

  const payload = {
    orderId: paymentData.orderId,
    gatewayId: ensureGatewayId(method, options.gatewayId || paymentData.gatewayId),
    amount: paymentData.amount,
    currency: paymentData.currency || 'USD',
    locator: paymentData.locator,
    tenantId: paymentData.tenant?.id,
    userId: resolvedUserId,
    eventoId: paymentData.evento?.id,
    funcionId: paymentData.funcion?.id,
    paymentMethod: paymentMethodName,
    gatewayName: method.name || method.method_name || method.method_id || 'Manual',
    seats: paymentData.items || [],
    user: normalizeUserPayload(paymentData.user, resolvedUserId),
  };

  if (options.gatewayResponse) {
    payload.gatewayResponse = options.gatewayResponse;
  }

  if (options.transactionStatus) {
    payload.status = options.transactionStatus;
  }

  if (options.payments) {
    payload.payments = options.payments;
  }

  return payload;
};

const finalizeSeatLocks = async (method, paymentData, transactionStatus, options = {}) => {
  if (!paymentData?.items || paymentData.items.length === 0) {
    return { updated: 0 };
  }

  const seatStatus = determineSeatLockStatus({
    methodId: method.method_id,
    transactionStatus,
    isReservation: options.isReservation || paymentData.isReservation,
    requiresManualConfirmation: options.requiresManualConfirmation,
    seatStatusHint: options.seatStatusHint,
    manualStatus: options.manualStatus,
  });

  try {
    return await seatLocatorService.finalizeSeatsAfterPayment({
      seats: paymentData.items,
      locator: paymentData.locator,
      userId: paymentData.user?.id || null,
      tenantId: paymentData.tenant?.id || null,
      funcionId: paymentData.funcion?.id || null,
      status: seatStatus,
      sessionId: resolveSessionId(options.sessionId || paymentData.sessionId),
    });
  } catch (error) {
    return { updated: 0 };
  }
};

const createTransactionAndSyncSeats = async (method, paymentData, options = {}) => {
  const payload = buildTransactionPayload(method, paymentData, options);

  // Crear contexto de rollback
  const rollbackContext = transactionRollbackService.createRollbackContext(
    paymentData,
    resolveSessionId(options.sessionId || paymentData.sessionId)
  );

  // Función de transacción principal
  const executeTransaction = async () => {
    let transaction = null;

    try {
      transaction = await createSupabaseTransaction(payload);
    } catch (primaryError) {
      if (isPermissionOrRlsError(primaryError)) {
        try {
          transaction = await createTransactionViaApi(payload);
        } catch (apiError) {
          console.error('❌ [PAYMENT_PROCESSOR] API fallback also failed:', apiError);
          const combinedError = new Error(apiError.message || 'API fallback failed');
          combinedError.originalError = primaryError;
          combinedError.fallbackError = apiError;
          throw combinedError;
        }
      } else {
        throw primaryError;
      }
    }

    await finalizeSeatLocks(method, paymentData, options.transactionStatus || transaction.status, options);
    return transaction;
  };

  // Función de rollback
  const executeRollback = async (transactionResult, context) => {
    // Liberar asientos si la transacción falló
    if (paymentData.items && Array.isArray(paymentData.items)) {
      await transactionRollbackService.rollbackSeatLocks(paymentData.items, context);
    }

    // Revertir transacción de pago si existe
    if (transactionResult?.id) {
      await transactionRollbackService.rollbackPaymentTransaction(transactionResult.id, context);
    }
  };

  // Ejecutar con rollback automático
  const result = await transactionRollbackService.executeWithRollback(
    executeTransaction,
    executeRollback,
    rollbackContext
  );

  if (!result.success) {
    console.error('❌ [PAYMENT_PROCESSOR] No se pudo crear la transacción en la base de datos:', {
      error: result.error,
      rollbackExecuted: result.rollbackExecuted,
      originalError: result.originalError,
      rollbackError: result.rollbackError,
    });

    // Lanzar un error para que el flujo de pago no continúe si no hubo inserción en DB
    throw new Error(
      'No se pudo registrar el pago en la base de datos. Por favor intenta nuevamente o contacta soporte.'
    );
  }

  return result.data;
};

class PaymentMethodProcessor {
  constructor(method) {
    this.method = method;
    this.config = method.config || {};
  }

  async processPayment() {
    throw new Error('Método processPayment debe ser implementado');
  }

  async validatePayment(paymentData) {
    const errors = [];
    if (!paymentData?.amount || paymentData.amount <= 0) {
      errors.push('El monto debe ser mayor a 0');
    }
    if (!paymentData?.orderId) {
      errors.push('Se requiere un ID de orden');
    }
    return { valid: errors.length === 0, errors };
  }
}

class StripeMethodProcessor extends PaymentMethodProcessor {
  async processPayment(paymentData) {
    const gatewayResponse = {
      seats: paymentData.items || [],
      payment_method: this.method.method_name || this.method.name || 'stripe',
      timestamp: new Date().toISOString(),
    };

    const transaction = await createTransactionAndSyncSeats(this.method, paymentData, {
      gatewayResponse,
      transactionStatus: paymentData.isReservation ? 'reservado' : 'pending',
      isReservation: this.method.method_id === 'reserva' || paymentData.isReservation,
    });

    const mockStripeResponse = {
      id: `pi_${Math.random().toString(36).substr(2, 9)}`,
      status: 'requires_payment_method',
      client_secret: `pi_${Math.random().toString(36).substr(2, 9)}_secret_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
    };

    const isReservation = this.method.method_id === 'reserva' || paymentData.isReservation;

    return {
      success: true,
      transactionId: transaction.id,
      gatewayTransactionId: mockStripeResponse.id,
      status: isReservation ? 'reservado' : 'pending',
      message: isReservation ? 'Reserva creada correctamente' : 'Pago procesado correctamente',
      gatewayResponse: mockStripeResponse,
      isReservation,
      locator: paymentData.locator,
    };
  }
}

class PayPalMethodProcessor extends PaymentMethodProcessor {
  async processPayment(paymentData) {
    const transaction = await createTransactionAndSyncSeats(this.method, paymentData, {
      transactionStatus: 'pending',
      requiresManualConfirmation: true,
    });

    const mockPayPalResponse = {
      id: `PAY-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      state: 'created',
      links: [
        {
          href: `https://www.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          rel: 'approval_url',
          method: 'REDIRECT',
        },
      ],
    };

    return {
      success: true,
      transactionId: transaction.id,
      gatewayTransactionId: mockPayPalResponse.id,
      status: 'pending',
      message: 'Redirigiendo a PayPal...',
      gatewayResponse: mockPayPalResponse,
      locator: paymentData.locator,
      requiresRedirect: true,
      approvalUrl: mockPayPalResponse.links[0]?.href,
    };
  }
}

class CasheaMethodProcessor extends PaymentMethodProcessor {
  async processPayment(paymentData) {
    const tenantId = paymentData?.tenant?.id || this.method.tenant_id || this.method.tenantId;

    if (!tenantId) {
      throw new Error('No se pudo determinar el tenant para Cashea');
    }

    const invoiceId = paymentData.locator
      ? `INV-${paymentData.locator}`
      : `INV-${paymentData.orderId || Date.now()}`;

    const casheaOrder = await createCasheaOrder({
      tenantId,
      amount: paymentData.amount,
      currency: paymentData.currency || 'USD',
      description:
        paymentData?.evento?.id
          ? `Compra evento ${paymentData.evento.id}`
          : 'Orden Cashea - Tienda',
      customer: paymentData.user,
      items: paymentData.items,
      metadata: {
        locator: paymentData.locator,
        orderId: paymentData.orderId,
        invoiceId,
      },
      config: this.config,
    });

    const transaction = await createTransactionAndSyncSeats(this.method, paymentData, {
      transactionStatus: 'pending',
      requiresManualConfirmation: true,
      isReservation: true,
      seatStatusHint: 'reservado',
      manualStatus: 'reservado',
      gatewayResponse: casheaOrder,
      payments: [
        {
          method: 'cashea',
          amount: paymentData.amount,
          reference: casheaOrder.orderId || casheaOrder.invoiceId || null,
          metadata: casheaOrder,
          status: casheaOrder.status || 'pending',
        },
      ],
    });

    return {
      success: true,
      transactionId: transaction.id,
      gatewayTransactionId: casheaOrder.orderId || transaction.id,
      status: 'pending',
      message: 'Orden Cashea creada. Completa el pago en Cashea.',
      gatewayResponse: casheaOrder,
      requiresManualConfirmation: true,
      requiresRedirect: Boolean(casheaOrder.checkoutUrl),
      approvalUrl: casheaOrder.checkoutUrl || null,
      locator: paymentData.locator,
      metadata: casheaOrder,
    };
  }
}

class ApplePayMethodProcessor extends PaymentMethodProcessor {
  async processPayment(paymentData) {
    const transaction = await createTransactionAndSyncSeats(this.method, paymentData, {
      transactionStatus: 'completed',
    });

    return {
      success: true,
      transactionId: transaction.id,
      gatewayTransactionId: `apple_${Math.random().toString(36).substr(2, 9)}`,
      status: 'completed',
      message: 'Pago con Apple Pay completado',
      gatewayResponse: { status: 'success' },
      locator: paymentData.locator,
    };
  }
}

class GooglePayMethodProcessor extends PaymentMethodProcessor {
  async processPayment(paymentData) {
    const transaction = await createTransactionAndSyncSeats(this.method, paymentData, {
      transactionStatus: 'completed',
    });

    return {
      success: true,
      transactionId: transaction.id,
      gatewayTransactionId: `google_${Math.random().toString(36).substr(2, 9)}`,
      status: 'completed',
      message: 'Pago con Google Pay completado',
      gatewayResponse: { status: 'success' },
      locator: paymentData.locator,
    };
  }
}

class TransferenciaMethodProcessor extends PaymentMethodProcessor {
  async processPayment(paymentData) {
    const transaction = await createTransactionAndSyncSeats(this.method, paymentData, {
      transactionStatus: 'reservado',
      requiresManualConfirmation: true,
      seatStatusHint: 'reservado',
    });

    return {
      success: true,
      transactionId: transaction.id,
      gatewayTransactionId: `transfer_${Math.random().toString(36).substr(2, 9)}`,
      status: 'reservado',
      message: 'Transferencia bancaria iniciada. Se procesará en 1-3 días hábiles.',
      gatewayResponse: {
        status: 'pending',
        instructions: 'Complete la transferencia usando los datos bancarios proporcionados',
      },
      locator: paymentData.locator,
      requiresManualConfirmation: true,
    };
  }
}

class PagoMovilMethodProcessor extends PaymentMethodProcessor {
  async processPayment(paymentData) {
    const transaction = await createTransactionAndSyncSeats(this.method, paymentData, {
      transactionStatus: 'completed',
    });

    return {
      success: true,
      transactionId: transaction.id,
      gatewayTransactionId: `mobile_${Math.random().toString(36).substr(2, 9)}`,
      status: 'completed',
      message: 'Pago móvil procesado correctamente',
      gatewayResponse: { status: 'success' },
      locator: paymentData.locator,
    };
  }
}

class EfectivoTiendaMethodProcessor extends PaymentMethodProcessor {
  async processPayment(paymentData) {
    const transaction = await createTransactionAndSyncSeats(this.method, paymentData, {
      transactionStatus: 'reservado',
      requiresManualConfirmation: true,
      seatStatusHint: 'reservado',
    });

    return {
      success: true,
      transactionId: transaction.id,
      gatewayTransactionId: `cash_${Math.random().toString(36).substr(2, 9)}`,
      status: 'reservado',
      message: 'Pago en efectivo registrado. Complete el pago en la tienda física.',
      gatewayResponse: {
        status: 'pending',
        instructions: 'Visite nuestra tienda física para completar el pago en efectivo',
      },
      requiresManualConfirmation: true,
      locator: paymentData.locator,
    };
  }
}

class EfectivoMethodProcessor extends PaymentMethodProcessor {
  async processPayment(paymentData) {
    const transaction = await createTransactionAndSyncSeats(this.method, paymentData, {
      transactionStatus: 'completed',
      manualStatus: 'pagado',
      seatStatusHint: 'pagado',
    });

    return {
      success: true,
      transactionId: transaction.id,
      gatewayTransactionId: `cash_${Math.random().toString(36).substr(2, 9)}`,
      status: 'completed',
      message: 'Pago en efectivo completado',
      gatewayResponse: { status: 'success' },
      requiresManualConfirmation: false,
      locator: paymentData.locator,
    };
  }
}

const createPaymentMethodProcessor = (method) => {
  // Normalizar method_id para manejar variaciones (espacios, guiones, etc.)
  const normalizedMethodId = (method.method_id || '').toLowerCase()
    .replace(/\s+/g, '_')  // Reemplazar espacios con guiones bajos
    .replace(/-/g, '_')     // Reemplazar guiones con guiones bajos
    .trim();

  const processors = {
    stripe: StripeMethodProcessor,
    paypal: PayPalMethodProcessor,
    apple_pay: ApplePayMethodProcessor,
    google_pay: GooglePayMethodProcessor,
    transferencia: TransferenciaMethodProcessor,
    transferencia_bancaria: TransferenciaMethodProcessor,
    pago_movil: PagoMovilMethodProcessor,
    'pago_móvil': PagoMovilMethodProcessor,
    'pago_movil': PagoMovilMethodProcessor,
    'pago móvil': PagoMovilMethodProcessor,
    efectivo_tienda: EfectivoTiendaMethodProcessor,
    efectivo: EfectivoMethodProcessor,
    cashea: CasheaMethodProcessor,
  };

  const ProcessorClass = processors[normalizedMethodId] || processors[method.method_id];
  if (!ProcessorClass) {
    console.error('❌ [PAYMENT_PROCESSOR] Método no encontrado:', {
      original: method.method_id,
      normalized: normalizedMethodId,
      available: Object.keys(processors)
    });
    throw new Error(`Procesador no encontrado para el método: ${method.method_id} (normalizado: ${normalizedMethodId})`);
  }

  return new ProcessorClass(method);
};

export const processPaymentMethod = async (method, paymentData) => {
  try {
    const processor = createPaymentMethodProcessor(method);
    const validation = await processor.validatePayment(paymentData);

    if (!validation.valid) {
      throw new Error(`Validación fallida: ${validation.errors.join(', ')}`);
    }

    return await processor.processPayment(paymentData);
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};
