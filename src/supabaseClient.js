/* global globalThis */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// Create a single instance to avoid multiple GoTrueClient instances
let supabase = null
let supabaseAdmin = null

if (typeof window !== 'undefined') {
  // Browser environment
  if (!window.__supabaseClient) {
    window.__supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  supabase = window.__supabaseClient
} else {
  // Server environment
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

// Administrative client (only use in backend: API Routes, Edge Functions)
const serviceRoleKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_SUPABASE_SERVICE_ROLE_KEY

if (serviceRoleKey) {
  if (typeof window !== 'undefined') {
    // Browser environment
    if (!window.__supabaseAdminClient) {
      window.__supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    }
    supabaseAdmin = window.__supabaseAdminClient
  } else {
    // Server environment
    supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
}

export { supabase, supabaseAdmin }
