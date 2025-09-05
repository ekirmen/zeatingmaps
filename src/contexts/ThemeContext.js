import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useTenant } from './TenantContext';

// Inline functions to avoid circular dependency
const getTenantThemeSettings = async (tenantId) => {
  if (!tenantId) return null;
  const { data, error } = await supabase
    .from('tenant_theme_settings')
    .select('theme')
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (error) {
    console.warn('[themeSettings] get error', error);
    return null;
  }
  return data?.theme || null;
};

class EventThemeService {
  static async getEventThemeSettings(eventId, tenantId) {
    try {
      const { data, error } = await supabase
        .from('event_theme_settings')
        .select('*')
        .eq('event_id', eventId)
        .eq('tenant_id', tenantId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[EventThemeService] Error getting event theme:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[EventThemeService] Error getting event theme:', error);
      return null;
    }
  }

  static async getEventThemeOrDefault(eventId, tenantId, defaultTheme) {
    try {
      const eventTheme = await this.getEventThemeSettings(eventId, tenantId);
      return eventTheme?.theme || defaultTheme;
    } catch (error) {
      console.warn('[EventThemeService] Error getting event theme, using default:', error);
      return defaultTheme;
    }
  }
}

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
  seatReserved: '#722ed1'
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
