import { useState, useCallback } from 'react';

export 
  const [error, setError] = useState(null);

  // Validar venta antes de procesar
  const validateSale = useCallback(async (items, evento, funcion) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/grid-sale/validate-sale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items, evento, funcion })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Error validando venta');
      }

      return result.data;

    } catch (err) {
      console.error('Error validando venta:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Procesar venta completa
  const processSale = useCallback(async (items, evento, funcion, cliente, paymentData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/grid-sale/process-sale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          items, 
          evento, 
          funcion, 
          cliente, 
          paymentData 
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Error procesando venta');
      }

      return result.data;

    } catch (err) {
      console.error('Error procesando venta:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Validar y procesar venta en un solo paso
  const validateAndProcessSale = useCallback(async (items, evento, funcion, cliente, paymentData) => {
    try {
      const validation = await validateSale(items, evento, funcion);
      
      if (!validation.summary.valid_items) {
        throw new Error('Algunos items no son válidos');
      }

      const result = await processSale(items, evento, funcion, cliente, paymentData);
      
      return { validation, result };

    } catch (err) {
      console.error('Error en validación y procesamiento:', err);
      setError(err.message);
      throw err;
    }
  }, [validateSale, processSale]);

  return {
    loading,
    error,
    validateSale,
    processSale,
    validateAndProcessSale,
    clearError: () => setError(null)
  };
};
