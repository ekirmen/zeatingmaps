import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { RefProvider } from '../contexts/RefContext'; // 👈 IMPORTANTE
import Header from './components/StoreHeader';
import BasicFooter from '../components/BasicFooter';
import GlobalCartTimer from './components/GlobalCartTimer';
import ProtectedRoute from './components/ProtectedRoute';
import NotFoundPage from '../components/NotFoundPage';

import Event from './pages/Event';
// Importar con manejo de errores
let EventsVenue;
try {
  EventsVenue = require('./pages/EventsVenue').default;
  console.log('✅ [StoreApp] EventsVenue importado correctamente');
} catch (error) {
  console.error('❌ [StoreApp] Error importando EventsVenue:', error);
  EventsVenue = () => <div>Error cargando página</div>;
}
import EventInfo from './pages/EventInfo';

import BuyEvent from './pages/BuyEvent';
import SelectSeats from './pages/SelectSeats';
import CartPage from './pages/Cart';
import Pay from './pages/Pay';
import FaqPage from './pages/FaqPage';
import SeatSelectionPage from './pages/SeatSelectionPage';
import StoreLogin from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import EventSearchMap from './pages/EventSearchMap';
import PaymentSuccess from './pages/PaymentSuccess';
import Profile from './pages/profile';
import EventosPage from './pages/EventosPage';
import ThankYouPage from './pages/ThankYouPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookiesPolicy from './pages/CookiesPolicy';
import LegalTerms from './pages/LegalTerms';
import { useAuth } from '../contexts/AuthContext'; // para perfil

const StoreApp = () => {
  const location = useLocation();
  const { user, updateProfile } = useAuth();
  
  console.log('🚀 [StoreApp] Renderizando store...');
  console.log('🔍 [StoreApp] Location:', location.pathname);
  console.log('🔍 [StoreApp] User:', user);

  const showHeader =
    location.pathname.startsWith('/store') ||
    location.pathname.startsWith('/payment-success');
  const showFooter = location.pathname.startsWith('/store');

  return (
    <RefProvider> {/* 👈 ENVOLVER AQUÍ */}
        <div className="min-h-screen flex flex-col">
          {showHeader && <Header />}
          <div className="flex-grow">
            <Routes>
              <Route path="/store" element={
                (() => {
                  console.log('🚀 [StoreApp] Renderizando ruta /store con EventsVenue');
                  return <EventsVenue groupByTags={false} />;
                })()
              } />
              <Route path="/store/tag/:tagSlug?" element={
                (() => {
                  console.log('🚀 [StoreApp] Renderizando ruta /store/tag con EventsVenue');
                  return <EventsVenue groupByTags />;
                })()
              } />
              <Route path="/store/eventos/:eventSlug" element={<EventosPage />} />
              <Route path="/store/event/:eventId" element={<EventInfo />} />

              <Route path="/store/event/:eventId/full" element={<Event />} />
              <Route path="/store/buy-event/:id" element={<BuyEvent />} />
              <Route path="/store/select-seats/:salaId" element={<SelectSeats />} />
              <Route path="/store/select-seats/:salaId/:funcionId" element={<SelectSeats />} />
              <Route path="/store/seat-selection/:funcionId" element={<SeatSelectionPage />} />
              <Route path="/store/cart" element={<CartPage />} />
              <Route path="/store/payment" element={
                <ProtectedRoute redirectTo="/store/login">
                  <Pay />
                </ProtectedRoute>
              } />
              <Route path="/store/login" element={<StoreLogin />} />
              <Route path="/store/register" element={<Register />} />
              <Route path="/store/forgot-password" element={<ForgotPassword />} />
              <Route path="/store/reset-password" element={<ResetPassword />} />
              <Route path="/store/search-map" element={<EventSearchMap />} />
              <Route path="/store/faq" element={<FaqPage />} />
              <Route path="/store/perfil" element={<Profile userData={user} onUpdateProfile={updateProfile} />} />
              <Route path="/store/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/store/cookies-policy" element={<CookiesPolicy />} />
              <Route path="/store/legal-terms" element={<LegalTerms />} />
              <Route path="/payment-success/:locator?" element={<PaymentSuccess />} />
              <Route path="/thank-you" element={<ThankYouPage />} />
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to="/store" replace />} />
            </Routes>
          </div>
          {showFooter && <BasicFooter />}
          <GlobalCartTimer />
        </div>
    </RefProvider>
  );
};

export default StoreApp;
