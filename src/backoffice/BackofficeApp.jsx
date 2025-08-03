import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import BackofficeLayout from './components/BackofficeLayout';
import Dashboard from './pages/Dashboard';
import BoleteriaMain from './pages/CompBoleteria/BoleteriaMain';
import Evento from './pages/Evento';
import Usuarios from './pages/Usuarios';
import PaymentGateways from './pages/PaymentGateways';
import PaymentAnalytics from './pages/PaymentAnalytics';
import RefundManagement from './pages/RefundManagement';
import Reports from './pages/Reports';
import SystemSettings from './pages/SystemSettings';
import AuditLogs from './pages/AuditLogs';
import PrinterSettings from './pages/PrinterSettings';
import FormatoEntrada from './pages/FormatoEntrada';

const BackofficeApp = () => {
  return (
    <Router>
      <Routes>
        <Route path="/dashboard" element={<BackofficeLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="boleteria" element={<BoleteriaMain />} />
          <Route path="boleteria-main" element={<BoleteriaMain />} />
          <Route path="eventos" element={<Evento />} />
          <Route path="eventos-main" element={<Evento />} />
          <Route path="clientes" element={<Usuarios />} />
          <Route path="pasarelas" element={<PaymentGateways />} />
          <Route path="analytics" element={<PaymentAnalytics />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reembolsos" element={<RefundManagement />} />
          <Route path="settings" element={<SystemSettings />} />
          <Route path="logs" element={<AuditLogs />} />
          <Route path="printer" element={<PrinterSettings />} />
          <Route path="formato-entrada" element={<FormatoEntrada />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default BackofficeApp;
