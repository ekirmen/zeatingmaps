/**
 * Utilidad para actualizar el estado de un asiento en el mapa JSON
 * Esto permite que otros usuarios vean inmediatamente cuando un asiento está seleccionado
 */

export const updateSeatStateInMapa = (mapa, seatId, newState) => {
  if (!mapa?.contenido || !Array.isArray(mapa.contenido)) {
    console.warn('⚠️ [updateSeatStateInMapa] Mapa o contenido inválido');
    return mapa;
  }

  const updatedMapa = {
    ...mapa,
    contenido: mapa.contenido.map(elemento => {
      // Caso 1: Mesa con sillas
      if (elemento.sillas && Array.isArray(elemento.sillas)) {
        return {
          ...elemento,
          sillas: elemento.sillas.map(silla => {
            if (silla._id === seatId) {
              console.log(`🔄 [updateSeatStateInMapa] Actualizando estado del asiento ${seatId} de "${silla.estado}" a "${newState}"`);
              return {
                ...silla,
                estado: newState
              };
            }
            return silla;
          })
        };
      }
      
      // Caso 2: Asiento individual
      if (elemento._id === seatId) {
        console.log(`🔄 [updateSeatStateInMapa] Actualizando estado del asiento ${seatId} de "${elemento.estado}" a "${newState}"`);
        return {
          ...elemento,
          estado: newState
        };
      }
      
      return elemento;
    })
  };

  return updatedMapa;
};

/**
 * Función para obtener el estado actual de un asiento en el mapa
 */
export const getSeatStateFromMapa = (mapa, seatId) => {
  if (!mapa?.contenido || !Array.isArray(mapa.contenido)) {
    return null;
  }

  for (const elemento of mapa.contenido) {
    // Caso 1: Mesa con sillas
    if (elemento.sillas && Array.isArray(elemento.sillas)) {
      const silla = elemento.sillas.find(s => s._id === seatId);
      if (silla) {
        return silla.estado;
      }
    }
    
    // Caso 2: Asiento individual
    if (elemento._id === seatId) {
      return elemento.estado;
    }
  }

  return null;
};

/**
 * Función para verificar si un asiento está disponible en el mapa
 */
export const isSeatAvailableInMapa = (mapa, seatId) => {
  const estado = getSeatStateFromMapa(mapa, seatId);
  return estado === 'disponible';
};
