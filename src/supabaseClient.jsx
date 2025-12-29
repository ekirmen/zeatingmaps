// Re-exportar desde la configuración centralizada
// Este archivo mantiene compatibilidad con el código existente
// pero usa la configuración centralizada para evitar múltiples instancias

// Configuración de Supabase
// Soporta múltiples prefijos de variables de entorno: VITE_, NEXT_PUBLIC_, REACT_APP_
const getEnvVar = (name) => {
    return import.meta.env[`VITE_${name}`] ||
        import.meta.env[`NEXT_PUBLIC_${name}`] ||
        import.meta.env[`REACT_APP_${name}`] ||
        import.meta.env[`REACT_${name}`] ||
        import.meta.env[`react_${name}`] ||
        import.meta.env[name];
};

const supabaseUrl = getEnvVar('SUPABASE_URL');
const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY');

// Debug en desarrollo
if (import.meta.env.DEV) {
    console.log('[SUPABASE CONFIG] Variables de entorno:', {
        url: !!supabaseUrl,
        key: !!supabaseAnonKey
    });
}

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[SUPABASE CONFIG] Error: Variables de entorno faltantes:', {
        url: !!supabaseUrl,
        key: !!supabaseAnonKey
    });
    console.error('[SUPABASE CONFIG] Error: URL o clave no definidas');
}

export { supabase, supabaseAdmin, getSupabaseClient, getSupabaseAdminClient } from './config/supabase';
