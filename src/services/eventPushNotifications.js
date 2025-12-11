/**
 * Servicio para enviar notificaciones push cuando se activa un evento o función
 */
import { supabase } from '../supabaseClient';
import { sendPushNotification } from '../store/services/paymentNotifications';

/**
 * Enviar notificación push cuando un evento se activa (estadoVenta = 'a-la-venta')
 */
export const sendEventActivatedNotification = async (evento) => {
  try {
    if (!evento) {

      return null;
    }

    // Obtener todos los usuarios que tienen la app instalada y están suscritos a notificaciones
    const { data: subscribers, error: subscribersError } = await supabase
      .from('push_subscriptions')
      .select('user_id')
      .eq('active', true);

    if (subscribersError) {
      console.error('[EventPush] Error obteniendo suscriptores:', subscribersError);
      return null;
    }

    if (!subscribers || subscribers.length === 0) {
      return { sent: 0, recipients: 0 };
    }

    const uniqueUserIds = [...new Set(subscribers.map(s => s.user_id))];
    let sentCount = 0;

    // Enviar notificación a cada usuario suscrito
    for (const userId of uniqueUserIds) {
      try {
        await sendPushNotification(userId, {
          type: 'event_activated',
          title: `🎉 Nuevo Evento: ${evento.nombre || 'Evento disponible'}`,
          message: `${evento.nombre || 'Un nuevo evento'} ya está disponible para comprar entradas`,
          data: {
            eventId: evento.id,
            eventSlug: evento.slug,
            eventName: evento.nombre,
            type: 'event_activated',
            url: `/store/eventos/${evento.slug || evento.id}`
          },
          tenant_id: evento.tenant_id
        });
        sentCount++;
      } catch (error) {
        console.error(`[EventPush] Error enviando notificación a usuario ${userId}:`, error);
      }
    }
    return { sent: sentCount, recipients: uniqueUserIds.length };
  } catch (error) {
    console.error('[EventPush] Error en sendEventActivatedNotification:', error);
    return null;
  }
};

/**
 * Enviar notificación push cuando se crea una función en canal internet o todos los canales
 */
export const sendFunctionCreatedNotification = async (funcion) => {
  try {
    if (!funcion) {
      console.error('[EventPush] Función no válida');
      return null;
    }

    // Verificar si la función está en el canal "internet" o en todos los canales
    let canales = funcion.canales || {};
    let shouldNotify = false;

    // Si canales es un string (JSON), parsearlo
    if (typeof canales === 'string') {
      try {
        canales = JSON.parse(canales);
      } catch (e) {
        canales = {};
      }
    }

    // Si canales es un objeto con estructura { internet: { activo: true/false }, boxOffice: { activo: true/false } }
    if (typeof canales === 'object' && canales !== null && !Array.isArray(canales)) {
      // Verificar si internet está activo (notificar si internet está activo, independientemente de boxOffice)
      if (canales.internet?.activo === true) {
        shouldNotify = true;
        const ambosCanales = canales.boxOffice?.activo === true;
        console.log(`[EventPush] Función tiene canal internet activo${ambosCanales ? ' (todos los canales)' : ''}`);
      }
    }
    // Si canales es un array, verificar si contiene "internet" o está vacío (todos)
    else if (Array.isArray(canales)) {
      if (canales.length === 0 || canales.includes('internet') || canales.includes('todos')) {
        shouldNotify = true;
      }
    }

    if (!shouldNotify) {
      return { sent: 0, recipients: 0, skipped: true };
    }

    // Obtener el evento asociado a la función
    let evento = null;
    try {
      const eventoId = funcion.evento_id;
      if (eventoId) {
        const { data: eventoData, error: eventoError } = await supabase
          .from('eventos')
          .select('id, nombre, slug, tenant_id')
          .eq('id', eventoId)
          .single();

        if (!eventoError && eventoData) {
          evento = eventoData;
        }
      }
    } catch (error) {
    }

    if (!evento) {
      // Continuar de todas formas, usar datos de la función
    }

    // Obtener todos los usuarios suscritos
    const { data: subscribers, error: subscribersError } = await supabase
      .from('push_subscriptions')
      .select('user_id')
      .eq('active', true);

    if (subscribersError) {
      console.error('[EventPush] Error obteniendo suscriptores:', subscribersError);
      return null;
    }

    if (!subscribers || subscribers.length === 0) {
      return { sent: 0, recipients: 0 };
    }

    const uniqueUserIds = [...new Set(subscribers.map(s => s.user_id))];
    const funcionDate = funcion.fechaCelebracion
      ? new Date(funcion.fechaCelebracion).toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'Fecha disponible';

    const eventoNombre = evento?.nombre || 'Nuevo Evento';
    const eventoSlug = evento?.slug || evento?.id;
    const tenantId = funcion.tenant_id || evento?.tenant_id;

    let sentCount = 0;

    for (const userId of uniqueUserIds) {
      try {
        await sendPushNotification(userId, {
          type: 'function_created',
          title: `🎫 Nueva Función: ${eventoNombre}`,
          message: `Nueva función disponible el ${funcionDate}. ¡Compra tus entradas ahora!`,
          data: {
            eventId: evento?.id,
            funcionId: funcion.id,
            eventSlug: eventoSlug,
            eventName: eventoNombre,
            funcionDate: funcion.fechaCelebracion,
            type: 'function_created',
            url: eventoSlug
              ? `/store/eventos/${eventoSlug}/map?funcion=${funcion.id}`
              : `/store/seat-selection/${funcion.id}`
          },
          tenant_id: tenantId
        });
        sentCount++;
      } catch (error) {
        console.error(`[EventPush] Error enviando notificación a usuario ${userId}:`, error);
      }
    }
    return { sent: sentCount, recipients: uniqueUserIds.length };
  } catch (error) {
    console.error('[EventPush] Error en sendFunctionCreatedNotification:', error);
    return null;
  }
};

/**
 * Suscribir usuario a notificaciones push (PWA)
 */
export const subscribeToPushNotifications = async (userId) => {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null;
    }

    // Registrar service worker
    const registration = await navigator.serviceWorker.ready;

    // Solicitar permiso
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return null;
    }

    // Obtener subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY
    });

    // Guardar subscription en base de datos
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        subscription: subscription,
        endpoint: subscription.endpoint,
        keys: subscription.toJSON().keys,
        active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,endpoint'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[EventPush] Error suscribiendo a notificaciones push:', error);
    return null;
  }
};

/**
 * Desuscribir usuario de notificaciones push
 */
export const unsubscribeFromPushNotifications = async (userId) => {
  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .update({ active: false })
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('[EventPush] Error desuscribiendo de notificaciones push:', error);
    return false;
  }
};

// Mantener función antigua por compatibilidad (deprecated)
export const sendFunctionActivatedNotification = sendFunctionCreatedNotification;

export default {
  sendEventActivatedNotification,
  sendFunctionCreatedNotification,
  sendFunctionActivatedNotification, // Deprecated, usar sendFunctionCreatedNotification
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications
};

