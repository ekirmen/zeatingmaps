import React, { createContext, useContext, useState, useEffect } from 'react';

const TenantContext = createContext({});

export const TenantProvider = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState(null);
  const [domainConfig, setDomainConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simular carga de tenant
    const loadTenantData = async () => {
      try {
        setLoading(true);
        // Aquí normalmente harías una llamada a tu API
        // para obtener la configuración del tenant basado en el dominio

        const hostname = window.location.hostname;
        let tenantData = null;
        let domainData = null;

        // Ejemplo básico - ajusta según tu lógica
        if (hostname.includes('localhost')) {
          tenantData = {
            id: 'local',
            name: 'Desarrollo Local',
            theme: { primaryColor: '#1890ff', secondaryColor: '#52c41a' },
            analytics: { enabled: false },
            features: { showSaaS: true, showBackoffice: true, showStore: true },
          };
        } else {
          // Lógica para producción
          tenantData = {
            id: 'default',
            name: 'VEN Eventos',
            theme: { primaryColor: '#1890ff', secondaryColor: '#52c41a' },
            analytics: { enabled: true },
            features: { showSaaS: true, showBackoffice: true, showStore: true },
          };
        }

        setCurrentTenant(tenantData);
        setDomainConfig(domainData);
      } catch (err) {
        console.error('Error loading tenant:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadTenantData();
  }, []);

  const value = {
    currentTenant,
    domainConfig,
    loading,
    error,
    setCurrentTenant,
    updateTenant: updates => {
      setCurrentTenant(prev => ({ ...prev, ...updates }));
    },
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant debe usarse dentro de TenantProvider');
  }
  return context;
};

export default TenantContext;
