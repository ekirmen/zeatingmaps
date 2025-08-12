import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { useTenant } from './contexts/TenantContext';
import TenantErrorBoundary from './components/TenantErrorBoundary';
import StoreApp from './store/StoreApp';
import BackofficeApp from './backoffice/BackofficeApp';
import { getCurrentDomainConfig, shouldShowSaaS, shouldShowBackoffice, shouldShowStore } from './config/domainConfig';
import './index.css';

// Componente de carga
const LoadingSpinner = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    flexDirection: 'column'
  }}>
    <div style={{ 
      width: '50px', 
      height: '50px', 
      border: '5px solid #f3f3f3',
      borderTop: '5px solid #1890ff',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
    <p style={{ marginTop: '20px', color: '#666' }}>Cargando aplicación...</p>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Componente principal de la aplicación
const App = () => {
  const { loading, error, domainConfig, isMainDomain } = useTenant();
  
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
      colorPrimary: config.theme.primaryColor,
      colorSuccess: config.theme.secondaryColor,
    },
  };

  // Determinar qué funcionalidades mostrar basándose en el tenant o configuración del dominio
  const showSaaS = domainConfig ? domainConfig.features.showSaaS : shouldShowSaaS();
  const showBackoffice = domainConfig ? domainConfig.features.showBackoffice : shouldShowBackoffice();
  const showStore = domainConfig ? domainConfig.features.showStore : shouldShowStore();

  // Para el dominio principal (sistema.veneventos.com), mostrar todo
  const isMain = isMainDomain();
  const finalShowSaaS = isMain ? true : showSaaS;
  const finalShowBackoffice = isMain ? true : showBackoffice;
  const finalShowStore = isMain ? true : showStore;

  return (
    <ConfigProvider theme={theme}>
      <Router>
        <Routes>
          {/* Rutas del Backoffice - Solo si está habilitado */}
          {finalShowBackoffice && (
            <>
              <Route path="/dashboard/*" element={<BackofficeApp />} />
              <Route path="/backoffice/*" element={<BackofficeApp />} />
              <Route path="/admin/*" element={<BackofficeApp />} />
              <Route path="/saas/*" element={<BackofficeApp />} />
            </>
          )}

          {/* Rutas del Store - Solo si está habilitado */}
          {finalShowStore && (
            <>
              <Route path="/store/*" element={<StoreApp />} />
              <Route path="/eventos/*" element={<StoreApp />} />
              <Route path="/comprar/*" element={<StoreApp />} />
            </>
          )}

          {/* Ruta principal - Redirigir según configuración */}
          <Route path="/" element={
            <Navigate to={
              finalShowSaaS ? "/dashboard" : 
              finalShowStore ? "/store" : 
              "/dashboard"
            } replace />
          } />

          {/* Ruta de fallback - Redirigir según configuración */}
          <Route path="*" element={
            <Navigate to={
              finalShowSaaS ? "/dashboard" : 
              finalShowStore ? "/store" : 
              "/dashboard"
            } replace />
          } />
        </Routes>
      </Router>
    </ConfigProvider>
  );
};

export default App;
