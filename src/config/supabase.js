// Configuración centralizada de Supabase
// Este archivo asegura que solo se cree una instancia de Supabase en toda la aplicación

import { createClient } from '@supabase/supabase-js'

// Variables de entorno
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_SUPABASE_SERVICE_ROLE_KEY

// Verificar variables de entorno
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[SUPABASE CONFIG] Error: Variables de entorno faltantes:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  });
}

// Función para crear cliente con configuración optimizada
const createOptimizedClient = (url, key, options = {}) => {
  if (!url || !key) {
    console.error('[SUPABASE CONFIG] Error: URL o clave no definidas');
    return null;
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'supabase-auth-token',
      ...options.auth
    },
    global: {
      headers: {
        'X-Client-Info': 'zeatingmaps-web'
      }
    },
    ...options
  })
}

// Función para obtener el cliente principal
export const getSupabaseClient = () => {
  try {
    if (typeof window !== 'undefined') {
      // Browser environment
      if (!window.__supabaseClient) {
        console.log('[SUPABASE CONFIG] Creando nueva instancia del cliente');
        const client = createOptimizedClient(supabaseUrl, supabaseAnonKey);
        if (client) {
          window.__supabaseClient = client;
        } else {
          console.error('[SUPABASE CONFIG] No se pudo crear el cliente');
          return null;
        }
      }
      return window.__supabaseClient;
    } else {
      // Server environment - create new instance each time
      console.log('[SUPABASE CONFIG] Creando nueva instancia del cliente (servidor)');
      return createOptimizedClient(supabaseUrl, supabaseAnonKey);
    }
  } catch (error) {
    console.error('[SUPABASE CONFIG] Error al obtener cliente:', error);
    return null;
  }
}

// Función para obtener el cliente admin
export const getSupabaseAdminClient = () => {
  try {
    if (!serviceRoleKey) {
      console.warn('[SUPABASE CONFIG] Service role key no encontrada');
      return null;
    }

    if (typeof window !== 'undefined') {
      // Browser environment
      if (!window.__supabaseAdminClient) {
        console.log('[SUPABASE CONFIG] Creando nueva instancia del cliente admin');
        const client = createOptimizedClient(supabaseUrl, serviceRoleKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
            storageKey: 'supabase-admin-token',
          },
        });
        if (client) {
          window.__supabaseAdminClient = client;
        } else {
          console.error('[SUPABASE CONFIG] No se pudo crear el cliente admin');
          return null;
        }
      }
      return window.__supabaseAdminClient;
    } else {
      // Server environment - create new instance each time
      console.log('[SUPABASE CONFIG] Creando nueva instancia del cliente admin (servidor)');
      return createOptimizedClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  } catch (error) {
    console.error('[SUPABASE CONFIG] Error al obtener cliente admin:', error);
    return null;
  }
}

// Crear instancias singleton solo para el navegador
let supabaseClient = null
let supabaseAdminClient = null

// Inicializar clientes solo si las variables de entorno están disponibles
if (supabaseUrl && supabaseAnonKey && typeof window !== 'undefined') {
  try {
    // Solo inicializar una vez en el navegador
    if (!supabaseClient) {
      supabaseClient = getSupabaseClient();
    }
    if (!supabaseAdminClient && serviceRoleKey) {
      supabaseAdminClient = getSupabaseAdminClient();
    }
  } catch (error) {
    console.error('[SUPABASE CONFIG] Error inicializando clientes:', error);
  }
} else if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[SUPABASE CONFIG] No se pueden inicializar los clientes: variables de entorno faltantes');
}

// Exportar las instancias inicializadas (pueden ser null en servidor)
export const supabase = supabaseClient;
export const supabaseAdmin = supabaseAdminClient; 