import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { checkAndRefreshAuth } from '../utils/authUtils';

const AuthStatus = ({ showDetails = false }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    session: null,
    error: null,
    loading: true
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setAuthState(prev => ({ ...prev, loading: true }));
        
        const { session, error } = await checkAndRefreshAuth();
        
        setAuthState({
          isAuthenticated: !!session?.user,
          user: session?.user || null,
          session: session,
          error: error,
          loading: false
        });
      } catch (err) {
        setAuthState({
          isAuthenticated: false,
          user: null,
          session: null,
          error: err,
          loading: false
        });
      }
    };

    checkAuth();

    // Escuchar cambios en el estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email);
      setAuthState({
        isAuthenticated: !!session?.user,
        user: session?.user || null,
        session: session,
        error: null,
        loading: false
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  if (authState.loading) {
    return <div>🔍 Verificando autenticación...</div>;
  }

  if (showDetails) {
    return (
      <div style={{ 
        padding: '10px', 
        border: '1px solid #ccc', 
        borderRadius: '5px', 
        margin: '10px 0',
        backgroundColor: authState.isAuthenticated ? '#e8f5e8' : '#ffe8e8'
      }}>
        <h4>🔐 Estado de Autenticación</h4>
        <p><strong>Autenticado:</strong> {authState.isAuthenticated ? '✅ Sí' : '❌ No'}</p>
        {authState.user && (
          <>
            <p><strong>Usuario:</strong> {authState.user.email}</p>
            <p><strong>ID:</strong> {authState.user.id}</p>
          </>
        )}
        {authState.error && (
          <p><strong>Error:</strong> {authState.error.message}</p>
        )}
        {authState.session && (
          <p><strong>Token:</strong> {authState.session.access_token ? '✅ Presente' : '❌ Ausente'}</p>
        )}
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '5px 10px', 
      borderRadius: '3px', 
      fontSize: '12px',
      backgroundColor: authState.isAuthenticated ? '#e8f5e8' : '#ffe8e8',
      color: authState.isAuthenticated ? '#2d5a2d' : '#8b0000'
    }}>
      {authState.isAuthenticated ? 
        `✅ ${authState.user?.email}` : 
        '❌ No autenticado'
      }
    </div>
  );
};

export default AuthStatus;
