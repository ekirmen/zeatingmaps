import { buildRelativeApiUrl } from '../../utils/apiConfig';

/**
 * Envía correo de reserva al usuario
 * El email se obtiene automáticamente desde el servidor usando el user_id del pago
 */
export async function sendReservationEmail(locator, userId, transactionData = {}) {
  try {
    console.log('📧 [EMAIL_SERVICE] Enviando correo de reserva para locator:', locator);
    
    // No necesitamos obtener el email aquí, el servidor lo obtendrá automáticamente
    const emailUrl = buildRelativeApiUrl(`payments/${locator}/email`);
    
    const response = await fetch(emailUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // No enviamos email, el servidor lo obtendrá del pago
        type: 'reservation', // Indicar que es correo de reserva
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[EMAIL_SERVICE] Error enviando correo de reserva:', errorData);
      return { success: false, error: errorData.error || 'Error al enviar correo' };
    }

    const data = await response.json();
    console.log('✅ [EMAIL_SERVICE] Correo de reserva enviado exitosamente');
    return { success: true, data };
  } catch (error) {
    console.error('[EMAIL_SERVICE] Error enviando correo de reserva:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envía correo de pago completo con tickets al usuario
 * El email se obtiene automáticamente desde el servidor usando el user_id del pago
 */
export async function sendPaymentCompleteEmail(locator, userId, transactionData = {}) {
  try {
    console.log('📧 [EMAIL_SERVICE] Enviando correo de pago completo para locator:', locator);
    
    // No necesitamos obtener el email aquí, el servidor lo obtendrá automáticamente
    const emailUrl = buildRelativeApiUrl(`payments/${locator}/email`);
    
    const response = await fetch(emailUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // No enviamos email, el servidor lo obtendrá del pago
        type: 'payment_complete', // Indicar que es correo de pago completo
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[EMAIL_SERVICE] Error enviando correo de pago completo:', errorData);
      return { success: false, error: errorData.error || 'Error al enviar correo' };
    }

    const data = await response.json();
    console.log('✅ [EMAIL_SERVICE] Correo de pago completo enviado exitosamente');
    return { success: true, data };
  } catch (error) {
    console.error('[EMAIL_SERVICE] Error enviando correo de pago completo:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envía correo automáticamente según el status de la transacción
 */
export async function sendPaymentEmailByStatus(transaction) {
  try {
    const status = transaction.status || transaction.transactionStatus;
    const locator = transaction.locator || transaction.order_id || transaction.orderId;
    const userId = transaction.user_id || transaction.userId || transaction.user?.id;

    if (!locator) {
      console.warn('[EMAIL_SERVICE] No se proporcionó locator, no se enviará correo');
      return { success: false, error: 'No se proporcionó locator' };
    }

    if (!userId) {
      console.warn('[EMAIL_SERVICE] No se proporcionó userId, no se enviará correo');
      return { success: false, error: 'No se proporcionó userId' };
    }

    // Enviar correo según el status
    if (status === 'completed' || status === 'pagado') {
      // Pago completo: enviar correo con tickets
      return await sendPaymentCompleteEmail(locator, userId, transaction);
    } else if (status === 'reservado' || status === 'reserved' || status === 'pending') {
      // Reserva o pago pendiente: enviar correo de reserva
      return await sendReservationEmail(locator, userId, transaction);
    } else {
      console.log('[EMAIL_SERVICE] Status no requiere envío de correo:', status);
      return { success: false, error: `Status ${status} no requiere envío de correo` };
    }
  } catch (error) {
    console.error('[EMAIL_SERVICE] Error en sendPaymentEmailByStatus:', error);
    return { success: false, error: error.message };
  }
}

