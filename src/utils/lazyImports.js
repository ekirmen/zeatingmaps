// Utility para manejar imports lazy y evitar dependencias circulares
// que pueden causar el error "Cannot access 'R' before initialization"

let supabaseClient = null;
let supabaseAdminClient = null;

// Función para obtener el cliente Supabase de forma lazy
export const getSupabaseClient = async () => {
  if (!supabaseClient) {
    try {
      console.log('🔄 [lazyImports] Loading Supabase client...');
      const { supabase } = await import('../config/supabase');
      supabaseClient = supabase;
      console.log('✅ [lazyImports] Supabase client loaded successfully');
    } catch (error) {
      console.error('❌ [lazyImports] Error loading Supabase client:', error);
      throw error;
    }
  }
  return supabaseClient;
};

// Función para obtener el cliente admin de Supabase de forma lazy
export const getSupabaseAdminClient = async () => {
  if (!supabaseAdminClient) {
    try {
      console.log('🔄 [lazyImports] Loading Supabase admin client...');
      const { supabaseAdmin } = await import('../config/supabase');
      supabaseAdminClient = supabaseAdmin;
      console.log('✅ [lazyImports] Supabase admin client loaded successfully');
    } catch (error) {
      console.error('❌ [lazyImports] Error loading Supabase admin client:', error);
      throw error;
    }
  }
  return supabaseAdminClient;
};

// Función para limpiar los clientes (útil para testing)
export const clearClients = () => {
  supabaseClient = null;
  supabaseAdminClient = null;
  console.log('🧹 [lazyImports] Clients cleared');
};

// Función para verificar si los clientes están cargados
export const areClientsLoaded = () => {
  return {
    supabase: !!supabaseClient,
    supabaseAdmin: !!supabaseAdminClient
  };
};

// Función para obtener información de debug
export const getDebugInfo = () => {
  return {
    clientsLoaded: areClientsLoaded(),
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };
};
