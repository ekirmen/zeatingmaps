/* eslint-disable import/first */
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/cross-browser.css';

if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
  try {
    ['log', 'info', 'debug'].forEach((m) => {
      console[m] = () => {};
    });
  } catch (e) {
  }
}
if (typeof window !== 'undefined') {
  const shouldLoadAntdReset = window.location.pathname.startsWith('/backoffice')
    || window.location.pathname.startsWith('/admin')
    || window.location.pathname.startsWith('/dashboard');

  if (shouldLoadAntdReset) {
    import('antd/dist/reset.css').catch(() => {
    });
  } else {
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

if (typeof window !== 'undefined') {
  import('./utils/indexedDBCache').then(({ default: indexedDBCache }) => {
    // Inicializar caché
    indexedDBCache.init().catch((error) => {
    });

    setInterval(() => {
      indexedDBCache.cleanup().catch((error) => {
      });
    }, 24 * 60 * 60 * 1000); // 24 horas

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

if (process.env.NODE_ENV === 'production') {
  
  reportWebVitals(sendToAnalytics);

  performanceMonitor.startMonitoring((metric) => {
    if (process.env.NODE_ENV === 'development') {
    }
  });

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

try {
  if (typeof window !== 'undefined' && window.__removeInitialPaint) {
    window.__removeInitialPaint();
  }
} catch (e) {
}
