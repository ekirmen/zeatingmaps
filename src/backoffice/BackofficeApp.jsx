import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Providers
import { AuthProvider } from '../contexts/AuthContext';
import { RefProvider } from '../contexts/RefContext';
import { RecintoProvider } from './contexts/RecintoContext';
import { RecintoSalaProvider } from './contexts/RecintoSalaContext';
import { IvaProvider } from './contexts/IvaContext';
import { TagProvider } from './contexts/TagContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Actividad from './pages/Actividad';
import Recinto from './pages/Recinto';
import Usuarios from './pages/Usuarios';
import Referidos from './pages/Referidos';
import Plano from './pages/Plano';
import Evento from './pages/Evento';
import Entrada from './pages/Entrada';
import CrearMapa from './pages/CrearMapaPage';
import PlantillaPrecios from './pages/PlantillaPrecios';
import Descuentos from './pages/Descuentos';
import Funciones from './pages/Funciones';
import Boleteria from './pages/Boleteria';
import CreateIva from './pages/CreateIva';
import FormatoEntrada from './pages/FormatoEntrada';
import Galeria from './pages/Galeria';
import Tags from './pages/Tags';
import Correo from './pages/Correo';
import WebStudio from './pages/WebStudio';
import WebColors from './pages/WebColors';
import WebFooter from './pages/WebFooter';
import WebHeader from './pages/WebHeader';
import Abonos from './pages/Abonos';
import CRM from './pages/CRM';
import EmailCampaigns from './pages/EmailCampaigns';

const BackofficeApp = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    console.log('[BackofficeApp] Current path:', location.pathname);
  }, [location]);

  return (
    <AuthProvider>
      <RefProvider>
        <RecintoProvider>
          <RecintoSalaProvider>
            <IvaProvider>
              <TagProvider>
                <Routes>
                  {/* Login */}
                  <Route path="/backoffice/login" element={<Login />} />

                  {/* Redirección desde /backoffice a /dashboard */}
                  <Route path="/backoffice" element={<Navigate to="/dashboard" replace />} />

                  {/* Rutas internas del Dashboard */}
                  <Route
                    path="/dashboard"
                    element={
                      <Dashboard
                        sidebarCollapsed={sidebarCollapsed}
                        setSidebarCollapsed={setSidebarCollapsed}
                      />
                    }
                  >
                    <Route index element={<Actividad />} />
                    <Route path="actividad" element={<Actividad />} />
                    <Route path="recinto" element={<Recinto />} />
                    <Route path="usuarios" element={<Usuarios />} />
                    <Route path="referidos" element={<Referidos />} />
                    <Route path="plano" element={<Plano />} />
                    <Route path="evento" element={<Evento />} />
                    <Route path="entrada" element={<Entrada />} />
                    <Route path="crear-mapa/:salaId" element={<CrearMapa />} />
                    <Route path="plantillaPrecios" element={<PlantillaPrecios />} />
                    <Route path="descuentos" element={<Descuentos />} />
                    <Route path="funciones" element={<Funciones />} />
                    <Route path="boleteria" element={<Boleteria setSidebarCollapsed={setSidebarCollapsed} />} />
                    <Route path="crear-iva" element={<CreateIva />} />
                    <Route path="abonos" element={<Abonos />} />
                    <Route path="tags" element={<Tags />} />
                    <Route path="galeria" element={<Galeria />} />
                    <Route path="correo" element={<Correo />} />
                    <Route path="web-studio" element={<WebStudio />} />
                    <Route path="colores-web" element={<WebColors />} />
                    <Route path="sitio-web" element={<WebFooter />} />
                                                  <Route path="cabecera" element={<WebHeader />} />
                              <Route path="formato-entrada" element={<FormatoEntrada />} />
                              <Route path="crm" element={<CRM setSidebarCollapsed={setSidebarCollapsed} />} />
                              <Route path="email-campaigns" element={<EmailCampaigns setSidebarCollapsed={setSidebarCollapsed} />} />
                  </Route>

                  {/* Catch-all para rutas erróneas del backoffice */}
                  <Route path="*" element={<Navigate to="/backoffice/login" replace />} />
                </Routes>
              </TagProvider>
            </IvaProvider>
          </RecintoSalaProvider>
        </RecintoProvider>
      </RefProvider>
    </AuthProvider>
  );
};

export default BackofficeApp;
