import React, { createContext, useContext, useState, useCallback } from 'react';

// Crear el contexto
const FooterContext = createContext();

// Provider Component
export const FooterProvider = ({ children }) => {
  const [footerVisible, setFooterVisible] = useState(true);
  const [footerContent, setFooterContent] = useState(null);
  const [footerHeight, setFooterHeight] = useState(0);
  const [footerStyle, setFooterStyle] = useState({});
  const [footerClassName, setFooterClassName] = useState('');

  // Mostrar/ocultar footer
  const showFooter = useCallback(() => {
    setFooterVisible(true);
  }, []);

  const hideFooter = useCallback(() => {
    setFooterVisible(false);
  }, []);

  // Establecer contenido personalizado
  const setCustomFooter = useCallback(content => {
    setFooterContent(content);
  }, []);

  // Actualizar altura del footer
  const updateFooterHeight = useCallback(height => {
    setFooterHeight(height);
  }, []);

  // Actualizar estilo del footer
  const updateFooterStyle = useCallback(style => {
    setFooterStyle(prev => ({ ...prev, ...style }));
  }, []);

  // Actualizar clase CSS del footer
  const updateFooterClassName = useCallback(className => {
    setFooterClassName(className);
  }, []);

  // Resetear a valores por defecto
  const resetFooter = useCallback(() => {
    setFooterVisible(true);
    setFooterContent(null);
    setFooterHeight(0);
    setFooterStyle({});
    setFooterClassName('');
  }, []);

  // Valores que estarán disponibles en el contexto
  const value = {
    // Estado
    footerVisible,
    footerContent,
    footerHeight,
    footerStyle,
    footerClassName,

    // Métodos
    showFooter,
    hideFooter,
    setCustomFooter,
    updateFooterHeight,
    updateFooterStyle,
    updateFooterClassName,
    resetFooter,

    // Helper methods
    isFooterVisible: footerVisible,
    hasCustomContent: !!footerContent,
  };

  return <FooterContext.Provider value={value}>{children}</FooterContext.Provider>;
};

// Hook personalizado para usar el contexto
export const useFooter = () => {
  const context = useContext(FooterContext);

  if (!context) {
    throw new Error('useFooter debe ser usado dentro de un FooterProvider');
  }

  return context;
};

export default FooterContext;
