const FALLBACK_TENANT_BY_HOST = {
  'sistema.veneventos.com': '9dbdb86f-8424-484c-bb76-0d9fa27573c8',
};

const readFromLocalStorage = (key) => {

  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    return null;
  }
};

const writeToLocalStorage = (key, value) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    if (value) {
      window.localStorage.setItem(key, value);
    } else {
      window.localStorage.removeItem(key);
    }
  } catch (error) {
  }
};

const readFromTenantContext = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const context = window.__TENANT_CONTEXT__;
    if (!context) return null;

    if (typeof context.getTenantId === 'function') {
      return context.getTenantId();
    }

    return context.tenant?.id || null;
  } catch (error) {
    return null;
  }
};

const resolveHostFallback = () => {
  if (typeof window === 'undefined' || !window.location) {
    return null;
  }
  const hostname = window.location.hostname;
  return FALLBACK_TENANT_BY_HOST[hostname] || null;
};

export const resolveTenantId = (preferredId = null) => {
  if (preferredId) {
    return preferredId;
  }

  const storedId = readFromLocalStorage('currentTenantId');
  if (storedId) {
    return storedId;
  }

  const contextId = readFromTenantContext();
  if (contextId) {
    writeToLocalStorage('currentTenantId', contextId);
    return contextId;
  }

  const fallbackId = resolveHostFallback();
  if (fallbackId) {
    return fallbackId;
  }

  return null;
};



export default resolveTenantId;
