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
  } else {
    console.error(`[Notifications] ${context}:`, error);
  }
};

/**
 * Suscribirse a cambios de transacciones en tiempo real
 */
/**
 * Suscribirse a cambios de transacciones en tiempo real
 */
export const subscribeToPaymentTransactions = (callback, tenantId = null) => {
  const subscription = supabase
    .channel('payment_transactions_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'payment_transactions',
        filter: tenantId ? `tenant_id=eq.${tenantId}` : undefined,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return subscription;
};

/**
 * Enviar notificación push al usuario autenticado.
 *
 * Si se proporciona un `userId`, debe coincidir con el usuario autenticado; de lo contrario,
 * se rechazará la inserción para evitar que un cliente notifique a terceros.
 */
export const sendPushNotification = async (userId, notification) => {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      return null;
    }

    const authenticatedUserId = authData?.user?.id ?? null;

    if (!authenticatedUserId) {
      return null;
    }

    if (userId && userId !== authenticatedUserId) {
      throw new Error(
        '[Notifications] Intento de enviar una notificación en nombre de un usuario distinto al autenticado.'
      );
    }

    const targetUserId = authenticatedUserId;

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
 * Esta función ahora usa el servicio de correos automático
 */
export const sendPaymentConfirmationEmail = async (transaction) => {
  try {
    // El envío de correos ahora se maneja automáticamente en:
    // - Pay.js: cuando se procesa un pago
    // - updatePaymentTransactionStatus: cuando el status cambia a 'completed'
    // - PaymentModal: cuando se crea un pago desde el backoffice
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
/**
 * Crear notificación de pago exitoso
 */
export const createPaymentSuccessNotification = async (transaction, notification = {}) => {
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
/**
 * Crear notificación de pago fallido
 */
export const createPaymentFailureNotification = async (transaction, notification = {}) => {
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
/**
 * Crear notificación de reembolso
 */
export const createRefundNotification = async (refund, notification = {}) => {
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
/**
 * Sistema de alertas para administradores
 */
export const createAdminAlert = async (alert) => {
  try {
    const { data: admins, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('permisos->role', 'admin');

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
/**
 * Notificación de pago pendiente
 */
export const createPaymentPendingNotification = async (transaction, notification = {}) => {
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
/**
 * Notificación de reserva expirada
 */
export const createReservationExpiredNotification = async (reservation, notification = {}) => {
  try {
    await sendPushNotification(reservation.user_id, notification);
  } catch (error) {
    handleNotificationError('Error creando notificación de reserva expirada', error);
  }

  return notification;
};
