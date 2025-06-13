import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
import RequireAuth from './backoffice/components/RequireAuth';
import Footer from './store/components/StoreFooter';
import Header from './store/components/StoreHeader';
import Profile from './store/pages/profile'; // Updated to match file name

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
import CompaniasPage from './backoffice/pages/CompaniasPage';
import FormatoEntrada from './backoffice/pages/FormatoEntrada';
import Galeria from './backoffice/pages/Galeria';
import Correo from './backoffice/pages/Correo';
import WebStudio from './backoffice/pages/WebStudio';
import WebColors from './backoffice/pages/WebColors';
import WebFooter from './backoffice/pages/WebFooter';
import Abonos from './backoffice/pages/Abonos';

// Store Pages
import EventsVenue from './store/pages/EventsVenue';
import Event from './store/pages/Event';
import BuyEvent from './store/pages/BuyEvent';
import SelectSeats from './store/pages/SelectSeats';
import LoginRegister from './store/pages/LoginRegister';
import Cart from './store/pages/Cart';
import Pay from './store/pages/Pay';
import PaymentSuccess from './store/pages/PaymentSuccess';
import ThankYouPage from './store/pages/ThankYouPage';
import SeatingDemoPage from './pages/SeatingDemoPage';
import ForgotPassword from './store/pages/ForgotPassword';
import ResetPassword from './store/pages/ResetPassword';
import FaqPage from './store/pages/FaqPage';

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
    location.pathname === '/payment-success';
  const showFooter = location.pathname.startsWith('/store');

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
                    element={
                      <RequireAuth>
                        <Dashboard sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />
                      </RequireAuth>
                    }
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
                    <Route path="galeria" element={<Galeria />} />
                    <Route path="correo" element={<Correo />} />
                    <Route path="web-studio" element={<WebStudio setSidebarCollapsed={setSidebarCollapsed} />} />
                    <Route path="colores-web" element={<WebColors />} />
                    <Route path="pie-pagina" element={<WebFooter />} />
                  </Route>

                  <Route path="/store/:venueId?" element={<EventsVenue />} />
                  <Route path="/store/event/:eventId" element={<Event />} />
                  <Route path="/store/event" element={<Navigate to="/store/login-register" replace />} />
                  <Route path="/store/select-seats/:salaId" element={<SelectSeats />} />
                  <Route path="/store/buy-event/:id" element={<BuyEvent />} />
                  <Route path="/store/select-seats/:salaId/:funcionId" element={<SelectSeats />} />
                  <Route path="/store/login-register" element={<LoginRegister />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password/:token" element={<ResetPassword />} />
                  <Route path="/store/cart" element={<Cart />} />
                  {/* Update the pay route to include RequireAuth and match the store path pattern */}
                  <Route 
                    path="/store/pay" 
                    element={
                      <RequireAuth>
                        <Pay />
                      </RequireAuth>
                    } 
                  />
                  <Route path="/payment-success" element={<PaymentSuccess />} />
                  <Route path="/store/thank-you" element={<ThankYouPage />} />
                  <Route path="/companias" element={<CompaniasPage />} />
                  <Route path="/store/seating-demo" element={<SeatingDemoPage />} />
                  <Route path="/store/faq" element={<FaqPage />} />
                  <Route path="/store/perfil" element={<RequireAuth><Profile userData={user} onUpdateProfile={handleUpdateProfile} /></RequireAuth>} />

                  <Route path="/dashboard/formato-entrada" element={<FormatoEntrada />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
                {showFooter && <Footer />}
                <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
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
