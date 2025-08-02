import { supabase } from '../../supabaseClient';

/**
 * Suscribirse a cambios de transacciones en tiempo real
 */
export const subscribeToPaymentUpdates = (callback) => {
  const subscription = supabase
    .channel('payment_transactions')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'payment_transactions'
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return subscription;
};

/**
 * Enviar notificación push al usuario
 */
export const sendPushNotification = async (userId, notification) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'payment',
        title: notification.title,
        message: notification.message,
        data: notification.data,
        read: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
};

/**
 * Enviar email de confirmación de pago
 */
export const sendPaymentConfirmationEmail = async (transaction) => {
  try {
    // Aquí implementarías el envío de email
    console.log('Payment confirmation email sent:', transaction.id);
    
    // Ejemplo con un servicio de email
    // await emailService.send({
    //   to: user.email,
    //   template: 'payment-confirmation',
    //   data: {
    //     transaction,
    //     user,
    //     event: transaction.event
    //   }
    // });
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
  }
};

/**
 * Enviar SMS de confirmación
 */
export const sendPaymentConfirmationSMS = async (phoneNumber, transaction) => {
  try {
    // Implementar envío de SMS
    console.log('Payment confirmation SMS sent to:', phoneNumber);
    
    // Ejemplo con Twilio
    // await twilio.messages.create({
    //   body: `Tu pago de $${transaction.amount} ha sido confirmado. ID: ${transaction.id}`,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phoneNumber
    // });
  } catch (error) {
    console.error('Error sending payment confirmation SMS:', error);
  }
};

/**
 * Crear notificación de pago exitoso
 */
export const createPaymentSuccessNotification = async (transaction) => {
  try {
    const notification = {
      title: 'Pago Confirmado',
      message: `Tu pago de $${transaction.amount} ha sido procesado exitosamente.`,
      data: {
        transactionId: transaction.id,
        amount: transaction.amount,
        gateway: transaction.payment_gateways?.name
      }
    };

    // Enviar notificación push
    await sendPushNotification(transaction.user_id, notification);

    // Enviar email
    await sendPaymentConfirmationEmail(transaction);

    // Enviar SMS si está configurado
    if (transaction.user?.phone) {
      await sendPaymentConfirmationSMS(transaction.user.phone, transaction);
    }

    return notification;
  } catch (error) {
    console.error('Error creating payment success notification:', error);
    throw error;
  }
};

/**
 * Crear notificación de pago fallido
 */
export const createPaymentFailureNotification = async (transaction) => {
  try {
    const notification = {
      title: 'Pago Fallido',
      message: 'Hubo un problema procesando tu pago. Por favor, intenta nuevamente.',
      data: {
        transactionId: transaction.id,
        amount: transaction.amount,
        gateway: transaction.payment_gateways?.name
      }
    };

    await sendPushNotification(transaction.user_id, notification);
    return notification;
  } catch (error) {
    console.error('Error creating payment failure notification:', error);
    throw error;
  }
};

/**
 * Crear notificación de reembolso
 */
export const createRefundNotification = async (refund) => {
  try {
    const notification = {
      title: 'Reembolso Procesado',
      message: `Tu reembolso de $${refund.amount} ha sido procesado.`,
      data: {
        refundId: refund.id,
        amount: refund.amount,
        reason: refund.reason
      }
    };

    await sendPushNotification(refund.requested_by, notification);
    return notification;
  } catch (error) {
    console.error('Error creating refund notification:', error);
    throw error;
  }
};

/**
 * Sistema de alertas para administradores
 */
export const sendAdminAlert = async (alert) => {
  try {
    // Enviar alerta a administradores
    const { data: admins, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('role', 'admin');

    if (error) throw error;

    for (const admin of admins) {
      await sendPushNotification(admin.id, {
        title: 'Alerta de Sistema',
        message: alert.message,
        data: alert.data
      });
    }
  } catch (error) {
    console.error('Error sending admin alert:', error);
  }
};

/**
 * Notificación de pago pendiente
 */
export const createPendingPaymentNotification = async (transaction) => {
  try {
    const notification = {
      title: 'Pago Pendiente',
      message: 'Tu pago está siendo procesado. Te notificaremos cuando se complete.',
      data: {
        transactionId: transaction.id,
        amount: transaction.amount
      }
    };

    await sendPushNotification(transaction.user_id, notification);
    return notification;
  } catch (error) {
    console.error('Error creating pending payment notification:', error);
    throw error;
  }
};

/**
 * Notificación de reserva expirada
 */
export const createReservationExpiredNotification = async (reservation) => {
  try {
    const notification = {
      title: 'Reserva Expirada',
      message: 'Tu reserva ha expirado. Los asientos han sido liberados.',
      data: {
        reservationId: reservation.id,
        event: reservation.event
      }
    };

    await sendPushNotification(reservation.user_id, notification);
    return notification;
  } catch (error) {
    console.error('Error creating reservation expired notification:', error);
    throw error;
  }
}; 