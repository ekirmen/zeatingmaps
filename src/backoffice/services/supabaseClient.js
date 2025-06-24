// src/backoffice/services/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
// Allow backward compatibility with REACT_SUPABASE_SERVICE_ROLE_KEY
const serviceRoleKey =
  process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.REACT_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Supabase URL o Anon Key no están definidas.');
}

if (!serviceRoleKey) {
  // Show a helpful warning when the service key is missing. Certain features
  // like blocking seats require this key to bypass RLS and update tables.
  console.warn(
    '⚠️  REACT_APP_SUPABASE_SERVICE_ROLE_KEY (or REACT_SUPABASE_SERVICE_ROLE_KEY) is not defined. ' +
      'Admin operations might fail.'
  );
}

// Cliente público (frontend)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente administrativo (solo si lo necesitas en entornos seguros)
export const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
