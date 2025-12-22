// Hook compartido para manejar colores automáticos de asientos
// Se usa en Store, Boletería y Crear Mapa

import { useTheme } from '../contexts/ThemeContext';
import { useState, useEffect, useMemo } from 'react';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const normalizeHex = (color) => {
  if (typeof color !== 'string') return null;
  const trimmed = color.trim();
  if (!trimmed.startsWith('#')) return null;

  const hex = trimmed.slice(1);
  if (hex.length === 3) {
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toLowerCase();
  }

  if (hex.length === 6) {
    return `#${hex.toLowerCase()}`;
  }

  return null;
};

const darkenHexColor = (color, amount = 0.25) => {
  const normalized = normalizeHex(color);
  if (!normalized) {
    return color || '#2d3748';
  }

  const factor = clamp(amount, 0, 1);
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);

  const toHex = (value) => {
    const hex = clamp(Math.round(value), 0, 255).toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };

  const darkenChannel = (channel) => channel * (1 - factor);

  return `#${toHex(darkenChannel(r))}${toHex(darkenChannel(g))}${toHex(darkenChannel(b))}`;
};

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

  // Cache session_id to avoid localStorage access on every seat render
  const currentSessionId = useMemo(() => {
    if (typeof window === 'undefined') return 'unknown';
    const rawSessionId = localStorage.getItem('anonSessionId');
    return rawSessionId
      ? rawSessionId.trim().toLowerCase().replace(/^["']|["']$/g, '')
      : 'unknown';
  }, []);

  // Función para obtener el color automático de un asiento
  const getSeatColor = (seat, zona, isSelected, selectedSeats = [], lockedSeats = [], seatStates = null) => {
    const seatId = seat._id || seat.id;
    const isSelectedByMe = selectedSeats instanceof Set
      ? selectedSeats.has(seatId)
      : Array.isArray(selectedSeats) && selectedSeats.includes(seatId);

    // Verificar si hay un estado actualizado en el store (tiempo real) - PRIORIDAD MÁXIMA
    // seatStates puede ser un Map o un objeto
    const storeState = seatStates instanceof Map
      ? seatStates.get(seatId)
      : seatStates?.[seatId];
    if (storeState) {
      // Usando estado del store para asiento

      // Usar el estado del store para determinar el color
      switch (storeState) {
        case 'vendido':
        case 'pagado':
        case 'completed':
          // Verificar si fue pagado por el mismo cliente
          const lockInfo = Array.isArray(lockedSeats) ? lockedSeats.find(lock => lock.seat_id === seatId) : null;
          if (lockInfo && lockInfo.session_id === currentSessionId) {
            return '#6b7280'; // Gris para asientos pagados por el mismo cliente
          }
          return eventTheme.seatSold || '#2d3748'; // Negro para vendido por otros
        case 'reservado':
          return eventTheme.seatReserved || '#805ad5'; // Púrpura para reservado
        case 'anulado':
          return eventTheme.seatCancelled || '#e53e3e'; // Rojo para anulado
        case 'seleccionado':
          return eventTheme.seatSelectedMe || '#ffd700'; // Amarillo brillante para seleccionado por mí
        case 'seleccionado_por_otro':
          return eventTheme.seatSelectedOther || '#2196F3'; // Azul para seleccionado por otro
        case 'locked':
          return eventTheme.seatBlocked || '#f56565'; // Rojo para bloqueado permanentemente
        default:
          // Si no hay estado específico, usar el color por defecto
          return '#4CAF50'; // Verde para disponible
      }
    }

    // Si no hay estado en el store, conservar el estado original del asiento en lugar de forzar disponible
    // Esto evita que asientos 'reservado' o 'vendido' se muestren como disponibles por falta de seatStates
    const hasStateInStore = seatStates instanceof Map
      ? seatStates.has(seatId)
      : seatStates && seatId in seatStates;
    if (seatStates && !hasStateInStore) {
      // Respetar estados persistentes del asiento
      if (seat.estado === 'vendido' || seat.estado === 'pagado' || seat.estado === 'completed') {
        return eventTheme.seatSold || '#2d3748';
      }
      if (seat.estado === 'reservado') {
        return eventTheme.seatReserved || '#805ad5';
      }
      if (seat.estado === 'anulado') {
        return eventTheme.seatCancelled || '#e53e3e';
      }
      if (seat.estado === 'locked') {
        return eventTheme.seatBlocked || '#f56565';
      }
      // Si no hay estado persistente, usar disponible
      return '#4CAF50';
    }

    // Fallback a la lógica original si no hay estado en el store
    // Verificar si está bloqueado/seleccionado por otro usuario
    const lockInfo = Array.isArray(lockedSeats) ? lockedSeats.find(lock => lock.seat_id === seatId) : null;
    const isLockedByOther = lockInfo && lockInfo.session_id !== currentSessionId;

    // Distinguir entre locked permanente y seleccionado temporal
    const isPermanentlyLocked = lockInfo && lockInfo.status === 'locked';
    const isTemporarilySelected = lockInfo && lockInfo.status === 'seleccionado';
    const isSelectedByOther = lockInfo && lockInfo.session_id !== currentSessionId &&
      (lockInfo.status === 'seleccionado' || lockInfo.status === 'selected');

    // SISTEMA DE COLORES UNIFICADO - PRIORIDAD CORRECTA
    // 1. VENDIDO (máxima prioridad) - desde seat_locks o estado del asiento
    if (lockInfo?.status === 'vendido' || seat.estado === 'vendido' || seat.estado === 'pagado' || lockInfo?.status === 'completed') {
      // Verificar si fue pagado por el mismo cliente
      if (lockInfo && lockInfo.session_id === currentSessionId) {
        return '#6b7280'; // Gris para asientos pagados por el mismo cliente
      }
      return eventTheme.seatSold || '#2d3748'; // Negro para vendido por otros
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
      return eventTheme.seatBlocked || '#f56565'; // Rojo para asientos bloqueados permanentemente
    }

    // 5. SELECCIONADO POR OTRO USUARIO (temporal) - PRIORIDAD ALTA
    if (isSelectedByOther && !isPermanentlyLocked) {
      return eventTheme.seatSelectedOther || '#2196F3'; // Azul para seleccionado por otro
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
      '#ffd700', // Amarillo
      '#795548', // Marrón
    ];

    return defaultColors[index % defaultColors.length];
  };

  // Función para obtener el color de selección
  const getSelectionColor = (isSelected) => {
    return isSelected ? (theme.seatSelectedMe || '#ffd700') : 'transparent';
  };

  // Función para obtener el color de borde
  const getBorderColor = (arg1 = false, arg2 = null, arg3 = null) => {
    let isSelected = false;
    let zona = null;
    let seatColor = null;

    if (typeof arg1 === 'object' && arg1 !== null && !Array.isArray(arg1)) {
      isSelected = Boolean(arg1.isSelected);
      zona = arg1.zona || null;
      seatColor = arg1.seatColor || null;
    } else {
      if (typeof arg1 === 'boolean') {
        isSelected = arg1;
        zona = arg2 && typeof arg2 === 'object' ? arg2 : null;
        seatColor = typeof arg2 === 'string' ? arg2 : arg3;
      } else {
        zona = arg1 && typeof arg1 === 'object' ? arg1 : null;
        seatColor = typeof arg1 === 'string' && normalizeHex(arg1)
          ? arg1
          : typeof arg2 === 'string'
            ? arg2
            : arg3;
        isSelected = typeof arg2 === 'boolean' ? arg2 : false;
      }
    }

    if (isSelected) {
      return theme.seatSelectedMe || '#ffd700';
    }

    const baseColor = seatColor || zona?.color;
    if (!baseColor) {
      return '#2d3748';
    }

    return darkenHexColor(baseColor, 0.25);
  };

  return {
    getSeatColor,
    getZonaColor,
    getSelectionColor,
    getBorderColor,
  };
};

export default useSeatColors;
