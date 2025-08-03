
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// Create a single instance to avoid multiple GoTrueClient instances
const supabase = globalThis.supabase || createClient(supabaseUrl, supabaseAnonKey)
if (!globalThis.supabase) {
  globalThis.supabase = supabase
}

// Administrative client (only use in backend: API Routes, Edge Functions)
const serviceRoleKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = serviceRoleKey
  ? globalThis.supabaseAdmin ||
    createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

if (serviceRoleKey && !globalThis.supabaseAdmin) {
  globalThis.supabaseAdmin = supabaseAdmin
}

export { supabase, supabaseAdmin }
