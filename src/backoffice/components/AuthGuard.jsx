import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Spin } from '../../utils/antdComponents';
import DashboardLogin from './DashboardLogin';

const AuthGuard = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Primero intentar obtener la sesión actual
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Session error:', sessionError);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      const activeUser = sessionData?.session?.user;

      if (activeUser) {
        // Verificar si el usuario tiene acceso al tenant (backoffice)
        // Importamos dinámicamente para evitar ciclos si authService usa componentes que usan AuthGuard (poco probable pero seguro)
        const { verifyTenantAccess } = await import('../services/authService');
        const { hasAccess, reason } = await verifyTenantAccess(activeUser.id);

        if (hasAccess) {
          setIsAuthenticated(true);
        } else {
          console.warn('Usuario autenticado pero sin acceso al dashboard:', reason);
          setIsAuthenticated(false); // Mantener false para mostrar login o acceso denegado
          // Podríamos mostrar un estado específico de "No autorizado"
          // Por ahora, simplemente no autenticamos para el dashboard
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error in checkAuth:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <Spin size="large" />
        <div>Verificando autenticación...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Mostrar modal de login del dashboard
    return (
      <DashboardLogin
        onLogin={() => {
          setIsAuthenticated(true);
          setLoading(false);
        }}
      />
    );
  }

  return children;
};

export default AuthGuard;


