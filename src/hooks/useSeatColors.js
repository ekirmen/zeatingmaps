// Hook compartido para manejar colores automáticos de asientos
// Se usa en Store, Boletería y Crear Mapa

export const useSeatColors = () => {
  // Función para obtener el color automático de un asiento
  const getSeatColor = (seat, zona, isSelected, selectedSeats = []) => {
    const seatId = seat._id || seat.id;
    const isSelectedByMe = selectedSeats.includes(seatId);
    
    // SISTEMA DE COLORES UNIFICADO
    if (isSelectedByMe) {
      return '#3b82f6'; // 🔵 Azul = Seleccionado por mí
    } else if (seat.estado === 'seleccionado_por_otro') {
      return '#eab308'; // 🟡 Amarillo = Seleccionado por otro
    } else if (seat.estado === 'bloqueado_por_mi' || seat.estado === 'bloqueado_por_otro') {
      return '#ef4444'; // 🔴 Rojo = Bloqueado (por mí o por otro)
    } else if (seat.estado === 'vendido' || seat.estado === 'reservado') {
      return '#6b7280'; // ⚫ Gris = Vendido/Reservado
    } else {
      // 🎨 Color de la zona = Disponible
      return zona?.color || '#4CAF50';
    }
  };

  // Función para obtener el color de una zona
  const getZonaColor = (zona, index = 0) => {
    if (zona?.color) {
      return zona.color;
    }
    
    // Colores por defecto si no hay color definido
    const defaultColors = [
      '#4CAF50', // Verde
      '#2196F3', // Azul
      '#FF9800', // Naranja
      '#9C27B0', // Púrpura
      '#F44336', // Rojo
      '#00BCD4', // Cian
      '#FFEB3B', // Amarillo
      '#795548', // Marrón
    ];
    
    return defaultColors[index % defaultColors.length];
  };

  // Función para obtener el color de selección
  const getSelectionColor = (isSelected) => {
    return isSelected ? '#3b82f6' : 'transparent';
  };

  // Función para obtener el color de borde
  const getBorderColor = (isSelected, zona) => {
    if (isSelected) {
      return '#3b82f6'; // Azul para seleccionado
    }
    return zona?.color || '#2d3748'; // Color de zona o negro por defecto
  };

  return {
    getSeatColor,
    getZonaColor,
    getSelectionColor,
    getBorderColor,
  };
};

export default useSeatColors;
