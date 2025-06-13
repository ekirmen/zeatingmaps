import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Asegúrate de que aquí están las directivas de Tailwind
import 'antd/dist/reset.css';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { FooterProvider } from './contexts/FooterContext';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <FooterProvider>
            <App />
          </FooterProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
