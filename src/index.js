/* eslint-disable import/first */
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/cross-browser.css';

// Reduce console noise in production: silence verbose methods to avoid
// excessive CPU and console I/O caused by many debug logs in the bundle.
if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
  try {
    ['log', 'info', 'debug'].forEach((m) => {
      console[m] = () => {};
    });
  } catch (e) {
    // swallow errors; not critical
  }
}
// Defer loading the full antd reset CSS to reduce initial CSS payload.
// Load on-demand for admin/backoffice routes, otherwise expose a helper
// so pages that need antd can request styles later.
if (typeof window !== 'undefined') {
  const shouldLoadAntdReset = window.location.pathname.startsWith('/backoffice')
    || window.location.pathname.startsWith('/admin')
    || window.location.pathname.startsWith('/dashboard');

  if (shouldLoadAntdReset) {
    import('antd/dist/reset.css').catch(() => {
      // swallow errors; best-effort loading of styles
    });
  } else {
    // Allow other modules to opt-in to load antd styles when needed.
    // Usage: `if (window.loadAntdStyles) window.loadAntdStyles()`
    window.loadAntdStyles = () => import('antd/dist/reset.css');
  }
}
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
import { registerServiceWorker } from './utils/pwaService';
import { reportWebVitals, sendToAnalytics } from './utils/webVitals';
import performanceMonitor from './utils/performanceMonitor';

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    registerServiceWorker().catch((error) => {
      console.error('Error registrando Service Worker:', error);
    });
  });
}

// Inicializar caché de IndexedDB y limpieza periódica
if (typeof window !== 'undefined') {
  import('./utils/indexedDBCache').then(({ default: indexedDBCache }) => {
    // Inicializar caché
    indexedDBCache.init().catch((error) => {
    });

    // Limpiar caché expirado cada 24 horas
    setInterval(() => {
      indexedDBCache.cleanup().catch((error) => {
      });
    }, 24 * 60 * 60 * 1000); // 24 horas

    // Limpiar al cargar la página (solo una vez al día)
    const lastCleanup = localStorage.getItem('lastIndexedDBCleanup');
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    if (!lastCleanup || parseInt(lastCleanup, 10) < oneDayAgo) {
      indexedDBCache.cleanup().then(() => {
        localStorage.setItem('lastIndexedDBCleanup', now.toString());
      }).catch((error) => {
      });
    }
  });
}

// Iniciar monitoreo de performance
if (process.env.NODE_ENV === 'production') {
  // Reportar Core Web Vitals
  reportWebVitals(sendToAnalytics);

  // Iniciar monitor de performance
  performanceMonitor.startMonitoring((metric) => {
    // Log en desarrollo para debugging
    if (process.env.NODE_ENV === 'development') {
    }
  });

  // Exponer en window para debugging
  if (process.env.NODE_ENV === 'development') {
    window.performanceMonitor = performanceMonitor;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
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
);

// Remove the initial paint fallback added to `public/index.html` once React has mounted
try {
  if (typeof window !== 'undefined' && window.__removeInitialPaint) {
    window.__removeInitialPaint();
  }
} catch (e) {
  // swallow errors — non-critical
}
