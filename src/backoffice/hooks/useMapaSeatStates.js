// Hook para manejar estados visuales de asientos

const AutoWrapped_jjd2ro = (props) => {
  export 


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

};

export default AutoWrapped_jjd2ro;