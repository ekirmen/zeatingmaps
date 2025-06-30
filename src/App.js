import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { Toaster } from 'react-hot-toast';
import 'react-toastify/dist/ReactToastify.css';
import { NotificationContainer } from 'react-notifications';
import 'react-notifications/lib/notifications.css';

// Context Providers
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RefProvider } from './contexts/RefContext';
import { RecintoProvider } from './backoffice/contexts/RecintoContext';
import { RecintoSalaProvider } from './backoffice/contexts/RecintoSalaContext';
import { IvaProvider } from './backoffice/contexts/IvaContext';
import { TagProvider } from './backoffice/contexts/TagContext';
import { CartProvider } from './contexts/CartContext';
import CartTimer from './store/components/CartTimer';

// Components
import BasicFooter from './components/BasicFooter';
import Header from './store/components/StoreHeader';
import Profile from './store/pages/profile';

// Backoffice Pages
import Login from './backoffice/pages/Login';
import Dashboard from './backoffice/pages/Dashboard';
import Actividad from './backoffice/pages/Actividad';
import Recinto from './backoffice/pages/Recinto';
import Usuarios from './backoffice/pages/Usuarios';
import Referidos from './backoffice/pages/Referidos';
import Plano from './backoffice/pages/Plano';
import Evento from './backoffice/pages/Evento';
import Entrada from './backoffice/pages/Entrada';
import CrearMapa from './backoffice/pages/CrearMapaPage';
import PlantillaPrecios from './backoffice/pages/PlantillaPrecios';
import Descuentos from './backoffice/pages/Descuentos';
import Funciones from './backoffice/pages/Funciones';
import Boleteria from './backoffice/pages/Boleteria';
import CreateIva from './backoffice/pages/CreateIva';
import FormatoEntrada from './backoffice/pages/FormatoEntrada';
import Galeria from './backoffice/pages/Galeria';
import Tags from './backoffice/pages/Tags';
import Correo from './backoffice/pages/Correo';
import WebStudio from './backoffice/pages/WebStudio';
import WebColors from './backoffice/pages/WebColors';
import WebFooter from './backoffice/pages/WebFooter';
import WebHeader from './backoffice/pages/WebHeader';
import Abonos from './backoffice/pages/Abonos';

// Store Pages
import EventsVenue from './store/pages/EventsVenue';
import Event from './store/pages/Event';
import EventInfo from './store/pages/EventInfo';
import EventMap from './store/pages/EventMap';
import BuyEvent from './store/pages/BuyEvent';
import SelectSeats from './store/pages/SelectSeats';
import Cart from './store/pages/Cart';
import Pay from './store/pages/Pay';
import PaymentSuccess from './store/pages/PaymentSuccess';
import ThankYouPage from './store/pages/ThankYouPage';
import ForgotPassword from './store/pages/ForgotPassword';
import ResetPassword from './store/pages/ResetPassword';
import StoreLogin from './store/pages/Login';
import Register from './store/pages/Register';
import FaqPage from './store/pages/FaqPage';
import EventSearchMap from './store/pages/EventSearchMap';

import NotFoundPage from './store/pages/NotFoundPage';

