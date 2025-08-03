import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import Recinto from './pages/Recinto';
import PlantillaPrecios from './pages/PlantillaPrecios';
import Funciones from './pages/Funciones';
import Entrada from './pages/Entrada';
import Galeria from './pages/Galeria';
import Correo from './pages/Correo';
import CrearMapaPage from './pages/CrearMapaPage';
import CreateIva from './pages/CreateIva';
import Tags from './pages/Tags';
import WebStudio from './pages/WebStudio';
import WebHeader from './pages/WebHeader';
import WebFooter from './pages/WebFooter';
import WebColors from './pages/WebColors';
import EmailCampaigns from './pages/EmailCampaigns';
import EmailPageCreator from './pages/EmailPageCreator';
import Abonos from './pages/Abonos';
import Actividad from './pages/Actividad';
import Referidos from './pages/Referidos';
import CompaniasPage from './pages/CompaniasPage';
import SelectRecintoSala from './pages/SelectRecintoSala';

const BackofficeApp = () => {
  return (
    <Routes>
      <Route path="/dashboard" element={<BackofficeLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="boleteria" element={<BoleteriaMain />} />
        <Route path="boleteria-main" element={<BoleteriaMain />} />
        <Route path="eventos" element={<Evento />} />
        <Route path="eventos-main" element={<Evento />} />
        <Route path="recintos" element={<Recinto />} />
        <Route path="salas" element={<Recinto />} />
        <Route path="plantillas-precios" element={<PlantillaPrecios />} />
        <Route path="funciones" element={<Funciones />} />
        <Route path="entradas" element={<Entrada />} />
        <Route path="galeria" element={<Galeria />} />
        <Route path="correo" element={<Correo />} />
        <Route path="crear-mapa" element={<CrearMapaPage />} />
        <Route path="iva" element={<CreateIva />} />
        <Route path="tags" element={<Tags />} />
        <Route path="webstudio" element={<WebStudio />} />
        <Route path="web-header" element={<WebHeader />} />
        <Route path="web-footer" element={<WebFooter />} />
        <Route path="web-colors" element={<WebColors />} />
        <Route path="email-campaigns" element={<EmailCampaigns />} />
        <Route path="email-page-creator" element={<EmailPageCreator />} />
        <Route path="abonos" element={<Abonos />} />
        <Route path="actividad" element={<Actividad />} />
        <Route path="referidos" element={<Referidos />} />
        <Route path="companias" element={<CompaniasPage />} />
        <Route path="select-recinto-sala" element={<SelectRecintoSala />} />
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
  );
};

export default BackofficeApp;
