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

// Singleton pattern usando variables de módulo
let _clientInstance = null;
let _adminInstance = null;

// Función para obtener o crear el cliente principal
export const getSupabaseClient = () => {
  // Solo crear la instancia si no existe
  if (!_clientInstance) {
    console.log('[SUPABASE CONFIG] Creando nueva instancia del cliente');
    _clientInstance = createOptimizedClient(supabaseUrl, supabaseAnonKey);
  }
  return _clientInstance;
}

// Función para obtener o crear el cliente admin
export const getSupabaseAdminClient = () => {
  // Evitar crear la instancia en el navegador
  if (typeof window !== 'undefined') {
    console.warn('[SUPABASE CONFIG] Cliente admin no disponible en el navegador');
    return null;
  }

  if (!serviceRoleKey) {
    console.warn('[SUPABASE CONFIG] Service role key no encontrada');
    return null;
  }

  // Solo crear la instancia si no existe
  if (!_adminInstance) {
    console.log('[SUPABASE CONFIG] Creando nueva instancia del cliente admin');
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