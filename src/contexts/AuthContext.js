import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { createAuthError } from '../utils/authErrorMessages';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (id) => {
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
  };

  const validateSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (session) {
        localStorage.setItem('token', session.access_token);
        setUser(session.user);
        fetchUserRole(session.user.id);
      } else {
        localStorage.removeItem('token');
        setUser(null);
        setRole(null);
      }
    } catch (error) {
      console.error('❌ Error al validar sesión:', error.message);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

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
    validateSession();
  }, [validateSession]);

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
