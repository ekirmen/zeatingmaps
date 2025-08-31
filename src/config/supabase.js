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
      storageKey: options.storageKey || 'supabase-auth-token',
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

// Variables globales para almacenar las instancias
let clientInstance = null;
let adminInstance = null;

// Función para obtener o crear el cliente principal
export const getSupabaseClient = () => {
  // Solo crear la instancia si no existe
  if (!clientInstance) {
    console.log('[SUPABASE CONFIG] Creando nueva instancia del cliente');
    clientInstance = createOptimizedClient(supabaseUrl, supabaseAnonKey);
  }
  return clientInstance;
}

// Función para obtener o crear el cliente admin
export const getSupabaseAdminClient = () => {
  if (!serviceRoleKey) {
    console.warn('[SUPABASE CONFIG] Service role key no encontrada');
    return null;
  }

  // Solo crear la instancia si no existe
  if (!adminInstance) {
    console.log('[SUPABASE CONFIG] Creando nueva instancia del cliente admin');
    adminInstance = createOptimizedClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      storageKey: 'supabase-admin-token'
    });
  }
  return adminInstance;
}

// Crear las instancias inmediatamente
const supabase = getSupabaseClient();
const supabaseAdmin = getSupabaseAdminClient();

// Exportar las instancias
export { supabase, supabaseAdmin }; 