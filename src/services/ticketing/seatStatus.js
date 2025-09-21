const normalizeStatus = (status) => {
  if (!status || typeof status !== 'string') return null;
  return status.trim().toLowerCase();
};

/**
 * Determina el estado final de los seat_locks basado en el método de pago
 * y el resultado de la transacción
 */
export const determineSeatLockStatus = ({
  methodId = '',
  transactionStatus = '',
  isReservation = false,
  requiresManualConfirmation = false,
  seatStatusHint = null,
  manualStatus = null,
} = {}) => {
  if (manualStatus) {
    return manualStatus;
  }

  if (seatStatusHint) {
    return seatStatusHint;
  }

  if (isReservation || requiresManualConfirmation) {
    return 'reservado';
  }

  const normalizedTransactionStatus = normalizeStatus(transactionStatus);
  const normalizedMethodId = normalizeStatus(methodId);

  if (['pagado', 'paid', 'success', 'completed'].includes(normalizedTransactionStatus)) {
    return 'pagado';
  }

  if (['reservado', 'reserved'].includes(normalizedTransactionStatus)) {
    return 'reservado';
  }

  if (['pending', 'processing', 'in_process'].includes(normalizedTransactionStatus)) {
    if ([
      'stripe',
      'paypal',
      'transferencia',
      'efectivo_tienda',
      'boleteria_manual',
      'manual',
    ].includes(normalizedMethodId)) {
      return 'reservado';
    }
  }

  switch (normalizedMethodId) {
    case 'efectivo':
    case 'pago_movil':
    case 'apple_pay':
    case 'google_pay':
      return 'pagado';
    case 'stripe':
    case 'paypal':
    case 'transferencia':
    case 'efectivo_tienda':
    case 'reserva':
    case 'reservation':
      return 'reservado';
    default:
      return 'pagado';
  }
};

export default determineSeatLockStatus;
