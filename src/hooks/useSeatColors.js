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
    
    // Distinguir entre locked permanente y seleccionado temporal
    const isPermanentlyLocked = lockInfo && lockInfo.status === 'locked';
    const isTemporarilySelected = lockInfo && lockInfo.status === 'seleccionado';
    const isSelectedByOther = lockInfo && lockInfo.session_id !== currentSessionId && 
                             (lockInfo.status === 'seleccionado' || lockInfo.status === 'selected');
    
    // Debug: mostrar qué estado está recibiendo (actualizado con nuevos estados)
    console.log(`🎨 [useSeatColors] Asiento ${seatId}:`, {
      estado: seat.estado,
      isSelectedByMe,
      isLockedByOther,
      isSelectedByOther,
      isPermanentlyLocked,
      isTemporarilySelected,
      lockInfo: lockInfo ? {
        status: lockInfo.status,
        lock_type: lockInfo.lock_type,
        locator: lockInfo.locator,
        expires_at: lockInfo.expires_at,
        session_id: lockInfo.session_id
      } : null,
      currentSessionId,
      selectedSeats: selectedSeats.length,
      zonaInfo: zona ? {
        id: zona.id,
        nombre: zona.nombre,
        color: zona.color
      } : null
    });
    
    // SISTEMA DE COLORES UNIFICADO - PRIORIDAD CORRECTA
    // 1. VENDIDO (máxima prioridad)
    if (seat.estado === 'vendido' || seat.estado === 'pagado') {
      console.log(`🎨 [useSeatColors] ${seatId} -> Sold (${eventTheme.seatSold})`);
      return eventTheme.seatSold || '#8c8c8c';
    }
    
    // 2. RESERVADO
    if (seat.estado === 'reservado') {
      console.log(`🎨 [useSeatColors] ${seatId} -> Reserved (${eventTheme.seatReserved})`);
      return eventTheme.seatReserved || '#722ed1';
    }
    
    // 3. ANULADO
    if (seat.estado === 'anulado') {
      console.log(`🎨 [useSeatColors] ${seatId} -> Cancelled (${eventTheme.seatCancelled || '#ff6b6b'})`);
      return eventTheme.seatCancelled || '#ff6b6b';
    }
    
    // 4. BLOQUEADO PERMANENTEMENTE (desde boleteria)
    if (isPermanentlyLocked || seat.estado === 'locked') {
      console.log(`🎨 [useSeatColors] ${seatId} -> Permanently Locked (${eventTheme.seatBlocked})`);
      return eventTheme.seatBlocked || '#ff4d4f';
    }
    
    // 5. BLOQUEADO POR OTRO USUARIO (temporal)
    if (seat.estado === 'seleccionado_por_otro' || (isLockedByOther && !isPermanentlyLocked)) {
      console.log(`🎨 [useSeatColors] ${seatId} -> Blocked by Other (${eventTheme.seatBlocked})`);
      return eventTheme.seatBlocked || '#ff4d4f';
    }
    
    // 6. SELECCIONADO POR OTRO USUARIO (temporal)
    if (isSelectedByOther && !isPermanentlyLocked) {
      console.log(`🎨 [useSeatColors] ${seatId} -> Selected Other (${eventTheme.seatSelectedOther})`);
      return eventTheme.seatSelectedOther || '#faad14';
    }
    
    // 7. SELECCIONADO POR MÍ (temporal)
    if (isSelectedByMe && !isPermanentlyLocked) {
      console.log(`🎨 [useSeatColors] ${seatId} -> Selected Me (${eventTheme.seatSelectedMe})`);
      return eventTheme.seatSelectedMe || '#1890ff';
    }
    
    // 8. DISPONIBLE (por defecto)
    console.log(`🎨 [useSeatColors] ${seatId} -> Available (${eventTheme.seatAvailable})`);
    return zona?.color || eventTheme.seatAvailable || '#4CAF50';
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
