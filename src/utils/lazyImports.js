// Utility para manejar imports lazy y evitar dependencias circulares
// Provee funciones conservadoras que intentan cargar dinámicamente
// módulos relacionados (si existen) pero no lanzan errores si no están.

let supabaseClient = null;
let supabaseAdminClient = null;

export const getSupabaseClient = async () => {
  if (supabaseClient) return supabaseClient;
  try {
    const mod = await import('../supabaseClient');
    // Try common export shapes
    supabaseClient = mod.default || mod.supabase || mod.getSupabaseClient || mod.createClient || null;
  } catch (error) {
    console.error('❌ [lazyImports] Error loading Supabase client:', error);
  }
  return supabaseClient;
};

export const getSupabaseAdminClient = async () => {
  if (supabaseAdminClient) return supabaseAdminClient;
  try {
    const mod = await import('../supabaseClient');
    supabaseAdminClient = mod.admin || mod.supabaseAdmin || null;
  } catch (error) {
    console.error('❌ [lazyImports] Error loading Supabase admin client:', error);
  }
  return supabaseAdminClient;
};

export const resetLazyClients = () => {
  supabaseClient = null;
  supabaseAdminClient = null;
};

export const hasLazyClients = () => !!supabaseClient || !!supabaseAdminClient;

export const getLazyDebugInfo = () => ({
  supabaseClientLoaded: !!supabaseClient,
  supabaseAdminClientLoaded: !!supabaseAdminClient
});

export default {
  getSupabaseClient,
  getSupabaseAdminClient,
  resetLazyClients,
  hasLazyClients,
  getLazyDebugInfo
};
