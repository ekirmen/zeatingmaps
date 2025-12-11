import { useState, useCallback } from 'react';
import logger from '../utils/logger';

/**
 * Hook para manejar operaciones asíncronas con estados de loading, error y data
 * @param {Function} asyncFunction - Función asíncrona a ejecutar

 * @returns {Object} { data, loading, error, execute, reset }
 */
export const useAsyncOperation = (asyncFunction, options = {}) => {
  const {
    immediate = false,
    onSuccess,
    onError,
    initialData = null
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await asyncFunction(...args);
      
      setData(result);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Error en operación asíncrona';
      logger.error('Error in useAsyncOperation:', err);
      setError(errorMessage);
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [asyncFunction, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setLoading(false);
  }, [initialData]);

  return { data, loading, error, execute, reset };
};

/**
 * Hook para operaciones de fetch con tenant_id automático
 * @param {string} tableName - Nombre de la tabla
 * @param {Object} options - Opciones de configuración
 * @returns {Object} { data, loading, error, refetch }
 */
export const useTenantData = (tableName, options = {}) => {
  const { 
    filters = {}, 
    select = '*', 
    orderBy, 
    ascending = true,
    immediate = true 
  } = options;

  // Nota: useTenantData ahora usa useSupabaseQuery
  // Este hook se mantiene para compatibilidad pero se recomienda usar useSupabaseQuery directamente
  // Re-exportar useSupabaseQuery para mantener compatibilidad
  const { useSupabaseQuery } = require('./useSupabaseQuery');
  return useSupabaseQuery(tableName, options);
};
