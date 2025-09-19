import { supabase } from '../../supabaseClient';

const isNotificationsTableMissing = (error) => {
  if (!error) return false;

  const status = error.status ?? error?.response?.status;
  const code = error.code;
  const messageParts = [error.message, error.details, error.hint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    status === 404 ||
    code === 'PGRST116' ||
    code === '42P01' ||
    messageParts.includes('not found') ||
    messageParts.includes('does not exist')
  );
};

const handleNotificationError = (context, error) => {
  if (!error) return;

  if (isNotificationsTableMissing(error)) {
    console.warn(
      `[Notifications] ${context}: tabla "notifications" no disponible en Supabase. Se omite el guardado de la notificación.`,
      error
    );
  } else {
    console.error(`[Notifications] ${context}:`, error);
  }
};

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
    let targetUserId = userId;

    if (!targetUserId) {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.warn('[Notifications] Error obteniendo usuario autenticado:', authError);
      }

      targetUserId = authData?.user?.id ?? null;
    }

    if (!targetUserId) {
      console.warn('[Notifications] Error enviando notificación push: userId no disponible.');
      return null;
    }

    const payload = {
      user_id: targetUserId,
      type: notification.type || 'payment',
      title: notification.title,
      message: notification.message,
      data: notification.data,
      read: false
    };

    if (notification.tenant_id) {
      payload.tenant_id = notification.tenant_id;
    }

    if (notification.status) {
      payload.status = notification.status;
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleNotificationError('Error enviando notificación push', error);
    return null;
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
  const notification = {
    title: 'Pago Confirmado',
    message: `Tu pago de $${transaction.amount} ha sido procesado exitosamente.`,
    data: {
      transactionId: transaction.id,
      amount: transaction.amount,
      gateway: transaction.gateway_id
    }
  };

  try {
    const targetUserId = transaction.user_id ?? transaction.user?.id ?? null;
    const tenantId = transaction.tenant_id ?? transaction.tenant?.id ?? null;

    await sendPushNotification(targetUserId, { ...notification, tenant_id: tenantId });

    await sendPaymentConfirmationEmail(transaction);

    const userPhone =
      transaction.user?.phone ??
      transaction.user?.user_metadata?.phone ??
      transaction.user?.user_metadata?.telefono ??
      transaction.phone ??
      null;

    if (userPhone) {
      await sendPaymentConfirmationSMS(userPhone, transaction);
    }
  } catch (error) {
    handleNotificationError('Error creando notificación de pago exitoso', error);
  }

  return notification;
};

/**
 * Crear notificación de pago fallido
 */
export const createPaymentFailureNotification = async (transaction) => {
  const notification = {
    title: 'Pago Fallido',
    message: 'Hubo un problema procesando tu pago. Por favor, intenta nuevamente.',
    data: {
      transactionId: transaction.id,
      amount: transaction.amount,
      gateway: transaction.gateway_id
    }
  };

  try {
    await sendPushNotification(transaction.user_id, notification);
  } catch (error) {
    handleNotificationError('Error creando notificación de pago fallido', error);
  }

  return notification;
};

/**
 * Crear notificación de reembolso
 */
export const createRefundNotification = async (refund) => {
  const notification = {
    title: 'Reembolso Procesado',
    message: `Tu reembolso de $${refund.amount} ha sido procesado.`,
    data: {
      refundId: refund.id,
      amount: refund.amount,
      reason: refund.reason
    }
  };

  try {
    await sendPushNotification(refund.requested_by, notification);
  } catch (error) {
    handleNotificationError('Error creando notificación de reembolso', error);
  }

  return notification;
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
  const notification = {
    title: 'Pago Pendiente',
    message: 'Tu pago está siendo procesado. Te notificaremos cuando se complete.',
    data: {
      transactionId: transaction.id,
      amount: transaction.amount
    }
  };

  try {
    await sendPushNotification(transaction.user_id, notification);
  } catch (error) {
    handleNotificationError('Error creando notificación de pago pendiente', error);
  }

  return notification;
};

/**
 * Notificación de reserva expirada
 */
export const createReservationExpiredNotification = async (reservation) => {
  const notification = {
    title: 'Reserva Expirada',
    message: 'Tu reserva ha expirado. Los asientos han sido liberados.',
    data: {
      reservationId: reservation.id,
      event: reservation.event
    }
  };

  try {
    await sendPushNotification(reservation.user_id, notification);
  } catch (error) {
    handleNotificationError('Error creando notificación de reserva expirada', error);
  }

  return notification;
};