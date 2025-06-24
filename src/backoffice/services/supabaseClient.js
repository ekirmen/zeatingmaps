// src/backoffice/services/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Solo estas variables deben estar disponibles para frontend
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Supabase URL o Anon Key no están definidas.');
}

// Cliente público (seguro para frontend)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
