import React, { createContext, useContext, useState, useEffect } from 'react';

const defaultColors = {
  headerBg: '#ffffff',
  headerText: '#000000',
  primary: '#e94243',
  btnPrimaryText: '#ffffff'
};

const ThemeContext = createContext({
  theme: defaultColors,
  updateTheme: () => {}
});

export const ThemeProvider = ({ children }) => {
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
