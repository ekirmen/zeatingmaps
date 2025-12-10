import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import {
  getDomainConfig,
  initializeDomainConfig,
  isLocalhostHostname,
  normalizeHostname,
  resolveTenantContext
} from '../config/domainConfig';
import { persistTenantId, resolveTenantId } from '../utils/tenantUtils';

const TenantContext = createContext();

const STORAGE_KEY = 'zeatingmaps::tenant-context:v1';
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutos

const updateWindowContext = (payload) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.__TENANT_CONTEXT__ = payload;
};

const persistTenantContext = (payload) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const serialized = JSON.stringify({
      ...payload,
      savedAt: Date.now()
    });
    window.localStorage.setItem(STORAGE_KEY, serialized);
    updateWindowContext(JSON.parse(serialized));
  } catch (storageError) {
    updateWindowContext(payload);
  }
};

const clearCachedTenantContext = () => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (storageError) {
  }

  if (window.__TENANT_CONTEXT__) {
    delete window.__TENANT_CONTEXT__;
  }
};

const readCachedTenantContext = (hostname) => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (!parsed?.hostname) {
      return null;
    }

    if (parsed.hostname !== hostname) {
      return null;
    }

    if (Date.now() - parsed.savedAt > CACHE_TTL_MS) {
      return null;
    }

    updateWindowContext(parsed);
    return parsed;
  } catch (error) {
    return null;
  }
};

const getBrowserHostname = () => {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return normalizeHostname(window.location.hostname);
  }

  return 'localhost';
};

export const TenantProvider = ({ children }) => {
  const initialHostname = getBrowserHostname();
  const [currentTenant, setCurrentTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [domainConfig, setDomainConfig] = useState(() => getDomainConfig(initialHostname));

  const detectTenant = useCallback(
    async (options = {}) => {
      const { skipLoadingState = false } = options;

      if (!skipLoadingState) {
        setLoading(true);
      }

      try {
        setError(null);
        await initializeDomainConfig();

        const hostname = getBrowserHostname();

        if (isLocalhostHostname(hostname)) {
          const fallbackConfig = getDomainConfig(hostname);
          setCurrentTenant(null);
          setDomainConfig(fallbackConfig);
          persistTenantContext({ hostname, tenant: null, domainConfig: fallbackConfig });
          return;
        }

        const { tenant, domainConfig: resolvedConfig } = await resolveTenantContext(supabase, hostname);

        if (!tenant) {
          const fallbackConfig = resolvedConfig || getDomainConfig(hostname);
          setCurrentTenant(null);
          setDomainConfig(fallbackConfig);
          persistTenantContext({ hostname, tenant: null, domainConfig: fallbackConfig });
          setError(`No se encontró un tenant activo para ${hostname}`);
          return;
        }

        setCurrentTenant(tenant);
        setDomainConfig(resolvedConfig);
        persistTenantContext({ hostname, tenant, domainConfig: resolvedConfig });
      } catch (caughtError) {
        console.error('❌ Error al detectar tenant:', caughtError);
        setError(`Error inesperado: ${caughtError.message}`);
        const hostname = getBrowserHostname();
        const fallbackConfig = getDomainConfig(hostname);
        setCurrentTenant(null);
        setDomainConfig(fallbackConfig);
        clearCachedTenantContext();
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const hostname = getBrowserHostname();
    const cached = readCachedTenantContext(hostname);

    if (cached) {
      setCurrentTenant(cached.tenant ?? null);
      setDomainConfig(cached.domainConfig ?? getDomainConfig(hostname));
      setLoading(false);
    }

    detectTenant({ skipLoadingState: Boolean(cached) });
  }, [detectTenant]);

  useEffect(() => {
    if (currentTenant?.id) {
      persistTenantId(currentTenant.id);
      return;
    }

    const fallbackTenantId = resolveTenantId();
    if (fallbackTenantId) {
      persistTenantId(fallbackTenantId);
    }
  }, [currentTenant]);

  const value = {
    currentTenant,
    loading,
    error,
    domainConfig,
    refreshTenant: () => detectTenant()
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export const useTenant = () => {
  const context = useContext(TenantContext);

  if (!context) {
    throw new Error('useTenant debe usarse dentro de un TenantProvider');
  }

  return context;
};
