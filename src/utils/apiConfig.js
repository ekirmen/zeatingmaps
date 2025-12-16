// Configuración de la API para sistema.veneventos.com
const getApiConfig = () => {
  return {
    baseUrl: process.env.REACT_APP_API_BASE_URL || 'https://sistema.veneventos.com',
    apiPath: process.env.REACT_APP_API_PATH || '/api'
  };
};

export const apiConfig = getApiConfig();

// Función para construir URLs absolutas de API
export const buildApiUrl = (endpoint, cfg = apiConfig) => {
  const baseUrl = cfg.baseUrl || '';
  const apiPath = cfg.apiPath || '';
  const cleanEndpoint = String(endpoint || '').startsWith('/') ? String(endpoint).slice(1) : String(endpoint);
  return `${baseUrl.replace(/\/$/, '')}${apiPath}/${cleanEndpoint}`;
};

// Función para construir URLs relativas (para Vercel)
export const buildRelativeApiUrl = (endpoint) => {
  const cleanEndpoint = String(endpoint || '').startsWith('/') ? String(endpoint).slice(1) : String(endpoint);
  return `/api/${cleanEndpoint}`;
};

// Función para verificar la conectividad a una URL (fetch conservador)
export const checkConnectivity = async (testUrl) => {
  try {
    if (typeof fetch === 'undefined') return { success: false, error: 'fetch not available' };
    const response = await fetch(testUrl, {
      method: 'GET',
      mode: 'cors',
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    if (response.ok) {
      let data = null;
      try { data = await response.json(); } catch (e) { data = null; }
      return { success: true, data };
    }
    return { success: false, error: `${response.status}: ${response.statusText}` };
  } catch (error) {
    return { success: false, error: String(error.message || error) };
  }
};

// Función para diagnosticar problemas de configuración
export const diagnoseConfig = () => {
  const issues = [];
  if (!process.env.NODE_ENV) issues.push('NODE_ENV no está definido');
  if (process.env.NODE_ENV === 'production' && !process.env.REACT_APP_VERCEL_ENV) {
    issues.push('VERCEL_ENV no está definido en producción');
  }
  const config = getApiConfig();
  if (!config.baseUrl) issues.push('baseUrl no está definido');
  if (!config.apiPath) issues.push('apiPath no está definido');
  return { hasIssues: issues.length > 0, issues };
};

export default apiConfig;
