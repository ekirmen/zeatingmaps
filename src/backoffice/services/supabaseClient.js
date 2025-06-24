// src/backoffice/services/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Solo estas variables deben estar disponibles para frontend
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Estas variables deben estar definidas solo en entornos backend seguros
// También aceptamos el alias REACT_SUPABASE_SERVICE_ROLE_KEY para compatibilidad
const serviceRoleKey =
  process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.REACT_SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  // El Service Role Key es opcional, pero sin él algunas operaciones de
  // backoffice (como bloquear asientos o crear usuarios) pueden fallar si el
  // rol anónimo no tiene los permisos adecuados. En lugar de abortar la
  // ejecución por completo, mostramos una advertencia para que el entorno de
  // desarrollo pueda funcionar con privilegios limitados.
  console.warn(
    '⚠️  Service Role Key no definida. Las operaciones administrativas pueden fallar.'
  );
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
