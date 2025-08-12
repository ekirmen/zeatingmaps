import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTenant } from './contexts/TenantContext';
import StoreApp from './store/StoreApp';
import BackofficeApp from './backoffice/BackofficeApp';
import TenantErrorBoundary from './components/TenantErrorBoundary';

function App() {
  const location = useLocation();
  const path = location.pathname;
  const { currentTenant, loading, error, detectTenant } = useTenant();

  // Determina si la ruta actual pertenece al backoffice
  const isBackoffice = path.startsWith('/backoffice') || path.startsWith('/dashboard');

  // Si está cargando, mostrar loading
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Detectando empresa...
      </div>
    );
  }

  // Si hay error de tenant y NO es backoffice, mostrar el error
  if (error && !isBackoffice) {
    // Extraer subdominio del hostname
    const hostname = window.location.hostname;
    let subdomain = null;
    
    if (hostname.includes('.vercel.app')) {
      const parts = hostname.split('.');
      if (parts.length >= 3) {
        const firstPart = parts[0];
        if (firstPart.includes('-')) {
          subdomain = firstPart.split('-')[0];
        } else {
          subdomain = firstPart;
        }
      }
    } else if (hostname.includes('.')) {
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        subdomain = parts[0];
      }
    }

    return (
      <TenantErrorBoundary 
        error={error}
        subdomain={subdomain}
        onRetry={detectTenant}
      />
    );
  }

  // Si es backoffice, siempre permitir acceso
  if (isBackoffice) {
    return <BackofficeApp />;
  }

  // Si no hay tenant pero no hay error (caso de desarrollo local)
  if (!currentTenant && !error) {
    return <StoreApp />;
  }

  // Si hay tenant válido, mostrar la aplicación normal
  if (currentTenant) {
    return <StoreApp />;
  }

  // Caso por defecto
  return <StoreApp />;
}

export default App;
