// Configuración centralizada de Supabase
// Este archivo asegura que solo se cree una instancia de Supabase en toda la aplicación

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Verificar que las variables de entorno estén disponibles
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ [SUPABASE CONFIG] Variables de entorno faltantes:', {
    url: supabaseUrl ? '✅' : '❌',
    key: supabaseAnonKey ? '✅' : '❌'
  });
}

// Crear cliente de Supabase con configuración optimizada
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'veneventos-backoffice'
    }
  }
});

// Cliente admin para operaciones del servidor
export const supabaseAdmin = createClient(supabaseUrl, process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Función para verificar la conectividad
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('tenants').select('count').limit(1);
    if (error) {
      console.error('❌ [SUPABASE] Error de conexión:', error.message);
      return false;
    }
    console.log('✅ [SUPABASE] Conexión exitosa');
    return true;
  } catch (error) {
    console.error('❌ [SUPABASE] Error inesperado:', error.message);
    return false;
  }
};

// Función para limpiar la caché de Supabase
export const clearSupabaseCache = () => {
  try {
    // Limpiar localStorage relacionado con Supabase
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        localStorage.removeItem(key);
      }
    });
    console.log('🧹 [SUPABASE] Caché limpiada');
  } catch (error) {
    console.warn('⚠️ [SUPABASE] Error al limpiar caché:', error.message);
  }
};

// Exportar por defecto para compatibilidad
export default supabase; 