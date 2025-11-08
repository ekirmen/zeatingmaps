import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { createAuthError } from '../utils/authErrorMessages';
import { setEncryptedItem, getEncryptedItem } from '../utils/encryption';
import auditService from '../services/auditService';

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
          // Encriptar y almacenar token de forma segura
          await setEncryptedItem('token', session.access_token);
          // También almacenar información del usuario de forma segura
          await setEncryptedItem('user_data', {
            id: session.user.id,
            email: session.user.email
          });
        } catch (storageError) {
          console.error('Error setting token in localStorage:', storageError);
          // Fallback: almacenar sin encriptar si falla
          localStorage.setItem('token', session.access_token);
        }
        setUser(session.user);
        fetchUserRole(session.user.id);
        
        // Registrar login en auditoría
        auditService.logUserAction('login', {
          userId: session.user.id,
          email: session.user.email
        }).catch(err => console.error('Error logging login:', err));
      } else {
        try {
          // Limpiar datos encriptados
          localStorage.removeItem('token');
          localStorage.removeItem('user_data');
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
        // Registrar intento de login fallido en auditoría
        auditService.logSecurityEvent('login_failed', {
          email,
          reason: error?.message || 'Invalid session'
        }).catch(err => console.error('Error logging failed login:', err));
        
        const authError = await createAuthError({
          error: error || new Error('Respuesta de inicio de sesión inválida'),
          email,
          supabaseClient: supabase,
        });
        throw authError;
      }
      const token = data.session.access_token;
      
      // Encriptar y almacenar token de forma segura
      try {
        await setEncryptedItem('token', token);
        await setEncryptedItem('user_data', {
          id: data.user.id,
          email: data.user.email
        });
      } catch (storageError) {
        console.error('Error encrypting token:', storageError);
        // Fallback: almacenar sin encriptar
        localStorage.setItem('token', token);
      }
      
      setUser(data.user);
      fetchUserRole(data.user.id);
      
      // Registrar login exitoso en auditoría
      auditService.logUserAction('login', {
        userId: data.user.id,
        email: data.user.email
      }).catch(err => console.error('Error logging login:', err));
      
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
    // Registrar logout en auditoría antes de cerrar sesión
    if (user) {
      auditService.logUserAction('logout', {
        userId: user.id,
        email: user.email
      }).catch(err => console.error('Error logging logout:', err));
    }
    
    await supabase.auth.signOut();
    
    // Limpiar datos encriptados
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user_data');
    } catch (storageError) {
      console.error('Error removing encrypted data:', storageError);
    }
    
    setUser(null);
    setRole(null);
  };

  useEffect(() => {
    let isMounted = true;

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      // Manejar operaciones asíncronas sin bloquear el callback
      const handleSession = async () => {
        if (session?.user) {
          try {
            // Encriptar y almacenar token
            await setEncryptedItem('token', session.access_token);
            await setEncryptedItem('user_data', {
              id: session.user.id,
              email: session.user.email
            });
          } catch (storageError) {
            console.error('Error setting token in localStorage:', storageError);
            // Fallback
            try {
              localStorage.setItem('token', session.access_token);
            } catch (fallbackError) {
              console.error('Error en fallback de localStorage:', fallbackError);
            }
          }
          setUser(session.user);
          fetchUserRole(session.user.id);
        } else {
          try {
            localStorage.removeItem('token');
            localStorage.removeItem('user_data');
          } catch (storageError) {
            console.error('Error removing token from localStorage:', storageError);
          }
          setUser(null);
          setRole(null);
        }
      };
      
      // Ejecutar la función asíncrona sin esperar
      handleSession().catch(error => {
        console.error('Error handling auth state change:', error);
      });
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
