import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'antd/dist/reset.css';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { FooterProvider } from './contexts/FooterContext';
import { HeaderProvider } from './contexts/HeaderContext';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { SpeedInsights } from '@vercel/speed-insights/react';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <Router>
        <AuthProvider>
          <ThemeProvider>
            <HeaderProvider>
              <FooterProvider>
                <App />
                <SpeedInsights />
              </FooterProvider>
            </HeaderProvider>
          </ThemeProvider>
        </AuthProvider>
      </Router>
    </I18nextProvider>
  </React.StrictMode>
);
