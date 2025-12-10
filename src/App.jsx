/* eslint-disable import/first */
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// SOLO importar ConfigProvider de Ant Design (no todo antd)
import ConfigProvider from 'antd/es/config-provider';

// Importar funciones config directamente
import {
  getCurrentDomainConfig,
  shouldShowSaaS,
  shouldShowBackoffice,
  shouldShowStore,
  isMainDomain as isMainDomainFallback,
} from './config/domainConfig';

// Contexto - mantener sincrónico porque se usa inmediatamente
import { useTenant } from './contexts/TenantContext';

import './index.css';

// Lazy load de contexto
const ThemeProvider = lazy(() => import('./contexts/ThemeContext'));
const TenantErrorBoundary = lazy(() => import('./components/TenantErrorBoundary'));
const MapShortRoute = lazy(() => import('./store/pages/MapShortRoute'));
const VercelAnalytics = lazy(() => import('./components/VercelAnalytics'));
const VercelSpeedInsights = lazy(() => import('./components/VercelSpeedInsights'));
const LegalTerms = lazy(() => import('./store/pages/LegalTerms'));
const PWAInstallPrompt = lazy(() => import('./components/PWAInstallPrompt'));

// Lazy load de las apps principales para reducir el bundle inicial
const StoreApp = lazy(() => import('./store/StoreApp'));
const BackofficeAppWithRoles = lazy(() => import('./backoffice/BackofficeAppWithRoles'));

// Componente de carga optimizado
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '16px',
    color: '#666'
  }}>
    Cargando...
  </div>
);

// Componente principal optimizado
const App = () => {
  const { loading, error, domainConfig } = useTenant();

  // Usar configuración dinámica del tenant si está disponible, sino usar configuración estática del dominio
  const config = domainConfig || getCurrentDomainConfig();

  // Si está cargando, mostrar spinner
  if (loading) {
    return <LoadingSpinner />;
  }

  // Si hay error, mostrar error boundary
  if (error) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <TenantErrorBoundary error={error} />
      </Suspense>
    );
  }

  // Configurar tema de Ant Design según el tenant o dominio
  const theme = {
    token: {
      colorPrimary: config?.theme?.primaryColor || '#1890ff',
      colorSuccess: config?.theme?.secondaryColor || '#52c41a',
    },
  };

  // Determinar qué funcionalidades mostrar
  const showSaaS = domainConfig ? domainConfig.features.showSaaS : shouldShowSaaS();
  const showBackoffice = domainConfig ? domainConfig.features.showBackoffice : shouldShowBackoffice();
  const showStore = domainConfig ? domainConfig.features.showStore : shouldShowStore();

  // Para el dominio principal
  const isMain = domainConfig?.isMainDomain ?? isMainDomainFallback();
  const finalShowSaaS = isMain ? true : showSaaS;
  const finalShowBackoffice = isMain ? true : showBackoffice;
  const finalShowStore = isMain ? true : showStore;

  const defaultPath = (() => {
    if (finalShowStore) return '/store';
    if (finalShowBackoffice) return '/dashboard';
    if (finalShowSaaS) return '/dashboard';
    return '/dashboard';
  })();

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ThemeProvider>
        <ConfigProvider theme={theme}>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Rutas del Backoffice */}
              {finalShowBackoffice && (
                <>
                  <Route path="/dashboard/*" element={<BackofficeAppWithRoles />} />
                  <Route path="/backoffice/*" element={<BackofficeAppWithRoles />} />
                  <Route path="/admin/*" element={<BackofficeAppWithRoles />} />
                  <Route path="/saas/*" element={<BackofficeAppWithRoles />} />
                </>
              )}

              {/* Rutas del Store */}
              {finalShowStore && (
                <>
                  <Route path="/store/*" element={<StoreApp />} />
                  <Route path="/eventos/*" element={<StoreApp />} />
                  <Route path="/comprar/*" element={<StoreApp />} />
                  <Route path="/r/map" element={<MapShortRoute />} />
                </>
              )}

              {/* Otras rutas */}
              <Route path="/terminos" element={<LegalTerms />} />
              <Route path="/" element={<Navigate to={defaultPath} replace />} />

              {/* Ruta de fallback */}
              <Route
                path="*"
                element={
                  finalShowStore
                    ? <Navigate to="/store/404" replace />
                    : <Navigate to="/dashboard" replace />
                }
              />
            </Routes>
          </Suspense>

          {/* Componentes de Vercel */}
          <VercelAnalytics />
          <VercelSpeedInsights />

          {/* PWA */}
          <PWAInstallPrompt />
        </ConfigProvider>
      </ThemeProvider>
    </Suspense>
  );
};

export default React.memo(App);