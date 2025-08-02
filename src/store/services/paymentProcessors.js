import { supabase } from '../../supabaseClient';
import { createPaymentTransaction, updatePaymentTransactionStatus } from './paymentGatewaysService';

/**
 * Procesador base para todas las pasarelas
 */
class PaymentProcessor {
  constructor(gateway) {
    this.gateway = gateway;
    this.config = gateway.config;
  }

  async processPayment(paymentData) {
    throw new Error('Método processPayment debe ser implementado');
  }

  async validatePayment(paymentData) {
    throw new Error('Método validatePayment debe ser implementado');
  }
}

/**
 * Procesador para Stripe
 */
class StripeProcessor extends PaymentProcessor {
  async processPayment(paymentData) {
    try {
      // Crear transacción en nuestra base de datos
      const transaction = await createPaymentTransaction({
        orderId: paymentData.orderId,
        gatewayId: this.gateway.id,
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD'
      });

      // Aquí iría la integración real con Stripe
      // const stripe = require('stripe')(this.config.secret_key);
      // const paymentIntent = await stripe.paymentIntents.create({
      //   amount: paymentData.amount * 100, // Stripe usa centavos
      //   currency: paymentData.currency || 'usd',
      //   payment_method_types: ['card'],
      //   metadata: { orderId: paymentData.orderId }
      // });

      // Simulación de respuesta de Stripe
      const mockStripeResponse = {
        id: `pi_${Math.random().toString(36).substr(2, 9)}`,
        status: 'requires_payment_method',
        client_secret: `pi_${Math.random().toString(36).substr(2, 9)}_secret_${Math.random().toString(36).substr(2, 9)}`
      };

      // Actualizar transacción con respuesta de Stripe
      await updatePaymentTransactionStatus(
        transaction.id,
        'pending',
        mockStripeResponse
      );

      return {
        success: true,
        transactionId: transaction.id,
        gatewayTransactionId: mockStripeResponse.id,
        clientSecret: mockStripeResponse.client_secret,
        requiresAction: true
      };
    } catch (error) {
      console.error('Error processing Stripe payment:', error);
      throw error;
    }
  }

  async validatePayment(paymentData) {
    return {
      valid: true,
      errors: []
    };
  }
}

/**
 * Procesador para PayPal
 */
