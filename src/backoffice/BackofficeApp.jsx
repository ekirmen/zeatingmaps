import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import BackofficeLayout from './components/BackofficeLayout';
import Dashboard from './pages/Dashboard';
import Boleteria from './pages/CompBoleteria/Boleteria';
import BoleteriaMain from './pages/CompBoleteria/BoleteriaMain';
import Eventos from './pages/Eventos';
import EventosMain from './pages/EventosMain';
import Clientes from './pages/Clientes';
import PaymentGateways from './pages/PaymentGateways';
import PaymentAnalytics from './pages/PaymentAnalytics';
import RefundManagement from './pages/RefundManagement';
import Reports from './pages/Reports';
import SystemSettings from './pages/SystemSettings';
import AuditLogs from './pages/AuditLogs';

const BackofficeApp = () => {
  return (
    <Router>
      <Routes>
        <Route path="/dashboard" element={<BackofficeLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="boleteria" element={<Boleteria />} />
          <Route path="boleteria-main" element={<BoleteriaMain />} />
          <Route path="eventos" element={<Eventos />} />
          <Route path="eventos-main" element={<EventosMain />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="pasarelas" element={<PaymentGateways />} />
          <Route path="analytics" element={<PaymentAnalytics />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reembolsos" element={<RefundManagement />} />
          <Route path="settings" element={<SystemSettings />} />
          <Route path="logs" element={<AuditLogs />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default BackofficeApp;
