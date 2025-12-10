import { supabase } from '../../supabaseClient';
import { updatePaymentTransactionStatus } from './paymentGatewaysService';

/**
 * Manejador de webhooks para Stripe
 */
export const handleStripeWebhook = async (event) => {
  try {
    const { type, data } = event;

    switch (type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(data.object);
        break;
      case 'payment_intent.canceled':
        await handlePaymentCanceled(data.object);
        break;
      default:
    }

    return { success: true };
  } catch (error) {
    console.error('Error handling Stripe webhook:', error);
    throw error;
  }
};

/**
 * Manejador de webhooks para PayPal
 */
export const handlePayPalWebhook = async (event) => {
  try {
    const { event_type, resource } = event;

    switch (event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentSuccess(resource);
        break;
      case 'PAYMENT.CAPTURE.DENIED':
        await handlePaymentFailure(resource);
        break;
      case 'PAYMENT.CAPTURE.CANCELED':
        await handlePaymentCanceled(resource);
        break;
      default:
    }

    return { success: true };
  } catch (error) {
    console.error('Error handling PayPal webhook:', error);
    throw error;
  }
};

/**
 * Manejador de webhooks para MercadoPago
 */
export const handleMercadoPagoWebhook = async (event) => {
  try {
    const { type, data } = event;

    switch (type) {
      case 'payment':
        const payment = data;
        if (payment.status === 'approved') {
          await handlePaymentSuccess(payment);
        } else if (payment.status === 'rejected') {
          await handlePaymentFailure(payment);
        } else if (payment.status === 'cancelled') {
          await handlePaymentCanceled(payment);
        }
        break;
      default:
    }

    return { success: true };
  } catch (error) {
    console.error('Error handling MercadoPago webhook:', error);
    throw error;
  }
};

/**
 * Manejar pago exitoso
 */
const handlePaymentSuccess = async (paymentData) => {
  try {
    // Buscar transacción por ID de la pasarela
    const { data: transactions, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('gateway_transaction_id', paymentData.id)
      .limit(1);

    if (error) throw error;

    if (transactions && transactions.length > 0) {
      const transaction = transactions[0];

      // Obtener la transacción actualizada después de cambiar el status
      // updatePaymentTransactionStatus ahora maneja el envío de correos automáticamente
      const updatedTransaction = await updatePaymentTransactionStatus(
        transaction.id,
        'completed',
        paymentData
      );

      // Actualizar estado de los asientos
      await updateSeatsStatus(transaction.order_id || transaction.locator, 'pagado');

      // Enviar notificación al usuario
      await sendPaymentSuccessNotification(updatedTransaction || transaction);

      // Actualizar inventario si es necesario
      await updateInventory(transaction.order_id || transaction.locator);
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
};

/**
 * Manejar pago fallido
 */
const handlePaymentFailure = async (paymentData) => {
  try {
    const { data: transactions, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('gateway_transaction_id', paymentData.id)
      .limit(1);

    if (error) throw error;

    if (transactions && transactions.length > 0) {
      const transaction = transactions[0];

      await updatePaymentTransactionStatus(
        transaction.id,
        'failed',
        paymentData
      );

      // Liberar asientos
      await updateSeatsStatus(transaction.order_id, 'disponible');

      // Enviar notificación de fallo
      await sendPaymentFailureNotification(transaction);
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
};

/**
 * Manejar pago cancelado
 */
const handlePaymentCanceled = async (paymentData) => {
  try {
    const { data: transactions, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('gateway_transaction_id', paymentData.id)
      .limit(1);

    if (error) throw error;

    if (transactions && transactions.length > 0) {
      const transaction = transactions[0];

      await updatePaymentTransactionStatus(
        transaction.id,
        'cancelled',
        paymentData
      );

      // Liberar asientos
      await updateSeatsStatus(transaction.order_id, 'disponible');
    }
  } catch (error) {
    console.error('Error handling payment cancellation:', error);
    throw error;
  }
};

/**
 * Actualizar estado de los asientos
 */
const updateSeatsStatus = async (orderId, status) => {
  try {
    // Obtener detalles del pedido
    const { data: order, error: orderError } = await supabase
      .from('payment_transactions')
      .select('seats, funcion_id')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    // Actualizar cada asiento
    for (const seat of order.seats) {
      await supabase
        .from('seats')
        .update({ status })
        .eq('_id', seat.id)
        .eq('funcion_id', order.funcion);
    }
  } catch (error) {
    console.error('Error updating seats status:', error);
    throw error;
  }
};

/**
 * Enviar notificación de pago exitoso
 */
const sendPaymentSuccessNotification = async (transaction) => {
  try {
    // Aquí implementarías el envío de email/SMS
    // Ejemplo de envío de email
    // await sendEmail({
    //   to: user.email,
    //   subject: 'Pago Confirmado',
    //   template: 'payment-success',
    //   data: { transaction }
    // });
  } catch (error) {
    console.error('Error sending payment success notification:', error);
  }
};

/**
 * Enviar notificación de pago fallido
 */
const sendPaymentFailureNotification = async (transaction) => {
  try {
    // await sendEmail({
    //   to: user.email,
    //   subject: 'Pago Fallido',
    //   template: 'payment-failure',
    //   data: { transaction }
    // });
  } catch (error) {
    console.error('Error sending payment failure notification:', error);
  }
};

/**
 * Actualizar inventario
 */
const updateInventory = async (orderId) => {
  try {
    // Implementar lógica de actualización de inventario
  } catch (error) {
    console.error('Error updating inventory:', error);
  }
};

/**
 * Verificar firma de webhook (seguridad)
 */
export const verifyWebhookSignature = (payload, signature, secret) => {
  try {
    // Implementar verificación de firma según la pasarela
    // Ejemplo para Stripe:
    // const stripe = require('stripe');
    // const event = stripe.webhooks.constructEvent(payload, signature, secret);
    // return event;

    return true; // Placeholder
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
};
