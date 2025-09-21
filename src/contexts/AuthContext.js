import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { createAuthError } from '../utils/authErrorMessages';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = useCallback(async (id) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('permisos')
        .eq('id', id)
        .single();
      if (error) throw error;
      setRole(data.permisos?.role || null);
    } catch (err) {
      console.error('Error fetching role:', err.message);
      setRole(null);
    }
  }, []);

  const validateSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (session) {
        try {
          localStorage.setItem('token', session.access_token);
        } catch (storageError) {
          console.error('Error setting token in localStorage:', storageError);
        }
        setUser(session.user);
        fetchUserRole(session.user.id);
      } else {
        try {
          localStorage.removeItem('token');
        } catch (storageError) {
          console.error('Error removing token from localStorage:', storageError);
        }
        setUser(null);
        setRole(null);
      }
    } catch (error) {
      console.error('❌ Error al validar sesión:', error.message);
      try {
        localStorage.removeItem('token');
      } catch (storageError) {
        console.error('Error removing token from localStorage:', storageError);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [fetchUserRole]);

  const login = async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.session) {
        const authError = await createAuthError({
          error: error || new Error('Respuesta de inicio de sesión inválida'),
          email,
          supabaseClient: supabase,
        });
        throw authError;
      }
      const token = data.session.access_token;
      localStorage.setItem('token', token);
      setUser(data.user);
      fetchUserRole(data.user.id);
      return data;
    } catch (error) {
      if (error?.code && error?.i18nKey) {
        throw error;
      }
      const fallbackError = await createAuthError({ error, email, supabaseClient: supabase });
      throw fallbackError;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('token');
    setUser(null);
    setRole(null);
  };

  useEffect(() => {
    let isMounted = true;

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        try {
          localStorage.setItem('token', session.access_token);
        } catch (storageError) {
          console.error('Error setting token in localStorage:', storageError);
        }
        setUser(session.user);
        fetchUserRole(session.user.id);
      } else {
        try {
          localStorage.removeItem('token');
        } catch (storageError) {
          console.error('Error removing token from localStorage:', storageError);
        }
        setUser(null);
        setRole(null);
      }
    });

    validateSession();

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchUserRole, validateSession]);

  const value = {
    user,
    role,
    login,
    logout,
    loading,
    validateSession,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
