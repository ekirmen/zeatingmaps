// =====================================================
// SISTEMA DE AUTENTICACIÓN UNIFICADO
// =====================================================

// 1. CREAR UN CONTEXTO DE AUTENTICACIÓN CENTRALIZADO
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../config/supabase';

const UnifiedAuthContext = createContext();

export const UnifiedAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para obtener el perfil del usuario
  const fetchUserProfile = useCallback(async (userId) => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching user profile:', err);
      return null;
    }
  }, []);

  // Función para validar la sesión actual
  const validateSession = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        throw new Error('Cliente de Supabase no disponible');
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;

      if (session?.user) {
        setUser(session.user);
        
        // Obtener perfil del usuario
        const profile = await fetchUserProfile(session.user.id);
        setUserProfile(profile);
        
        // Guardar token en localStorage
        localStorage.setItem('token', session.access_token);
        
        console.log('[UnifiedAuth] Sesión válida:', {
          userId: session.user.id,
          email: session.user.email,
          profile: profile
        });
      } else {
        // No hay sesión activa
        setUser(null);
        setUserProfile(null);
        localStorage.removeItem('token');
        
        console.log('[UnifiedAuth] No hay sesión activa');
      }
    } catch (err) {
      console.error('[UnifiedAuth] Error validando sesión:', err);
      setError(err.message);
      setUser(null);
      setUserProfile(null);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile]);

  // Función para iniciar sesión
  const signIn = useCallback(async ({ email, password }) => {
    try {
      setLoading(true);
      setError(null);

      const supabase = getSupabaseClient();
      
      if (!supabase) {
        throw new Error('Cliente de Supabase no disponible');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (error || !data?.session) {
        throw new Error(error?.message || 'Error al iniciar sesión');
      }

      // Actualizar estado local
      setUser(data.user);
      
      // Obtener perfil del usuario
      const profile = await fetchUserProfile(data.user.id);
      setUserProfile(profile);
      
      // Guardar token
      localStorage.setItem('token', data.session.access_token);
      
      console.log('[UnifiedAuth] Login exitoso:', {
        userId: data.user.id,
        email: data.user.email,
        profile: profile
      });

      return { success: true, user: data.user, profile };
    } catch (err) {
      console.error('[UnifiedAuth] Error en login:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile]);

  // Función para cerrar sesión
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
      
      // Limpiar estado local
      setUser(null);
      setUserProfile(null);
      setError(null);
      
      // Limpiar localStorage
      localStorage.removeItem('token');
      
      console.log('[UnifiedAuth] Logout exitoso');
      
      return { success: true };
    } catch (err) {
      console.error('[UnifiedAuth] Error en logout:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Escuchar cambios en la autenticación
  useEffect(() => {
    const supabase = getSupabaseClient();
    
    if (!supabase) return;

    // Validar sesión inicial
    validateSession();

    // Escuchar cambios en el estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[UnifiedAuth] Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          const profile = await fetchUserProfile(session.user.id);
          setUserProfile(profile);
          localStorage.setItem('token', session.access_token);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserProfile(null);
          setError(null);
          localStorage.removeItem('token');
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [validateSession, fetchUserProfile]);

  const value = {
    user,
    userProfile,
    loading,
    error,
    signIn,
    signOut,
    validateSession,
    isAuthenticated: !!user
  };

  return (
    <UnifiedAuthContext.Provider value={value}>
      {children}
    </UnifiedAuthContext.Provider>
  );
};

// Hook para usar el contexto unificado
export const useUnifiedAuth = () => {
  const context = useContext(UnifiedAuthContext);
  if (!context) {
    throw new Error('useUnifiedAuth debe usarse dentro de UnifiedAuthProvider');
  }
  return context;
};

// 2. COMPONENTE DE LOGIN UNIFICADO
export const UnifiedLoginForm = ({ onSuccess, onError }) => {
  const { signIn, loading, error } = useUnifiedAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const result = await signIn(formData);
      onSuccess?.(result);
    } catch (err) {
      onError?.(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Email:</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          required
          disabled={loading}
        />
      </div>
      <div>
        <label>Contraseña:</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          required
          disabled={loading}
        />
      </div>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </button>
    </form>
  );
};

// 3. COMPONENTE DE LOGOUT UNIFICADO
export const UnifiedLogoutButton = ({ onSuccess, onError }) => {
  const { signOut, loading } = useUnifiedAuth();

  const handleLogout = async () => {
    try {
      const result = await signOut();
      onSuccess?.(result);
    } catch (err) {
      onError?.(err);
    }
  };

  return (
    <button onClick={handleLogout} disabled={loading}>
      {loading ? 'Cerrando sesión...' : 'Cerrar Sesión'}
    </button>
  );
};
