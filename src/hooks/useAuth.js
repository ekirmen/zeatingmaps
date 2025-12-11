import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../config/supabase';
import { createAuthError } from '../utils/authErrorMessages';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener perfil del usuario
  const fetchUserProfile = useCallback(async (userId) => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {

        return null;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[useAuth] Error obteniendo perfil:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('[useAuth] Error en fetchUserProfile:', err);
      return null;
    }
  }, []);

  // Verificar sesión actual
  const validateSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Cliente de Supabase no disponible');
      }

      // Obtener sesión actual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (session?.user) {
        setUser(session.user);

        // Obtener perfil del usuario
        const profile = await fetchUserProfile(session.user.id);
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
    } catch (err) {
      console.error('[useAuth] Error validando sesión:', err);
      setError(err.message);
      setUser(null);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile]);

  // Iniciar sesión
  const signIn = async ({ email, password }) => {
    setLoading(true);
    setError(null);

    const supabase = getSupabaseClient();

    try {
      if (!supabase) {
        throw new Error('Cliente de Supabase no disponible');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error || !data?.session) {
        throw await createAuthError({
          error: error || new Error('Respuesta de inicio de sesión inválida'),
          email,
          supabaseClient: supabase,
        });
      }

      if (data?.user) {
        setUser(data.user);

        const profile = await fetchUserProfile(data.user.id);
        setUserProfile(profile);
        return { success: true, user: data.user, profile };
      }

      throw await createAuthError({
        error: new Error('Respuesta de login inválida'),
        email,
        supabaseClient: supabase,
      });
    } catch (err) {
      console.error('[useAuth] Error en login:', err);
      const authError = err?.code && err?.i18nKey
        ? err
        : await createAuthError({ error: err, email, supabaseClient: supabase });
      setError(authError.message);
      throw authError;
    } finally {
      setLoading(false);
    }
  };

  // Cerrar sesión
  const signOut = async () => {
    try {
      setLoading(true);

      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.auth.signOut();
      }

      setUser(null);
      setUserProfile(null);
      setError(null);
    } catch (err) {
      console.error('[useAuth] Error cerrando sesión:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Verificar permisos
  const hasPermission = useCallback((permission) => {
    if (!userProfile) return false;

    // Super admin tiene todos los permisos
    if (userProfile.role === 'super_admin') return true;

    // Verificar permisos específicos del rol
    if (userProfile.permissions && Array.isArray(userProfile.permissions)) {
      return userProfile.permissions.includes(permission);
    }

    return false;
  }, [userProfile]);

  // Verificar si es super admin
  const isSuperAdmin = useCallback(() => {
    return userProfile?.role === 'super_admin';
  }, [userProfile]);

  // Verificar si es tenant admin
  const isTenantAdmin = useCallback(() => {
    return userProfile?.role === 'tenant_admin';
  }, [userProfile]);

  // Verificar si es admin de cualquier tipo
  const isAdmin = useCallback(() => {
    return isSuperAdmin() || isTenantAdmin();
  }, [isSuperAdmin, isTenantAdmin]);

  // Verificar acceso a tenant
  const hasTenantAccess = useCallback((targetTenantId) => {
    if (!userProfile) return false;

    // Super admin tiene acceso a todos los tenants
    if (isSuperAdmin()) return true;

    // Tenant admin solo tiene acceso a su propio tenant
    if (isTenantAdmin()) {
      return userProfile.tenant_id === targetTenantId;
    }

    return false;
  }, [userProfile, isSuperAdmin, isTenantAdmin]);

  // Actualizar perfil del usuario
  const updateProfile = useCallback(async (updates) => {
    try {
      if (!user?.id) {
        throw new Error('Usuario no autenticado');
      }

      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Cliente de Supabase no disponible');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setUserProfile(data);
      return { success: true, profile: data };
    } catch (err) {
      console.error('[useAuth] Error actualizando perfil:', err);
      setError(err.message);
      throw err;
    }
  }, [user]);

  // Escuchar cambios de autenticación
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error('[useAuth] No se puede inicializar listener de auth');
      return;
    }

    // Validar sesión inicial
    validateSession();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          const profile = await fetchUserProfile(session.user.id);
          setUserProfile(profile);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserProfile(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [validateSession, fetchUserProfile]);

  return {
    // Estado
    user,
    userProfile,
    loading,
    error,

    // Métodos de autenticación
    signIn,
    signOut,
    updateProfile,

    // Verificaciones de permisos
    hasPermission,
    isSuperAdmin,
    isTenantAdmin,
    isAdmin,
    hasTenantAccess,

    // Utilidades
    isAuthenticated: !!user,
    isReady: !loading && !error
  };
};
