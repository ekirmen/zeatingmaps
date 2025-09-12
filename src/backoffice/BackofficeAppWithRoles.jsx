import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RoleProvider } from './components/RoleBasedAccess';
import ProtectedRoute from './components/ProtectedRoute';
import BackofficeLayoutWithRoles from './BackofficeLayoutWithRoles';
import AuthGuard from './components/AuthGuard';

// Importar todas las páginas
import Dashboard from './pages/Dashboard';
import Recinto from './pages/Recinto';
import Plano from './pages/Plano';
import CrearMapaPage from './pages/CrearMapaPage';
import Usuarios from './pages/Usuarios';
import PaymentAnalytics from './pages/PaymentAnalytics';
import Entrada from './pages/Entrada';
import Productos from './pages/Productos';
import PlantillasProductos from './pages/PlantillasProductos';
import ComisionesTasas from './pages/ComisionesTasas';
import PaymentGateways from './pages/PaymentGateways';
import Evento from './pages/Evento';
import PlantillaPrecios from './pages/PlantillaPrecios';
import Funciones from './pages/Funciones';
import Abonos from './pages/Abonos';
import CreateIva from './pages/CreateIva';
import Boleteria from './pages/BoleteriaSimple';
import Reports from './pages/Reports';
import CRM from './pages/CRM';
import Tags from './pages/Tags';
import SystemSettings from './pages/SystemSettings';
import SeatSettings from './pages/SeatSettings';
import PrinterSettings from './pages/PrinterSettings';
import TenantEmailConfigPanel from './components/TenantEmailConfigPanel';
import AuditLogs from './pages/AuditLogs';
import RefundManagement from './pages/RefundManagement';
import SaasDashboard from './pages/SaasDashboard';
import SaasSettings from './pages/SaasSettings';
import BillingDashboard from '../saas/components/BillingDashboard';
import PaymentGatewayConfig from '../saas/components/PaymentGatewayConfig';
import RoleManagement from '../saas/components/RoleManagement';
import ApiExplorer from '../saas/pages/ApiExplorer';
import SaasUserManagement from './pages/SaasUserManagementSimple';
import TenantDetail from './pages/TenantDetail';

const BackofficeAppWithRoles = () => {
  return (
    <AuthGuard>
      <RoleProvider>
        <Routes>
          <Route path="/" element={<BackofficeLayoutWithRoles />}>
          {/* Dashboard Principal */}
          <Route 
            index 
            element={
              <ProtectedRoute permission="dashboard">
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Administración */}
          <Route 
            path="recintos" 
            element={
              <ProtectedRoute permission="recintos">
                <Recinto />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="plano" 
            element={
              <ProtectedRoute permission="recintos">
                <Plano />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="crear-mapa/:salaId?" 
            element={
              <ProtectedRoute permission="recintos">
                <CrearMapaPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="usuarios" 
            element={
              <ProtectedRoute permission="usuarios">
                <Usuarios />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="liquidaciones" 
            element={
              <ProtectedRoute permission="liquidaciones">
                <PaymentAnalytics />
              </ProtectedRoute>
            } 
          />
          
          {/* Programación */}
          <Route 
            path="entradas" 
            element={
              <ProtectedRoute permission="entradas">
                <Entrada />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="productos" 
            element={
              <ProtectedRoute permission="productos">
                <Productos />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="plantillas-productos" 
            element={
              <ProtectedRoute permission="plantillas_productos">
                <PlantillasProductos />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="donaciones" 
            element={
              <ProtectedRoute permission="entradas">
                <Entrada />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="comisiones" 
            element={
              <ProtectedRoute permission="comisiones">
                <ComisionesTasas />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="seguros" 
            element={
              <ProtectedRoute permission="seguros">
                <PaymentGateways />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="envio" 
            element={
              <ProtectedRoute permission="envio">
                <PaymentGateways />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="eventos" 
            element={
              <ProtectedRoute permission="eventos">
                <Evento />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="plantillas-precios" 
            element={
              <ProtectedRoute permission="plantillas_precios">
                <PlantillaPrecios />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="funciones" 
            element={
              <ProtectedRoute permission="funciones">
                <Funciones />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="cupos" 
            element={
              <ProtectedRoute permission="funciones">
                <Funciones />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="plantillas-cupos" 
            element={
              <ProtectedRoute permission="plantillas_precios">
                <PlantillaPrecios />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="filas-virtuales" 
            element={
              <ProtectedRoute permission="funciones">
                <Funciones />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="paquetes" 
            element={
              <ProtectedRoute permission="paquetes">
                <Abonos />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="multipase" 
            element={
              <ProtectedRoute permission="multipase">
                <Abonos />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="abonos" 
            element={
              <ProtectedRoute permission="abonos">
                <Abonos />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="iva" 
            element={
              <ProtectedRoute permission="iva">
                <CreateIva />
              </ProtectedRoute>
            } 
          />
          
          {/* Ventas */}
          <Route 
            path="boleteria" 
            element={
              <ProtectedRoute permission="boleteria">
                <Boleteria />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="reportes" 
            element={
              <ProtectedRoute permission="reportes">
                <Reports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="crm" 
            element={
              <ProtectedRoute permission="crm">
                <CRM />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="tags" 
            element={
              <ProtectedRoute permission="tags">
                <Tags />
              </ProtectedRoute>
            } 
          />
          
          {/* Configuración */}
          <Route 
            path="settings" 
            element={
              <ProtectedRoute permission="settings">
                <SystemSettings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="seat-settings" 
            element={
              <ProtectedRoute permission="seat_settings">
                <SeatSettings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="printer-settings" 
            element={
              <ProtectedRoute permission="printer_settings">
                <PrinterSettings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="email-config" 
            element={
              <ProtectedRoute permission="email_config">
                <TenantEmailConfigPanel />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="audit-logs" 
            element={
              <ProtectedRoute permission="audit_logs">
                <AuditLogs />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="refund-management" 
            element={
              <ProtectedRoute permission="refund_management">
                <RefundManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="payment-analytics" 
            element={
              <ProtectedRoute permission="payment_analytics">
                <PaymentAnalytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="payment-gateways" 
            element={
              <ProtectedRoute permission="payment_gateways">
                <PaymentGateways />
              </ProtectedRoute>
            } 
          />
          
          {/* Panel SaaS - Solo para usuarios del sistema */}
          <Route 
            path="saas" 
            element={
              <ProtectedRoute permission="saas">
                <SaasDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="saas/users" 
            element={
              <ProtectedRoute permission="saas_roles">
                <SaasUserManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="saas/settings" 
            element={
              <ProtectedRoute permission="saas_settings">
                <SaasSettings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="saas/billing" 
            element={
              <ProtectedRoute permission="saas_billing">
                <BillingDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="saas/payment-gateways" 
            element={
              <ProtectedRoute permission="saas_payment_gateways">
                <PaymentGatewayConfig />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="saas/roles" 
            element={
              <ProtectedRoute permission="saas_roles">
                <RoleManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="saas/api-explorer" 
            element={
              <ProtectedRoute permission="saas_api_explorer">
                <ApiExplorer />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="tenant/:id" 
            element={
              <ProtectedRoute permission="saas">
                <TenantDetail />
              </ProtectedRoute>
            } 
          />
          
          {/* Redirecciones */}
          <Route path="*" element={<Navigate to="." replace />} />
        </Route>
      </Routes>
    </RoleProvider>
    </AuthGuard>
  );
};

export default BackofficeAppWithRoles;
