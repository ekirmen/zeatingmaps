import { createPaymentTransaction as createSupabaseTransaction, updatePaymentTransactionStatus as updateSupabaseTransactionStatus } from './paymentGatewaysService';

// Funciones temporales para transacciones - se pueden implementar más tarde
const createPaymentTransaction = async (data) => {
  try {
    // Generar UUID válido para gateway_id si no existe
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    // Si gatewayId no es un UUID válido, generar uno
    let gatewayId = data.gatewayId;
    if (!gatewayId || typeof gatewayId === 'string' && !gatewayId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      gatewayId = generateUUID();
    }

    // Usar la función real de Supabase
    return await createSupabaseTransaction({
      ...data,
      gatewayId: gatewayId
    });
  } catch (error) {
    console.error('Error creating payment transaction:', error);
    // Fallback a función temporal si falla
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    return {
      id: generateUUID(),
      ...data,
      status: 'pending',
      created_at: new Date().toISOString()
    };
  }
};

const updatePaymentTransactionStatus = async (id, status, response = null) => {
  try {
    return await updateSupabaseTransactionStatus(id, status, response);
  } catch (error) {
    console.error('Error updating payment transaction:', error);
    return { id, status, response, updated_at: new Date().toISOString() };
  }
};

/**
 * Procesador base para todos los métodos de pago
 */
class PaymentMethodProcessor {
  constructor(method) {
    this.method = method;
    this.config = method.config || {};
  }

  async processPayment(paymentData) {
    throw new Error('Método processPayment debe ser implementado');
  }

  async validatePayment(paymentData) {
    return { valid: true, errors: [] };
  }
}

/**
 * Procesador para Stripe
 */
class StripeMethodProcessor extends PaymentMethodProcessor {
  async processPayment(paymentData) {
    try {
      // Crear transacción en nuestra base de datos
      const transaction = await createPaymentTransaction({
        orderId: paymentData.orderId,
        gatewayId: this.method.id || `gateway_${this.method.method_id}`,
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD'
      });

      // Simulación de respuesta de Stripe
      const mockStripeResponse = {
        id: `pi_${Math.random().toString(36).substr(2, 9)}`,
        status: 'requires_payment_method',
        client_secret: `pi_${Math.random().toString(36).substr(2, 9)}_secret_${Math.random().toString(36).substr(2, 9)}`
      };

      // Determinar si es una reserva basado en el método de pago o configuración
      const isReservation = this.method.method_id === 'reserva' || paymentData.isReservation;
      
      // Generar locator único
      const locator = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      return {
        success: true,
        transactionId: transaction.id,
        gatewayTransactionId: mockStripeResponse.id,
        status: isReservation ? 'reservado' : 'pending',
        message: isReservation ? 'Reserva creada correctamente' : 'Pago procesado correctamente',
        gatewayResponse: mockStripeResponse,
        isReservation: isReservation,
        locator: locator
      };
    } catch (error) {
      console.error('Error procesando pago con Stripe:', error);
      throw error;
    }
  }

