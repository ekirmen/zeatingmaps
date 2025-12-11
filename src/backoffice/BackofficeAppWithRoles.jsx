import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RoleProvider } from './components/RoleBasedAccess';
import ProtectedRoute from './components/ProtectedRoute';
import BackofficeLayoutWithRoles from './BackofficeLayoutWithRoles';
import AuthGuard from './components/AuthGuard';
import Dashboard from './pages/Dashboard';
import Recinto from './pages/Recinto';
import Plano from './pages/Plano';
import Usuarios from './pages/Usuarios';
import PaymentAnalytics from './pages/PaymentAnalytics';
import Entrada from './pages/Entrada';
import Productos from './pages/Productos';
import PlantillasProductos from './pages/PlantillasProductos';
import ComisionesTasas from './pages/ComisionesTasas';
import Paquetes from './pages/Paquetes';
import PaymentGateways from './pages/PaymentGateways';
import PlantillaPrecios from './pages/PlantillaPrecios';
import Cupos from './pages/Cupos';
import PlantillasCupos from './pages/PlantillasCupos';
import Abonos from './pages/Abonos';
import Afiliados from './pages/Afiliados';
import CreateIva from './pages/CreateIva';
import SalesTransactions from './pages/SalesTransactions';
import CRM from './pages/CRM';
import Tags from './pages/Tags';
import SystemSettings from './pages/SystemSettings';
import SeatSettings from './pages/SeatSettings';
import PrinterSettings from './pages/PrinterSettings';
import TenantEmailConfigPanel from './components/TenantEmailConfigPanel';
import AuditLogs from './pages/AuditLogs';
import RefundManagement from './pages/RefundManagement';
import EmailCampaigns from './pages/EmailCampaigns';
import SaasSettings from './pages/SaasSettings';
import BillingDashboard from '../saas/components/BillingDashboard';
import PaymentGatewayConfig from '../saas/components/PaymentGatewayConfig';
import RoleManagement from '../saas/components/RoleManagement';
import SaasUserManagement from './pages/SaasUserManagementSimple';
import TenantDetail from './pages/TenantDetail';

// Lazy load de páginas grandes para reducir bundle inicial
const CrearMapaPage = lazy(() => import('./pages/CrearMapaPage'));
const Boleteria = lazy(() => import('./pages/Boleteria'));
const WebStudio = lazy(() => import('./pages/WebStudio'));
const Funciones = lazy(() => import('./pages/Funciones'));
const Reports = lazy(() => import('./pages/Reports'));
const Evento = lazy(() => import('./pages/Evento'));
const SaasDashboard = lazy(() => import('./pages/SaasDashboard'));
const ApiExplorer = lazy(() => import('../saas/pages/ApiExplorer'));

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
                  <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Cargando editor de mapas...</div>}>
                    <CrearMapaPage />
                  </Suspense>
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
            <Route
              path="liquidacion"
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
                  <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Cargando...</div>}>
                    <Evento />
                  </Suspense>
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
                  <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Cargando...</div>}>
                    <Funciones />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="cupos" 
              element={
                <ProtectedRoute permission="funciones">
                  <Cupos />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="plantillas-cupos" 
              element={
                <ProtectedRoute permission="plantillas_precios">
                  <PlantillasCupos />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="filas-virtuales" 
              element={
                <ProtectedRoute permission="funciones">
                  <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Cargando...</div>}>
                    <Funciones />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route
              path="paquetes"
              element={
                <ProtectedRoute permission="paquetes">
                  <Paquetes />
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
              path="afiliados" 
              element={
                <ProtectedRoute permission="afiliados">
                  <Afiliados />
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
                  <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Cargando boletería...</div>}>
                    <Boleteria />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="transacciones"
              element={
                <ProtectedRoute permission="boleteria">
                  <SalesTransactions />
                </ProtectedRoute>
              }
            />
            <Route 
              path="reportes" 
              element={
                <ProtectedRoute permission="reportes">
                  <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Cargando...</div>}>
                    <Reports />
                  </Suspense>
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
            <Route 
              path="email-campaigns" 
              element={
                <ProtectedRoute permission="email_campaigns">
                  <EmailCampaigns />
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
            <Route 
              path="webstudio" 
              element={
                <ProtectedRoute permission="personalizacion">
                  <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Cargando WebStudio...</div>}>
                    <WebStudio />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            
            {/* Panel SaaS - Solo para usuarios del sistema */}
            <Route 
              path="saas" 
              element={
                <ProtectedRoute permission="saas">
                  <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Cargando...</div>}>
                    <SaasDashboard />
                  </Suspense>
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
                  <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Cargando API Explorer...</div>}>
                    <ApiExplorer />
                  </Suspense>
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