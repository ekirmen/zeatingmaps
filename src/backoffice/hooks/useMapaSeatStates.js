// Hook para manejar estados visuales de asientos
export const useMapaSeatStates = (elements, setElements) => {
  const seatStates = {
    available: { fill: '#00d6a4', stroke: '#a8aebc', opacity: 1 },
    selected: { fill: '#008e6d', stroke: '#696f7d', opacity: 1 },
    occupied: { fill: '#ff6b6b', stroke: '#d63031', opacity: 0.8 },
    blocked: { fill: '#6c5ce7', stroke: '#5f3dc4', opacity: 0.7 },
    reserved: { fill: '#fdcb6e', stroke: '#e17055', opacity: 0.9 }
  };

  const changeSeatState = (seatId, newState) => {
    if (!seatStates[newState]) return;
    
    setElements(prev => prev.map(el => {
      if (el._id === seatId && el.type === 'silla') {
        return {
          ...el,
          state: newState,
          fill: seatStates[newState].fill,
          stroke: seatStates[newState].stroke,
          opacity: seatStates[newState].opacity
        };
      }
      return el;
    }));
  };

  return {
    changeSeatState,
    seatStates
  };
};
