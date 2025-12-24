/* eslint-disable import/first */
import './polyfills';
import React from 'react';
import ReactDOM from 'react-dom/client';
// import './index.css';
// import './styles/cross-browser.css';

// Debug
console.log('React iniciando...');

// Remover el loading inicial
try {
  if (typeof window !== 'undefined' && window.__removeLoading) {
    window.__removeLoading();
  } else {
    // Fallback
    const loader = document.getElementById('initial-loading');
    if (loader) {
      loader.style.display = 'none';
    }
  }
} catch (e) {
  console.error('Error removiendo loader:', e);
}

// Cargar Ant Design CSS condicionalmente
// if (typeof window !== 'undefined') {
//   const shouldLoadAntdReset = window.location.pathname.startsWith('/backoffice') ||
//     window.location.pathname.startsWith('/admin') ||
//     window.location.pathname.startsWith('/dashboard');

//   if (shouldLoadAntdReset) {
//     import('antd/dist/reset.css').catch(() => {
//       console.warn('No se pudo cargar antd reset.css');
//     });
//   }
// }

// Importar App (ya está en tu código)
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { FooterProvider } from './contexts/FooterContext';
import { HeaderProvider } from './contexts/HeaderContext';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary capturó:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          fontFamily: 'Arial, sans-serif',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <h1 style={{ color: '#d32f2f' }}>áUps! Algo salió mal</h1>
          <p style={{ margin: '20px 0', color: '#555' }}>
            {this.state.error?.toString() || 'Error desconocido'}
          </p>
          <div style={{ marginTop: '30px' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Crear root
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('No se encontró el elemento #root');
  document.body.innerHTML = '<h1>Error: No se encontró el elemento raíz</h1>';
} else {
  const root = ReactDOM.createRoot(rootElement);

  // Renderizar con Error Boundary
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <I18nextProvider i18n={i18n}>
          <Router>
            <AuthProvider>
              <TenantProvider>
                <ThemeProvider>
                  <HeaderProvider>
                    <FooterProvider>
                      <App />
                      <SpeedInsights />
                    </FooterProvider>
                  </HeaderProvider>
                </ThemeProvider>
              </TenantProvider>
            </AuthProvider>
          </Router>
        </I18nextProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );

  console.log('React montado correctamente');
}