// Re-exportar desde la configuración centralizada
// Este archivo mantiene compatibilidad con el código existente
// pero usa la configuración centralizada para evitar múltiples instancias

export { supabase, supabaseAdmin, getSupabaseClient, getSupabaseAdminClient } from './config/supabase';