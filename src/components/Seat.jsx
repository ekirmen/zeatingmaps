const getSeatColor = (seat) => {
  if (seat.isReserved) return '#555';  // Reservado permanentemente
  if (seat.temporaryHoldUntil && new Date(seat.temporaryHoldUntil) > new Date()) {
    return 'yellow';  // Reserva temporal activa
  }
  return 'green';  // Disponible
};
