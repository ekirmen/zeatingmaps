import { createPaymentTransaction as createSupabaseTransaction } from './paymentGatewaysService';
import seatLocatorService from './seatLocatorService';
import transactionRollbackService from '../../services/transactionRollbackService';
import determineSeatLockStatus from '../../services/ticketing/seatStatus';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const generateUUID = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

const isUuid = (value) => typeof value === 'string' && UUID_REGEX.test(value);

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
    console.warn('Could not resolve seat session id:', err);
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

  const payload = {
    orderId: paymentData.orderId,
    gatewayId: ensureGatewayId(method, options.gatewayId || paymentData.gatewayId),
    amount: paymentData.amount,
    currency: paymentData.currency || 'USD',
    locator: paymentData.locator,
    tenantId: paymentData.tenant?.id,
    userId: paymentData.user?.id,
    eventoId: paymentData.evento?.id,
    funcionId: paymentData.funcion?.id,
    paymentMethod: paymentMethodName,
    gatewayName: method.name || method.method_name || method.method_id || 'Manual',
    seats: paymentData.items || [],
    user: paymentData.user || null,
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
    console.warn('Could not finalize seat locks:', error);
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
    const transaction = await createSupabaseTransaction(payload);
    await finalizeSeatLocks(method, paymentData, options.transactionStatus || transaction.status, options);
    return transaction;
  };

  // Función de rollback
  const executeRollback = async (transactionResult, context) => {
    console.log('🔄 [PAYMENT_PROCESSOR] Ejecutando rollback de transacción');
    
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
    // Si el rollback también falló, crear transacción de fallback
    console.warn('⚠️ [PAYMENT_PROCESSOR] Usando transacción de fallback');
    const { user: _rawUser, ...payloadWithoutUser } = payload;
    const fallbackTransaction = {
      id: generateUUID(),
      ...payloadWithoutUser,
      user: payload.userId ?? null,
      user_id: payload.userId ?? null,
      status: options.transactionStatus || 'pending',
      created_at: new Date().toISOString(),
    };
    
    try {
      await finalizeSeatLocks(method, paymentData, fallbackTransaction.status, options);
    } catch (fallbackError) {
      console.error('❌ [PAYMENT_PROCESSOR] Error en fallback:', fallbackError);
    }
    
    return fallbackTransaction;
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

class CasheaMethodProcessor extends PaymentMethodProcessor {
  buildCasheaPayload(paymentData, casheaSettings) {
    const seats = Array.isArray(paymentData.items) ? paymentData.items : [];
    const user = paymentData.user || {};
    const eventInfo = paymentData.evento || {};

    const products = seats.map((seat, index) => {
      const baseId = seat.sillaId || seat._id || seat.id || `seat-${index}`;
      const unitPrice = Number(seat.precio || seat.price || paymentData.amount || 0);

      return {
        id: String(seat.productId || baseId),
        name: seat.nombre || seat.nombreAsiento || `Asiento ${index + 1}`,
        sku: String(seat.sku || baseId),
        description: seat.nombreEvento || eventInfo.nombre || 'Entrada de evento',
        imageUrl: seat.imagen || casheaSettings.logoUrl || '',
        quantity: Number(seat.quantity || 1) || 1,
        price: unitPrice,
        tax: Number(seat.tax || 0),
        discount: Number(seat.discount || 0)
      };
    });

    const storeId = casheaSettings.storeId || eventInfo.id || 'event-store';
    const storeName = casheaSettings.storeName || eventInfo.nombre || 'Evento';

    const identificationNumber =
      user.identificationNumber ||
      user.cedula ||
      user.rif ||
      user.dni ||
      user.taxId ||
      user.document ||
      '00000000';

    return {
      identificationNumber: String(identificationNumber),
      externalClientId: user.id || paymentData.orderId,
      deliveryMethod: casheaSettings.deliveryMethod || 'IN_STORE',
      merchantName: casheaSettings.merchantName || storeName,
      redirectUrl: casheaSettings.redirectUrl,
      deliveryPrice: Number(casheaSettings.deliveryPrice || 0),
      invoiceId: paymentData.orderId,
      orders: [
        {
          store: {
            id: Number.isFinite(Number(storeId)) ? Number(storeId) : storeId,
            name: storeName,
            enabled: true
          },
          products
        }
      ]
    };
  }

  async processPayment(paymentData) {
    const casheaSettings = paymentData.evento?.cashea || {};

    if (!casheaSettings.enabled) {
      return {
        success: false,
        error: 'Cashea no está habilitado para este evento'
      };
    }

    if (!this.config?.public_api_key) {
      return {
        success: false,
        error: 'Cashea no está configurado correctamente (clave pública faltante)'
      };
    }

    if (!casheaSettings.redirectUrl) {
      return {
        success: false,
        error: 'Falta configurar la URL de redirección de Cashea'
      };
    }

    const transaction = await createTransactionAndSyncSeats(this.method, paymentData, {
      transactionStatus: 'pending',
      requiresManualConfirmation: true,
      seatStatusHint: 'reservado'
    });

    const payload = this.buildCasheaPayload(paymentData, casheaSettings);

    return {
      success: true,
      transactionId: transaction.id,
      status: 'pending',
      message: 'Redirigiendo a Cashea...',
      gatewayResponse: { status: 'pending' },
      locator: paymentData.locator,
      requiresCasheaRedirect: true,
      casheaPayload: payload,
      casheaPublicApiKey: this.config.public_api_key,
      casheaSdkUrl: this.config?.sdk_url || null
    };
  }
}

const createPaymentMethodProcessor = (method) => {
  const processors = {
    stripe: StripeMethodProcessor,
    paypal: PayPalMethodProcessor,
    apple_pay: ApplePayMethodProcessor,
    google_pay: GooglePayMethodProcessor,
    transferencia: TransferenciaMethodProcessor,
    pago_movil: PagoMovilMethodProcessor,
    efectivo_tienda: EfectivoTiendaMethodProcessor,
    efectivo: EfectivoMethodProcessor,
    cashea: CasheaMethodProcessor,
  };

  const ProcessorClass = processors[method.method_id];
  if (!ProcessorClass) {
    throw new Error(`Procesador no encontrado para el método: ${method.method_id}`);
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
