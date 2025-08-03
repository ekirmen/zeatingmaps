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
      ...options.auth
    },
    ...options
  })
}

if (typeof window !== 'undefined') {
  // Browser environment - usar singleton pattern
  if (!window.__supabaseClient) {
    window.__supabaseClient = createOptimizedClient(supabaseUrl, supabaseAnonKey)
  }
  supabase = window.__supabaseClient
} else {
  // Server environment
  supabase = createOptimizedClient(supabaseUrl, supabaseAnonKey)
}

// Administrative client (only use in backend: API Routes, Edge Functions)
const serviceRoleKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_SUPABASE_SERVICE_ROLE_KEY

if (serviceRoleKey) {
  if (typeof window !== 'undefined') {
    // Browser environment - usar singleton pattern
    if (!window.__supabaseAdminClient) {
      window.__supabaseAdminClient = createOptimizedClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    }
    supabaseAdmin = window.__supabaseAdminClient
  } else {
    // Server environment
    supabaseAdmin = createOptimizedClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
}

export { supabase, supabaseAdmin }
