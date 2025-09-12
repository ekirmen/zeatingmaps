import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';

/**
 * Componente de seguridad para manejar parámetros sensibles en la URL
 * Previene la exposición de credenciales en logs, historial del navegador, etc.
 */
const SecurityHandler = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Verificar si hay parámetros sensibles en la URL
    const urlParams = new URLSearchParams(location.search);
    const sensitiveParams = ['email', 'password', 'token', 'key', 'secret'];
    
    const hasSensitiveData = sensitiveParams.some(param => urlParams.has(param));
    
    if (hasSensitiveData) {
      // Mostrar advertencia de seguridad
      message.warning({
        content: '⚠️ Detectados parámetros sensibles en la URL. Por seguridad, estos serán removidos.',
        duration: 5,
      });

      // Crear nueva URL sin parámetros sensibles
      const cleanParams = new URLSearchParams();
      urlParams.forEach((value, key) => {
        if (!sensitiveParams.includes(key)) {
          cleanParams.set(key, value);
        }
      });

      // Construir nueva URL limpia
      const newSearch = cleanParams.toString();
      const newUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ''}`;
      
      // Reemplazar la URL actual sin parámetros sensibles
      window.history.replaceState({}, '', newUrl);
      
      // Log de seguridad (sin datos sensibles)
      console.warn('🚨 SECURITY WARNING: Sensitive parameters detected and removed from URL');
    }
  }, [location, navigate]);

  return <>{children}</>;
};

export default SecurityHandler;
