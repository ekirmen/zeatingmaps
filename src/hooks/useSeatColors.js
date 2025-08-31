// Hook compartido para manejar colores automáticos de asientos
// Se usa en Store, Boletería y Crear Mapa

import { useTheme } from '../contexts/ThemeContext';

export const useSeatColors = () => {
  const { theme } = useTheme();
  // Función para obtener el color automático de un asiento
  const getSeatColor = (seat, zona, isSelected, selectedSeats = []) => {
    const seatId = seat._id || seat.id;
    const isSelectedByMe = selectedSeats.includes(seatId);
    
    // SISTEMA DE COLORES UNIFICADO
    if (isSelectedByMe) {
      return theme.seatSelectedMe || '#3b82f6';
    } else if (seat.estado === 'seleccionado_por_otro') {
      return theme.seatSelectedOther || '#eab308';
    } else if (seat.estado === 'bloqueado_por_mi' || seat.estado === 'bloqueado_por_otro') {
      return theme.seatBlocked || '#ef4444';
    } else if (seat.estado === 'vendido' || seat.estado === 'reservado') {
      return theme.seatSoldReserved || '#6b7280';
    } else {
      // 🎨 Color de la zona = Disponible
      return zona?.color || theme.seatAvailable || '#4CAF50';
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
    return isSelected ? (theme.seatSelectedMe || '#3b82f6') : 'transparent';
  };

  // Función para obtener el color de borde
  const getBorderColor = (isSelected, zona) => {
    if (isSelected) {
      return theme.seatSelectedMe || '#3b82f6';
    }
    return zona?.color || '#2d3748';
  };

  return {
    getSeatColor,
    getZonaColor,
    getSelectionColor,
    getBorderColor,
  };
};

export default useSeatColors;
