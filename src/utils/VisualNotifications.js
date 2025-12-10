import { notification } from '../utils/antdComponents';

// ===== SISTEMA DE NOTIFICACIONES VISUALES =====
const VisualNotifications = {
  types: {
    seatSelected: {
      type: 'success',
      message: 'Asiento seleccionado',
      icon: '✅',
      color: '#52c41a',
      duration: 2000
    },
    seatReserved: {
      type: 'warning',
      message: 'Asiento reservado temporalmente',
      icon: '⏰',
      color: '#faad14',
      duration: 5000
    },
    purchaseComplete: {
      type: 'success',
      message: 'Compra realizada exitosamente',
      icon: '🎉',
      color: '#52c41a',
      duration: 3000
    },
    error: {
      type: 'error',
      message: 'Error en la transacción',
      icon: '❌',
      color: '#ff4d4f',
      duration: 4000
    },
    validationWarning: {
      type: 'warning',
      message: 'Advertencia de validación',
      icon: '⚠️',
      color: '#faad14',
      duration: 3000
    },
    seatLimit: {
      type: 'info',
      message: 'Límite de asientos alcanzado',
      icon: 'ℹ️',
      color: '#1890ff',
      duration: 3000
    },
    paymentWarning: {
      type: 'warning',
      message: 'Transacción de alto valor',
      icon: '💰',
      color: '#faad14',
      duration: 4000
    },
    seatBlocked: {
      type: 'error',
      message: 'Asiento bloqueado por otro usuario',
      icon: '🚫',
      color: '#ff4d4f',
      duration: 3000
    },
    reservationExpired: {
      type: 'warning',
      message: 'Reserva expirada',
      icon: '⏰',
      color: '#faad14',
      duration: 3000
    },
    cartUpdated: {
      type: 'info',
      message: 'Carrito actualizado',
      icon: '🛒',
      color: '#1890ff',
      duration: 2000
    }
  },

  show: (type, customMessage = null, customDescription = null) => {
    const notificationConfig = VisualNotifications.types[type];
    if (!notificationConfig) {
      return;
    }

    notification[notificationConfig.type]({
      message: customMessage || notificationConfig.message,
      description: customDescription || `Notificación del sistema de tickera`,
      icon: <span style={{ fontSize: '16px' }}>{notificationConfig.icon}</span>,
      duration: notificationConfig.duration,
      placement: 'topRight',
      style: {
        borderLeft: `4px solid ${notificationConfig.color}`,
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }
    });
  },

  // Método para mostrar notificaciones personalizadas
  showCustom: (type, message, description, duration = 3000) => {
    notification[type]({
      message,
      description,
      duration,
      placement: 'topRight',
      style: {
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }
    });
  },

  // Método para limpiar todas las notificaciones
  destroy: () => {
    notification.destroy();
  }
};

export default VisualNotifications;

