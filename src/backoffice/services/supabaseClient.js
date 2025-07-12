// src/backoffice/services/supabaseClient.js
/* global globalThis */
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../supabaseClient'; // Assuming this imports the public client

// Only these variables should be available for frontend
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// These variables should be defined only in secure backend environments
// We also accept the alias REACT_SUPABASE_SERVICE_ROLE_KEY for compatibility
const serviceRoleKey =
  process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.REACT_SUPABASE_SERVICE_ROLE_KEY;

// Removed the console.warn for serviceRoleKey not defined.
// If you need to ensure admin operations are functional,
// you must set REACT_APP_SUPABASE_SERVICE_ROLE_KEY in a secure backend environment.

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Supabase URL o Anon Key no están definidas.');
}

// Public client (safe for frontend)
// Reuses the single instance exported from src/supabaseClient.js
export { supabase };

// Administrative client (only use in backend: API Routes, Edge Functions)
export const supabaseAdmin = serviceRoleKey
  ? globalThis.supabaseAdmin ||
    createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
if (serviceRoleKey && !globalThis.supabaseAdmin) {
  globalThis.supabaseAdmin = supabaseAdmin;
}
