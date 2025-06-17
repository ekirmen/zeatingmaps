// backend/frontend/src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// CRA solo expone variables que comienzan con REACT_APP_
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// Validación para prevenir errores en tiempo de ejecución
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Supabase URL o Anon Key no están definidas. Verifica tu .env en el frontend.')
}

// Cliente Supabase exportado para usar en cualquier componente
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
