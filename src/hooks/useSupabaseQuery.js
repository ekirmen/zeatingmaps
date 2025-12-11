import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useTenant } from './useTenant';
import logger from '../utils/logger';

/**
 * Hook para realizar queries a Supabase con filtrado automático por tenant_id
 * @param {string} tableName - Nombre de la tabla

 * @returns {Object} { data, loading, error, refetch }
 */
export const useSupabaseQuery = (tableName, options = {}) => {
  const {
    filters = {},
    select = '*',
    orderBy,
    ascending = true,
    immediate = true,
    single = false,
    enabled = true
  } = options;

  const { tenantId, loading: tenantLoading, error: tenantError } = useTenant();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!enabled || !tenantId || !tableName) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from(tableName)
        .select(select)
        .eq('tenant_id', tenantId);

      // Aplicar filtros adicionales
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      // Aplicar ordenamiento
      if (orderBy) {
        query = query.order(orderBy, { ascending });
      }

      // Ejecutar query
      const result = single 
        ? await query.single()
        : await query;

      if (result.error) {
        throw new Error(result.error.message || `Error fetching ${tableName}`);
      }

      setData(result.data);
      return result.data;
    } catch (err) {
      const errorMessage = err.message || `Error fetching ${tableName}`;
      logger.error(`Error in useSupabaseQuery(${tableName}):`, err);
      setError(errorMessage);
      setData(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tableName, tenantId, filters, select, orderBy, ascending, single, enabled]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (immediate && enabled && tenantId) {
      fetchData().catch(() => {
        // Error ya manejado en fetchData
      });
    }
  }, [immediate, enabled, tenantId, fetchData]);

  return {
    data,
    loading: loading || tenantLoading,
    error: error || tenantError,
    refetch
  };
};

/**
 * Hook para operaciones CRUD con tenant automático
 */
export const useSupabaseMutation = (tableName) => {
  const { tenantId, loading: tenantLoading } = useTenant();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(async (data) => {
    if (!tenantId) {
      throw new Error('Tenant ID no disponible');
    }

    try {
      setLoading(true);
      setError(null);

      const recordWithTenant = {
        ...data,
        tenant_id: tenantId
      };

      const { data: result, error: createError } = await supabase
        .from(tableName)
        .insert([recordWithTenant])
        .select()
        .single();

      if (createError) {
        throw new Error(createError.message || `Error creating ${tableName}`);
      }

      return result;
    } catch (err) {
      logger.error(`Error in useSupabaseMutation.create(${tableName}):`, err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tableName, tenantId]);

  const update = useCallback(async (id, data) => {
    if (!tenantId) {
      throw new Error('Tenant ID no disponible');
    }

    try {
      setLoading(true);
      setError(null);

      const recordWithTenant = {
        ...data,
        tenant_id: tenantId
      };

      const { data: result, error: updateError } = await supabase
        .from(tableName)
        .update(recordWithTenant)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message || `Error updating ${tableName}`);
      }

      return result;
    } catch (err) {
      logger.error(`Error in useSupabaseMutation.update(${tableName}):`, err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tableName, tenantId]);

  const remove = useCallback(async (id) => {
    if (!tenantId) {
      throw new Error('Tenant ID no disponible');
    }

    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (deleteError) {
        throw new Error(deleteError.message || `Error deleting ${tableName}`);
      }

      return { success: true };
    } catch (err) {
      logger.error(`Error in useSupabaseMutation.remove(${tableName}):`, err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tableName, tenantId]);

  return {
    create,
    update,
    remove,
    loading: loading || tenantLoading,
    error
  };
};

