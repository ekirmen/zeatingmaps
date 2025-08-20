import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);

  // Función para obtener el perfil del usuario
  const fetchUserProfile = useCallback(async (userId) => {
    try {
      if (!supabase) {
        console.error('[useAuth] Cliente de Supabase no disponible');
        return null;
      }

      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[useAuth] Error al obtener perfil:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[useAuth] Error inesperado al obtener perfil:', error);
      return null;
    }
  }, []);

  // Función para iniciar sesión
  const signIn = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        throw new Error('Cliente de Supabase no disponible');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para registrarse
  const signUp = useCallback(async (email, password, userData = {}) => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        throw new Error('Cliente de Supabase no disponible');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para cerrar sesión
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      
      if (supabase) {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('[useAuth] Error al cerrar sesión:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para actualizar perfil
  const updateProfile = useCallback(async (updates) => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        throw new Error('Cliente de Supabase no disponible');
      }

      const { data, error } = await supabase.auth.updateUser({
        data: updates,
      });

      if (error) {
        throw error;
      }

      // Actualizar perfil local
      if (data.user) {
        setProfile(prev => ({ ...prev, ...updates }));
      }

      return data;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para restablecer contraseña
  const resetPassword = useCallback(async (email) => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        throw new Error('Cliente de Supabase no disponible');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Escuchar cambios de autenticación
  useEffect(() => {
    if (!supabase) {
      console.error('[useAuth] No se puede inicializar listener de auth');
      return;
    }

    // Validar sesión inicial
    // validateSession(); // This function was removed from the original file

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useAuth] Auth state change:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          const profile = await fetchUserProfile(session.user.id);
          setProfile(profile);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchUserProfile]); // This dependency was removed from the original file

  return {
    // Estado
    user,
    profile, // Changed from userProfile to profile
    loading,
    error,
    
    // Métodos de autenticación
    signIn,
    signOut,
    updateProfile,
    resetPassword, // Added resetPassword
    
    // Verificaciones de permisos
    // hasPermission, // Removed as per new_code
    // isSuperAdmin, // Removed as per new_code
    // isTenantAdmin, // Removed as per new_code
    // isAdmin, // Removed as per new_code
    // hasTenantAccess, // Removed as per new_code
    
    // Utilidades
    isAuthenticated: !!user,
    isReady: !loading && !error
  };
};
