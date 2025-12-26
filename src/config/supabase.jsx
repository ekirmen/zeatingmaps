// Configuración centralizada de Supabase
// Este archivo asegura que solo se cree una instancia de Supabase en toda la aplicación

import { createClient } from '@supabase/supabase-js'

// Variables de entorno - Vite usa import.meta.env
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  import.meta.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.REACT_APP_SUPABASE_ANON_KEY
const serviceRoleKey =
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
  import.meta.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY ||
  import.meta.env.REACT_SUPABASE_SERVICE_ROLE_KEY

// Verificar variables de entorno
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[SUPABASE CONFIG] Error: Variables de entorno faltantes:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  });
}

// Función auxiliar para validar JWT sin decodificar completamente
const isValidJwtStructure = (token) => {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    return !!payload.sub; // Debe tener 'sub' claim
  } catch (e) {
    return false;
  }
};

// Limpieza proactiva de tokens corruptos
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const storageKeys = Object.keys(window.localStorage);
    storageKeys.forEach(key => {
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const item = window.localStorage.getItem(key);
        if (item) {
          try {
            const parsed = JSON.parse(item);
            if (parsed.access_token && !isValidJwtStructure(parsed.access_token)) {
              console.warn('[SUPABASE CONFIG] Token corrupto detectado (missing sub), limpiando sesión:', key);
              window.localStorage.removeItem(key);
            }
          } catch (e) {
            // Ignorar errores de parsing
          }
        }
      }
    });
  } catch (error) {
    console.error('[SUPABASE CONFIG] Error limpiando tokens:', error);
  }
}

// Función para crear cliente con configuración optimizada
const createOptimizedClient = (url, key, options = {}) => {
  if (!url || !key) {
    console.error('[SUPABASE CONFIG] Error: URL o clave no definidas');
    return null;
  }

  const {
    auth: authOptions = {},
    global: globalOptions = {},
    storageKey: storageKeyOption,
    ...restOptions
  } = options

  const storageKey = storageKeyOption || authOptions.storageKey || 'supabase-auth-token'
  const customHeaders = globalOptions.headers || {}

  // Asegurar que TODAS las peticiones lleven el apiKey de Supabase
  const withApiKeyHeaders = {
    apikey: key,
    Authorization: customHeaders.Authorization || `Bearer ${key}`,
    'X-Client-Info': 'zeatingmaps-web',
    ...customHeaders
  }

  const mergeHeaders = (baseHeaders = {}, overrideHeaders = {}) => {
    const merged = new Headers(baseHeaders)
    const overrides = overrideHeaders instanceof Headers ? overrideHeaders : new Headers(overrideHeaders)

    overrides.forEach((value, header) => {
      merged.set(header, value)
    })

    return merged
  }

  // En algunos entornos (ej. navegadores con proxies) los headers globales no siempre se aplican.
  // Reemplazamos fetch para inyectar el apikey en cada request y evitar el error 406.
  const patchedFetch = async (input, init = {}) => {
    const headers = mergeHeaders(withApiKeyHeaders, init.headers)

    if (!headers.has('apikey')) headers.set('apikey', key)
    if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${key}`)
    if (!headers.has('Accept')) headers.set('Accept', 'application/json')

    const method = (init.method || 'GET').toUpperCase()
    if (!['GET', 'HEAD'].includes(method) && init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    return (globalOptions.fetch || fetch)(input, {
      ...init,
      headers
    })
  }

  return createClient(url, key, {
    ...restOptions,
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey,
      ...authOptions
    },
    global: {
      ...globalOptions,
      fetch: patchedFetch,
      headers: withApiKeyHeaders
    }
  })
}

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
}

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
      storageKey: 'supabase-admin-token'
    });
  }
  return _adminInstance;
}

// Crear las instancias inmediatamente y exportarlas
const supabase = getSupabaseClient();
// Solo crear el cliente admin en entorno servidor
const supabaseAdmin = typeof window === 'undefined' ? getSupabaseAdminClient() : null;

// Exportar las instancias
export { supabase, supabaseAdmin };
