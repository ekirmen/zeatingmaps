// Utility para manejar imports lazy y evitar dependencias circulares
// que pueden causar el error "Cannot access 'R' before initialization"

let supabaseClient = null;
let supabaseAdminClient = null;

// Función para obtener el cliente Supabase de forma lazy
export 
      supabaseClient = supabase;
    } catch (error) {
      console.error('❌ [lazyImports] Error loading Supabase client:', error);
      throw error;
    }

  return supabaseClient;
};

// Función para obtener el cliente admin de Supabase de forma lazy
export 
      supabaseAdminClient = supabaseAdmin;
    } catch (error) {
      console.error('❌ [lazyImports] Error loading Supabase admin client:', error);
      throw error;
    }
  }
  return supabaseAdminClient;
};

// Función para limpiar los clientes (útil para testing)
export 
  supabaseAdminClient = null;
};

// Función para verificar si los clientes están cargados
export 
};

// Función para obtener información de debug
export 
};
