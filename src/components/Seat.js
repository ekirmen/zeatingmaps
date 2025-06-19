const getSeatColor = (seat) => {
  if (seat.isReserved) return 'red';  // Reservado permanentemente
  if (seat.temporaryHoldUntil && new Date(seat.temporaryHoldUntil) > new Date()) {
    return 'yellow';  // Reserva temporal activa
  }
  return 'green';  // Disponible
};