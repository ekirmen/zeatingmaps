// Hook compartido para manejar colores automáticos de asientos
// Se usa en Store, Boletería y Crear Mapa

import { useTheme } from '../contexts/ThemeContext';
import { useState, useEffect } from 'react';

export const useSeatColors = (eventId = null) => {
  const { theme, getEventTheme } = useTheme();
  const [eventTheme, setEventTheme] = useState(theme);

  useEffect(() => {
    const loadEventTheme = async () => {
      if (eventId) {
        try {
          const eventSpecificTheme = await getEventTheme(eventId);
          setEventTheme(eventSpecificTheme);
        } catch (error) {
          console.error('[useSeatColors] Error loading event theme:', error);
          setEventTheme(theme);
        }
      } else {
        setEventTheme(theme);
      }
    };

    loadEventTheme();
  }, [eventId, theme, getEventTheme]);

  // Función para obtener el color automático de un asiento
  const getSeatColor = (seat, zona, isSelected, selectedSeats = [], lockedSeats = []) => {
    const seatId = seat._id || seat.id;
    const isSelectedByMe = selectedSeats.includes(seatId);
    
    // Obtener el session_id actual
    const currentSessionId = localStorage.getItem('anonSessionId') || 'unknown';
    
    // Verificar si está bloqueado/seleccionado por otro usuario
    const lockInfo = lockedSeats.find(lock => lock.seat_id === seatId);
    const isLockedByOther = lockInfo && lockInfo.session_id !== currentSessionId;
    const isSelectedByOther = lockInfo && lockInfo.session_id !== currentSessionId && 
                             (lockInfo.status === 'seleccionado' || lockInfo.status === 'selected');
    
    // Debug: mostrar qué estado está recibiendo
    console.log(`🎨 [useSeatColors] Asiento ${seatId}:`, {
      estado: seat.estado,
      isSelectedByMe,
      isLockedByOther,
      isSelectedByOther,
      lockInfo,
      currentSessionId,
      selectedSeats: selectedSeats.length
    });
    
    // SISTEMA DE COLORES UNIFICADO
    if (isSelectedByMe) {
      console.log(`🎨 [useSeatColors] ${seatId} -> Selected Me (${eventTheme.seatSelectedMe})`);
      return eventTheme.seatSelectedMe || '#3b82f6';
    } else if (isSelectedByOther) {
      console.log(`🎨 [useSeatColors] ${seatId} -> Selected Other (${eventTheme.seatSelectedOther})`);
      return eventTheme.seatSelectedOther || '#eab308';
    } else if (seat.estado === 'seleccionado_por_otro' || isLockedByOther) {
      console.log(`🎨 [useSeatColors] ${seatId} -> Blocked (${eventTheme.seatBlocked})`);
      return eventTheme.seatBlocked || '#ef4444';
    } else if (seat.estado === 'vendido') {
      console.log(`🎨 [useSeatColors] ${seatId} -> Sold (${eventTheme.seatSold})`);
      return eventTheme.seatSold || '#6b7280';
    } else if (seat.estado === 'reservado') {
      console.log(`🎨 [useSeatColors] ${seatId} -> Reserved (${eventTheme.seatReserved})`);
      return eventTheme.seatReserved || '#722ed1';
    } else {
      // 🎨 Color de la zona = Disponible
      console.log(`🎨 [useSeatColors] ${seatId} -> Available (${eventTheme.seatAvailable})`);
      return zona?.color || eventTheme.seatAvailable || '#4CAF50';
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
