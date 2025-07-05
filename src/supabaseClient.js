import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// Reuse a single client across the entire application to avoid
// instantiating multiple GoTrueClient instances which can lead to
// warnings and unexpected behaviour when persisting sessions.
export const supabase =
  globalThis.supabase || createClient(supabaseUrl, supabaseAnonKey)

if (!globalThis.supabase) {
  globalThis.supabase = supabase
}
