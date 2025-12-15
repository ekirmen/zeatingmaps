// Configuración centralizada de Supabase
// Este archivo asegura que solo se cree una instancia de Supabase en toda la aplicación

import { createClient } from '@supabase/supabase-js';

// Variables de entorno
const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey =
  process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.REACT_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

// Verificar variables de entorno
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[SUPABASE CONFIG] Error: Variables de entorno faltantes:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey,
  });
}

// Función para crear cliente con configuración optimizada
const createOptimizedClient = (url, key, options = {}) => {
  if (!url || !key) {
    return null;
  }

  const {
    auth: authOptions = {},
    global: globalOptions = {},
    storageKey: storageKeyOption,
    ...restOptions
  } = options;

  const storageKey = storageKeyOption || authOptions.storageKey || 'supabase-auth-token';
  const customHeaders = globalOptions.headers || {};

  // Asegurar que TODAS las peticiones lleven el apiKey de Supabase
  const withApiKeyHeaders = {
    apikey: key,
    Authorization: customHeaders.Authorization || `Bearer ${key}`,
    'X-Client-Info': 'zeatingmaps-web',
    ...customHeaders,
  };

  const mergeHeaders = (baseHeaders = {}, overrideHeaders = {}) => {
    const merged = new Headers(baseHeaders);
    const overrides =
      overrideHeaders instanceof Headers ? overrideHeaders : new Headers(overrideHeaders);

    overrides.forEach((value, header) => {
      merged.set(header, value);
    });

    return merged;
  };

  // En algunos entornos (ej. navegadores con proxies) los headers globales no siempre se aplican.
  // Reemplazamos fetch para inyectar el apikey en cada request y evitar el error 406.
  const patchedFetch = async (input, init = {}) => {
    const headers = mergeHeaders(withApiKeyHeaders, init.headers);

    if (!headers.has('apikey')) headers.set('apikey', key);
    if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${key}`);
    if (!headers.has('Accept')) headers.set('Accept', 'application/json');

    const method = (init.method || 'GET').toUpperCase();
    if (!['GET', 'HEAD'].includes(method) && init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    return (globalOptions.fetch || fetch)(input, {
      ...init,
      headers,
    });
  };

  return createClient(url, key, {
    ...restOptions,
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey,
      ...authOptions,
    },
    global: {
      ...globalOptions,
      fetch: patchedFetch,
      headers: withApiKeyHeaders,
    },
  });
};

// Singleton pattern usando variables de módulo
let _clientInstance = null;
let _adminInstance = null;

// Función para obtener o crear el cliente principal
export const getSupabaseClient = () => {
  // Solo crear la instancia si no existe
  if (!_clientInstance) {
    _clientInstance = createOptimizedClient(supabaseUrl, supabaseAnonKey);
  }
  return _clientInstance;
};

// Función para obtener o crear el cliente admin
export const getSupabaseAdminClient = () => {
  // Evitar crear la instancia en el navegador
  if (typeof window !== 'undefined') {
    return null;
  }

  if (!serviceRoleKey) {
    return null;
  }

  // Solo crear la instancia si no existe
  if (!_adminInstance) {
    _adminInstance = createOptimizedClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      storageKey: 'supabase-admin-token',
    });
  }
  return _adminInstance;
};

// Crear las instancias inmediatamente y exportarlas
const supabase = getSupabaseClient();
// Solo crear el cliente admin en entorno servidor
const supabaseAdmin = typeof window === 'undefined' ? getSupabaseAdminClient() : null;

// Exportar las instancias
export { supabase, supabaseAdmin };
