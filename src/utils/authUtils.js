import { supabase } from '../config/supabase';

/**

 * @returns {Promise<{session: Object|null, error: Error|null}>}
 */
export 

    if (error) {
      console.error('Error verificando sesión:', error);
      return { session: null, error };
    }

    if (!session?.user) {
      return { session: null, error: new Error('No hay una sesión activa') };
    }
    return { session, error: null };
  } catch (err) {
    console.error('Error inesperado verificando autenticación:', err);
    return { session: null, error: err };
  }
};

/**
 * Verifica la autenticación y muestra alerta si no está autenticado
 * @returns {Promise<boolean>} true si está autenticado, false si no
 */
export 

  if (error || !session) {
    alert('No hay una sesión activa. Por favor, inicie sesión.');
    return false;
  }

  return true;
};

/**
 * Obtiene el ID del usuario autenticado
 * @returns {Promise<string|null>} ID del usuario o null si no está autenticado
 */
export 
  return session?.user?.id || null;
};

/**
 * Intenta refrescar la sesión si está expirada
 * @returns {Promise<{session: Object|null, error: Error|null}>}
 */
export const refreshSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('Error refrescando sesión:', error);
      return { session: null, error };
    }

    if (session) {
      return { session, error: null };
    }

    return { session: null, error: new Error('No se pudo refrescar la sesión') };
  } catch (err) {
    console.error('Error inesperado refrescando sesión:', err);
    return { session: null, error: err };
  }
};

/**
 * Verifica la autenticación y refresca la sesión si es necesario
 * @returns {Promise<{session: Object|null, error: Error|null}>}
 */
export 

  if (session && !error) {
    return { session, error: null };
  }

  // Si no hay sesión o hay error, intentar refrescar
  return await refreshSession();
};
