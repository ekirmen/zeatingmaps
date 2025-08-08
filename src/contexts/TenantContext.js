import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const TenantContext = createContext();

export const TenantProvider = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  // Detectar tenant del subdominio
  const detectTenant = async () => {
    try {
      const hostname = window.location.hostname;
      const subdomain = hostname.split('.')[0];
      
      // Si no hay subdominio o es www, usar tenant por defecto
      if (!subdomain || subdomain === 'www' || subdomain === 'localhost') {
        setCurrentTenant(null);
        setLoading(false);
        return;
      }

      // Buscar tenant por subdominio
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('subdomain', subdomain)
        .single();

      if (error) {
        console.error('Error detecting tenant:', error);
        setCurrentTenant(null);
      } else {
        setCurrentTenant(tenant);
      }
    } catch (error) {
      console.error('Error in tenant detection:', error);
      setCurrentTenant(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    detectTenant();
  }, []);

  const value = {
    currentTenant,
    loading,
    detectTenant
  };

  return (
    <TenantContext.Provider value={value}>
      {!loading && children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
