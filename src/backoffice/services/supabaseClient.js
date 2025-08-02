// src/backoffice/services/supabaseClient.js
/* global globalThis */
import { createClient } from '@supabase/supabase-js';

// Only these variables should be available for frontend
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// These variables should be defined only in secure backend environments
// We also accept the alias REACT_SUPABASE_SERVICE_ROLE_KEY for compatibility
const serviceRoleKey =
  process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.REACT_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Supabase URL o Anon Key no están definidas.');
}

// Create a single instance for the public client
const supabase = globalThis.supabase || createClient(supabaseUrl, supabaseAnonKey);
if (!globalThis.supabase) {
  globalThis.supabase = supabase;
}

// Public client (safe for frontend)
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
