
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// Create a single instance to avoid multiple GoTrueClient instances
const supabase = globalThis.supabase || createClient(supabaseUrl, supabaseAnonKey)
if (!globalThis.supabase) {
  globalThis.supabase = supabase
}

export { supabase }
