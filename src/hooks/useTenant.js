import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import logger from '../utils/logger';

// Cache para tenant_id (evita múltiples consultas en la misma sesión)
let tenantIdCache = null;
let tenantIdCacheTimestamp = null;
const TENANT_ID_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Hook para obtener el tenant_id del usuario autenticado con cache

 * @returns {Object} { tenantId, loading, error, refresh }
 */
export const useTenant = (useCache = true) => {
  const [tenantId, setTenantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getTenantId = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Verificar cache si no es forzado
      if (useCache && !forceRefresh && tenantIdCache && tenantIdCacheTimestamp) {
        const now = Date.now();
        if (now - tenantIdCacheTimestamp < TENANT_ID_CACHE_TTL) {
          setTenantId(tenantIdCache);
          setLoading(false);
          return tenantIdCache;
        }
      }

      // Obtener usuario autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Usuario no autenticado');
      }

      // Obtener tenant_id del perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.tenant_id) {
        throw new Error('Usuario sin tenant_id válido');
      }

      // Actualizar cache y estado
      tenantIdCache = profile.tenant_id;
      tenantIdCacheTimestamp = Date.now();
      setTenantId(profile.tenant_id);

      return profile.tenant_id;
    } catch (err) {
      const errorMessage = err.message || 'Error al obtener tenant_id';
      logger.error('Error in useTenant:', err);
      setError(errorMessage);
      setTenantId(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [useCache]);

  const refresh = useCallback(() => {
    tenantIdCache = null;
    tenantIdCacheTimestamp = null;
    return getTenantId(true);
  }, [getTenantId]);

  useEffect(() => {
    getTenantId().catch(() => {
      // Error ya manejado en getTenantId
    });
  }, [getTenantId]);

  return { tenantId, loading, error, refresh };
};

/**
 * Limpia el cache del tenant_id
 */
export const clearTenantCache = () => {
  tenantIdCache = null;
  tenantIdCacheTimestamp = null;
};

