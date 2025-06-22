import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../backoffice/services/supabaseClient';

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

  const validateSession = async () => {
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
  };

  const login = async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.session) {
        throw new Error(error?.message || 'Error en el inicio de sesión');
      }
      const token = data.session.access_token;
      localStorage.setItem('token', token);
      setUser(data.user);
      fetchUserRole(data.user.id);
      return data;
    } catch (error) {
      throw error;
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
  }, []);

  const value = {
    user,
    role,
    login,
    logout,
    loading,
    validateSession
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
