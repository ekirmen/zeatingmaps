/* global globalThis */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// Create a single instance to avoid multiple GoTrueClient instances
let supabase = null
let supabaseAdmin = null

// Función para crear cliente con configuración optimizada
const createOptimizedClient = (url, key, options = {}) => {
  return createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'supabase-auth-token', // Asegurar clave única
      ...options.auth
    },
    ...options
  })
}

// Singleton pattern mejorado
const getSupabaseClient = () => {
  if (typeof window !== 'undefined') {
    // Browser environment - usar singleton pattern
    if (!window.__supabaseClient) {
      console.log('[SUPABASE] Creando nueva instancia del cliente');
      window.__supabaseClient = createOptimizedClient(supabaseUrl, supabaseAnonKey)
    }
    return window.__supabaseClient
  } else {
    // Server environment
    if (!supabase) {
      console.log('[SUPABASE] Creando nueva instancia del cliente (servidor)');
      supabase = createOptimizedClient(supabaseUrl, supabaseAnonKey)
    }
    return supabase
  }
}

const getSupabaseAdminClient = () => {
  const serviceRoleKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
    console.warn('[SUPABASE] Service role key no encontrada');
    return null
  }

  if (typeof window !== 'undefined') {
    // Browser environment - usar singleton pattern
    if (!window.__supabaseAdminClient) {
      console.log('[SUPABASE] Creando nueva instancia del cliente admin');
      window.__supabaseAdminClient = createOptimizedClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          storageKey: 'supabase-admin-token', // Clave única para admin
        },
      })
    }
    return window.__supabaseAdminClient
  } else {
    // Server environment
    if (!supabaseAdmin) {
      console.log('[SUPABASE] Creando nueva instancia del cliente admin (servidor)');
      supabaseAdmin = createOptimizedClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    }
    return supabaseAdmin
  }
}

// Inicializar clientes
supabase = getSupabaseClient()
supabaseAdmin = getSupabaseAdminClient()

export { supabase, supabaseAdmin }
