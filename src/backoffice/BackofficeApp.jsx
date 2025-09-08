import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import BackofficeLayout from './components/BackofficeLayout';
import Dashboard from './pages/Dashboard';
import BoleteriaMain from './pages/CompBoleteria/BoleteriaMainCustomDesign';
import Evento from './pages/Evento';
import Usuarios from './pages/Usuarios';
import PaymentGateways from './pages/PaymentGateways';
import ComisionesTasas from './pages/ComisionesTasas';
import PaymentAnalytics from './pages/PaymentAnalytics';
import RefundManagement from './pages/RefundManagement';
import Reports from './pages/Reports';
import ScheduledReports from './pages/ScheduledReports';
import EmailTemplates from './pages/EmailTemplates';
import SystemSettings from './pages/SystemSettings';
import AuditLogs from './pages/AuditLogs';
import PrinterSettings from './pages/PrinterSettings';
import FormatoEntrada from './pages/FormatoEntrada';
import Recinto from './pages/Recinto';
import PlantillaPrecios from './pages/PlantillaPrecios';
import Funciones from './pages/Funciones';
import Entrada from './pages/Entrada';
import Galeria from './pages/Galeria';
import CreateIva from './pages/CreateIva';
import Tags from './pages/Tags';
import WebStudio from './pages/WebStudio';
import PagesSettings from './pages/PagesSettings';
import EmailCampaigns from './pages/EmailCampaigns';
import Abonos from './pages/Abonos';
import Plano from './pages/Plano';
import CrearMapaPage from './pages/CrearMapaPage';
import CRM from './pages/CRM';
import Mailchimp from './pages/Mailchimp';
import Formularios from './pages/Formularios';
import Productos from './pages/Productos';
import PlantillasProductos from './pages/PlantillasProductos';
import SaasDashboard from './pages/SaasDashboard';

import TenantDetail from './pages/TenantDetail';
import SaasSettings from './pages/SaasSettings';
import LegalTerms from '../store/pages/LegalTerms';
import Descuentos from './pages/Descuentos';
import WebColors from './pages/WebColors';
import SeatSettings from './pages/SeatSettings';
import TenantEmailConfigPanel from './components/TenantEmailConfigPanel';
import BillingDashboard from '../saas/components/BillingDashboard';
import PaymentGatewayConfig from '../saas/components/PaymentGatewayConfig';
import RoleManagement from '../saas/components/RoleManagement';

const BackofficeApp = () => {
  return (
    <Routes>
     <Route path="/" element={<BackofficeLayout />}>
        <Route index element={<Dashboard />} />
        
        {/* Actividad */}
        
        {/* Administración */}
        <Route path="recintos" element={<Recinto />} />
        <Route path="plano" element={<Plano />} />
        <Route path="crear-mapa/:salaId?" element={<CrearMapaPage />} />

        <Route path="usuarios" element={<Usuarios />} />
        <Route path="liquidaciones" element={<PaymentAnalytics />} />
        
        {/* Programación */}
        <Route path="entradas" element={<Entrada />} />
        <Route path="productos" element={<Productos />} />
        <Route path="plantillas-productos" element={<PlantillasProductos />} />
        <Route path="donaciones" element={<Entrada />} />
        <Route path="comisiones" element={<ComisionesTasas />} />
        <Route path="seguros" element={<PaymentGateways />} />
        <Route path="envio" element={<PaymentGateways />} />
        <Route path="eventos" element={<Evento />} />
        <Route path="plantillas-precios" element={<PlantillaPrecios />} />
        <Route path="funciones" element={<Funciones />} />
        <Route path="cupos" element={<Funciones />} />
        <Route path="plantillas-cupos" element={<PlantillaPrecios />} />
        <Route path="filas-virtuales" element={<Funciones />} />
        <Route path="paquetes" element={<Abonos />} />
        <Route path="multipase" element={<Abonos />} />
        <Route path="abonos" element={<Abonos />} />
        <Route path="iva" element={<CreateIva />} />
        <Route path="descuentos" element={<Descuentos />} />
        
        {/* CRM */}
        <Route path="mailchimp" element={<Mailchimp />} />
        <Route path="formularios" element={<Formularios />} />
        <Route path="notificaciones" element={<CRM />} />
        <Route path="fanid" element={<CRM />} />
        <Route path="encuestas" element={<CRM />} />
        <Route path="email-campaigns" element={<EmailCampaigns />} />
        <Route path="tags" element={<Tags />} />
        
        {/* Acreditaciones */}
        <Route path="accreditation-management" element={<CRM />} />
        <Route path="accreditations" element={<CRM />} />
        
        {/* Promociones */}
        <Route path="promos" element={<PaymentGateways />} />
        <Route path="gift-cards" element={<PaymentGateways />} />
        <Route path="invitations" element={<PaymentGateways />} />
        <Route path="loyalty-clubs" element={<PaymentGateways />} />
        <Route path="group-promotions" element={<PaymentGateways />} />
        
        {/* Informes */}
        <Route path="reports" element={<Reports />} />
        <Route path="scheduled-reports" element={<ScheduledReports />} />
        <Route path="email-templates" element={<EmailTemplates />} />
        
        {/* Personalización */}
        <Route path="sites" element={<WebStudio />} />
        <Route path="formato-entrada" element={<FormatoEntrada />} />
        <Route path="banner-ads" element={<WebStudio />} />
        <Route path="legal-texts" element={<LegalTerms />} />
        <Route path="webstudio" element={<WebStudio />} />
        <Route path="pages" element={<PagesSettings />} />
        <Route path="galeria" element={<Galeria />} />
        <Route path="webcolors" element={<WebColors />} />
        
        {/* Boletería */}
        <Route path="boleteria" element={<BoleteriaMain />} />
        
        {/* Panel SaaS */}
        <Route path="saas" element={<SaasDashboard />} />
        <Route path="saas/settings" element={<SaasSettings />} />
        <Route path="saas/billing" element={<BillingDashboard />} />
        <Route path="saas/payment-gateways" element={<PaymentGatewayConfig />} />
        <Route path="saas/roles" element={<RoleManagement />} />

        <Route path="tenant/:id" element={<TenantDetail />} />
        
        {/* Configuración */}
        <Route path="settings" element={<SystemSettings />} />
        <Route path="seat-settings" element={<SeatSettings />} />
        <Route path="printer-settings" element={<PrinterSettings />} />
        <Route path="email-config" element={<TenantEmailConfigPanel />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="refund-management" element={<RefundManagement />} />
        <Route path="payment-analytics" element={<PaymentAnalytics />} />
        <Route path="payment-gateways" element={<PaymentGateways />} />
        
        {/* Redirecciones */}
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Routes>
  );
};

export default BackofficeApp;
