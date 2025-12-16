import { supabase } from '../config/supabase';

// Obtiene la sesión actual de forma segura
export const getSession = async () => {
  try {
    if (!supabase || !supabase.auth) return { session: null, error: new Error('Supabase no disponible') };
    // Nueva API de supabase usa getSession
    if (typeof supabase.auth.getSession === 'function') {
      const { data, error } = await supabase.auth.getSession();
      const session = data?.session || null;
      return { session, error: error || null };
    }
    // Fallback a older API
    if (typeof supabase.auth.session === 'function') {
      const session = supabase.auth.session();
      return { session, error: null };
    }
    return { session: null, error: new Error('Método de sesión no disponible') };
  } catch (err) {
    return { session: null, error: err };
  }
};

// Verifica autenticación; muestra alerta en caso de no autenticado
export const ensureAuthenticated = async () => {
  const { session, error } = await getSession();
  if (error || !session) {
    try { alert('No hay una sesión activa. Por favor, inicie sesión.'); } catch (e) {}
    return false;
  }
  return true;
};

// Obtiene el ID del usuario autenticado
export const getUserId = async () => {
  const { session } = await getSession();
  return session?.user?.id || null;
};

// Intenta refrescar la sesión si está expirada
export const refreshSession = async () => {
  try {
    if (!supabase || !supabase.auth) return { session: null, error: new Error('Supabase no disponible') };
    if (typeof supabase.auth.refreshSession === 'function') {
      const result = await supabase.auth.refreshSession();
      // result shape may vary
      const session = result?.data?.session || result?.session || null;
      const error = result?.error || null;
      return { session, error };
    }
    // If no refresh API, return current session
    return await getSession();
  } catch (err) {
    return { session: null, error: err };
  }
};

// Verifica y refresca si es necesario
export const ensureSession = async () => {
  const { session, error } = await getSession();
  if (session && !error) return { session, error: null };
  return await refreshSession();
};

export default {
  getSession,
  ensureAuthenticated,
  getUserId,
  refreshSession,
  ensureSession
};