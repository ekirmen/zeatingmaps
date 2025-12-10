import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCanalVentaByUrl } from '../services/canalVentaService';

const CanalVentaContext = createContext();

export const CanalVentaProvider = ({ children }) => {
  const [canalActual, setCanalActual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Detectar automáticamente el canal de venta basado en la URL actual
  useEffect(() => {
    const detectarCanal = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener la URL actual
        const urlActual = window.location.href;
        // Intentar obtener el canal por URL
        const canal = await getCanalVentaByUrl(urlActual);

        if (canal) {
          setCanalActual(canal);
        } else {
          setCanalActual(null);
        }
      } catch (err) {
        console.error('Error detectando canal de venta:', err);
        setError(err.message);
        setCanalActual(null);
      } finally {
        setLoading(false);
      }
    };

    detectarCanal();

    // Escuchar cambios en la URL (navegación SPA)
    const handleUrlChange = () => {
      detectarCanal();
    };

    // Agregar listener para cambios de URL
    window.addEventListener('popstate', handleUrlChange);

    // Para aplicaciones SPA, también escuchar cambios de ruta
    if (window.history && window.history.pushState) {
      const originalPushState = window.history.pushState;
      window.history.pushState = function(...args) {
        originalPushState.apply(this, args);
        setTimeout(detectarCanal, 100); // Pequeño delay para asegurar que la URL se actualice
      };
    }

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  // Función para establecer manualmente el canal
  const establecerCanal = (canal) => {
    setCanalActual(canal);
  };

  // Función para limpiar el canal
  const limpiarCanal = () => {
    setCanalActual(null);
  };

  // Función para verificar si un canal específico está activo
  const esCanalActivo = (canalId) => {
    if (!canalActual) return false;
    return canalActual.id === canalId && canalActual.activo === true;
  };

  // Función para verificar si las ventas están habilitadas en el canal actual
  const ventasHabilitadas = () => {
    return canalActual && canalActual.activo === true;
  };

  const value = {
    canalActual,
    loading,
    error,
    establecerCanal,
    limpiarCanal,
    esCanalActivo,
    ventasHabilitadas,
    // Helpers útiles
    esStore: canalActual?.url?.includes('/store/'),
    esBackoffice: canalActual?.url?.includes('/dashboard/'),
    esTest: canalActual?.url?.includes('/test/'),
    nombreCanal: canalActual?.nombre || 'Desconocido'
  };

  return (
    <CanalVentaContext.Provider value={value}>
      {children}
    </CanalVentaContext.Provider>
  );
};

export const useCanalVenta = () => {
  const context = useContext(CanalVentaContext);
  if (!context) {
    throw new Error('useCanalVenta must be used within a CanalVentaProvider');
  }
  return context;
};

// Hook específico para verificar si las ventas están habilitadas
export const useVentasHabilitadas = () => {
  const { ventasHabilitadas, loading } = useCanalVenta();
  return { habilitado: ventasHabilitadas(), loading };
};
