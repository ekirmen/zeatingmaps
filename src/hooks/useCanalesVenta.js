import { useState, useEffect } from 'react';
import { fetchCanalesVenta, isCanalVentaActivo, getCanalVentaByUrl } from '../services/canalVentaService';

/**
 * Hook personalizado para manejar canales de venta
 */
export 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar canales de venta
  const loadCanales = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCanalesVenta();
      setCanales(data);
    } catch (err) {
      setError(err.message);
      console.error('Error cargando canales de venta:', err);
    } finally {
      setLoading(false);
    }
  };

  // Verificar si un canal específico está activo
  const verificarCanalActivo = async (canalId) => {

      return await isCanalVentaActivo(canalId);
    } catch (err) {
      console.error('Error verificando canal activo:', err);
      return false;
    }
  };

  // Obtener canal por URL actual
  const obtenerCanalPorUrl = async (url) => {
    try {
      return await getCanalVentaByUrl(url);
    } catch (err) {
      console.error('Error obteniendo canal por URL:', err);
      return null;
    }
  };

  // Cargar canales al montar el componente
  useEffect(() => {
    loadCanales();
  }, []);

  return {
    canales,
    loading,
    error,
    loadCanales,
    verificarCanalActivo,
    obtenerCanalPorUrl,
    // Helpers útiles
    canalesActivos: canales.filter(c => c.activo),
    canalesInactivos: canales.filter(c => !c.activo),
    totalCanales: canales.length
  };
};

/**
 * Hook específico para verificar si las ventas están habilitadas en el canal actual
 */
export 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verificar = async () => {
      if (!canalId) {
        setHabilitado(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const activo = await isCanalVentaActivo(canalId);
        setHabilitado(activo);
      } catch (err) {
        console.error('Error verificando ventas habilitadas:', err);
        setHabilitado(false);
      } finally {
        setLoading(false);
      }
    };

    verificar();
  }, [canalId]);

  return { habilitado, loading };
};
