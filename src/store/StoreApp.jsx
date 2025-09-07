import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { RefProvider } from '../contexts/RefContext'; // 👈 IMPORTANTE
import Header from './components/StoreHeader';
import BasicFooter from '../components/BasicFooter';
import GlobalCartTimer from './components/GlobalCartTimer';
import ProtectedRoute from './components/ProtectedRoute';
import NotFoundPage from '../components/NotFoundPage';
import './styles/store-design.css'; // Modern design system
import Event from './pages/Event';
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
import Profile from './pages/profile.js';
import EventosPage from './pages/EventosPage';
import ThankYouPage from './pages/ThankYouPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookiesPolicy from './pages/CookiesPolicy';
import LegalTerms from './pages/LegalTerms';
import CmsPage from './pages/CmsPage';
import EventsVenue from './pages/EventsVenue';
import { useAuth } from '../contexts/AuthContext'; // para perfil
import { useCartStore } from './cartStore';

const StoreApp = () => {
  const location = useLocation();
  const { user, updateProfile } = useAuth();
  const restoreTimer = useCartStore((s) => s.restoreTimer);
  
  console.log('🚀 [StoreApp] Renderizando store...');
  console.log('🔍 [StoreApp] Location:', location.pathname);
  console.log('🔍 [StoreApp] User:', user);

  // Restaurar timer del carrito tras recarga
  React.useEffect(() => {
    restoreTimer();
  }, [restoreTimer]);

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
                {/* Render CMS home page by default */}
                <Route index element={<CmsPage slug="store" />} />
              <Route path="tag/:tagSlug?" element={<EventsVenue groupByTags />} />
              <Route path="eventos/:eventSlug" element={<EventInfo />} />
              <Route path="eventos/:eventSlug/map" element={<EventosPage forceShowMap />} />
              <Route path="event/:eventId" element={<EventInfo />} />

              <Route path="event/:eventId/full" element={<Event />} />
              <Route path="buy-event/:id" element={<BuyEvent />} />
              <Route path="select-seats/:salaId" element={<SelectSeats />} />
              <Route path="select-seats/:salaId/:funcionId" element={<SelectSeats />} />
              <Route path="seat-selection/:funcionId" element={<SeatSelectionPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="payment" element={<Pay />} />
              <Route path="login" element={<StoreLogin />} />
              <Route path="register" element={<Register />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="search-map" element={<EventSearchMap />} />
              <Route path="faq" element={<FaqPage />} />
              <Route path="perfil" element={<Profile userData={user} onUpdateProfile={updateProfile} />} />
              <Route path="privacy-policy" element={<PrivacyPolicy />} />
              <Route path="cookies-policy" element={<CookiesPolicy />} />
              <Route path="legal-terms" element={<LegalTerms />} />
              <Route path=":pageSlug" element={<CmsPage />} />
              <Route path="payment-success/:locator?" element={<PaymentSuccess />} />
              <Route path="thank-you" element={<ThankYouPage />} />
              <Route path="404" element={<NotFoundPage />} />
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
