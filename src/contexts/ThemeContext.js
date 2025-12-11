import React, { createContext, useContext, useState, useEffect } from 'react';

// Crear el contexto
const ThemeContext = createContext();

// Provider Component
export const ThemeProvider = ({ children }) => {
  // Estado para el tema actual
  const [theme, setTheme] = useState('light');
  const [primaryColor, setPrimaryColor] = useState('#1890ff');
  const [secondaryColor, setSecondaryColor] = useState('#52c41a');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Cargar tema guardado al iniciar
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedPrimaryColor = localStorage.getItem('primaryColor');
    const savedSecondaryColor = localStorage.getItem('secondaryColor');
    const savedDarkMode = localStorage.getItem('darkMode');

    if (savedTheme) {
      setTheme(savedTheme);
    }
    if (savedPrimaryColor) {
      setPrimaryColor(savedPrimaryColor);
    }
    if (savedSecondaryColor) {
      setSecondaryColor(savedSecondaryColor);
    }
    if (savedDarkMode) {
      setIsDarkMode(savedDarkMode === 'true');
    }

    // Verificar preferencia del sistema
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (!savedTheme && prefersDark) {
      setTheme('dark');
      setIsDarkMode(true);
    }
  }, []);

  // Aplicar tema al documento
  useEffect(() => {
    // Guardar en localStorage
    localStorage.setItem('theme', theme);
    localStorage.setItem('primaryColor', primaryColor);
    localStorage.setItem('secondaryColor', secondaryColor);
    localStorage.setItem('darkMode', isDarkMode);

    // Aplicar clases CSS al documento
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark-mode', isDarkMode);
    
    // Aplicar variables CSS personalizadas
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    document.documentElement.style.setProperty('--secondary-color', secondaryColor);
    
    // Para compatibilidad con Ant Design
    if (isDarkMode) {
      document.body.classList.add('ant-dark');
      document.body.classList.remove('ant-light');
    } else {
      document.body.classList.add('ant-light');
      document.body.classList.remove('ant-dark');
    }
  }, [theme, primaryColor, secondaryColor, isDarkMode]);

  // Cambiar entre temas claro/oscuro
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setIsDarkMode(newTheme === 'dark');
  };

  // Establecer tema específico
  const setThemeMode = (mode) => {
    setTheme(mode);
    setIsDarkMode(mode === 'dark');
  };

  // Actualizar colores principales
  const updateColors = ({ primary, secondary }) => {
    if (primary) {
      setPrimaryColor(primary);
    }
    if (secondary) {
      setSecondaryColor(secondary);
    }
  };

  // Restablecer a valores por defecto
  const resetTheme = () => {
    setTheme('light');
    setPrimaryColor('#1890ff');
    setSecondaryColor('#52c41a');
    setIsDarkMode(false);
  };

  // Valores que estarán disponibles en el contexto
  const value = {
    // Estado
    theme,
    primaryColor,
    secondaryColor,
    isDarkMode,
    
    // Métodos
    toggleTheme,
    setThemeMode,
    updateColors,
    resetTheme,
    
    // Helper methods
    isDark: theme === 'dark',
    isLight: theme === 'light',
    
    // Para Ant Design
    antdTheme: {
      token: {
        colorPrimary: primaryColor,
        colorSuccess: secondaryColor,
        colorInfo: primaryColor,
        colorWarning: '#faad14',
        colorError: '#ff4d4f',
      },
      algorithm: isDarkMode ? 'darkAlgorithm' : 'defaultAlgorithm',
    }
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
  }
  
  return context;
};

export default ThemeContext;