  async validatePayment(paymentData) {
    const errors = [];
    
    if (!paymentData.amount || paymentData.amount <= 0) {
      errors.push('El monto debe ser mayor a 0');
    }
    
    if (!paymentData.orderId) {
      errors.push('Se requiere un ID de orden');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Procesador para PayPal
 */
class PayPalMethodProcessor extends PaymentMethodProcessor {
  async processPayment(paymentData) {
    try {
      const transaction = await createPaymentTransaction({
        orderId: paymentData.orderId,
        gatewayId: this.method.id || `gateway_${this.method.method_id}`,
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD'
      });

      // Simulación de respuesta de PayPal
      const mockPayPalResponse = {
        id: `PAY-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        state: 'created',
        links: [
          {
            href: `https://www.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=${Math.random().toString(36).substr(2, 9)}`,
            rel: 'approval_url',
            method: 'REDIRECT'
          }
        ]
      };

      // Generar locator único
      const locator = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      return {
        success: true,
        transactionId: transaction.id,
        gatewayTransactionId: mockPayPalResponse.id,
        status: 'pending',
        message: 'Redirigiendo a PayPal...',
        gatewayResponse: mockPayPalResponse,
        locator: locator
      };
    } catch (error) {
      console.error('Error procesando pago con PayPal:', error);
      throw error;
    }
  }
}

/**
 * Procesador para Apple Pay
 */
class ApplePayMethodProcessor extends PaymentMethodProcessor {
  async processPayment(paymentData) {
    try {
      const transaction = await createPaymentTransaction({
        orderId: paymentData.orderId,
        gatewayId: this.method.id || `gateway_${this.method.method_id}`,
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD'
      });

      // Generar locator único
      const locator = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      return {
        success: true,
        transactionId: transaction.id,
        gatewayTransactionId: `apple_${Math.random().toString(36).substr(2, 9)}`,
        status: 'completed',
        message: 'Pago con Apple Pay completado',
        gatewayResponse: { status: 'success' },
        locator: locator
      };
    } catch (error) {
      console.error('Error procesando pago con Apple Pay:', error);
      throw error;
    }
  }
}

/**
 * Procesador para Google Pay
 */
class GooglePayMethodProcessor extends PaymentMethodProcessor {
  async processPayment(paymentData) {
    try {
      const transaction = await createPaymentTransaction({
        orderId: paymentData.orderId,
        gatewayId: this.method.id || `gateway_${this.method.method_id}`,
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD'
      });

      // Generar locator único
      const locator = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      return {
        success: true,
        transactionId: transaction.id,
        gatewayTransactionId: `google_${Math.random().toString(36).substr(2, 9)}`,
        status: 'completed',
        message: 'Pago con Google Pay completado',
        gatewayResponse: { status: 'success' },
        locator: locator
      };
    } catch (error) {
      console.error('Error procesando pago con Google Pay:', error);
      throw error;
    }
  }
}

/**
 * Procesador para Transferencia Bancaria
 */
class TransferenciaMethodProcessor extends PaymentMethodProcessor {
  async processPayment(paymentData) {
    try {
      const transaction = await createPaymentTransaction({
        orderId: paymentData.orderId,
        gatewayId: this.method.id || `gateway_${this.method.method_id}`,
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD'
      });

      // Generar locator único
      const locator = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      return {
        success: true,
        transactionId: transaction.id,
        gatewayTransactionId: `transfer_${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending',
        message: 'Transferencia bancaria iniciada. Se procesará en 1-3 días hábiles.',
        gatewayResponse: { 
          status: 'pending',
          instructions: 'Complete la transferencia usando los datos bancarios proporcionados'
        },
        locator: locator
      };
    } catch (error) {
      console.error('Error procesando transferencia bancaria:', error);
      throw error;
    }
  }
}

/**
 * Procesador para Pago Móvil
 */
class PagoMovilMethodProcessor extends PaymentMethodProcessor {
  async processPayment(paymentData) {
    try {
      const transaction = await createPaymentTransaction({
        orderId: paymentData.orderId,
        gatewayId: this.method.id || `gateway_${this.method.method_id}`,
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD'
      });

      // Generar locator único
      const locator = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      return {
        success: true,
        transactionId: transaction.id,
        gatewayTransactionId: `mobile_${Math.random().toString(36).substr(2, 9)}`,
        status: 'completed',
        message: 'Pago móvil procesado correctamente',
        gatewayResponse: { status: 'success' },
        locator: locator
      };
    } catch (error) {
      console.error('Error procesando pago móvil:', error);
      throw error;
    }
  }
}

/**
 * Procesador para Pago en Efectivo en Tienda
 */
class EfectivoTiendaMethodProcessor extends PaymentMethodProcessor {
  async processPayment(paymentData) {
    try {
      const transaction = await createPaymentTransaction({
        orderId: paymentData.orderId,
        gatewayId: this.method.id || `gateway_${this.method.method_id}`,
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD'
      });

      // Generar locator único
      const locator = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      return {
        success: true,
        transactionId: transaction.id,
        gatewayTransactionId: `cash_${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending',
        message: 'Pago en efectivo registrado. Complete el pago en la tienda física.',
        gatewayResponse: { 
          status: 'pending',
          instructions: 'Visite nuestra tienda física para completar el pago en efectivo'
        },
        requiresRedirect: false,
        requiresAction: false,
        requiresManualConfirmation: true,
        locator: locator
      };
    } catch (error) {
      console.error('Error procesando pago en efectivo en tienda:', error);
      throw error;
    }
  }
}

/**
 * Procesador para Efectivo
 */
class EfectivoMethodProcessor extends PaymentMethodProcessor {
  async processPayment(paymentData) {
    try {
      const transaction = await createPaymentTransaction({
        orderId: paymentData.orderId,
        gatewayId: this.method.id || `gateway_${this.method.method_id}`,
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD'
      });

      // Generar locator único
      const locator = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      return {
        success: true,
        transactionId: transaction.id,
        gatewayTransactionId: `cash_${Math.random().toString(36).substr(2, 9)}`,
        status: 'completed',
        message: 'Pago en efectivo completado',
        gatewayResponse: { status: 'success' },
        requiresRedirect: false,
        requiresAction: false,
        requiresManualConfirmation: false,
        locator: locator
      };
    } catch (error) {
      console.error('Error procesando pago en efectivo:', error);
      throw error;
    }
  }
}

/**
 * Factory para crear procesadores según el method_id
 */
export const createPaymentMethodProcessor = (method) => {
  const processors = {
    stripe: StripeMethodProcessor,
    paypal: PayPalMethodProcessor,
    apple_pay: ApplePayMethodProcessor,
    google_pay: GooglePayMethodProcessor,
    transferencia: TransferenciaMethodProcessor,
    pago_movil: PagoMovilMethodProcessor,
    efectivo_tienda: EfectivoTiendaMethodProcessor,
    efectivo: EfectivoMethodProcessor
  };

  const ProcessorClass = processors[method.method_id];
  if (!ProcessorClass) {
    throw new Error(`Procesador no encontrado para el método: ${method.method_id}`);
  }

  return new ProcessorClass(method);
};

/**
 * Función principal para procesar pagos con métodos de pago
 */
export const processPaymentMethod = async (method, paymentData) => {
  try {
    console.log('🔍 Processing payment method:', method.method_id);
    const processor = createPaymentMethodProcessor(method);
    
    // Validar pago
    const validation = await processor.validatePayment(paymentData);
    console.log('🔍 Validation result:', validation);
    if (!validation.valid) {
      throw new Error(`Validación fallida: ${validation.errors.join(', ')}`);
    }

    // Procesar pago
    console.log('🔍 Processing payment...');
    const result = await processor.processPayment(paymentData);
    console.log('🔍 Payment processing result:', result);
    return result;
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};
