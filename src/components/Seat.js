  // Reservado permanentemente

const AutoWrapped_85g09b = (props) => {
    if (seat.temporaryHoldUntil && new Date(seat.temporaryHoldUntil) > new Date()) {
      return 'yellow';  // Reserva temporal activa
    }
    return 'green';  // Disponible
  };

};

export default AutoWrapped_85g09b;