class PayPalProcessor extends PaymentProcessor {
  async processPayment(paymentData) {
    try {
      const transaction = await createPaymentTransaction({
        orderId: paymentData.orderId,
        gatewayId: this.gateway.id,
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD'
      });

      // Simulación de PayPal
      const mockPayPalResponse = {
        id: `PAY-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        status: 'CREATED',
        links: [
          {
            href: `https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=${Math.random().toString(36).substr(2, 9)}`,
            rel: 'approval_url',
            method: 'REDIRECT'
          }
        ]
      };

      await updatePaymentTransactionStatus(
        transaction.id,
        'pending',
        mockPayPalResponse
      );

      return {
        success: true,
        transactionId: transaction.id,
        gatewayTransactionId: mockPayPalResponse.id,
        approvalUrl: mockPayPalResponse.links[0].href,
        requiresRedirect: true
      };
    } catch (error) {
      console.error('Error processing PayPal payment:', error);
      throw error;
    }
  }
}

/**
 * Procesador para Transferencias Bancarias
 */
class TransferProcessor extends PaymentProcessor {
  async processPayment(paymentData) {
    try {
      const transaction = await createPaymentTransaction({
        orderId: paymentData.orderId,
        gatewayId: this.gateway.id,
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD'
      });

      // Generar información de transferencia
      const transferInfo = {
        bankName: this.config.bank_name,
        accountNumber: this.config.account_number,
        accountHolder: this.config.account_holder,
        routingNumber: this.config.routing_number,
        reference: `ORDER-${paymentData.orderId}`,
        amount: paymentData.amount
      };

      await updatePaymentTransactionStatus(
        transaction.id,
        'pending',
        transferInfo
      );

      return {
        success: true,
        transactionId: transaction.id,
        transferInfo,
        requiresManualConfirmation: true
      };
    } catch (error) {
      console.error('Error processing transfer payment:', error);
      throw error;
    }
  }
}

/**
 * Procesador para Pago Móvil
 */
class MobilePaymentProcessor extends PaymentProcessor {
  async processPayment(paymentData) {
    try {
      const transaction = await createPaymentTransaction({
        orderId: paymentData.orderId,
        gatewayId: this.gateway.id,
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD'
      });

      const mobileInfo = {
        phoneNumber: this.config.phone_number,
        provider: this.config.provider,
        accountName: this.config.account_name,
        reference: `ORDER-${paymentData.orderId}`,
        amount: paymentData.amount
      };

      await updatePaymentTransactionStatus(
        transaction.id,
        'pending',
        mobileInfo
      );

      return {
        success: true,
        transactionId: transaction.id,
        mobileInfo,
        requiresManualConfirmation: true
      };
    } catch (error) {
      console.error('Error processing mobile payment:', error);
      throw error;
    }
  }
}

/**
 * Procesador para Zelle
 */
class ZelleProcessor extends PaymentProcessor {
  async processPayment(paymentData) {
    try {
      const transaction = await createPaymentTransaction({
        orderId: paymentData.orderId,
        gatewayId: this.gateway.id,
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD'
      });

      const zelleInfo = {
        email: this.config.email,
        accountName: this.config.account_name,
        reference: `ORDER-${paymentData.orderId}`,
        amount: paymentData.amount
      };

      await updatePaymentTransactionStatus(
        transaction.id,
        'pending',
        zelleInfo
      );

      return {
        success: true,
        transactionId: transaction.id,
        zelleInfo,
        requiresManualConfirmation: true
      };
    } catch (error) {
      console.error('Error processing Zelle payment:', error);
      throw error;
    }
  }
}

/**
 * Procesador para Reservas
 */
class ReservationProcessor extends PaymentProcessor {
  async processPayment(paymentData) {
    try {
      const transaction = await createPaymentTransaction({
        orderId: paymentData.orderId,
        gatewayId: this.gateway.id,
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD'
      });

      const reservationInfo = {
        reservationTime: parseInt(this.config.reservation_time) || 30,
        maxAmount: parseFloat(this.config.max_reservation_amount) || 100,
        expiresAt: new Date(Date.now() + (parseInt(this.config.reservation_time) || 30) * 60 * 1000)
      };

      await updatePaymentTransactionStatus(
        transaction.id,
        'reserved',
        reservationInfo
      );

      return {
        success: true,
        transactionId: transaction.id,
        reservationInfo,
        expiresAt: reservationInfo.expiresAt
      };
    } catch (error) {
      console.error('Error processing reservation:', error);
      throw error;
    }
  }
}

/**
 * Factory para crear procesadores según el tipo de pasarela
 */
export const createPaymentProcessor = (gateway) => {
  const processors = {
    stripe: StripeProcessor,
    paypal: PayPalProcessor,
    transfer: TransferProcessor,
    mobile_payment: MobilePaymentProcessor,
    zelle: ZelleProcessor,
    reservation: ReservationProcessor
  };

  const ProcessorClass = processors[gateway.type];
  if (!ProcessorClass) {
    throw new Error(`Procesador no encontrado para el tipo: ${gateway.type}`);
  }

  return new ProcessorClass(gateway);
};

/**
 * Función principal para procesar pagos
 */
export const processPayment = async (gateway, paymentData) => {
  try {
    const processor = createPaymentProcessor(gateway);
    
    // Validar pago
    const validation = await processor.validatePayment(paymentData);
    if (!validation.valid) {
      throw new Error(`Validación fallida: ${validation.errors.join(', ')}`);
    }

    // Procesar pago
    const result = await processor.processPayment(paymentData);
    return result;
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
}; 