import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useTenant } from './TenantContext';
import { getTenantThemeSettings } from '../backoffice/services/themeSettingsService';
import { EventThemeService } from '../backoffice/services/eventThemeService';

const defaultColors = {
  headerBg: '#ffffff',
  headerText: '#000000',
  primary: '#e94243',
  btnPrimaryText: '#ffffff',
  // Seat status colors (configurable in WebColors)
  seatAvailable: '#4CAF50',
  seatSelectedMe: '#1890ff',
  seatSelectedOther: '#faad14',
  seatBlocked: '#ff4d4f',
  seatSold: '#8c8c8c',
  seatReserved: '#722ed1',
  seatCancelled: '#ff6b6b'
};

const ThemeContext = createContext({
  theme: defaultColors,
  updateTheme: () => {}
});

export const ThemeProvider = ({ children }) => {
  const { currentTenant } = useTenant() || {};
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('themeColors');
    return saved ? { ...defaultColors, ...JSON.parse(saved) } : defaultColors;
  });

  useEffect(() => {
    Object.entries(theme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value);
    });
    localStorage.setItem('themeColors', JSON.stringify(theme));
  }, [theme]);

  // Cargar tema del tenant desde Supabase solo una vez al inicio, sin interferir con realtime
  useEffect(() => {
    // Solo ejecutar si no hay tema guardado y hay un tenant
    const hasLocalTheme = localStorage.getItem('themeColors');
    if (hasLocalTheme || !currentTenant?.id) return;
    
    // Usar setTimeout para no bloquear el render inicial
    const timer = setTimeout(async () => {
      try {
        const remote = await getTenantThemeSettings(currentTenant.id);
        if (remote && typeof remote === 'object') {
          setTheme(prev => ({ ...prev, ...remote }));
        }
      } catch (e) {
        console.warn('[ThemeContext] Error loading remote theme:', e);
      }
    }, 2000); // Esperar 2 segundos para no interferir con la carga inicial
    
    return () => clearTimeout(timer);
  }, [currentTenant?.id]);

  const updateTheme = updates => {
    setTheme(prev => ({ ...prev, ...updates }));
  };

  const getEventTheme = async (eventId) => {
    if (!currentTenant?.id || !eventId) return theme;
    
    try {
      const eventTheme = await EventThemeService.getEventThemeOrDefault(eventId, currentTenant.id, theme);
      return eventTheme;
    } catch (error) {
      console.warn('[ThemeContext] Error getting event theme:', error);
      return theme;
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, getEventTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
