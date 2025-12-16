export const getSeatStatusColor = (seat) => {
  if (seat.status === 'reserved') {
    return 'red'; // Reservado permanentemente
  }
  if (seat.temporaryHoldUntil && new Date(seat.temporaryHoldUntil) > new Date()) {
    return 'yellow';  // Reserva temporal activa
  }
  return 'green';  // Disponible
};

export default getSeatStatusColor;