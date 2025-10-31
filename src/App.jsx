import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { useTenant } from './contexts/TenantContext';
import TenantErrorBoundary from './components/TenantErrorBoundary';
import StoreApp from './store/StoreApp';
import MapShortRoute from './store/pages/MapShortRoute';
import BackofficeAppWithRoles from './backoffice/BackofficeAppWithRoles';
import {
  getCurrentDomainConfig,
  shouldShowSaaS,
  shouldShowBackoffice,
  shouldShowStore,
  isMainDomain as isMainDomainFallback,
} from './config/domainConfig';
import { ThemeProvider } from './contexts/ThemeContext';
import VercelAnalytics from './components/VercelAnalytics';
import VercelSpeedInsights from './components/VercelSpeedInsights';
import LegalTerms from './store/pages/LegalTerms';
import './index.css';

// Componente de carga
const LoadingSpinner = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    fontSize: '18px',
    color: '#666'
  }}>
    Cargando aplicación...
  </div>
);

// Componente principal de la aplicación
const App = () => {
  // TEST: Log simple para verificar si App.jsx funciona
  console.log('🚀 [App.jsx] Componente principal ejecutándose');
  console.log('🚀 [App.jsx] Timestamp:', new Date().toISOString());
  
  const { loading, error, domainConfig } = useTenant();
  
  // Usar configuración dinámica del tenant si está disponible, sino usar configuración estática del dominio
  const config = domainConfig || getCurrentDomainConfig();

  // Si está cargando, mostrar spinner
  if (loading) {
    return <LoadingSpinner />;
  }

  // Si hay error, mostrar error boundary
  if (error) {
    return <TenantErrorBoundary error={error} />;
  }

  // Configurar tema de Ant Design según el tenant o dominio
  const theme = {
    token: {
      colorPrimary: config?.theme?.primaryColor || '#1890ff',
      colorSuccess: config?.theme?.secondaryColor || '#52c41a',
    },
  };

  // Determinar qué funcionalidades mostrar basándose en el tenant o configuración del dominio
  const showSaaS = domainConfig ? domainConfig.features.showSaaS : shouldShowSaaS();
  const showBackoffice = domainConfig ? domainConfig.features.showBackoffice : shouldShowBackoffice();
  const showStore = domainConfig ? domainConfig.features.showStore : shouldShowStore();

  // Para el dominio principal (sistema.veneventos.com), mostrar todo
  const isMain = domainConfig?.isMainDomain ?? isMainDomainFallback();
  const finalShowSaaS = isMain ? true : showSaaS;
  const finalShowBackoffice = isMain ? true : showBackoffice;
  const finalShowStore = isMain ? true : showStore;

  return (
    <ThemeProvider>
      <ConfigProvider theme={theme}>
        <Routes>
          {/* Rutas del Backoffice - Solo si está habilitado */}
          {finalShowBackoffice && (
            <>
              <Route path="/dashboard/*" element={<BackofficeAppWithRoles />} />
              <Route path="/backoffice/*" element={<BackofficeAppWithRoles />} />
              <Route path="/admin/*" element={<BackofficeAppWithRoles />} />
              <Route path="/saas/*" element={<BackofficeAppWithRoles />} />
            </>
          )}

          {/* Rutas del Store - Solo si está habilitado */}
          {finalShowStore && (
            <>
              <Route path="/store/*" element={<StoreApp />} />
              <Route path="/eventos/*" element={<StoreApp />} />
              <Route path="/comprar/*" element={<StoreApp />} />
              <Route path="/r/map" element={<MapShortRoute />} />
            </>
          )}

          {/* Ruta principal - Redirigir según configuración */}
          <Route path="/terminos" element={<LegalTerms />} />
          {/* Redirección por defecto */}
          <Route path="/" element={
            <Navigate
              to={
                finalShowStore
                  ? "/store"
                  : finalShowSaaS
                  ? "/dashboard"
                  : "/dashboard"
              }
              replace
            />
          } />

          {/* Ruta de fallback global -> 404 de Store si el store está activo; de lo contrario, redirigir al dashboard */}
          <Route
            path="*"
            element={
              finalShowStore
                ? <Navigate to="/store/404" replace />
                : <Navigate to="/dashboard" replace />
            }
          />
        </Routes>
        
        {/* Vercel Analytics - Solo en producción */}
        <VercelAnalytics />
        
        {/* Vercel Speed Insights - Solo en producción */}
        <VercelSpeedInsights />
      </ConfigProvider>
    </ThemeProvider>
  );
};

export default App;
