// Hook compartido para manejar colores automáticos de asientos
// Se usa en Store, Boletería y Crear Mapa

import { useTheme } from '../contexts/ThemeContext';
import { useState, useEffect } from 'react';

const isValidUuid = (value) =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export const useSeatColors = (eventId = null) => {
  const { theme, getEventTheme } = useTheme();
  const [eventTheme, setEventTheme] = useState(theme);

  useEffect(() => {
    const loadEventTheme = async () => {
      if (!eventId) {
        setEventTheme(theme);
        return;
      }

      if (!isValidUuid(eventId)) {
        setEventTheme(theme);
        return;
      }

      try {
        const eventSpecificTheme = await getEventTheme(eventId);
        setEventTheme(eventSpecificTheme);
      } catch (error) {
        console.error('[useSeatColors] Error loading event theme:', error);
        setEventTheme(theme);
      }
    };

    loadEventTheme();
  }, [eventId, theme, getEventTheme]);

  // Función para obtener el color automático de un asiento
  const getSeatColor = (seat, zona, isSelected, selectedSeats = [], lockedSeats = [], seatStates = null) => {
    const seatId = seat._id || seat.id;
    const isSelectedByMe = selectedSeats.includes(seatId);
    
    // Obtener el session_id actual
    const currentSessionId = localStorage.getItem('anonSessionId') || 'unknown';
    
    // Verificar si hay un estado actualizado en el store (tiempo real)
    const storeState = seatStates?.get(seatId);
    if (storeState) {
      // Usar el estado del store para determinar el color
      switch (storeState) {
        case 'vendido':
        case 'pagado':
          return eventTheme.seatSold || '#2d3748'; // Negro para vendido
        case 'reservado':
          return eventTheme.seatReserved || '#805ad5'; // Púrpura para reservado
        case 'anulado':
          return eventTheme.seatCancelled || '#e53e3e'; // Rojo para anulado
        case 'seleccionado':
          return eventTheme.seatSelectedMe || '#ffd700'; // Amarillo para seleccionado por mí
        case 'seleccionado_por_otro':
          return eventTheme.seatSelectedOther || '#ed8936'; // Naranja para seleccionado por otro
        case 'locked':
          return '#6b7280'; // Gris para bloqueado permanentemente
        default:
          return '#4CAF50'; // Verde para disponible
      }
    }
    
    // Fallback a la lógica original si no hay estado en el store
    // Verificar si está bloqueado/seleccionado por otro usuario
    const lockInfo = lockedSeats.find(lock => lock.seat_id === seatId);
    const isLockedByOther = lockInfo && lockInfo.session_id !== currentSessionId;
    
    // Distinguir entre locked permanente y seleccionado temporal
    const isPermanentlyLocked = lockInfo && lockInfo.status === 'locked';
    const isTemporarilySelected = lockInfo && lockInfo.status === 'seleccionado';
    const isSelectedByOther = lockInfo && lockInfo.session_id !== currentSessionId && 
                             (lockInfo.status === 'seleccionado' || lockInfo.status === 'selected');
    
    // SISTEMA DE COLORES UNIFICADO - PRIORIDAD CORRECTA
    // 1. VENDIDO (máxima prioridad) - desde seat_locks o estado del asiento
    if (lockInfo?.status === 'vendido' || seat.estado === 'vendido' || seat.estado === 'pagado') {
      return eventTheme.seatSold || '#2d3748'; // Negro para vendido
    }
    
    // 2. RESERVADO - desde seat_locks o estado del asiento
    if (lockInfo?.status === 'reservado' || seat.estado === 'reservado') {
      return eventTheme.seatReserved || '#805ad5'; // Púrpura para reservado
    }
    
    // 3. ANULADO - desde seat_locks o estado del asiento
    if (lockInfo?.status === 'anulado' || seat.estado === 'anulado') {
      return eventTheme.seatCancelled || '#e53e3e'; // Rojo para anulado
    }
    
    // 4. BLOQUEADO PERMANENTEMENTE (desde boleteria)
    if (isPermanentlyLocked || seat.estado === 'locked' || lockInfo?.status === 'locked') {
      return '#6b7280'; // Gris para asientos bloqueados permanentemente
    }
    
    // 5. SELECCIONADO POR OTRO USUARIO (temporal) - PRIORIDAD ALTA
    if (isSelectedByOther && !isPermanentlyLocked) {
      return eventTheme.seatSelectedOther || '#ed8936'; // Naranja para seleccionado por otro
    }
    
    // 6. BLOQUEADO POR OTRO USUARIO (temporal) - PRIORIDAD BAJA
    if (isLockedByOther && !isPermanentlyLocked && !isSelectedByOther) {
      return eventTheme.seatBlocked || '#f56565'; // Rojo claro para bloqueado
    }
    
    // 7. SELECCIONADO POR MÍ (temporal)
    if (isSelectedByMe && !isPermanentlyLocked) {
      return eventTheme.seatSelectedMe || '#ffd700'; // Amarillo para seleccionado por mí
    }
    
    // 8. DISPONIBLE (por defecto) - SIEMPRE VERDE
    const defaultColor = '#4CAF50'; // Verde para asientos disponibles
    return defaultColor;
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
    return isSelected ? (theme.seatSelectedMe || '#ffd700') : 'transparent';
  };

  // Función para obtener el color de borde
  const getBorderColor = (isSelected, zona) => {
    if (isSelected) {
      return theme.seatSelectedMe || '#ffd700';
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
