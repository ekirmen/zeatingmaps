import { message as antdMessage } from '../utils/antdComponents';
import { useCallback } from 'react';

/**
 * Hook para manejo consistente de errores en toda la aplicación
 */
export default function useErrorHandler() {
  const handleSeatError = useCallback((error = {}, context = {}) => {
    console.error('🚨 [SEAT_ERROR]', error, context);

    let errorMessage = 'Error al seleccionar el asiento';
    let shouldClearCart = false;

    if (error.message?.includes('already_locked')) {
      errorMessage = 'Este asiento ya está siendo seleccionado por otro usuario. Por favor, elige otro asiento.';
    } else if (error.message?.includes('not_available')) {
      errorMessage = 'Este asiento ya no está disponible. Por favor, elige otro asiento.';
    } else if (error.message?.includes('invalid_seat')) {
      errorMessage = 'Asiento no válido. Por favor, recarga la página e inténtalo de nuevo.';
    } else if (error.message?.includes('not_locked_by_user')) {
      errorMessage = 'No puedes desbloquear un asiento que no seleccionaste.';
    } else if (error.message?.includes('already_paid')) {
      errorMessage = 'No se puede modificar un asiento ya pagado.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    antdMessage.error(errorMessage);

    if (shouldClearCart && context.clearCart) {
      context.clearCart();
    }

    return {
      handled: true,
      message: errorMessage,
      shouldClearCart
    };
  }, []);

  const handlePaymentError = useCallback((error = {}, context = {}) => {
    console.error('🚨 [PAYMENT_ERROR]', error, context);

    let errorMessage = 'Error al procesar el pago';
    let shouldClearCart = false;
    let shouldRetry = false;

    if (error.message?.includes('already_locked')) {
      errorMessage = 'Uno o más asientos ya fueron seleccionados por otro usuario. Por favor, actualiza tu selección.';
      shouldClearCart = true;
    } else if (error.message?.includes('not_available')) {
      errorMessage = 'Uno o más asientos ya no están disponibles. Por favor, actualiza tu selección.';
      shouldClearCart = true;
    } else if (error.message?.includes('network')) {
      errorMessage = 'Error de conexión. Por favor, verifica tu internet e inténtalo de nuevo.';
      shouldRetry = true;
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'La operación tardó demasiado. Por favor, inténtalo de nuevo.';
      shouldRetry = true;
    } else if (error.message?.includes('insufficient_funds')) {
      errorMessage = 'Fondos insuficientes. Por favor, verifica tu método de pago.';
    } else if (error.message?.includes('card_declined')) {
      errorMessage = 'Tarjeta rechazada. Por favor, verifica los datos o usa otro método de pago.';
    } else if (error.message?.includes('expired_card')) {
      errorMessage = 'Tarjeta expirada. Por favor, usa otra tarjeta.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    antdMessage.error(errorMessage);

    if (shouldClearCart && context.clearCart) {
      context.clearCart();
    }

    return {
      handled: true,
      message: errorMessage,
      shouldClearCart,
      shouldRetry
    };
  }, []);

  const handleValidationError = useCallback((error = {}, context = {}) => {
    console.error('🚨 [VALIDATION_ERROR]', error, context);

    let errorMessage = 'Error de validación';

    if (error.message?.includes('required')) {
      errorMessage = 'Faltan campos requeridos. Por favor, completa todos los datos.';
    } else if (error.message?.includes('invalid_email')) {
      errorMessage = 'Email inválido. Por favor, verifica tu dirección de correo.';
    } else if (error.message?.includes('invalid_phone')) {
      errorMessage = 'Teléfono inválido. Por favor, verifica tu número.';
    } else if (error.message?.includes('duplicate')) {
      errorMessage = 'Ya existe un registro con estos datos.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    antdMessage.error(errorMessage);

    return {
      handled: true,
      message: errorMessage
    };
  }, []);

  const handleNetworkError = useCallback((error = {}, context = {}) => {
    console.error('🚨 [NETWORK_ERROR]', error, context);

    let errorMessage = 'Error de conexión';
    let shouldRetry = true;

    if (error.message?.includes('timeout')) {
      errorMessage = 'La operación tardó demasiado. Por favor, inténtalo de nuevo.';
    } else if (error.message?.includes('offline')) {
      errorMessage = 'Sin conexión a internet. Por favor, verifica tu conexión.';
    } else if (error.message?.includes('server_error')) {
      errorMessage = 'Error del servidor. Por favor, inténtalo más tarde.';
    } else if (error.message?.includes('rate_limit')) {
      errorMessage = 'Demasiadas solicitudes. Por favor, espera un momento e inténtalo de nuevo.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    antdMessage.error(errorMessage);

    return {
      handled: true,
      message: errorMessage,
      shouldRetry
    };
  }, []);

  const handleGenericError = useCallback((error = {}, context = {}) => {
    console.error('🚨 [GENERIC_ERROR]', error, context);

    const errorMessage = error.message || 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.';

    antdMessage.error(errorMessage);

    return {
      handled: true,
      message: errorMessage
    };
  }, []);

  const handleError = useCallback((error, type = 'generic', context = {}) => {
    switch (type) {
      case 'seat':
        return handleSeatError(error, context);
      case 'payment':
        return handlePaymentError(error, context);
      case 'validation':
        return handleValidationError(error, context);
      case 'network':
        return handleNetworkError(error, context);
      default:
        return handleGenericError(error, context);
    }
  }, [handleSeatError, handlePaymentError, handleValidationError, handleNetworkError, handleGenericError]);

  const showSuccess = useCallback((msg, duration = 3) => {
    antdMessage.success(msg, duration);
  }, []);

  const showWarning = useCallback((msg, duration = 4) => {
    antdMessage.warning(msg, duration);
  }, []);

  const showInfo = useCallback((msg, duration = 3) => {
    antdMessage.info(msg, duration);
  }, []);

  return {
    handleError,
    handleSeatError,
    handlePaymentError,
    handleValidationError,
    handleNetworkError,
    handleGenericError,
    showSuccess,
    showWarning,
    showInfo
  };
}

