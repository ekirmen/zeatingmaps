// src/backoffice/services/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Solo estas variables deben estar disponibles para frontend
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Estas variables deben estar definidas solo en entornos backend seguros
const serviceRoleKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  throw new Error('❌ Service Role Key no está definida.');
}


if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Supabase URL o Anon Key no están definidas.');
}

// Cliente público (seguro para frontend)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente administrativo (solo usar en backend: API Routes, Edge Functions)
export const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
