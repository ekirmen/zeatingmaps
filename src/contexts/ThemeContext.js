import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useTenant } from './TenantContext';
import { getTenantThemeSettings } from '../backoffice/services/themeSettingsService';

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
  seatSoldReserved: '#8c8c8c'
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

  // Cargar tema del tenant desde Supabase y mezclarlo con localStorage
  useEffect(() => {
    (async () => {
      try {
        const tenantId = currentTenant?.id || localStorage.getItem('currentTenantId');
        if (!tenantId) return;
        const remote = await getTenantThemeSettings(tenantId);
        if (remote && typeof remote === 'object') {
          setTheme(prev => ({ ...prev, ...remote }));
        }
      } catch (e) {
        // Silencioso
      }
    })();
  }, [currentTenant?.id]);

  const updateTheme = updates => {
    setTheme(prev => ({ ...prev, ...updates }));
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
