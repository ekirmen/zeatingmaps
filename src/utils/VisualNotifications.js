// src/utils/VisualNotifications.js - Versión simplificada
import { notification } from 'antd';

const VisualNotifications = {
  types: {
    seatSelected: { type: 'success', message: 'Asiento seleccionado', duration: 2 },
    seatReserved: { type: 'warning', message: 'Asiento reservado temporalmente', duration: 5 },
    purchaseComplete: { type: 'success', message: 'Compra realizada exitosamente', duration: 3 },
    error: { type: 'error', message: 'Error en la transacción', duration: 4 },
    validationWarning: { type: 'warning', message: 'Advertencia de validación', duration: 3 },
    seatLimit: { type: 'info', message: 'Límite de asientos alcanzado', duration: 3 },
    paymentWarning: { type: 'warning', message: 'Transacción de alto valor', duration: 4 },
    seatBlocked: { type: 'error', message: 'Asiento bloqueado por otro usuario', duration: 3 },
    reservationExpired: { type: 'warning', message: 'Reserva expirada', duration: 3 },
    cartUpdated: { type: 'info', message: 'Carrito actualizado', duration: 2 }
  },

  show: (type, customMessage = null, customDescription = null) => {
    const config = VisualNotifications.types[type];
    if (!config) return;
    
    notification[config.type]({
      message: customMessage || config.message,
      description: customDescription || 'Notificación del sistema',
      duration: config.duration,
      placement: 'topRight'
    });
  },

  showCustom: (type, message, description, duration = 3) => {
    notification[type]({
      message,
      description,
      duration,
      placement: 'topRight'
    });
  },

  destroy: () => {
    notification.destroy();
  }
};

export default VisualNotifications;