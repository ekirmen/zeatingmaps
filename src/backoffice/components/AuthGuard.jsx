import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Spin } from 'antd';
import DashboardLogin from './DashboardLogin';

const AuthGuard = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error checking auth:', error);
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(!!user);
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