const App = () => {
  const location = useLocation();
  const { user, login, logout, updateProfile } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('refParam', ref);
    }
  }, [location.search]);

  const handleLogin = async (credentials) => {
    try {
      await login(credentials);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleUpdateProfile = async (userData) => {
    try {
      await updateProfile(userData);
    } catch (error) {
      console.error('Profile update error:', error);
    }
  };

  const showHeader =
    location.pathname.startsWith('/store') ||
    location.pathname === '/payment-success' ||
    location.pathname === '/404';
  const showFooter =
    location.pathname.startsWith('/store') ||
    location.pathname === '/404';

  return (
    <CartProvider>
      <AuthProvider>
        <RefProvider>
          <RecintoProvider>
            <RecintoSalaProvider>
              <IvaProvider>
                <TagProvider>
                  <div className="min-h-screen flex flex-col">
                    {showHeader && (
                      <Header onLogin={handleLogin} onLogout={handleLogout} />
                    )}
                    <div className="flex-grow">
                      <Routes>
                        <Route path="/" element={<Login onLogin={handleLogin} />} />
                        <Route path="/backoffice" element={<Navigate to="/dashboard" replace />} />

                        <Route
                          path="/dashboard"
                          element={<Dashboard sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />}
                        >
                          <Route path="actividad" element={<Actividad />} />
                          <Route path="recinto" element={<Recinto />} />
                          <Route path="usuarios" element={<Usuarios />} />
                          <Route path="referidos" element={<Referidos />} />
                          <Route path="plano" element={<Plano />} />
                          <Route path="evento" element={<Evento />} />
                          <Route path="entrada" element={<Entrada />} />
                          <Route path="crear-mapa/:salaId" element={<CrearMapa />} />
                          <Route path="crear-iva" element={<CreateIva />} />
                          <Route path="abonos" element={<Abonos />} />
                          <Route path="plantillaPrecios" element={<PlantillaPrecios />} />
                          <Route path="descuentos" element={<Descuentos />} />
                          <Route path="funciones" element={<Funciones />} />
                          <Route path="Boleteria" element={<Boleteria setSidebarCollapsed={setSidebarCollapsed} />} />
                          <Route path="tags" element={<Tags />} />
                          <Route path="galeria" element={<Galeria />} />
                          <Route path="correo" element={<Correo />} />
                          <Route path="web-studio" element={<WebStudio setSidebarCollapsed={setSidebarCollapsed} />} />
                          <Route path="colores-web" element={<WebColors />} />
                          <Route path="sitio-web" element={<WebFooter />} />
                          <Route path="cabecera" element={<WebHeader />} />
                          <Route path="formato-entrada" element={<FormatoEntrada />} />
                        </Route>

                        <Route path="/store/tag/:tagSlug?" element={<EventsVenue groupByTags />} />
                        <Route path="/store" element={<EventsVenue groupByTags={false} />} />
                        {/* Split event information and seat map into separate pages */}
                        <Route path="/store/event/:eventId" element={<EventInfo />} />
                        <Route path="/store/event/:eventId/map" element={<EventMap />} />
                        {/* Legacy path using the combined Event page */}
                        <Route path="/store/event/:eventId/full" element={<Event />} />
                        <Route path="/store/event" element={<Navigate to="/store" replace />} />
                        <Route path="/store/select-seats/:salaId" element={<SelectSeats />} />
                        <Route path="/store/buy-event/:id" element={<BuyEvent />} />
                        <Route path="/store/select-seats/:salaId/:funcionId" element={<SelectSeats />} />
                          <Route path="/store/login" element={<StoreLogin />} />
                          <Route path="/store/register" element={<Register />} />
                          <Route path="/store/forgot-password" element={<ForgotPassword />} />
                          <Route path="/store/reset-password" element={<ResetPassword />} />
                        <Route path="/store/cart" element={<Cart />} />
                        <Route path="/store/pay" element={<Pay />} />
                        <Route path="/payment-success" element={<PaymentSuccess />} />
                        
                        <Route path="/store/faq" element={<FaqPage />} />
                        
                        <Route path="/store/search-map" element={<EventSearchMap />} />
                        <Route path="/store/perfil" element={<Profile userData={user} onUpdateProfile={handleUpdateProfile} />} />

                        <Route path="/404" element={<NotFoundPage />} />
                        <Route path="*" element={<Navigate to="/404" replace />} />
                      </Routes>
                    </div>
                    {showFooter && <BasicFooter />}
                    <Toaster position="top-right" />
                    <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
                    <NotificationContainer />
                    <CartTimer />
                  </div>
                </TagProvider>
              </IvaProvider>
            </RecintoSalaProvider>
          </RecintoProvider>
        </RefProvider>
      </AuthProvider>
    </CartProvider>
  );
};

export default App;
