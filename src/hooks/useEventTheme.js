import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Hook personalizado para obtener colores de tema específicos de un evento

 * @returns {Object} Colores del tema del evento o colores globales por defecto
 */
export const useEventTheme = (eventId) => {
  const [eventTheme, setEventTheme] = useState(theme);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setEventTheme(theme);
      return;
    }

    const loadEventTheme = async () => {
      setLoading(true);
      try {
        const eventColors = await getEventTheme(eventId);
        setEventTheme(eventColors);
      } catch (error) {
        setEventTheme(theme);
      } finally {
        setLoading(false);
      }
    };

    loadEventTheme();
  }, [eventId, theme, getEventTheme]);

  return {
    theme: eventTheme,
    loading,
    isEventSpecific: eventId && eventTheme !== theme
  };
};
